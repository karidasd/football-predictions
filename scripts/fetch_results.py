import os
import json
import requests
from datetime import datetime

API_KEY = os.environ.get('API_FOOTBALL_KEY')
API_URL = "https://v3.football.api-sports.io/fixtures"

def fetch_result(fixture_id):
    if not API_KEY: return None
    headers = {'x-apisports-key': API_KEY}
    response = requests.get(API_URL, headers=headers, params={'id': fixture_id})
    if response.status_code == 200:
        data = response.json()
        if data['response'] and len(data['response']) > 0:
            return data['response'][0]
    return None

def evaluate_predictions(match, result):
    home_goals = result['goals']['home']
    away_goals = result['goals']['away']
    
    if home_goals is None or away_goals is None:
        return match

    # Evaluate using the Short Tip (e.g., '1', '1X', 'X2')
    actual_1x2 = "1" if home_goals > away_goals else "2" if away_goals > home_goals else "X"
    
    short_tip = match.get('short_tip', '1X2')
    
    # If the actual result character (1, X, or 2) is inside the short tip string, it's correct!
    correct_1x2 = actual_1x2 in short_tip

    match['actual_1x2'] = actual_1x2
    match['correct_1x2'] = correct_1x2
    match['status'] = "Finished"
    match['home_goals'] = home_goals
    match['away_goals'] = away_goals

    return match

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(script_dir, '..', 'data')
    
    preds_file = os.path.join(data_dir, 'predictions.json')
    history_file = os.path.join(data_dir, 'history.json')
    
    if not os.path.exists(preds_file): return

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
    
    data['matches'] = updated_matches
    with open(preds_file, 'w') as f:
        json.dump(data, f, indent=4)
        
    history = {"total_1x2": 0, "correct_1x2": 0, "history_log": []}
    if os.path.exists(history_file):
        with open(history_file, 'r') as f:
            try: history = json.load(f)
            except: pass
                
    existing_fixture_ids = [m.get('fixture_id') for m in history['history_log']]
            
    for match in updated_matches:
        if match.get('status') == 'Finished' and match.get('fixture_id') not in existing_fixture_ids:
            history['total_1x2'] += 1
            if match.get('correct_1x2'): history['correct_1x2'] += 1
            history['history_log'].append(match)
            
    history['history_log'] = history['history_log'][-100:]
            
    with open(history_file, 'w') as f:
        json.dump(history, f, indent=4)

if __name__ == "__main__":
    main()
