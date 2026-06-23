import os
import json
import requests
from datetime import datetime
from ml_utils import load_models, predict_match

API_KEY = os.environ.get('API_FOOTBALL_KEY')
API_URL = "https://v3.football.api-sports.io/fixtures"

def get_todays_fixtures():
    today = datetime.now().strftime('%Y-%m-%d')
    print(f"Fetching fixtures for {today}...")
    
    if not API_KEY:
        print("No API_FOOTBALL_KEY found. Generating dummy fixtures.")
        return generate_dummy_fixtures(today)

    headers = {
        'x-apisports-key': API_KEY
    }
    
    # Try fetching fixtures for top leagues to save requests/limit data
    # e.g., 39 = Premier League, 140 = La Liga, 135 = Serie A
    params = {
        'date': today,
        'league': '39', # Example: Premier League only for now, can be expanded
        'season': '2023' 
    }
    
    response = requests.get(API_URL, headers=headers, params=params)
    if response.status_code == 200:
        data = response.json()
        if data['errors']:
            print(f"API Errors: {data['errors']}")
            return generate_dummy_fixtures(today)
        return data['response']
    else:
        print(f"Failed to fetch data: {response.status_code}")
        return generate_dummy_fixtures(today)

def generate_dummy_fixtures(date):
    """Fallback dummy data for UI testing."""
    return [
        {
            "fixture": {"id": 1001, "date": f"{date}T15:00:00+00:00"},
            "teams": {
                "home": {"id": 33, "name": "Manchester United", "logo": "https://media.api-sports.io/football/teams/33.png"},
                "away": {"id": 34, "name": "Newcastle", "logo": "https://media.api-sports.io/football/teams/34.png"}
            }
        },
        {
            "fixture": {"id": 1002, "date": f"{date}T17:30:00+00:00"},
            "teams": {
                "home": {"id": 42, "name": "Arsenal", "logo": "https://media.api-sports.io/football/teams/42.png"},
                "away": {"id": 40, "name": "Liverpool", "logo": "https://media.api-sports.io/football/teams/40.png"}
            }
        }
    ]

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    models_dir = os.path.join(script_dir, '..', 'models')
    data_dir = os.path.join(script_dir, '..', 'data')
    os.makedirs(data_dir, exist_ok=True)
    
    models = load_models(models_dir)
    fixtures = get_todays_fixtures()
    
    predictions = []
    
    for f in fixtures:
        preds = predict_match(f, models)
        predictions.append({
            "fixture_id": f['fixture']['id'],
            "date": f['fixture']['date'],
            "home_team": f['teams']['home']['name'],
            "home_logo": f['teams']['home']['logo'],
            "away_team": f['teams']['away']['name'],
            "away_logo": f['teams']['away']['logo'],
            "prediction_1x2": preds['1x2'],
            "prediction_gg": preds['gg'],
            "prediction_ou": preds['over_under'],
            "status": "Pending" # Result unknown yet
        })
    
    output_file = os.path.join(data_dir, 'predictions.json')
    with open(output_file, 'w') as f:
        json.dump({"date": datetime.now().strftime('%Y-%m-%d'), "matches": predictions}, f, indent=4)
    print(f"Saved {len(predictions)} predictions to {output_file}")

if __name__ == "__main__":
    main()
