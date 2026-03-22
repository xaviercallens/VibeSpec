---
name: DB Manager
description: Safely handles database scaffolding so the frontend has ephemeral state to interact with during testing.
---

# DB Manager
Agent instructions:
1. Use this tool heavily during integration testing (the RL phase) to construct dynamic table mockups without running destructive drops.
2. Submit desired schema parameters to the script and it handles all SQLite abstraction.
