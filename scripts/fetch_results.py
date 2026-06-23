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

    # Evaluate 1x2 (The API comment is usually "Win or Draw" or similar)
    actual_1x2 = "1" if home_goals > away_goals else "2" if away_goals > home_goals else "X"
    # Simplified check for our UI since real prediction is complex text advice
    predicted_winner = match.get('prediction_1x2', '').lower()
    
    # Very basic evaluation based on advice text
    correct_1x2 = False
    if "win" in predicted_winner:
        if match['home_team'].lower() in predicted_winner and actual_1x2 == "1": correct_1x2 = True
        if match['away_team'].lower() in predicted_winner and actual_1x2 == "2": correct_1x2 = True
    elif "draw" in predicted_winner and actual_1x2 == "X":
        correct_1x2 = True

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
                
    for match in updated_matches:
        if match.get('status') == 'Finished':
            history['total_1x2'] += 1
            if match.get('correct_1x2'): history['correct_1x2'] += 1
            history['history_log'].append(match)
            
    history['history_log'] = history['history_log'][-100:]
            
    with open(history_file, 'w') as f:
        json.dump(history, f, indent=4)

if __name__ == "__main__":
    main()
