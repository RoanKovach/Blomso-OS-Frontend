# Agricultural Tools - Problem Response Plan (PRP)
Date: January 2025

## Problem Statement
The agricultural tools within the Tilly interface were not performing real, expert-level calculations. They relied on generic LLM prompts, leading to responses that lacked the precision, accuracy, and transparency required by agricultural professionals. This created a significant expectation mismatch for users.

## Root Cause Analysis
- **Over-reliance on LLM:** The initial implementation delegated all core logic to the Large Language Model, which is not suitable for precise, formulaic calculations.
- **Lack of a Calculation Engine:** There was no dedicated, deterministic module for performing standard agricultural math based on vetted, expert-approved formulas.
- **Insufficient Context in Prompts:** The LLM was not provided with hard, pre-calculated data, forcing it to guess or generalize.

## Solution Implemented
1.  **Created a Dedicated Calculation Engine (`components/utils/agriculturalCalculations.js`):**
    - A new utility module was built to house expert-vetted agricultural formulas.
    - It includes functions for Tri-State fertilizer recommendations, MRTN nitrogen rates, lime requirements, and soil test unit conversions.
    - This separates the deterministic, mathematical logic from the non-deterministic, language-based tasks of the LLM.

2.  **Re-architected Tilly's Workflow:**
    - The `AskTillyInterface` now functions as an orchestrator, not just a prompter.
    - When a user sends a message, Tilly first identifies the selected tools and attached data.
    - It then runs the necessary calculations using the new `agriculturalCalculations.js` engine.

3.  **Enhanced LLM Prompting with Hard Context:**
    - The precise results from the calculation engine are formatted into a JSON block and passed to the LLM as immutable context.
    - The LLM's new task is to act as an expert agronomist who **interprets these results** and **formats them into a professional report**, rather than performing the calculations itself.

4.  **Enabled Full Transparency:**
    - The UI has been updated to display the raw calculation results directly in the chat, giving users full visibility into the numbers used.
    - The LLM is now primed to answer "how did you calculate this?" by explaining the methodology of the underlying functions, whose names are passed in the context.

## Validation & Verification
- **Accuracy:** The output of the tools now directly matches results from university extension spreadsheets and calculators.
- **Transparency:** The system can now "show its work," building user trust.
- **Reliability:** Responses are consistent and repeatable for the same inputs.
- **User Experience:** The tool now meets the user's expectation of being a true decision-support tool, not just a generic chatbot.

## Status
**RESOLVED.** The core logic has been successfully migrated to a deterministic calculation engine, and the LLM has been repositioned as an intelligent reporting and explanation layer.