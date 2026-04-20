import streamlit as st
import requests
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import numpy as np # Needed for some mock data generation if backend is missing details

# --- Configuration & Setup ---
st.set_page_config(page_title=" GST AI Platform", page_icon="🕵️‍♂️", layout="wide")
API_BASE_URL = "http://localhost:8000/api"

# Define the pages we want to build
PAGES = [
    "1. Dashboard / Overview",
    "2. Suspicious Businesses",
    "3. Business Detail (Drill-Down)",
    "4. Industry Comparison",
    "5. Audit Priority Queue",
    "6. Reports & Analytics" # Combined with some overview features for impact
]

# --- Sidebar Navigation ---
st.sidebar.title("🕵️‍♂️ GST Anomaly Investigator Platform ")
 
selection = st.sidebar.radio("Navigate to:", PAGES)
st.sidebar.divider()
 


# --- Helper Function to Fetch Data ---
@st.cache_data(ttl=60) # Cache data for 60 seconds to avoid hitting the backend constantly
def fetch_global_data():
    try:
        response = requests.get(f"{API_BASE_URL}/scan")
        if response.status_code == 200:
            return pd.DataFrame(response.json()["data"])
        return None
    except:
        return None


# ==========================================
# PAGE 1: DASHBOARD / OVERVIEW
# ==========================================
if selection == "1. Dashboard / Overview":
    st.title("🌐 Command Center Dashboard")
    st.markdown("High-level overview of GST compliance and detected anomalies.")
    
    df = fetch_global_data()
    
    if df is not None:
        total_biz = len(df)
        suspicious_count = df['Is_Suspicious'].sum()
        avg_risk = df['Risk_Score'].mean()
        
        # KPI Cards
        col1, col2, col3, col4 = st.columns(4)
        col1.metric("Total Businesses Analyzed", f"{total_biz:,}")
        col2.metric("Suspicious Cases Flagged", f"{suspicious_count:,}", delta=f"{(suspicious_count/total_biz)*100:.1f}% of total", delta_color="inverse")
        col3.metric("Average Risk Score", f"{avg_risk:.1f} / 100")
        col4.metric("Est. Revenue at Risk", f"₹ {(df[df['Is_Suspicious']]['Reported_Turnover'].sum() * 0.15):,.0f}") # Mock calculation for impact
        
        st.divider()
        
        # Quick Charts
        chart_col1, chart_col2 = st.columns(2)
        with chart_col1:
            st.subheader("Anomalies by Industry")
            industry_counts = df.groupby(['Industry', 'Is_Suspicious']).size().reset_index(name='Count')
            fig_bar = px.bar(industry_counts, x='Industry', y='Count', color='Is_Suspicious', 
                             title="Distribution of Normal vs Suspicious Entities",
                             color_discrete_map={True: 'red', False: 'green'}, barmode='group')
            st.plotly_chart(fig_bar, use_container_width=True)
            
        with chart_col2:
            st.subheader("Risk Score Distribution")
            fig_hist = px.histogram(df, x='Risk_Score', color='Is_Suspicious', nbins=20,
                                    title="Frequency of Risk Scores",
                                    color_discrete_map={True: 'red', False: 'green'})
            st.plotly_chart(fig_hist, use_container_width=True)
            
        st.subheader("Recent High-Risk Flags")
        st.dataframe(df[df['Is_Suspicious']].head(5)[['Business_ID', 'Industry', 'Risk_Score']], use_container_width=True, hide_index=True)
        
    else:
        st.error("Failed to connect to backend API.")

