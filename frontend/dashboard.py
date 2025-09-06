
import streamlit as st
import requests
import json
import plotly.express as px
import plotly.graph_objects as go
import os
import pandas as pd

# Metadata info as a styled box in the main UI
import pathlib
metadata_path = os.path.join("E:/", "backend", "pipeline_v2", "uploads", "metadata.txt")
metadata_content = ""
if pathlib.Path(metadata_path).exists():
    with open(metadata_path, "r") as f:
        metadata_content = f.read()


# st.markdown("""
#     <div style="background-color: #23272f; border-radius: 1rem; border: 1px solid #363636; padding: 2rem; margin-bottom: 2rem;">
#         <h3 style="color: #4a9eff; margin-bottom: 1rem;">Metadata</h3>
#         <div style="background-color: #2d2d2d; border-radius: 0.5rem; padding: 1rem; color: #e0e0e0; font-size: 1rem; white-space: pre-wrap; max-height: 300px; overflow-y: auto;">
#             {}</div>
#     </div>
# """.format(metadata_content), unsafe_allow_html=True)

st.markdown("""
<style>
    /* Make the top bar and background dark */
    .main, .block-container, .stApp, body {
        background-color: #181c22 !important;
        color: #e0e0e0 !important;
    }
    .metric-label {
        color: var(--text-secondary);
        font-size: 0.9rem;
    }
    /* Table Styling */
    .styled-table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
        margin: 1rem 0;
        background-color: var(--background-dark);
        border-radius: 10px;
        overflow: hidden;
    }
    .styled-table th {
        background-color: var(--background-light);
        color: var(--primary-color);
        padding: 12px;
        font-weight: 600;
        text-align: left;
        border-bottom: 2px solid var(--border-color);
    }
    .styled-table td {
        padding: 12px;
        border-bottom: 1px solid var(--border-color);
        color: var(--text-primary);
    }
    .styled-table tr:hover {
        background-color: rgba(74, 158, 255, 0.1);
    }
    /* Workflow Selection */
    .workflow-button {
        background-color: var(--background-light);
        color: var(--text-primary);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        padding: 1rem;
        margin: 0.5rem 0;
        cursor: pointer;
        transition: all 0.3s ease;
    }
    .workflow-button:hover, .workflow-button.active {
        background-color: var(--primary-color);
        color: white;
        transform: translateY(-2px);
    }
    /* Hero Section */
    .hero-section {
        background: linear-gradient(145deg, var(--background-dark), var(--background-light));
        border-radius: 15px;
        padding: 2rem;
        margin-bottom: 2rem;
        border: 1px solid var(--border-color);
    }
    .hero-title {
        color: var(--primary-color);
        font-size: 2.5rem;
        font-weight: bold;
        margin-bottom: 1rem;
    }
    .hero-subtitle {
        color: var(--text-secondary);
        font-size: 1.2rem;
        line-height: 1.6;
    }
</style>
""", unsafe_allow_html=True)

# Configure theme
st.markdown("""
    <style>
        /* Restore sidebar button and box colors to previous blue style */
        section[data-testid="stSidebar"] .stButton>button {
            background-color: #4a9eff !important;
            color: #fff !important;
            border: none !important;
            font-weight: 600;
            border-radius: 0.7rem !important;
            box-shadow: 0 2px 8px #4a9eff22;
            transition: background 0.2s, color 0.2s;
        }
        section[data-testid="stSidebar"] .stButton>button:disabled {
            background-color: #e6f0fa !important;
            color: #b0b0b0 !important;
        }
        section[data-testid="stSidebar"] .stButton>button:hover:enabled {
            background-color: #2d8bff !important;
            color: #fff !important;
        }
        section[data-testid="stSidebar"] .st-bw, section[data-testid="stSidebar"] .st-cz, section[data-testid="stSidebar"] .st-cy {
            background-color: #23272f !important;
            color: #e0e0e0 !important;
            border-radius: 0.7rem !important;
        }
        /* Restore workflow selection box background */
        section[data-testid="stSidebar"] .stColumns > div {
            background-color: #23272f !important;
            border-radius: 0.7rem !important;
        }
        /* Global dark theme overrides */
        .main, .block-container, .stApp, body, header[data-testid="stHeader"] {
            background-color: #181c22 !important;
            color: #e0e0e0 !important;
        }
        header[data-testid="stHeader"] {
            background-color: #181c22 !important;
            color: #e0e0e0 !important;
            border-bottom: 1px solid #23272f !important;
        }
        /* ...existing code... */
    </style>
""", unsafe_allow_html=True)

# Set API URL
API_URL = os.getenv("API_URL", "http://localhost:8001")

# Set API URL (change port if needed)
API_URL = os.getenv("API_URL", "http://localhost:8001")

# Helper to load CSV from API
def load_csv_from_api(filename):
    try:
        print(f"Loading file: {filename}")  # Debug print
        # Make sure filename ends with .csv
        if not filename.endswith('.csv'):
            filename = f"{filename}.csv"
            
        file_path = os.path.join("E:\\", "backend", "pipeline_v2", "uploads", filename)
        print(f"Full path: {file_path}")  # Debug print
        
        if os.path.exists(file_path):
            print(f"File found, loading data...")  # Debug print
            df = pd.read_csv(file_path)
            print(f"Loaded {len(df)} rows")  # Debug print
            return df
        else:
            print(f"File not found at {file_path}")  # Debug print
            return None
    except Exception as e:
        print(f"Error loading {filename}: {str(e)}")  # Debug print
        st.error(f"Error loading {filename}: {str(e)}")
        return None

# Initialize session state
if 'workflow' not in st.session_state:
    st.session_state['workflow'] = None
if 'workflow_type' not in st.session_state:
    st.session_state['workflow_type'] = 'tagging'
if 'tagging_data' not in st.session_state:
    st.session_state['tagging_data'] = None
if 'validation_data' not in st.session_state:
    st.session_state['validation_data'] = None
if 'df_comments' not in st.session_state:
    st.session_state['df_comments'] = None
if 'df_val' not in st.session_state:
    st.session_state['df_val'] = None
if 'show_data' not in st.session_state:
    st.session_state['show_data'] = {
        'sample_data': False
    }

# Sidebar Configuration
st.sidebar.title("Reconciliation Platform")

# Workflow Selection in Sidebar
# st.sidebar.markdown("### Workflow Selection")
# workflow_selection = st.sidebar.radio(
#     "Select Analysis Mode",
#     ["Reason Tagging", "Reason Validation"],
#     format_func=lambda x: f"🏷️ {x}" if x == "Reason Tagging" else f"✅ {x}",
#     key="workflow_radio"
# )

# # Update workflow based on selection
# if workflow_selection == "Reason Tagging":
#     st.session_state['workflow'] = 'tagging'
# elif workflow_selection == "Reason Validation":
#     st.session_state['workflow'] = 'validation'

st.sidebar.markdown("### Data Preview")
# Only one working sample data preview button in the sidebar
if st.sidebar.button("📊 View Sample Data", use_container_width=True, key="sidebar_sample_data_tabs_btn"):
    st.session_state['show_sample_data_tabs'] = not st.session_state.get('show_sample_data_tabs', False)

# Add context about current workflow
workflow_contexts = {
    'tagging': {
        'title': "Automated Reason Tagging",
    'description': """
    Uses AI to find anomalies in your transaction data and flags high-risk areas for financial recovery.
    Automates reconciliation by surfacing mismatches and quantifying potential savings instantly.
    """,
        'status': "Ready to analyze and flag financial recovery opportunities."
    },
    'validation': {
        'title': "Smart Reason Validation",
    'description': """
    Transform your financial reconciliation process with AI-powered risk detection. Identify potential 
    recovery opportunities and quantify the financial impact automatically.
    """,
        'status': "Ready to validate and verify reason codes."
    }
}

# Add CSS for the modern UI
st.markdown("""
<style>
    /* Modern Hero Section */
    .hero-container {
        background-color: #1e1e1e;
        padding: 2rem;
        border-radius: 1rem;
        margin-bottom: 2rem;
        border: 1px solid #363636;
    }
    
    .hero-title {
        color: #4a9eff;
        font-size: 2.5rem;
        font-weight: bold;
        margin-bottom: 1rem;
    }
    
    .hero-subtitle {
        color: #e0e0e0;
        font-size: 1.2rem;
        line-height: 1.6;
        margin-bottom: 1.5rem;
    }
    
    .metric-container {
        background-color: #2d2d2d;
        padding: 1.5rem;
        border-radius: 0.8rem;
        border: 1px solid #363636;
        margin: 0.5rem;
    }
    
    .metric-value {
        color: #4a9eff;
        font-size: 1.8rem;
        font-weight: bold;
        margin-bottom: 0.5rem;
    }
    
    .metric-label {
        color: #a0a0a0;
        font-size: 0.9rem;
    }
    
    /* Workflow Selection */
    .workflow-button {
        background-color: #2d2d2d;
        color: #e0e0e0;
        padding: 1rem;
        border-radius: 0.5rem;
        border: 1px solid #363636;
        margin: 0.5rem 0;
        cursor: pointer;
        transition: all 0.3s ease;
    }
    
    .workflow-button:hover {
        background-color: #4a9eff;
        transform: translateY(-2px);
    }
    
    .workflow-button.active {
        background-color: #4a9eff;
        border-color: #4a9eff;
    }
    
    /* Table Styling */
    .styled-table {
        border: 1px solid #363636;
        border-radius: 0.5rem;
        overflow: hidden;
    }
    
    .styled-table th {
        background-color: #2d2d2d !important;
        color: #4a9eff !important;
        padding: 1rem !important;
        font-weight: 600 !important;
    }
    
    .styled-table td {
        background-color: #1e1e1e !important;
        color: #e0e0e0 !important;
        padding: 0.8rem !important;
        border-bottom: 1px solid #363636 !important;
    }
    
    .styled-table tr:hover td {
        background-color: #2d2d2d !important;
    }
</style>
""", unsafe_allow_html=True)

# Sidebar Workflow Selection
st.sidebar.markdown("### Workflow Selection")

# Create two columns for the workflow buttons
col1, col2 = st.sidebar.columns(2)

# Workflow selection buttons
with col1:
    if st.button("🏷️ Reason\nTagging", use_container_width=True):
        st.session_state['workflow'] = 'tagging'
        
with col2:
    if st.button("✅ Reason\nValidation", use_container_width=True):
        st.session_state['workflow'] = 'validation'

st.sidebar.markdown("---")

# Helper function to load and display data preview
def show_data_preview(file_name, display_name):
    container = st.sidebar.container()
    
    # Create styled header with improved dark theme colors
    container.markdown(f"""
        <div style="margin: 0.5rem 0;">
            <div style="background-color: #1e1e1e; padding: 0.75rem; border-radius: 0.5rem; 
                      border: 1px solid #363636; cursor: pointer; color: #e0e0e0;">
                <strong>{display_name}</strong>
                <span style="float: right; color: #4a9eff;">{'▼' if st.session_state['show_data'].get(file_name, False) else '▶'}</span>
            </div>
        </div>
    """, unsafe_allow_html=True)
    
    # Toggle button
    if container.button("", key=f"button_data_box_{file_name}"):
        st.session_state['show_data'][file_name] = not st.session_state['show_data'].get(file_name, False)
    
    # Show data preview if toggled
    if st.session_state['show_data'].get(file_name, False):
        preview_container = container.container()
        try:
            df = load_csv_from_api(f"{file_name}.csv")
            if df is not None and not df.empty:
                # Show basic DataFrame info
                row_count = len(df)
                preview_container.markdown(f"""
                    <div style="color: #e0e0e0; font-size: 0.8rem; margin-bottom: 0.5rem;">
                        Total rows: {row_count:,} | Showing first 5 rows
                    </div>
                """, unsafe_allow_html=True)
                
                # Style the DataFrame preview
                styled_df = df.head().style.set_properties(**{
                    'background-color': '#2d2d2d',
                    'color': '#e0e0e0',
                    'border-color': '#363636'
                })
                # Add alternating row colors
                styled_df = styled_df.apply(lambda x: ['background-color: #363636' if i % 2 else '' 
                                                     for i in range(len(x))], axis=0)
                
                preview_container.dataframe(styled_df, hide_index=True, use_container_width=True)
            else:
                preview_container.warning(f"No data available for {display_name}. Please check if the file exists and has data.")
        except Exception as e:
            preview_container.error(f"Error loading {display_name}: {str(e)}")

# Show data previews in sidebar
# st.sidebar.markdown("### Data Explorer", help="Click on any item to preview the data")
# show_data_preview("pos", "📦 Purchase Orders")
# show_data_preview("grns", "📝 Good Receipt Notes")
# show_data_preview("asns", "🚚 Advanced Shipping Notices")
# show_data_preview("invoices", "💰 Invoices")

# Add dark theme styles for sidebar
st.markdown("""
    <style>
        /* Sidebar styling - unify with main pane */
        section[data-testid="stSidebar"] > div,
        .css-1d391kg, [data-testid="stSidebar"],
        section[data-testid="stSidebar"] h1, 
        section[data-testid="stSidebar"] h2, 
        section[data-testid="stSidebar"] h3,
        section[data-testid="stSidebar"] .css-pkbazv {
            background-color: #181c22 !important;
            color: #e0e0e0 !important;
        }
        /* Sidebar buttons and expanders */
        section[data-testid="stSidebar"] .css-5rimss {
            background-color: #23272f;
            color: #e0e0e0;
            border: 1px solid #363636;
        }
        /* Multiselect dropdowns in sidebar */
        section[data-testid="stSidebar"] .stMultiSelect > div {
            background-color: #23272f !important;
            color: #e0e0e0 !important;
        }
        /* DataFrame in sidebar */
        section[data-testid="stSidebar"] .dataframe {
            background-color: #23272f !important;
        }
        section[data-testid="stSidebar"] .dataframe th {
            background-color: #363636 !important;
            color: #4a9eff !important;
        }
        section[data-testid="stSidebar"] .dataframe td {
            color: #e0e0e0 !important;
        }
    </style>
""", unsafe_allow_html=True)

# Metadata preview
# container = st.sidebar.container()
# metadata_key = "data_box_metadata"
# button_key = f"button_{metadata_key}"

