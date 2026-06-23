document.addEventListener("DOMContentLoaded", () => {
    fetchData('today');
    setupMusicPlayer();
    setupTabsAndView();
});

function setupTabsAndView() {
    const tabs = {
        'yesterday': document.getElementById('tab-yesterday'),
        'today': document.getElementById('tab-today'),
        'tomorrow': document.getElementById('tab-tomorrow')
    };

    for (const [day, el] of Object.entries(tabs)) {
        if (!el) continue;
        el.addEventListener('click', () => {
            Object.values(tabs).forEach(t => t.classList.remove('active'));
            el.classList.add('active');
            fetchData(day);
        });
    }

    const gridBtn = document.getElementById('toggle-grid');
    const tableBtn = document.getElementById('toggle-table');
    const container = document.getElementById('predictions-container');

    if(gridBtn && tableBtn) {
        gridBtn.addEventListener('click', () => {
            gridBtn.classList.add('active');
            tableBtn.classList.remove('active');
            container.classList.remove('table-view');
            container.classList.add('grid-view');
        });

        tableBtn.addEventListener('click', () => {
            tableBtn.classList.add('active');
            gridBtn.classList.remove('active');
            container.classList.remove('grid-view');
            container.classList.add('table-view');
        });
    }
}

function setupMusicPlayer() {
    const music = document.getElementById('bg-music');
    const musicBtn = document.getElementById('music-toggle');
    
    // Auto-play attempt on first user interaction anywhere on the document
    document.body.addEventListener('click', () => {
        if (music.paused && !musicBtn.classList.contains('user-paused')) {
            music.volume = 0.3; // Low volume for background
            music.play().then(() => {
                musicBtn.textContent = '🎵';
            }).catch(e => console.log("Audio play blocked by browser"));
        }
    }, { once: true });

    musicBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (music.paused) {
            music.volume = 0.3;
            music.play();
            musicBtn.textContent = '🎵';
            musicBtn.classList.remove('user-paused');
        } else {
            music.pause();
            musicBtn.textContent = '🔇';
            musicBtn.classList.add('user-paused');
        }
    });
}

async function fetchData(dayStr = 'today') {
    const container = document.getElementById('predictions-container');
    if(container) container.innerHTML = '<div class="prediction-card glass-card skeleton" style="height: 250px;"></div>';

    try {
        const timestamp = new Date().getTime();
        let predData = null;
        
        const predRes = await fetch(`data/predictions_${dayStr}.json?t=${timestamp}`);
        if (predRes.ok) {
            predData = await predRes.json();
        } else if (dayStr === 'today') {
            const fbRes = await fetch(`data/predictions.json?t=${timestamp}`);
            if (fbRes.ok) predData = await fbRes.json();
        }

        if (predData && predData.matches) {
            document.getElementById('current-date').textContent = predData.date || dayStr;
            renderPredictions(predData);
        } else {
            renderError('predictions-container', `Predictions for ${dayStr} are not available yet.`);
            document.getElementById('botd-container').innerHTML = '';
            document.getElementById('bet-of-the-day').style.display = 'none';
        }

        const histRes = await fetch(`data/history.json?t=${timestamp}`);
        if (histRes.ok) {
            const histData = await histRes.json();
            renderHistory(histData);
        }
    } catch (error) {
        console.error("Error fetching data:", error);
    }
}

function calculateValue(match) {
    if (!match.odds || match.odds.home === 'N/A') return 0;
    
    // Convert e.g. "45%" to 0.45
    const pHome = parseFloat(match.percent_home) / 100 || 0;
    const pDraw = parseFloat(match.percent_draw) / 100 || 0;
    const pAway = parseFloat(match.percent_away) / 100 || 0;
    
    const oHome = parseFloat(match.odds.home) || 0;
    const oDraw = parseFloat(match.odds.draw) || 0;
    const oAway = parseFloat(match.odds.away) || 0;
    
    const valHome = pHome * oHome;
    const valDraw = pDraw * oDraw;
    const valAway = pAway * oAway;
    
    // Find highest value > 1.0 (expected value > 1)
    return Math.max(valHome, valDraw, valAway);
}