# ==========================================
# PAGE 2: SUSPICIOUS BUSINESSES
# ==========================================
elif selection == "2. Suspicious Businesses":
    st.title("🚨 Suspicious Businesses Directory")
    st.markdown("Ranked list of all entities flagged by the AI for potential revenue leakage.")
    
    df = fetch_global_data()
    
    if df is not None:
        # Filter only suspicious
        suspicious_df = df[df['Is_Suspicious'] == True].copy()
        
        # Search & Filters
        col1, col2 = st.columns([2, 1])
        with col1:
            search_query = st.text_input("🔍 Search by Business ID:")
        with col2:
            filter_industry = st.selectbox("Filter by Industry", ["All"] + list(suspicious_df['Industry'].unique()))
            
        # Apply Filters
        if search_query:
            suspicious_df = suspicious_df[suspicious_df['Business_ID'].str.contains(search_query, case=False)]
        if filter_industry != "All":
            suspicious_df = suspicious_df[suspicious_df['Industry'] == filter_industry]
            
        st.dataframe(
            suspicious_df[['Business_ID', 'City', 'Industry', 'Risk_Score', 'Reported_Turnover']].sort_values(by='Risk_Score', ascending=False),
            column_config={
                "Risk_Score": st.column_config.ProgressColumn("Risk Severity", format="%.1f", min_value=0, max_value=100),
                "Reported_Turnover": st.column_config.NumberColumn("Reported Turnover", format="₹ %.2f")
            },
            use_container_width=True,
            hide_index=True,
            height=600
        )
    else:
        st.error("Failed to fetch data.")

# ==========================================
# PAGE 3: BUSINESS DETAIL (DRILL-DOWN)
# ==========================================
elif selection == "3. Business Detail (Drill-Down)":
    st.title("🔍 Individual Business Investigation")
    st.markdown("Deep-dive analysis of a specific entity's operational footprint vs. financial reporting.")
    
    search_id = st.text_input("Enter Business ID (e.g., GSTIN_...) to investigate:", placeholder="Type ID and press Enter...")
    
    if search_id:
        with st.spinner("Analyzing cross-referenced data..."):
            try:
                response = requests.get(f"{API_BASE_URL}/business/{search_id}")
                if response.status_code == 200:
                    data = response.json()["data"]
                    biz = data["business_data"]
                    avg = data["industry_averages"]
                    
                    st.subheader(f"Case File: {biz['Business_ID']}")
                    
                    # Score Meter (Gauge Chart)
                    fig_gauge = go.Figure(go.Indicator(
                        mode = "gauge+number",
                        value = biz['Risk_Score'],
                        title = {'text': "AI Risk Score"},
                        domain = {'x': [0, 1], 'y': [0, 1]},
                        gauge = {
                            'axis': {'range': [None, 100]},
                            'bar': {'color': "darkred" if biz['Is_Suspicious'] else "darkgreen"},
                            'steps': [
                                {'range': [0, 50], 'color': "lightgreen"},
                                {'range': [50, 80], 'color': "orange"},
                                {'range': [80, 100], 'color': "salmon"}
                            ]
                        }
                    ))
                    
                    col_prof, col_meter = st.columns([2, 1])
                    with col_prof:
                        st.markdown(f"**Industry:** {biz['Industry']} | **Location:** {biz['City']}")
                        st.metric("Reported Turnover", f"₹ {biz['Reported_Turnover']:,.2f}")
                        if biz['Is_Suspicious']:
                            st.error(f"🚨 **Flagged Reason:** {biz['Explanation']}")
                        else:
                            st.success(f"✅ **Status:** {biz['Explanation']}")
                    with col_meter:
                         st.plotly_chart(fig_gauge, use_container_width=True, height=200)

                    st.divider()
                    
                    # Comparison Chart
                    st.subheader("Operational Ratios vs Industry Baseline")
                    biz_elec_ratio = biz['ElectricityBill'] / biz['Reported_Turnover']
                    biz_emp_ratio = biz['Employee_Count'] / biz['Reported_Turnover']
                    
                    fig_comp = go.Figure(data=[
                        go.Bar(name='This Business', x=['Electricity Ratio', 'Employee Ratio'], y=[biz_elec_ratio, biz_emp_ratio], marker_color='red' if biz['Is_Suspicious'] else 'green'),
                        go.Bar(name=f"Industry Avg ({biz['Industry']})", x=['Electricity Ratio', 'Employee Ratio'], y=[avg['avg_electricity_ratio'], avg['avg_employee_ratio']], marker_color='blue')
                    ])
                    fig_comp.update_layout(barmode='group', template="plotly_white")
                    st.plotly_chart(fig_comp, use_container_width=True)
                    
                else:
                    st.error("Business ID not found.")
            except:
                st.error("Backend connection failed.")

