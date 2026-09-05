import json

path = r"C:\Users\ADMIN\.gemini\antigravity-ide\brain\e2a7423d-a711-4e5d-92ab-e07ea019d3a9\.system_generated\logs\transcript_full.jsonl"
with open(path, "r", encoding="utf-8") as f:
    for line in f:
        data = json.loads(line)
        if data.get("type") == "USER_INPUT":
            content = data.get("content", "")
            if "Metropolis Hackathon Resources" in content:
                print(f"Found at step_index: {data.get('step_index')}, length: {len(content)}")
                with open(r"C:\Users\ADMIN\.gemini\antigravity-ide\scratch\coinfusion-app\scratch\metropolis_resources.txt", "w", encoding="utf-8") as out:
                    out.write(content)
                print("Wrote to scratch/metropolis_resources.txt")
