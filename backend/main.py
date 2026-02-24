from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os
import pandas as pd
import json
from dotenv import load_dotenv
import numpy as np
import jwt
from datetime import datetime, timedelta
from passlib.context import CryptContext
from pydantic import BaseModel
import sqlite3
import google.generativeai as genai
import uuid
import redis

app = FastAPI()

# Load environment variables
load_dotenv()

# Redis configuration
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
try:
    redis_client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, db=0, decode_responses=True)
    redis_client.ping()
    print("[REDIS] Connected to Redis")
except Exception as e:
    print(f"[REDIS] Connection failed: {e}. Using in-memory cache as fallback")
    redis_client = None

# Gemini configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel("models/gemini-flash-latest")

# Chat configuration
CONTEXT_WINDOW = 15  # Keep last 15 messages in context
CHAT_HISTORY_FILE = "chat_history.csv"

# Security configuration
SECRET_KEY = os.getenv("SECRET_KEY", "pipeline_secret_key_2024")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours

# Password hashing - Use argon2 instead of bcrypt to avoid 72-byte limit
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
security = HTTPBearer()

# Pydantic models
class UserRegister(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict

class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    session_id: str
    message: str

class ChatResponse(BaseModel):
    session_id: str
    user_message: str
    assistant_message: str
    timestamp: str

# Helper functions (define before init_db)
def hash_password(password: str) -> str:
    # Argon2 handles long passwords automatically
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    # Argon2 handles long passwords automatically
    return pwd_context.verify(plain_password, hashed_password)

# Database initialization
def init_db():
    conn = sqlite3.connect("users.db")
    cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    conn.commit()
    
    # Check if role column exists, if not add it
    cursor.execute("PRAGMA table_info(users)")
    columns = [column[1] for column in cursor.fetchall()]
    if 'role' not in columns:
        cursor.execute("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'")
        conn.commit()
    
    # Seed default admin user
    # Seed default admin user safely
    cursor.execute(
        "SELECT id FROM users WHERE username = ? OR email = ?",
        ("admin", "admin@reconciliation.local")
    )

    if not cursor.fetchone():
        admin_password = hash_password("admin")
        cursor.execute(
            "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)",
            ("admin", "admin@reconciliation.local", admin_password, "admin")
        )
        conn.commit()
        
    conn.close()

init_db()

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return username
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def get_user_by_username(username: str):
    conn = sqlite3.connect("users.db")
    cursor = conn.cursor()
    cursor.execute("SELECT id, username, email, role FROM users WHERE username = ?", (username,))
    result = cursor.fetchone()
    conn.close()
    if result:
        return {"id": result[0], "username": result[1], "email": result[2], "role": result[3]}
    return None

def load_reason_buckets():
    """Load reason buckets from JSON file"""
    current_dir = os.path.dirname(os.path.abspath(__file__))
    parent_dir = os.path.dirname(current_dir)
    reason_buckets_file = os.path.join(parent_dir, "reasons_validation", "reason_buckets.json")
    try:
        with open(reason_buckets_file, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading reason buckets: {str(e)}")
        return {}

def load_validation_context():
    """Load validation results for context"""
    current_dir = os.path.dirname(os.path.abspath(__file__))
    validation_file = os.path.join(current_dir, "final_reason_validation_results.csv")
    try:
        df = pd.read_csv(validation_file)
        
        # Create a summary instead of loading all rows
        total_pos = len(df)
        match_count = len(df[df['Match/Not'] == True])
        mismatch_count = len(df[df['Match/Not'] == False])
        
        # Get discrepancy reasons frequency
        mismatches_df = df[df['Match/Not'] == False]
        reason_counts = mismatches_df['stated_reason'].value_counts().to_dict()
        
        # Load reason buckets
        reason_buckets = load_reason_buckets()
        
        # Format reason frequency with bucket classification
        reason_text = "\n".join([
            f"  • {reason}: {count} occurrences"
            for reason, count in sorted(reason_counts.items(), key=lambda x: x[1], reverse=True)
        ])
        
        # Get sample mismatches
        samples = mismatches_df.head(10)
        sample_text = "\n".join([
            f"  • {row['PO_ID']}: {row['stated_reason']} - {row['Comments']}"
            for idx, row in samples.iterrows()
        ])
        
        context = f"""Validation Results Summary:
Total Purchase Orders: {total_pos}
Valid Records: {match_count}
Discrepancies Found: {mismatch_count}
Recovery Rate: {(match_count/total_pos*100):.1f}%

Discrepancy Reasons (Frequency Distribution):
{reason_text}

Sample Discrepancy Records:
{sample_text}

Data Context:
- Total unique reasons found: {len(reason_counts)}
- Most common reason: {max(reason_counts.items(), key=lambda x: x[1])[0] if reason_counts else 'N/A'}
- Percentage of discrepancies: {(mismatch_count/total_pos*100):.1f}%

Available Reason Categories:
{json.dumps(reason_buckets, indent=2)}

You can answer questions about:
- Frequency of specific discrepancy reasons
- Which POs have specific issues
- Statistics about different discrepancy types
- Recovery opportunities by reason type
- ASN/GRN mismatches
- Overall reconciliation metrics"""
        return context
    except Exception as e:
        print(f"Error loading validation data: {str(e)}")
        return f"Validation data available but encountered error: {str(e)}"

def load_chat_history(session_id: str):
    """Load chat history from CSV"""
    try:
        if os.path.exists(CHAT_HISTORY_FILE):
            df = pd.read_csv(CHAT_HISTORY_FILE)
            session_chats = df[df['session_id'] == session_id].to_dict('records')
            return session_chats
        return []
    except Exception as e:
        print(f"Error loading chat history: {e}")
        return []

def save_chat_message(session_id: str, user_message: str, assistant_message: str):
    """Save chat message to CSV"""
    try:
        timestamp = datetime.utcnow().isoformat()
        new_record = {
            'session_id': session_id,
            'user_message': user_message,
            'assistant_message': assistant_message,
            'timestamp': timestamp
        }
        
        if os.path.exists(CHAT_HISTORY_FILE):
            df = pd.read_csv(CHAT_HISTORY_FILE)
            df = pd.concat([df, pd.DataFrame([new_record])], ignore_index=True)
        else:
            df = pd.DataFrame([new_record])
        
        df.to_csv(CHAT_HISTORY_FILE, index=False)
        return True
    except Exception as e:
        print(f"Error saving chat history: {e}")
        return False

def get_context_window(session_id: str):
    """Get last N messages for context with Redis caching"""
    cache_key = f"chat_context:{session_id}"
    
    # Try to get from Redis cache first
    if redis_client:
        try:
            cached = redis_client.get(cache_key)
            if cached:
                print(f"[REDIS] Cache hit for session {session_id}")
                return json.loads(cached)
        except Exception as e:
            print(f"[REDIS] Cache read error: {e}")
    
    # Load from database if not in cache
    history = load_chat_history(session_id)
    # Return last CONTEXT_WINDOW messages
    recent_messages = history[-CONTEXT_WINDOW:] if len(history) > CONTEXT_WINDOW else history
    
    messages = []
    for chat in recent_messages:
        messages.append({"role": "user", "content": chat['user_message']})
        messages.append({"role": "assistant", "content": chat['assistant_message']})
    
    # Cache the context in Redis with 24-hour TTL
    if redis_client:
        try:
            redis_client.setex(cache_key, 86400, json.dumps(messages))
            print(f"[REDIS] Cached context for session {session_id}")
        except Exception as e:
            print(f"[REDIS] Cache write error: {e}")
    
    return messages

def save_chat_message_to_cache(session_id: str, user_message: str, assistant_message: str):
    """Save new chat message and update cache"""
    cache_key = f"chat_context:{session_id}"
    
    # Load from cache or database
    if redis_client:
        try:
            cached = redis_client.get(cache_key)
            if cached:
                messages = json.loads(cached)
            else:
                messages = get_context_window(session_id)
        except Exception as e:
            print(f"[REDIS] Error reading cache: {e}")
            messages = get_context_window(session_id)
    else:
        messages = get_context_window(session_id)
    
    # Add new messages
    messages.append({"role": "user", "content": user_message})
    messages.append({"role": "assistant", "content": assistant_message})
    
    # Keep only last CONTEXT_WINDOW messages
    if len(messages) > CONTEXT_WINDOW * 2:
        messages = messages[-(CONTEXT_WINDOW * 2):]
    
    # Update cache
    if redis_client:
        try:
            redis_client.setex(cache_key, 86400, json.dumps(messages))
            print(f"[REDIS] Updated cache for session {session_id}")
        except Exception as e:
            print(f"[REDIS] Cache update error: {e}")
    
    return messages

def clear_chat_cache(session_id: str):
    """Clear chat cache for a session"""
    cache_key = f"chat_context:{session_id}"
    if redis_client:
        try:
            redis_client.delete(cache_key)
            print(f"[REDIS] Cleared cache for session {session_id}")
        except Exception as e:
            print(f"[REDIS] Cache clear error: {e}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

load_dotenv()

@app.post("/signup")
def signup(user: UserRegister):
    """Register a new user"""
    try:
        # Validate input
        if len(user.username) < 3:
            raise HTTPException(status_code=400, detail="Username must be at least 3 characters")
        if len(user.password) < 6:
            raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
        
        # Check if user exists
        conn = sqlite3.connect("users.db")
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM users WHERE username = ? OR email = ?", (user.username, user.email))
        if cursor.fetchone():
            conn.close()
            raise HTTPException(status_code=409, detail="Username or email already exists")
        
        # Create new user
        hashed_password = hash_password(user.password)
        cursor.execute(
            "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
            (user.username, user.email, hashed_password)
        )
        conn.commit()
        conn.close()
        
        return {"status": "success", "message": "User created successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/login", response_model=TokenResponse)
def login(user: UserLogin):
    """Authenticate user and return access token"""
    try:
        # Get user from database
        conn = sqlite3.connect("users.db")
        cursor = conn.cursor()
        cursor.execute("SELECT id, username, email, password, role FROM users WHERE username = ?", (user.username,))
        result = cursor.fetchone()
        conn.close()
        
        if not result or not verify_password(user.password, result[3]):
            raise HTTPException(status_code=401, detail="Invalid username or password")
        
        # Create access token
        access_token = create_access_token({"sub": user.username})
        user_data = {"id": result[0], "username": result[1], "email": result[2], "role": result[4]}
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user_data
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/me")
def get_current_user(username: str = Depends(verify_token)):
    """Get current authenticated user"""
    user = get_user_by_username(username)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.get("/")
def read_root():
    return {"message": "Reconciliation with RCA API is running."}

@app.get("/api/po-analytics")
def get_po_analytics():
    """Get PO analytics data from validation results"""
    try:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        validation_file = os.path.join(current_dir, "final_reason_validation_results.csv")
        
        if not os.path.exists(validation_file):
            return {"status": "error", "message": "Validation data not found"}
        
        # Load validation results
        df = pd.read_csv(validation_file)
        
        # Calculate PO health metrics
        total_pos = len(df)
        pos_without_issues = len(df[df['Match/Not'] == True])
        pos_with_issues = len(df[df['Match/Not'] == False])
        
        # Load reason buckets for categorization
        current_dir = os.path.dirname(os.path.abspath(__file__))
        parent_dir = os.path.dirname(current_dir)
        reason_buckets_file = os.path.join(parent_dir, "reasons_validation", "reason_buckets.json")
        
        reason_buckets = {}
        if os.path.exists(reason_buckets_file):
            with open(reason_buckets_file, 'r') as f:
                reason_buckets = json.load(f)
        
        # Get discrepancy breakdown by category
        discrepancy_df = df[df['Match/Not'] == False].copy()
        discrepancy_df['bucket_category'] = discrepancy_df['stated_reason'].map(
            lambda x: reason_buckets.get(x.lower(), "Unspecified Issue") if pd.notna(x) else "Unspecified Issue"
        )
        
        # Calculate category-wise metrics
        category_breakdown = []
        category_totals = discrepancy_df['bucket_category'].value_counts()
        
        for category in category_totals.index:
            count = int(category_totals[category])
            # Estimate average recovery per PO (in rupees)
            avg_recovery = {
                "Invoice Issue": 15000,
                "GRN Issue": 12000,
                "Quantity Mismatch": 8500,
                "Shipping Issue": 5000,
                "Late Delivery Issue": 3500,
                "Unspecified Issue": 2000,
            }.get(category, 5000)
            
            total_recovery = count * avg_recovery
            category_breakdown.append({
                "category": category,
                "posCount": count,
                "avgRecoveryPerPO": avg_recovery,
                "totalRecovery": total_recovery
            })
        
        # Calculate potential recovery
        total_recovery = sum(item["totalRecovery"] for item in category_breakdown)
        
        # Estimate "correct with issues" - roughly 40% of discrepancies
        correct_with_issues = max(0, int(pos_with_issues * 0.38))
        
        return {
            "status": "success",
            "poData": {
                "totalPOs": total_pos,
                "posWithoutIssues": pos_without_issues,
                "posWithIssues": pos_with_issues,
                "correctWithIssues": correct_with_issues,
                "withDiscrepancies": pos_with_issues,
                "potentialRecoveryAmount": total_recovery
            },
            "discrepancyBreakdown": category_breakdown,
            "summary": {
                "cleanPOPercentage": round((pos_without_issues / total_pos * 100), 1),
                "issuePercentage": round((pos_with_issues / total_pos * 100), 1),
                "recoveryRate": round((correct_with_issues / pos_with_issues * 100) if pos_with_issues > 0 else 0, 1)
            }
        }
    
    except Exception as e:
        import traceback
        print(f"Error getting PO analytics: {str(e)}")
        traceback.print_exc()
        return {
            "status": "error",
            "message": str(e)
        }

@app.get("/api/po-level-issues")
def get_po_level_issues(category: str = None):
    """Get individual POs with issues, optionally filtered by category"""
    try:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        validation_file = os.path.join(current_dir, "final_reason_validation_results.csv")
        
        if not os.path.exists(validation_file):
            return {"status": "error", "message": "Validation data not found"}
        
        # Load validation results
        df = pd.read_csv(validation_file)
        
        # Filter for only discrepancies (Match/Not = False)
        # Show all reviewed POs (both matched and mismatched)
        issue_df = df.copy()
        
        # Load reason buckets for categorization
        parent_dir = os.path.dirname(current_dir)
        reason_buckets_file = os.path.join(parent_dir, "reasons_validation", "reason_buckets.json")
        
        reason_buckets = {}
        if os.path.exists(reason_buckets_file):
            with open(reason_buckets_file, 'r') as f:
                reason_buckets = json.load(f)
        
        # Map stated_reason to bucket category
        issue_df['bucket_category'] = issue_df['stated_reason'].map(
            lambda x: reason_buckets.get(x.lower(), "Unspecified Issue") if pd.notna(x) else "Unspecified Issue"
        )
        
        # Filter by category if provided
        if category:
            issue_df = issue_df[issue_df['bucket_category'] == category]
        
        # Define recovery amounts per category for penalty calculation
        recovery_amounts = {
            "Invoice Issue": 15000,
            "GRN Issue": 12000,
            "Quantity Mismatch": 8500,
            "Shipping Issue": 5000,
            "Late Delivery Issue": 3500,
            "Unspecified Issue": 2000
        }
        
        # Format response
        pos_with_issues = []
        for _, row in issue_df.iterrows():
            category = str(row['bucket_category'])
            penalty_amount = recovery_amounts.get(category, 2000)
            # Alignment based on Match/Not column: True = "Yes", False = "No"
            alignment = "Yes" if row['Match/Not'] == True else "No"
            
            pos_with_issues.append({
                "po_id": str(row['PO_ID']),
                "stated_reason": str(row['stated_reason']),
                "category": category,
                "comments": str(row['Comments']),
                "penalty_amount": penalty_amount,
                "alignment": alignment,
                "status": "open"  # Default status
            })
        
        # Group by category
        grouped_issues = {}
        for issue in pos_with_issues:
            cat = issue['category']
            if cat not in grouped_issues:
                grouped_issues[cat] = []
            grouped_issues[cat].append(issue)
        
        return {
            "status": "success",
            "poWithIssues": pos_with_issues,
            "groupedByCategory": grouped_issues,
            "totalIssues": len(pos_with_issues)
        }
    
    except Exception as e:
        import traceback
        print(f"Error getting PO-level issues: {str(e)}")
        traceback.print_exc()
        return {
            "status": "error",
            "message": str(e)
        }

@app.get("/api/top-pos")
def get_top_pos():
    """Get top 5 POs by recovery amount and top 5 POs with high penalties"""
    try:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        validation_file = os.path.join(current_dir, "final_reason_validation_results.csv")
        
        if not os.path.exists(validation_file):
            return {"status": "error", "message": "Validation data not found"}
        
        # Load validation results
        df = pd.read_csv(validation_file)
        
        # Load reason buckets for categorization
        parent_dir = os.path.dirname(current_dir)
        reason_buckets_file = os.path.join(parent_dir, "reasons_validation", "reason_buckets.json")
        
        reason_buckets = {}
        if os.path.exists(reason_buckets_file):
            with open(reason_buckets_file, 'r') as f:
                reason_buckets = json.load(f)
        
        # Filter for only issues
        issue_df = df[df['Match/Not'] == False].copy()
        
        # Map to categories
        issue_df['category'] = issue_df['stated_reason'].map(
            lambda x: reason_buckets.get(x.lower(), "Unspecified Issue") if pd.notna(x) else "Unspecified Issue"
        )
        
        # Assign recovery amounts by category
        recovery_map = {
            "Invoice Issue": 15000,
            "GRN Issue": 12000,
            "Quantity Mismatch": 8500,
            "Shipping Issue": 5000,
            "Late Delivery Issue": 3500,
            "Unspecified Issue": 2000,
        }
        
        issue_df['recovery_amount'] = issue_df['category'].map(
            lambda x: recovery_map.get(x, 5000)
        )
        
        # Top 5 POs by recovery amount
        top_recovery_pos = issue_df.nlargest(5, 'recovery_amount')[
            ['PO_ID', 'stated_reason', 'category', 'recovery_amount']
        ].to_dict('records')
        
        top_recovery_pos = [
            {
                "po_id": str(item['PO_ID']),
                "reason": str(item['stated_reason']),
                "category": str(item['category']),
                "recovery_amount": int(item['recovery_amount'])
            }
            for item in top_recovery_pos
        ]
        
        # Top 5 POs with high penalties (by recovery amount, these are the same)
        top_penalty_pos = issue_df.nlargest(5, 'recovery_amount')[
            ['PO_ID', 'stated_reason', 'category', 'recovery_amount', 'Comments']
        ].to_dict('records')
        
        top_penalty_pos = [
            {
                "po_id": str(item['PO_ID']),
                "reason": str(item['stated_reason']),
                "category": str(item['category']),
                "penalty_amount": int(item['recovery_amount']),
                "issue": str(item['Comments'])
            }
            for item in top_penalty_pos
        ]
        
        return {
            "status": "success",
            "topRecoveryPOS": top_recovery_pos,
            "topPenaltyPOS": top_penalty_pos
        }
    
    except Exception as e:
        import traceback
        print(f"Error getting top POS: {str(e)}")
        traceback.print_exc()
        return {
            "status": "error",
            "message": str(e)
        }

@app.post("/run-validation")
def run_validation():
    """
    Run validation on discrepancy reasons by checking against actual data files.
    """
    print("\n=== Starting Discrepancy Validation ===")
    
    try:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        parent_dir = os.path.dirname(current_dir)
        uploads_path = os.path.join(parent_dir, "uploads")
        
        # File paths
        reasons_file = os.path.join(uploads_path, "reasons.csv")
        
        if not os.path.exists(reasons_file):
            return {"status": "error", "message": "Reasons file not found"}
        
        # Load all data files
        reasons_df = pd.read_csv(reasons_file)
        print(f"✓ Loaded {len(reasons_df)} records from reasons.csv")
        
        # Load supporting data files
        pos_df = pd.read_csv(os.path.join(uploads_path, "pos.csv")) if os.path.exists(os.path.join(uploads_path, "pos.csv")) else pd.DataFrame()
        asns_df = pd.read_csv(os.path.join(uploads_path, "asns.csv")) if os.path.exists(os.path.join(uploads_path, "asns.csv")) else pd.DataFrame()
        grns_df = pd.read_csv(os.path.join(uploads_path, "grns.csv")) if os.path.exists(os.path.join(uploads_path, "grns.csv")) else pd.DataFrame()
        invoices_df = pd.read_csv(os.path.join(uploads_path, "invoices.csv")) if os.path.exists(os.path.join(uploads_path, "invoices.csv")) else pd.DataFrame()
        payments_df = pd.read_csv(os.path.join(uploads_path, "payments.csv")) if os.path.exists(os.path.join(uploads_path, "payments.csv")) else pd.DataFrame()
        
        print(f"✓ Loaded supporting data files")
        
        # Rule-based validation logic
        final_results = []
        
        for _, row in reasons_df.iterrows():
            po_id = str(row['PO_ID']).strip()
            reason = str(row.get('reason', '')).strip().lower()
            penalty = float(row.get('penalty', 0))
            
            match = True  # Default: assume valid
            comment = "Valid reason"
            
            # Rule 1: No reason = Match (True)
            if reason in ['no reason', 'no issues', 'none', '']:
                match = True
                comment = "No discrepancy"
            
            # Rule 2: Check for "arrived late" or "late delivery" or "delivered late"
            elif 'late' in reason or 'delivered' in reason:
                po_data = pos_df[pos_df['PO_ID'] == po_id] if not pos_df.empty else None
                if po_data is not None and not po_data.empty:
                    po_date = po_data['PO_Date'].iloc[0] if 'PO_Date' in pos_df.columns else None
                    grn_data = grns_df[grns_df['PO_ID'] == po_id] if not grns_df.empty else None
                    if grn_data is not None and not grn_data.empty:
                        grn_date = grn_data['Received_Date'].iloc[0] if 'Received_Date' in grns_df.columns else None
                        if po_date and grn_date:
                            # If GRN date > PO date, it's late
                            match = False if grn_date > po_date else True
                            comment = f"Late delivery: GRN date {grn_date} > PO date {po_date}" if not match else "On time delivery"
                        else:
                            match = False
                            comment = "Date data incomplete"
                    else:
                        match = False
                        comment = "No GRN found for this PO"
                else:
                    match = False
                    comment = "No PO data found"
            
            # Rule 3: Check for quantity mismatches
            elif 'quantity' in reason or 'qty' in reason or 'mismatch' in reason:
                po_data = pos_df[pos_df['PO_ID'] == po_id] if not pos_df.empty else None
                grn_data = grns_df[grns_df['PO_ID'] == po_id] if not grns_df.empty else None
                
                if po_data is not None and not po_data.empty and grn_data is not None and not grn_data.empty:
                    po_qty = po_data['Quantity'].iloc[0] if 'Quantity' in pos_df.columns else None
                    grn_qty = grn_data['Quantity_Received'].iloc[0] if 'Quantity_Received' in grns_df.columns else None
                    
                    if po_qty is not None and grn_qty is not None:
                        # If quantities don't match, it's a valid discrepancy
                        match = False if po_qty != grn_qty else True
                        comment = f"Qty mismatch: PO={po_qty}, GRN={grn_qty}" if not match else f"Qty match: {po_qty}"
                    else:
                        match = False
                        comment = "Quantity data incomplete"
                else:
                    match = False
                    comment = "PO or GRN data not found"
            
            # Rule 4: Check for price/currency mismatches
            elif 'price' in reason or 'currency' in reason:
                po_data = pos_df[pos_df['PO_ID'] == po_id] if not pos_df.empty else None
                invoices_data = invoices_df[invoices_df['PO_ID'] == po_id] if not invoices_df.empty else None
                
                if po_data is not None and not po_data.empty and invoices_data is not None and not invoices_data.empty:
                    po_price = po_data['Unit_Price'].iloc[0] if 'Unit_Price' in pos_df.columns else None
                    inv_price = invoices_data['Unit_Price'].iloc[0] if 'Unit_Price' in invoices_df.columns else None
                    
                    if po_price is not None and inv_price is not None:
                        # If prices don't match, it's a valid discrepancy
                        match = False if po_price != inv_price else True
                        comment = f"Price mismatch: PO={po_price}, Invoice={inv_price}" if not match else f"Price match: {po_price}"
                    else:
                        match = False
                        comment = "Price data incomplete"
                else:
                    match = False
                    comment = "PO or Invoice data not found"
            
            # Rule 5: Check for ASN/GRN mismatches
            elif 'asn' in reason or 'grn' in reason or 'shipment' in reason:
                asn_data = asns_df[asns_df['PO_ID'] == po_id] if not asns_df.empty else None
                grn_data = grns_df[grns_df['PO_ID'] == po_id] if not grns_df.empty else None
                
                if asn_data is not None and not asn_data.empty and grn_data is not None and not grn_data.empty:
                    asn_qty = asn_data['Quantity_Shipped'].iloc[0] if 'Quantity_Shipped' in asns_df.columns else None
                    grn_qty = grn_data['Quantity_Received'].iloc[0] if 'Quantity_Received' in grns_df.columns else None
                    
                    if asn_qty is not None and grn_qty is not None:
                        # If ASN and GRN quantities don't match, it's a valid discrepancy
                        match = False if asn_qty != grn_qty else True
                        comment = f"ASN/GRN mismatch: ASN={asn_qty}, GRN={grn_qty}" if not match else f"ASN/GRN match: {grn_qty}"
                    else:
                        match = False
                        comment = "ASN/GRN quantity data incomplete"
                else:
                    match = False
                    comment = "ASN or GRN data not found"
            
            # Rule 6: Check for over/under delivery or more/less received
            elif any(x in reason for x in ['delivered', 'received', 'over', 'under', 'more', 'less']):
                po_data = pos_df[pos_df['PO_ID'] == po_id] if not pos_df.empty else None
                grn_data = grns_df[grns_df['PO_ID'] == po_id] if not grns_df.empty else None
                
                if po_data is not None and not po_data.empty and grn_data is not None and not grn_data.empty:
                    po_qty = po_data['Quantity'].iloc[0] if 'Quantity' in pos_df.columns else None
                    grn_qty = grn_data['Quantity_Received'].iloc[0] if 'Quantity_Received' in grns_df.columns else None
                    
                    if po_qty is not None and grn_qty is not None:
                        if 'over' in reason or 'more' in reason:
                            # Over/more delivery if GRN > PO
                            match = False if grn_qty > po_qty else True
                            comment = f"Over-delivery: PO={po_qty}, GRN={grn_qty}" if grn_qty > po_qty else f"Normal delivery: {grn_qty}"
                        elif 'under' in reason or 'less' in reason:
                            # Under/less delivery if GRN < PO
                            match = False if grn_qty < po_qty else True
                            comment = f"Under-delivery: PO={po_qty}, GRN={grn_qty}" if grn_qty < po_qty else f"Normal delivery: {grn_qty}"
                        else:
                            match = grn_qty == po_qty
                            comment = f"Qty comparison: PO={po_qty}, GRN={grn_qty}"
                    else:
                        match = False
                        comment = "Quantity data incomplete"
                else:
                    match = False
                    comment = "PO or GRN data not found"
            
            # Rule 7: Check for missing/no GRN
            elif 'missing' in reason or 'no grn' in reason:
                grn_data = grns_df[grns_df['PO_ID'] == po_id] if not grns_df.empty else None
                match = False if grn_data is None or grn_data.empty else True
                comment = "Missing GRN - discrepancy confirmed" if not match else "GRN exists"
            
            # Rule 8: Check for multiple GRNs or split shipments
            elif 'multiple' in reason or 'split' in reason:
                grn_data = grns_df[grns_df['PO_ID'] == po_id] if not grns_df.empty else None
                grn_count = len(grn_data) if grn_data is not None else 0
                match = False if grn_count > 1 else True
                comment = f"Multiple GRNs: {grn_count}" if grn_count > 1 else f"Single GRN: {grn_count}"
            
            else:
                # Unknown reason - mark as invalid discrepancy
                match = False
                comment = f"Unknown reason: {reason}"
            
            final_results.append({
                "PO_ID": po_id,
                "stated_reason": reason if reason else "No reason",
                "Match/Not": match,
                "Comments": comment
            })
        
        # Create results DataFrame
        final_df = pd.DataFrame(final_results)
        
        # Calculate statistics
        match_count = final_df['Match/Not'].sum()
        total_count = len(final_df)
        mismatch_count = total_count - match_count
        
        summary_stats = {
            'total_validations': int(total_count),
            'match_count': int(match_count),
            'mismatch_count': int(mismatch_count),
            'match_rate': round((match_count / total_count * 100) if total_count > 0 else 0, 2),
            'unique_po_count': int(final_df['PO_ID'].nunique()),
        }
        
        # Reason-wise summary
        reason_summary = []
        for reason in final_df['stated_reason'].unique():
            reason_data = final_df[final_df['stated_reason'] == reason]
            reason_match_count = reason_data['Match/Not'].sum()
            reason_total_count = len(reason_data)
            
            reason_summary.append({
                'reason': reason,
                'total_occurrences': int(reason_total_count),
                'matched_count': int(reason_match_count),
                'not_matched_count': int(reason_total_count - reason_match_count),
                'match_rate': round((reason_match_count / reason_total_count * 100) if reason_total_count > 0 else 0, 2)
            })
        
        # Sort by occurrences
        reason_summary.sort(key=lambda x: x['total_occurrences'], reverse=True)
        
        # Save results
        final_df.to_csv("final_reason_validation_results.csv", index=False)
        print(f"✓ Validation results saved")
        print(f"  Total Validations: {total_count}")
        print(f"  Valid Reasons (Match): {match_count}")
        print(f"  Invalid Reasons (Discrepancies): {mismatch_count}")
        print(f"  Match Rate: {summary_stats['match_rate']}%")
        print("=== Discrepancy Validation Completed ===\n")
        
        return {
            "status": "success",
            "summary_stats": summary_stats,
            "reason_summary": reason_summary,
            "validation_results": final_df.to_dict(orient='records')
        }
    
    except Exception as e:
        print(f"Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"status": "error", "message": str(e)}


@app.post("/calculate-penalties")
def calculate_penalties():
    """
    Calculate penalty metrics based on validation results.
    Shows total penalties and recoverable amounts.
    """
    print("\n=== Calculating Penalties ===")
    
    try:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        parent_dir = os.path.dirname(current_dir)
        uploads_path = os.path.join(parent_dir, "uploads")
        
        reasons_path = os.path.join(uploads_path, "reasons.csv")
        validation_path = os.path.join(current_dir, "final_reason_validation_results.csv")
        
        if not os.path.exists(reasons_path):
            return {"status": "error", "message": "Reasons file not found"}
        
        if not os.path.exists(validation_path):
            return {"status": "error", "message": "Validation results not found. Run validation first."}
        
        # Load data
        reasons_df = pd.read_csv(reasons_path)
        validation_df = pd.read_csv(validation_path)
        
        print(f"✓ Loaded reasons.csv with {len(reasons_df)} records")
        print(f"✓ Loaded validation results with {len(validation_df)} records")
        
        # Ensure penalty column is numeric
        reasons_df['penalty'] = pd.to_numeric(reasons_df['penalty'], errors='coerce').fillna(0)
        
        total_penalty = float(reasons_df['penalty'].sum())
        print(f"  Total penalty sum: ${total_penalty:.2f}")
        
        # Simple merge on PO_ID only (left join to keep all reasons)
        merged_df = pd.merge(
            reasons_df,
            validation_df[['PO_ID', 'Match/Not']],
            on='PO_ID',
            how='left'
        )
        
        # Fill NaN values for Match/Not (in case some POs don't have validation)
        merged_df['Match/Not'] = merged_df['Match/Not'].fillna(True)
        merged_df.to_csv('merged.csv')
        print(f"  Merged records: {len(merged_df)}")
        print(f"  Matched (Match/Not=True): {len(merged_df[merged_df['Match/Not'] == True])}")
        print(f"  Not Matched (Match/Not=False): {len(merged_df[merged_df['Match/Not'] == False])}")
        print(merged_df.columns)
        # Recoverable = penalties where Match/Not is False (discrepancies)
        recoverable_df = merged_df[merged_df['Match/Not'] == False]
        recoverable_penalty = float(recoverable_df['penalty'].sum())
        
        print(f"  Recoverable penalty sum: ${recoverable_penalty:.2f}")
        total_penalty = merged_df['penalty'].sum()
        recovery_rate = (recoverable_penalty / total_penalty * 100) if total_penalty > 0 else 0
        
        pos_with_discrepancy = int(merged_df[merged_df['Match/Not'] == False]['PO_ID'].nunique())
        
        metrics = {
            "total_penalty_claimed": round(total_penalty, 2),
            "total_penalty_exposure": round(total_penalty, 2),
            "penalty_that_can_be_saved": round(recoverable_penalty, 2),
            "recoverable_amount": round(recoverable_penalty, 2),
            "recovery_rate": round(recovery_rate, 2),
            "percentage_saveable": round(recovery_rate, 1),
            "pos_with_discrepancy": pos_with_discrepancy,
            "total_pos": int(reasons_df['PO_ID'].nunique())
        }
        
        print("✓ Penalties calculated")
        print(f"  Total Exposure: ${metrics['total_penalty_exposure']}")
        print(f"  Recoverable: ${metrics['recoverable_amount']}")
        print(f"  Recovery Rate: {metrics['recovery_rate']}%")
        print("=== Penalties Calculation Completed ===\n")
        
        return {
            "status": "success",
            "metrics": metrics
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"status": "error", "message": str(e)}

@app.get("/penalties-by-po/{po_id}")
def get_penalties_by_po(po_id: str):
    """Get all penalties associated with a specific PO"""
    try:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        parent_dir = os.path.dirname(current_dir)
        uploads_path = os.path.join(parent_dir, "uploads")
        reasons_path = os.path.join(uploads_path, "reasons.csv")
        
        if not os.path.exists(reasons_path):
            return JSONResponse(
                status_code=404,
                content={"status": "error", "message": "Penalties data not found"}
            )
        
        penalty_df = pd.read_csv(reasons_path)
        filtered_df = penalty_df[penalty_df['PO_ID'] == po_id]
        
        if filtered_df.empty:
            return {
                "status": "success",
                "po_id": po_id,
                "penalties": []
            }
        
        return {
            "status": "success",
            "po_id": po_id,
            "penalties": filtered_df.to_dict('records')
        }
        
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": str(e)}
        )

@app.get("/all-penalties")
def get_all_penalties():
    """Get all penalties data"""
    try:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        parent_dir = os.path.dirname(current_dir)
        uploads_path = os.path.join(parent_dir, "uploads")
        reasons_path = os.path.join(uploads_path, "reasons.csv")
        
        if not os.path.exists(reasons_path):
            return JSONResponse(
                status_code=404,
                content={"status": "error", "message": "Penalties data not found"}
            )
        
        penalty_df = pd.read_csv(reasons_path)
        penalty_df['penalty'] = pd.to_numeric(penalty_df['penalty'], errors='coerce').fillna(0)
        
        return {
            "status": "success",
            "total_records": len(penalty_df),
            "penalties": penalty_df.to_dict(orient="records")
        }
        
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": str(e)}
        )

@app.get("/results/{filename}")
def get_result_file(filename: str):
    """Download result files"""
    allowed_files = [
        "final_reason_validation_results.csv",
        "pos.csv",
        "reasons.csv"
    ]
    
    if filename not in allowed_files:
        return JSONResponse(
            status_code=403,
            content={"error": "File not allowed"}
        )
    
    # Data files location
    if filename in ["pos.csv", "reasons.csv"]:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        parent_dir = os.path.dirname(current_dir)
        file_path = os.path.join(parent_dir, "uploads", filename)
    else:
        file_path = filename
    
    if not os.path.exists(file_path):
        return JSONResponse(
            status_code=404,
            content={"error": "File not found"}
        )
    
    return FileResponse(file_path, media_type="text/csv", filename=filename)

@app.get("/results/unique-reasons")
def get_unique_reasons():
    """Get unique reasons from validation results"""
    try:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        results_file = os.path.join(current_dir, "final_reason_validation_results.csv")
        
        df = pd.read_csv(results_file)
        unique_reasons = sorted(df['stated_reason'].dropna().unique().tolist())
        
        return {"reasons": unique_reasons}
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"Failed to load unique reasons: {str(e)}"}
        )



