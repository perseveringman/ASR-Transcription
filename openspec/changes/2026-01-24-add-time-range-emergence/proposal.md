# Add Time-Range Based AI Emergence

## Why
Users want to find patterns and insights not just from a single note, but from a collection of notes created over a specific period (e.g., "Review my week", "Insights from yesterday's journaling"). This "Emergence" capability aggregates multiple notes to find value.

## What
1.  **New Action Type**: Support actions that require a **Date Range** input instead of just reading the current note.
2.  **Date Range Modal**: A UI to select the time period (Presets: Today, Yesterday, This Week, Last 7 Days, Custom).
3.  **Batch Processing**:
    *   Identify notes created within the range.
    *   Concatenate their content with headers.
    *   Send to LLM.
4.  **Output**:
    *   Create a new note (as before).
    *   **Backlinks**: List *all* source notes at the end of the generated note.

## How
1.  **Update `AIAction` Interface**: Add `inputType` field.
2.  **Update `ActionManager`**:
    *   Handle `date-range` input type.
    *   Implement `fetchFilesByDateRange(start, end)`.
    *   Show `TimeRangeModal`.
3.  **Create `TimeRangeModal`**:
    *   Simple modal with buttons for presets and date pickers.
4.  **Update Action Configuration**:
    *   Add a new action "Weekly Value Emergence" (or similar) under "Emergence".
    *   Or update the existing "Value Clarification" to be selectable?
    *   *Decision*: Add a new Action "Value Clarification (Time Range)" to keep the simple "Current Note" one quick.

## Output Format
```markdown
---
tags:
  - AI涌现/价值澄清
  - 时间段/2026-01-20_2026-01-27
---
[AI Analysis Content...]

## References
- [[Note A]]
- [[Note B]]
...
```
