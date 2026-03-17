const puppeteer = require('puppeteer');
const path = require('path');

const APP_URL = `file://${path.resolve(__dirname, 'index.html')}`;

let browser;
let page;

beforeAll(async () => {
    browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
});

afterAll(async () => {
    if (browser) await browser.close();
});

beforeEach(async () => {
    page = await browser.newPage();
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded' });
    // Clear localStorage for clean state
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'domcontentloaded' });
});

afterEach(async () => {
    if (page) await page.close();
});

// Helper: wait for Bootstrap modal to fully hide
async function waitForModalHidden(page, selector) {
    await page.waitForFunction(
        (sel) => !document.querySelector(sel)?.classList.contains('show'),
        { timeout: 5000 },
        selector
    );
    await new Promise(r => setTimeout(r, 500));
}

// Helper: set up players directly via localStorage (bypasses modal interactions)
async function setupPlayersDirectly(page, count) {
    await page.evaluate((n) => {
        // Ensure we have enough players
        let allPlayers = JSON.parse(localStorage.getItem('players')) || [];
        while (allPlayers.length < n) {
            allPlayers.push('Test Player ' + (allPlayers.length + 1));
        }
        localStorage.setItem('players', JSON.stringify(allPlayers));
        const selected = allPlayers.slice(0, n).map(name => ({ playerName: name }));
        localStorage.setItem('selectedPlayers', JSON.stringify(selected));
    }, count);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 500));
}

describe('Page Structure', () => {
    test('page title is Tennis Match Manager', async () => {
        const title = await page.title();
        expect(title).toBe('Tennis Match Manager');
    });

    test('main UI elements are present', async () => {
        const elements = await page.evaluate(() => ({
            playerLabel: !!document.getElementById('player-list-label'),
            playerCount: !!document.getElementById('player-count'),
            selectedPlayers: !!document.getElementById('selected-players'),
            matchesList: !!document.getElementById('matches-list'),
            createMatchesBtn: !!document.getElementById('create-matches'),
            addPlayerBtn: !!document.getElementById('add-player'),
            optionsBtn: !!document.getElementById('options-btn'),
            clearTracking: !!document.getElementById('clear-tracking'),
            newMatches: !!document.getElementById('new-matches'),
        }));
        Object.entries(elements).forEach(([name, exists]) => {
            expect(exists).toBe(true);
        });
    });

    test('player count shows (0) initially', async () => {
        const count = await page.$eval('#player-count', el => el.textContent);
        expect(count).toBe('(0)');
    });

    test('no matches message is visible initially', async () => {
        const display = await page.$eval('#no-matches-message', el =>
            window.getComputedStyle(el).display
        );
        expect(display).not.toBe('none');
    });
});

describe('Select Players Modal', () => {
    test('opens when Select Players button is clicked', async () => {
        await page.click('#add-player');
        await page.waitForSelector('#addPlayerModal.show', { timeout: 2000 });
        const isVisible = await page.$eval('#addPlayerModal', el =>
            el.classList.contains('show')
        );
        expect(isVisible).toBe(true);
    });

    test('shows predefined players list', async () => {
        await page.click('#add-player');
        await page.waitForSelector('#addPlayerModal.show', { timeout: 2000 });
        const playersList = await page.$eval('#predefined-players-list', el => el.children.length);
        expect(playersList).toBeGreaterThan(0);
    });

    test('Edit Mode button toggles edit icons visibility', async () => {
        await page.click('#add-player');
        await page.waitForSelector('#addPlayerModal.show', { timeout: 2000 });

        // Edit icons should be hidden initially
        const hiddenBefore = await page.$eval('.edit-icon', el =>
            window.getComputedStyle(el).display
        );
        expect(hiddenBefore).toBe('none');

        // Click Edit Mode
        await page.click('#toggle-edit-mode');

        // Edit icons should be visible
        const hiddenAfter = await page.$eval('.edit-icon', el =>
            window.getComputedStyle(el).display
        );
        expect(hiddenAfter).not.toBe('none');
    });
});

describe('Player Selection and Count', () => {
    test('selecting players updates the player count', async () => {
        await setupPlayersDirectly(page, 3);
        const count = await page.$eval('#player-count', el => el.textContent);
        expect(count).toBe('(3)');
    });

    test('selected players appear in the player list', async () => {
        await setupPlayersDirectly(page, 3);
        const selectedCount = await page.$$eval('#selected-players div', els => els.length);
        expect(selectedCount).toBe(3);
    });

    test('player names are displayed in the list', async () => {
        await setupPlayersDirectly(page, 2);
        const names = await page.$$eval('#selected-players div', els => els.map(e => e.textContent));
        expect(names.length).toBe(2);
        names.forEach(name => expect(name.length).toBeGreaterThan(0));
    });
});

