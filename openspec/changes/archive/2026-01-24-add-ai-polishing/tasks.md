# Tasks: AI Polishing

- [ ] Define `LLMService` interface and types in `src/types/llm.ts` <!-- id: 0 -->
- [ ] Implement `OpenRouterLLMService` in `src/services/llm/openrouter-api.ts` <!-- id: 1 -->
- [ ] Create `LLMServiceFactory` in `src/services/llm/factory.ts` <!-- id: 2 -->
- [ ] Update `PluginSettings` in `src/types/config.ts` to include LLM settings <!-- id: 3 -->
- [ ] Update `ASRSettingTab` in `src/ui/settings-tab.ts` to add UI for LLM settings <!-- id: 4 -->
- [ ] Update `ASRPlugin` in `src/main.ts` to handle the polishing workflow <!-- id: 5 -->
- [ ] Update `TextInserter` in `src/services/text-inserter.ts` to support `{{aiText}}` and default insertion logic <!-- id: 6 -->
