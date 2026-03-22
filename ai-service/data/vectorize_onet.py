import csv, os, numpy as np, pickle
from sentence_transformers import SentenceTransformer

PKL_PATH = os.path.join(os.path.dirname(__file__), '..', 'db_storage', 'chroma.pkl')
CSV_PATH = os.path.join(os.path.dirname(__file__), 'onet_occupations.csv')
RVI_WEIGHTS = { 'R': 0.8, 'I': 0.2, 'A': 0.1, 'S': 0.1, 'E': 0.4, 'C': 0.8 }

def compute_rvi(riasec_code): return round(1.0 - RVI_WEIGHTS.get(riasec_code, 0.5), 2)

def main():
    try:
        with open(CSV_PATH, 'r', encoding='utf-8') as f:
            rows = list(csv.DictReader(f))
    except Exception as e:
        print("Failed to read CSV:", e)
        return

    print("Loading SentenceTransformer...")
    model = SentenceTransformer('all-MiniLM-L6-v2')
    print("Model loaded.")
    
    db = {'ids': [], 'embeddings': [], 'metadatas': [], 'documents': []}
    for i, row in enumerate(rows):
        text = f"{row['title']}. {row['description']}. Tasks: {row['tasks']}. Skills: {row['skills']}"
        db['ids'].append(row['onet_code'])
        db['embeddings'].append(model.encode(text))
        db['metadatas'].append({
            "title": row['title'], "onet_code": row['onet_code'],
            "riasec_code": row['riasec_code'], "rvi_score": compute_rvi(row['riasec_code'])
        })
        db['documents'].append(text)
        if (i+1)%10==0: print(f"Processed {i+1}/{len(rows)}")
    
    os.makedirs(os.path.dirname(PKL_PATH), exist_ok=True)
    with open(PKL_PATH, 'wb') as f: pickle.dump(db, f)
    print(f"Vectorization complete. {len(rows)} embeddings stored via NumPy.")

if __name__ == "__main__": main()
