## Quick Start
Commands: npm install at root, cd backend && npm install, pip install -r ai-service/requirements.txt, npm start at root

## Knowledge Ingestion (Run Once Before First Use)
cd ai-service/data && python vectorize_onet.py
Explain: this is what "trains" the system — it populates ChromaDB with career vectors. Takes ~30 seconds. Re-run whenever onet_occupations.csv is updated.

## AI Service Setup
Local mode: Install Ollama from ollama.com, run: ollama pull llama3:8b-instruct-q4_K_M, then: cd ai-service && python inference.py
Cloud mode: Set OPENAI_API_KEY in .env, set AI_ENDPOINT_URL=http://localhost:8000/match, run: uvicorn main:app --port 8000

## Switching AI Modes
One line in backend/.env: AI_ENDPOINT_URL=http://localhost:8000/match

## User Journey
Register → Login → Dashboard → Take Assessment (30 questions + narrative) → View Recommendations → Click career for detail view → Save to Favourites

## Known Issues
List: Ollama must be running before starting inference.py. ChromaDB must be populated before any /match calls return results. Full O*NET dataset (900+ careers) can be downloaded from onetcenter.org to replace the sample CSV.
