from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from ml.anomaly_model import GSTAnomalyDetector

# 1. Initialize the app
app = FastAPI(title="Bug Slayers - GST Anomaly API")

# 2. Setup CORS (Crucial so Next.js on port 3000 can talk to FastAPI on port 8000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For production, change to ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Initialize our ML model (This runs the training step once when the server boots)
print("Initializing ML Model... Please wait.")
detector = GSTAnomalyDetector()
print("ML Model Ready!")

# --- API ENDPOINTS ---

@app.get("/")
def read_root():
    return {"message": "Bug Slayers API is running smoothly!"}

@app.get("/api/scan")
def get_all_businesses():
    """Returns a ranked list of all businesses for the main dashboard."""
    data = detector.get_all_scans()
    return {"status": "success", "total_records": len(data), "data": data}

@app.get("/api/business/{business_id}")
def get_single_business(business_id: str):
    """Returns deep-dive data for a single business (for the Drill-down page)."""
    data = detector.get_business_details(business_id)
    if not data:
        raise HTTPException(status_code=404, detail="Business not found")
    
    return {"status": "success", "data": data}