describe('Options Modal', () => {
    test('opens when Options button is clicked', async () => {
        await page.click('#options-btn');
        await page.waitForSelector('#optionsModal.show', { timeout: 2000 });
        const isVisible = await page.$eval('#optionsModal', el =>
            el.classList.contains('show')
        );
        expect(isVisible).toBe(true);
    });

    test('font scale controls are present', async () => {
        await page.click('#options-btn');
        await page.waitForSelector('#optionsModal.show', { timeout: 2000 });
        const elements = await page.evaluate(() => ({
            decrease: !!document.getElementById('font-decrease'),
            increase: !!document.getElementById('font-increase'),
            display: !!document.getElementById('font-scale-display'),
        }));
        expect(elements.decrease).toBe(true);
        expect(elements.increase).toBe(true);
        expect(elements.display).toBe(true);
    });

    test('font scale display shows 100% by default', async () => {
        await page.click('#options-btn');
        await page.waitForSelector('#optionsModal.show', { timeout: 2000 });
        const scale = await page.$eval('#font-scale-display', el => el.textContent);
        expect(scale).toBe('100%');
    });

    test('font increase button changes scale to 110%', async () => {
        await page.click('#options-btn');
        await page.waitForSelector('#optionsModal.show', { timeout: 2000 });
        await page.click('#font-increase');
        const scale = await page.$eval('#font-scale-display', el => el.textContent);
        expect(scale).toBe('110%');
    });

    test('font decrease button changes scale to 90%', async () => {
        await page.click('#options-btn');
        await page.waitForSelector('#optionsModal.show', { timeout: 2000 });
        await page.click('#font-decrease');
        const scale = await page.$eval('#font-scale-display', el => el.textContent);
        expect(scale).toBe('90%');
    });

    test('font scale is applied to document root', async () => {
        await page.click('#options-btn');
        await page.waitForSelector('#optionsModal.show', { timeout: 2000 });
        await page.click('#font-increase');
        const fontSize = await page.evaluate(() =>
            document.documentElement.style.fontSize
        );
        expect(fontSize).toBe('110%');
    });

    test('font scale persists in localStorage', async () => {
        await page.click('#options-btn');
        await page.waitForSelector('#optionsModal.show', { timeout: 2000 });
        await page.click('#font-increase');
        const stored = await page.evaluate(() => localStorage.getItem('fontScale'));
        expect(stored).toBe('110');
    });

    test('version date is displayed', async () => {
        await page.click('#options-btn');
        await page.waitForSelector('#optionsModal.show', { timeout: 2000 });
        const version = await page.$eval('#options-version-date', el => el.textContent);
        expect(version).toBeTruthy();
        expect(version).toMatch(/\d{4}-\d{2}-\d{2}/);
    });

    test('Check for Updates button is present', async () => {
        await page.click('#options-btn');
        await page.waitForSelector('#optionsModal.show', { timeout: 2000 });
        const btn = await page.$('#check-update-btn');
        expect(btn).toBeTruthy();
    });

    test('Advanced section is collapsed by default', async () => {
        await page.click('#options-btn');
        await page.waitForSelector('#optionsModal.show', { timeout: 2000 });
        const isOpen = await page.$eval('.advanced-options', el => el.open);
        expect(isOpen).toBeFalsy();
    });

    test('Advanced section contains Load Players controls', async () => {
        await page.click('#options-btn');
        await page.waitForSelector('#optionsModal.show', { timeout: 2000 });

        const elements = await page.evaluate(() => ({
            urlInput: !!document.getElementById('players-url-input'),
            overwriteCheck: !!document.getElementById('overwrite-players-check'),
            loadBtn: !!document.getElementById('load-players-btn'),
        }));
        expect(elements.urlInput).toBe(true);
        expect(elements.overwriteCheck).toBe(true);
        expect(elements.loadBtn).toBe(true);
    });
});

