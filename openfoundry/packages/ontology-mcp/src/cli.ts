#!/usr/bin/env node
/**
 * Run the read-only ontology MCP server over stdio.
 *
 *   OPENFOUNDRY_URL       gateway base URL (default http://localhost:8080)
 *   OPENFOUNDRY_TOKEN     bearer token; the tools see what this caller may see
 *   OPENFOUNDRY_ONTOLOGY  ontology apiName or RID to serve (optional)
 *   OPENFOUNDRY_MCP_INCLUDE_EXPERIMENTAL=true  also show EXPERIMENTAL definitions
 *   OPENFOUNDRY_MCP_ENABLE_ACTIONS=true        offer validate_action and apply_action
 */
import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";
import { httpOntologyApi } from "./api.js";
import { createOntologyMcpServer } from "./server.js";

const server = createOntologyMcpServer({
  api: httpOntologyApi(process.env.OPENFOUNDRY_URL || "http://localhost:8080", process.env.OPENFOUNDRY_TOKEN || undefined),
  ontology: process.env.OPENFOUNDRY_ONTOLOGY || undefined,
  includeExperimental: process.env.OPENFOUNDRY_MCP_INCLUDE_EXPERIMENTAL === "true",
  enableActions: process.env.OPENFOUNDRY_MCP_ENABLE_ACTIONS === "true",
});
await server.connect(new StdioServerTransport());
