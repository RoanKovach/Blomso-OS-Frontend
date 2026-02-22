# Command Flags

Flags are special modifiers you can add to a command to alter its behavior. They are typically used to provide extra context, specify constraints, or request a different output format.

## Syntax

Flags are appended to the end of a command, prefixed with a double hyphen (`--`).

```
/sc:<command> [ARGUMENTS] --<flag_name> [flag_value]
```

## Common Flags

-   **`--file <path>`** or **`-f <path>`**
    -   **Purpose**: Provides one or more files as context for the command. This is often more explicit than relying on the agent to find the relevant files.
    -   **Example**: `/sc:implement a user profile page --file ./src/api/user.js --file ./src/styles/profile.css`

-   **`--pattern <file_path>`**
    -   **Purpose**: Tells the agent to follow the coding patterns, style, and conventions found in the specified file.
    -   **Example**: `/sc:implement a new utility function --pattern ./src/utils/existing-util.js`

-   **`--output <file_path>`**
    -   **Purpose**: Specifies a file path where the output of the command should be saved.
    -   **Example**: `/sc:document ./src/Button.jsx --output ./docs/Button.md`

-   **`--mode <mode_name>`**
    -   **Purpose**: Sets the operational mode for the agent, which can affect its verbosity, creativity, or strictness. (See `MODES.md` for details).
    -   **Example**: `/sc:design a new feature --mode concise`

-   **`--json`**
    -   **Purpose**: Requests the output in JSON format instead of Markdown or code. Useful for programmatic consumption.
    -   **Example**: `/sc:analyze ./src/api.js --json`

-   **`--dry-run`**
    -   **Purpose**: Asks the agent to describe the changes it *would* make without actually generating the full code. Useful for verifying a plan.
    -   **Example**: `/sc:cleanup ./src/legacy-code.js --dry-run`

## Combining Flags

You can use multiple flags in a single command.

```
/sc:implement a settings page --file ./src/api/user.js --pattern ./src/components/Profile.jsx
```

This command tells the agent to implement a settings page, using `./src/api/user.js` for context and following the coding style of `./src/components/Profile.jsx`.