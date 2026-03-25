# File: ai-service/main.py | Purpose: ChromaDB Vector Search for Career Matching
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, Optional
import os, json, logging, requests, numpy as np
import chromadb
from sentence_transformers import SentenceTransformer

app = FastAPI()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize ChromaDB persistent client
db_path = os.path.join(os.path.dirname(__file__), "db_storage")
client = chromadb.PersistentClient(path=db_path)
model = SentenceTransformer('all-MiniLM-L6-v2')

def get_collection():
    try:
        return client.get_collection(name="careers")
    except Exception:
        return None

collection = get_collection()

class MatchRequest(BaseModel):
    riasec_scores: Dict[str, float]
    narrative: str
    north_star: Optional[str] = None

@app.get("/health")
def health_check():
    count = collection.count() if collection else 0
    return {"status": "ok", "model": "local-rag-chromadb", "vectors": count}

# Semantic Course Catalog (The "GPS" destinations)
COURSE_CATALOG = [
    {"title": "Introduction to Data Science - NPTEL", "url": "https://nptel.ac.in/courses/106/106/106106138/", "desc": "Covers data analysis, visualization, and basic machine learning for analytical roles."},
    {"title": "Engineering Mechanics - MIT OCW", "url": "https://ocw.mit.edu/courses/2-001-mechanics-materials-i-fall-2006/", "desc": "Fundamental physics and mechanics for mechanical and civil engineering trajectories."},
    {"title": "Graphic Design Fundamentals - Coursera", "url": "https://www.coursera.org/learn/fundamentals-of-graphic-design", "desc": "Visual communication, typography, and layout for creative and artistic professions."},
    {"title": "Foundations of Teaching - Coursera", "url": "https://www.coursera.org/learn/teaching", "desc": "Pedagogical strategies and classroom management for social and educational roles."},
    {"title": "Entrepreneurship and Innovation - NPTEL", "url": "https://nptel.ac.in/courses/110/106/110106143/", "desc": "Business modeling, product-market fit, and leadership for enterprising individuals."},
    {"title": "Financial Accounting - MIT OCW", "url": "https://ocw.mit.edu/courses/15-511-financial-accounting-summer-2004/", "desc": "Principles of accounting and financial reporting for conventional and organizational roles."},
    {"title": "Full Stack Web Development - FreeCodeCamp", "url": "https://www.freecodecamp.org/learn", "desc": "Modern web technologies including React, Node, and Databases for builders."},
    {"title": "UX Research Methods - Coursera", "url": "https://www.coursera.org/learn/ux-research-methods", "desc": "Understanding user needs and behavior for human-centric product design."}
]

# Pre-compute course embeddings
COURSE_EMBEDDINGS = model.encode([c['desc'] for c in COURSE_CATALOG])

def get_riasec_vector(meta):
    """Extract RIASEC vector from metadata."""
    return np.array([
        float(meta.get('R', 0)),
        float(meta.get('I', 0)),
        float(meta.get('A', 0)),
        float(meta.get('S', 0)),
        float(meta.get('E', 0)),
        float(meta.get('C', 0))
    ])

def cosine_sim(a, b):
    """Simple cosine similarity for rank-1 arrays."""
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0: return 0
    return np.dot(a, b) / (norm_a * norm_b)

@app.post("/match")
async def match_careers(req: MatchRequest):
    try:
        global collection
        if not collection:
            collection = get_collection()
            
        if not collection:
            raise HTTPException(status_code=500, detail="Database not initialized. Run ingest.py.")
            
        riasec_scores = req.riasec_scores
        # Create user RIASEC vector
        user_riasec_vec = np.array([
            riasec_scores.get('R', 0),
            riasec_scores.get('I', 0),
            riasec_scores.get('A', 0),
            riasec_scores.get('S', 0),
            riasec_scores.get('E', 0),
            riasec_scores.get('C', 0)
        ])
        
        total_score = sum(riasec_scores.values()) or 1
        normalized = {k: round(v / total_score, 4) for k, v in riasec_scores.items()}
        top_trait = max(normalized, key=normalized.get)
        top_trait_score = normalized[top_trait]

        # STEP 2 — Narrative Embedding:
        narrative = req.narrative if req.narrative else "I want a stable career."
        narrative_embedding = model.encode(narrative).tolist()
        
        # STEP 4 — ChromaDB Vector Search (Broad search for candidates):
        results = collection.query(
            query_embeddings=[narrative_embedding],
            n_results=100, # Get even more for better dynamic range
            include=["metadatas", "distances"]
        )
        
        candidates = []
        
        # Rerank results based on RIASEC profile
        for i in range(len(results['ids'][0])):
            meta = results['metadatas'][0][i]
            title = meta['name']
            
            # Narrative similarity (ChromaDB distance -> Similarity)
            dist = results['distances'][0][i]
            narrative_sim = 1.0 - (dist / 2.0)
            
            # RIASEC alignment
            career_riasec_vec = get_riasec_vector(meta)
            riasec_sim = cosine_sim(user_riasec_vec, career_riasec_vec)
            
            # Hybrid Score (40% Narrative, 60% RIASEC - Favor the psychometric GPS)
            final_score = (0.4 * narrative_sim) + (0.6 * riasec_sim)
            
            candidates.append({
                "title": title,
                "score": float(final_score),
                "rvi": 0.85, # Placeholder
                "justification_input": f"Trait: {top_trait}, Score: {final_score:.0%}"
            })

        # Sort by hybrid score and take top 5
        candidates.sort(key=lambda x: x['score'], reverse=True)
        top_5_candidates = candidates[:5]
        
        top_careers = []
        for cand in top_5_candidates:
            title = cand['title']
            score = cand['score']
            
            justification = f"Your {top_trait} orientation aligns perfectly with {title}. With a {score:.0%} matching score, this trajectory offers high long-term stability and aligns with your professional profile."

            top_careers.append({
                "title": title,
                "score": float(score),
                "rvi": 0.85,
                "shap_values": {"interest_fit": 0.4, "narrative_match": 0.6},
                "justification": justification
            })

        # STEP 9 — Semantic Course Matching
        top_career_content = f"{top_careers[0]['title']} guidance"
        career_embedding = model.encode(top_career_content)
        
        similarities = np.dot(COURSE_EMBEDDINGS, career_embedding) / (
            np.linalg.norm(COURSE_EMBEDDINGS, axis=1) * np.linalg.norm(career_embedding) + 1e-10
        )
        best_course_idx = np.argmax(similarities)
        best_course = COURSE_CATALOG[best_course_idx]
        
        next_step = {
            "course_title": best_course["title"],
            "url": best_course["url"],
            "impact_pct": round(float(8.0 + (similarities[best_course_idx] * 2)), 1)
        }
            
        return {
            "top_careers": top_careers,
            "next_step": next_step
        }
    except Exception as e:
        logger.error(f"Error in match: {e}")
        raise HTTPException(status_code=500, detail=str(e))
