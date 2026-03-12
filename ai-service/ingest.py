import os
import chromadb
from sentence_transformers import SentenceTransformer
import warnings
import urllib3
import json

# Suppress warnings for cleaner bridge output
warnings.filterwarnings('ignore')
urllib3.disable_warnings()

# Using MiniLM-L6-v2, an extremely lightweight but capable and free local model
model_name = "all-MiniLM-L6-v2"
model = SentenceTransformer(model_name)

# Initialize ChromaDB persistent client 
db_path = os.path.join(os.path.dirname(__file__), "db_storage")
client = chromadb.PersistentClient(path=db_path)

# Prepare or reset the collection
try:
    client.delete_collection(name="careers")
except Exception:
    pass

collection = client.create_collection(
    name="careers",
    metadata={"hnsw:space": "cosine"} # Use cosine similarity for the HNSW index
)

# Load careers from the localized dump file created from MongoDB
try:
    dump_path = os.path.join(os.path.dirname(__file__), "../backend/careers_data.json")
    with open(dump_path, 'r') as f:
        raw_careers = json.load(f)
    
    careers = []
    for c in raw_careers:
        careers.append({
            "id": c["_id"],
            "name": c["name"],
            "desc": c.get("description", f"Professional working as a {c['name']}"),
            "R": c["riasecProfile"]["R"],
            "I": c["riasecProfile"]["I"],
            "A": c["riasecProfile"]["A"],
            "S": c["riasecProfile"]["S"],
            "E": c["riasecProfile"]["E"],
            "C": c["riasecProfile"]["C"]
        })
except Exception as e:
    print(f"Error loading dump file: {e}")
    exit(1)

if __name__ == "__main__":
    print(f"Loading {len(careers)} items into local ChromaDB storage...")
    
    docs = []
    metadatas = []
    ids = []
    embeddings = []
    
    # Pre-compute the embeddings based on Job Title + Description
    for c in careers:
        content = f"{c['name']}: {c['desc']}"
        docs.append(content)
        metadatas.append({"name": c["name"], "R": c["R"], "I": c["I"], "A": c["A"], "S": c["S"], "E": c["E"], "C": c["C"]})
        ids.append(c["id"])
    
    print("Computing vectors with MiniLM-L6-v2... (This downloads the model on first run)")
    embs = model.encode(docs)
    
    print("Inserting data into ChromaDB...")
    collection.add(
        documents=docs,
        embeddings=embs.tolist(),
        metadatas=metadatas,
        ids=ids
    )
    
    print(f"Success! ChromaDB successfully created at {db_path} containing {collection.count()} vectors.")
