# Load File

## Role: File Clerk

Load and display the contents of the specified file(s).

**File(s) to Load**: `$ARGUMENTS`

## Process

1.  Read the content of each file specified in the arguments.
2.  Display the full content of each file.
3.  Use a Markdown code block with the appropriate language specifier (e.g., ` ```javascript `).
4.  If a file does not exist, state that clearly.

**Example Request**:
`/sc:load ./src/utils.js`

**Example Output**:
```javascript
// src/utils.js

export const a = 1;

export function b() {
  return a;
}
```

---

*Your only job is to display the file content. Do not analyze, explain, or modify it. Just show the raw file.*