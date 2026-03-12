import warnings
import urllib3
import os
import sys

# Suppress verbose warnings to keep stdout clean for JSON parsing in Node.js
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'  # Suppress TensorFlow/Models messages
warnings.filterwarnings('ignore')
urllib3.disable_warnings()

import json
import math
import requests
import chromadb
from sentence_transformers import SentenceTransformer

def normalize_riasec(riasec_dict):
    r"""Trait Normalization algorithm ($w_i = s_i / \sum s_j$)"""
    total = sum(riasec_dict.values())
    if total == 0:
        return {k: 0 for k in riasec_dict}
    return {k: round(v / total, 3) for k, v in riasec_dict.items()}

def calculate_rvi(riasec_dict):
    """
    Resilience-Volatility Index (RVI).
    Routine/Predictable work (Conventional, Realistic) has higher automation risk.
    Social/Investigative (Creative, Empathic) has lower risk.
    Returns a score from 0.0 (Safe) to 1.0 (High Risk).
    """
    # Weights for automation risk based on O*NET projections (Mocked for Zero-Cost Prototype)
    risk_weights = {
        "C": 0.8, # Conventional - High Risk (Routine data)
        "R": 0.7, # Realistic - Med/High Risk (Physical routine)
        "E": 0.5, # Enterprising - Medium
        "A": 0.3, # Artistic - Low Risk (Creative)
        "I": 0.2, # Investigative - Low Risk (Complex problem solving)
        "S": 0.1  # Social - Very Low Risk (Human interaction)
    }
    
    rvi = 0.0
    for trait, score in riasec_dict.items():
        rvi += score * risk_weights.get(trait, 0)
        
    return round(rvi, 2)

def generate_shap_values(user_riasec, career_riasec):
    """
    Mocks a SHAP feature importance array for the local prototype.
    Positive values mean the trait pulled the user towards this career.
    Negative values pushed them away.
    """
    shap_vals = {}
    for trait in user_riasec:
        # Distance calculation serving as feature importance proxy
        shap_vals[trait] = round(1 - abs(user_riasec[trait] - career_riasec[trait]), 3)
    return shap_vals

def run_ollama_explanation(career_name, rvi, shap_vals):
    """Calls local Llama-3 container via Ollama to generate a natural language story."""
    prompt = f"""You are CareerNavigator AI. The user matched with {career_name}.
Their Automation Risk (RVI) for this job is {rvi} (0.0=Safe, 1.0=Automated soon).
Here are the SHAP feature importances showing *why* they matched this job based on their personality (Higher = Stronger Match):
{json.dumps(shap_vals, indent=2)}

Write a concise, encouraging 3-sentence explanation of why they are a good fit and what their automation risk means."""

    # Default fallback explanation
    explanation = "Based on your mathematical profile, this career is a strong match for your traits. "
    explanation += "Your resilient skills position you well against future automation."
    
    try:
        # Hit local Ollama API
        response = requests.post("http://127.0.0.1:11434/api/generate", json={
            "model": "llama3:8b",
            "prompt": prompt,
            "stream": False
        }, timeout=8) # 8 second timeout so Node.js doesn't hang forever
        
        if response.status_code == 200:
            explanation = response.json().get("response", explanation)
    except Exception:
        # Silent fallback if Ollama isn't running or times out
        pass
        
    return explanation.strip()

def main():
    try:
        # Read JSON from stdin
        input_data = sys.stdin.read()
        if not input_data:
            raise ValueError("No input provided")
            
        payload = json.loads(input_data)
        raw_riasec = payload.get("riasec", {"R":0, "I":0, "A":0, "S":0, "E":0, "C":0})
        narrative = payload.get("narrative", "")
        
        # 1. Trait Normalization
        norm_user_riasec = normalize_riasec(raw_riasec)
        
        # 2. Setup Vector Search
        db_path = os.path.join(os.path.dirname(__file__), "db_storage")
        client = chromadb.PersistentClient(path=db_path)
        collection = client.get_collection(name="careers")
        
        if narrative and len(narrative) > 5:
            # Full semantic search across narrative
            model = SentenceTransformer("all-MiniLM-L6-v2")
            emb = model.encode([narrative])[0].tolist()
            results = collection.query(
                query_embeddings=[emb],
                n_results=1
            )
        else:
            # Fallback if no narrative is provided - just query an empty concept or default to first
            results = collection.get(limit=1)
            # Formatting default result to look like a query result
            results = {
                "ids": [results["ids"]],
                "metadatas": [results["metadatas"]],
                "documents": [results["documents"]]
            }
            
        if not results["ids"][0]:
            raise ValueError("No careers found in Vector DB")
            
        # Top match metadata
        best_match_id = results["ids"][0][0]
        best_match_meta = results["metadatas"][0][0]
        career_name = best_match_meta.get("name", "Unknown Career")
        
        career_riasec = {
            "R": float(best_match_meta.get("R", 0)),
            "I": float(best_match_meta.get("I", 0)),
            "A": float(best_match_meta.get("A", 0)),
            "S": float(best_match_meta.get("S", 0)),
            "E": float(best_match_meta.get("E", 0)),
            "C": float(best_match_meta.get("C", 0))
        }
        
        # 3. Compute Metrics
        rvi_score = calculate_rvi(career_riasec)
        shap_values = generate_shap_values(norm_user_riasec, career_riasec)
        
        # 4. Deep Learning Natural Language Output
        explanation = run_ollama_explanation(career_name, rvi_score, shap_values)
        
        # Success Output
        output = {
            "status": "success",
            "match": career_name,
            "careerId": best_match_id,
            "normalized_user_scores": norm_user_riasec,
            "rvi_automation_risk": rvi_score,
            "eva_shap_importances": shap_values,
            "ai_explanation": explanation
        }
        
        print(json.dumps(output))
        
    except Exception as e:
        err_output = {
            "status": "error",
            "message": str(e)
        }
        print(json.dumps(err_output))

if __name__ == "__main__":
    main()
