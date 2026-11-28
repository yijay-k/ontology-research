/**
 * Links resolved from a foreign key property, as Foundry resolves them.
 *
 * Every link type declares `foreignKeyPropertyApiName`: the property on the
 * source object that holds the target's primary key. A dataset-backed type
 * (a drafted `Invoice.customerID`) carries its links that way and has no link
 * rows at all, so traversal that reads only stored rows finds nothing.
 *
 * This wraps a link store so that, for a cardinality-ONE link type whose source
 * object has that property set, the link is the object the value names; with
 * the property absent or empty the stored rows answer, as before. Writes pass
 * through untouched.
 */
import type { LinkTypeDefinition } from "@openfoundry/ontology-schema";
import type { LinkTypeSource } from "../sync/http-sources.js";
import type { LinkReadWriteStore, StoredLink } from "./link-store.js";
import type { ObjectReadWriteStore } from "./object-store.js";

// ponytail: definitions cached for a few seconds, because a metric over 70k
// objects asks once per object; an edited link type is seen within that window.
const TTL_MS = 5_000;

export function withForeignKeyLinks(
  links: LinkReadWriteStore,
  objects: ObjectReadWriteStore,
  linkTypes: LinkTypeSource,
): LinkReadWriteStore {
  const cache = new Map<string, { at: number; def: Promise<LinkTypeDefinition | undefined> }>();
  const definition = (ontologyRid: string, linkType: string) => {
    const key = `${ontologyRid}\u0000${linkType}`;
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < TTL_MS) return hit.def;
    // An unreachable ontology service means no foreign key, not a failed read.
    const def = linkTypes.getLinkType(ontologyRid, linkType).catch(() => undefined);
    cache.set(key, { at: Date.now(), def });
    return def;
  };

  /** The target the source's foreign key names, or undefined to fall back to rows. */
  const foreignKeyTarget = async (ontologyRid: string, objectType: string, primaryKey: string, linkType: string) => {
    const def = await definition(ontologyRid, linkType);
    if (!def || def.cardinality !== "ONE" || def.objectTypeApiName !== objectType || !def.foreignKeyPropertyApiName) return undefined;
    let value: unknown;
    try {
      value = (await objects.getObject(ontologyRid, objectType, primaryKey)).properties[def.foreignKeyPropertyApiName];
    } catch {
      return undefined;
    }
    if (value === undefined || value === null || value === "") return undefined;
    return { targetObjectType: def.linkedObjectTypeApiName, targetPrimaryKey: String(value) };
  };

  const overrides: Partial<LinkReadWriteStore> = {
    async getLinkedObjects(ontologyRid: string, objectType: string, primaryKey: string, linkType: string) {
      const target = await foreignKeyTarget(ontologyRid, objectType, primaryKey, linkType);
      return target ? [target] : links.getLinkedObjects(ontologyRid, objectType, primaryKey, linkType);
    },
    async getAllLinks(ontologyRid: string, objectType: string, primaryKey: string, linkType: string): Promise<StoredLink[]> {
      const target = await foreignKeyTarget(ontologyRid, objectType, primaryKey, linkType);
      if (!target) return links.getAllLinks(ontologyRid, objectType, primaryKey, linkType);
      return [{ sourceObjectType: objectType, sourcePrimaryKey: primaryKey, linkType, ...target, createdAt: "" }];
    },
  };
  // Everything else is the wrapped store's own method, bound to it.
  return new Proxy(links, {
    get(target, prop, receiver) {
      if (prop in overrides) return overrides[prop as keyof LinkReadWriteStore];
      const value = Reflect.get(target, prop, receiver);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
}
