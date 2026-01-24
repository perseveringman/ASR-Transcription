# Refactor: Separate Source Selection from Actions

## Why
Currently, "Value Clarification" and "Value Clarification (Time Range)" are separate buttons. This scales poorly as we add more actions (e.g., "Summarize", "Find Tasks"). The user should first select *what* to process (Current Note vs. Time Range vs. Folder), and then select *how* to process it (the Action).

## What
1.  **UI Redesign**:
    *   Top section: **Source Selector** (Dropdown or Toggles).
        *   Options: `Current Note` (default), `Time Range`.
    *   Bottom section: **Actions** (List of buttons).
        *   "Value Clarification", "Summarize", etc.
2.  **Logic Change**:
    *   `ActionManager` no longer stores `inputType` on the `AIAction`.
    *   The `AISidebarView` maintains the state of "Selected Source".
    *   When an action button is clicked, `AISidebarView` passes the `SourceConfig` to `ActionManager.executeAction`.
3.  **Flow**:
    *   User selects "Time Range" -> "Last 7 Days".
    *   User clicks "Value Clarification".
    *   `ActionManager` fetches files based on "Last 7 Days".
    *   `ActionManager` executes the "Value Clarification" prompt on those files.

## How
1.  **Update `AIAction`**: Remove `inputType`.
2.  **Create `SourceConfig` interface**:
    ```typescript
    type SourceType = 'current-note' | 'date-range';
    interface SourceConfig {
        type: SourceType;
        startDate?: moment.Moment;
        endDate?: moment.Moment;
    }
    ```
3.  **Update `AISidebarView`**:
    *   Add UI for Source Selection.
    *   Handle "Time Range" selection (show Modal immediately or just store state? Better to show modal when they *configure* the source, or when they run?
    *   *Better UX*: "Time Range" toggle. If selected, maybe show a summary "Last 7 days" and a "Change" button. Or just pop up the modal when the Action is clicked if the source is "Time Range".
    *   *Decision*: Let's keep it simple. A dropdown/toggle. If "Time Range" is active, when Action is clicked, show the DatePicker Modal *then* execute.
4.  **Update `ActionManager`**:
    *   `executeAction` signature changes to `(action: AIAction, source: SourceConfig)`.
