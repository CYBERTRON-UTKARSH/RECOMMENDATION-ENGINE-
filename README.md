# Product Recommendation Engine

A full-stack multimodal e-commerce search and product recommendation application built with **FastAPI**, **React**, **Qdrant**, **Cohere**, and **Groq**. Users can search products with natural language queries, filter by category, and click any product to explore similar recommendations powered by dual **text** and **visual** vector embeddings.

---

## Project Description

The **Product Recommendation Engine** enables semantic product discovery and item-to-item recommendations across an e-commerce catalog stored in **Qdrant** (`ecommerce_products` collection). Each product is indexed with two 1536-dimensional named vectors generated via **Cohere `embed-v4.0`**:
- **`text`**: Captures semantic product details (title, category, description/attributes).
- **`visual`**: Captures visual/style embeddings from product imagery.

When a user enters a search query, **Groq** normalizes/refines the query to improve retrieval quality, and **FastAPI** queries Qdrant to return matching products along with a two-step recommendation flow when a user selects an item.

---

## How It Works

1. **Data Ingestion (Offline / Setup Step):**
   - Product catalog items are embedded into 1536-dimensional **`text`** and **`visual`** vectors using Cohere (`embed-v4.0`) and upserted into the Qdrant collection `ecommerce_products` along with product metadata (`title`, `category`, `price`, `image_url`, etc.).
2. **Search Flow (`/search`):**
   - The React frontend sends the user's search text (and optional category filter) to the FastAPI backend.
   - The backend uses Groq to normalize/clean the search query, embeds it with Cohere, and searches Qdrant's `text` vector space (prioritizing exact matches where applicable).
3. **Recommendation Flow (`/recommend`):**
   - When a user clicks a product in the UI, the frontend requests recommendations for that item.
   - The backend queries Qdrant using both named vectors (`text` and `visual`) to surface relevant and visually/semantically aligned products.

---

## Tools & Tech Stack

- **Backend:** Python, FastAPI, Uvicorn, Pillow, `python-multipart`, `python-dotenv`
- **Frontend:** React, JavaScript (JSX), HTML/CSS (`VITE_API_BASE_URL` for API routing)
- **Vector Database:** Qdrant (`ecommerce_products` collection with `text` and `visual` 1536-D named vectors)
- **Embeddings API:** Cohere (`embed-v4.0`)
- **LLM / Query Normalization API:** Groq (e.g., `qwen/qwen3.8-27b`)
- **Deployment (Optional):** Render (FastAPI backend) & Vercel (React frontend)

---

## How to Run This Project Locally

Follow these steps in order if you downloaded or cloned the repository and want to run it from scratch.

### Step 1: Create Your 4 Required API Keys & Cluster Credentials

Create accounts and get credentials for all four required services:
1. **`GROQ_API_KEY`** — From GroqCloud console.
2. **`COHERE_API_KEY`** — From Cohere dashboard.
3. **`QDRANT_URL`** — Your Qdrant Cloud cluster URL (or local/cloud Qdrant endpoint).
4. **`QDRANT_API_KEY`** — Your Qdrant Cloud API key.

Create a `.env` file in your backend directory (do **not** commit `.env` to GitHub):

```env
GROQ_API_KEY=your_groq_api_key_here
COHERE_API_KEY=your_cohere_api_key_here
QDRANT_URL=your_qdrant_url_here
QDRANT_API_KEY=your_qdrant_api_key_here
GROQ_MODEL=qwen/qwen3.8-27b
```

### Step 2: Run the Ingestion Script to Populate Qdrant

Before starting the app for the first time, run your ingestion script so the `ecommerce_products` collection exists and contains your indexed products with `text` and `visual` vectors:

1. Create and activate a Python virtual environment, then install dependencies:
   ```bash
   python -m venv .venv
   # Windows (PowerShell):
   .\.venv\Scripts\Activate.ps1
   # macOS / Linux:
   source .venv/bin/activate

   pip install -r requirements.txt
   ```
2. Run your ingestion script (for example, `ingest.py` or `scripts/ingest_qdrant.py`):
   ```bash
   python ingest.py
   ```
   *(Update the script filename above to match your actual ingestion script path.)*

### Step 3: Run the Backend and Frontend

1. **Start the FastAPI backend** (from your backend folder with the virtual environment active):
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```
   Verify it is running at `http://127.0.0.1:8000/docs`.

2. **Start the React frontend** (in a second terminal inside your frontend folder):
   ```bash
   npm install
   npm run dev
   ```
   *(If your frontend uses a `.env` or `.env.local` file for the API URL, set `VITE_API_BASE_URL=http://127.0.0.1:8000`.)*

3. Open the local URL shown in your frontend terminal (commonly `http://localhost:5173` or `http://localhost:5174`) to test search and recommendations.