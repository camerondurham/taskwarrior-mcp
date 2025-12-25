# Taskwarrior MCP Server

A minimal, production-quality MCP (Model Context Protocol) server that exposes Taskwarrior functionality to AI assistants like Claude and Kiro CLI.

## Features

- **5 Core Tools**:
  - `list_tasks` - List tasks with optional filters
  - `add_task` - Create new tasks with properties
  - `complete_task` - Mark tasks as done
  - `modify_task` - Update task properties
  - `get_task` - Get single task details

- **Production Ready**:
  - TypeScript with strict mode
  - Comprehensive test suite
  - Graceful error handling
  - Minimal dependencies

## Prerequisites

- Node.js 18+
- [Taskwarrior](https://taskwarrior.org/) installed and configured
- Existing Taskwarrior data (or empty setup)

## Installation

```bash
# Clone or download this repository
cd taskwarrior-mcp

# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test
```

## Usage with Kiro CLI

Add to your `~/.kiro/settings/mcp.json`:

```json
{
  "mcpServers": {
    "taskwarrior": {
      "command": "node",
      "args": ["/Users/camdurha/tools/taskwarrior-mcp/dist/index.js"],
      "disabled": false,
      "autoApprove": ["list_tasks", "get_task"]
    }
  }
}
```

**Important**: Replace `/Users/camdurha/tools/taskwarrior-mcp` with your actual absolute path.

Then restart Kiro CLI and verify:

```bash
kiro-cli
> /mcp
# Should show taskwarrior server loaded

> list my tasks due today
# Should return your tasks
```

## Usage with Claude Desktop

Add to your Claude Desktop MCP settings file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "taskwarrior": {
      "command": "node",
      "args": ["/absolute/path/to/taskwarrior-mcp/dist/index.js"]
    }
  }
}
```

Restart Claude Desktop and the tools will be available.

## Tool Examples

### List Tasks
```
Filter: "due:today"
Filter: "+work"
Filter: "project:hoth"
Filter: "priority:H"
```

### Add Task
```json
{
  "description": "Review pull request",
  "due": "tomorrow",
  "priority": "H",
  "project": "work",
  "tags": ["urgent", "review"]
}
```

### Complete Task
```json
{
  "id": 42
}
```

### Modify Task
```json
{
  "id": 42,
  "priority": "L",
  "due": "next week"
}
```

### Get Task
```json
{
  "id": 42
}
```

## Development

```bash
# Run tests
npm test

# Build
npm run build

# Test server manually
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Architecture

- `src/types.ts` - TypeScript interfaces for Task data
- `src/taskwarrior.ts` - Wrapper around `task` CLI using `task export`
- `src/index.ts` - MCP server implementation
- `tests/taskwarrior.test.ts` - Comprehensive test suite with isolated TASKDATA

## Limitations

- Completed tasks have `id: 0` in Taskwarrior export, so `get_task` uses position-based lookup for completed tasks
- Filters use Taskwarrior's native syntax (see `man task` for details)
- Some Taskwarrior words are reserved (e.g., "modified" is a date field)

## License

MIT

## Meta

Built with Kiro CLI to create an MCP server for Kiro CLI. 🤖
