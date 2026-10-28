# Spider Engine MCP server

Tools for any MCP client (Claude Code, Claude Desktop, agents) to drive the Spider Engine game.

## Run

```bash
cd mcp-server
npm install
node server.js            # stdio (Claude Code / Desktop)
```

## Wire up

**Claude Code** (`~/.claude.json` or project `.mcp.json`):

```json
{
  "mcpServers": {
    "spider-engine": {
      "command": "node",
      "args": ["C:/Users/vvvr8/Downloads/game engine/mcp-server/server.js"],
      "env": { "SPIDER_PROJECT_DIR": "C:/path/to/your/game/folder" }
    }
  }
}
```

**Claude Desktop** (`claude_desktop_config.json`): same block under `mcpServers`.

## How it works

- **Engine open** → tools POST to `http://127.0.0.1:9287/mcp`, executed live in the running viewport (`window.spiderEngine.*`), results returned.
- **Engine closed** → scene tools (`list_scene`, `spawn_object`, `move_object`, `set_visibility`) operate on `GameWorld.scene.json` in `SPIDER_PROJECT_DIR` (or cwd). Open the folder as a project later to see the changes.
- Time/play/score/ask need the live engine.

## Tools

`engine_status, list_scene, spawn_object, spawn_set, move_object, set_actor, remove_prop, set_visibility, set_time, play, get_score, ask_engine, scaffold_board_game`
