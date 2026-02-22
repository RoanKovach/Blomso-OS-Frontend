# SuperClaude Commands

SuperClaude functions through a set of predefined commands. Each command invokes a specific persona and follows a template to perform a task.

## Command Syntax

```
/sc:<command_name> [ARGUMENTS]
```

-   `/sc:`: The prefix that activates SuperClaude.
-   `<command_name>`: The name of the command to execute (e.g., `implement`, `test`).
-   `[ARGUMENTS]`: The input for the command, such as a file path or a feature description.

---

## Core Commands

-   **`analyze <file_path>`**
    -   **Persona**: Senior Staff Engineer
    -   **Action**: Performs a deep analysis of the specified code file and generates a detailed report on its structure, quality, and potential improvements.

-   **`build <prp_file_path>`**
    -   **Persona**: Senior Software Engineer
    -   **Action**: Implements a feature based on a detailed Project Requirements and Planning (PRP) document.

-   **`cleanup <file_path>`**
    -   **Persona**: Code Janitor
    -   **Action**: Refactors and cleans up the specified code file by removing unused code, improving formatting, and enhancing readability without changing functionality.

-   **`design <feature_description>`**
    -   **Persona**: Principal Architect
    -   **Action**: Designs a high-level system architecture for a new feature, including component diagrams, data models, and technology stack recommendations.

-   **`document <file_path>`**
    -   **Persona**: Technical Writer
    -   **Action**: Generates clear and comprehensive documentation for the specified code file, including descriptions, parameters, and usage examples.

-   **`estimate <task_description>`**
    -   **Persona**: Project Manager
    -   **Action**: Breaks down a task and provides a complexity estimate based on effort, uncertainty, and dependencies.

-   **`explain <file_path_or_code_snippet>`**
    -   **Persona**: Senior Developer
    -   **Action**: Explains what a piece of code does in a simple, easy-to-understand way.

-   **`git <git_command_description>`**
    -   **Persona**: Git Expert
    -   **Action**: Provides the correct Git command for a described action (e.g., "commit my work").

-   **`implement <feature_description>`**
    -   **Persona**: Senior Software Engineer
    -   **Action**: Writes the code to implement a feature based on a natural language description.

-   **`improve <file_path_or_code_snippet>`**
    -   **Persona**: Senior Code Reviewer
    -   **Action**: Reviews code and refactors it to improve performance, readability, and maintainability.

-   **`index <directory_path>`**
    -   **Persona**: Code Librarian
    -   **Action**: Creates an `index.js` or `index.ts` file that exports all modules from a given directory.

-   **`load <file_path>`**
    -   **Persona**: File Clerk
    -   **Action**: Displays the raw content of one or more files.

-   **`spawn <role: task>`**
    -   **Persona**: Orchestrator
    -   **Action**: Spawns a new agent with a specified role to perform a given task.

-   **`task <request_description>`**
    -   **Persona**: Taskmaster
    -   **Action**: Breaks down a high-level request into a detailed, step-by-step checklist of tasks.

-   **`test <file_path>`**
    -   **Persona**: QA Engineer
    -   **Action**: Writes unit or integration tests for a given code file.

-   **`troubleshoot <error_message_or_bug_description>`**
    -   **Persona**: Debugging Expert
    -   **Action**: Helps diagnose and fix an error or bug.

-   **`workflow <scenario_description>`**
    -   **Persona**: Process Engineer
    -   **Action**: Defines a sequence of `/sc` commands to accomplish a complex task.