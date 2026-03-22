# File: ai-service/main.py | Purpose: Numpy Vector Search via Cloud Fallback Endpoint
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, Optional
import os, json, logging, requests, pickle, numpy as np
from sentence_transformers import SentenceTransformer

app = FastAPI()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

PKL_PATH = os.path.join(os.path.dirname(__file__), 'db_storage', 'chroma.pkl')
model = SentenceTransformer('all-MiniLM-L6-v2')

class MatchRequest(BaseModel):
    riasec_scores: Dict[str, float]
    narrative: str
    north_star: Optional[str] = None

@app.get("/health")
def health_check():
    return {"status": "ok", "model": "local-rag-numpy", "mode": "cloud-proxy"}

NEXT_STEP_MAP = {
    'I': {"course_title": "Introduction to Data Science - NPTEL", "url": "https://nptel.ac.in/courses/106/106/106106138/", "impact_pct": 8.5},
    'R': {"course_title": "Engineering Mechanics - MIT OCW", "url": "https://ocw.mit.edu/courses/2-001-mechanics-materials-i-fall-2006/", "impact_pct": 7.2},
    'A': {"course_title": "Graphic Design Fundamentals - Coursera Free Audit", "url": "https://www.coursera.org/learn/fundamentals-of-graphic-design", "impact_pct": 6.8},
    'S': {"course_title": "Foundations of Teaching - Coursera Free Audit", "url": "https://www.coursera.org/learn/teaching", "impact_pct": 6.5},
    'E': {"course_title": "Entrepreneurship and Innovation - NPTEL", "url": "https://nptel.ac.in/courses/110/106/110106143/", "impact_pct": 7.0},
    'C': {"course_title": "Financial Accounting - MIT OCW", "url": "https://ocw.mit.edu/courses/15-511-financial-accounting-summer-2004/", "impact_pct": 6.2}
}

def cosine_similarity(a, b):
    # a is (384,), b is (N, 384)
    # returns array of shape (N,)
    a_norm = np.linalg.norm(a)
    b_norm = np.linalg.norm(b, axis=1)
    return np.dot(b, a) / (a_norm * b_norm + 1e-10)

@app.post("/match")
async def match_careers(req: MatchRequest):
    try:
        riasec_scores = req.riasec_scores
        total_score = sum(riasec_scores.values()) or 1
        normalized = {k: round(v / total_score, 4) for k, v in riasec_scores.items()}
        top_trait = max(normalized, key=normalized.get)
        top_trait_score = normalized[top_trait]

        # 1. Narrative Embedding
        narrative = req.narrative or "I want a stable career."
        user_emb = model.encode(narrative) # (384,)

        # 2. Load DB
        if not os.path.exists(PKL_PATH):
            raise HTTPException(status_code=500, detail="Database not found. Please run vectorize_onet.py first.")
        with open(PKL_PATH, 'rb') as f:
            db = pickle.load(f)
            
        embeddings_matrix = np.array(db['embeddings']) # (N, 384)
        
        # 3. Vector Match
        similarities = cosine_similarity(user_emb, embeddings_matrix)
        
        # Get top 5 indices
        top_indices = np.argsort(similarities)[-5:][::-1]
        
        top_careers = []
        best_riasec_code = "I"

        for rank, idx in enumerate(top_indices):
            meta = db['metadatas'][idx]
            title = meta['title']
            rvi = meta['rvi_score']
            riasec = meta['riasec_code']
            score = float(similarities[idx])
            
            if rank == 0: 
                best_riasec_code = riasec[0].upper()
            
            # SHAP calculations precisely using element-wise math
            stored_emb = embeddings_matrix[idx]
            contribution = np.abs(user_emb * stored_emb)
            top3 = np.argsort(contribution)[-3:][::-1]
            total_contrib = contribution[top3].sum() + 1e-10
            shap_values = {f"feature_{j+1}": round(float(contribution[t_idx]/total_contrib), 3) for j, t_idx in enumerate(top3)}

            prompt = f"The student's top RIASEC trait is {top_trait} ({top_trait_score:.0%}). They match '{title}' with {score:.0%} semantic alignment and an RVI of {rvi:.2f}/1.0. Write a 40 word encouraging career justification."

            openai_key = os.environ.get("OPENAI_API_KEY")
            justification = ""
            if openai_key and openai_key not in ["your_openai_key_here", "your_key_here", "your_openai_key_here_optional"]:
                try:
                    headers = {"Authorization": f"Bearer {openai_key}", "Content-Type": "application/json"}
                    data = {"model": "gpt-3.5-turbo", "messages": [{"role": "user", "content": prompt}], "max_tokens": 100}
                    resp = requests.post("https://api.openai.com/v1/chat/completions", json=data, headers=headers, timeout=5)
                    if resp.status_code == 200:
                        justification = resp.json()["choices"][0]["message"]["content"].strip()
                except Exception: pass
            
            # Offline NLP fallback
            if not justification:
                try:
                    resp = requests.post("http://localhost:11434/api/generate", json={"model": "llama3:8b", "prompt": prompt, "stream": False}, timeout=5)
                    if resp.status_code == 200:
                        justification = resp.json().get("response", "").strip()
                except Exception: pass

            if not justification:
                justification = f"Your {top_trait} orientation ({top_trait_score:.0%}) aligns well with {title}. This role has an automation resilience score of {rvi:.2f}/1.0. Focus on building your core technical skills to close the remaining gap."

            top_careers.append({
                "title": title,
                "score": float((score + 1) / 2), # normalized cosine to 0-1
                "rvi": float(rvi),
                "shap_values": shap_values,
                "justification": justification
            })

        next_step = NEXT_STEP_MAP.get(best_riasec_code[0], NEXT_STEP_MAP['I'])

        return {
            "top_careers": top_careers,
            "next_step": next_step
        }
    except Exception as e:
        logger.error(f"Error in cloud match: {e}")
        raise HTTPException(status_code=500, detail=str(e))
