import joblib
import pandas as pd
import os

def load_models(models_dir):
    try:
        rf_1x2 = joblib.load(os.path.join(models_dir, 'rf_1x2.joblib'))
        xgb_gg = joblib.load(os.path.join(models_dir, 'xgb_gg.joblib'))
        xgb_ou = joblib.load(os.path.join(models_dir, 'xgb_ou.joblib'))
        return rf_1x2, xgb_gg, xgb_ou
    except Exception as e:
        print(f"Error loading models: {e}. Please run train_dummy_models.py first.")
        return None, None, None

def prepare_features(fixture):
    """
    Extracts features from API-Football fixture response.
    In a real scenario, this would include historical stats, odds, etc.
    For this dummy implementation, we just use team IDs.
    """
    home_id = fixture['teams']['home']['id']
    away_id = fixture['teams']['away']['id']
    
    # Needs to match the feature shape expected by the model (2 columns)
    return pd.DataFrame([[home_id, away_id]], columns=['home_team_id', 'away_team_id'])

def predict_match(fixture, models):
    rf_1x2, xgb_gg, xgb_ou = models
    if rf_1x2 is None:
        return {
            "1x2": "N/A",
            "gg": "N/A",
            "over_under": "N/A"
        }
    
    features = prepare_features(fixture)
    
    # Predict 1x2
    pred_1x2 = rf_1x2.predict(features)[0]
    map_1x2 = {1: "1", 0: "X", 2: "2"}
    
    # Predict GG/NG
    pred_gg = xgb_gg.predict(features)[0]
    map_gg = {1: "GG", 0: "NG"}
    
    # Predict Over/Under 2.5
    pred_ou = xgb_ou.predict(features)[0]
    map_ou = {1: "Over 2.5", 0: "Under 2.5"}
    
    return {
        "1x2": map_1x2[int(pred_1x2)],
        "gg": map_gg[int(pred_gg)],
        "over_under": map_ou[int(pred_ou)]
    }
