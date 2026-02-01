const sheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTPM_9oyH0PEX4xw8FbgN2zfh1V0STLzToet8YGQc90ZH-29L8tDgYIiDADmjEaNQh0rY1g-9v8SM1E/pub?gid=0&single=true&output=csv';
let newsBuffer = [];

function parseCsvLine(line) {
    return line.match(/(".*?"|[^",\r\n]+)(?=\s*,|\s*$)/g) || [];
}

function sanitizeCell(value) {
    return value.replace(/^"|"$/g, '').replace(/"/g, '').trim();
}

function buildNewsItem(parts) {
    if (parts.length < 3) return null;
    const titel = sanitizeCell(parts[0]);
    const inhalt = sanitizeCell(parts[1]);
    const bild = sanitizeCell(parts[2]);
    if (!titel) return null;
    return { titel, inhalt, bild };
}

function getNewsGrids() {
    return Array.from(document.querySelectorAll('[data-news-grid]'));
}

function renderNews(grid, items) {
    grid.innerHTML = '';

    if (!items || items.length === 0) {
        grid.innerHTML = '<p>Aktuell sind keine News verfügbar.</p>';
        return;
    }

    items.forEach(item => {
        grid.innerHTML += `
            <article class="news-card">
                <div class="news-image-box">
                    <img src="${item.bild}" onerror="this.src='https://via.placeholder.com/500x300?text=SG+Handball+News'" alt="News Bild">
                </div>
                <div class="news-body">
                    <h3>${item.titel}</h3>
                    <p>${item.inhalt}</p>
                </div>
            </article>`;
    });
}

async function loadNews() {
    const grids = getNewsGrids();
    if (grids.length === 0) {
        return;
    }

    if (window.location.protocol === 'file:') {
        grids.forEach(grid => {
            grid.innerHTML = '<p>Blog-Import blockiert: Bitte die Seite über einen lokalen Server öffnen (z. B. Live Server in VS Code).</p>';
        });
        return;
    }

    try {
        const response = await fetch(sheetUrl, { cache: 'no-store' });
        if (!response.ok) {
            throw new Error('Netzwerkfehler');
        }

        const csvData = await response.text();
        const lines = csvData.split(/\r?\n/).slice(1);

        newsBuffer = lines
            .map(line => buildNewsItem(parseCsvLine(line)))
            .filter(item => item !== null);

        const items = [...newsBuffer].reverse();

        grids.forEach(grid => {
            const limitValue = grid.getAttribute('data-limit');
            const limit = limitValue ? parseInt(limitValue, 10) : null;
            const list = Number.isFinite(limit) ? items.slice(0, limit) : items;
            renderNews(grid, list);
        });
    } catch (err) {
        grids.forEach(grid => {
            grid.innerHTML = '<p>Fehler beim Laden der News aus der Tabelle. Prüfe, ob das Google-Sheet veröffentlicht ist und der Link stimmt.</p>';
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadNews();
});
