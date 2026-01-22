# Implementation Tasks

## 1. Utility Development
- [x] 1.1 Implement `VaultUtils` to scan links in markdown content
  - Support `[[link]]` and `![[link]]` formats
  - Filter for `.mp3` and `.wav` extensions
- [x] 1.2 Implement `VaultUtils` to resolve links to `TFile` objects

## 2. UI Development
- [x] 2.1 Create `AudioLinkSelectionModal` for choosing between multiple audio files
- [x] 2.2 Add loading state feedback for bulk transcription if needed

## 3. Core Logic
- [x] 3.1 Update `TextInserter` to support inserting text at a specific offset or after a specific pattern
- [x] 3.2 Implement the main orchestration logic for scanning, transcribing, and inserting

## 4. Plugin Integration
- [x] 4.1 Register the new command in `src/main.ts`
- [x] 4.2 Test with various link styles and file locations
