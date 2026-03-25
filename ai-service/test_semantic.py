import requests
import json

URL = "http://127.0.0.1:8000/match"

def test_match(narrative):
    payload = {
        "riasec_scores": {"R": 5, "I": 10, "A": 2, "S": 2, "E": 2, "C": 2},
        "narrative": narrative,
        "north_star": ""
    }
    response = requests.post(URL, json=payload)
    if response.status_code == 200:
        data = response.json()
        top_career = data['top_careers'][0]['title']
        course = data['next_step']['course_title']
        print(f"Narrative: '{narrative}'")
        print(f"  Top Career: {top_career}")
        print(f"  Recommended Course: {course}")
        print("-" * 30)
    else:
        print(f"Error: {response.status_code} - {response.text}")

print("Phase 4 Verification: Semantic Multi-Path Test\n")
test_match("I love analyzing data and building machine learning models.")
test_match("I want to work in a laboratory doing biological research.")
