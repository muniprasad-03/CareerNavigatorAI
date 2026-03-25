import json
import requests
import sys

def run_test():
    url = "http://127.0.0.1:8000/match"
    payload = {
        "riasec_scores": {"R": 10, "I": 20, "A": 5, "S": 2, "E": 1, "C": 15},
        "narrative": "I like to analyze data and build systems.",
        "north_star": ""
    }
    try:
        resp = requests.post(url, json=payload, timeout=60)
        resp.raise_for_status()
        print(json.dumps(resp.json(), indent=2))
    except Exception as e:
        print(f"Error: {e}")
        if 'resp' in locals():
            print(resp.text)
        sys.exit(1)

if __name__ == "__main__":
    run_test()
