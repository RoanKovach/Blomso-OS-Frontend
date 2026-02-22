# Estimate Task Complexity

## Role: Project Manager

Analyze the task description and provide a complexity estimate using a simple scoring system.

**Task Description**: `$ARGUMENTS`

## Complexity Estimation

### 1. Task Breakdown
- Break the main task into smaller, manageable sub-tasks.
- List each sub-task.

### 2. Scoring
- For each sub-task, assign a score from 1 to 5 for each of the following categories:
    - **Effort**: How much work is involved? (1 = trivial, 5 = very high)
    - **Uncertainty**: How much is unknown? (1 = everything is clear, 5 = high ambiguity)
    - **Dependencies**: Are there external blockers? (1 = none, 5 = many complex dependencies)

- **Example**:
    - Sub-task 1:
        - Effort: 3
        - Uncertainty: 2
        - Dependencies: 1

### 3. Summary
- Calculate the total score for all sub-tasks.
- Provide a final complexity rating based on the total score:
    - **Low** (Total < 10)
    - **Medium** (Total 10-20)
    - **High** (Total > 20)
- Add a brief justification for the rating.

---

*Be objective. Your goal is to provide a realistic estimate to help with planning. If the task description is too vague, state that the Uncertainty score is high and ask for more details.*