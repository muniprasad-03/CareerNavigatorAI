import json
import os

# Define realistic RIASEC mappings for common careers
RIASEC_MAP = {
    "Software Engineer": {"R": 0.3, "I": 0.8, "A": 0.4, "S": 0.2, "E": 0.4, "C": 0.7},
    "Data Scientist": {"R": 0.2, "I": 0.9, "A": 0.3, "S": 0.1, "E": 0.4, "C": 0.8},
    "Graphic Designer": {"R": 0.1, "I": 0.2, "A": 0.9, "S": 0.4, "E": 0.5, "C": 0.2},
    "Registered Nurse": {"R": 0.2, "I": 0.4, "A": 0.1, "S": 0.9, "E": 0.2, "C": 0.6},
    "Mechanical Engineer": {"R": 0.9, "I": 0.7, "A": 0.3, "S": 0.1, "E": 0.2, "C": 0.4},
    "Teacher": {"R": 0.1, "I": 0.2, "A": 0.4, "S": 0.9, "E": 0.5, "C": 0.3},
    "Real Estate Agent": {"R": 0.1, "I": 0.1, "A": 0.3, "S": 0.6, "E": 0.9, "C": 0.3},
    "Chef": {"R": 0.7, "I": 0.1, "A": 0.8, "S": 0.2, "E": 0.4, "C": 0.1},
    "Accountant": {"R": 0.1, "I": 0.3, "A": 0.1, "S": 0.1, "E": 0.4, "C": 0.9},
    "Musician": {"R": 0.2, "I": 0.1, "A": 1.0, "S": 0.3, "E": 0.4, "C": 0.1},
    "Paralegal": {"R": 0.1, "I": 0.4, "A": 0.1, "S": 0.2, "E": 0.3, "C": 0.9},
    "Sales Manager": {"R": 0.1, "I": 0.2, "A": 0.3, "S": 0.5, "E": 0.9, "C": 0.4},
    "Biologist": {"R": 0.2, "I": 0.9, "A": 0.2, "S": 0.4, "E": 0.1, "C": 0.5},
    "Civil Engineer": {"R": 0.8, "I": 0.7, "A": 0.3, "S": 0.2, "E": 0.4, "C": 0.5},
    "Psychiatrist": {"R": 0.1, "I": 0.9, "A": 0.3, "S": 0.8, "E": 0.4, "C": 0.2},
    "Paramedic": {"R": 0.6, "I": 0.3, "A": 0.1, "S": 0.8, "E": 0.4, "C": 0.2}
}

file_path = "d:/Projects/CareerNavigatorAI/backend/careers_data.json"

if os.path.exists(file_path):
    with open(file_path, "r") as f:
        data = json.load(f)
    
    updated_count = 0
    for career in data:
        name = career.get("name")
        if name in RIASEC_MAP:
            career["riasecProfile"] = RIASEC_MAP[name]
            updated_count += 1
            
    with open(file_path, "w") as f:
        json.dump(data, f, indent=2)
    
    print(f"Successfully sanitized {updated_count} RIASEC profiles.")
else:
    print("File not found.")
