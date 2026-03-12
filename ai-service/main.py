from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import openai
import os
from dotenv import load_dotenv

load_dotenv()

openai.api_key = os.getenv("OPENAI_API_KEY", "your_openai_api_key_here")

app = FastAPI()

class UserProfile(BaseModel):
    R: float
    I: float
    A: float
    S: float
    E: float
    C: float

class CareerProfile(BaseModel):
    id: str
    name: str
    profile: Dict[str, float]

class MatchRequest(BaseModel):
    user_profile: UserProfile
    careers: List[CareerProfile]

class ExplainRequest(BaseModel):
    user_profile: UserProfile
    career_name: str

@app.post("/riasec/score")
def score_riasec(answers: List[Dict[str, float]]):
    # Fallback endpoint if needed
    scores = {"R": 0, "I": 0, "A": 0, "S": 0, "E": 0, "C": 0}
    for ans in answers:
        if ans["category"] in scores:
            scores[ans["category"]] += ans["score"]
    return scores

@app.post("/career/match")
def match_careers(request: MatchRequest):
    user_vec = np.array([[
        request.user_profile.R,
        request.user_profile.I,
        request.user_profile.A,
        request.user_profile.S,
        request.user_profile.E,
        request.user_profile.C
    ]])

    results = []
    for c in request.careers:
        career_vec = np.array([[
            c.profile["R"],
            c.profile["I"],
            c.profile["A"],
            c.profile["S"],
            c.profile["E"],
            c.profile["C"]
        ]])
        score = cosine_similarity(user_vec, career_vec)[0][0]
        results.append({
            "id": c.id,
            "name": c.name,
            "score": float(score)
        })

    # Sort and return top 5
    results.sort(key=lambda x: x["score"], reverse=True)
    return {"matches": results[:5]}

@app.post("/explain")
def explain_career(request: ExplainRequest):
    prompt = f"""
    User RIASEC profile:
    Realistic: {request.user_profile.R}
    Investigative: {request.user_profile.I}
    Artistic: {request.user_profile.A}
    Social: {request.user_profile.S}
    Enterprising: {request.user_profile.E}
    Conventional: {request.user_profile.C}

    Recommended career: {request.career_name}

    Explain why this career fits the user in 2-3 sentences.
    """
    
    try:
        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a career counselor."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=150
        )
        explanation = response.choices[0].message.content.strip()
        return {"explanation": explanation}
    except Exception as e:
        return {"explanation": "Explanation could not be generated at this time. " + str(e)}

