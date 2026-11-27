# GitHub access and publication handoff

Target: [`yijay-k/ontology-research`](https://github.com/yijay-k/ontology-research).

The connector authenticated as `yijay-k` and could read repository metadata and the existing `main` commit. Although repository metadata reported push/admin permission, writes to both Git Data (`create_blob`) and Contents (`create_file`) returned `403 Resource not accessible by integration`. No repository mutation succeeded.

## Fix

- Reauthorize the GitHub integration in ChatGPT Settings → Connectors/Apps → GitHub.
- In GitHub Settings → Applications → Installed GitHub Apps, configure the connected app to include `yijay-k/ontology-research` in repository access.
- Ensure the integration has Contents read/write permission. Metadata read is also required.
- Reconnect/retry in ChatGPT. Do not share passwords, personal access tokens or private keys in chat.

## Resume sequence

The complete 90-file pack is prepared in the companion ZIP. Once write access works, inspect the current default-branch tree again, preserve existing files, add the research pack, commit, then fetch the commit/tree to verify every file. Until that verification is complete, the repo must be described as **not yet published**.