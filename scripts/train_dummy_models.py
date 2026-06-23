import os
import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier

def train_and_save_dummies():
    print("Training dummy models for initial testing...")
    
    # We will use Random Forest for 1/X/2 prediction
    # Features: home_team_id, away_team_id
    X_train = np.random.randint(0, 100, size=(1000, 2))
    # Labels for 1/X/2: 1 (Home win), 0 (Draw), 2 (Away win)
    y_train_1x2 = np.random.choice([1, 0, 2], size=1000)
    
    rf_model = RandomForestClassifier(n_estimators=10, random_state=42)
    rf_model.fit(X_train, y_train_1x2)
    
    # We will use XGBoost for GG/NG and Over/Under
    # Labels for GG: 1 (Yes), 0 (No)
    y_train_gg = np.random.choice([1, 0], size=1000)
    # Labels for Over/Under 2.5: 1 (Over), 0 (Under)
    y_train_ou = np.random.choice([1, 0], size=1000)
    
    xgb_gg_model = XGBClassifier(n_estimators=10, random_state=42, use_label_encoder=False, eval_metric='logloss')
    xgb_gg_model.fit(X_train, y_train_gg)
    
    xgb_ou_model = XGBClassifier(n_estimators=10, random_state=42, use_label_encoder=False, eval_metric='logloss')
    xgb_ou_model.fit(X_train, y_train_ou)
    
    # Ensure directory exists
    script_dir = os.path.dirname(os.path.abspath(__file__))
    models_dir = os.path.join(script_dir, '..', 'models')
    os.makedirs(models_dir, exist_ok=True)
    
    joblib.dump(rf_model, os.path.join(models_dir, 'rf_1x2.joblib'))
    joblib.dump(xgb_gg_model, os.path.join(models_dir, 'xgb_gg.joblib'))
    joblib.dump(xgb_ou_model, os.path.join(models_dir, 'xgb_ou.joblib'))
    print(f"Dummy models saved to {models_dir}")

if __name__ == "__main__":
    train_and_save_dummies()
