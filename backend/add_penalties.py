import os
import pandas as pd
import numpy as np
import random

def main():
    print("Adding penalty columns to reasons.csv...")
    
    # Define paths
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # Go up one level to pipeline_v2
    reasons_path = os.path.join(base_dir, "uploads", "reasons.csv")
    penalties_path = os.path.join(base_dir, "uploads", "penalties.csv")
    output_path = os.path.join(base_dir, "uploads", "reasons_with_penalties.csv")
    
    print(f"Reading reasons from: {reasons_path}")
    print(f"Reading penalties from: {penalties_path}")
    
    # Read CSV files
    reasons_df = pd.read_csv(reasons_path)
    penalties_df = pd.read_csv(penalties_path)
    
    print(f"Found {len(reasons_df)} rows in reasons.csv")
    print(f"Found {len(penalties_df)} rows in penalties.csv")
    
    # Create a mapping of PO_ID to Penalty_Amount from penalties.csv
    penalty_map = {}
    for _, row in penalties_df.iterrows():
        penalty_map[row["PO_ID"]] = row["Penalty_Amount"]
    
    # Generate penalties for all reasons except "no reason"
    reasons_df["penalty"] = 0.0
    
    for idx, row in reasons_df.iterrows():
        po_id = row["PO_ID"]
        reason = row["reason"]
        
        # Skip "no reason" entries
        if reason.lower() == "no reason":
            continue
        
        # If PO exists in penalties.csv, use that amount
        if po_id in penalty_map:
            reasons_df.at[idx, "penalty"] = penalty_map[po_id]
        else:
            # Generate random penalty amount between 100 and 1000 (rounded to 2 decimal places)
            random_penalty = round(random.uniform(100, 1000), 2)
            reasons_df.at[idx, "penalty"] = random_penalty
    
    # Save the updated DataFrame to a new CSV file
    reasons_df.to_csv(output_path, index=False)
    
    # Also update the original reasons.csv file
    reasons_df.to_csv(reasons_path, index=False)
    
    # Calculate statistics for reporting
    total_penalty = reasons_df["penalty"].sum()
    not_matched_penalty = reasons_df[
        (reasons_df["penalty"] > 0) & 
        (reasons_df["reason"].str.lower() != "no reason") & 
        (~reasons_df["PO_ID"].isin(penalties_df["PO_ID"]))
    ]["penalty"].sum()
    
    print(f"Updated reasons.csv with penalty column")
    print(f"Total penalty claimed: ${total_penalty:,.2f}")
    print(f"Penalty that can be saved (not matched): ${not_matched_penalty:,.2f}")
    
    # Save these metrics to a file for easy retrieval by the frontend
    metrics = {
        "total_penalty": total_penalty,
        "not_matched_penalty": not_matched_penalty
    }
    
    metrics_df = pd.DataFrame([metrics])
    metrics_path = os.path.join(base_dir, "uploads", "penalty_metrics.csv")
    metrics_df.to_csv(metrics_path, index=False)
    print(f"Saved penalty metrics to {metrics_path}")
    
    return reasons_df

if __name__ == "__main__":
    main()
