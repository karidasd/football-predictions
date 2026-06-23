import os
import json
import requests
from datetime import datetime
import time

API_KEY = os.environ.get('API_FOOTBALL_KEY')
API_URL = "https://v3.football.api-sports.io"

def fetch_api(endpoint, params):
    if not API_KEY: return None
    headers = {'x-apisports-key': API_KEY}
    response = requests.get(f"{API_URL}/{endpoint}", headers=headers, params=params)
    if response.status_code == 200:
        data = response.json()
        return data.get('response', [])
    return None

def get_todays_fixtures():
    today = datetime.now().strftime('%Y-%m-%d')
    fixtures = fetch_api("fixtures", {"date": today})
    if not fixtures: return []
    return fixtures[:15]

def get_prediction(fixture_id):
    preds = fetch_api("predictions", {"fixture": fixture_id})
    if preds and len(preds) > 0: return preds[0]
    return None

def get_odds(fixture_id):
    # Fetch pre-match odds
    odds_resp = fetch_api("odds", {"fixture": fixture_id})
    if odds_resp and len(odds_resp) > 0:
        bookmakers = odds_resp[0].get('bookmakers', [])
        if not bookmakers: return None
        # We take the first bookmaker available (usually 8xBet, Bet365 etc)
        bookmaker = bookmakers[0]
        bets = bookmaker.get('bets', [])
        # Find Match Winner odds (usually id 1)
        for bet in bets:
            if bet['name'] == 'Match Winner' or bet['id'] == 1:
                vals = bet.get('values', [])
                home_odd = next((v['odd'] for v in vals if v['value'] == 'Home'), 'N/A')
                draw_odd = next((v['odd'] for v in vals if v['value'] == 'Draw'), 'N/A')
                away_odd = next((v['odd'] for v in vals if v['value'] == 'Away'), 'N/A')
                return {"home": home_odd, "draw": draw_odd, "away": away_odd}
    return None

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(script_dir, '..', 'data')
    os.makedirs(data_dir, exist_ok=True)
    
    fixtures = get_todays_fixtures()
    predictions = []
    
    for f in fixtures:
        fix_id = f['fixture']['id']
        print(f"Fetching prediction & odds for {fix_id}...")
        
        pred_data = get_prediction(fix_id)
        if not pred_data: continue
            
        win_percent = pred_data['predictions']['percent']
        advice = pred_data['predictions']['advice']
        
        home_goals_pred = pred_data['predictions']['goals']['home']
        away_goals_pred = pred_data['predictions']['goals']['away']
        home_g = float(str(home_goals_pred).replace('-','0') if home_goals_pred else 0)
        away_g = float(str(away_goals_pred).replace('-','0') if away_goals_pred else 0)
        
        time.sleep(0.15) # rate limit
        odds_data = get_odds(fix_id)
        time.sleep(0.15) # rate limit

        predictions.append({
            "fixture_id": fix_id,
            "date": f['fixture']['date'],
            "league": f['league']['name'],
            "home_team": f['teams']['home']['name'],
            "home_logo": f['teams']['home']['logo'],
            "away_team": f['teams']['away']['name'],
            "away_logo": f['teams']['away']['logo'],
            "prediction_1x2": pred_data['predictions']['winner']['comment'],
            "percent_home": win_percent.get('home', '33%'),
            "percent_draw": win_percent.get('draw', '33%'),
            "percent_away": win_percent.get('away', '33%'),
            "prediction_gg": "GG" if home_goals_pred and away_goals_pred and str(home_goals_pred) != "0" and str(away_goals_pred) != "0" else "NG",
            "prediction_ou": "Over 2.5" if home_g + away_g > 2.5 else "Under 2.5",
            "advice": advice,
            "odds": odds_data, # Added odds data
            "status": "Pending"
        })
        
    output_file = os.path.join(data_dir, 'predictions.json')
    with open(output_file, 'w') as f:
        json.dump({"date": datetime.now().strftime('%Y-%m-%d'), "matches": predictions}, f, indent=4)
    print(f"Saved {len(predictions)} predictions to {output_file}")

if __name__ == "__main__":
    main()
