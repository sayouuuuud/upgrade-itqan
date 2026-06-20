#!/usr/bin/env python3
"""
Extract hardcoded Arabic strings from 12 target files and prepare translation updates.
"""
import re
import json
from pathlib import Path

# Target files with their hardcoded strings
TARGET_FILES = [
    "app/reader/memorization-paths/page.tsx",
    "app/academy/teacher/tasks/new/page.tsx",
    "app/academy/teacher/paths/page.tsx",
    "app/reader/learning-paths/page.tsx",
    "app/academy/pending/page.tsx",
    "(public)/sitemap-page/page.tsx",
    "app/academy/supervisor/teachers/page.tsx",
    "app/student/profile/page.tsx",
    "app/reader/certificates/page.tsx",
    "app/academy/teacher/courses/page.tsx",
    "app/academy/teacher/courses/new/page.tsx",
    "app/(auth)/register/components/TeacherForm.tsx",
]

def extract_arabic_strings(file_path):
    """Extract hardcoded Arabic strings from a file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except:
        return []
    
    # Regex to find strings with Arabic characters (in quotes)
    pattern = r'''(['"`])((?:(?=(\\?))\3.)*?[\u0600-\u06FF](?:(?=(\\?))\4.)*?)\1'''
    matches = re.findall(pattern, content)
    
    # Clean and deduplicate
    strings = set()
    for match in matches:
        if match[1]:
            # Unescape if needed
            s = match[1].replace('\\n', '\n').replace('\\t', '\t')
            strings.add(s)
    
    return sorted(list(strings))

# Scan all target files
all_strings = {}
for file_path in TARGET_FILES:
    full_path = Path("/vercel/share/v0-project") / file_path
    if full_path.exists():
        strings = extract_arabic_strings(full_path)
        if strings:
            all_strings[file_path] = strings
            print(f"✓ {file_path}: {len(strings)} strings found")
    else:
        # Try without the (public) prefix
        alt_path = Path("/vercel/share/v0-project") / file_path.replace("(public)/", "")
        if alt_path.exists():
            strings = extract_arabic_strings(alt_path)
            if strings:
                all_strings[file_path] = strings
                print(f"✓ {file_path} (alt path): {len(strings)} strings found")
        else:
            print(f"✗ {file_path}: File not found")

# Output results
print("\n" + "="*60)
print(f"Total unique Arabic strings found: {sum(len(v) for v in all_strings.values())}")
print("="*60)

# Save to JSON for review
with open("/vercel/share/v0-project/scripts/extracted-strings.json", "w", encoding="utf-8") as f:
    json.dump(all_strings, f, ensure_ascii=False, indent=2)
    print("Saved to: scripts/extracted-strings.json")
