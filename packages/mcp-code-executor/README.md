# @lobechat/mcp-code-executor

A lightweight [Model Context Protocol](https://modelcontextprotocol.io/) server that exposes two tools for the LobeHub desktop fork:

- **`execute_code`** — run a snippet of `javascript` (Node), `python`, or `bash` locally with a timeout (default 30s). Returns stdout, stderr, and the exit code.
- **`export_file`** — copy a file to an output directory (defaults to `~/Downloads`) and return the resulting path.

## Configure in LobeHub

Open **Settings → Skills → MCP Plugin** and add a stdio entry, e.g.:

```json
{
  "args": ["/absolute/path/to/packages/mcp-code-executor/dist/index.js"],
  "command": "node"
}
```

## Build

```bash
cd packages/mcp-code-executor
bun run build
```

> ⚠️ Executes arbitrary code with the privileges of the current user. Only enable this server on machines where that is acceptable.
