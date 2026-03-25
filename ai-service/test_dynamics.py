import requests
import json

def test_match(riasec, narrative):
    url = "http://localhost:8000/match"
    payload = {
        "riasec_scores": riasec,
        "narrative": narrative,
        "north_star": ""
    }
    resp = requests.post(url, json=payload)
    if resp.status_code == 200:
        data = resp.json()
        titles = [c['title'] for c in data['top_careers']]
        scores = [c['score'] for c in data['top_careers']]
        return titles, scores
    else:
        return f"Error: {resp.status_code}", resp.text

# Case 1: Artistic
riasec1 = {"R": 1, "I": 1, "A": 10, "S": 2, "E": 1, "C": 1}
narrative1 = "I love creative expression, painting, and music."
titles1, scores1 = test_match(riasec1, narrative1)
print(f"Artistic Case:\nTitles: {titles1}\nScores: {scores1}\n")

# Case 2: Investigative
riasec2 = {"R": 1, "I": 10, "A": 1, "S": 2, "E": 1, "C": 1}
narrative2 = "I want to study complex science and mathematics."
titles2, scores2 = test_match(riasec2, narrative2)
print(f"Investigative Case:\nTitles: {titles2}\nScores: {scores2}\n")

# Case 3: Same Narrative, Different RIASEC
narrative3 = "I want a high-paying job."
riasec3a = {"R": 10, "I": 1, "A": 1, "S": 1, "E": 1, "C": 1} # Realistic
riasec3b = {"R": 1, "I": 1, "A": 1, "S": 10, "E": 1, "C": 1} # Social

titles3a, _ = test_match(riasec3a, narrative3)
titles3b, _ = test_match(riasec3b, narrative3)
print(f"Comparative Case (Same Narrative):\nRealistic RIASEC: {titles3a}\nSocial RIASEC: {titles3b}\n")
