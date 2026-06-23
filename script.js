document.addEventListener("DOMContentLoaded", () => {
    fetchData();
});

async function fetchData() {
    try {
        const predRes = await fetch('data/predictions.json');
        if (predRes.ok) {
            const predData = await predRes.json();
            renderPredictions(predData);
        } else {
            renderError('predictions-container', 'Predictions for today are not available yet.');
        }

        const histRes = await fetch('data/history.json');
        if (histRes.ok) {
            const histData = await histRes.json();
            renderHistory(histData);
        } else {
            renderError('stats-container', 'History data is not available yet.');
        }

    } catch (error) {
        console.error("Error fetching data:", error);
    }
}

function renderPredictions(data) {
    const container = document.getElementById('predictions-container');
    const dateBadge = document.getElementById('current-date');
    
    container.innerHTML = '';
    
    if (data.date) {
        dateBadge.textContent = new Date(data.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }

    if (!data.matches || data.matches.length === 0) {
        container.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color: var(--text-secondary);">No fixtures scheduled for today.</p>';
        return;
    }

    data.matches.forEach(match => {
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

        // Generate probability bars
        const probHtml = `
            <div style="margin-top: 1.5rem; font-size: 0.85rem;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                    <span style="color:var(--text-secondary)">Home Win (${match.percent_home})</span>
                    <span style="color:var(--text-secondary)">Draw (${match.percent_draw})</span>
                    <span style="color:var(--text-secondary)">Away Win (${match.percent_away})</span>
                </div>
                <div style="display: flex; height: 6px; border-radius: 3px; overflow: hidden; background: rgba(255,255,255,0.1);">
                    <div style="width: ${match.percent_home}; background: var(--accent-1);"></div>
                    <div style="width: ${match.percent_draw}; background: var(--text-secondary);"></div>
                    <div style="width: ${match.percent_away}; background: var(--accent-3);"></div>
                </div>
            </div>
            <div style="margin-top: 1rem; padding: 0.75rem; background: rgba(255,255,255,0.05); border-radius: 8px; text-align: center;">
                <strong style="color: var(--accent-2); font-size: 0.8rem; text-transform: uppercase;">AI Advice</strong><br>
                <span style="font-size: 0.95rem; font-weight: 600;">${match.advice}</span>
            </div>
        `;

        const card = document.createElement('div');
        card.className = 'prediction-card glass-card';
        card.style.position = 'relative';
        card.innerHTML = `
            <div class="status-badge ${statusClass}">${match.status}</div>
            <div style="font-size: 0.75rem; color: var(--text-secondary); text-align: center; margin-bottom: 1rem; text-transform: uppercase; letter-spacing: 1px;">
                ${match.league}
            </div>
            <div class="match-teams">
                <div class="team">
                    <img src="${match.home_logo}" alt="${match.home_team}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MCIgaGVpZ2h0PSI1MCI+PHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjMzMzIi8+PC9zdmc+'">
                    <span class="team-name">${match.home_team}</span>
                </div>
                <div class="vs">VS</div>
                <div class="team">
                    <img src="${match.away_logo}" alt="${match.away_team}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MCIgaGVpZ2h0PSI1MCI+PHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjMzMzIi8+PC9zdmc+'">
                    <span class="team-name">${match.away_team}</span>
                </div>
            </div>
            ${probHtml}
            ${actualResultsHtml}
        `;
        container.appendChild(card);
    });
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
