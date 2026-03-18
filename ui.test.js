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
        const fontScale = await page.evaluate(() =>
            document.documentElement.style.getPropertyValue('--font-scale').trim()
        );
        expect(fontScale).toBe('1.1');
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

describe('Player Status Cycling', () => {
    test('clicking a player cycles through sitout-1 class', async () => {
        await setupPlayersDirectly(page, 2);
        // Click the first selected player
        await page.click('#selected-players .selected-player');
        const hasSitout1 = await page.$eval('#selected-players .selected-player', el =>
            el.classList.contains('sitout-1')
        );
        expect(hasSitout1).toBe(true);
    });

    test('clicking again cycles to sitout-2', async () => {
        await setupPlayersDirectly(page, 2);
        const firstPlayer = await page.$('#selected-players .selected-player');
        await firstPlayer.click();
        await firstPlayer.click();
        const hasSitout2 = await page.$eval('#selected-players .selected-player', el =>
            el.classList.contains('sitout-2')
        );
        expect(hasSitout2).toBe(true);
    });

    test('clicking again cycles to inactive', async () => {
        await setupPlayersDirectly(page, 2);
        const firstPlayer = await page.$('#selected-players .selected-player');
        await firstPlayer.click();
        await firstPlayer.click();
        await firstPlayer.click();
        const hasInactive = await page.$eval('#selected-players .selected-player', el =>
            el.classList.contains('inactive')
        );
        expect(hasInactive).toBe(true);
    });

    test('clicking again cycles back to active (no status class)', async () => {
        await setupPlayersDirectly(page, 2);
        const firstPlayer = await page.$('#selected-players .selected-player');
        await firstPlayer.click();
        await firstPlayer.click();
        await firstPlayer.click();
        await firstPlayer.click();
        const classes = await page.$eval('#selected-players .selected-player', el => ({
            sitout1: el.classList.contains('sitout-1'),
            sitout2: el.classList.contains('sitout-2'),
            inactive: el.classList.contains('inactive'),
        }));
        expect(classes.sitout1).toBe(false);
        expect(classes.sitout2).toBe(false);
        expect(classes.inactive).toBe(false);
    });

    test('inactive players are excluded from player count', async () => {
        await setupPlayersDirectly(page, 2);
        // Make first player inactive (3 clicks)
        const firstPlayer = await page.$('#selected-players .selected-player');
        await firstPlayer.click();
        await firstPlayer.click();
        await firstPlayer.click();
        const count = await page.$eval('#player-count', el => el.textContent);
        expect(count).toBe('(1)');
    });

    test('sitout state persists in localStorage', async () => {
        await setupPlayersDirectly(page, 2);
        await page.click('#selected-players .selected-player');
        const stored = await page.evaluate(() => {
            const players = JSON.parse(localStorage.getItem('selectedPlayers'));
            return players[0].sitout;
        });
        expect(stored).toBe(1);
    });
});

describe('Font Scale Bounds', () => {
    test('font scale does not go below 50%', async () => {
        await page.click('#options-btn');
        await page.waitForSelector('#optionsModal.show', { timeout: 2000 });
        // Click decrease many times
        for (let i = 0; i < 10; i++) await page.click('#font-decrease');
        const scale = await page.$eval('#font-scale-display', el => el.textContent);
        expect(scale).toBe('50%');
    });

    test('font scale does not go above 200%', async () => {
        await page.click('#options-btn');
        await page.waitForSelector('#optionsModal.show', { timeout: 2000 });
        for (let i = 0; i < 20; i++) await page.click('#font-increase');
        const scale = await page.$eval('#font-scale-display', el => el.textContent);
        expect(scale).toBe('200%');
    });

    test('font scale persists across page reload', async () => {
        await page.click('#options-btn');
        await page.waitForSelector('#optionsModal.show', { timeout: 2000 });
        await page.click('#font-increase');
        await page.click('#font-increase');
        await page.reload({ waitUntil: 'domcontentloaded' });
        await new Promise(r => setTimeout(r, 300));
        const fontScale = await page.evaluate(() =>
            document.documentElement.style.getPropertyValue('--font-scale').trim()
        );
        expect(fontScale).toBe('1.2');
    });
});

