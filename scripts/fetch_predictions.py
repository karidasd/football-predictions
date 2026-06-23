import os
import json
import requests
from datetime import datetime, timedelta
import time
import shutil

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

def get_fixtures_for_date(date_str):
    fixtures = fetch_api("fixtures", {"date": date_str})
    if not fixtures: return []
    # Limit to 10 fixtures per day to save API limits
    return fixtures[:10]

def get_prediction(fixture_id):
    preds = fetch_api("predictions", {"fixture": fixture_id})
    if preds and len(preds) > 0: return preds[0]
    return None

def get_odds(fixture_id):
    odds_resp = fetch_api("odds", {"fixture": fixture_id})
    if odds_resp and len(odds_resp) > 0:
        bookmakers = odds_resp[0].get('bookmakers', [])
        if not bookmakers: return None
        bookmaker = bookmakers[0]
        bets = bookmaker.get('bets', [])
        for bet in bets:
            if bet['name'] == 'Match Winner' or bet['id'] == 1:
                vals = bet.get('values', [])
                home_odd = next((v['odd'] for v in vals if v['value'] == 'Home'), 'N/A')
                draw_odd = next((v['odd'] for v in vals if v['value'] == 'Draw'), 'N/A')
                away_odd = next((v['odd'] for v in vals if v['value'] == 'Away'), 'N/A')
                return {"home": home_odd, "draw": draw_odd, "away": away_odd}
    return None

def generate_short_tip(win_percent):
    try:
        h = float(str(win_percent.get('home', '33%')).replace('%',''))
        d = float(str(win_percent.get('draw', '33%')).replace('%',''))
        a = float(str(win_percent.get('away', '33%')).replace('%',''))
        
        if h >= 50: return "1"
        if a >= 50: return "2"
        if h > 40 and d > 30: return "1X"
        if a > 40 and d > 30: return "X2"
        if d >= 40: return "X"
        if h > a: return "1X"
        return "X2"
    except:
        return "1X2"

def process_day(date_obj, filename, data_dir):
    date_str = date_obj.strftime('%Y-%m-%d')
    fixtures = get_fixtures_for_date(date_str)
    predictions = []
    
    api_calls = 0
    for f in fixtures:
        if len(predictions) >= 5: break
        if api_calls >= 15: break # Stop searching after 15 failed prediction attempts
        
        fix_id = f['fixture']['id']
        print(f"Fetching prediction & odds for {fix_id} on {date_str}...")
        
        time.sleep(0.15) 
        pred_data = get_prediction(fix_id)
        api_calls += 1
        
        if not pred_data: continue
            
        win_percent = pred_data['predictions']['percent']
        advice = pred_data['predictions']['advice']
        
        home_goals_pred = pred_data['predictions']['goals']['home']
        away_goals_pred = pred_data['predictions']['goals']['away']
        home_g = float(str(home_goals_pred).replace('-','0') if home_goals_pred else 0)
        away_g = float(str(away_goals_pred).replace('-','0') if away_goals_pred else 0)
        
        time.sleep(0.15) 
        odds_data = get_odds(fix_id)
        time.sleep(0.15) 

        status_short = f['fixture']['status']['short']
        is_finished = status_short in ['FT', 'AET', 'PEN']
        home_goals = f['goals']['home']
        away_goals = f['goals']['away']
        
        correct_1x2 = False
        if is_finished and home_goals is not None and away_goals is not None:
            actual_1x2 = "1" if home_goals > away_goals else "2" if away_goals > home_goals else "X"
            short_tip = generate_short_tip(win_percent)
            correct_1x2 = actual_1x2 in short_tip

        predictions.append({
            "fixture_id": fix_id,
            "date": f['fixture']['date'],
            "league": f['league']['name'],
            "home_team": f['teams']['home']['name'],
            "home_logo": f['teams']['home']['logo'],
            "away_team": f['teams']['away']['name'],
            "away_logo": f['teams']['away']['logo'],
            "prediction_1x2": pred_data['predictions']['winner']['comment'],
            "short_tip": generate_short_tip(win_percent),
            "percent_home": win_percent.get('home', '33%'),
            "percent_draw": win_percent.get('draw', '33%'),
            "percent_away": win_percent.get('away', '33%'),
            "prediction_gg": "GG" if home_goals_pred and away_goals_pred and str(home_goals_pred) != "0" and str(away_goals_pred) != "0" else "NG",
            "prediction_ou": "Over 2.5" if home_g + away_g > 2.5 else "Under 2.5",
            "advice": advice,
            "odds": odds_data,
            "status": "Finished" if is_finished else "Pending" if status_short == 'NS' else "In Play",
            "home_goals": home_goals if is_finished else None,
            "away_goals": away_goals if is_finished else None,
            "correct_1x2": correct_1x2
        })
        
    output_file = os.path.join(data_dir, filename)
    with open(output_file, 'w') as f:
        json.dump({"date": date_str, "matches": predictions}, f, indent=4)
    print(f"Saved {len(predictions)} predictions to {output_file}")

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(script_dir, '..', 'data')
    os.makedirs(data_dir, exist_ok=True)
    
    today = datetime.now()
    
    # Generate only today's file to save API limits
    process_day(today, 'predictions_today.json', data_dir)
    
    # We also keep predictions.json as an alias for today to not break backward compatibility
    shutil.copyfile(os.path.join(data_dir, 'predictions_today.json'), os.path.join(data_dir, 'predictions.json'))

if __name__ == "__main__":
    main()
