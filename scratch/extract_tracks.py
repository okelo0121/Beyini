with open("scratch/metropolis_resources.txt", "r", encoding="utf-8") as f:
    text = f.read()

import re

for match in re.finditer(r'(###\s+Consumer Products & Payments[\s\S]*?)(?=###\s+Social|\Z)', text):
    print("=== CONSUMER PRODUCTS & PAYMENTS ===")
    print(match.group(1)[:2500])

for match in re.finditer(r'(###\s+Trust, Identity & AI Infrastructure[\s\S]*?)(?=##\s+Ecosystem|\Z)', text):
    print("=== TRUST, IDENTITY & AI ===")
    print(match.group(1)[:2500])

for match in re.finditer(r'(###\s+Alchemy[\s\S]*?)(?=###\s+|\Z)', text):
    print("=== ALCHEMY ===")
    print(match.group(1)[:1500])

for match in re.finditer(r'(###\s+Envio[\s\S]*?)(?=###\s+|\Z)', text):
    print("=== ENVIO ===")
    print(match.group(1)[:1500])
