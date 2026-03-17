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

// Scoring weights for the matchmaking algorithm
const SCORING_WEIGHTS = {
    SKILL_GAP: 100,        // Team skill balance (quadratic) — most important
    TEAMMATE_REPEAT: 50,   // Avoid same teammates — very important
    TEAMMATE_SKILL_GAP: 10 // Similar-skill teammates — nice to have
};

/**
 * Score a single court assignment (lower = better).
 * Considers: team balance, teammate variety, and teammate skill similarity.
 */
function scoreCourtAssignment(teamOne, teamTwo, teammatePairings, skillRatings) {
    const getTeammateCount = (a, b) =>
        (teammatePairings[a] && teammatePairings[a][b]) || 0;
    const getSkill = (p) => skillRatings[p] || 3;

    // 1. Skill gap between teams (quadratic to heavily penalize big gaps)
    const teamOneSkill = getSkill(teamOne[0]) + getSkill(teamOne[1]);
    const teamTwoSkill = getSkill(teamTwo[0]) + getSkill(teamTwo[1]);
    const skillGap = Math.abs(teamOneSkill - teamTwoSkill);
    const skillGapScore = skillGap * skillGap * SCORING_WEIGHTS.SKILL_GAP;

    // 2. Repeated teammate penalty
    const repeatScore = (
        getTeammateCount(teamOne[0], teamOne[1]) +
        getTeammateCount(teamTwo[0], teamTwo[1])
    ) * SCORING_WEIGHTS.TEAMMATE_REPEAT;

    // 3. Teammate skill similarity (prefer similar-skill teammates)
    const teammateSkillGapScore = (
        Math.abs(getSkill(teamOne[0]) - getSkill(teamOne[1])) +
        Math.abs(getSkill(teamTwo[0]) - getSkill(teamTwo[1]))
    ) * SCORING_WEIGHTS.TEAMMATE_SKILL_GAP;

    return skillGapScore + repeatScore + teammateSkillGapScore;
}

/**
 * Score an entire assignment of all courts (lower = better).
 */
function scoreTotalAssignment(courts, teammatePairings, skillRatings) {
    return courts.reduce((total, court) =>
        total + scoreCourtAssignment(court.teamOne, court.teamTwo, teammatePairings, skillRatings), 0);
}

/**
 * Find the best team split for a group of 4 players.
 */
function findBestSplit(group, teammatePairings, skillRatings) {
    const splits = [
        { teamOne: [group[0], group[1]], teamTwo: [group[2], group[3]] },
        { teamOne: [group[0], group[2]], teamTwo: [group[1], group[3]] },
        { teamOne: [group[0], group[3]], teamTwo: [group[1], group[2]] },
    ];
    let bestSplit = splits[0];
    let bestScore = Infinity;
    splits.forEach(split => {
        const score = scoreCourtAssignment(split.teamOne, split.teamTwo, teammatePairings, skillRatings);
        if (score < bestScore) {
            bestScore = score;
            bestSplit = split;
        }
    });
    return bestSplit;
}

/**
 * Generate match pairings using global optimization.
 * Uses iterative hill climbing: starts with initial assignment,
 * then improves by swapping players between courts and re-splitting teams.
 *
 * Returns { matches: [...], restingPlayers: [...] }
 */