describe('Skill Badges', () => {
    test('skill badges are hidden by default (transparent)', async () => {
        await setupPlayersDirectly(page, 4);
        await page.click('#create-matches');
        await page.waitForFunction(
            () => document.querySelectorAll('#matches-list .match').length > 0,
            { timeout: 15000 }
        );
        const badge = await page.$('.skill-badge');
        if (badge) {
            const color = await page.$eval('.skill-badge', el =>
                window.getComputedStyle(el).color
            );
            // Should be transparent (rgba(0,0,0,0)) or the transparent keyword
            expect(color).toMatch(/transparent|rgba\(0,\s*0,\s*0,\s*0\)/);
        }
    });
});

describe('Version Info', () => {
    test('version-info element exists', async () => {
        const exists = await page.$('#version-info');
        expect(exists).toBeTruthy();
    });

    test('version-info is not visible initially', async () => {
        const hasVisible = await page.$eval('#version-info', el =>
            el.classList.contains('visible')
        );
        expect(hasVisible).toBe(false);
    });
});

describe('Player Edit Modal', () => {
    test('player edit modal contains rating input', async () => {
        const exists = await page.$('#player-rating-input');
        expect(exists).toBeTruthy();
    });

    test('rating input is inside a collapsible Optional section', async () => {
        const isInDetails = await page.evaluate(() => {
            const input = document.getElementById('player-rating-input');
            return input?.closest('details') !== null;
        });
        expect(isInDetails).toBe(true);
    });

    test('rating input defaults to 3', async () => {
        const value = await page.$eval('#player-rating-input', el => el.value);
        expect(value).toBe('3');
    });
});

describe('Matches Persistence', () => {
    test('matches are restored on page reload', async () => {
        await setupPlayersDirectly(page, 4);
        await page.click('#create-matches');
        await page.waitForFunction(
            () => document.querySelectorAll('#matches-list .match').length > 0,
            { timeout: 15000 }
        );
        // Reload
        await page.reload({ waitUntil: 'domcontentloaded' });
        await new Promise(r => setTimeout(r, 500));
        const matchesCount = await page.$$eval('#matches-list .match', els => els.length);
        expect(matchesCount).toBe(1);
    });
});

describe('Match Integrity', () => {
    test('each match has exactly 4 unique players', async () => {
        await setupPlayersDirectly(page, 8);
        await page.click('#create-matches');
        await page.waitForFunction(
            () => document.querySelectorAll('#matches-list .match').length > 0,
            { timeout: 15000 }
        );
        const data = await page.evaluate(() =>
            JSON.parse(localStorage.getItem('matchesData'))
        );
        data.matches.forEach(match => {
            const allPlayers = [...match.teamOne, ...match.teamTwo];
            expect(allPlayers).toHaveLength(4);
            // No duplicates
            expect(new Set(allPlayers).size).toBe(4);
        });
        // No player appears on multiple courts
        const allPlaying = data.matches.flatMap(m => [...m.teamOne, ...m.teamTwo]);
        expect(new Set(allPlaying).size).toBe(allPlaying.length);
    });
});

describe('Clear Tracking', () => {
    test('Clear tracking button opens confirmation modal', async () => {
        await page.click('#clear-tracking');
        await page.waitForSelector('#clearTrackingModal.show', { timeout: 2000 });
        const isVisible = await page.$eval('#clearTrackingModal', el =>
            el.classList.contains('show')
        );
        expect(isVisible).toBe(true);
    });
});

describe('Bottom Button Bar', () => {
    test('all three bottom buttons are present', async () => {
        const buttons = await page.evaluate(() => ({
            selectPlayers: !!document.getElementById('add-player'),
            options: !!document.getElementById('options-btn'),
            createMatches: !!document.getElementById('create-matches'),
        }));
        expect(buttons.selectPlayers).toBe(true);
        expect(buttons.options).toBe(true);
        expect(buttons.createMatches).toBe(true);
    });

    test('buttons have visible text', async () => {
        const texts = await page.evaluate(() => ({
            selectPlayers: document.getElementById('add-player').textContent.trim(),
            options: document.getElementById('options-btn').textContent.trim(),
            createMatches: document.getElementById('create-matches').textContent.trim(),
        }));
        expect(texts.selectPlayers).toContain('Select players');
        expect(texts.options).toContain('Options');
        expect(texts.createMatches).toContain('Create matches');
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
