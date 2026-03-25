# ROADMAP.md

> **Current Milestone**: AI-Core-Integration
> **Goal**: Integrate a completely local, zero-cost AI stack (ChromaDB + Ollama) with the MERN application.

## Must-Haves
- [x] Working MiniLM-L6-v2 embeddings stored in ChromaDB
- [x] Implement Trait Normalization math algorithm in Python
- [x] Implement Resilience-Volatility Index (RVI) calculation
- [x] Implement SHAP-based EVA Engine (MERN + Ollama integration)
- [x] Seamless Sub-process integration bridge between Node.js and Python

## Phases

### Phase 1: Vector DB Population
**Status**: ✅ Verified & Complete
**Objective**: Set up the Python environment, download the MiniLM sentence transformer model, establish the local ChromaDB semantic index, and populate it with our 50 careers text data.

### Phase 2: RVI and SHAP Logic
**Status**: ✅ Verified & Complete
**Objective**: Develop the RVI automation risk calculation module and the SHAP visual explainer module. Set up local Ollama (Llama-3) to read the SHAP values and output a natural language story.

### Phase 3: MERN-to-Python Bridge
**Status**: ✅ Verified & Complete
**Objective**: Refactor the React frontend to accept narrative input and RIASEC sliders. Rewrite the Node.js backend routes to spawn the Python process securely and parse its JSON results back to the React UI via Ralph Loop validation.

### Phase 4: Knowledge Ingestion & AI Pipeline Validation
**Status**: ✅ Completed
**Objective**: Successfully run the vectorization pipeline to populate ChromaDB and verify local AI matching logic.

### Phase 5: Backend API Proxy Integration
**Status**: ✅ Completed
**Objective**: Update the Node.js backend to accurately accept frontend payloads, proxy them to the AI microservice, and handle timeouts.

### Phase 6: Frontend Wiring & UI Completeness
**Status**: ✅ Completed
**Objective**: Connect the RIASEC assessment flow to the backend, render real recommendation cards, and build out the detailed UI.

### Phase 7: CORS Configuration & Smoke Testing
**Status**: ✅ Completed
**Objective**: Secure the application for cross-origin production requests and validate the entire local stack pipeline.

### Phase 8: Production Deployment & Verification
**Status**: ✅ Completed
**Objective**: Execute deployment checklists for Render and Vercel, inject environment variables, and perform live E2E testing.
