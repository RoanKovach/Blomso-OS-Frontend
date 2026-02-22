# Agent Modes

Agent Modes allow you to influence the behavior and output style of SuperClaude on a per-command basis. You can select a mode using the `--mode` flag.

**Syntax**: `/sc:<command> [ARGUMENTS] --mode <mode_name>`

---

## Available Modes

### `default`
-   **Description**: The standard, balanced mode. Provides a good mix of detail, explanation, and code.
-   **When to use it**: For most everyday tasks. If you don't specify a mode, this is what you get.

### `concise`
-   **Description**: Provides minimal explanation and gets straight to the point. The output will be primarily code or the direct answer to a question.
-   **When to use it**: When you're in a hurry and you already know what you're doing. Good for simple, repetitive tasks.
-   **Example**: `/sc:implement a simple utility function --mode concise`

### `verbose`
-   **Description**: Provides detailed explanations, step-by-step reasoning, and explores alternative solutions. The "Chain of Thought" will be much more elaborate.
-   **When to use it**: When you're tackling a complex problem and want the agent to "think out loud." Also useful for learning or when you want to understand the "why" behind the code.
-   **Example**: `/sc:design a new microservice --mode verbose`

### `creative`
-   **Description**: Allows the agent to be more experimental and suggest novel approaches. The solutions might be less conventional but potentially more innovative.
-   **When to use it**: When you're stuck on a problem and looking for a different perspective. Good for brainstorming and design tasks.
-   **Example**: `/sc:improve this algorithm --mode creative`

### `strict`
-   **Description**: Forces the agent to adhere as closely as possible to the provided context and patterns. It will be less likely to introduce new patterns or make assumptions.
-   **When to use it**: When you need to maintain strict consistency with an existing, complex codebase.
-   **Example**: `/sc:cleanup a legacy file --mode strict --pattern ./similar-legacy-file.js`

---

## Setting a Default Mode

You can set a default mode for your project in the `components/superclaude/settings.local.json` file:

```json
{
  "allow": ["run_code", "shell"],
  "default_mode": "concise"
}
```

This setting will be used for all commands unless overridden by the `--mode` flag.