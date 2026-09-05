with open("scratch/metropolis_resources.txt", "r", encoding="utf-8") as f:
    text = f.read()

# Let's inspect sections:
sections_to_check = [
    "## Monad documentation",
    "### Consumer Products & Payments",
    "### Trust, Identity & AI Infrastructure",
    "### Alchemy",
    "### Envio",
    "x402",
    "ERC-8004",
    "EIP-7702",
    "Payments Embedded in Social Gestures",
    "Mobile-Native Proof of Personhood"
]

for sec in sections_to_check:
    pos = text.find(sec)
    if pos != -1:
        print(f"=== FOUND {sec} ===")
        print(text[pos:pos+1500])
        print("\n" + "="*40 + "\n")
