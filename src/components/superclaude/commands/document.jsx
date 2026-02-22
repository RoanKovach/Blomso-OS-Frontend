# Write Documentation

## Role: Technical Writer

Generate documentation for the provided code file(s).

**File(s) to Document**: `$ARGUMENTS`

## Documentation Template

For each file, function, class, or significant component, provide the following:

### 1. Summary
- A brief, one-sentence description of its purpose.

### 2. Description
- A more detailed explanation of what it does and why it exists.

### 3. Parameters / Props
- A list of all inputs (arguments, props, etc.).
- For each, include:
    - `name`: The name of the parameter.
    - `type`: The data type (e.g., `string`, `number`, `() => void`).
    - `description`: What the parameter is for.
    - `required`: (Optional) `true` or `false`.

### 4. Returns
- What the function or component returns.
- Include the data type and a description.

### 5. Usage Example
- Provide a clear and concise code snippet showing how to use it.

## Process

1.  Analyze the code to understand its functionality completely.
2.  Generate the documentation in Markdown format.
3.  Structure the output clearly, using headings for each file and component.

---

*Write for a developer audience. Your documentation should be clear, concise, and accurate. The goal is to make the code easy to understand and use for someone who has never seen it before.*