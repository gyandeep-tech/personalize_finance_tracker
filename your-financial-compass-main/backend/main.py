from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from sklearn.ensemble import IsolationForest
from sklearn.tree import DecisionTreeClassifier
from sklearn.preprocessing import StandardScaler
import warnings
import datetime
warnings.filterwarnings('ignore')

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

print("Bootstrapping AI Models...")
try:
    df = pd.read_csv('personal_finance_tracker_dataset.csv')
    
    # 1. Preprocessing identical to notebook
    num_cols = df.select_dtypes(include=['float64', 'int64']).columns
    df[num_cols] = df[num_cols].fillna(df[num_cols].median())
    
    # 2. Train Portfolio Clustering (Deterministic KMeans)
    features = ['monthly_income', 'actual_savings', 'credit_score', 'savings_rate']
    if 'savings_rate' not in df.columns:
        df['savings_rate'] = df['actual_savings'] / df['monthly_income'].replace(0, 1)
        
    X_cluster = df[features].fillna(0)
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X_cluster)
    
    kmeans = KMeans(n_clusters=3, random_state=42)
    kmeans.fit(X_scaled)
    
    # Sort cluster centroids to ensure deterministic order (0=Conservative, 1=Balanced, 2=Aggressive)
    cluster_scores = kmeans.cluster_centers_.sum(axis=1) # Summing standardized features gives relative financial strength
    sorted_cluster_indices = np.argsort(cluster_scores)
    cluster_mapping = {original_id: ranked_id for ranked_id, original_id in enumerate(sorted_cluster_indices)}

    # 3. Train Behavioral IsolationForest
    X_spend = df[['monthly_income', 'discretionary_spending']].fillna(0)
    iso = IsolationForest(contamination=0.05, random_state=42)
    iso.fit(X_spend)

    # 4. Train Loan Risk DecisionTreeClassifier
    if 'debt_to_income_ratio' not in df.columns:
        df['debt_to_income_ratio'] = (df['monthly_income'].replace(0,1) * 0.3) / df['monthly_income'].replace(0,1)
    if 'loan_payment' not in df.columns:
        df['loan_payment'] = 0.0
    if 'financial_stress_level' not in df.columns:
        # Mock target for training if not available
        stress = [1 if (r > 0.4 or c < 600) else 0 for r, c in zip(df['debt_to_income_ratio'], df['credit_score'])]
        y_loan = np.array(stress)
    else:
        y_loan = df['financial_stress_level'].apply(lambda x: 1 if x == 'High' else 0)

    features_loan = ['debt_to_income_ratio', 'credit_score', 'loan_payment', 'monthly_income']
    X_loan = df[features_loan].fillna(0)
    loan_clf = DecisionTreeClassifier(max_depth=3, random_state=42)
    loan_clf.fit(X_loan, y_loan)

    print("AI Models successfully initialized.")
except Exception as e:
    print(f"Error initializing models: {e}")
    scaler = None
    kmeans = None
    iso = None
    loan_clf = None

class ProfilePayload(BaseModel):
    monthly_income: float
    total_savings: float  # corresponds to actual_savings
    monthly_savings: float # to compute rate
    credit_score: float
    emergency_fund: float
    essential_spending: float
    discretionary_spending: float
    budget_goal: float
    financial_scenario: str  # e.g. normal, recession

