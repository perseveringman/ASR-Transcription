
import os
import re
import subprocess

# Precise timestamps from stat
timestamps = {
    "20260123-2030.m4a": "20260123-203038",
    "20260125-0216.mp3": "20260125-021643",
    "20260126-2128.m4a": "20260126-212822",
    "20260127-0932.m4a": "20260127-093215",
    "20260127-2328.m4a": "20260127-232810",
    "20260127-2329.m4a": "20260127-232935",
    "20260128-0945.m4a": "20260128-094523",
    "20260128-0947.m4a": "20260128-094723",
    "20260128-2259.m4a": "20260128-225939",
    "20260131-1120.m4a": "20260131-112041",
    "20260131-1138.m4a": "20260131-113802",
    "20260201-2243.m4a": "20260201-224328",
    "20260202-2130-2.m4a": "20260202-213019",
    "20260202-2130.m4a": "20260202-213007",
    "20260203-2154.m4a": "20260203-215454",
    "20260204-2226.m4a": "20260204-222600",
    "20260205-2358.m4a": "20260205-235818",
    "20260207-2027.m4a": "20260207-202726",
    "20260209-0935.m4a": "20260209-093459",
    "20260209-2149.m4a": "20260209-214928",
    "20260210-1952.m4a": "20260210-195225",
    "20260211-2337.m4a": "20260211-233730",
    "20260215-0012.m4a": "20260215-001257",
    "20260224-0020.m4a": "20260224-002029",
    "20260226-0156.m4a": "20260226-015610",
    "20260226-2334.m4a": "20260226-233444",
    "Recording_20260130201233.m4a": "20260130-203900",
    "Recording_20260201005906.m4a": "20260201-010848",
}

vault_path = "/Users/ryanbzhou/mynote"
audio_folder = "03_语音"
note_folder = "21_语音笔记"

# Build mappings
audio_rename_map = {}
note_rename_map = {}

for old_audio, new_ts in timestamps.items():
    ext = os.path.splitext(old_audio)[1]
    new_audio = f"{new_ts}{ext}"
    audio_rename_map[old_audio] = new_audio
    
    # Old note name based on old audio name (stripped of ext)
    old_note_ts = os.path.splitext(old_audio)[0]
    # Handle the cases where I already renamed Transcription notes to YYYYMMDD-HHmm
    # My current notes are Transcription-YYYYMMDD-HHmm.md
    # The timestamps keys match the current audio filenames.
    
    old_note_name = f"Transcription-{old_note_ts}"
    new_note_name = f"Transcription-{new_ts}"
    note_rename_map[old_note_name] = new_note_name

# 1. Rename Audio Files
for old, new in audio_rename_map.items():
    old_path = os.path.join(vault_path, audio_folder, old)
    new_path = os.path.join(vault_path, audio_folder, new)
    if os.path.exists(old_path):
        print(f"Renaming audio: {old} -> {new}")
        os.rename(old_path, new_path)

# 2. Rename Transcription Notes
for old_name, new_name in note_rename_map.items():
    old_path = os.path.join(vault_path, note_folder, f"{old_name}.md")
    new_path = os.path.join(vault_path, note_folder, f"{new_name}.md")
    if os.path.exists(old_path):
        print(f"Renaming note: {old_name}.md -> {new_name}.md")
        os.rename(old_path, new_path)

# 3. Update links in all .md files
# We need to replace [[Transcription-OLD]] with [[Transcription-NEW]]
# and ![[03_语音/OLD.ext]] with ![[03_语音/NEW.ext]]
# and frontmatter date? (date only contains YYYY-MM-DD, so no need to update unless it changed, but we are refine to seconds)

for root, dirs, files in os.walk(vault_path):
    for file in files:
        if file.endswith(".md"):
            file_path = os.path.join(root, file)
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            original_content = content
            
            # Replace audio links
            for old_audio, new_audio in audio_rename_map.items():
                content = content.replace(old_audio, new_audio)
            
            # Replace note links
            for old_note, new_note in note_rename_map.items():
                content = content.replace(old_note, new_note)
            
            if content != original_content:
                print(f"Updating links in: {file}")
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)

print("Done!")
