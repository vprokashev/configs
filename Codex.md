`%USERPROFILE%\.jetbrains\acp.json`
```json
{
  "default_mcp_settings": {
    "use_idea_mcp": true,
    "use_custom_mcp": false
  },
  "agent_servers": {
    "Codex Custom Direct": {
      "command": "npx",
      "args": [
        "-y",
        "@agentclientprotocol/codex-acp@latest"
      ]
    }
  }
}
```

```shell
npm install -g @openai/codex@latest
npm install -g @agentclientprotocol/codex-acp@latest
```
