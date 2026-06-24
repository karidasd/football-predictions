document.addEventListener('DOMContentLoaded', () => {
    fetchData();
});

async function fetchData() {
    try {
        const timestamp = new Date().getTime();
        const response = await fetch(`data/stocks.json?t=${timestamp}`);
        if (!response.ok) throw new Error('Data file not found');
        
        const data = await response.json();
        
        document.getElementById('last-update').textContent = `Last Update: ${data.date}`;
        
        renderSOTD(data);
        renderStocksGrid(data.stocks);
        
    } catch (error) {
        console.error('Error fetching data:', error);
        document.getElementById('stocks-grid').innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--neon-red);">
                <h3>Σφάλμα Φόρτωσης Δεδομένων</h3>
                <p>Παρακαλώ περιμένετε το επόμενο update.</p>
            </div>
        `;
    }
}

function getBadgeClass(tip) {
    const t = tip.toLowerCase();
    if (t.includes('strong buy')) return 'badge strong-buy';
    if (t.includes('buy')) return 'badge buy';
    if (t.includes('strong sell')) return 'badge strong-sell';
    if (t.includes('sell')) return 'badge sell';
    return 'badge hold';
}

function getSentimentBadgeClass(sent) {
    const s = sent.toLowerCase();
    if (s === 'bullish') return 'badge bullish';
    if (s === 'bearish') return 'badge bearish';
    return 'badge neutral';
}

function renderSOTD(data) {
    if (!data.sotd) return;
    
    const stock = data.stocks.find(s => s.ticker === data.sotd);
    if (!stock) return;
    
    const isUp = stock.change_pct >= 0;
    const changeClass = isUp ? 'up' : 'down';
    const changeSign = isUp ? '+' : '';
    
    const html = `
        <div class="sotd-main">
            <span class="sotd-ticker">${stock.ticker.replace('.AT', '')}</span>
            <span class="sotd-name">${stock.name}</span>
            <div class="sotd-price-container">
                <span class="sotd-price">€${stock.price.toFixed(3)}</span>
                <span class="sotd-change ${changeClass}" style="background: ${isUp ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)'}">
                    ${changeSign}${stock.change_pct}%
                </span>
            </div>
        </div>
        <div class="sotd-badges">
            <div class="stat-box" style="align-items: flex-end;">
                <span class="stat-label">AI Tech Signal (RSI: ${stock.rsi})</span>
                <span class="${getBadgeClass(stock.tech_tip)}">${stock.tech_tip}</span>
            </div>
            <div class="stat-box" style="align-items: flex-end;">
                <span class="stat-label">News Sentiment Score: ${stock.sentiment_score}</span>
                <span class="${getSentimentBadgeClass(stock.sentiment)}">${stock.sentiment}</span>
            </div>
        </div>
    `;
    
    document.getElementById('sotd-card').innerHTML = html;
    document.getElementById('sotd-container').style.display = 'block';
}

function renderStocksGrid(stocks) {
    const grid = document.getElementById('stocks-grid');
    grid.innerHTML = '';
    
    stocks.forEach(stock => {
        const isUp = stock.change_pct >= 0;
        const changeClass = isUp ? 'up' : 'down';
        const changeSign = isUp ? '+' : '';
        
        const card = document.createElement('div');
        card.className = 'stock-card';
        if (stock.is_sotd) {
            card.style.borderColor = 'var(--accent-blue)';
            card.style.boxShadow = '0 0 15px rgba(59,130,246,0.2)';
        }
        
        card.innerHTML = `
            <div class="stock-header">
                <div class="stock-info">
                    <h3>${stock.name}</h3>
                    <span>${stock.ticker.replace('.AT', '')}</span>
                </div>
                <div class="stock-price-info">
                    <span class="price">€${stock.price.toFixed(3)}</span>
                    <span class="change ${changeClass}">${changeSign}${stock.change_pct}%</span>
                </div>
            </div>
            
            <div class="stock-stats">
                <div class="stat-box">
                    <span class="stat-label">Tech Signal</span>
                    <span class="${getBadgeClass(stock.tech_tip)}">${stock.tech_tip}</span>
                </div>
                <div class="stat-box" style="align-items: flex-end;">
                    <span class="stat-label">Sentiment</span>
                    <span class="${getSentimentBadgeClass(stock.sentiment)}">${stock.sentiment}</span>
                </div>
            </div>
        `;
        
        grid.appendChild(card);
    });
}
