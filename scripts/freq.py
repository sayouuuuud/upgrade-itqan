import re
from collections import Counter

with open('arabic_hardcoded_strings.md', 'r', encoding='utf-8') as f:
    text = f.read()

matches = re.findall(r'`([^`]+)`', text)
clean_matches = [m.strip() for m in matches]

counter = Counter(clean_matches)
with open('freq_output.txt', 'w', encoding='utf-8') as f:
    for k, v in counter.most_common(50):
        f.write(f"{v}: {k}\n")
