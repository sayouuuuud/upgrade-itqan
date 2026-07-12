import re
import os
import json
from googletrans import Translator

translator = Translator()

with open('arabic_hardcoded_strings.md', 'r', encoding='utf-8') as f:
    text = f.read()

# Extract lines: **File:** [D:/Workspace/Itqan Upgrade/app/admin/badges/page.tsx](file:///...)
# **Line 668:** `<p className={...}>`

lines = text.split('\n')
tasks = {}
current_file = None
current_line_num = None

for line in lines:
    if line.startswith('**File:**'):
        match = re.search(r'\[(.*?)\]', line)
        if match:
            current_file = match.group(1).replace('\\', '/')
            if current_file not in tasks:
                tasks[current_file] = []
    elif line.startswith('**Line '):
        match = re.search(r'\*\*Line (\d+):\*\* `(.*)`', line)
        if match:
            line_num = int(match.group(1))
            content = match.group(2)
            # Find the Arabic word in content
            arabic_match = re.search(r'[\u0600-\u06FF\s]+', content)
            if arabic_match:
                arabic_str = arabic_match.group(0).strip()
                if arabic_str:
                    tasks[current_file].append({
                        'line_num': line_num,
                        'content': content,
                        'arabic': arabic_str
                    })

print(f"Found {len(tasks)} files to process.")

for file_path, items in tasks.items():
    if not os.path.exists(file_path):
        continue
        
    with open(file_path, 'r', encoding='utf-8') as f:
        file_lines = f.readlines()
        
    needs_hook = False
    
    # Check if 'useI18n' is used
    has_useI18n = any('useI18n' in l for l in file_lines)
    
    for item in items:
        idx = item['line_num'] - 1
        if idx >= len(file_lines):
            continue
            
        original_line = file_lines[idx]
        arabic = item['arabic']
        
        # Don't translate if it already has isAr
        if 'isAr ?' in original_line or 'isAr?' in original_line:
            continue
            
        # Try translation
        try:
            translation = translator.translate(arabic, src='ar', dest='en').text
            # Capitalize words
            translation = ' '.join(w.capitalize() for w in translation.split())
        except Exception as e:
            translation = "Translated"
            
        new_line = original_line
        
        # Heuristics for replacement
        if f'>{"{arabic}"}<' in new_line:
            new_line = new_line.replace(f'>{"{arabic}"}<', f'>{{isAr ? "{arabic}" : "{translation}"}}<')
        elif f'>{arabic}<' in new_line:
            new_line = new_line.replace(f'>{arabic}<', f'>{{isAr ? "{arabic}" : "{translation}"}}<')
        elif f'="{arabic}"' in new_line:
            new_line = new_line.replace(f'="{arabic}"', f'={{isAr ? "{arabic}" : "{translation}"}}')
        elif f': "{arabic}"' in new_line:
            new_line = new_line.replace(f': "{arabic}"', f': isAr ? "{arabic}" : "{translation}"')
        elif f'"{arabic}"' in new_line:
            new_line = new_line.replace(f'"{arabic}"', f'isAr ? "{arabic}" : "{translation}"')
        elif f"'{arabic}'" in new_line:
            new_line = new_line.replace(f"'{arabic}'", f'isAr ? "{arabic}" : "{translation}"')
        elif arabic in new_line:
            # Fallback
            if '<' in new_line and '>' in new_line and not new_line.strip().startswith('<'):
                pass # Too complex
            else:
                 new_line = new_line.replace(arabic, f'{{isAr ? "{arabic}" : "{translation}"}}')
        
        if new_line != original_line:
            file_lines[idx] = new_line
            needs_hook = True

    if needs_hook:
        # Try to inject useI18n if not exists
        if not has_useI18n:
            # Find last import
            last_import_idx = 0
            for i, l in enumerate(file_lines):
                if l.startswith('import '):
                    last_import_idx = i
            file_lines.insert(last_import_idx + 1, 'import { useI18n } from "@/lib/i18n/context"\n')
            
        # Find component declaration to inject const { t } = useI18n(); const isAr = t.locale === "ar";
        # Simplistic approach: find export default function or export function
        for i, l in enumerate(file_lines):
            if 'export default function' in l or 'export function' in l:
                if '{' in l:
                    file_lines.insert(i + 1, '  const { t } = useI18n();\n  const isAr = t.locale === "ar";\n')
                    break

    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(file_lines)

print("Done processing.")
