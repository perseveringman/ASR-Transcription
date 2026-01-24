# Tasks: Separate Source Selection

- [ ] Define `SourceConfig` and `SourceType` in `src/types/action.ts` <!-- id: 0 -->
- [ ] Remove `inputType` from `AIAction` interface and default actions in `ActionManager` <!-- id: 1 -->
- [ ] Update `AISidebarView` to include a Source Selector UI (Current Note vs Time Range) <!-- id: 2 -->
- [ ] Update `ActionManager.executeAction` to accept `SourceConfig` and handle logic accordingly <!-- id: 3 -->
- [ ] Refactor `ActionManager` to trigger `TimeRangeModal` only if source is `date-range` <!-- id: 4 -->
