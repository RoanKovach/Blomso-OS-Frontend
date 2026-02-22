# Orchestrator

The Orchestrator is the high-level engine responsible for managing complex workflows that involve multiple commands. While the Master Control Program (MCP) handles a single command, the Orchestrator sequences multiple MCP executions to achieve a larger goal.

## How It Works

The Orchestrator is invoked by the `/sc:workflow` command.

1.  **Input**: It takes a high-level scenario as input (e.g., "Add a new feature, test it, and document it").
2.  **Planning**: It breaks down the scenario into a logical sequence of individual `/sc` commands. This plan is the "workflow."
3.  **Execution**: It presents this workflow to the user. The user can then execute each command in the sequence to complete the task.

In a future, more automated version, the Orchestrator might execute the entire chain of commands itself, pausing only for user confirmation at critical steps.

## Orchestrator vs. MCP

| | **Master Control Program (MCP)** | **Orchestrator** |
| :--- | :--- | :--- |
| **Scope** | Executes a **single** command. | Plans and sequences **multiple** commands. |
| **Invocation** | Invoked by any `/sc:<command>`. | Invoked specifically by `/sc:workflow`. |
| **Responsibility**| Command parsing, persona activation, context injection for one task. | High-level task decomposition and process planning. |
| **Analogy** | A **specialist** (e.g., a carpenter) who is an expert at one job. | A **general contractor** who coordinates all the specialists to build a house. |

## Example Workflow

**User Request**: `/sc:workflow I need to refactor our API service to improve performance.`

**Orchestrator's Plan (Output)**:

1.  **Analyze the current API service to identify bottlenecks.**
    ```
    /sc:analyze ./src/services/api.js --mode verbose
    ```

2.  **Based on the analysis, suggest specific improvements.**
    ```
    /sc:improve ./src/services/api.js
    ```

3.  **Once the improvement plan is approved, implement the changes.**
    ```
    /sc:implement Refactor the API service according to the approved plan. --file ./src/services/api.js
    ```

4.  **Ensure existing tests still pass and add new tests for the changes.**
    ```
    /sc:test ./src/services/api.js
    ```

5.  **Update the documentation.**
    ```
    /sc:document ./src/services/api.js --output ./docs/api-service.md
    ```

The Orchestrator turns a vague, high-level goal into a concrete, actionable plan, leveraging the specialized skills of the various command agents.