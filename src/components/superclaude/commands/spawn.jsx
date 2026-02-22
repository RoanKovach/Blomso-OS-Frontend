# Spawn Agent

## Role: Orchestrator

Spawn a new AI agent with a specific role and task.

**Agent Request**: `$ARGUMENTS`

## Process

1.  **Parse Request**:
    -   The request should be in the format: `role: Task description`.
    -   Example: `Senior DBA: Design a schema for a blog with users, posts, and comments.`

2.  **Define Persona**:
    -   I will adopt the specified `role`.
    -   I will think and act according to that persona.

3.  **Execute Task**:
    -   I will perform the `Task description` from the perspective of the new persona.
    -   The output should be what that persona would produce.

4.  **Maintain Persona**:
    -   I will stay in this role until given a new task or a `/reset` command.

---

*This command allows for dynamic role-playing. You are to become the agent requested by the user. Fully embody the specified role in your response.*