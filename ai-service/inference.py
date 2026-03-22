# File: ai-service/inference.py | Purpose: Local AI Microservice for Semantic Matching and LLM Explanation
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, Optional
import numpy as np
import requests
import chromadb
from sentence_transformers import SentenceTransformer
import os

app = FastAPI()

# Load model at module level
model = SentenceTransformer('all-MiniLM-L6-v2')

def get_chroma_collection():
    db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "db_storage"))
    client = chromadb.PersistentClient(path=db_path)
    return client.get_or_create_collection(name='careers', metadata={"hnsw:space": "cosine"})

class MatchRequest(BaseModel):
    riasec_scores: Dict[str, float]
    narrative: str
    north_star: Optional[str] = None

@app.get("/health")
def health_check():
    try:
        col = get_chroma_collection()
        count = col.count()
    except Exception:
        count = 0
    return {"status": "ok", "model": "llama3:8b", "mode": "local", "chromadb_count": count}

NEXT_STEP_MAP = {
    'I': {"course_title": "Introduction to Data Science - NPTEL", "url": "https://nptel.ac.in/courses/106/106/106106138/", "impact_pct": 8.5},
    'R': {"course_title": "Engineering Mechanics - MIT OCW", "url": "https://ocw.mit.edu/courses/2-001-mechanics-materials-i-fall-2006/", "impact_pct": 7.2},
    'A': {"course_title": "Graphic Design Fundamentals - Coursera Free Audit", "url": "https://www.coursera.org/learn/fundamentals-of-graphic-design", "impact_pct": 6.8},
    'S': {"course_title": "Foundations of Teaching - Coursera Free Audit", "url": "https://www.coursera.org/learn/teaching", "impact_pct": 6.5},
    'E': {"course_title": "Entrepreneurship and Innovation - NPTEL", "url": "https://nptel.ac.in/courses/110/106/110106143/", "impact_pct": 7.0},
    'C': {"course_title": "Financial Accounting - MIT OCW", "url": "https://ocw.mit.edu/courses/15-511-financial-accounting-summer-2004/", "impact_pct": 6.2}
}

@app.post("/match")
def match_careers(request: MatchRequest):
    try:
        col = get_chroma_collection()
        
        # STEP 1 — RIASEC Normalization:
        riasec_scores = request.riasec_scores
        total = sum(riasec_scores.values())
        if total == 0: total = 1
        normalized = {k: round(v / total, 4) for k, v in riasec_scores.items()}
        riasec_vector = np.array([normalized[k] for k in ['R','I','A','S','E','C']])
        
        top_trait = max(normalized, key=normalized.get)
        top_trait_score = normalized[top_trait]

        # STEP 2 — Narrative Embedding:
        narrative = request.narrative if request.narrative else "I want a stable career."
        narrative_embedding = model.encode(narrative)
        
        # STEP 3 — Identity Fusion:
        identity_vector = np.concatenate([narrative_embedding, riasec_vector])

        # STEP 4 — ChromaDB Query:
        results = col.query(query_embeddings=[narrative_embedding.tolist()], n_results=5)
        
        if not results['ids'] or not results['ids'][0]:
            return {"top_careers": [], "next_step": {}}
            
        top_careers = []
        best_riasec_code = "I"

        for i in range(len(results['ids'][0])):
            onet_code = results['ids'][0][i]
            dist = results['distances'][0][i] if 'distances' in results and results['distances'] else 0.5
            score = 1.0 - dist
            meta = results['metadatas'][0][i]
            title = meta.get('title', 'Unknown Career')
            riasec_code = meta.get('riasec_code', 'I').strip().upper()
            if not riasec_code: riasec_code = 'I'
            if i == 0: best_riasec_code = riasec_code[0]
            
            # STEP 5 — RVI from metadata:
            rvi = float(meta.get('rvi_score', 0.5))

            # STEP 6 — SHAP Proxy:
            stored_data = col.get(ids=[onet_code], include=['embeddings'])
            if stored_data and stored_data['embeddings']:
                stored_embedding = np.array(stored_data['embeddings'][0])
                contribution = np.abs(narrative_embedding * stored_embedding[:384])
                top3_indices = np.argsort(contribution)[-3:][::-1]
                total_contrib = contribution[top3_indices].sum()
                if total_contrib == 0: total_contrib = 1.0
                shap_values = {f"feature_{j+1}": round(float(contribution[idx] / total_contrib), 3) for j, idx in enumerate(top3_indices)}
            else:
                shap_values = {"feature_1": 0.333, "feature_2": 0.333, "feature_3": 0.334}

            # STEP 7 — LLM Justification via Ollama:
            prompt = f"You are a career counselor. The student's top RIASEC trait is {top_trait} ({top_trait_score:.0%}). They match '{title}' with {score:.0%} semantic alignment and an RVI (future-proof score) of {rvi:.2f}/1.0. Write one encouraging paragraph (max 60 words) explaining why this career fits and what specific skill to learn next."
            
            try:
                resp = requests.post("http://localhost:11434/api/generate", json={"model": "llama3:8b", "prompt": prompt, "stream": False}, timeout=10)
                if resp.status_code == 200:
                    justification = resp.json().get("response", "").strip()
                else:
                    raise Exception("Ollama error")
            except Exception:
                # STEP 8 — Ollama fallback:
                justification = f"Your {top_trait} orientation ({top_trait_score:.0%}) aligns well with {title}. This role has an automation resilience score of {rvi:.2f}/1.0. Focus on building your core technical skills to close the remaining gap."

            top_careers.append({
                "title": title,
                "score": float(score),
                "rvi": float(rvi),
                "shap_values": shap_values,
                "justification": justification
            })
            
        top_careers.sort(key=lambda x: x["score"], reverse=True)
        
        # STEP 9 — Next Step lookup
        next_step = NEXT_STEP_MAP.get(best_riasec_code[0], NEXT_STEP_MAP['I'])
            
        return {
            "top_careers": top_careers,
            "next_step": next_step
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    # Using relative imports and setup assuming it's run inside ai-service
    uvicorn.run(app, host="0.0.0.0", port=8000)
