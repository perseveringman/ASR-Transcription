# Fix Emergence Topic Metadata

## Problem
Notes generated from Time Range Emergence (e.g., Weekly Review) often lack the `topic` frontmatter metadata. This is because:
1. The prompts are reused from single-note actions and may not be strong enough for multi-note contexts.
2. The parsing logic was too strict, expecting `Topic:` to be the very first characters of the output.

## Solution
1. **Prompt Enhancement**: Append a specific instruction to the user prompt when `date-range` source is used, explicitly asking to start with `Topic: ...`.
2. **Robust Parsing**: Update the `createNewNote` function to scan the first 10 lines of the output for the `Topic:` pattern, instead of just the first line.