# ==========================================
# PAGE 4: INDUSTRY COMPARISON
# ==========================================
elif selection == "4. Industry Comparison":
    st.title("🏭 Peer Benchmarking & Industry Standards")
    st.markdown("Analyze how reported turnover varies across sectors to establish behavioral baselines.")
    
    df = fetch_global_data()
    if df is not None:
        selected_industry = st.selectbox("Select an Industry to Analyze:", df['Industry'].unique())
        
        industry_df = df[df['Industry'] == selected_industry]
        
        col1, col2 = st.columns(2)
        with col1:
             st.metric("Total Peers", len(industry_df))
        with col2:
             st.metric("Average Reported Turnover", f"₹ {industry_df['Reported_Turnover'].mean():,.0f}")
             
        # Box Plot for Peer Comparison
        st.subheader("Turnover Distribution within Industry")
        fig_box = px.box(industry_df, x='Industry', y='Reported_Turnover', color='Is_Suspicious',
                         title=f"Turnover Spread in {selected_industry}",
                         points="all") # Show all points to spot outliers easily
        st.plotly_chart(fig_box, use_container_width=True)
        
    else:
        st.error("Failed to fetch data.")

# ==========================================
# PAGE 5: AUDIT PRIORITY QUEUE
# ==========================================
elif selection == "5. Audit Priority Queue":
    st.title("📋 Actionable Audit Priority Queue")
    st.markdown("Recommended audit schedule based on risk severity and potential revenue impact.")
    
    df = fetch_global_data()
    if df is not None:
        priority_df = df[df['Is_Suspicious'] == True].copy()
        
        # Calculate a mock 'Expected Impact' based on the gap between typical industry turnover and reported
        # For the hackathon, we estimate impact as a percentage of the reported turnover if it's very low
        priority_df['Est_Revenue_Impact'] = priority_df['Reported_Turnover'] * (priority_df['Risk_Score'] / 100) * 0.2 
        
        # Sort by highest impact and highest risk
        priority_df = priority_df.sort_values(by=['Risk_Score', 'Est_Revenue_Impact'], ascending=[False, False])
        
        # Assign Priority Labels
        priority_df['Priority_Level'] = pd.cut(priority_df['Risk_Score'], bins=[0, 85, 95, 100], labels=['Medium', 'High', 'CRITICAL'])
        
        st.dataframe(
            priority_df[['Business_ID', 'Industry', 'Priority_Level', 'Risk_Score', 'Est_Revenue_Impact']],
            column_config={
                "Est_Revenue_Impact": st.column_config.NumberColumn("Est. Revenue to Recover", format="₹ %.0f"),
                 "Risk_Score": st.column_config.NumberColumn("Severity Score")
            },
            use_container_width=True,
            hide_index=True
        )
    else:
        st.error("Failed to fetch data.")

# ==========================================
# PAGE 6: REPORTS & ANALYTICS
# ==========================================
elif selection == "6. Reports & Analytics":
    st.title("📈 Executive Analytics & Reports")
    st.markdown("Macro-level insights for department heads and presentation to hackathon judges.")
    
    df = fetch_global_data()
    if df is not None:
        
        col1, col2 = st.columns(2)
        with col1:
             # Heatmap (Mocked using a scatter plot for density since we lack geographic coordinates)
             st.subheader("Anomaly Density by City")
             city_risk = df.groupby('City')['Risk_Score'].mean().reset_index()
             fig_city = px.bar(city_risk.sort_values('Risk_Score'), x='City', y='Risk_Score', color='Risk_Score', color_continuous_scale='Reds')
             st.plotly_chart(fig_city, use_container_width=True)
             
        with col2:
             st.subheader("Operational Signal Correlation")
             # Show how electricity relates to turnover for all businesses
             fig_scatter = px.scatter(df, x='Reported_Turnover', y='ElectricityBill', color='Is_Suspicious', 
                                      hover_data=['Business_ID', 'Industry'],
                                      title="Electricity Usage vs Reported Financials")
             st.plotly_chart(fig_scatter, use_container_width=True)
             
        # Export Button (Streamlit native feature)
        st.subheader("Export Actionable Data")
        csv = df[df['Is_Suspicious']].to_csv(index=False).encode('utf-8')
        st.download_button(
            label="Download High-Risk Audit List as CSV",
            data=csv,
            file_name='gst_audit_targets.csv',
            mime='text/csv',
        )
    else:
        st.error("Failed to fetch data.")