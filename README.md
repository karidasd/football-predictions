<h1 align="center">
  🤖 AI-Powered Football Predictions ⚽
</h1>

<p align="center">
  <strong>A Fully Automated, VIP-style Football Prediction Dashboard powered by API-Football's Machine Learning Engine.</strong>
</p>

<p align="center">
  <a href="https://karidasd.github.io/football-predictions/"><strong>🔴 View the Live Dashboard Here</strong></a>
</p>

---

## ✨ Features

- **🧠 Real AI Predictions:** Uses the advanced `API-Football` internal ML engine to fetch accurate probabilities for Match Winners (1X2), Over/Under, and Both Teams to Score (GG/NG).
- **🌟 VIP Bet of the Day:** The algorithm scans all daily fixtures and automatically selects the top "Value Bet" or highest-confidence match to feature at the top of the page.
- **📈 Value Bet Detection:** Fetches real-time pre-match betting odds from top bookmakers. It mathematically compares the odds against the AI's probability score (`Probability * Odds > 1.0`) and highlights profitable bets with a 🌟.
- **🤖 100% Automated (GitHub Actions):** 
  - 🌅 **Morning Cron Job:** Automatically runs every morning to fetch today's fixtures, predictions, and odds, updating the frontend instantly without manual work.
  - 🌃 **Evening Cron Job:** Automatically runs every night to fetch the final match scores, grading the AI's predictions and keeping a live track record of accuracy.
- **🎨 Premium UI/UX:** Built with Glassmorphism, neon dark-mode themes, dynamic probability progress bars, and mobile-responsive match cards.

## ⚙️ Architecture

The project is hosted entirely on **GitHub Pages** (frontend) and uses **GitHub Actions** (backend automation). 
There are no servers to maintain.

1. `scripts/fetch_predictions.py`: Requests `/fixtures`, `/predictions`, and `/odds` from API-Football. Saves to `data/predictions.json`.
2. `scripts/fetch_results.py`: Checks completed matches, calculates accuracy, and updates `data/history.json`.
3. `index.html` & `script.js`: A static frontend that directly reads the generated JSON files and builds the UI.

## 🚀 How to Run Locally

1. Clone the repository:
   ```bash
   git clone https://github.com/karidasd/football-predictions.git
   cd football-predictions
   ```
2. Set your API Key:
   ```bash
   # Windows
   $env:API_FOOTBALL_KEY="your_api_key_here"
   
   # Linux/Mac
   export API_FOOTBALL_KEY="your_api_key_here"
   ```
3. Run the data fetcher (Optional, if you want fresh data immediately):
   ```bash
   python scripts/fetch_predictions.py
   ```
4. Open `index.html` in your browser.

## 📝 License
This is a personal project created for educational and demonstration purposes.
