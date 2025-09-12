from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
import os
import pandas as pd
import json
import sys
import io
import re
from dotenv import load_dotenv
import google.generativeai as genai
import numpy as np
import random  # Added for penalty generation

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Pipeline v2 API is running."}

@app.post("/calculate-penalties")
def calculate_penalties():
    """
    Calculate penalty metrics based on reason validation results.
    Returns total penalty claimed and penalty that can be saved (not matched).
    """
    try:
        # Get the directory containing this file
        current_dir = os.path.dirname(os.path.abspath(__file__))
        parent_dir = os.path.dirname(current_dir)  # Go up one level
        uploads_path = os.path.join(parent_dir, "uploads")
        
        # Read reasons.csv file with existing penalty values
        reasons_path = os.path.join(uploads_path, "reasons.csv")
        print(f"Reading penalty data from: {reasons_path}")
        
        if not os.path.exists(reasons_path):
            print(f"ERROR: Reasons file not found at {reasons_path}")
            return {"status": "error", "message": f"Reasons file not found at {reasons_path}"}
        
        reasons_df = pd.read_csv(reasons_path)
        print(f"Loaded {len(reasons_df)} rows from reasons.csv")
        print(f"Sample penalty data: \n{reasons_df[['PO_ID', 'reason', 'penalty']].head(10)}")
        
        # Read validation results
        validation_results_path = os.path.join(current_dir, "final_reason_validation_results.csv")
        print(f"Reading validation results from: {validation_results_path}")
        
        if os.path.exists(validation_results_path):
            validation_df = pd.read_csv(validation_results_path)
            print(f"Loaded {len(validation_df)} rows from validation results")
            print(f"Sample validation data: \n{validation_df.head(10)}")
        else:
            print(f"ERROR: Validation results file not found at {validation_results_path}")
            return {"status": "error", "message": "Validation results file not found"}
        
        # Calculate penalty metrics from existing penalty column
        total_penalty = reasons_df["penalty"].astype(float).sum()
        
        # Prepare for case-insensitive merge by creating normalized columns
        reasons_df["reason_lower"] = reasons_df["reason"].str.strip().str.lower()
        validation_df["stated_reason_lower"] = validation_df["stated_reason"].str.strip().str.lower()
        
        print(f"Normalized reasons sample: \n{reasons_df[['PO_ID', 'reason', 'reason_lower']].head(5)}")
        print(f"Normalized validation sample: \n{validation_df[['PO_ID', 'stated_reason', 'stated_reason_lower']].head(5)}")
        
        # Calculate potentially saved penalties (not match cases)
        # Supplier charged but it's not correct (Match/Not = False), so these can be saved
        merged_df = pd.merge(
            reasons_df, 
            validation_df, 
            left_on=["PO_ID", "reason_lower"], 
            right_on=["PO_ID", "stated_reason_lower"], 
            how="inner"
        )
        
        print(f"Merged data contains {len(merged_df)} rows")
        print(f"Merged sample: \n{merged_df[['PO_ID', 'reason', 'stated_reason', 'Match/Not', 'penalty']].head(10)}")
        
        # Convert the Match/Not column values to proper boolean or string representation
        merged_df["Match/Not_bool"] = merged_df["Match/Not"].astype(str).apply(
            lambda x: x.lower() != "true" and x.lower() != "n/a"
        )
        
        # Print debugging information
        print("Merged DataFrame for penalty calculation:")
        print(merged_df[["PO_ID", "reason", "stated_reason", "Match/Not", "penalty"]].head(10))
        
        # Make sure penalties are treated as numbers
        merged_df["penalty"] = merged_df["penalty"].astype(float)
        
        # Penalties that can be saved are those where Match/Not is False
        saveable_penalties = merged_df[merged_df["Match/Not_bool"]]["penalty"].astype(float).sum()
        
        # Print totals for debugging
        print(f"Total penalty: {total_penalty}")
        print(f"Saveable penalties: {saveable_penalties}")
        
        # Create metrics
        metrics = {
            "total_penalty_claimed": round(float(total_penalty), 2),
            "penalty_that_can_be_saved": round(float(saveable_penalties), 2),
            "percentage_saveable": round((saveable_penalties / total_penalty * 100) if total_penalty > 0 else 0, 1)
        }
        
        return {
            "status": "success",
            "metrics": metrics
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/run-tagging")
def run_tagging():
    print("\n=== Starting run-tagging endpoint ===")
    import chromadb
    load_dotenv()
    print("✓ Environment loaded")
    current_dir = os.path.dirname(os.path.abspath(__file__))  # Get the directory containing main.py
    parent_dir = os.path.dirname(current_dir)  # Go up one level to pipeline_v2
    UPLOADS_PATH = os.path.join(parent_dir, "uploads")  # Use pipeline_v2/uploads
    print(f"Using uploads path: {UPLOADS_PATH}")
    
    BUSINESS_DOCS_PATH = os.path.join(UPLOADS_PATH, "business_docs.md")
    METADATA_TXT_PATH = os.path.join(UPLOADS_PATH, "metadata.txt")
    ALL_METADATA_JSON_PATH = os.path.join(UPLOADS_PATH, "all_metadata.json")
    uploaded_files = ["pos", "asns", "grns", "invoices", "payments"]
    CHROMA_DIR = "chroma_db"

    def get_business_docs():
        if os.path.exists(BUSINESS_DOCS_PATH):
            with open(BUSINESS_DOCS_PATH, "r", encoding="utf-8") as f:
                return f.read()
        return ""

    def get_metadata_txt():
        if os.path.exists(METADATA_TXT_PATH):
            with open(METADATA_TXT_PATH, "r", encoding="utf-8") as f:
                return f.read()
        return ""

    # ChromaDB setup
    print("Setting up ChromaDB...")
    client = chromadb.PersistentClient(path=CHROMA_DIR)
    collection = client.get_or_create_collection("supply_chain_metadata")
    print("✓ ChromaDB ready")

    # Index metadata
    print("Indexing metadata...")
    all_metadata = []
    for name in uploaded_files:
        file_path = os.path.join(UPLOADS_PATH, f"{name}.csv")
        if os.path.exists(file_path):
            df = pd.read_csv(file_path)
            columns = list(df.columns)
            sample_rows = df.head(3).to_dict(orient="records")
            metadata = {
                "dataset": name,
                "columns": columns,
                "sample": sample_rows
            }
            all_metadata.append(metadata)
            collection.add(
                documents=[str(metadata)],
                metadatas=[{"dataset": name}],
                ids=[name]
            )
    # Ensure uploads directory exists before writing
    os.makedirs(os.path.dirname(ALL_METADATA_JSON_PATH), exist_ok=True)
    with open(ALL_METADATA_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(all_metadata, f, indent=2, ensure_ascii=False)

    # Prepare LLM context
    print("Preparing LLM context...")
    business_docs = get_business_docs()
    metadata_txt = get_metadata_txt()
    metadatas = collection.get(ids=None)["documents"]
    metadata_dict = {}
    for doc in metadatas:
        try:
            meta = eval(doc) if isinstance(doc, str) else doc
            dataset = meta.get("dataset")
            if dataset:
                metadata_dict[dataset] = meta
        except Exception:
            continue
    dfs = {}
    print(f"Current working directory: {os.getcwd()}")
    print(f"Loading files from: {UPLOADS_PATH}")
    for name in uploaded_files:
        file_path = os.path.join(UPLOADS_PATH, f"{name}.csv")
        print(f"Looking for file: {file_path}")
        if os.path.exists(file_path):
            print(f"✓ Loading {name} DataFrame from {file_path}")
            dfs[name] = pd.read_csv(file_path)
            print(f"✓ Successfully loaded {name} DataFrame with {len(dfs[name])} rows")
        else:
            print(f"❌ File not found: {file_path}")

    context = (
        "You are a supply chain reconciliation analyst. Reference the following business rules, metadata, and dataset descriptions. "
        "Write Python pandas code that loads the actual dataframes (already loaded as variables named pos, grns, invoices, payments, asns), "
        "applies all business rules from the docs and metadata, and outputs a DataFrame named result_df with columns PO_ID, reason, Comments. "
        "Use consistent variable names throughout the code. The final output must be a DataFrame named result_df. Only use columns that are present in the sample data and listed columns. "
        "Infer a standardized set of reason buckets from the business rules and data. For each PO, reasons should be a comma-separated list of these buckets (no duplicates). "
        "Comments should provide concise explanations for each reason, in the same order, separated by semicolons. Each comment should be 1-2 lines max. "
        "When using pandas aggregation (agg, groupby().agg), always specify both the column and a valid aggregation function (e.g. sum, mean, count). Do not use agg or groupby().agg without proper arguments. "
        "Before using any column, check that it exists in the dataframe (see df.columns.tolist()). If a required column is missing, skip that logic or log a warning. "
        "For each PO, only tag reasons that are strictly supported by the data. Do not add a reason unless the PO's data clearly matches the business rule for that reason. Only include reasons and comments that are strictly applicable. "
        "Do NOT use DataFrame.append(). Instead, build a list of dictionaries and use pd.DataFrame(list_of_dicts) at the end. Alternatively, use pd.concat() if combining DataFrames. Only output the code, nothing else.\n\n"
    )
    context += "Business Rules:\n" + business_docs + "\n\n"
    context += "Dataset Descriptions:\n" + metadata_txt + "\n\n"
    for table, meta in metadata_dict.items():
        context += f"Table: {table}\nColumns from metadata: {meta.get('columns')}\nSample rows from metadata: {meta.get('sample')}\n\n"
    for table, df in dfs.items():
        context += f"Actual columns in {table}: {df.columns.tolist()}\nSample data from {table}:\n{df.head(50).to_csv(index=False)}\n\n"
    prompt = context + "\n# Python pandas code below:\n"

    # LLM call
    print("Making LLM call...")
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel(GEMINI_MODEL)
    response = model.generate_content(prompt)
    print("✓ LLM response received")
    code_str = response.text
    code_str = re.sub(r'```python\s*', '', code_str)
    code_str = re.sub(r'```', '', code_str)
    if 'import pandas as pd' not in code_str:
        code_str = 'import pandas as pd\n' + code_str
    print(dfs)
        
    # Create local variables for each DataFrame
    print("Setting up execution environment...")
    local_vars = {}
    local_vars['pd'] = pd
    local_vars['result_df'] = None
    # Ensure all required DataFrames are present, even if empty
    required_dfs = ['pos', 'grns', 'invoices', 'payments', 'asns']
    for name in required_dfs:
        if name in dfs:
            local_vars[name] = dfs[name]
            print(f"✓ Loaded {name} DataFrame with {len(dfs[name])} rows")
        else:
            local_vars[name] = pd.DataFrame()
            print(f"⚠️ {name} DataFrame not found, using empty DataFrame.")
    old_stdout = sys.stdout
    sys.stdout = io.StringIO()
    try:
        exec(code_str, {'pd': pd}, local_vars)
        output = sys.stdout.getvalue()
    finally:
        sys.stdout = old_stdout
    result_df = local_vars.get('result_df')
    

    if result_df is not None:
        print("Processing results and creating output files...")
        # --- Ensure every PO in pos.csv is included, even if not tagged ---
        all_pos = dfs["pos"]["PO_ID"].unique().tolist() if "pos" in dfs and "PO_ID" in dfs["pos"].columns else []
        tagged_pos = set(result_df["PO_ID"].tolist())
        missing_pos = [po for po in all_pos if po not in tagged_pos]
        # Add missing POs with 'No issues'
        if missing_pos:
            no_issues_rows = [{"PO_ID": po, "reason": "No issues", "Comments": "No issues detected for this PO."} for po in missing_pos]
            result_df = pd.concat([result_df, pd.DataFrame(no_issues_rows)], ignore_index=True)
        result_df = result_df.sort_values("PO_ID").reset_index(drop=True)
        result_df.to_csv("agent_po_reasons_new1.csv", index=False)
        # Only create binary reason bucket file for tagging reasons (no alerts, penalties, disputes, reconciliation)
        all_reasons = set()
        for reasons in result_df["reason"]:
            for r in [x.strip() for x in reasons.split(",")]:
                if r:
                    all_reasons.add(r)
        # Always include 'No issues' as a possible reason
        all_reasons.add("No issues")
        reason_cols = sorted(list(all_reasons))
        bin_rows = []

        # Only process if result_df is not empty
        if not result_df.empty:
            for _, row in result_df.iterrows():
                bin_row = {"PO_ID": row["PO_ID"]}
                row_reasons = [x.strip() for x in row["reason"].split(",")]
                row_comments = [x.strip() for x in row["Comments"].split(";")]
                for rc in reason_cols:
                    bin_row[rc] = "y" if rc in row_reasons else "n"
                    if rc in row_reasons:
                        reason_idx = row_reasons.index(rc)
                        comment_val = row_comments[reason_idx] if reason_idx < len(row_comments) else ""
                    else:
                        comment_val = ""
                    bin_row[f"comments_{rc}"] = comment_val
                bin_rows.append(bin_row)
            bin_df = pd.DataFrame(bin_rows)
            bin_df.to_csv("agent_po_reasons_binary.csv", index=False)
            print("✓ Binary reason buckets file created")
            filtered= bin_df.copy()
            po_reason_list = []
            for _, row in filtered.iterrows():
                issue_reason_cols = [c for c in reason_cols if c != "No issues"]
                reasons = [reason for reason in issue_reason_cols if row[reason] == "y"]
                po_reason_list.append({"PO_ID": row["PO_ID"], "list_of_reasons": ", ".join(reasons) if reasons else "No issues"})
            po_reason_list_df = pd.DataFrame(po_reason_list)
            po_reason_list_df.to_csv("filtered_po_reason_list.csv", index=False)
            print("✓ PO reason list file created")

            # Table 2: PO_ID, reason, comments (one row per reason per PO)
            print("Creating PO comments table...")
            po_reason_comments = []
            for _, row in filtered.iterrows():
                issue_reason_cols = [c for c in reason_cols if c != "No issues"]
                reasons = [reason for reason in issue_reason_cols if row[reason] == "y"]
                comments = [row[f"comments_{reason}"] for reason in reasons]
                for reason, comment in zip(reasons, comments):
                    po_reason_comments.append({"PO_ID": row["PO_ID"], "reason": reason, "comments": comment})
                # If no issues, add No issues row
                if not reasons and "No issues" in row and row["No issues"] == "y":
                    po_reason_comments.append({"PO_ID": row["PO_ID"], "reason": "No issues", "comments": row.get("comments_No issues", "")})
            po_reason_comments_df = pd.DataFrame(po_reason_comments)
            po_reason_comments_df.to_csv("filtered_po_reason_comments.csv", index=False)
            print("✓ PO comments file created")
            print("=== Completed run-tagging successfully ===\n")
        else:
            print("Result DataFrame is empty. Skipping file creation.")

        # Convert DataFrames to dicts for JSON serialization
        bin_df_dict = bin_df.to_dict(orient='records')
        po_reason_comments_dict = po_reason_comments_df.to_dict(orient='records')
        po_reason_list_dict = po_reason_list_df.to_dict(orient='records')

        return {
            "status": "success", 
            "bin_df": bin_df_dict,
            "po_reason_comments_df": po_reason_comments_dict,
            "po_reason_list_df": po_reason_list_dict
        }
    else:
        print("❌ Error: No result_df generated")
        return {"status": "error", "message": "No result_df generated."}

@app.post("/run-validation")
def run_validation():
    print("\n=== Starting run-validation endpoint ===")
    load_dotenv()
    print("✓ Environment loaded")
    current_dir = os.path.dirname(os.path.abspath(__file__))  # Get the directory containing main.py
    parent_dir = os.path.dirname(current_dir)  # Go up one level to pipeline_v2
    UPLOADS_PATH = os.path.join(parent_dir, "uploads")  # Use pipeline_v2/uploads
    print(f"Using uploads path: {UPLOADS_PATH}")

    REASONS_FILE = os.path.join(UPLOADS_PATH, "reasons.csv")
    REASONS_VALIDATION_DIR = os.path.join(parent_dir, "reasons_validation")  # Now using pipeline_v2/reasons_validation
    # Create reasons_validation directory if it doesn't exist
    os.makedirs(REASONS_VALIDATION_DIR, exist_ok=True)
    BUCKETS_JSON = os.path.join(REASONS_VALIDATION_DIR, "reason_buckets.json")
    BUCKET_DATASETS_JSON = os.path.join(REASONS_VALIDATION_DIR, "bucket_datasets.json")
    METADATA_TXT = os.path.join(UPLOADS_PATH, "metadata.txt")
    ALL_METADATA_JSON = os.path.join(UPLOADS_PATH, "all_metadata.json")
    DATA_DIR = UPLOADS_PATH
    import google.generativeai as genai

    # Load reasons
    reasons_df = pd.read_csv(REASONS_FILE)
    unique_reasons = set(reasons_df["reason"].dropna().unique())
    unique_reasons.discard("")

    # Load existing buckets
    if os.path.exists(BUCKETS_JSON):
        with open(BUCKETS_JSON, "r", encoding="utf-8") as f:
            reason_buckets = json.load(f)
    else:
        reason_buckets = {}

    # Find new reasons to bucket
    print("Finding new reasons to bucket...")
    new_reasons = [r for r in unique_reasons if r not in reason_buckets]
    print(f"✓ Found {len(new_reasons)} new reasons")

    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel(GEMINI_MODEL)

    if new_reasons:
        prompt = (
            "Group the following supply chain anomaly reasons into specific, actionable buckets (e.g., 'Late Delivery Issue', 'Quantity Mismatch', 'Invoice Overcharge'). "
            "Return a JSON mapping of each reason to its most specific bucket.\n"
            f"Reasons: {new_reasons}\n"
            "Example output: {\"shipment arrived late\": \"Late Delivery Issue\", ...}"
        )
        response = model.generate_content(prompt)
        match = re.search(r'{.*}', response.text, re.DOTALL)
        if match:
            new_buckets = json.loads(match.group(0))
            reason_buckets.update(new_buckets)
        else:
            return {"status": "error", "message": "LLM did not return valid JSON for buckets."}

    # Save updated buckets
    with open(BUCKETS_JSON, "w", encoding="utf-8") as f:
        json.dump(reason_buckets, f, indent=2, ensure_ascii=False)

    # Load reason buckets
    with open(BUCKETS_JSON, "r", encoding="utf-8") as f:
        reason_buckets = json.load(f)

    # Find unique buckets
    unique_buckets = set()
    for v in reason_buckets.values():
        unique_buckets.add(v if isinstance(v, str) else v.get("bucket", v))

    # Load metadata
    print("Loading metadata...")
    with open(os.path.join(UPLOADS_PATH, "metadata.txt"), "r", encoding="utf-8") as f:
        metadata_txt = f.read()
    with open(os.path.join(UPLOADS_PATH, "all_metadata.json"), "r", encoding="utf-8") as f:
        all_metadata = json.load(f)
    print("✓ Metadata loaded")

    # Initialize empty bucket_datasets structure
    bucket_datasets = {}

    # --- Final result generation logic from reasons_validation.py ---
    # This is a simplified version; you can expand as needed
    # Load mapping and metadata files
    if os.path.exists(BUCKETS_JSON):
        with open(BUCKETS_JSON, "r", encoding="utf-8") as f:
            reason_buckets = json.load(f)
    if os.path.exists(BUCKET_DATASETS_JSON):
        with open(BUCKET_DATASETS_JSON, "r", encoding="utf-8") as f:
            bucket_datasets = json.load(f)
    if os.path.exists(ALL_METADATA_JSON):
        with open(ALL_METADATA_JSON, "r", encoding="utf-8") as f:
            all_metadata = json.load(f)
    if os.path.exists(METADATA_TXT):
        with open(METADATA_TXT, "r", encoding="utf-8") as f:
            metadata_txt = f.read()

    # Read reasons.csv as the only source of PO_ID/reason pairs to validate
    reasons_df = pd.read_csv(REASONS_FILE)

    # Load raw_reason_map for normalization
    def load_json_file(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    raw_reason_map = {}
    raw_reason_map_path = os.path.join(UPLOADS_PATH, "raw_reason_map.json")
    if os.path.exists(raw_reason_map_path):
        raw_reason_map = load_json_file(raw_reason_map_path)

    # Lowercase and strip keys in reason_buckets for robust mapping
    reason_buckets_lc = {k.strip().lower(): v for k, v in reason_buckets.items()}

    # Normalize reasons before mapping to buckets (lowercase, strip)
    def normalize_reason(reason):
        return raw_reason_map.get(str(reason).strip().lower(), reason).strip().lower()

    reasons_df["normalized_reason"] = reasons_df["reason"].apply(normalize_reason)
    reasons_df["bucket"] = reasons_df["normalized_reason"].map(reason_buckets_lc)

    final_results = []
    
    # Convert all_metadata to a dict mapping dataset name to columns
    metadata_map = {}
    if isinstance(all_metadata, list):
        for entry in all_metadata:
            if isinstance(entry, dict) and 'dataset' in entry and 'columns' in entry:
                metadata_map[entry['dataset']] = entry['columns']
    else:
        metadata_map = all_metadata

    for bucket, group_df in reasons_df.groupby("bucket"):
        # If the bucket is for 'no reason', skip LLM and output default result
        if bucket is None or (isinstance(bucket, str) and bucket.strip().lower() == 'no reason'):
            for _, row in group_df.iterrows():
                final_results.append({
                    "PO_ID": row["PO_ID"],
                    "stated_reason": row["reason"],
                    "Match/Not": "N/A",
                    "Comments": "No reason provided. Skipped LLM validation."
                })
            continue
            
        # Load all required CSVs as DataFrames
        dfs = {}
        uploaded_files = ["pos", "asns", "grns", "invoices", "payments"]
        for name in uploaded_files:
            file_path = os.path.join(UPLOADS_PATH, f"{name}.csv")
            if os.path.exists(file_path):
                dfs[name] = pd.read_csv(file_path)

        # Get business rules
        business_docs_path = os.path.join(UPLOADS_PATH, "business_docs.md")
        with open(business_docs_path, "r", encoding="utf-8") as f:
            business_docs = f.read()

        # Prepare LLM prompt for validation
        prompt = (
            f"You are a data validation expert. Given the following reason bucket: '{bucket}'\n"
            "Task: Write Python code to validate if the data supports each reason.\n\n"
            f"Input data:\n"
            "The group_df DataFrame is already available and contains the following data to validate:\n"
            f"{group_df[['PO_ID', 'reason']].to_csv(index=False)}\n\n"
            f"2. Available datasets (already loaded as DataFrames):\n"
            "- group_df: DataFrame containing PO_ID and reason columns to validate\n"
            "- pos: Purchase Orders DataFrame\n"
            "- asns: Advance Shipping Notices DataFrame\n"
            "- grns: Goods Receipt Notes DataFrame\n"
            "- invoices: Invoice data DataFrame\n"
            "- payments: Payment records DataFrame\n\n"
            f"3. Dataset columns:\n{json.dumps(metadata_map, indent=2)}\n\n"
            f"4. Business rules:\n{business_docs}\n\n"
            "Requirements:\n"
            "1. Create a results list with these exact fields for each PO:\n"
            "   - PO_ID (from input)\n"
            "   - stated_reason (from input 'reason' column)\n"
            "   - Match/Not (boolean True/False)\n"
            "   - Comments (str explanation)\n"
            "2. Convert results list to DataFrame at the end:\n"
            "   result_df = pd.DataFrame(results_list)\n\n"
            "Example code structure:\n"
            "```python\n"
            "results_list = []\n"
            "for _, row in group_df.iterrows():\n"
            "    po_id = row['PO_ID']\n"
            "    reason = row['reason']\n"
            "    # Your validation logic here\n"
            "    match = False  # Set to True if data supports the reason\n"
            "    comments = 'Explanation here'\n"
            "    results_list.append({\n"
            "        'PO_ID': po_id,\n"
            "        'stated_reason': reason,\n"
            "        'Match/Not': match,\n"
            "        'Comments': comments\n"
            "    })\n"
            "result_df = pd.DataFrame(results_list)\n"
            "```\n"
            "Write only the validation code, no explanations or markdown."
        )

        # Generate validation code with LLM
        code_response = model.generate_content(prompt)
        code_str = code_response.text

        # Extract code block from response
        code_match = re.search(r'```python(.*?)```', code_str, re.DOTALL)
        if code_match:
            code_str = code_match.group(1).strip()
        else:
            # If no code block found, try to extract any code-like content
            code_str = re.sub(r'```.*?```', '', code_str, flags=re.DOTALL)
            code_str = '\n'.join(line for line in code_str.splitlines() 
                               if not line.strip().startswith(('#', '-', '*', '>'))
                               and line.strip())

        # Add necessary imports
        code_str = 'import pandas as pd\nimport numpy as np\n\n' + code_str

        # Add safety wrapper to ensure proper DataFrame structure
        code_str += """
# Ensure proper DataFrame structure
if 'result_df' not in locals():
    results_list = []
    for _, row in group_df.iterrows():
        results_list.append({
            'PO_ID': row['PO_ID'],
            'stated_reason': row['reason'],
            'Match/Not': False,
            'Comments': 'Validation code did not produce results'
        })
    result_df = pd.DataFrame(results_list)

# Ensure all required columns exist
required_cols = ['PO_ID', 'stated_reason', 'Match/Not', 'Comments']
for col in required_cols:
    if col not in result_df.columns:
        result_df[col] = None
result_df['Match/Not'] = result_df['Match/Not'].fillna(False)
result_df['Comments'] = result_df['Comments'].fillna('No validation result')
"""

        # Execute validation code
        local_vars = {
            'pd': pd,
            'np': np,
            'group_df': group_df  # Add group_df to the local variables
        }
        for name, df in dfs.items():
            local_vars[name] = df
            
        try:
            exec(code_str, local_vars)
            result_df = local_vars.get("result_df")
            
            if result_df is not None:
                for _, row in result_df.iterrows():
                    final_results.append({
                        "PO_ID": row["PO_ID"],
                        "stated_reason": row["stated_reason"],
                        "Match/Not": row["Match/Not"],
                        "Comments": row["Comments"]
                    })
            else:
                for _, row in group_df.iterrows():
                    final_results.append({
                        "PO_ID": row["PO_ID"],
                        "stated_reason": row["reason"],
                        "Match/Not": False,
                        "Comments": "Validation failed: Code did not generate results"
                    })
        except Exception as e:
            print(f"Error validating bucket {bucket}: {str(e)}")
            for _, row in group_df.iterrows():
                final_results.append({
                    "PO_ID": row["PO_ID"],
                    "stated_reason": row["reason"],
                    "Match/Not": False,
                    "Comments": f"Validation error: {str(e)}"
                })

    final_df = pd.DataFrame(final_results)
    
    # Create summary statistics for visualization
    summary_stats = {
        'total_validations': len(final_df),
        'match_distribution': final_df['Match/Not'].value_counts().to_dict(),
        'reason_counts': final_df['stated_reason'].value_counts().to_dict(),
        'unique_po_count': final_df['PO_ID'].nunique(),
    }
    
    # Create reason-wise summary, excluding 'no reason'
    actionable_reasons = [r for r in final_df['stated_reason'].unique() if str(r).strip().lower() != 'no reason']
    reason_summary = pd.DataFrame({'reason': actionable_reasons})
    reason_summary['total_occurrences'] = reason_summary['reason'].map(final_df['stated_reason'].value_counts())
    reason_summary['matched_count'] = reason_summary['reason'].apply(
        lambda r: len(final_df[(final_df['stated_reason'] == r) & (final_df['Match/Not'] == True)])
    )
    reason_summary['match_rate'] = (reason_summary['matched_count'] / reason_summary['total_occurrences'] * 100).round(2)

    final_df.to_csv("final_reason_validation_results.csv", index=False)
    print("✓ Validation results saved")
    print("=== Completed run-validation successfully ===\n")

    # Convert DataFrames to dict for JSON serialization
    final_df_dict = final_df.to_dict(orient='records')
    reason_summary_dict = reason_summary.to_dict(orient='records')

    return {
        "status": "success", 
        "final_df": final_df_dict,
        "summary_stats": summary_stats,
        "reason_summary": reason_summary_dict
    }

@app.get("/results/{filename}")
def get_result_file(filename: str):
    allowed = [
        "agent_po_reasons_new1.csv",
        "filtered_po_reason_list.csv",
        "filtered_po_reason_comments.csv",
        "final_reason_validation_results.csv",
        "pos.csv",
        "asns.csv",
        "grns.csv",
        "invoices.csv",
        "payments.csv",
        "reasons.csv"  # Added reasons.csv to allowed files
    ]
    if filename not in allowed:
        return JSONResponse(status_code=403, content={"error": "File not allowed."})
    
    # Handle data files
    if filename in ["pos.csv", "asns.csv", "grns.csv", "invoices.csv", "payments.csv", "reasons.csv"]:
        file_path = os.path.join("uploads", filename)
    else:
        file_path = filename
        
    if not os.path.exists(file_path):
        return JSONResponse(status_code=404, content={"error": f"File not found at {file_path}"})
        
    return FileResponse(file_path, media_type="text/csv", filename=filename)
    
@app.get("/penalties-by-po/{po_id}")
def get_penalties_by_po(po_id: str):
    try:
        # Get the directory containing this file
        current_dir = os.path.dirname(os.path.abspath(__file__))
        parent_dir = os.path.dirname(current_dir)  # Go up one level
        uploads_path = os.path.join(parent_dir, "uploads")
        
        # Read reasons.csv file with existing penalty values
        reasons_path = os.path.join(uploads_path, "reasons.csv")
        
        if not os.path.exists(reasons_path):
            return JSONResponse(
                status_code=404,
                content={"status": "error", "message": "Penalties data not found"}
            )
        
        # Load the CSV
        penalty_df = pd.read_csv(reasons_path)
        
        # Filter for the requested PO_ID
        filtered_df = penalty_df[penalty_df['PO_ID'] == po_id]
        
        if filtered_df.empty:
            return {"status": "error", "message": f"No penalty data found for PO ID: {po_id}"}
        
        # Convert to list of dictionaries for API response
        penalties = filtered_df.to_dict('records')
        
        return {
            "status": "success",
            "penalties": penalties
        }
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": f"Error retrieving penalty data: {str(e)}"}
        )

@app.get("/all-penalties")
def get_all_penalties():
    """Get all penalties data from reasons.csv"""
    try:
        # Get the directory containing this file
        current_dir = os.path.dirname(os.path.abspath(__file__))
        parent_dir = os.path.dirname(current_dir)  # Go up one level
        uploads_path = os.path.join(parent_dir, "uploads")
        
        # Read reasons.csv file with existing penalty values
        reasons_path = os.path.join(uploads_path, "reasons.csv")
        
        if not os.path.exists(reasons_path):
            return JSONResponse(
                status_code=404,
                content={"status": "error", "message": "Penalties data not found"}
            )
            
        # Load the CSV
        penalty_df = pd.read_csv(reasons_path)
        
        # Make sure the penalty column is numeric
        penalty_df['penalty'] = pd.to_numeric(penalty_df['penalty'], errors='coerce').fillna(0)
        
        # Convert to list of dictionaries for JSON response
        penalty_list = penalty_df.to_dict(orient="records")
        
        # Debug output to console
        print(f"Loaded {len(penalty_list)} penalties from reasons.csv")
        print(f"Sample penalties: {penalty_list[:5]}")
        
        return JSONResponse(
            status_code=200,
            content={"status": "success", "penalties": penalty_list}
        )
    except Exception as e:
        print(f"Error retrieving penalties: {e}")
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": str(e)}
        )
