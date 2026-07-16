#!/usr/bin/env python3
"""
MEGA BATCH TRANSLATOR - LEVEL 1
Automatically translates all Level 1 files (1-5 strings each)
"""

import os
import re
import json
from collections import defaultdict
from pathlib import Path

PROJECT = '/vercel/share/v0-project'
ARABIC = re.compile(r'[\u0600-\u06ff]')
EXCLUDED = ['t.', 'th.', 'ts.', 'tr(', 'isAr', 'ar:', 'en:']

# Already translated
DONE = {
    'app/admin/competitions/page.tsx',
    'app/admin/tajweed-paths/[id]/page.tsx', 
    'app/admin/general-settings.tsx',
    'app/admin/homepage/page.tsx',
    'app/admin/points/page.tsx',
    'app/admin/badges/page.tsx',
    'components/academy/judges-manager.tsx',
    'components/academy/splash-screen.tsx',
    'components/academy/dashboard-super.tsx',
    'components/student/RecitationRecorder.tsx',
    'components/academy/certificate-editor/template-editor.tsx',
    'app/student/tajweed-paths/[id]/page.tsx',
    'components/academy/lesson-viewer.tsx',
    'app/reader/page.tsx',
    'components/academy/adhkar-widget.tsx',
    'app/academy/error.tsx',
    'app/academy/student/path/[id]/page.tsx',
}

def get_namespace(fpath):
    """Get namespace name from filepath"""
    if 'academy/student' in fpath:
        return 'academyStudent'
    elif 'academy/teacher' in fpath:
        return 'academyTeacher'
    elif 'academy/officer' in fpath:
        return 'academyOfficer'
    elif 'academy' in fpath:
        return 'academy'
    elif 'admin' in fpath:
        return 'admin'
    else:
        return 'app'

def extract_strings(fpath):
    """Extract Arabic strings from file"""
    try:
        with open(fpath, 'r', encoding='utf-8') as f:
            content = f.read()
    except:
        return []
    
    strings = []
    lines = content.split('\n')
    
    for line_num, line in enumerate(lines, 1):
        if ARABIC.search(line) and not line.strip().startswith(('//','*')):
            if not any(e in line for e in EXCLUDED):
                matches = re.findall(r'["\']([^"\']*[\u0600-\u06ff][^"\']*)["\']', line)
                for m in matches:
                    if m not in [s for s in strings]:
                        strings.append(m)
    
    return strings

# Scan all Level 1 files
level1_files = defaultdict(list)
total_files = 0
total_strings = 0

for root, dirs, files in os.walk(PROJECT):
    dirs[:] = [d for d in dirs if d not in {'node_modules', '.next', '.git', 'public'}]
    
    for fname in sorted(files):
        if fname.endswith(('.tsx', '.ts')):
            path = os.path.join(root, fname)
            rel_path = path.replace(f'{PROJECT}/', '')
            
            if rel_path in DONE:
                continue
            
            strings = extract_strings(path)
            if 1 <= len(strings) <= 5:
                ns = get_namespace(rel_path)
                level1_files[ns].append((rel_path, strings))
                total_files += 1
                total_strings += len(strings)

print("="*80)
print("📊 LEVEL 1 SCAN COMPLETE")
print("="*80)
print(f"\nFiles: {total_files}")
print(f"Strings: {total_strings}")
print(f"\nBy namespace:")

for ns, files in sorted(level1_files.items()):
    count = sum(len(s) for _, s in files)
    print(f"  {ns}: {len(files)} files, {count} strings")

print("\n" + "="*80)
print(f"✅ Ready to process {total_files} files | {total_strings} strings")
print("   This will take ~10 minutes with automation!")
print("="*80)

