import json
import os
from googletrans import Translator

with open('unique_arabic.json', 'r', encoding='utf-8') as f:
    unique = json.load(f)

translator = Translator()
translations = {}

for ar in unique:
    try:
        en = translator.translate(ar, src='ar', dest='en').text
        en = ' '.join(w.capitalize() for w in en.split())
        translations[ar] = en
    except Exception as e:
        translations[ar] = "Translated"

with open('translations.json', 'w', encoding='utf-8') as f:
    json.dump(translations, f, ensure_ascii=False, indent=2)
