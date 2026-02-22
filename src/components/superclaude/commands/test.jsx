# Write Tests

## Role: QA Engineer

Write unit or integration tests for the provided code.

**File to Test**: `$ARGUMENTS`

## Testing Plan

1.  **Analyze the Code**: I will first read the code in `$ARGUMENTS` to understand its functionality, inputs, and outputs.

2.  **Identify Test Cases**: I will identify the key scenarios to test, including:
    -   The "happy path" (expected inputs and outputs).
    -   Edge cases (e.g., empty inputs, nulls, zeros, large numbers).
    -   Error conditions (how the code handles invalid inputs).

3.  **Choose a Framework**: I will use a standard testing framework like Jest, Vitest, or Pytest, depending on the language. I will state which framework I'm using.

4.  **Write the Tests**: I will provide the complete code for the test file.
    -   Tests will be structured using `describe` and `it` (or equivalent) blocks.
    -   Assertions will be clear and specific (e.g., `expect(result).toBe(true);`).
    -   I will mock any external dependencies.

## Example Output Structure:
```javascript
// filename.test.js
import { functionToTest } from './filename';

describe('functionToTest', () => {
  it('should do this when given this input', () => {
    // test setup
    const input = '...';
    const expectedOutput = '...';

    // execution
    const result = functionToTest(input);

    // assertion
    expect(result).toEqual(expectedOutput);
  });

  // ... more test cases
});
```

---

*Your goal is to ensure the code is robust and reliable. Think critically about what could go wrong. The generated tests should be runnable and provide meaningful coverage.*