@app.post("/api/analyze")
def analyze_profile(data: ProfilePayload):
    # 1. Base derived metrics from notebook
    savings_rate = data.monthly_savings / data.monthly_income if data.monthly_income > 0 else 0
    runway_months = data.emergency_fund / data.essential_spending if data.essential_spending > 0 else 0
    discretionary_ratio = data.discretionary_spending / data.monthly_income if data.monthly_income > 0 else 0
    savings_to_goal_ratio = data.total_savings / data.budget_goal if data.budget_goal > 0 else 0
    debt_to_income_ratio = data.essential_spending / data.monthly_income if data.monthly_income > 0 else 0

    # 2. Portfolio Strategy (Deterministic KMeans)
    portfolio_recommendation = "Data Unavailable"
    if kmeans and scaler:
        inv_input = pd.DataFrame([{
            'monthly_income': data.monthly_income,
            'actual_savings': data.total_savings,
            'credit_score': data.credit_score,
            'savings_rate': savings_rate
        }])
        inv_scaled = scaler.transform(inv_input)
        original_cluster = kmeans.predict(inv_scaled)[0]
        ranked_cluster = cluster_mapping[original_cluster]
        
        if ranked_cluster == 0:
            portfolio_recommendation = "Conservative: 60% Bonds, 30% Large-Cap Stocks, 10% Cash (Low Risk Tolerance)"
        elif ranked_cluster == 1:
            portfolio_recommendation = "Balanced: 50% Large-Cap Stocks, 30% Bonds, 20% International (Medium Risk)"
        else:
            portfolio_recommendation = "Aggressive: 70% Stocks (Tech/Growth), 20% Crypto/Alt, 10% Bonds (High Risk/High Savings)"

    # 3. Behavior Insight (IsolationForest)
    if iso:
        spend_input = pd.DataFrame([{
            'monthly_income': data.monthly_income,
            'discretionary_spending': data.discretionary_spending
        }])
        anomaly_pred = iso.predict(spend_input)[0]
        if anomaly_pred == -1:
            behavioral_insight = f"Anomaly Detected: Your discretionary spending (${data.discretionary_spending:,.2f}) flags as an outlier against peers."
        else:
            behavioral_insight = "Spending habits look perfectly normal within our data distribution."
    else:
        behavioral_insight = "AI analysis unavailable."

    # 4. Loan Default Predictor (DecisionTreeClassifier)
    if loan_clf:
        loan_input = pd.DataFrame([{
            'debt_to_income_ratio': debt_to_income_ratio,
            'credit_score': data.credit_score,
            'loan_payment': 0.0, # Not explicitly tracked in UI yet
            'monthly_income': data.monthly_income
        }])
        stress_pred = loan_clf.predict(loan_input)[0]
        if stress_pred == 1:
            loan_advice = "High risk of financial stress detected if pursuing new credit. Prioritize paying down liabilities."
        else:
            if data.credit_score > 700:
                loan_advice = "Low risk profile. You are highly eligible for prime borrowing rates."
            else:
                loan_advice = "Moderate risk. Work on boosting your credit score before seeking major loans."
    else:
        loan_advice = "Loan AI model unavailable."

    # 5. Purchase Timing Advisor
    current_month = datetime.datetime.now().month
    if current_month in [11, 12] or data.financial_scenario.lower() == 'recession':
        car_purchase_advice = "Optimal time to buy! Dealerships offer year-end discounts or recession incentives."
    else:
        car_purchase_advice = "Wait for end-of-year sales (Nov-Dec)."

    # 6. Tax Optimization
    annual_income = data.monthly_income * 12
    if annual_income > 160000:
        tax_advice = "High Bracket: Maximize 401(k), consider Municipal Bonds to shield income."
    elif annual_income > 80000:
        tax_advice = "Medium Bracket: Maximize HSA, contribute to traditional 401(k)."
    else:
        tax_advice = "Lower Bracket: Consider Roth IRA while your tax rate is relatively low."

    return {
        "metrics": {
            "savings_rate": float(savings_rate),
            "runway_months": float(runway_months),
            "discretionary_ratio": float(discretionary_ratio),
            "savings_to_goal_ratio": float(savings_to_goal_ratio)
        },
        "ai_insights": {
            "portfolio": portfolio_recommendation,
            "purchase_timing": car_purchase_advice,
            "behavior": behavioral_insight,
            "tax": tax_advice,
            "loan_advisory": loan_advice
        }
    }
