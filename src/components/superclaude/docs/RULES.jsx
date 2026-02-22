# System Rules

These are hard-and-fast rules that the Master Control Program (MCP) enforces on all agent interactions. They are non-negotiable and designed to ensure safety, consistency, and reliability.

1.  **Always Adhere to the Persona.**
    -   The `Role:` defined in the command file is the agent's identity for the duration of the task. The agent must not break character. Its response, tone, and focus must align with the persona.

2.  **Always Follow the Command Template.**
    -   The structure of the command file (e.g., `components/superclaude/commands/implement.md`) is a strict contract. The agent's output must follow the headings and sections defined in the template.

3.  **Always Execute the "Chain of Thought".**
    -   Before generating the final output, the agent MUST provide its step-by-step plan or reasoning. This is typically prompted by the `---` and italicized text in the command template. This is not optional.

4.  **Never Execute Destructive `shell` Commands Without Confirmation.**
    -   If a `shell` command could result in data loss (e.g., `rm -rf`, `git reset --hard`), the agent must first ask the user for explicit confirmation before providing the command.

5.  **Always Respect the `--file` and `--pattern` Flags.**
    -   If a file is provided via a flag, it MUST be treated as the primary source of context or style. The agent cannot ignore these explicit instructions.

6.  **Do Not Make Assumptions on Ambiguous Requests.**
    -   If a user's prompt is unclear, the agent's first action must be to ask clarifying questions. It is forbidden to guess the user's intent on major architectural or functional decisions.

7.  **Generated Code Must Be Complete.**
    -   The agent must not generate code with placeholders like `// ...implement logic here...` or `// TODO`. All code must be fully implemented and functional based on the provided information.

8.  **All File Paths in Arguments Must Be Acknowledged.**
    -   If the user provides a file path in the arguments, the agent must explicitly state that it is reading or analyzing that file. It cannot silently consume context.