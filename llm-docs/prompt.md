# Taskwarrior MCP Server Build Prompt

Use this prompt with `kiro-cli` to build and verify a minimal Taskwarrior MCP server.

Meta: You're using Kiro to build an MCP server for Kiro. 🤖

---

## Setup

```bash
# Create project directory
mkdir taskwarrior-mcp && cd taskwarrior-mcp

# Initialize
npm init -y
git init

# Start Kiro CLI in the project
kiro-cli
```

---

## The Prompt

Paste this into your `kiro-cli` session:

```
Build a minimal, production-quality MCP server for Taskwarrior in TypeScript.

## Requirements

### Core Tools (implement these 5 only)
1. `list_tasks` - List tasks with optional filter (e.g., "due:today", "+work", "project:hoth")
2. `add_task` - Add a new task with description, optional due date, priority, project, tags
3. `complete_task` - Mark task done by ID
4. `modify_task` - Change task properties (due, priority, project) by ID
5. `get_task` - Get single task details by ID

### Technical Requirements
- Use @modelcontextprotocol/sdk (latest)
- Shell out to `task` CLI (don't reinvent parsing)
- Use `task export` for JSON output (it's the stable API)
- Handle errors gracefully (task not found, invalid filter, etc.)
- TypeScript strict mode
- Minimal dependencies

### Project Structure
```
taskwarrior-mcp/
├── src/
│   ├── index.ts          # MCP server entry point
│   ├── taskwarrior.ts    # Wrapper around task CLI
│   └── types.ts          # Task types
├── tests/
│   └── taskwarrior.test.ts
├── package.json
├── tsconfig.json
└── README.md
```

### Implementation Notes
- `task export` returns JSON array of tasks
- `task add` returns the new task ID on stdout
- `task <id> done` completes a task
- `task <id> modify key:value` modifies
- Filter syntax: `task <filter> export` (e.g., `task due:today export`)

## Verification Loop

After building, run this verification sequence:

1. **Build**: `npm run build` - should compile without errors
2. **Test**: `npm test` - all tests should pass
3. **Manual CLI test**:
   ```bash
   # Start server in one terminal
   npm start

   # In another terminal, test with MCP inspector or direct stdin/stdout
   echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
   ```

4. **Integration test** (create a test script):
   ```bash
   # Add a test task
   task add "MCP Test Task" project:test due:tomorrow

   # Verify list_tasks returns it
   # Verify complete_task works
   # Clean up: task project:test delete
   ```

5. **kiro-cli integration test**:
   - Add to ~/.kiro/settings/mcp.json
   - Restart kiro-cli, run `/mcp` to verify server loaded
   - Ask: "list my taskwarrior tasks due today"
   - Ask: "add a task to test MCP integration"
   - Verify task appears in `task list`

## Tests to Include

```typescript
// tests/taskwarrior.test.ts
describe('TaskwarriorWrapper', () => {
  // Use a separate data location for tests
  // Set TASKDATA env var to temp directory

  test('listTasks returns array', async () => {})
  test('listTasks with filter works', async () => {})
  test('addTask returns task id', async () => {})
  test('completeTask marks done', async () => {})
  test('modifyTask changes properties', async () => {})
  test('getTask returns single task', async () => {})
  test('handles invalid task id gracefully', async () => {})
  test('handles empty task list', async () => {})
});
```

## Kiro MCP Config

After build, add to `~/.kiro/settings/mcp.json` (user-level, works for both kiro-cli and Kiro IDE):

```json
{
  "mcpServers": {
    "taskwarrior": {
      "command": "node",
      "args": ["/absolute/path/to/taskwarrior-mcp/dist/index.js"],
      "disabled": false,
      "autoApprove": ["list_tasks", "get_task"]
    }
  }
}
```

Then restart kiro-cli and verify with `/mcp` command.

## Success Criteria

1. `npm run build` compiles cleanly
2. `npm test` passes all tests
3. MCP inspector shows 5 tools available
4. kiro-cli `/mcp` shows the server loaded
5. kiro-cli can list, add, and complete tasks via natural language
6. Code is <300 lines total, readable, no magic

Build this step by step. After each file, verify it compiles. After all files, run the full verification loop. Fix any issues before declaring done.
```

---

## Usage with kiro-cli

```bash
# Navigate to where you want the project
mkdir -p ~/projects/taskwarrior-mcp && cd ~/projects/taskwarrior-mcp

# Initialize project
npm init -y
git init

# Start kiro-cli interactive session
kiro-cli

# Paste the prompt above, or use:
kiro-cli --prompt "$(cat path/to/taskwarrior-mcp-prompt.md)"
```

### Iterative Development Flow

```bash
# In kiro-cli, you can iterate:
> Build the taskwarrior.ts wrapper first, then pause

# Review the code, then continue:
> Now build the MCP server entry point

# Run tests as you go:
> Run npm test and fix any failures

# Check MCP tools are exposed:
> Verify the server responds to tools/list
```

### Using /mcp Command

Once you have a working build, test it within the same kiro-cli session:

```bash
# In kiro-cli
/mcp  # Shows currently loaded MCP servers

# Add your new server to test (edit ~/.kiro/settings/mcp.json first)
# Then restart kiro-cli and check /mcp again
```

---

## Alternative: Autonomous Mode

For a more hands-off build:

```bash
kiro-cli --prompt "Build a Taskwarrior MCP server following this spec exactly: [paste spec above]. Create all files, run tests, fix issues, and don't stop until npm test passes and you've verified the MCP server responds to tools/list."
```

---

## Post-Build Checklist

- [ ] `npm run build` succeeds
- [ ] `npm test` passes
- [ ] Added to `~/.kiro/settings/mcp.json`
- [ ] `/mcp` in kiro-cli shows taskwarrior server
- [ ] "List my tasks" works in kiro-cli
- [ ] "Add a task called X" works in kiro-cli
- [ ] Task appears in `task list` after Kiro adds it
- [ ] 🎉 You used Kiro to build an MCP server for Kiro
