# Add AI Shortcut Panel (Sidebar)

## Why
Users want quick access to AI features without memorizing commands or configuring templates for every small task. A dedicated sidebar panel allows for "one-click" AI operations on the current note, fostering an interactive workflow where AI acts as a co-thinker.

## What
1.  **Sidebar View**: A new leaf in the right sidebar containing categorization of AI actions.
2.  **Action System**: An extensible way to define "AI Actions". An action consists of:
    *   Name & Icon
    *   Category (e.g., "Emergence", "Editing", "Summary")
    *   System Prompt
    *   User Prompt Template (optional, defaults to whole note content)
    *   Output handling (Append, Replace, New Note, or just Show in Modal/Panel)
3.  **Initial Feature**: "Value Clarification" (价值澄清) under "Emergent Capabilities" (AI 涌现能力).
    *   **Goal**: Extract core values and meaningful insights from a potentially chaotic note.

## How
1.  **Architecture**:
    *   `src/ui/sidebar/`: View component.
    *   `src/managers/action-manager.ts`: Manages available actions and execution flow.
    *   `src/types/action.ts`: Interfaces for `AIAction`.
2.  **Integration**:
    *   Register the View in `main.ts`.
    *   Use `LLMManager` to execute the prompts.
3.  **Default Actions**:
    *   Implement "Value Clarification" as a hardcoded default action for now (future: load from json/settings).

## UI Design
*   Categories as collapsible headers (Accordions).
*   Buttons/Cards for each action.
*   Loading state indication.
*   Result display: Initially append to note or show in a generic result modal? User requested "process current note", usually implies appending or creating output. Let's support "Append to Note" as default for this feature.

## Documentation
*   Update `architecture.md` to include the new Action/Sidebar components.
*   Update `user_guide.md` (if created) or README.
