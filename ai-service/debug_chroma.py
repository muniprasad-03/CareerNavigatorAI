import sys
import os
import chromadb
import logging

logging.basicConfig(level=logging.INFO)

try:
    db_path = os.path.join(os.getcwd(), "db_storage")
    print(f"Connecting to ChromaDB at {db_path}...")
    client = chromadb.PersistentClient(path=db_path)
    print("Connected.")
    collection = client.get_collection(name="careers")
    print(f"Collection count: {collection.count()}")
except Exception as e:
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()
