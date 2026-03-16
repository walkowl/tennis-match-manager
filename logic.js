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
 * Considers teammate history and skill ratings for balanced matches.
 * skillRatings is optional — if not provided, skill balancing is skipped.
 * Returns { matches: [...], restingPlayers: [...] }
 */
function generateMatches(activePlayers, matchCounts, teammatePairings, skillRatings) {
    const sorted = sortPlayersByMatchCounts(activePlayers, matchCounts);
    const matches = [];
    let restingPlayers = [];

    for (let i = 0; i < sorted.length; i += 4) {
        if (i + 3 < sorted.length) {
            const group = [sorted[i], sorted[i + 1], sorted[i + 2], sorted[i + 3]];
            const { teamOne, teamTwo } = findBestPairing(group, teammatePairings, skillRatings || {});
            matches.push({ court: Math.floor(i / 4) + 1, teamOne, teamTwo });
        } else {
            restingPlayers = sorted.slice(i);
            break;
        }
    }

    return { matches, restingPlayers };
}

/**
 * Find the best team pairing from a group of 4 players.
 * Evaluates all 3 possible team splits and picks the one with:
 *   1. Fewest repeated teammate pairings
 *   2. Best skill balance between teams (lowest gap)
 */
function findBestPairing(group, teammatePairings, skillRatings) {
    // All 3 possible ways to split 4 players into 2 teams of 2
    const splits = [
        { teamOne: [group[0], group[1]], teamTwo: [group[2], group[3]] },
        { teamOne: [group[0], group[2]], teamTwo: [group[1], group[3]] },
        { teamOne: [group[0], group[3]], teamTwo: [group[1], group[2]] },
    ];

    const getTeammateCount = (a, b) =>
        (teammatePairings[a] && teammatePairings[a][b]) || 0;

    let bestSplit = splits[0];
    let bestScore = Infinity;

    splits.forEach(split => {
        // Penalize repeated teammate pairings
        const repeatPenalty =
            getTeammateCount(split.teamOne[0], split.teamOne[1]) +
            getTeammateCount(split.teamTwo[0], split.teamTwo[1]);

        // Penalize skill imbalance between teams
        const skillGap = scoreMatch(split.teamOne, split.teamTwo, skillRatings);

        // Combined score: teammate repeats are weighted more heavily
        const score = (repeatPenalty * 10) + skillGap;

        if (score < bestScore) {
            bestScore = score;
            bestSplit = split;
        }
    });

    return bestSplit;
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
 * Filter players to find only those sitting out (not fully inactive).
 * Returns names of players with sitout status.
 */
function filterSitoutPlayers(players) {
    return players
        .filter(p => p.sitout === 1 || p.sitout === 2)
        .map(p => p.playerName);
}

/**
 * Parse a player list text (newline-separated) into an array of player objects.
 * Each line can be "Name" or "Name,skill" where skill is 1-5 (default 5).
 * Returns { names: string[], skills: { name: number } }
 */
function parsePlayerList(text) {
    const names = [];
    const skills = {};
    text.split('\n').map(line => line.trim()).filter(line => line).forEach(line => {
        const parts = line.split(',');
        const name = parts[0].trim();
        const skill = parts.length > 1 ? parseInt(parts[1].trim(), 10) : 5;
        if (name) {
            names.push(name);
            skills[name] = (skill >= 1 && skill <= 5) ? skill : 5;
        }
    });
    return { names, skills };
}

/**
 * Calculate a skill gap penalty between two players.
 * Higher gap = less likely to be paired as opponents.
 * Returns a value 0-4 representing how many times less often they should play together.
 */
function getSkillGapPenalty(playerA, playerB, skillRatings) {
    const skillA = skillRatings[playerA] || 5;
    const skillB = skillRatings[playerB] || 5;
    return Math.abs(skillA - skillB);
}

/**
 * Score a potential match based on skill balance between teams.
 * Lower score = better match. Considers both within-team and between-team balance.
 */
function scoreMatch(teamOne, teamTwo, skillRatings) {
    const teamOneSkill = (skillRatings[teamOne[0]] || 5) + (skillRatings[teamOne[1]] || 5);
    const teamTwoSkill = (skillRatings[teamTwo[0]] || 5) + (skillRatings[teamTwo[1]] || 5);
    return Math.abs(teamOneSkill - teamTwoSkill);
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
    findBestPairing,
    validatePlayerName,
    parsePlayerList,
    filterSitoutPlayers,
    getSkillGapPenalty,
    scoreMatch
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = LogicExports;
}
if (typeof window !== 'undefined') {
    window.Logic = LogicExports;
}
