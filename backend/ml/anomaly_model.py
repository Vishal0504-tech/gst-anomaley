import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import os

class GSTAnomalyDetector:
    def __init__(self):
        # 1. Load the dataset
        # We use os.path to ensure it finds the file regardless of where you run the script
        current_dir = os.path.dirname(os.path.abspath(__file__))
        data_path = os.path.join(current_dir, '..', 'data', 'merged_project_dataset.csv')
        self.df = pd.read_csv(data_path)
        
        # 2. Run the processing and training pipeline immediately on startup
        self._prepare_and_train()

    def _prepare_and_train(self):
        # Feature Engineering: The core logic
        self.df['Electricity_to_Turnover'] = self.df['ElectricityBill'] / self.df['Reported_Turnover']
        self.df['Employee_to_Turnover'] = self.df['Employee_Count'] / self.df['Reported_Turnover']
        
        # Clean up any weird math artifacts (like dividing by zero)
        self.df.replace([float('inf'), -float('inf')], 0, inplace=True)
        self.df.fillna(0, inplace=True)
        
        # Prepare for ML
        features = ['Electricity_to_Turnover', 'Employee_to_Turnover']
        X = self.df[features]
        
        # Scale data
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        
        # Train Isolation Forest (Expecting ~10% fraud based on our dataset)
        model = IsolationForest(n_estimators=100, contamination=0.10, random_state=42)
        model.fit(X_scaled)
        
        # Calculate Risk Scores (0 to 100)
        decision_scores = model.decision_function(X_scaled)
        self.df['Risk_Score'] = ((decision_scores.max() - decision_scores) / 
                            (decision_scores.max() - decision_scores.min()) * 100).round(2)
        
        self.df['Is_Suspicious'] = model.predict(X_scaled) == -1
        
        # Generate Explainability
        self.df['Explanation'] = self.df.apply(self._generate_explanation, axis=1)

    def _generate_explanation(self, row):
        if not row['Is_Suspicious']:
            return "Normal operations. Reported revenue aligns with operational footprint."
        if row['Electricity_to_Turnover'] > self.df['Electricity_to_Turnover'].mean():
            return f"High Risk: Electricity consumption (INR {row['ElectricityBill']}) is heavily disproportionate to reported turnover."
        return "High Risk: Employee count indicates a larger operational scale than reported to GST."

    # --- API Helper Functions ---
    def get_all_scans(self):
        # Sort by Risk Score (Highest first) and convert to a list of dictionaries for JSON
        results = self.df.sort_values(by='Risk_Score', ascending=False)
        # Drop columns we don't need to send to the frontend table to save bandwidth
        clean_results = results[['Business_ID', 'City', 'Industry', 'Reported_Turnover', 'Risk_Score', 'Is_Suspicious','ElectricityBill', 'Employee_Count']]
        return clean_results.to_dict(orient='records')

    def get_business_details(self, business_id: str):
        # Find the specific business
        business = self.df[self.df['Business_ID'] == business_id]
        if business.empty:
            return None
        
        # Get industry averages to compare against
        industry = business['Industry'].values[0]
        industry_avg = self.df[self.df['Industry'] == industry].mean(numeric_only=True)

        return {
            "business_data": business.to_dict(orient='records')[0],
            "industry_averages": {
                "avg_electricity_ratio": round(industry_avg['Electricity_to_Turnover'], 6),
                "avg_employee_ratio": round(industry_avg['Employee_to_Turnover'], 6)
            }
        }