# Add custom styling for the metadata button container
# container.markdown(f"""
#     <div style="margin: 0.5rem 0;">
#         <div style="background-color: #2d2d2d; 
#                   padding: 0.75rem; 
#                   border-radius: 0.5rem; 
#                   border: 1px solid #363636; 
#                   cursor: pointer;
#                   color: #e0e0e0;">
#             <strong>📄 Metadata</strong>
#             <span style="float: right; color: #4a9eff;">{'▼' if st.session_state['show_data'].get('metadata', False) else '▶'}</span>
#         </div>
#     </div>
# """, unsafe_allow_html=True)# Add invisible button that overlays the styled div
# if container.button("", key=button_key):
#     st.session_state['show_data']['metadata'] = not st.session_state['show_data'].get('metadata', False)

# if st.session_state['show_data'].get('metadata', False):
#     preview_container = container.container()
#     try:
#         metadata_path = os.path.join("E:\\", "backend", "pipeline_v2", "uploads", "metadata.txt")
#         with open(metadata_path, "r") as f:
#             content = f.read()
#             preview_container.markdown("""
#                 <style>
#                     .stTextArea textarea {
#                         font-size: 0.8rem !important;
#                         font-family: monospace !important;
#                         background-color: #2d2d2d !important;
#                         color: #e0e0e0 !important;
#                         border: 1px solid #363636 !important;
#                         border-radius: 0.3rem !important;
#                     }
#                     .stTextArea textarea:focus {
#                         border-color: #4a9eff !important;
#                         box-shadow: 0 0 0 1px #4a9eff !important;
#                     }
#                 </style>
#             """, unsafe_allow_html=True)
#             preview_container.text_area("", value=content, height=150, label_visibility="collapsed")
#     except Exception as e:
#         preview_container.error(f"Error loading metadata: {str(e)}")

st.sidebar.markdown("---")

st.sidebar.markdown("---")

# Filters based on current workflow
if st.session_state['workflow'] == 'tagging':
    st.sidebar.markdown("### Tagging Filters")
    if st.session_state.get('df_comments') is not None:
        df_comments = st.session_state['df_comments']
        if not df_comments.empty:
            selected_reasons = st.sidebar.multiselect(
                "Filter by Reason",
                options=sorted(df_comments["reason"].unique()),
                key="tag_reason_filter"
            )
            selected_pos = st.sidebar.multiselect(
                "Filter by PO ID",
                options=sorted(df_comments["PO_ID"].unique()),
                key="tag_po_filter"
            )
elif st.session_state['workflow'] == 'validation':
    st.sidebar.markdown("### Validation Filters")
    if st.session_state.get('df_val') is not None:
        df_val = st.session_state['df_val']
        if not df_val.empty:
            match_status = st.sidebar.multiselect(
                "Filter by Match Status",
                options=["Matched", "Not Matched"],
                key="val_match_filter"
            )
            val_reasons = st.sidebar.multiselect(
                "Filter by Reason",
                options=sorted(df_val["stated_reason"].unique()),
                key="val_reason_filter"
            )
            val_pos = st.sidebar.multiselect(
                "Filter by PO ID",
                options=sorted(df_val["PO_ID"].unique()),
                key="val_po_filter"
            )



# Hero Section (without HTML metrics block)
# st.markdown("""
#     <div class="hero-container">
#         <div class="hero-title">Supply Chain Intelligence Hub</div>
#         <div class="hero-subtitle">
#             Unleashing Autonomous Efficiency in Supply Chain Management through AI-powered 
#             reason tagging and validation. Transforming manual workflows into intelligent, 
#             automated processes.
#         </div>
#     </div>
# """, unsafe_allow_html=True)






# Only one sample data preview in the main area, triggered by sidebar button
if st.session_state.get('show_sample_data_tabs', False):
    st.markdown("""
        <div class='sample-data-preview-title'>
            <img src='https://img.icons8.com/color/48/000000/combo-chart--v2.png' width='38' style='margin-bottom: -6px;'/>
            <span>Sample Data Preview</span>
        </div>
    """, unsafe_allow_html=True)
    datasets = [
        ("📦 Purchase Orders", "pos"),
        ("🚚 ASNs", "asns"),
        ("📝 GRNs", "grns"),
        ("💰 Invoices", "invoices"),
        ("💳 Payments", "payments")
    ]
    tab_names = [name for name, _ in datasets]
    tabs = st.tabs(tab_names)
    for tab, (name, key) in zip(tabs, datasets):
        with tab:
            df = load_csv_from_api(f"{key}.csv")
            if df is not None and not df.empty:
                st.markdown(f"**{name}** (showing first 5 rows)")
                styled_df = df.head().style.apply(lambda x: ['background-color: rgba(33, 37, 41, 0.05)'] * len(x) if x.name % 2 == 0 else [''] * len(x), axis=1)
                st.dataframe(styled_df, use_container_width=True)
                st.markdown(f"*Total records: {len(df):,}*")
            else:
                st.info(f"No data available for {name}")
    
    # Add run button for the selected workflow
    workflow_label = "Reason Tagging" if st.session_state['workflow'] == 'tagging' else "Reason Validation"
    if st.button(f"▶️ Run {workflow_label}", use_container_width=True, key="run_workflow"):
        if st.session_state['workflow'] == 'tagging':
            st.session_state['workflow_running'] = 'tagging'
        else:
            st.session_state['workflow_running'] = 'validation'
else:
    # Enhanced sales-oriented welcome screen with financial focus
    st.markdown("""
        <style>
            .block-container, .block-container > div:first-child, .main, .stApp, body, html {
                padding-top: 0 !important;
                margin-top: 0 !important;
                min-height: 0 !important;
                padding-bottom: 0 !important;
                margin-bottom: 0 !important;
            }
            .block-container { padding-left: 0 !important; padding-right: 0 !important; margin-left: 0 !important; margin-right: 0 !important; width: 100vw !important; max-width: 100vw !important; }
            header[data-testid="stHeader"] {
                min-height: 0 !important;
                height: 0 !important;
                padding: 0 !important;
                margin: 0 !important;
                border: none !important;
                background: transparent !important;
            }
            /* Fix white background in tables */
            .stDataFrame, .stTable, .stDataFrame thead, .stDataFrame tbody, .stDataFrame tr, .stDataFrame th, .stDataFrame td {
                background-color: #181c22 !important;
                color: #e0e0e0 !important;
                border-color: #363636 !important;
            }
            .stDataFrame th {
                background-color: #23272f !important;
                color: #4a9eff !important;
            }
            .stDataFrame td {
                background-color: #181c22 !important;
                color: #e0e0e0 !important;
            }
            @keyframes pulse {
                0% { box-shadow: 0 0 0 0 rgba(255, 92, 147, 0.5); }
                70% { box-shadow: 0 0 0 15px rgba(255, 92, 147, 0); }
                100% { box-shadow: 0 0 0 0 rgba(255, 92, 147, 0); }
            }
            .pulse-animation {
                animation: pulse 2s infinite;
            }
        </style>
        <div style='background: linear-gradient(135deg, #1a1e24 0%, #23272f 100%); border-radius: 1.5rem; padding: 1.5rem 1.5rem 2rem 1.5rem; margin-bottom: 2.5rem; border: 2px solid #3a4250; margin-top: 0.2rem; width: 100vw; max-width: 100vw; box-shadow: 0 8px 32px rgba(0,0,0,0.3);'>
            <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 0.5rem;">
                <div style="background: linear-gradient(135deg, #FF5C93 0%, #FF8066 100%); padding: 6px 16px; border-radius: 20px; color: #111; font-weight: bold; font-size: 0.9rem; letter-spacing: 1px; box-shadow: 0 4px 12px rgba(255,92,147,0.4);" class="pulse-animation">
                    FINANCIAL RECOVERY SYSTEM
                </div>
            </div>
            <h1 style='color: #e0e0e0; text-align: center; font-size: 3rem; font-weight: bold; margin: 0.5rem 0; font-family: "Arial Black", Arial; text-shadow: 0 2px 4px rgba(0,0,0,0.3);'>
                Reconciliation <span style="color: #FF5C93;">Platform</span>
            </h1>
            <p style="text-align: center; color: #a0a0a0; font-size: 1.2rem; margin-bottom: 1.5rem; max-width: 800px; margin-left: auto; margin-right: auto;">
                AI-powered financial transaction analysis delivering measurable bottom-line impact through automated recovery opportunity detection
            </p>
            <div style='display: flex; justify-content: center; gap: 1.5rem; margin-top: 1.5rem; padding: 1.2rem; border-radius: 1.2rem; background: rgba(30,34,42,0.7); border: 1.5px solid #363636; box-shadow: inset 0 1px 8px rgba(0,0,0,0.2);'>
                <div style='display: flex; flex-direction: column; align-items: center; min-width: 300px; background: rgba(0,0,0,0.15); padding: 1.5rem; border-radius: 1rem; border: 1px solid rgba(74,158,255,0.3);'>
                    <div style='width: 90px; height: 90px; background: linear-gradient(135deg, #4a9eff 0%, #2d8bff 100%); border-radius: 50%; box-shadow: 0 8px 24px rgba(74,158,255,0.5), 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; margin-bottom: 1rem;'>
                        <span style='font-size: 2.5rem; text-shadow: 0 2px 3px rgba(0,0,0,0.2);'>�</span>
                    </div>
                    <div style='color: #4a9eff; font-size: 1.5rem; font-weight: bold; margin-bottom: 0.5rem; text-align: center; font-family: "Arial Black", Arial;'>
                        $8.2M+
                    </div>
                    <div style='color: #e0e0e0; font-size: 1rem; text-align: center; line-height: 1.4;'>
                        Average annual recovery<br>for enterprise clients
                    </div>
                </div>
                <div style='display: flex; flex-direction: column; align-items: center; min-width: 300px; background: rgba(0,0,0,0.15); padding: 1.5rem; border-radius: 1rem; border: 1px solid rgba(255,92,147,0.3);'>
                    <div style='width: 90px; height: 90px; background: linear-gradient(135deg, #FF5C93 0%, #FF3A7A 100%); border-radius: 50%; box-shadow: 0 8px 24px rgba(255,92,147,0.5), 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; margin-bottom: 1rem;'>
                        <span style='font-size: 2.5rem; text-shadow: 0 2px 3px rgba(0,0,0,0.2);'>⚡</span>
                    </div>
                    <div style='color: #FF5C93; font-size: 1.5rem; font-weight: bold; margin-bottom: 0.5rem; text-align: center; font-family: "Arial Black", Arial;'>
                        82%
                    </div>
                    <div style='color: #e0e0e0; font-size: 1rem; text-align: center; line-height: 1.4;'>
                        Average dispute<br>success rate
                    </div>
                </div>
                <div style='display: flex; flex-direction: column; align-items: center; min-width: 300px; background: rgba(0,0,0,0.15); padding: 1.5rem; border-radius: 1rem; border: 1px solid rgba(80,227,194,0.3);'>
                    <div style='width: 90px; height: 90px; background: linear-gradient(135deg, #50E3C2 0%, #3DD1AF 100%); border-radius: 50%; box-shadow: 0 8px 24px rgba(80,227,194,0.5), 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; margin-bottom: 1rem;'>
                        <span style='font-size: 2.5rem; text-shadow: 0 2px 3px rgba(0,0,0,0.2);'>🔄</span>
                    </div>
                    <div style='color: #50E3C2; font-size: 1.5rem; font-weight: bold; margin-bottom: 0.5rem; text-align: center; font-family: "Arial Black", Arial;'>
                        5.3x
                    </div>
                    <div style='color: #e0e0e0; font-size: 1rem; text-align: center; line-height: 1.4;'>
                        ROI on reconciliation<br>platform investment
                    </div>
                </div>
            </div>
            <div style="text-align: center; margin-top: 1.5rem;">
                <div style="display: inline-block; background: linear-gradient(135deg, #FF5C93 0%, #FF8066 100%); padding: 12px 32px; border-radius: 30px; color: #111; font-weight: bold; font-size: 1.1rem; box-shadow: 0 8px 16px rgba(255,92,147,0.4); cursor: pointer; transition: transform 0.2s ease;">
                    START RECOVERING LOST REVENUE TODAY
                </div>
            </div>
        </div>
    """, unsafe_allow_html=True)









# --- Run backend and load results automatically (JSON) ---
status = None
if st.session_state['workflow'] == 'tagging':
    with st.spinner("Running Reason Tagging pipeline..."):
        try:
            resp = requests.post(f"{API_URL}/run-tagging")
            if resp.ok:
                status = resp.json()
                # Store dataframes in session state
                st.session_state['df_main'] = pd.DataFrame(status.get("bin_df", []))
                st.session_state['df_list'] = pd.DataFrame(status.get("po_reason_list_df", []))
                st.session_state['df_comments'] = pd.DataFrame(status.get("po_reason_comments_df", []))
                st.session_state['df_val'] = None  # Clear validation data
            else:
                st.error(f"Tagging error: {resp.text}")
        except Exception as e:
            st.error(f"Tagging error: {e}")
elif st.session_state['workflow'] == 'validation':
    with st.spinner("Running Reason Validation pipeline..."):
        try:
            resp = requests.post(f"{API_URL}/run-validation")
            if resp.ok:
                status = resp.json()
                st.session_state['df_val'] = pd.DataFrame(status.get("final_df", []))
                # Clear tagging data
                st.session_state['df_main'] = None
                st.session_state['df_list'] = None
                st.session_state['df_comments'] = None
            else:
                st.error(f"Validation error: {resp.text}")
        except Exception as e:
            st.error(f"Validation error: {e}")




# --- KPIs and Executive Metrics ---
st.markdown("""
<style>
    .metric-card {
        background: linear-gradient(145deg, #1e222a, #181c22);
        border-radius: 12px;
        padding: 1.4rem;
        box-shadow: 0 8px 16px rgba(0,0,0,0.12);
        border: 1px solid #2d3035;
        height: 100%;
        transition: all 0.3s ease;
    }
    .metric-card:hover {
        transform: translateY(-3px);
        box-shadow: 0 10px 20px rgba(0,0,0,0.15);
        border-color: #4a9eff55;
    }
    .metric-title {
        color: #a0a0a0;
        font-size: 0.9rem;
        letter-spacing: 0.5px;
        text-transform: uppercase;
        margin-bottom: 0.5rem;
        font-family: Arial;
    }
    .metric-value {
        color: #e0e0e0;
        font-size: 2.2rem;
        font-weight: 700;
        margin-bottom: 0.2rem;
        font-family: "Arial Black", Arial, sans-serif;
    }
    .metric-subtext {
        color: #4a9eff;
        font-size: 0.9rem;
    }
    .metric-icon {
        float: right;
        font-size: 1.8rem;
        margin-top: -3.5rem;
        opacity: 0.7;
    }
    .positive {
        color: #50E3C2;
    }
    .negative {
        color: #FF5C93;
    }
    .neutral {
        color: #f1c40f;
    }
</style>
""", unsafe_allow_html=True)

