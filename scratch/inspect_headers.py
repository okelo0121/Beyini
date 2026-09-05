with open("scratch/metropolis_resources.txt", "r", encoding="utf-8") as f:
    text = f.read()

lines = text.split("\n")
headers = [line for line in lines if line.startswith("#")]
for h in headers:
    print(h)