function generateMatches(activePlayers, matchCounts, teammatePairings, skillRatings) {
    const skills = skillRatings || {};
    const sorted = sortPlayersByMatchCounts(activePlayers, matchCounts);

    // Players who can't fill a court rest (those with most matches)
    const numPlaying = Math.floor(sorted.length / 4) * 4;
    const playing = sorted.slice(0, numPlaying);
    const restingPlayers = sorted.slice(numPlaying);

    if (playing.length < 4) {
        return { matches: [], restingPlayers: sorted };
    }

    // Generate initial assignment: random groups with best splits
    shuffleArray(playing);
    let courts = [];
    for (let i = 0; i < playing.length; i += 4) {
        const group = playing.slice(i, i + 4);
        const split = findBestSplit(group, teammatePairings, skills);
        courts.push(split);
    }

    // Hill climbing: try to improve by swapping players between courts
    const MAX_ITERATIONS = 200;
    let bestScore = scoreTotalAssignment(courts, teammatePairings, skills);

    for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
        let improved = false;

        // Strategy 1: Try swapping one player between two different courts
        for (let c1 = 0; c1 < courts.length && !improved; c1++) {
            for (let c2 = c1 + 1; c2 < courts.length && !improved; c2++) {
                const players1 = [...courts[c1].teamOne, ...courts[c1].teamTwo];
                const players2 = [...courts[c2].teamOne, ...courts[c2].teamTwo];

                for (let p1 = 0; p1 < 4 && !improved; p1++) {
                    for (let p2 = 0; p2 < 4 && !improved; p2++) {
                        // Swap players between courts
                        const newPlayers1 = [...players1];
                        const newPlayers2 = [...players2];
                        [newPlayers1[p1], newPlayers2[p2]] = [newPlayers2[p2], newPlayers1[p1]];

                        // Find best splits for both new groups
                        const newSplit1 = findBestSplit(newPlayers1, teammatePairings, skills);
                        const newSplit2 = findBestSplit(newPlayers2, teammatePairings, skills);

                        // Calculate new total score
                        const newCourts = courts.map((c, i) => {
                            if (i === c1) return newSplit1;
                            if (i === c2) return newSplit2;
                            return c;
                        });
                        const newScore = scoreTotalAssignment(newCourts, teammatePairings, skills);

                        if (newScore < bestScore) {
                            courts = newCourts;
                            bestScore = newScore;
                            improved = true;
                        }
                    }
                }
            }
        }

        // Strategy 2: Re-split teams within each court
        for (let c = 0; c < courts.length; c++) {
            const group = [...courts[c].teamOne, ...courts[c].teamTwo];
            const newSplit = findBestSplit(group, teammatePairings, skills);
            const newCourts = courts.map((court, i) => i === c ? newSplit : court);
            const newScore = scoreTotalAssignment(newCourts, teammatePairings, skills);
            if (newScore < bestScore) {
                courts = newCourts;
                bestScore = newScore;
                improved = true;
            }
        }

        if (!improved) break; // No more improvements possible
    }

    // Convert to match format with court numbers
    const matches = courts.map((court, i) => ({
        court: i + 1,
        teamOne: court.teamOne,
        teamTwo: court.teamTwo
    }));

    return { matches, restingPlayers };
}

/**
 * Legacy wrapper — kept for backward compatibility with existing tests.
 */
function findBestPairing(group, teammatePairings, skillRatings) {
    return findBestSplit(group, teammatePairings, skillRatings);
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
 * Filter players with any sitout status for the warning popup.
 * Both sitout-1 and sitout-2 players are shown in the warning.
 * Fully inactive players are excluded silently (no warning needed).
 */
function filterSitoutPlayers(players) {
    return players
        .filter(p => p.sitout === 1 || p.sitout === 2)
        .map(p => p.playerName);
}

/**
 * Process sitout transitions and return active player names.
 * - sitout-2 → sitout-1 (excluded this round)
 * - sitout-1 → active (plays this round)
 * - inactive → excluded silently
 * Returns { activePlayers: string[], updatedPlayers: player[] }
 */
function processSitouts(players) {
    const activePlayers = [];
    const updatedPlayers = players.map(p => {
        const updated = { ...p };
        if (p.inactive) {
            return updated; // stays inactive, excluded
        } else if (p.sitout === 2) {
            updated.sitout = 1; // transition down, still excluded this round
            return updated;
        } else if (p.sitout === 1) {
            delete updated.sitout; // returning to active, plays this round
            activePlayers.push(p.playerName);
            return updated;
        } else {
            activePlayers.push(p.playerName); // normal active player
            return updated;
        }
    });
    return { activePlayers, updatedPlayers };
}

/**
 * Check if tracking data should be auto-reset based on inactivity.
 * Returns true if more than `thresholdMs` milliseconds have passed since the last match.
 */
function shouldAutoResetTracking(lastMatchTimestamp, now, thresholdMs) {
    if (!lastMatchTimestamp) return false;
    return (now - lastMatchTimestamp) >= thresholdMs;
}

const AUTO_RESET_THRESHOLD_MS = 6 * 60 * 60 * 1000; // 6 hours

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
        const skill = parts.length > 1 ? parseInt(parts[1].trim(), 10) : 3;
        if (name) {
            names.push(name);
            skills[name] = (skill >= 1 && skill <= 5) ? skill : 3;
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
    const skillA = skillRatings[playerA] || 3;
    const skillB = skillRatings[playerB] || 3;
    return Math.abs(skillA - skillB);
}

/**
 * Score a potential match based on skill balance between teams.
 * Lower score = better match. Considers both within-team and between-team balance.
 */
function scoreMatch(teamOne, teamTwo, skillRatings) {
    const teamOneSkill = (skillRatings[teamOne[0]] || 3) + (skillRatings[teamOne[1]] || 3);
    const teamTwoSkill = (skillRatings[teamTwo[0]] || 3) + (skillRatings[teamTwo[1]] || 3);
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
    findBestSplit,
    scoreCourtAssignment,
    scoreTotalAssignment,
    validatePlayerName,
    parsePlayerList,
    filterSitoutPlayers,
    processSitouts,
    shouldAutoResetTracking,
    AUTO_RESET_THRESHOLD_MS,
    getSkillGapPenalty,
    scoreMatch,
    SCORING_WEIGHTS
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = LogicExports;
}
if (typeof window !== 'undefined') {
    window.Logic = LogicExports;
}