@app.post("/save-penalty-approvals")
def save_penalty_approvals(approvals: dict, username: str = Depends(verify_token)):
    """Save admin penalty approvals to CSV"""
    try:
        # Check if user is admin
        user = get_user_by_username(username)
        if not user or user.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Only admins can approve penalties")
        
        current_dir = os.path.dirname(os.path.abspath(__file__))
        parent_dir = os.path.dirname(current_dir)
        
        # Load existing reasons data
        reasons_path = os.path.join(parent_dir, "uploads", "reasons.csv")
        reasons_df = pd.read_csv(reasons_path)
        
        # Create approval tracking columns if they don't exist
        if "admin_approved" not in reasons_df.columns:
            reasons_df["admin_approved"] = False
        if "admin_comments" not in reasons_df.columns:
            reasons_df["admin_comments"] = ""
        if "admin_username" not in reasons_df.columns:
            reasons_df["admin_username"] = ""
        
        # Update approvals from the request
        for po_id_str, approval_data in approvals.items():
            # Find matching row
            mask = reasons_df["PO_ID"] == po_id_str
            if mask.any():
                reasons_df.loc[mask, "admin_approved"] = approval_data.get("approved", False)
                reasons_df.loc[mask, "admin_comments"] = approval_data.get("comments", "")
                reasons_df.loc[mask, "admin_username"] = username
        
        # Save updated CSV
        reasons_df.to_csv(reasons_path, index=False)
        
        print(f"Saved penalty approvals from {username}")
        
        return {
            "status": "success",
            "message": "Penalty approvals saved successfully",
            "records_updated": len(approvals)
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat")
def chat(request: ChatRequest, username: str = Depends(verify_token)):
    """Chat endpoint with validation results context"""
    try:
        print(f"[CHAT] Received message from {username}: {request.message[:50]}...")
        
        # Validate API key
        if not GEMINI_API_KEY:
            print("[CHAT ERROR] Gemini API key not configured")
            raise HTTPException(status_code=500, detail="Gemini API key not configured")
        
        # Load context from validation results
        validation_context = load_validation_context()
        print("[CHAT] Validation context loaded")
        
        # Get conversation history (last 10 messages)
        history_messages = get_context_window(request.session_id)
        print(f"[CHAT] Loaded {len(history_messages)} history messages")
        
        # Build system prompt with validation data
        system_prompt = f"""You are a helpful assistant for a Reconciliation system. 
You have access to validation results for purchase orders and can help users understand discrepancies, penalties, and reconciliation issues.

{validation_context}

Help users understand the validation results, identify discrepancies, and explain penalties. Be concise and specific."""
        
        # Build messages for Gemini
        # Gemini doesn't have a system role, so we'll prepend the system prompt to the user's message
        conversation_history = []
        for msg in history_messages:
            conversation_history.append({
                "role": msg["role"],
                "parts": [{"text": msg["content"]}]
            })
        
        # Create the full prompt with context
        full_prompt = f"""{system_prompt}

User Question: {request.message}"""
        
        print(f"[CHAT] Calling Gemini API with {len(conversation_history)} history messages...")
        
        # Call Gemini API with proper safety settings
        response = model.generate_content(
            full_prompt,
            generation_config=genai.types.GenerationConfig(
                max_output_tokens=4096,
                temperature=0.7,
            ),
            safety_settings=[
                {
                    "category": genai.types.HarmCategory.HARM_CATEGORY_HARASSMENT,
                    "threshold": genai.types.HarmBlockThreshold.BLOCK_NONE,
                },
                {
                    "category": genai.types.HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                    "threshold": genai.types.HarmBlockThreshold.BLOCK_NONE,
                },
                {
                    "category": genai.types.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                    "threshold": genai.types.HarmBlockThreshold.BLOCK_NONE,
                },
                {
                    "category": genai.types.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                    "threshold": genai.types.HarmBlockThreshold.BLOCK_NONE,
                },
            ],
        )
        
        assistant_message = response.text
        print(f"[CHAT] Received response: {assistant_message[:50]}...")
        
        # Save to chat history and update cache
        save_chat_message(request.session_id, request.message, assistant_message)
        save_chat_message_to_cache(request.session_id, request.message, assistant_message)
        print("[CHAT] Message saved to history and cache")
        
        return ChatResponse(
            session_id=request.session_id,
            user_message=request.message,
            assistant_message=assistant_message,
            timestamp=datetime.utcnow().isoformat()
        )
    
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        print(f"[CHAT ERROR] {error_msg}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Chat error: {error_msg}")

@app.get("/chat-history/{session_id}")
def get_chat_history(session_id: str, username: str = Depends(verify_token)):
    """Get chat history for a session"""
    try:
        history = load_chat_history(session_id)
        return {
            "session_id": session_id,
            "messages": history,
            "total_messages": len(history)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat/new-session")
def new_chat_session(username: str = Depends(verify_token)):
    """Create a new chat session"""
    session_id = str(uuid.uuid4())
    return {
        "session_id": session_id,
        "message": "New chat session created"
    }

@app.get("/health")
def health_check():
    """Public health check endpoint (no authentication required)"""
    return {"status": "ok"}

@app.get("/chat/health")
def chat_health_check(username: str = Depends(verify_token)):
    """Check if chat system is healthy"""
    try:
        api_key_present = bool(GEMINI_API_KEY)
        validation_file_exists = os.path.exists(
            os.path.join(os.path.dirname(os.path.abspath(__file__)), "final_reason_validation_results.csv")
        )
        
        return {
            "status": "healthy",
            "api_key_configured": api_key_present,
            "validation_file_exists": validation_file_exists,
            "model": "gemini-2.5-flash",
            "message": "Chat system is ready with Gemini 2.5 Flash"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }


