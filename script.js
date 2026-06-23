document.addEventListener("DOMContentLoaded", () => {
    fetchData();
});

async function fetchData() {
    try {
        // Fetch Predictions
        const predRes = await fetch('data/predictions.json');
        if (predRes.ok) {
            const predData = await predRes.json();
            renderPredictions(predData);
        } else {
            renderError('predictions-container', 'Predictions for today are not available yet.');
        }

        // Fetch History
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

        const card = document.createElement('div');
        card.className = 'prediction-card glass-card';
        card.style.position = 'relative';
        card.innerHTML = `
            <div class="status-badge ${statusClass}">${match.status}</div>
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
            <div class="predictions-tags">
                <div class="tag">
                    <span class="tag-label">1x2 Winner</span>
                    <span class="tag-value">${match.prediction_1x2}</span>
                </div>
                <div class="tag">
                    <span class="tag-label">Both Score</span>
                    <span class="tag-value">${match.prediction_gg}</span>
                </div>
                <div class="tag">
                    <span class="tag-label">Goals</span>
                    <span class="tag-value">${match.prediction_ou}</span>
                </div>
            </div>
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
    const accGG = calcAcc(data.correct_gg, data.total_gg);
    const accOU = calcAcc(data.correct_ou, data.total_ou);

    const getColorClass = (val) => {
        if(val >= 65) return 'high';
        if(val >= 50) return 'med';
        return 'low';
    };

    const stats = [
        { label: "Match Winner (1x2)", value: acc1x2, total: data.total_1x2 },
        { label: "Both Teams To Score", value: accGG, total: data.total_gg },
        { label: "Over/Under 2.5", value: accOU, total: data.total_ou }
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
