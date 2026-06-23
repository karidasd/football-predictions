import os
import json
import requests
from datetime import datetime
import random

API_KEY = os.environ.get('API_FOOTBALL_KEY')
API_URL = "https://v3.football.api-sports.io/fixtures"

def fetch_result(fixture_id):
    if not API_KEY:
        # Dummy result logic
        home_goals = random.randint(0, 4)
        away_goals = random.randint(0, 4)
        return {
            "goals": {"home": home_goals, "away": away_goals},
            "status": {"short": "FT"}
        }

    headers = {'x-apisports-key': API_KEY}
    params = {'id': fixture_id}
    
    response = requests.get(API_URL, headers=headers, params=params)
    if response.status_code == 200:
        data = response.json()
        if data['response'] and len(data['response']) > 0:
            return data['response'][0]
    return None

def evaluate_predictions(match, result):
    home_goals = result['goals']['home']
    away_goals = result['goals']['away']
    
    if home_goals is None or away_goals is None:
        return match # Cannot evaluate

    # Evaluate 1x2
    actual_1x2 = "1" if home_goals > away_goals else "2" if away_goals > home_goals else "X"
    match['actual_1x2'] = actual_1x2
    match['correct_1x2'] = (match['prediction_1x2'] == actual_1x2)

    # Evaluate GG/NG
    actual_gg = "GG" if (home_goals > 0 and away_goals > 0) else "NG"
    match['actual_gg'] = actual_gg
    match['correct_gg'] = (match['prediction_gg'] == actual_gg)

    # Evaluate Over/Under
    total_goals = home_goals + away_goals
    actual_ou = "Over 2.5" if total_goals > 2.5 else "Under 2.5"
    match['actual_ou'] = actual_ou
    match['correct_ou'] = (match['prediction_ou'] == actual_ou)

    match['status'] = "Finished"
    match['home_goals'] = home_goals
    match['away_goals'] = away_goals

    return match

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(script_dir, '..', 'data')
    
    preds_file = os.path.join(data_dir, 'predictions.json')
    history_file = os.path.join(data_dir, 'history.json')
    
    if not os.path.exists(preds_file):
        print("No predictions found for today.")
        return

    with open(preds_file, 'r') as f:
        data = json.load(f)
    
    updated_matches = []
    for match in data.get('matches', []):
        if match.get('status') == 'Pending':
            print(f"Fetching result for {match['home_team']} vs {match['away_team']}...")
            result = fetch_result(match['fixture_id'])
            if result and result.get('status', {}).get('short') in ['FT', 'AET', 'PEN']:
                match = evaluate_predictions(match, result)
        updated_matches.append(match)
    
    # Save back to predictions (to update UI for today)
    data['matches'] = updated_matches
    with open(preds_file, 'w') as f:
        json.dump(data, f, indent=4)
        
    # Update history metrics
    history = {"total_1x2": 0, "correct_1x2": 0, "total_gg": 0, "correct_gg": 0, "total_ou": 0, "correct_ou": 0, "history_log": []}
    if os.path.exists(history_file):
        with open(history_file, 'r') as f:
            try:
                history = json.load(f)
            except:
                pass
                
    for match in updated_matches:
        if match.get('status') == 'Finished':
            history['total_1x2'] += 1
            if match.get('correct_1x2'): history['correct_1x2'] += 1
            
            history['total_gg'] += 1
            if match.get('correct_gg'): history['correct_gg'] += 1
            
            history['total_ou'] += 1
            if match.get('correct_ou'): history['correct_ou'] += 1
            
            history['history_log'].append(match)
            
    # Keep log manageable (last 100 matches)
    history['history_log'] = history['history_log'][-100:]
            
    with open(history_file, 'w') as f:
        json.dump(history, f, indent=4)
        
    print(f"Results updated and history saved.")

if __name__ == "__main__":
    main()
