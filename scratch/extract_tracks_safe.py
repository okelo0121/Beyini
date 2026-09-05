import sys
import re

sys.stdout.reconfigure(encoding='utf-8')

with open("scratch/metropolis_resources.txt", "r", encoding="utf-8") as f:
    text = f.read()

def search_text(pattern, title):
    print(f"=== {title} ===")
    matches = list(re.finditer(pattern, text, re.IGNORECASE))
    for m in matches:
        start = max(0, m.start() - 50)
        end = min(len(text), m.end() + 1500)
        print(text[start:end])
        print("\n" + "-"*40 + "\n")

# Let's inspect the tracks & key protocols
with open("scratch/tracks_summary.txt", "w", encoding="utf-8") as out:
    for track in ["Consumer Products & Payments", "Trust, Identity & AI Infrastructure", "Alchemy", "Envio", "x402", "ERC-8004", "EIP-7702", "Circle", "USDC"]:
        out.write(f"\n==================== {track} ====================\n")
        pos = 0
        while True:
            idx = text.lower().find(track.lower(), pos)
            if idx == -1:
                break
            snippet = text[max(0, idx-50):min(len(text), idx+1500)]
            out.write(snippet + "\n----------------------------------------\n")
            pos = idx + len(track) + 1000
            if pos >= len(text):
                break

print("Wrote to scratch/tracks_summary.txt")