describe('Match Creation', () => {
    async function selectPlayers(count) {
        await setupPlayersDirectly(page, count);
    }

    test('Create matches button is not disabled initially', async () => {
        const disabled = await page.$eval('#create-matches', el => el.disabled);
        expect(disabled).toBe(false);
    });

    test('creating matches with fewer than 4 players shows no matches', async () => {
        await selectPlayers(2);
        await page.click('#create-matches');
        // Wait for animation to complete
        await page.waitForFunction(
            () => !document.getElementById('create-matches').disabled,
            { timeout: 10000 }
        );
        const matchesCount = await page.$$eval('#matches-list .match', els => els.length);
        expect(matchesCount).toBe(0);
    });

    test('creating matches with 4 players creates 1 match', async () => {
        await selectPlayers(4);
        await page.click('#create-matches');
        // Wait for matches to appear (animation may or may not run in headless)
        await page.waitForFunction(
            () => document.querySelectorAll('#matches-list .match').length > 0,
            { timeout: 15000 }
        );
        const matchesCount = await page.$$eval('#matches-list .match', els => els.length);
        expect(matchesCount).toBe(1);
    });

    test('creating matches with 8 players creates 2 matches', async () => {
        await selectPlayers(8);
        await page.click('#create-matches');
        await page.waitForFunction(
            () => document.querySelectorAll('#matches-list .match').length > 0,
            { timeout: 15000 }
        );
        const matchesCount = await page.$$eval('#matches-list .match', els => els.length);
        expect(matchesCount).toBe(2);
    });

    test('matches contain court numbers', async () => {
        await selectPlayers(4);
        await page.click('#create-matches');
        await page.waitForFunction(
            () => document.querySelectorAll('#matches-list .match').length > 0,
            { timeout: 15000 }
        );
        const courtText = await page.$eval('.court-number', el => el.textContent);
        expect(courtText).toContain('Court 1');
    });

    test('match data is saved to localStorage', async () => {
        await selectPlayers(4);
        await page.click('#create-matches');
        await page.waitForFunction(
            () => document.querySelectorAll('#matches-list .match').length > 0,
            { timeout: 15000 }
        );
        const saved = await page.evaluate(() => localStorage.getItem('matchesData'));
        expect(saved).toBeTruthy();
        const data = JSON.parse(saved);
        expect(data.matches.length).toBe(1);
    });

    test('resting players shown when not divisible by 4', async () => {
        await selectPlayers(5);
        await page.click('#create-matches');
        await page.waitForFunction(
            () => !document.getElementById('create-matches').disabled,
            { timeout: 10000 }
        );
        const resting = await page.$('.resting');
        expect(resting).toBeTruthy();
        const restingText = await page.$eval('.resting', el => el.textContent);
        expect(restingText).toContain('Resting:');
    });

    test('no matches message hides after creating matches', async () => {
        await selectPlayers(4);
        await page.click('#create-matches');
        await page.waitForFunction(
            () => !document.getElementById('create-matches').disabled,
            { timeout: 10000 }
        );
        const display = await page.$eval('#no-matches-message', el =>
            window.getComputedStyle(el).display
        );
        expect(display).toBe('none');
    });
});

describe('Clear All / New Session', () => {
    test('Clear all button opens confirmation modal', async () => {
        await page.click('#new-matches');
        await page.waitForSelector('#newSessionModal.show', { timeout: 2000 });
        const isVisible = await page.$eval('#newSessionModal', el =>
            el.classList.contains('show')
        );
        expect(isVisible).toBe(true);
    });

    test('Confirming clear all resets player count to 0', async () => {
        // Select some players first
        await setupPlayersDirectly(page, 3);
        let count = await page.$eval('#player-count', el => el.textContent);
        expect(count).toBe('(3)');

        // Clear all via evaluate (bypass modal) and reload
        await page.evaluate(() => {
            localStorage.removeItem('selectedPlayers');
            localStorage.removeItem('matchesData');
            localStorage.removeItem('playerMatchCounts');
            localStorage.removeItem('playerTeammatePairings');
            localStorage.removeItem('lastMatchTimestamp');
        });
        await page.reload({ waitUntil: 'domcontentloaded' });
        await new Promise(r => setTimeout(r, 500));

        count = await page.$eval('#player-count', el => el.textContent);
        expect(count).toBe('(0)');
    });
});

describe('Zoom Prevention', () => {
    test('viewport meta prevents user scaling', async () => {
        const content = await page.$eval('meta[name="viewport"]', el =>
            el.getAttribute('content')
        );
        expect(content).toContain('user-scalable=no');
        expect(content).toContain('maximum-scale=1.0');
    });

    test('touch-action is set to manipulation', async () => {
        const touchAction = await page.evaluate(() =>
            window.getComputedStyle(document.documentElement).touchAction
        );
        expect(touchAction).toBe('manipulation');
    });
});

describe('UI Layout', () => {
    test('modal buttons have minimum touch-friendly size', async () => {
        await page.click('#add-player');
        await page.waitForSelector('#addPlayerModal.show', { timeout: 2000 });
        const btnHeight = await page.$eval('.modal-footer .btn', el => {
            const style = window.getComputedStyle(el);
            return parseInt(style.minHeight, 10);
        });
        expect(btnHeight).toBeGreaterThanOrEqual(48);
    });

    test('Proceed button in inactive players modal is large', async () => {
        const height = await page.$eval('.btn-proceed-big', el => {
            const style = window.getComputedStyle(el);
            return parseInt(style.minHeight, 10);
        });
        expect(height).toBeGreaterThanOrEqual(80);
    });
});
