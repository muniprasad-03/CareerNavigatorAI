import pickle
import os

def check_db():
    pkl_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'db_storage', 'chroma.pkl')
    if not os.path.exists(pkl_path):
        print("Database not found!")
        return 0
    with open(pkl_path, 'rb') as f:
        db = pickle.load(f)
    return len(db.get('embeddings', []))

if __name__ == "__main__":
    count = check_db()
    if count > 0:
        print(f"SUCCESS: verified {count} vectors in db_storage.")
    else:
        print("FAILED: vector count is 0.")
