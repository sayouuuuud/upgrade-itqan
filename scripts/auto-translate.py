#!/usr/bin/env python3
"""
Automated i18n Translation Script
Extracts Arabic strings, creates namespaces, and replaces hardcoded text
"""

import os
import re
import json
from collections import defaultdict
from pathlib import Path

# Configuration
PROJECT_ROOT = '/vercel/share/v0-project'
SKIP_DIRS = {'node_modules', '.next', '.git', 'public', 'scripts', '.v0'}
SKIP_FILES = {'transliterate.ts', 'quran-data.ts', 'quran-surahs.ts', 'mock-data.ts', 'roles.ts', 'email.ts', 'languages.ts'}
EXCLUDED_PREFIXES = ['t.', 'th.', 'th?.', 'ts.', 'ts?.', 'vs.', 'vs?.', 'vsd?.', 'tr(', 'isAr', '_AR', 'ar:', 'en:', 'locale', '?:']

ARABIC_REGEX = re.compile(r'[\u0600-\u06ff]')

# Categorization function
def categorize_file(path):
    if 'admin' in path and 'academy' not in path:
        return 'admin'
    elif 'academy' in path and 'components' in path:
        return 'academy'
    elif 'academy' in path:
        return 'academy'
    elif 'student' in path and 'components' in path:
        return 'student'
    elif 'student' in path:
        return 'student'
    elif 'reader' in path:
        return 'reader'
    elif 'supervisor' in path or 'parent' in path or 'teacher' in path:
        return 'roles'
    else:
        return 'shared'

# Extract Arabic strings
def extract_arabic_strings(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except:
        return []
    
    strings = []
    lines = content.split('\n')
    
    for line_num, line in enumerate(lines, 1):
        if not ARABIC_REGEX.search(line):
            continue
        if line.strip().startswith('//') or line.strip().startswith('*'):
            continue
        if any(prefix in line for prefix in EXCLUDED_PREFIXES):
            continue
        
        # Find Arabic strings in quotes
        matches = re.finditer(r'["\']([^"\']*[\u0600-\u06ff][^"\']*)["\']', line)
        for match in matches:
            arab_str = match.group(1)
            if arab_str and len(arab_str) > 0:
                strings.append({
                    'text': arab_str,
                    'line': line_num,
                    'context': line.strip()[:80]
                })
    
    return strings

# Generate namespace key from Arabic text
def generate_key(arabic_text):
    # Simple camelCase key generation
    words = arabic_text.split()[:2]  # Take first 2 words
    key_parts = []
    
    for word in words:
        # Remove diacritics and special chars
        clean = re.sub(r'[\u064B-\u0652]', '', word)
        clean = re.sub(r'[^\u0600-\u06ff\u0660-\u0669a-zA-Z0-9]', '', clean)
        if clean:
            key_parts.append(clean[:6])
    
    key = '_'.join(key_parts).lower()
    key = re.sub(r'[^a-z0-9_]', '', key)[:25]
    return key or 'item'

# Main scan function
def scan_all_files():
    print("🔍 Scanning project for Arabic strings...")
    
    files_by_category = defaultdict(lambda: defaultdict(list))
    
    for root, dirs, files in os.walk(PROJECT_ROOT):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS and not d.startswith('.')]
        
        for fname in files:
            if fname.endswith(('.tsx', '.ts')) and fname not in SKIP_FILES:
                filepath = os.path.join(root, fname)
                rel_path = filepath.replace(f'{PROJECT_ROOT}/', '')
                
                strings = extract_arabic_strings(filepath)
                if strings:
                    cat = categorize_file(rel_path)
                    files_by_category[cat][rel_path] = strings
    
    return files_by_category

# Print summary
def print_summary(files_by_category):
    print("\n" + "="*80)
    print("📊 EXTRACTION SUMMARY")
    print("="*80)
    
    total_files = 0
    total_strings = 0
    
    for cat in ['admin', 'academy', 'student', 'reader', 'roles', 'shared']:
        if cat in files_by_category:
            files = files_by_category[cat]
            num_files = len(files)
            num_strings = sum(len(strs) for strs in files.values())
            
            print(f"\n{cat.upper()}: {num_files} files | {num_strings} strings")
            for fpath, strings in sorted(files.items()):
                print(f"  {len(strings):2d}  →  {fpath}")
            
            total_files += num_files
            total_strings += num_strings
    
    print("\n" + "="*80)
    print(f"📈 TOTAL: {total_files} files | {total_strings} strings")
    print("="*80)
    print(f"\n✅ Ready to translate {total_strings} strings across {total_files} files!")
    print("   Run: python3 scripts/auto-translate.py --apply")

if __name__ == '__main__':
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == '--apply':
        print("🚀 Applying translations... (not yet implemented)")
    else:
        files = scan_all_files()
        print_summary(files)
