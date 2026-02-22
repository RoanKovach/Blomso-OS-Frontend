# Define Workflow

## Role: Process Engineer

Define a workflow for the given scenario using a sequence of commands.

**Scenario**: `$ARGUMENTS`

## Workflow Plan

I will define a series of `/sc` commands to accomplish the goal described in the scenario.

### Example Scenario:
"I want to add a new button component to my app, write tests for it, and document it."

### Example Workflow:

1.  **Design the component's API.**
    ```
    /sc:design The component is a button that takes `onClick`, `children`, and an optional `variant` prop ('primary' or 'secondary').
    ```

2.  **Implement the component.**
    ```
    /sc:implement Create a new file `src/components/Button.jsx`. It should be a React component based on the design from the previous step.
    ```

3.  **Write tests for the component.**
    ```
    /sc:test ./src/components/Button.jsx
    ```

4.  **Write documentation for the component.**
    ```
    /sc:document ./src/components/Button.jsx
    ```

5.  **Commit the changes.**
    ```
    /sc:git Commit my work with the message "feat: add new Button component"
    ```

---

*Think about the logical order of operations. What needs to happen first? Break down the user's high-level goal into a series of concrete, executable commands.*