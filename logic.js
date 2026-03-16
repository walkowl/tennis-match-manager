/**
 * Tennis Match Manager - Pure Logic Module
 * 
 * Extracted pure functions that can be tested independently of the DOM.
 */

function initializePlayerTracking(players, matchCounts, teammatePairings) {
    players.forEach(player => {
        matchCounts[player] = 0;
        teammatePairings[player] = {};
    });
}

function updateMatchTracking(matches, matchCounts, teammatePairings) {
    matches.forEach(match => {
        match.teamOne.forEach(player => {
            matchCounts[player] = (matchCounts[player] || 0) + 1;
            if (!teammatePairings[player]) teammatePairings[player] = {};
            match.teamOne.forEach(teammate => {
                if (player !== teammate) {
                    teammatePairings[player][teammate] = (teammatePairings[player][teammate] || 0) + 1;
                }
            });
        });
        match.teamTwo.forEach(player => {
            matchCounts[player] = (matchCounts[player] || 0) + 1;
            if (!teammatePairings[player]) teammatePairings[player] = {};
            match.teamTwo.forEach(teammate => {
                if (player !== teammate) {
                    teammatePairings[player][teammate] = (teammatePairings[player][teammate] || 0) + 1;
                }
            });
        });
    });
}

function sortPlayersByMatchCounts(players, matchCounts) {
    return [...players].sort((a, b) => {
        return (matchCounts[a] || 0) - (matchCounts[b] || 0);
    });
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function formatPlayerName(playerName) {
    let names = playerName.split(' ');
    if (names.length > 1) {
        let firstName = names[0].toUpperCase();
        let surname = names.slice(1).join(' ');
        return `${firstName} ${surname}`;
    } else {
        return playerName.toUpperCase();
    }
}

function compareArrays(array1, array2) {
    return JSON.stringify(array1) === JSON.stringify(array2);
}

/**
 * Calculate the average match count of existing players (those with > 0 matches).
 * Returns 0 if no players have played yet.
 */
function calculateAverageMatchCount(matchCounts) {
    const existingCounts = Object.values(matchCounts).filter(c => c > 0);
    if (existingCounts.length === 0) return 0;
    return Math.round(existingCounts.reduce((sum, c) => sum + c, 0) / existingCounts.length);
}

/**
 * Initialize new mid-session players with the average match count
 * so they don't dominate the queue.
 */
function initializeNewPlayers(players, matchCounts, teammatePairings) {
    const avgMatchCount = calculateAverageMatchCount(matchCounts);
    players.forEach(player => {
        if (!(player in matchCounts)) {
            matchCounts[player] = avgMatchCount;
        }
        if (!(player in teammatePairings)) {
            teammatePairings[player] = {};
        }
    });
}

/**
 * Generate match pairings from a list of active players.
 * Returns { matches: [...], restingPlayers: [...] }
 */
function generateMatches(activePlayers, matchCounts, teammatePairings) {
    const sorted = sortPlayersByMatchCounts(activePlayers, matchCounts);
    const matches = [];
    let restingPlayers = [];

    for (let i = 0; i < sorted.length; i += 4) {
        if (i + 3 < sorted.length) {
            let teamOne = [sorted[i], sorted[i + 1]];
            let teamTwo = [sorted[i + 2], sorted[i + 3]];

            const getTeammateCount = (a, b) =>
                (teammatePairings[a] && teammatePairings[a][b]) || 0;

            if (getTeammateCount(teamOne[0], teamOne[1]) > 0 || getTeammateCount(teamTwo[0], teamTwo[1]) > 0) {
                [teamOne[1], teamTwo[0]] = [teamTwo[0], teamOne[1]];
                if (getTeammateCount(teamOne[0], teamOne[1]) > 0 || getTeammateCount(teamTwo[0], teamTwo[1]) > 0) {
                    [teamOne[1], teamTwo[1]] = [teamTwo[1], teamOne[1]];
                }
            }

            matches.push({ court: Math.floor(i / 4) + 1, teamOne, teamTwo });
        } else {
            restingPlayers = sorted.slice(i);
            break;
        }
    }

    return { matches, restingPlayers };
}

/**
 * Validate a player name for saving.
 * Returns { valid: true } or { valid: false, reason: '...' }
 */
function validatePlayerName(playerName, existingPlayers, editingIndex) {
    const trimmed = (playerName || '').trim();
    if (!trimmed) {
        return { valid: false, reason: 'Player name cannot be empty.' };
    }
    const isDuplicate = existingPlayers.some((p, i) =>
        p.toLowerCase() === trimmed.toLowerCase() && String(i) !== String(editingIndex)
    );
    if (isDuplicate) {
        return { valid: false, reason: 'A player with this name already exists.' };
    }
    return { valid: true };
}

/**
 * Parse a player list text (newline-separated) into an array of names.
 */
function parsePlayerList(text) {
    return text.split('\n').map(player => player.trim()).filter(player => player);
}

// Export for browser (global) and Node.js (Jest)
const LogicExports = {
    initializePlayerTracking,
    updateMatchTracking,
    sortPlayersByMatchCounts,
    shuffleArray,
    formatPlayerName,
    compareArrays,
    calculateAverageMatchCount,
    initializeNewPlayers,
    generateMatches,
    validatePlayerName,
    parsePlayerList
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = LogicExports;
}
if (typeof window !== 'undefined') {
    window.Logic = LogicExports;
}