function renderPredictions(data) {
    const container = document.getElementById('predictions-container');
    const botdContainer = document.getElementById('botd-container');
    const botdSection = document.getElementById('bet-of-the-day');
    const dateBadge = document.getElementById('current-date');
    
    container.innerHTML = '';
    botdContainer.innerHTML = '';
    
    if (data.date) {
        dateBadge.textContent = new Date(data.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }

    if (!data.matches || data.matches.length === 0) {
        container.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color: var(--text-secondary);">No fixtures scheduled for this day.</p>';
        return;
    }

    // Find Bet of the Day (highest value bet, or highest confidence)
    let bestMatch = null;
    let bestValue = 0;
    
    data.matches.forEach(match => {
        const val = calculateValue(match);
        if (val > bestValue) {
            bestValue = val;
            bestMatch = match;
        }
    });

    // If no good value bet, just take highest home/away probability
    if (!bestMatch) {
        let maxProb = 0;
        data.matches.forEach(match => {
            const prob = Math.max(parseFloat(match.percent_home)||0, parseFloat(match.percent_away)||0);
            if (prob > maxProb) { maxProb = prob; bestMatch = match; }
        });
    }

    if (bestMatch) {
        botdSection.style.display = 'block';
        botdContainer.appendChild(createMatchCard(bestMatch, true));
    }

    data.matches.forEach(match => {
        if (match !== bestMatch) {
            container.appendChild(createMatchCard(match, false));
        }
    });
}

function createMatchCard(match, isVIP) {
    const isFinished = match.status === 'Finished';
    const statusClass = isFinished ? 'finished' : 'pending';
    
    let actualResultsHtml = '';
    if (isFinished) {
        actualResultsHtml = `
            <div style="margin-top: 1rem; text-align: center; font-size: 0.9rem; color: var(--text-secondary);">
                Score: <span style="color:var(--text-primary); font-weight: bold;">${match.home_goals} - ${match.away_goals}</span>
            </div>
        `;
    }

    let oddsHtml = '';
    if (match.odds && match.odds.home !== 'N/A') {
        const pHome = parseFloat(match.percent_home)/100;
        const pDraw = parseFloat(match.percent_draw)/100;
        const pAway = parseFloat(match.percent_away)/100;
        
        const isValHome = (pHome * match.odds.home) > 1.1;
        const isValDraw = (pDraw * match.odds.draw) > 1.1;
        const isValAway = (pAway * match.odds.away) > 1.1;

        oddsHtml = `
            <div class="odds-container">
                <div class="odds-box">
                    <span class="odds-label">1 (Home)</span>
                    <span class="odds-value ${isValHome ? 'value-bet' : ''}">${match.odds.home} ${isValHome ? '🌟' : ''}</span>
                </div>
                <div class="odds-box">
                    <span class="odds-label">X (Draw)</span>
                    <span class="odds-value ${isValDraw ? 'value-bet' : ''}">${match.odds.draw} ${isValDraw ? '🌟' : ''}</span>
                </div>
                <div class="odds-box">
                    <span class="odds-label">2 (Away)</span>
                    <span class="odds-value ${isValAway ? 'value-bet' : ''}">${match.odds.away} ${isValAway ? '🌟' : ''}</span>
                </div>
            </div>
        `;
    }

    const probHtml = `
        <div class="prob-container" style="margin-top: 1.5rem; font-size: 0.85rem;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                <span style="color:var(--text-secondary)">Home (${match.percent_home})</span>
                <span style="color:var(--text-secondary)">Draw (${match.percent_draw})</span>
                <span style="color:var(--text-secondary)">Away (${match.percent_away})</span>
            </div>
            <div style="display: flex; height: 6px; border-radius: 3px; overflow: hidden; background: rgba(255,255,255,0.1);">
                <div style="width: ${match.percent_home}; background: var(--accent-1);"></div>
                <div style="width: ${match.percent_draw}; background: var(--text-secondary);"></div>
                <div style="width: ${match.percent_away}; background: var(--accent-3);"></div>
            </div>
        </div>
    `;
    
    // Short tip logic
    const shortTip = match.short_tip || '1X2';
    const tipBadge = `<div class="short-tip-wrapper"><div class="short-tip-badge">${shortTip}</div></div>`;

    const card = document.createElement('div');
    card.className = `prediction-card glass-card ${isVIP ? 'vip-card' : ''}`;
    card.innerHTML = `
        ${tipBadge}
        <div class="status-badge ${statusClass}">${match.status}</div>
        <div class="match-header" style="flex-direction: column; text-align: center; font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 1rem; text-transform: uppercase; letter-spacing: 1px;">
            ${match.league}
        </div>
        <div class="match-teams" style="display:flex; justify-content:space-between; align-items:center;">
            <div class="team" style="text-align:center;">
                <img src="${match.home_logo}" alt="${match.home_team}" style="width:40px; height:40px;" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MCIgaGVpZ2h0PSI1MCI+PHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjMzMzIi8+PC9zdmc+'">
                <span class="team-name" style="display:block; margin-top:0.5rem; font-weight:bold;">${match.home_team}</span>
            </div>
            <div class="vs" style="font-weight:900; color:var(--text-secondary);">VS</div>
            <div class="team" style="text-align:center;">
                <img src="${match.away_logo}" alt="${match.away_team}" style="width:40px; height:40px;" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MCIgaGVpZ2h0PSI1MCI+PHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjMzMzIi8+PC9zdmc+'">
                <span class="team-name" style="display:block; margin-top:0.5rem; font-weight:bold;">${match.away_team}</span>
            </div>
        </div>
        ${probHtml}
        ${oddsHtml}
        <div class="ai-advice" style="margin-top: 1rem; padding: 0.75rem; background: rgba(255,255,255,0.05); border-radius: 8px; text-align: center;">
            <strong style="color: var(--accent-2); font-size: 0.8rem; text-transform: uppercase;">AI Advice</strong><br>
            <span style="font-size: 0.95rem; font-weight: 600;">${match.advice}</span>
        </div>
        ${actualResultsHtml}
    `;
    return card;
}

function renderHistory(data) {
    const container = document.getElementById('stats-container');
    container.innerHTML = '';

    const calcAcc = (correct, total) => total > 0 ? Math.round((correct / total) * 100) : 0;
    const acc1x2 = calcAcc(data.correct_1x2, data.total_1x2);

    const getColorClass = (val) => {
        if(val >= 65) return 'high';
        if(val >= 50) return 'med';
        return 'low';
    };

    const stats = [
        { label: "Winner Prediction Accuracy", value: acc1x2, total: data.total_1x2 }
    ];

    stats.forEach(stat => {
        const card = document.createElement('div');
        card.className = 'stat-card glass-card';
        card.innerHTML = `
            <div class="stat-label">${stat.label}</div>
            <div class="stat-value ${getColorClass(stat.value)}">${stat.value}%</div>
            <div class="stat-sub">Accuracy over ${stat.total} matches</div>
        `;
        container.appendChild(card);
    });
}

function renderError(containerId, message) {
    const container = document.getElementById(containerId);
    container.innerHTML = `<p style="grid-column: 1/-1; text-align:center; color: var(--text-secondary);">${message}</p>`;
}
