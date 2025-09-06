import os
import pandas as pd
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import subprocess

# Create a FastAPI app
app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/update-penalties")
def update_penalties():
    """
    Run the add_penalties.py script to update the reasons.csv file with penalties
    and return the metrics for display in the UI.
    """
    try:
        # Get the directory containing this file
        current_dir = os.path.dirname(os.path.abspath(__file__))
        base_dir = os.path.dirname(current_dir)  # Up one level to pipeline_v2
        
        # Run the add_penalties.py script
        script_path = os.path.join(current_dir, "add_penalties.py")
        result = subprocess.run(["python", script_path], capture_output=True, text=True)
        
        if result.returncode != 0:
            raise HTTPException(status_code=500, detail=f"Error running script: {result.stderr}")
        
        # Load the metrics
        metrics_path = os.path.join(base_dir, "uploads", "penalty_metrics.csv")
        if not os.path.exists(metrics_path):
            raise HTTPException(status_code=404, detail="Metrics file not found")
        
        metrics_df = pd.read_csv(metrics_path)
        if len(metrics_df) == 0:
            raise HTTPException(status_code=500, detail="Metrics file is empty")
            
        metrics = metrics_df.iloc[0].to_dict()
        
        return {
            "status": "success",
            "message": "Penalties updated successfully",
            "metrics": metrics,
            "script_output": result.stdout
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