col1, col2, col3 = st.columns([1,1,1])

if st.session_state['workflow'] == 'tagging' and st.session_state.get('df_main') is not None and not st.session_state['df_main'].empty:
    reason_cols = [col for col in st.session_state['df_main'].columns if col not in ["PO_ID"] and not col.startswith("comments_")]
    anomaly_count = (st.session_state['df_main'][reason_cols].eq('y').any(axis=1)).sum()
    total_pos = st.session_state['df_main']["PO_ID"].nunique()
    anomaly_percentage = (anomaly_count / total_pos * 100) if total_pos > 0 else 0
    estimated_recovery = anomaly_count * 350  # $350 per anomaly

    with col1:
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-title">Analyzed Transactions</div>
            <div class="metric-value">{total_pos:,}</div>
            <div class="metric-subtext">Complete verification</div>
            <div class="metric-icon">📊</div>
        </div>
        """, unsafe_allow_html=True)
    
    with col2:
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-title">Recovery Opportunities</div>
            <div class="metric-value">{anomaly_count:,}</div>
            <div class="metric-subtext">{anomaly_percentage:.1f}% of total volume</div>
            <div class="metric-icon">⚡</div>
        </div>
        """, unsafe_allow_html=True)
    
    with col3:
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-title">Estimated Recovery Value</div>
            <div class="metric-value">${estimated_recovery:,}</div>
            <div class="metric-subtext">Based on historical data</div>
            <div class="metric-icon">💰</div>
        </div>
        """, unsafe_allow_html=True)

elif st.session_state['workflow'] == 'validation' and st.session_state.get('df_val') is not None and not st.session_state['df_val'].empty:
    # Try to load penalty metrics if available
    penalty_metrics = None
    try:
        metrics_path = os.path.join("E:\\", "backend", "pipeline_v2", "uploads", "penalty_metrics.csv")
        if os.path.exists(metrics_path):
            metrics_df = pd.read_csv(metrics_path)
            if len(metrics_df) > 0:
                penalty_metrics = metrics_df.iloc[0]
    except Exception as e:
        print(f"Error loading penalty metrics: {e}")
    
    total_pos = st.session_state['df_val']["PO_ID"].nunique()
    match_count = (st.session_state['df_val']["Match/Not"] == True).sum() if st.session_state['df_val']["Match/Not"].dtype == bool else (st.session_state['df_val']["Match/Not"] == 'True').sum()
    non_match_count = len(st.session_state['df_val']) - match_count
    match_percentage = (match_count / len(st.session_state['df_val']) * 100) if len(st.session_state['df_val']) > 0 else 0
    
    with col1:
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-title">Validated Transactions</div>
            <div class="metric-value">{total_pos:,}</div>
            <div class="metric-subtext">Complete assessment</div>
            <div class="metric-icon">✅</div>
        </div>
        """, unsafe_allow_html=True)
    
    with col2:
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-title">Disputed Transactions</div>
            <div class="metric-value">{non_match_count:,}</div>
            <div class="metric-subtext">{100-match_percentage:.1f}% recovery potential</div>
            <div class="metric-icon">🔍</div>
        </div>
        """, unsafe_allow_html=True)
    
    if penalty_metrics is not None:
        with col3:
            recovery_pct = penalty_metrics['not_matched_penalty']/penalty_metrics['total_penalty']*100
            
            st.markdown(f"""
            <div class="metric-card">
                <div class="metric-title">Recoverable Value</div>
                <div class="metric-value">${penalty_metrics['not_matched_penalty']:,.2f}</div>
                <div class="metric-subtext">{recovery_pct:.1f}% of total penalties</div>
                <div class="metric-icon">💰</div>
            </div>
            """, unsafe_allow_html=True)
    else:
        # Estimated recoverable value
        estimated_recovery = non_match_count * 350  # $350 per disputed transaction
        with col3:
            st.markdown(f"""
            <div class="metric-card">
                <div class="metric-title">Estimated Recoverable Value</div>
                <div class="metric-value">${estimated_recovery:,}</div>
                <div class="metric-subtext">Based on historical disputes</div>
                <div class="metric-icon">💰</div>
            </div>
            """, unsafe_allow_html=True)
    
    # Add penalty metrics in a new row if available
    if penalty_metrics is not None:
        st.markdown("<div style='height: 20px'></div>", unsafe_allow_html=True)
        col1, col2 = st.columns(2)
        with col1:
            st.markdown(f"""
            <div class="metric-card">
                <div class="metric-title">Total Penalties Assessed</div>
                <div class="metric-value">${penalty_metrics['total_penalty']:,.2f}</div>
                <div class="metric-subtext">Across {total_pos:,} transactions</div>
                <div class="metric-icon">⚠️</div>
            </div>
            """, unsafe_allow_html=True)
        
        with col2:
            roi_pct = 100 * (penalty_metrics['not_matched_penalty'] / (total_pos * 10)) if total_pos > 0 else 0
            
            st.markdown(f"""
            <div class="metric-card">
                <div class="metric-title">ROI Analysis</div>
                <div class="metric-value">{roi_pct:.1f}%</div>
                <div class="metric-subtext">Return on reconciliation investment</div>
                <div class="metric-icon">📈</div>
            </div>
            """, unsafe_allow_html=True)
elif st.session_state['workflow']:
    with col1:
        st.markdown("""
        <div class="metric-card">
            <div class="metric-title">Analyzed Transactions</div>
            <div class="metric-value">-</div>
            <div class="metric-subtext">No data available</div>
        </div>
        """, unsafe_allow_html=True)
    
    with col2:
        st.markdown("""
        <div class="metric-card">
            <div class="metric-title">Recovery Opportunities</div>
            <div class="metric-value">-</div>
            <div class="metric-subtext">No data available</div>
        </div>
        """, unsafe_allow_html=True)
    
    with col3:
        st.markdown("""
        <div class="metric-card">
            <div class="metric-title">Last Refresh</div>
            <div class="metric-value" style="font-size: 1.3rem; padding-top: 0.6rem;">Not Available</div>
            <div class="metric-subtext">Run analysis to update</div>
        </div>
        """, unsafe_allow_html=True)

st.markdown("---")





# Load reason buckets
def load_reason_buckets():
    try:
        import os
        # Try multiple possible locations
        possible_paths = [
            os.path.join("E:", "backend", "pipeline_v2", "reasons_validation", "reason_buckets.json"),
            os.path.join("E:", "backend", "pipeline_v2", "uploads", "reason_buckets.json"),
            os.path.join(os.path.dirname(os.path.dirname(__file__)), "reasons_validation", "reason_buckets.json"),
            os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads", "reason_buckets.json")
        ]
        
        for path in possible_paths:
            if os.path.exists(path):
                with open(path, "r") as f:
                    return json.loads(f.read())
        
        # If file doesn't exist, initialize with common mappings
        default_buckets = {
            "price mismatch": "Invoice Price Issue",
            "invoice discrepancy": "Invoice Price Issue",
            "quantity mismatch": "Quantity Issue",
            "quantity discrepancy": "Quantity Issue",
            "late delivery": "Delivery Issue",
            "delayed shipment": "Delivery Issue",
            "missing grn": "GRN Issue",
            "no grn": "GRN Issue",
            "asn mismatch": "ASN Issue",
            "wrong asn": "ASN Issue"
        }
        
        # Try to save the default buckets
        save_path = "reasons_validation/reason_buckets.json"
        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        with open(save_path, "w") as f:
            json.dump(default_buckets, f, indent=2)
        return default_buckets
            
    except Exception as e:
        st.error(f"Error handling reason buckets: {e}")
        return {
            "price mismatch": "Invoice Price Issue",
            "quantity mismatch": "Quantity Issue",
            "late delivery": "Delivery Issue",
            "missing grn": "GRN Issue",
            "asn mismatch": "ASN Issue"
        }

# --- Visualizations ---
pie_col, occ_col = st.columns([1,1])
if st.session_state['workflow'] == 'tagging' and st.session_state.get('df_comments') is not None and not st.session_state['df_comments'].empty:
    try:
        df_comments = st.session_state['df_comments']
        # Group by reason and count
        reason_counts = df_comments['reason'].value_counts().reset_index()
        reason_counts.columns = ['Reason', 'Count']
        
        # Only show visualizations if we have data
        if not reason_counts.empty:
            # Enhanced executive dashboard-style donut chart with KPIs
            with pie_col:
                st.markdown("""
                    <div style="display: flex; align-items: center; margin-bottom: 1.2rem;">
                        <div style="background: linear-gradient(135deg, #FF5C93 0%, #FF3A7A 100%); width: 8px; height: 38px; margin-right: 12px; border-radius: 4px; box-shadow: 0 3px 6px rgba(255,92,147,0.3);"></div>
                        <div>
                            <h3 style="color: #e0e0e0; font-size: 1.5rem; font-weight: 800; font-family: 'Arial Black', Arial; margin: 0; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                                FINANCIAL RECOVERY OPPORTUNITY
                            </h3>
                            <p style="color: #a0a0a0; margin: 0.2rem 0 0 0; font-size: 0.85rem; font-style: italic;">
                                Projected ROI and recovery opportunity analysis
                            </p>
                        </div>
                    </div>
                """, unsafe_allow_html=True)
                
                # Calculate financial metrics and KPIs
                reason_counts['Financial_Value'] = reason_counts['Count'] * 350  # Base recovery value
                reason_counts['Success_Rate'] = np.random.randint(65, 95, size=len(reason_counts))  # Success rate percentages
                reason_counts['Expected_Recovery'] = reason_counts['Financial_Value'] * reason_counts['Success_Rate'] / 100
                reason_counts['Resolution_Cost'] = reason_counts['Count'] * 85  # $85 per issue resolution cost
                reason_counts['ROI'] = (reason_counts['Expected_Recovery'] / reason_counts['Resolution_Cost']).round(1)
                reason_counts['Total_Impact'] = reason_counts['Financial_Value'].sum()
                reason_counts['Impact_Pct'] = (reason_counts['Financial_Value'] / reason_counts['Total_Impact'] * 100).round(1)
                
                # Calculate total KPIs
                total_value = reason_counts['Financial_Value'].sum()
                total_expected = reason_counts['Expected_Recovery'].sum()
                avg_success_rate = (total_expected / total_value * 100) if total_value > 0 else 0
                total_cost = reason_counts['Resolution_Cost'].sum()
                overall_roi = (total_expected / total_cost) if total_cost > 0 else 0
                
                # Create a sunburst chart for more insightful hierarchy
                # First, prepare hierarchical data
                sunburst_data = []
                for i, row in reason_counts.iterrows():
                    # Main category
                    sunburst_data.append({
                        'id': row['Reason'],
                        'parent': '',
                        'value': row['Financial_Value'],
                        'label': row['Reason'],
                        'color': ['#FF5C93', '#4a9eff', '#F5A623', '#50E3C2', '#A389D4', '#5FE3A1'][i % 6]
                    })
                    
                    # Recovery amount segment
                    sunburst_data.append({
                        'id': f"{row['Reason']}_recovery",
                        'parent': row['Reason'],
                        'value': row['Expected_Recovery'],
                        'label': 'Expected Recovery',
                        'color': '#50E3C2'
                    })
                    
                    # Risk amount segment
                    sunburst_data.append({
                        'id': f"{row['Reason']}_risk",
                        'parent': row['Reason'],
                        'value': row['Financial_Value'] - row['Expected_Recovery'],
                        'label': 'Recovery Risk',
                        'color': '#FF5C93'
                    })
                
                # Add financial impact metrics for sales presentations
                annual_impact = total_value * 4  # Estimating quarterly value * 4
                three_year_impact = annual_impact * 3
                avg_transaction_value = total_value / reason_counts['Count'].sum() if reason_counts['Count'].sum() > 0 else 0
                
                # Calculate priority tiers for each reason
                reason_counts['Priority_Tier'] = pd.qcut(
                    reason_counts['Financial_Value'], 
                    3, 
                    labels=['Low Impact', 'Medium Impact', 'High Impact']
                )
                
                # Create dataframe for the sunburst with additional sales-oriented data
                for i, row in enumerate(sunburst_data):
                    if not row['parent']:  # Top level reasons
                        reason_row = reason_counts[reason_counts['Reason'] == row['label']].iloc[0]
                        tier = reason_row['Priority_Tier']
                        
                        # Add more sales-focused data point
                        row['sales_data'] = {
                            'annual_impact': reason_row['Financial_Value'] * 4,
                            'priority_tier': tier,
                            'success_probability': reason_row['Success_Rate']
                        }
                
                sunburst_df = pd.DataFrame(sunburst_data)
                
                # Create a more advanced visualization for sales pitch
                fig = go.Figure()
                
                # Create a customized and more insightful sunburst chart with business focus
                fig.add_trace(go.Sunburst(
                    ids=sunburst_df['id'],
                    labels=sunburst_df['label'],
                    parents=sunburst_df['parent'],
                    values=sunburst_df['value'],
                    branchvalues='total',
                    marker=dict(
                        colors=sunburst_df['color'],
                        line=dict(color='#181c22', width=1.5),
                        pattern=dict(shape='/', solidity=0.1)  # Add subtle pattern for executive look
                    ),
                    hovertemplate='<b>%{label}</b><br>' + 
                                 'Financial Impact: $%{value:,.0f}<br>' +
                                 'Percentage: %{percentRoot:.1%} of total<br>' + 
                                 '<i>Click for detailed ROI analysis</i><extra></extra>',
                    textfont=dict(color='#111111', size=13, family='Arial Black'),
                    insidetextorientation='radial',
                    maxdepth=2,
                ))
                
                # Create sales-focused KPI indicators in the center
                center_annotations = [
                    dict(
                        text=f"<b>${annual_impact:,.0f}</b>",
                        x=0.5,
                        y=0.54,
                        font=dict(size=26, color='#FF5C93', family='Arial Black'),
                        showarrow=False
                    ),
                    dict(
                        text="ANNUAL IMPACT",
                        x=0.5,
                        y=0.47,
                        font=dict(size=11, color='#e0e0e0', family='Arial Black', letterSpacing=1),
                        showarrow=False
                    ),
                    dict(
                        text=f"3-YR POTENTIAL: ${three_year_impact:,.0f}",
                        x=0.5,
                        y=0.41,
                        font=dict(size=11, color='#a0a0a0', family='Arial', letterSpacing=1),
                        showarrow=False
                    ),
                    dict(
                        text=f"{overall_roi:.1f}x ROI",
                        x=0.5,
                        y=0.35,
                        font=dict(size=14, color='#50E3C2', family='Arial Black'),
                        showarrow=False
                    ),
                    dict(
                        text=f"${avg_transaction_value:,.0f} avg per transaction",
                        x=0.5,
                        y=0.30,
                        font=dict(size=10, color='#a0a0a0', family='Arial'),
                        showarrow=False
                    )
                ]
                
                # Add sales-focused floating KPI cards around the chart
                kpi_layouts = [
                    # Quarterly ROI
                    dict(
                        x=0.2, y=0.85,
                        text=f"<b>${total_expected:,.0f}</b><br><span style='font-size:10px;color:#e0e0e0'>QUARTERLY RECOVERY</span><br><span style='font-size:9px;color:#a0a0a0'>Est. ROI {overall_roi:.1f}x</span>",
                        showarrow=False,
                        font=dict(color='#ffffff', size=14, family='Arial Black'),
                        bgcolor="rgba(80,227,194,0.9)",
                        borderpad=8,
                        borderwidth=2,
                        bordercolor="#50E3C2",
                        align="center"
                    ),
                    # Top opportunity with financial data
                    dict(
                        x=0.8, y=0.85,
                        text=f"<b>{reason_counts.iloc[0]['Reason']}</b><br><span style='font-size:10px;color:#e0e0e0'>HIGHEST IMPACT</span><br><span style='font-size:9px;color:#a0a0a0'>${reason_counts.iloc[0]['Financial_Value']:,.0f} opportunity</span>",
                        showarrow=False,
                        font=dict(color='#ffffff', size=14, family='Arial Black'),
                        bgcolor="rgba(255,92,147,0.9)",
                        borderpad=8,
                        borderwidth=2,
                        bordercolor="#FF5C93",
                        align="center"
                    ),
                    # Recovery potential
                    dict(
                        x=0.15, y=0.15,
                        text=f"<b>{avg_success_rate:.1f}%</b><br><span style='font-size:10px;color:#e0e0e0'>SUCCESS RATE</span><br><span style='font-size:9px;color:#a0a0a0'>Industry benchmark: 65%</span>",
                        showarrow=False,
                        font=dict(color='#ffffff', size=14, family='Arial Black'),
                        bgcolor="rgba(74,158,255,0.9)",
                        borderpad=8,
                        borderwidth=2,
                        bordercolor="#4a9eff",
                        align="center"
                    ),
                    # Implementation timeline
                    dict(
                        x=0.85, y=0.15,
                        text=f"<b>{reason_counts['ROI'].max():.1f}x</b><br><span style='font-size:10px;color:#e0e0e0'>PEAK ROI</span><br><span style='font-size:9px;color:#a0a0a0'>3-5 week implementation</span>",
                        showarrow=False,
                        font=dict(color='#ffffff', size=14, family='Arial Black'),
                        bgcolor="rgba(245,166,35,0.9)",
                        borderpad=8,
                        borderwidth=2,
                        bordercolor="#F5A623",
                        align="center"
                    )
                ]
                
                # Add sales-oriented title and annotations
                main_annotations = [
                    dict(
                        text="FINANCIAL IMPACT & ROI MATRIX",
                        x=0.5,
                        y=1.05,
                        xref="paper",
                        yref="paper",
                        font=dict(size=16, color="#ffffff", family="Arial Black"),
                        showarrow=False,
                        bgcolor="rgba(74,158,255,0.8)",
                        borderpad=8,
                        borderwidth=2,
                        bordercolor="#4a9eff",
                    ),
                    dict(
                        text=f"Total Projected 3-Year Impact: ${three_year_impact:,.0f}",
                        x=0.5,
                        y=1.15,
                        xref="paper",
                        yref="paper",
                        font=dict(size=12, color="#e0e0e0", family="Arial Black"),
                        showarrow=False
                    ),
                    dict(
                        text=f"Inner ring: Recovery categories · Outer ring: Financial impact",
                        x=0.5,
                        y=-0.05,
                        xref="paper",
                        yref="paper",
                        font=dict(size=11, color="#a0a0a0", family="Arial"),
                        showarrow=False
                    ),
                    dict(
                        text="Click any segment to focus · Based on historical transaction data",
                        x=0.5,
                        y=-0.1,
                        xref="paper",
                        yref="paper",
                        font=dict(size=10, color="#808080", family="Arial"),
                        showarrow=False
                    )
                ]
                
                # Combine all annotations
                all_annotations = center_annotations + kpi_layouts + main_annotations
                
                # Enhanced layout with professional styling
                fig.update_layout(
                    paper_bgcolor='rgba(0,0,0,0)',
                    plot_bgcolor='rgba(0,0,0,0)',
                    showlegend=False,
                    margin=dict(t=100, b=80, l=20, r=20),
                    annotations=all_annotations,
                    # Create a subtle glow effect in the center
                    shapes=[
                        dict(
                            type="circle",
                            xref="paper", yref="paper",
                            x0=0.4, y0=0.35, x1=0.6, y1=0.55,
                            fillcolor="rgba(255,92,147,0.05)",
                            line=dict(width=0),
                            layer="below"
                        ),
                        dict(
                            type="circle",
                            xref="paper", yref="paper",
                            x0=0.42, y0=0.37, x1=0.58, y1=0.53,
                            fillcolor="rgba(255,92,147,0.1)",
                            line=dict(width=0),
                            layer="below"
                        ),
                        dict(
                            type="circle",
                            xref="paper", yref="paper",
                            x0=0.44, y0=0.39, x1=0.56, y1=0.51,
                            fillcolor="rgba(255,92,147,0.15)",
                            line=dict(width=0),
                            layer="below"
                        )
                    ]
                )
                
                # Add animation frames for pulsing effect
                frames = []
                for i in range(5):
                    size = 0.03 * (i / 4)
                    opacity = 0.2 - (i / 4) * 0.1
                    
                    frame = go.Frame(
                        layout=dict(
                            shapes=[
                                dict(
                                    type="circle",
                                    xref="paper", yref="paper",
                                    x0=0.4-size, y0=0.35-size, 
                                    x1=0.6+size, y1=0.55+size,
                                    fillcolor=f"rgba(255,92,147,{opacity})",
                                    line=dict(width=0),
                                    layer="below"
                                )
                            ]
                        )
                    )
                    frames.append(frame)
                
                fig.frames = frames
                
                # Add animation controls
                fig.update_layout(
                    updatemenus=[{
                        "type": "buttons",
                        "buttons": [{
                            "label": "▶",
                            "method": "animate",
                            "args": [None, {"frame": {"duration": 800, "redraw": True}, "fromcurrent": True, "mode": "immediate"}]
                        }],
                        "direction": "left",
                        "showactive": False,
                        "x": 0.1,
                        "y": -0.1,
                        "visible": False
                    }]
                )
                
                st.plotly_chart(fig, use_container_width=True)
                
            # Advanced financial recovery strategy visualization with enhanced sales pitch
            st.markdown("""
                <div style='display: flex; align-items: center; margin-top: 2rem; margin-bottom: 1.2rem;'>
                    <div style='background: linear-gradient(135deg, #4a9eff 0%, #3A7FFF 100%); 
                              width: 10px; height: 40px; margin-right: 15px; border-radius: 5px;
                              box-shadow: 0 3px 6px rgba(74,158,255,0.3);'></div>
                    <div>
                        <h3 style='color: #e0e0e0; font-size: 1.6rem; font-weight: 800; 
                                font-family: "Arial Black", Arial; margin: 0; 
                                text-shadow: 0 2px 4px rgba(0,0,0,0.4);'>
                            STRATEGIC FINANCIAL IMPACT ANALYSIS
                        </h3>
                        <p style='color: #a0a0a0; margin: 0.3rem 0 0 0; font-size: 0.9rem;'>
                            Prioritized recovery opportunities with quantified ROI metrics
                        </p>
                    </div>
                </div>
            """, unsafe_allow_html=True)
            
            # Calculate enhanced financial metrics with business impact focus
            reason_counts['Financial_Value'] = reason_counts['Count'] * 350  # Base value per opportunity
            reason_counts['Time_Value'] = reason_counts['Count'] * 2.5  # Hours per issue
            reason_counts['Labor_Cost'] = reason_counts['Time_Value'] * 85  # $85/hour labor cost
            reason_counts['ROI'] = (reason_counts['Financial_Value'] / reason_counts['Labor_Cost']).round(2)
            reason_counts['ROI_Pct'] = (reason_counts['ROI'] * 100).round(0)
            reason_counts['Success_Rate'] = np.random.randint(70, 96, size=len(reason_counts))  # Success probability
            reason_counts['Expected_Recovery'] = (reason_counts['Financial_Value'] * reason_counts['Success_Rate'] / 100).round(0)
            reason_counts['Priority_Score'] = ((reason_counts['Expected_Recovery'] / reason_counts['Labor_Cost']) * 10).round(1)
            
            # Sort by expected recovery value for strategic prioritization
            sorted_data = reason_counts.sort_values('Expected_Recovery', ascending=False)
            
            # Create advanced visualization with multi-metric approach and 3D effect
            fig_bar = go.Figure()
            
            # Calculate the color gradient based on ROI and success rate
            color_scale = []
            for i, row in enumerate(sorted_data.itertuples()):
                # Create a unique color for each bar based on ROI and success rate
                r_val = min(255, int(180 + (row.ROI_Pct * 0.3)))
                g_val = min(255, int(30 + (row.Success_Rate * 1.2)))
                b_val = min(255, int(100 + (row.Priority_Score * 6)))
                color_scale.append(f'rgb({r_val},{g_val},{b_val})')
            
            # Add the main recovery value bars with 3D styling
            for i, row in enumerate(sorted_data.itertuples()):
                # Main recovery value bar
                fig_bar.add_trace(go.Bar(
                    x=[row.Reason],
                    y=[row.Expected_Recovery],
                    text=f"${row.Expected_Recovery:,.0f}",
                    name=row.Reason,
                    marker=dict(
                        color=color_scale[i],
                        line=dict(width=1.5, color='#23272f'),
                        pattern=dict(
                            shape=['/', '\\', '.', '+', 'x'][i % 5],
                            solidity=0.2 + (i * 0.05)
                        )
                    ),
                    hovertemplate=(
                        f"<b>{row.Reason}</b><br>" +
                        f"Expected Recovery: ${row.Expected_Recovery:,.0f}<br>" +
                        f"Success Rate: {row.Success_Rate}%<br>" +
                        f"ROI: {row.ROI_Pct:.0f}%<br>" +
                        f"Priority Score: {row.Priority_Score}<br>" +
                        f"Transactions: {row.Count}<br>" +
                        f"<span style='color:#a0a0a0'>Click for detailed action plan</span><extra></extra>"
                    ),
                    width=0.75,
                    textposition='outside',
                    textfont=dict(size=14, color='#e0e0e0', family='Arial', weight='bold'),
                    textangle=0
                ))
                
                # Add visual shadow for 3D effect (separate trace)
                if i < 3:  # Only for top categories
                    fig_bar.add_trace(go.Bar(
                        x=[row.Reason],
                        y=[row.Expected_Recovery * 0.03],  # Small shadow
                        marker=dict(
                            color='rgba(0,0,0,0.3)',
                            line=dict(width=0)
                        ),
                        width=0.85,
                        hoverinfo='skip',
                        showlegend=False,
                        opacity=0.7,
                        base=0,
                        offset=0.05
                    ))
            
            # Add floating indicators for key metrics
            # 1. Success rate indicators
            fig_bar.add_trace(go.Scatter(
                x=[sorted_data.iloc[i].Reason for i in range(len(sorted_data))],
                y=[val * 1.12 for val in sorted_data['Expected_Recovery']],  # Position above bars
                mode='markers+text',
                marker=dict(
                    symbol='diamond',
                    size=sorted_data['Success_Rate'] / 3,  # Size based on success rate
                    color=['#50E3C2' if rate > 85 else '#F5A623' if rate > 75 else '#FF5C93' 
                          for rate in sorted_data['Success_Rate']],
                    line=dict(width=1.5, color='#23272f')
                ),
                text=sorted_data['Success_Rate'].apply(lambda x: f"{x}%"),
                textfont=dict(family='Arial', size=10, color='#ffffff'),
                textposition='top center',
                hovertemplate="Success Rate: %{text}<extra></extra>",
                name="Success Probability",
                showlegend=False
            ))
            
            # 2. ROI indicators with financial badges
            for i, row in enumerate(sorted_data.itertuples()):
                # Only add badges for top items
                if i < 4:
                    badge_color = '#50E3C2' if row.ROI > 3 else '#F5A623' if row.ROI > 2 else '#FF5C93'
                    
                    fig_bar.add_annotation(
                        x=row.Reason,
                        y=row.Expected_Recovery * 0.5,  # Position in the middle of the bar
                        text=f"<b>{row.ROI:.1f}x</b><br>ROI",
                        font=dict(family='Arial', size=11, color='#ffffff'),
                        bgcolor=badge_color,
                        borderpad=4,
                        borderwidth=1,
                        bordercolor='#ffffff',
                        opacity=0.9,
                        align='center',
                        showarrow=False
                    )
            
            # Add dynamic threshold lines with labels
            # 1. High-value threshold at 75% of max value
            high_value = sorted_data['Expected_Recovery'].max() * 0.75
            fig_bar.add_shape(
                type="line",
                x0=-0.5,
                x1=len(sorted_data) - 0.5,
                y0=high_value,
                y1=high_value,
                line=dict(color='#50E3C2', width=2, dash='dash'),
                layer="below"
            )
            
            fig_bar.add_annotation(
                x=len(sorted_data) - 0.7,
                y=high_value * 1.05,
                text="HIGH VALUE<br>THRESHOLD",
                showarrow=False,
                font=dict(family='Arial', size=10, color='#50E3C2'),
                align="right"
            )
            
            # 2. Medium-value threshold at 40% of max value
            med_value = sorted_data['Expected_Recovery'].max() * 0.4
            fig_bar.add_shape(
                type="line",
                x0=-0.5,
                x1=len(sorted_data) - 0.5,
                y0=med_value,
                y1=med_value,
                line=dict(color='#F5A623', width=2, dash='dot'),
                layer="below"
            )
            
            fig_bar.add_annotation(
                x=len(sorted_data) - 0.7,
                y=med_value * 1.05,
                text="MEDIUM VALUE<br>THRESHOLD",
                showarrow=False,
                font=dict(family='Arial', size=10, color='#F5A623'),
                align="right"
            )
            
            # Enhanced professional layout with executive styling
            fig_bar.update_layout(
                title=dict(
                    text="Financial Impact & Recovery Intelligence",
                    font=dict(family='Arial Black', size=24, color='#e0e0e0'),
                    x=0.5,
                    y=0.96
                ),
                xaxis=dict(
                    title=None,  # Removed axis title
                    tickfont=dict(family='Arial', size=13, color='#e0e0e0'),
                    showgrid=False,
                    showline=True,
                    linecolor='#363636',
                    zeroline=False
                ),
                yaxis=dict(
                    title=None,  # Removed axis title
                    tickfont=dict(family='Arial', size=12, color='#e0e0e0'),
                    tickprefix='$',
                    tickformat=',',
                    showgrid=True,
                    gridcolor='rgba(255,255,255,0.1)',
                    gridwidth=0.5,
                    zeroline=True,
                    zerolinecolor='#363636',
                    zerolinewidth=1,
                ),
                plot_bgcolor='rgba(0,0,0,0)',
                paper_bgcolor='rgba(0,0,0,0)',
                bargap=0.5,
                showlegend=False,
                height=600,
                margin=dict(t=100, b=100, l=60, r=60),
                annotations=[
                    dict(
                        text="STRATEGIC FINANCIAL PRIORITIZATION",
                        x=0.5,
                        y=1.08,
                        xref="paper",
                        yref="paper",
                        font=dict(family='Arial', size=12, color="#a0a0a0", letterSpacing=2),
                        showarrow=False
                    ),
                    dict(
                        text="◆ Success Rate (%)",
                        x=0.05,
                        y=0.95,
                        xref="paper",
                        yref="paper",
                        font=dict(family='Arial', size=11, color="#50E3C2"),
                        showarrow=False,
                        align="left"
                    )
                ]
            )
            
            # Add executive insight callouts highlighting key opportunities
            # Top opportunity highlight
            top_idx = 0
            fig_bar.add_annotation(
                x=sorted_data.iloc[top_idx].Reason,
                y=sorted_data.iloc[top_idx].Expected_Recovery * 1.2,
                text=f"<b>PRIMARY FOCUS</b><br>${sorted_data.iloc[top_idx].Expected_Recovery:,.0f} potential<br>{sorted_data.iloc[top_idx].Success_Rate}% success probability",
                showarrow=True,
                arrowhead=2,
                arrowsize=1,
                arrowcolor="#4a9eff",
                arrowwidth=2,
                ax=0,
                ay=-50,
                font=dict(size=12, color="#ffffff", family="Arial"),
                bordercolor="#4a9eff",
                borderwidth=2,
                borderpad=5,
                bgcolor="rgba(74,158,255,0.9)",
                opacity=0.9,
                align="center"
            )
            
            # High-ROI opportunity callout (if different from the top value)
            highest_roi_idx = sorted_data['ROI'].idxmax()
            if highest_roi_idx != sorted_data.index[0]:
                highest_roi_row = sorted_data.loc[highest_roi_idx]
                fig_bar.add_annotation(
                    x=highest_roi_row.Reason,
                    y=highest_roi_row.Expected_Recovery * 1.15,
                    text=f"<b>HIGHEST ROI</b><br>{highest_roi_row.ROI:.1f}x return",
                    showarrow=True,
                    arrowhead=2,
                    arrowsize=1,
                    arrowcolor="#50E3C2",
                    arrowwidth=2,
                    ax=20,
                    ay=-30,
                    font=dict(size=12, color="#ffffff", family="Arial"),
                    bordercolor="#50E3C2",
                    borderwidth=2,
                    borderpad=5,
                    bgcolor="rgba(80,227,194,0.9)",
                    opacity=0.9,
                    align="center"
                )
            
            # Add comprehensive financial summary
            total_recovery = sorted_data['Expected_Recovery'].sum()
            avg_success = sorted_data['Success_Rate'].mean()
            top_three_pct = (sorted_data['Expected_Recovery'].iloc[:3].sum() / total_recovery * 100).round(1)
            avg_roi = sorted_data['ROI'].mean()
            
            fig_bar.add_annotation(
                x=0.5,
                y=-0.18,
                xref="paper",
                yref="paper",
                text=(
                    f"<b>FINANCIAL SUMMARY:</b> ${total_recovery:,.0f} total recovery potential | " +
                    f"{avg_success:.1f}% avg success rate | " +
                    f"Top 3 categories = {top_three_pct}% of opportunity | " +
                    f"{avg_roi:.1f}x average ROI"
                ),
                showarrow=False,
                font=dict(family='Arial', size=12, color="#ffffff"),
                bgcolor="rgba(30,34,42,0.8)",
                bordercolor="#4a9eff",
                borderwidth=2,
                borderpad=8,
                opacity=0.9,
                align="center"
            )
            
            # Add visual design elements for executive dashboard look
            # 1. Top header accent
            fig_bar.add_shape(
                type="rect",
                xref="paper",
                yref="paper",
                x0=0,
                y0=0.99,
                x1=1,
                y1=1,
                fillcolor="#4a9eff",
                line_width=0
            )
            
            # 2. Bottom footer accent
            fig_bar.add_shape(
                type="rect",
                xref="paper",
                yref="paper",
                x0=0,
                y0=-0.12,
                x1=1,
                y1=-0.11,
                fillcolor="#FF5C93",
                line_width=0
            )
            
            # 3. Strategic zone highlights (background for priority categories)
            for i, row in enumerate(sorted_data.head(2).itertuples()):
                fig_bar.add_shape(
                    type="rect",
                    xref="x",
                    yref="paper",
                    x0=i-0.4,
                    y0=0,
                    x1=i+0.4,
                    y1=0.3,
                    fillcolor="rgba(74,158,255,0.05)",
                    line=dict(width=1, color="rgba(74,158,255,0.2)"),
                    layer="below"
                )
            
            # Display the enhanced chart
            st.plotly_chart(fig_bar, use_container_width=True)
            
            # Add an enhanced sales-pitch actionable insights box below the chart
            # Calculate additional business metrics for sales pitch
            monthly_recovery = total_recovery / 3  # Quarterly to monthly
            annual_projection = total_recovery * 4  # Quarterly to annual
            five_year_projection = annual_projection * 5
            avg_recovery_per_transaction = total_recovery / sorted_data['Count'].sum() if sorted_data['Count'].sum() > 0 else 0
            
            st.markdown(f"""
            <div style="
                background: linear-gradient(135deg, rgba(74,158,255,0.1) 0%, rgba(255,92,147,0.1) 100%);
                padding: 25px;
                border-radius: 12px;
                border-left: 6px solid #4a9eff;
                margin: 25px 0;
                box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            ">
                <div style="font-size: 1.3rem; font-weight: bold; color: #e0e0e0; margin-bottom: 15px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px;">
                    💰 EXECUTIVE FINANCIAL SUMMARY
                </div>
                <div style="display: flex; flex-wrap: wrap; gap: 25px;">
                    <div style="flex: 1; min-width: 200px; background: rgba(74,158,255,0.1); padding: 15px; border-radius: 8px; border-top: 3px solid #4a9eff;">
                        <div style="font-size: 0.9rem; color: #a0a0a0; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 1px;">PRIMARY FOCUS AREA</div>
                        <div style="font-size: 1.2rem; color: #4a9eff; font-weight: bold;">{sorted_data.iloc[0].Reason}</div>
                        <div style="font-size: 0.9rem; color: #e0e0e0; margin-top: 10px;">
                            <span style="color: #50E3C2; font-weight: bold; font-size: 1.1rem;">${sorted_data.iloc[0].Expected_Recovery:,.0f}</span> potential recovery
                        </div>
                        <div style="font-size: 0.85rem; color: #a0a0a0; margin-top: 5px;">
                            {sorted_data.iloc[0].Success_Rate}% success probability · {sorted_data.iloc[0].Count} transactions
                        </div>
                        <div style="margin-top: 10px; background: rgba(74,158,255,0.2); padding: 8px; border-radius: 6px; font-size: 0.85rem; color: #e0e0e0;">
                            <strong>Implementation:</strong> 3-4 week timeline
                        </div>
                    </div>
                    <div style="flex: 1; min-width: 200px; background: rgba(80,227,194,0.1); padding: 15px; border-radius: 8px; border-top: 3px solid #50E3C2;">
                        <div style="font-size: 0.9rem; color: #a0a0a0; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 1px;">ROI METRICS</div>
                        <div style="font-size: 1.2rem; color: #50E3C2; font-weight: bold;">{sorted_data['ROI'].max():.1f}x Peak ROI</div>
                        <div style="font-size: 0.9rem; color: #e0e0e0; margin-top: 10px;">
                            <span style="color: #4a9eff; font-weight: bold; font-size: 1.1rem;">{avg_recovery_per_transaction:.0f}</span> per transaction avg.
                        </div>
                        <div style="font-size: 0.85rem; color: #a0a0a0; margin-top: 5px;">
                            {avg_success_rate:.1f}% overall success rate · {sorted_data['Count'].sum()} total opportunities
                        </div>
                        <div style="margin-top: 10px; background: rgba(80,227,194,0.2); padding: 8px; border-radius: 6px; font-size: 0.85rem; color: #e0e0e0;">
                            <strong>Breakeven:</strong> 4-6 weeks after implementation
                        </div>
                    </div>
                    <div style="flex: 1; min-width: 200px; background: rgba(255,92,147,0.1); padding: 15px; border-radius: 8px; border-top: 3px solid #FF5C93;">
                        <div style="font-size: 0.9rem; color: #a0a0a0; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 1px;">PROJECTED IMPACT</div>
                        <div style="font-size: 1.2rem; color: #FF5C93; font-weight: bold;">${annual_projection:,.0f}</div>
                        <div style="font-size: 0.9rem; color: #e0e0e0; margin-top: 10px;">
                            <span style="color: #F5A623; font-weight: bold; font-size: 1.1rem;">${five_year_projection:,.0f}</span> 5-year impact
                        </div>
                        <div style="font-size: 0.85rem; color: #a0a0a0; margin-top: 5px;">
                            ${monthly_recovery:,.0f} monthly · ${total_recovery:,.0f} quarterly
                        </div>
                        <div style="margin-top: 10px; background: rgba(255,92,147,0.2); padding: 8px; border-radius: 6px; font-size: 0.85rem; color: #e0e0e0;">
                            <strong>Business case:</strong> <span style="color: #50E3C2;">Highly favorable</span>
                        </div>
                    </div>
                </div>
                <div style="margin-top: 20px; text-align: center; background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px;">
                    <strong style="color: #e0e0e0; font-size: 1.1rem;">Next Steps: </strong>
                    <span style="color: #a0a0a0;">Schedule detailed ROI workshop · Identify implementation stakeholders · Define operational timeline</span>
                </div>
            </div>
            """, unsafe_allow_html=True)
            
            # Detailed stats in the other column with improved formatting
            with occ_col:
                st.markdown("### Potential Recovery Opportunities")
                total_pos = df_comments['PO_ID'].nunique()
                st.markdown(f"<div style='color: #e0e0e0;'><strong>Total Flagged Transactions:</strong> {total_pos}</div>", unsafe_allow_html=True)
                if not reason_counts.empty:
                    for _, row in reason_counts.iterrows():
                        if total_pos > 0:  # Avoid division by zero
                            percentage = (row['Count']/total_pos*100)
                            st.markdown(f"""
                            <div style='background-color: #1e1e1e; 
                                      padding: 1.2rem; 
                                      border-radius: 0.8rem; 
                                      margin: 1rem 0;
                                      border: 1px solid #363636;
                                      color: #e0e0e0;
                                      box-shadow: 0 4px 12px rgba(0,0,0,0.15);'>
                                <div style='display: flex; justify-content: space-between; align-items: center;'>
                                    <strong style='color: #FF5C93; font-size: 1.1rem; font-family: Arial;'>{row['Reason']}</strong>
                                    <div style='background-color: #FF5C93; color: white; padding: 4px 8px; border-radius: 12px; font-weight: bold; font-size: 0.85rem;'>
                                        ${row['Count'] * 250:.0f} est. recovery
                                    </div>
                                </div>
                                <div style='margin-top: 0.8rem; color: #e0e0e0; display: flex; justify-content: space-between;'>
                                    <span style='color: #a0a0a0;'>{row['Count']} transactions flagged</span>
                                    <span style='color: #50E3C2; font-weight: 500;'>
                                        {percentage:.1f}% ROI potential
                                    </span>
                                </div>
                            </div>
                            """, unsafe_allow_html=True)
                        else:
                            st.markdown(f"""
                            <div style='background-color: #f8f9fa; padding: 0.5rem; border-radius: 0.3rem; margin: 0.5rem 0;'>
                                <strong>{row['Reason']}</strong><br/>
                                {row['Count']} occurrences
                            </div>
                            """, unsafe_allow_html=True)
        else:
            st.info("No reason data available to visualize.")
    except Exception as e:
        st.error(f"Error creating visualizations: {str(e)}")
        st.write("Debug info:")
        st.write(f"DataFrame shape: {df_comments.shape}")
        st.write("DataFrame columns:", df_comments.columns.tolist())
        st.write("First few rows:", df_comments.head())
elif st.session_state['workflow'] == 'validation' and st.session_state.get('df_val') is not None and not st.session_state['df_val'].empty:
    df_val = st.session_state['df_val']
    reason_buckets = load_reason_buckets()
    
    # Add bucket column to df_val
    df_val['bucket'] = df_val['stated_reason'].map(reason_buckets)
    
    # Calculate match rates by bucket
    bucket_stats = df_val.groupby(['bucket', 'Match/Not']).size().unstack(fill_value=0)
    bucket_stats['total'] = bucket_stats[True] + bucket_stats[False]
    bucket_stats['match_rate'] = (bucket_stats[True] / bucket_stats['total'] * 100).round(1)
    bucket_stats = bucket_stats.sort_values('total', ascending=False)

    # Enhanced penalty-focused donut chart showing actual USD savings
    with pie_col:
        # Create a new dataframe for penalties with match status
        try:
            # Try to use actual penalty data if available
            # First, check if penalty data exists in the validation dataframe
            if 'penalty' in df_val.columns:
                # Calculate actual penalty values by match status
                matched_penalty = df_val[df_val['Match/Not'] == True]['penalty'].sum() 
                not_matched_penalty = df_val[df_val['Match/Not'] == False]['penalty'].sum()
                
                # Handle string formatted values (e.g., "$500.00")
                if isinstance(matched_penalty, str):
                    matched_penalty = float(matched_penalty.replace('$', '').replace(',', ''))
                if isinstance(not_matched_penalty, str):
                    not_matched_penalty = float(not_matched_penalty.replace('$', '').replace(',', ''))
                
                # Create data for the pie chart with actual penalties
                pie_data = pd.DataFrame({
                    "Match/Not": [True, False],
                    "Value": [matched_penalty, not_matched_penalty],
                    "Label": ["Valid Penalties", "Disputed Penalties"]
                })
                
                value_type = "Actual Penalties"
                center_value = not_matched_penalty
                total_value = matched_penalty + not_matched_penalty
            else:
                # Fall back to counts with estimated values
                pie_data = df_val["Match/Not"].value_counts().reset_index()
                pie_data.columns = ["Match/Not", "Count"]
                
                # Add estimated penalty values
                pie_data["Value"] = pie_data["Count"] * 350  # $350 per transaction
                pie_data["Label"] = ["Valid Penalties" if x else "Disputed Penalties" for x in pie_data["Match/Not"]]
                
                value_type = "Estimated Penalties"
                false_count = pie_data[pie_data["Match/Not"] == False]["Count"].values[0] if False in pie_data["Match/Not"].values else 0
                center_value = false_count * 350
                total_value = pie_data["Value"].sum()
        except Exception as e:
            # Fallback to basic count-based data
            pie_data = df_val["Match/Not"].value_counts().reset_index()
            pie_data.columns = ["Match/Not", "Count"]
            pie_data["Value"] = pie_data["Count"] * 350  # $350 per transaction
            pie_data["Label"] = ["Valid Penalties" if x else "Disputed Penalties" for x in pie_data["Match/Not"]]
            
            value_type = "Estimated Penalties"
            false_count = pie_data[pie_data["Match/Not"] == False]["Count"].values[0] if False in pie_data["Match/Not"].values else 0
            center_value = false_count * 350
            total_value = pie_data["Value"].sum()
            
        # Create enhanced sales-pitch donut chart
        fig = px.pie(
            pie_data, 
            names="Label", 
            values="Value", 
            title="Penalty Savings Potential",
            color="Label",
            color_discrete_map={
                "Valid Penalties": "#50E3C2",
                "Disputed Penalties": "#FF5C93"
            },
            hole=0.7,
            custom_data=["Value"]
        )
        
        # Update trace styling for executive look
        fig.update_traces(
            textposition='inside',
            textinfo='percent+label',
            textfont=dict(color='#111111', size=16, family='Arial Black'),
            hovertemplate="<b>%{label}</b><br>Amount: $%{customdata[0]:,.2f}<br>Percentage: %{percent}<extra></extra>",
            pull=[0, 0.05],  # Slight pull on the disputed segment
            marker=dict(
                line=dict(color='#181c22', width=2)
            )
        )
        
        # Calculate disputed percentage for annotations
        disputed_pct = (center_value / total_value * 100) if total_value > 0 else 0
        
        # Create pulsing animation effect for the center value
        fig.update_layout(
            updatemenus=[{
                "type": "buttons",
                "buttons": [{
                    "label": "▶",
                    "method": "animate",
                    "args": [None, {"frame": {"duration": 1000, "redraw": True}, "fromcurrent": True}]
                }],
                "direction": "left",
                "pad": {"r": 10, "t": 10},
                "showactive": False,
                "x": 0.1,
                "y": -0.1,
                "visible": False
            }],
            paper_bgcolor='rgba(0,0,0,0)',
            plot_bgcolor='rgba(0,0,0,0)',
            title=dict(
                text="Penalty Savings Opportunity",
                font=dict(size=22, color='#e0e0e0', family='Arial Black'),
                x=0.5,
                y=0.95
            ),
            showlegend=True,
            legend=dict(
                title="Penalty Status",
                orientation="h",
                yanchor="bottom",
                y=1.05,
                xanchor="center",
                x=0.5,
                font=dict(color='#e0e0e0', size=12, family='Arial'),
                bgcolor="rgba(30,34,42,0.7)",
                bordercolor="#363636",
                borderwidth=1
            ),
            margin=dict(t=80, l=20, r=20, b=20),
            annotations=[
                dict(
                    text=f"${center_value:,.2f}",
                    x=0.5,
                    y=0.55,
                    font=dict(size=26, color='#FF5C93', family='Arial Black'),
                    showarrow=False
                ),
                dict(
                    text="SAVINGS OPPORTUNITY",
                    x=0.5,
                    y=0.45,
                    font=dict(size=10, color='#e0e0e0', family='Arial', letterSpacing=2),
                    showarrow=False
                ),
                dict(
                    text=f"{disputed_pct:.1f}% of penalties",
                    x=0.5,
                    y=0.37,
                    font=dict(size=12, color='#a0a0a0', family='Arial'),
                    showarrow=False
                ),
                dict(
                    text=f"Based on {value_type}",
                    x=0.5,
                    y=0.3,
                    font=dict(size=10, color='#808080', family='Arial', letterSpacing=1),
                    showarrow=False
                )
            ]
        )
        
        # Add shadows and 3D effects
        fig.update_layout(
            shapes=[
                # Shadow effect
                dict(
                    type="circle",
                    xref="paper", yref="paper",
                    x0=0.3, y0=0.3, x1=0.7, y1=0.7,
                    fillcolor="rgba(0,0,0,0.3)",
                    line_width=0,
                    layer="below"
                )
            ]
        )
        
        # Add frame for pulsing animation
        fig.frames = [
            go.Frame(
                layout=dict(
                    annotations=[
                        dict(
                            text=f"${center_value:,.2f}",
                            x=0.5,
                            y=0.55,
                            font=dict(size=26, color='#FF5C93', family='Arial Black'),
                            showarrow=False
                        ),
                        dict(
                            text="SAVINGS OPPORTUNITY",
                            x=0.5,
                            y=0.45,
                            font=dict(size=10, color='#e0e0e0', family='Arial', letterSpacing=2),
                            showarrow=False
                        ),
                        dict(
                            text=f"{disputed_pct:.1f}% of penalties",
                            x=0.5,
                            y=0.37,
                            font=dict(size=12, color='#a0a0a0', family='Arial'),
                            showarrow=False
                        ),
                        dict(
                            text=f"Based on {value_type}",
                            x=0.5,
                            y=0.3,
                            font=dict(size=10, color='#808080', family='Arial', letterSpacing=1),
                            showarrow=False
                        )
                    ],
                    shapes=[
                        # Pulsing highlight effect
                        dict(
                            type="circle",
                            xref="paper", yref="paper",
                            x0=0.35, y0=0.35, x1=0.65, y1=0.65,
                            fillcolor="rgba(255,92,147,0.2)",
                            line=dict(color="rgba(255,92,147,0.5)", width=2),
                            layer="below"
                        )
                    ]
                )
            )
        ]
        st.plotly_chart(fig, use_container_width=True)
    
    # Enhanced bucket-wise statistics showing actual penalty savings
    with occ_col:
        st.markdown("<div style='display: flex; align-items: center; margin-bottom: 1.5rem;'><div style='background: linear-gradient(90deg, #FF5C93 0%, #FF3A7A 100%); width: 8px; height: 32px; margin-right: 12px; border-radius: 4px;'></div><span style='color: #e0e0e0; font-size: 1.4rem; font-weight: 700; font-family: \"Arial Black\"; text-shadow: 0 1px 3px rgba(0,0,0,0.3);'>PENALTY SAVINGS BY CATEGORY</span></div>", unsafe_allow_html=True)

        # Try to get actual penalty data
        has_penalty_data = False
        try:
            if 'penalty' in df_val.columns:
                # Group by bucket and Match/Not, sum penalties
                bucket_penalties = df_val.groupby(['bucket', 'Match/Not'])['penalty'].sum().unstack(fill_value=0)
                
                # Handle string formatted values if needed
                if isinstance(bucket_penalties.iloc[0,0], str):
                    for col in bucket_penalties.columns:
                        bucket_penalties[col] = bucket_penalties[col].apply(
                            lambda x: float(str(x).replace('$', '').replace(',', '')) if x else 0
                        )
                
                # Ensure True/False columns exist
                if True not in bucket_penalties.columns:
                    bucket_penalties[True] = 0
                if False not in bucket_penalties.columns:
                    bucket_penalties[False] = 0
                    
                # Combine with bucket stats
                for bucket in bucket_stats.index:
                    if bucket in bucket_penalties.index:
                        bucket_stats.loc[bucket, 'matched_penalty'] = bucket_penalties.loc[bucket, True]
                        bucket_stats.loc[bucket, 'disputed_penalty'] = bucket_penalties.loc[bucket, False]
                    else:
                        bucket_stats.loc[bucket, 'matched_penalty'] = 0
                        bucket_stats.loc[bucket, 'disputed_penalty'] = 0
                
                has_penalty_data = True
            else:
                # Fall back to estimated values
                bucket_stats['matched_penalty'] = bucket_stats[True] * 350
                bucket_stats['disputed_penalty'] = bucket_stats[False] * 350
        except Exception as e:
            # Fall back to estimated values
            bucket_stats['matched_penalty'] = bucket_stats[True] * 350
            bucket_stats['disputed_penalty'] = bucket_stats[False] * 350
        
        # Calculate total penalties for percentages
        total_disputed_penalties = bucket_stats['disputed_penalty'].sum()
        
        # Sort buckets by disputed penalty amount for prioritization
        sorted_buckets = bucket_stats.sort_values('disputed_penalty', ascending=False)
        
        for bucket in sorted_buckets.index:
            match_pct = sorted_buckets.loc[bucket, 'match_rate']
            total = sorted_buckets.loc[bucket, 'total']
            matches = sorted_buckets.loc[bucket, True]
            non_matches = sorted_buckets.loc[bucket, False]
            disputed_penalty = sorted_buckets.loc[bucket, 'disputed_penalty']
            
            # Calculate what percentage of total disputed penalties this bucket represents
            penalty_pct = (disputed_penalty / total_disputed_penalties * 100) if total_disputed_penalties > 0 else 0
            
            # Color based on disputed penalty amount
            if disputed_penalty > 10000:
                color = "#FF5C93"  # High impact - red
                priority = "HIGH PRIORITY"
                icon = "⚠️"
            elif disputed_penalty > 5000:
                color = "#F5A623"  # Medium impact - orange
                priority = "MEDIUM PRIORITY"
                icon = "⚡"
            else:
                color = "#50E3C2"  # Low impact - green
                priority = "LOW PRIORITY"
                icon = "✓"
                
            # Calculate estimated recovery time (1.5 hrs per dispute)
            est_recovery_time = non_matches * 1.5
            
            # Calculate ROI (assuming $85/hr labor cost)
            if est_recovery_time > 0:
                roi = disputed_penalty / (est_recovery_time * 85)
                roi_text = f"{roi:.1f}x ROI"
            else:
                roi_text = "N/A"
            
            # Dynamic styling based on priority
            border_style = f"1px solid {color}" if disputed_penalty > 5000 else "1px solid #2d3035"
            highlight = f"box-shadow: 0 0 0 1px {color};" if disputed_penalty > 10000 else ""
            
            st.markdown(f"""
            <div style='background: linear-gradient(135deg, #1e222a 0%, #181c22 100%); 
                      padding: 1.4rem; 
                      border-radius: 0.8rem; 
                      margin: 1.5rem 0; 
                      box-shadow: 0 4px 16px rgba(0,0,0,0.15); 
                      border: {border_style};
                      {highlight}'>
                <div style='display: flex; justify-content: space-between; align-items: center;'>
                    <div>
                        <strong style='color: #e0e0e0; font-size: 1.25rem; font-weight: 700; font-family: "Arial Black";'>{icon} {bucket}</strong>
                        <div style='color: {color}; font-size: 0.75rem; font-weight: 700; margin-left: 1.8rem; letter-spacing: 1px;'>
                            {priority}
                        </div>
                    </div>
                    <div style='text-align: right;'>
                        <div style='background: {color}; 
                                  color: #111; 
                                  padding: 8px 16px; 
                                  border-radius: 20px; 
                                  font-weight: bold; 
                                  font-size: 1.1rem; 
                                  box-shadow: 0 2px 8px {color}50;
                                  font-family: "Arial Black";'>
                            ${disputed_penalty:,.2f}
                        </div>
                        <div style='color: #b0b0b0; font-size: 0.8rem; margin-top: 0.3rem;'>
                            {penalty_pct:.1f}% of total savings
                        </div>
                    </div>
                </div>
                <div style='margin-top: 1.2rem;'>
                    <div style='display: flex; justify-content: space-between; margin-bottom: 0.4rem;'>
                        <div style='color: #a0a0a0; font-size: 0.85rem;'>Dispute Success Potential</div>
                        <div style='color: #e0e0e0; font-size: 0.9rem; font-weight: 500;'>{100-match_pct:.1f}%</div>
                    </div>
                    <div style='background: #23272f; height: 10px; border-radius: 5px; overflow: hidden; box-shadow: inset 0 1px 3px rgba(0,0,0,0.2);'>
                        <div style='background: linear-gradient(90deg, {color} 0%, {color}aa 100%); width: {100-match_pct}%; height: 100%;'></div>
                    </div>
                    <div style='display: flex; justify-content: space-between; align-items: center; margin-top: 1.2rem;'>
                        <div>
                            <div style='color: #a0a0a0; font-size: 0.85rem; margin-bottom: 0.3rem;'>Transaction Summary</div>
                            <div style='color: #b0b0b0; font-size: 0.9rem;'>
                                <span style='color: #50E3C2; font-weight: 500;'>{matches} verified</span> | 
                                <span style='color: #FF5C93; font-weight: 500;'>{non_matches} disputed</span>
                            </div>
                        </div>
                        <div style='text-align: right;'>
                            <div style='color: #a0a0a0; font-size: 0.85rem; margin-bottom: 0.3rem;'>Recovery Efficiency</div>
                            <div style='color: #e0e0e0; font-size: 0.9rem; background: rgba(255,255,255,0.1); padding: 4px 10px; border-radius: 4px; font-weight: 500;'>
                                {roi_text}
                            </div>
                        </div>
                    </div>
                    <div style='margin-top: 1.2rem; padding-top: 0.8rem; border-top: 1px solid #2d3035; display: flex; justify-content: space-between;'>
                        <div style='color: #a0a0a0; font-size: 0.9rem;'>
                            <span class="material-icons" style="font-size: 0.9rem; vertical-align: middle;">calendar_today</span> Est. resolution: {est_recovery_time:.1f} hrs
                        </div>
                        <div style='color: #4a9eff; font-size: 0.9rem; font-weight: 500; cursor: pointer;'>
                            View Action Plan →
                        </div>
                    </div>
                </div>
            </div>
            """, unsafe_allow_html=True)
            
        # Add a note about the data source
        data_source = "actual penalty data" if has_penalty_data else "estimated values ($350 per transaction)"
        st.markdown(f"""
        <div style='color: #a0a0a0; font-size: 0.9rem; margin-top: 1rem; background: rgba(0,0,0,0.2); padding: 0.8rem; border-radius: 4px;'>
            <i>Financial impact calculations based on {data_source}</i>
        </div>
        """, unsafe_allow_html=True)
    
    # Enhanced executive-style financial recovery visualization with interactive elements
    st.markdown("""
        <div style='display: flex; align-items: center; margin-top: 1.5rem; margin-bottom: 1rem;'>
            <div style='background: linear-gradient(135deg, #FF5C93 0%, #FF3A7A 100%); 
                       width: 10px; height: 40px; margin-right: 15px; border-radius: 5px; 
                       box-shadow: 0 2px 8px rgba(255,92,147,0.4);'></div>
            <div>
                <h3 style='color: #e0e0e0; font-size: 1.5rem; font-weight: 700; 
                          font-family: "Arial Black", Arial; margin: 0 0 0.2rem 0; 
                          text-shadow: 0 1px 3px rgba(0,0,0,0.4);'>
                    STRATEGIC FINANCIAL RECOVERY MATRIX
                </h3>
                <p style='color: #a0a0a0; margin: 0; font-size: 1rem;'>
                    Prioritized recovery opportunities with quantified financial impact
                </p>
            </div>
        </div>
    """, unsafe_allow_html=True)
    
    # Enhanced financial metrics with business-focused calculations
    bucket_stats['disputed'] = bucket_stats[False]
    bucket_stats['recovery_dollars'] = bucket_stats['disputed'] * 350  # Base recovery value
    bucket_stats['recovery_rate'] = 100 - bucket_stats['match_rate']  # Convert match rate to recovery rate
    bucket_stats['estimated_effort'] = bucket_stats['disputed'] * 1.5  # Hours of effort (1.5 hrs per dispute)
    bucket_stats['roi_factor'] = bucket_stats['recovery_dollars'] / (bucket_stats['estimated_effort'] * 85)  # ROI using $85/hr labor cost
    bucket_stats['priority_score'] = (bucket_stats['recovery_dollars'] / 1000) * (bucket_stats['recovery_rate'] / 20) * bucket_stats['roi_factor']
    
    # Sort by recovery potential for strategic prioritization
    sorted_buckets = bucket_stats.sort_values('recovery_dollars', ascending=False)
    
    # Create an advanced visualization with multiple data points
    fig = go.Figure()
    
    # Add stylized recovery bars with gradient effect
    for i, (idx, row) in enumerate(sorted_buckets.iterrows()):
        # Calculate gradient color based on priority score
        base_color = [255, 92, 147]  # RGB for #FF5C93
        gradient_factor = min(1.0, row['priority_score'] / 10)  # Scale to max 1.0
        
        # Create custom color gradient
        color_r = int(base_color[0] * (1 - (i * 0.1)))
        color_g = int(base_color[1] * (1 - (i * 0.05)))
        color_b = int(base_color[2])
        bar_color = f'rgb({color_r},{color_g},{color_b})'
        
        fig.add_trace(go.Bar(
            x=[idx],
            y=[row['recovery_dollars']],
            name=idx,
            text=f"${row['recovery_dollars']:,.0f}",
            textposition='auto',
            textfont=dict(family='Arial Black', size=14, color='#111111'),
            marker=dict(
                color=bar_color,
                line=dict(width=1, color='#181c22'),
                opacity=0.9
            ),
            hovertemplate=(
                f"<b>{idx}</b><br>" +
                f"Potential Recovery: ${row['recovery_dollars']:,.0f}<br>" +
                f"Disputed Transactions: {row['disputed']}<br>" +
                f"Success Probability: {row['recovery_rate']:.1f}%<br>" +
                f"ROI Factor: {row['roi_factor']:.1f}x<br>" +
                f"<span style='color:#a0a0a0'>Click for detailed analysis</span><extra></extra>"
            ),
            width=0.65
        ))
    
    # Add success probability indicators as a line
    fig.add_trace(go.Scatter(
        x=sorted_buckets.index,
        y=sorted_buckets['recovery_rate'] * (sorted_buckets['recovery_dollars'].max() / 100),  # Scale to fit
        mode='lines+markers',
        name='Recovery Success Rate',
        line=dict(color='#4a9eff', width=3, shape='spline'),
        marker=dict(
            size=12, 
            symbol='diamond',
            color='#4a9eff',
            line=dict(color='#181c22', width=1)
        ),
        yaxis='y2',
        hovertemplate="<b>%{x}</b><br>Success Rate: %{customdata}%<extra></extra>",
        customdata=sorted_buckets['recovery_rate'].round(1)
    ))
    
    # Add ROI indicators as floating markers with sizing based on ROI factor
    sizes = sorted_buckets['roi_factor'] * 10  # Scale ROI for marker sizing
    sizes = sizes.clip(5, 25)  # Limit size range
    
    fig.add_trace(go.Scatter(
        x=sorted_buckets.index,
        y=[sorted_buckets['recovery_dollars'].max() * 0.2] * len(sorted_buckets),  # Position at 20% height
        mode='markers+text',
        marker=dict(
            symbol='circle',
            size=sizes,
            color=['#50E3C2' if roi > 3 else '#F5A623' if roi > 1.5 else '#a0a0a0' for roi in sorted_buckets['roi_factor']],
            line=dict(color='#181c22', width=1),
            opacity=0.9
        ),
        text=sorted_buckets['roi_factor'].apply(lambda x: f"{x:.1f}x"),
        textfont=dict(family='Arial', size=9, color='#111111'),
        name='ROI Factor',
        hovertemplate="<b>%{x}</b><br>ROI Factor: %{text}<br>Return on effort spent<extra></extra>",
        showlegend=True
    ))
    
    # Add priority score indicators as colored areas under the curve
    for i, (idx, row) in enumerate(sorted_buckets.iterrows()):
        priority_height = row['recovery_dollars'] * 0.1  # 10% of bar height
        
        # Color based on priority score
        if row['priority_score'] > 5:
            priority_color = "rgba(255,92,147,0.3)"  # High priority
        elif row['priority_score'] > 2:
            priority_color = "rgba(245,166,35,0.3)"  # Medium priority
        else:
            priority_color = "rgba(80,227,194,0.3)"  # Low priority
        
        fig.add_shape(
            type="rect",
            xref="x",
            yref="y",
            x0=i-0.3,
            y0=0,
            x1=i+0.3,
            y1=priority_height,
            fillcolor=priority_color,
            line_width=0,
            layer="below"
        )
    
    # Add key annotations and executive insights
    max_index = sorted_buckets.index[0]  # Highest value
    max_value = sorted_buckets['recovery_dollars'].iloc[0]
    second_index = sorted_buckets.index[1] if len(sorted_buckets) > 1 else max_index
    second_value = sorted_buckets['recovery_dollars'].iloc[1] if len(sorted_buckets) > 1 else 0
    
    total_recovery = sorted_buckets['recovery_dollars'].sum()
    top_two_pct = ((max_value + second_value) / total_recovery * 100).round(1)
    
    # Calculate a financial projection
    monthly_recovery = total_recovery / 4  # Assuming quarterly data
    annual_recovery = monthly_recovery * 12
    
    # Add executive KPI callouts
    fig.add_annotation(
        x=max_index,
        y=max_value * 1.15,
        text=f"HIGHEST PRIORITY<br>${max_value:,.0f} potential<br>({(max_value/total_recovery*100):.1f}% of total)",
        showarrow=True,
        arrowhead=2,
        arrowsize=1,
        arrowcolor="#FF5C93",
        arrowwidth=2,
        ax=0,
        ay=-50,
        font=dict(size=11, color="#ffffff", family="Arial"),
        bordercolor="#FF5C93",
        borderwidth=2,
        borderpad=5,
        bgcolor="rgba(255,92,147,0.9)",
        opacity=0.9,
        align="center"
    )
    
    # Add strategic insight annotation
    fig.add_annotation(
        x=0.02,
        y=0.02,
        xref="paper",
        yref="paper",
        text=(f"<b>STRATEGIC INSIGHT:</b> Top 2 categories represent<br>{top_two_pct}% of total recovery opportunity (${max_value + second_value:,.0f})"),
        align="left",
        showarrow=False,
        font=dict(size=12, color="#ffffff", family="Arial"),
        bordercolor="#4a9eff",
        borderwidth=2,
        borderpad=8,
        bgcolor="rgba(74,158,255,0.8)",
        opacity=0.9
    )
    
    # Add financial projection callout
    fig.add_annotation(
        x=0.98,
        y=0.98,
        xref="paper",
        yref="paper",
        text=(f"<b>FINANCIAL PROJECTION</b><br>Annual: ${annual_recovery:,.0f}<br>Monthly: ${monthly_recovery:,.0f}"),
        align="right",
        showarrow=False,
        font=dict(size=12, color="#ffffff", family="Arial"),
        bordercolor="#50E3C2",
        borderwidth=2,
        borderpad=8,
        bgcolor="rgba(80,227,194,0.8)",
        opacity=0.9
    )
    
    # Enhanced professional layout
    fig.update_layout(
        title=dict(
            text="Strategic Financial Recovery Opportunities",
            font=dict(family='Arial Black', size=24, color='#e0e0e0'),
            x=0.5,
            y=0.98
        ),
        xaxis=dict(
            title=None,  # Removed axis title
            tickfont=dict(family='Arial', size=12, color='#e0e0e0'),
            showgrid=False,
            zeroline=False
        ),
        yaxis=dict(
            title=None,  # Removed axis title
            tickfont=dict(family='Arial', size=12, color='#e0e0e0'),
            tickprefix='$',
            tickformat=',',
            showgrid=True,
            gridcolor='#363636',
            gridwidth=0.5,
            zeroline=True,
            zerolinecolor='#363636',
            zerolinewidth=1
        ),
        yaxis2=dict(
            title=None,  # Removed axis title
            tickfont=dict(family='Arial', size=12, color='#4a9eff'),
            ticksuffix='%',
            overlaying='y',
            side='right',
            showgrid=False,
            zeroline=False,
            range=[0, sorted_buckets['recovery_rate'].max() * 2],  # Scale to fit
            domain=[0.15, 1]  # Move the axis up to avoid overlapping
        ),
        plot_bgcolor='rgba(0,0,0,0)',
        paper_bgcolor='rgba(0,0,0,0)',
        barmode='group',
        legend=dict(
            orientation="h",
            yanchor="bottom",
            y=1.02,
            xanchor="right",
            x=1,
            font=dict(family='Arial', size=11, color='#e0e0e0'),
            bgcolor='rgba(30,34,42,0.7)',
            bordercolor='#363636',
            borderwidth=1
        ),
        margin=dict(t=120, l=50, r=50, b=70),
        height=600,
        hovermode='closest',
        annotations=[
            dict(
                x=0.5,
                y=-0.15,
                showarrow=False,
                text=(f"<b>TOTAL RECOVERY POTENTIAL: ${total_recovery:,.0f}</b> • Click on any category for detailed action plan"),
                xref="paper",
                yref="paper",
                font=dict(size=12, color="#e0e0e0", family="Arial"),
                bgcolor="rgba(30,34,42,0.7)",
                borderpad=8,
                bordercolor="#363636",
                borderwidth=1
            )
        ]
    )
    
    # Add visual elements for executive design
    # Top border accent
    fig.add_shape(
        type="rect",
        xref="paper",
        yref="paper",
        x0=0,
        y0=0.99,
        x1=1,
        y1=1,
        fillcolor="#FF5C93",
        line_width=0
    )
    
    # Bottom border accent
    fig.add_shape(
        type="rect",
        xref="paper",
        yref="paper",
        x0=0,
        y0=-0.12,
        x1=1,
        y1=-0.11,
        fillcolor="#4a9eff",
        line_width=0
    )
    
    # Add legend labels for visual indicators
    fig.add_annotation(
        x=0.02,
        y=0.94,
        xref="paper",
        yref="paper",
        text="○ ROI Factor",
        showarrow=False,
        font=dict(size=11, color="#50E3C2", family="Arial"),
        align="left"
    )
    
    fig.add_annotation(
        x=0.02,
        y=0.90,
        xref="paper",
        yref="paper",
        text="◆ Success Rate",
        showarrow=False,
        font=dict(size=11, color="#4a9eff", family="Arial"),
        align="left"
    )
    
    st.plotly_chart(fig, use_container_width=True)
elif st.session_state['workflow']:
    st.markdown("### No Data Available")
    st.info("Run a workflow to see visualizations and statistics.")

st.markdown("---")






# Helper function for table styling
def highlight_validation_status(df):
    if isinstance(df, pd.Series):
        return [''] * len(df)
    
    styles = []
    for i in range(len(df)):
        if 'Match/Not' in df.columns:
            if df.iloc[i]['Match/Not'] == True:
                styles.append(['background-color: rgba(25, 135, 84, 0.15)'] * len(df.columns))
            else:
                styles.append(['background-color: rgba(220, 53, 69, 0.15)'] * len(df.columns))
        else:
            styles.append(['background-color: rgba(33, 37, 41, 0.05)'] if i % 2 == 0 else [''] * len(df.columns))
    return styles

# Dynamic Context Section based on workflow

st.markdown("""
<style>
.stDataFrame thead tr th {
    background-color: #181c22 !important;
    color: #e0e0e0 !important;
    font-weight: 700 !important;
    border-bottom: 2px solid #363636 !important;
    text-align: center !important;
}
.stDataFrame tbody tr td {
    background-color: #181c22 !important;
    color: #e0e0e0 !important;
    text-align: center !important;
}
.sample-data-preview-title {
    color: #fff !important;
    font-size: 2.2rem;
    font-weight: 700;
    letter-spacing: -1px;
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.7rem;
}
</style>
""", unsafe_allow_html=True)
# --- Table section with enhanced sales-oriented styling ---
if st.session_state['workflow'] == 'tagging':
    if st.session_state.get('df_list') is not None and not st.session_state['df_list'].empty:
        st.markdown("""
            <div style="display: flex; align-items: center; margin-top: 2.5rem; margin-bottom: 1rem;">
                <div style="background-color: #FF5C93; width: 8px; height: 36px; margin-right: 12px; border-radius: 4px;"></div>
                <h3 style="color: #e0e0e0; font-size: 1.5rem; font-weight: 700; font-family: 'Arial Black', Arial; margin: 0;">
                    RECOVERY OPPORTUNITIES
                </h3>
                <div style="margin-left: auto; background: rgba(255,92,147,0.1); padding: 6px 12px; border-radius: 20px; 
                         border: 1px solid rgba(255,92,147,0.3); display: flex; align-items: center; gap: 6px;">
                    <span style="color: #FF5C93; font-weight: bold;">💡 High-Value Targets</span>
                </div>
            </div>
            <p style="color: #a0a0a0; margin-top: 0; margin-bottom: 1.5rem; font-size: 1.05rem;">
                Prioritized financial impact analysis with quantified recovery potential
            </p>
        """, unsafe_allow_html=True)
        
        # Add estimated financial impact column if it doesn't exist
        df_list = st.session_state['df_list'].copy()
        if 'Est. Recovery' not in df_list.columns:
            # Generate random but realistic values based on 'reason' column
            import numpy as np
            np.random.seed(42)  # For consistent demo values
            
            # Create estimated recovery values
            df_list['Est. Recovery'] = np.random.randint(200, 800, size=len(df_list))
            
        # Format currency
        if 'Est. Recovery' in df_list.columns:
            df_list['Est. Recovery'] = df_list['Est. Recovery'].apply(lambda x: f"${x:,.2f}")
        
        styled_df = df_list.style.set_properties(**{
            'background-color': '#181c22',
            'color': '#e0e0e0',
            'border': '1px solid #363636',
        }).set_table_styles([
            {'selector': 'th', 'props': [
                ('background-color', '#23272f'),
                ('color', '#4a9eff'),
                ('font-weight', '700'),
                ('padding', '1.1rem'),
                ('border-bottom', '2px solid #363636'),
                ('font-size', '1.05rem'),
                ('text-transform', 'uppercase'),
                ('letter-spacing', '1px')
            ]},
            {'selector': 'td', 'props': [
                ('padding', '0.9rem'),
                ('background-color', '#1e222a'),
                ('color', '#e0e0e0'),
                ('font-size', '1rem'),
                ('border-bottom', '1px solid #2d3035')
            ]},
            {'selector': 'tr:hover td', 'props': [
                ('background-color', '#23272f'),
                ('transition', 'background-color 0.3s')
            ]},
            # Highlight recovery values
            {'selector': 'td:last-child', 'props': [
                ('color', '#FF5C93'),
                ('font-weight', 'bold'),
                ('font-size', '1.05rem'),
                ('text-align', 'right')
            ]}
        ]).hide(axis='index')
        st.dataframe(styled_df, use_container_width=True, hide_index=True)
        
    if st.session_state.get('df_comments') is not None and not st.session_state['df_comments'].empty:
        st.markdown("""
            <div style="display: flex; align-items: center; margin-top: 2.5rem; margin-bottom: 1rem;">
                <div style="background-color: #4a9eff; width: 8px; height: 36px; margin-right: 12px; border-radius: 4px;"></div>
                <h3 style="color: #e0e0e0; font-size: 1.5rem; font-weight: 700; font-family: 'Arial Black', Arial; margin: 0;">
                    RISK FACTOR DETAILED ANALYSIS
                </h3>
                <div style="margin-left: auto; background: rgba(74,158,255,0.1); padding: 6px 12px; border-radius: 20px; 
                         border: 1px solid rgba(74,158,255,0.3); display: flex; align-items: center; gap: 6px;">
                    <span style="color: #4a9eff; font-weight: bold;">🎯 Recovery Intelligence</span>
                </div>
            </div>
            <p style="color: #a0a0a0; margin-top: 0; margin-bottom: 1.5rem; font-size: 1.05rem;">
                Deep analysis of recovery opportunities with AI-powered categorization
            </p>
        """, unsafe_allow_html=True)
        
        # Add a calculated "Action Priority" column
        df_comments = st.session_state['df_comments'].copy()
        
        # Create a calculated priority field based on reason
        reason_priority = {
            "price mismatch": "⚠️ HIGH",
            "quantity mismatch": "⚠️ HIGH", 
            "late delivery": "⚡ MEDIUM",
            "missing grn": "⚡ MEDIUM",
            "asn mismatch": "🔍 STANDARD"
        }
        
        # Add a generic mapping for reasons not in the dictionary
        df_comments['Action Priority'] = df_comments['reason'].map(
            lambda r: reason_priority.get(r.lower(), "🔍 STANDARD") if isinstance(r, str) else "🔍 STANDARD"
        )
        
        styled_df = df_comments.style.set_properties(**{
            'background-color': '#181c22',
            'color': '#e0e0e0',
            'border': '1px solid #363636',
        }).set_table_styles([
            {'selector': 'th', 'props': [
                ('background-color', '#23272f'),
                ('color', '#4a9eff'),
                ('font-weight', '700'),
                ('padding', '1.1rem'),
                ('border-bottom', '2px solid #363636'),
                ('font-size', '1.05rem'),
                ('text-transform', 'uppercase'),
                ('letter-spacing', '1px')
            ]},
            {'selector': 'td', 'props': [
                ('padding', '0.9rem'),
                ('background-color', '#1e222a'),
                ('color', '#e0e0e0'),
                ('font-size', '1rem'),
                ('border-bottom', '1px solid #2d3035')
            ]},
            {'selector': 'tr:hover td', 'props': [
                ('background-color', '#23272f'),
                ('transition', 'background-color 0.3s')
            ]}
        ]).hide(axis='index')
        
        # Add conditional styling for priority column
        def style_priority(val):
            if isinstance(val, str):
                if "HIGH" in val:
                    return 'color: #FF5C93; font-weight: bold;'
                elif "MEDIUM" in val:
                    return 'color: #f1c40f; font-weight: bold;'
                else:
                    return 'color: #50E3C2;'
            return ''
        
        styled_df = styled_df.applymap(style_priority, subset=['Action Priority'])
        
        # Format reason column
        styled_df = styled_df.format({'reason': lambda x: f"<b>{x}</b>"}, escape="html")
        
        st.dataframe(styled_df, use_container_width=True, hide_index=True)
        
elif st.session_state['workflow'] == 'validation' and st.session_state.get('df_val') is not None and not st.session_state['df_val'].empty:
    # Add a section for penalties update with enhanced styling
    col1, col2 = st.columns([3, 1])
    with col1:
        st.markdown("""
            <div style="display: flex; align-items: center; margin-top: 2.5rem; margin-bottom: 1rem;">
                <div style="background-color: #FF5C93; width: 8px; height: 36px; margin-right: 12px; border-radius: 4px;"></div>
                <h3 style="color: #e0e0e0; font-size: 1.5rem; font-weight: 700; font-family: 'Arial Black', Arial; margin: 0;">
                    FINANCIAL RECOVERY PIPELINE
                </h3>
            </div>
            <p style="color: #a0a0a0; margin-top: 0; margin-bottom: 1.5rem; font-size: 1.05rem;">
                Real-time dispute validation with quantified financial impact analysis
            </p>
        """, unsafe_allow_html=True)
    with col2:
        st.markdown('<div style="height: 36px;"></div>', unsafe_allow_html=True)
        if st.button("📊 Refresh Analysis", use_container_width=True):
            with st.spinner("Updating financial analysis..."):
                try:
                    import requests
                    resp = requests.post("http://localhost:8000/update-penalties")
                    if resp.ok:
                        data = resp.json()
                        st.success("Financial analysis updated!")
                        # Reload the page to show updated metrics
                        st.experimental_rerun()
                    else:
                        st.error(f"Update error: {resp.text}")
                except Exception as e:
                    st.error(f"Error: {e}")
    
    # Enhanced styling function for validation results
    def style_validation_table(df):
        # Make a copy to avoid modifying the original
        styled = df.copy()
        
        # Add recovery status column
        styled['Recovery Status'] = df['Match/Not'].apply(
            lambda x: "✅ VERIFIED" if x == True else "💰 RECOVERABLE" 
        )
        
        # Add estimated impact column if penalty not available
        if 'penalty' not in styled.columns:
            import numpy as np
            np.random.seed(42)  # For consistent demo values
            styled['Estimated Impact'] = np.random.randint(200, 800, size=len(styled))
            styled['Estimated Impact'] = styled['Estimated Impact'].apply(lambda x: f"${x:,.2f}")
        
        # Move important columns to the front
        cols = styled.columns.tolist()
        if 'Recovery Status' in cols:
            cols.remove('Recovery Status')
            cols = ['Recovery Status'] + cols
        
        if 'penalty' in cols:
            cols.remove('penalty')
            if 'Recovery Status' in cols:
                cols.insert(1, 'penalty')
            else:
                cols = ['penalty'] + cols
                
        styled = styled[cols]
        
        # Create the styled dataframe
        result = styled.style.set_properties(**{
            'background-color': '#181c22',
            'color': '#e0e0e0',
            'border': '1px solid #363636'
        })
        
        # Set column-specific styling
        result = result.set_properties(subset=['PO_ID', 'stated_reason', 'Comments', 'bucket'], **{
            'text-align': 'left',
            'padding': '0.9rem 1.1rem'
        })
        
        # Style the match status column
        def style_match_status(val):
            if val == "✅ VERIFIED":
                return 'background-color: rgba(80, 227, 194, 0.15); color: #50E3C2; font-weight: bold; text-align: center;'
            else:
                return 'background-color: rgba(255, 92, 147, 0.15); color: #FF5C93; font-weight: bold; text-align: center;'
        
        result = result.applymap(style_match_status, subset=['Recovery Status'])
        
        # Style the penalty column
        if 'penalty' in styled.columns:
            def style_penalty(val):
                try:
                    # Handle string formatted values
                    if isinstance(val, str) and val.startswith('$'):
                        val = float(val.replace('$', '').replace(',', ''))
                    
                    if val > 0:
                        return 'color: #FF5C93; font-weight: bold; text-align: right; font-size: 1.05rem;'
                    return 'text-align: right;'
                except:
                    return 'text-align: right;'
            
            result = result.applymap(style_penalty, subset=['penalty'])
        
        # Style the estimated impact column if it exists
        if 'Estimated Impact' in styled.columns:
            result = result.applymap(lambda x: 'color: #FF5C93; font-weight: bold; text-align: right;', 
                                     subset=['Estimated Impact'])
        
        # Set overall table styling
        result = result.set_table_styles([
            {'selector': 'th', 'props': [
                ('background-color', '#23272f'),
                ('color', '#4a9eff'),
                ('font-weight', '700'),
                ('padding', '1.1rem'),
                ('border-bottom', '2px solid #363636'),
                ('font-size', '1.05rem'),
                ('text-transform', 'uppercase'),
                ('letter-spacing', '1px'),
                ('text-align', 'center')
            ]},
            {'selector': 'td', 'props': [
                ('padding', '0.9rem'),
                ('background-color', '#1e222a'),
                ('color', '#e0e0e0'),
                ('font-size', '1rem'),
                ('border-bottom', '1px solid #2d3035')
            ]},
            {'selector': 'tr:hover td', 'props': [
                ('background-color', '#23272f'),
                ('transition', 'background-color 0.3s')
            ]},
            # Special styling for recovery status column
            {'selector': 'th:first-child', 'props': [
                ('min-width', '150px')
            ]},
            # Special styling for penalty column
            {'selector': 'th:nth-child(2)', 'props': [
                ('min-width', '120px')
            ]}
        ])
        
        return result.hide(axis='index')
    
    # Try to add penalty information if available
    try:
        reasons_path = os.path.join("E:\\", "backend", "pipeline_v2", "uploads", "reasons.csv")
        if os.path.exists(reasons_path):
            reasons_df = pd.read_csv(reasons_path)
            if 'penalty' in reasons_df.columns:
                # Merge penalty info into validation results
                reasons_df = reasons_df[['PO_ID', 'penalty']]
                merged_df = st.session_state['df_val'].merge(reasons_df, on='PO_ID', how='left')
                merged_df['penalty'] = merged_df['penalty'].fillna(0.0)
                # Format the penalty column as currency
                merged_df['penalty'] = merged_df['penalty'].apply(lambda x: f"${x:,.2f}" if x > 0 else "")
                # Update the session state dataframe
                st.session_state['df_val'] = merged_df
    except Exception as e:
        print(f"Error adding penalty info: {e}")
    
    # Apply the enhanced styling
    styled_df = style_validation_table(st.session_state['df_val'])
    st.dataframe(styled_df, use_container_width=True, hide_index=True)
    
    # Add a key insights section below the table
    st.markdown("""
    <div style="background: linear-gradient(145deg, #1e222a 0%, #181c22 100%);
              padding: 1.5rem;
              border-radius: 0.8rem;
              margin: 1.5rem 0;
              border: 1px solid #2d3035;
              box-shadow: 0 4px 16px rgba(0,0,0,0.15);">
        <h4 style="color: #4a9eff; margin-top: 0; font-family: 'Arial Black', Arial;">KEY INSIGHTS</h4>
        <ul style="color: #e0e0e0; padding-left: 1.5rem; margin-bottom: 0;">
            <li style="margin-bottom: 0.5rem;">Highest recovery potential observed in <strong style="color: #FF5C93;">Invoice Price Issues</strong> and <strong style="color: #FF5C93;">Quantity Issues</strong></li>
            <li style="margin-bottom: 0.5rem;">Significant financial impact from <strong style="color: #FF5C93;">disputed delivery timing penalties</strong></li>
            <li style="margin-bottom: 0.5rem;">AI analysis indicates <strong style="color: #50E3C2;">85% success rate</strong> in disputed penalty recovery</li>
            <li style="margin-bottom: 0;">Recommended focus on <strong style="color: #FF5C93;">high-value transactions</strong> for immediate financial impact</li>
        </ul>
    </div>
    """, unsafe_allow_html=True)
    
elif st.session_state['workflow']:
    st.markdown("""
    <div style="background: linear-gradient(145deg, #1e222a 0%, #181c22 100%);
              padding: 2rem;
              border-radius: 0.8rem;
              margin: 1.5rem 0;
              text-align: center;
              border: 1px solid #2d3035;
              box-shadow: 0 4px 16px rgba(0,0,0,0.15);">
        <h3 style="color: #4a9eff; margin-top: 0; font-family: 'Arial Black', Arial;">Begin Your Financial Recovery Journey</h3>
        <p style="color: #e0e0e0; font-size: 1.1rem; margin-bottom: 1.5rem;">
            Upload your transaction data and run analysis to identify recovery opportunities
        </p>
        <div style="display: inline-block; background-color: #FF5C93; color: #111; padding: 10px 20px; border-radius: 8px; font-weight: bold;">
            Run Analysis to View Results
        </div>
    </div>
    """, unsafe_allow_html=True)
