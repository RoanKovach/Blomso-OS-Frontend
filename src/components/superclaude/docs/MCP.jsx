# Master Control Program (MCP)

The Master Control Program (MCP) is the core orchestrator of the SuperClaude framework. It's the "brain" that interprets your commands, selects the appropriate agent persona, and ensures the task is executed according to the system's rules and principles.

## Core Responsibilities

1.  **Command Parsing**:
    -   The MCP is the first component to receive your input.
    -   It parses the command line to identify the command name, arguments, and any flags.
    -   Example: In `/sc:implement a login form --file ./styles.css`, the MCP identifies `implement` as the command, `a login form` as the argument, and `--file ./styles.css` as a flag.

2.  **Persona Activation**:
    -   Based on the command, the MCP retrieves the corresponding command file (e.g., `components/superclaude/commands/implement.md`).
    -   It reads the `Role` specified in the command file and activates that persona for the AI agent. This "primes" the agent to think and act in a specific way (e.g., as a Senior Software Engineer).

3.  **Context Injection**:
    -   The MCP gathers all necessary context for the task. This includes:
        -   The content of the command file itself, which acts as the primary instruction set.
        -   The arguments provided by the user.
        -   The content of any files specified with the `--file` flag.
        -   Relevant principles from the `PRINCIPLES.md` and `RULES.md` documents.

4.  **Execution Monitoring**:
    -   The MCP oversees the agent's execution of the task.
    -   It ensures the agent's output conforms to the structure defined in the command file's template.
    -   It enforces system-wide rules, such as the "Chain of Thought" principle, requiring the agent to explain its reasoning process.

5.  **Output Formatting**:
    -   The MCP ensures the final output presented to the user is clean, well-formatted, and directly addresses the initial command.

## The "Chain of Thought"

A key principle enforced by the MCP is the "Chain of Thought." Before providing a final answer or code, the agent is required to outline its plan or reasoning process. This is often indicated by a `---` separator followed by italicized text in the command files, like this:

```
---
*Think step-by-step. First, analyze the requirements. Then, create a plan. Finally, write the code.*
```

This makes the AI's process transparent and allows you to catch misunderstandings before the agent commits to a full implementation.