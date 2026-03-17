const Logic = require('./logic');

describe('initializePlayerTracking', () => {
    test('initializes all players with zero counts and empty pairings', () => {
        const counts = {};
        const pairings = {};
        Logic.initializePlayerTracking(['Alice', 'Bob', 'Charlie'], counts, pairings);
        expect(counts).toEqual({ Alice: 0, Bob: 0, Charlie: 0 });
        expect(pairings).toEqual({ Alice: {}, Bob: {}, Charlie: {} });
    });

    test('handles empty player list', () => {
        const counts = {};
        const pairings = {};
        Logic.initializePlayerTracking([], counts, pairings);
        expect(counts).toEqual({});
        expect(pairings).toEqual({});
    });

    test('overwrites existing data for same players', () => {
        const counts = { Alice: 5 };
        const pairings = { Alice: { Bob: 3 } };
        Logic.initializePlayerTracking(['Alice'], counts, pairings);
        expect(counts.Alice).toBe(0);
        expect(pairings.Alice).toEqual({});
    });
});

describe('updateMatchTracking', () => {
    test('increments match counts for all players in a match', () => {
        const counts = {};
        const pairings = {};
        const matches = [
            { court: 1, teamOne: ['Alice', 'Bob'], teamTwo: ['Charlie', 'Dave'] }
        ];
        Logic.updateMatchTracking(matches, counts, pairings);
        expect(counts.Alice).toBe(1);
        expect(counts.Bob).toBe(1);
        expect(counts.Charlie).toBe(1);
        expect(counts.Dave).toBe(1);
    });

    test('tracks teammate pairings correctly (not opponents)', () => {
        const counts = {};
        const pairings = {};
        const matches = [
            { court: 1, teamOne: ['Alice', 'Bob'], teamTwo: ['Charlie', 'Dave'] }
        ];
        Logic.updateMatchTracking(matches, counts, pairings);
        // Alice and Bob were teammates
        expect(pairings.Alice.Bob).toBe(1);
        expect(pairings.Bob.Alice).toBe(1);
        // Charlie and Dave were teammates
        expect(pairings.Charlie.Dave).toBe(1);
        expect(pairings.Dave.Charlie).toBe(1);
        // Opponents should NOT be tracked
        expect(pairings.Alice.Charlie).toBeUndefined();
        expect(pairings.Alice.Dave).toBeUndefined();
        expect(pairings.Bob.Charlie).toBeUndefined();
        expect(pairings.Charlie.Alice).toBeUndefined();
    });

    test('accumulates counts across multiple matches', () => {
        const counts = {};
        const pairings = {};
        const matches = [
            { court: 1, teamOne: ['Alice', 'Bob'], teamTwo: ['Charlie', 'Dave'] },
            { court: 1, teamOne: ['Alice', 'Bob'], teamTwo: ['Eve', 'Frank'] }
        ];
        Logic.updateMatchTracking(matches, counts, pairings);
        expect(counts.Alice).toBe(2);
        expect(counts.Bob).toBe(2);
        expect(pairings.Alice.Bob).toBe(2);
    });

    test('handles multiple courts', () => {
        const counts = {};
        const pairings = {};
        const matches = [
            { court: 1, teamOne: ['A', 'B'], teamTwo: ['C', 'D'] },
            { court: 2, teamOne: ['E', 'F'], teamTwo: ['G', 'H'] }
        ];
        Logic.updateMatchTracking(matches, counts, pairings);
        expect(Object.keys(counts)).toHaveLength(8);
        expect(pairings.A.B).toBe(1);
        expect(pairings.E.F).toBe(1);
        // No cross-court pairings
        expect(pairings.A.E).toBeUndefined();
    });
});

describe('sortPlayersByMatchCounts', () => {
    test('sorts players by ascending match count', () => {
        const counts = { Alice: 3, Bob: 1, Charlie: 2 };
        const result = Logic.sortPlayersByMatchCounts(['Alice', 'Bob', 'Charlie'], counts);
        expect(result).toEqual(['Bob', 'Charlie', 'Alice']);
    });

    test('preserves relative order for equal counts', () => {
        const counts = { Alice: 1, Bob: 1, Charlie: 1 };
        const result = Logic.sortPlayersByMatchCounts(['Alice', 'Bob', 'Charlie'], counts);
        expect(result).toEqual(['Alice', 'Bob', 'Charlie']);
    });

    test('treats missing counts as 0', () => {
        const counts = { Alice: 2 };
        const result = Logic.sortPlayersByMatchCounts(['Alice', 'Bob'], counts);
        expect(result).toEqual(['Bob', 'Alice']);
    });

    test('does not mutate original array', () => {
        const counts = { Alice: 2, Bob: 1 };
        const original = ['Alice', 'Bob'];
        Logic.sortPlayersByMatchCounts(original, counts);
        expect(original).toEqual(['Alice', 'Bob']);
    });
});

describe('shuffleArray', () => {
    test('preserves all elements', () => {
        const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        const copy = [...arr];
        Logic.shuffleArray(arr);
        expect(arr.sort()).toEqual(copy.sort());
    });

    test('preserves array length', () => {
        const arr = [1, 2, 3, 4, 5];
        Logic.shuffleArray(arr);
        expect(arr).toHaveLength(5);
    });

    test('handles empty array', () => {
        const arr = [];
        Logic.shuffleArray(arr);
        expect(arr).toEqual([]);
    });

    test('handles single element', () => {
        const arr = [42];
        Logic.shuffleArray(arr);
        expect(arr).toEqual([42]);
    });
});

describe('formatPlayerName', () => {
    test('uppercases first name and keeps surname as-is', () => {
        expect(Logic.formatPlayerName('John Smith')).toBe('JOHN Smith');
    });

    test('handles single name by uppercasing entirely', () => {
        expect(Logic.formatPlayerName('Madonna')).toBe('MADONNA');
    });

    test('handles multiple surnames', () => {
        expect(Logic.formatPlayerName('John van der Berg')).toBe('JOHN van der Berg');
    });

    test('handles already uppercased name', () => {
        expect(Logic.formatPlayerName('ALICE BOB')).toBe('ALICE BOB');
    });
});

describe('compareArrays', () => {
    test('returns true for identical arrays', () => {
        expect(Logic.compareArrays([1, 2, 3], [1, 2, 3])).toBe(true);
    });

    test('returns false for different arrays', () => {
        expect(Logic.compareArrays([1, 2, 3], [1, 2, 4])).toBe(false);
    });

    test('returns false for different lengths', () => {
        expect(Logic.compareArrays([1, 2], [1, 2, 3])).toBe(false);
    });

    test('returns true for empty arrays', () => {
        expect(Logic.compareArrays([], [])).toBe(true);
    });

    test('returns true for string arrays', () => {
        expect(Logic.compareArrays(['a', 'b'], ['a', 'b'])).toBe(true);
    });

    test('is order-sensitive', () => {
        expect(Logic.compareArrays([1, 2], [2, 1])).toBe(false);
    });

    test('handles null comparison via JSON', () => {
        expect(Logic.compareArrays(null, null)).toBe(true);
    });
});

describe('calculateAverageMatchCount', () => {
    test('returns average of positive counts', () => {
        expect(Logic.calculateAverageMatchCount({ A: 2, B: 4, C: 6 })).toBe(4);
    });

    test('ignores zero counts', () => {
        expect(Logic.calculateAverageMatchCount({ A: 0, B: 4, C: 6 })).toBe(5);
    });

    test('returns 0 for all-zero counts', () => {
        expect(Logic.calculateAverageMatchCount({ A: 0, B: 0 })).toBe(0);
    });

    test('returns 0 for empty object', () => {
        expect(Logic.calculateAverageMatchCount({})).toBe(0);
    });

    test('rounds to nearest integer', () => {
        expect(Logic.calculateAverageMatchCount({ A: 3, B: 4 })).toBe(4); // 3.5 rounds to 4
    });
});

describe('initializeNewPlayers', () => {
    test('new players get average match count', () => {
        const counts = { Alice: 4, Bob: 6 };
        const pairings = { Alice: {}, Bob: {} };
        Logic.initializeNewPlayers(['Alice', 'Bob', 'Charlie'], counts, pairings);
        expect(counts.Charlie).toBe(5); // average of 4 and 6
        expect(pairings.Charlie).toEqual({});
    });

    test('does not overwrite existing player counts', () => {
        const counts = { Alice: 4, Bob: 6 };
        const pairings = { Alice: { Bob: 2 }, Bob: { Alice: 2 } };
        Logic.initializeNewPlayers(['Alice', 'Bob'], counts, pairings);
        expect(counts.Alice).toBe(4);
        expect(counts.Bob).toBe(6);
        expect(pairings.Alice.Bob).toBe(2);
    });

    test('new players get 0 when no one has played', () => {
        const counts = {};
        const pairings = {};
        Logic.initializeNewPlayers(['Alice', 'Bob'], counts, pairings);
        expect(counts.Alice).toBe(0);
        expect(counts.Bob).toBe(0);
    });

    test('new players get 0 when existing players all have 0', () => {
        const counts = { Alice: 0, Bob: 0 };
        const pairings = { Alice: {}, Bob: {} };
        Logic.initializeNewPlayers(['Alice', 'Bob', 'Charlie'], counts, pairings);
        expect(counts.Charlie).toBe(0);
    });
});

describe('generateMatches', () => {
    test('creates correct number of matches for 8 players', () => {
        const counts = {};
        const pairings = {};
        const players = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        Logic.initializePlayerTracking(players, counts, pairings);
        const { matches, restingPlayers } = Logic.generateMatches(players, counts, pairings);
        expect(matches).toHaveLength(2);
        expect(restingPlayers).toHaveLength(0);
    });

    test('puts remaining players in resting for non-multiple-of-4', () => {
        const counts = {};
        const pairings = {};
        const players = ['A', 'B', 'C', 'D', 'E', 'F'];
        Logic.initializePlayerTracking(players, counts, pairings);
        const { matches, restingPlayers } = Logic.generateMatches(players, counts, pairings);
        expect(matches).toHaveLength(1);
        expect(restingPlayers).toHaveLength(2);
    });

    test('assigns court numbers starting from 1', () => {
        const counts = {};
        const pairings = {};
        const players = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        Logic.initializePlayerTracking(players, counts, pairings);
        const { matches } = Logic.generateMatches(players, counts, pairings);
        expect(matches[0].court).toBe(1);
        expect(matches[1].court).toBe(2);
    });

    test('each match has two teams of two', () => {
        const counts = {};
        const pairings = {};
        const players = ['A', 'B', 'C', 'D'];
        Logic.initializePlayerTracking(players, counts, pairings);
        const { matches } = Logic.generateMatches(players, counts, pairings);
        expect(matches[0].teamOne).toHaveLength(2);
        expect(matches[0].teamTwo).toHaveLength(2);
    });

    test('all players appear exactly once across matches and resting', () => {
        const counts = {};
        const pairings = {};
        const players = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
        Logic.initializePlayerTracking(players, counts, pairings);
        const { matches, restingPlayers } = Logic.generateMatches(players, counts, pairings);
        const allAssigned = [
            ...matches.flatMap(m => [...m.teamOne, ...m.teamTwo]),
            ...restingPlayers
        ];
        expect(allAssigned.sort()).toEqual(players.sort());
    });

    test('avoids repeat teammate pairings when possible', () => {
        const counts = { A: 1, B: 1, C: 1, D: 1 };
        const pairings = { A: { B: 1 }, B: { A: 1 }, C: {}, D: {} };
        // A and B have been teammates before, algorithm should try to separate them
        const { matches } = Logic.generateMatches(['A', 'B', 'C', 'D'], counts, pairings);
        const match = matches[0];
        // A and B should not be on the same team
        const aTeam = match.teamOne.includes('A') ? match.teamOne : match.teamTwo;
        expect(aTeam).not.toContain('B');
    });

    test('handles fewer than 4 players (all rest)', () => {
        const counts = {};
        const pairings = {};
        const players = ['A', 'B', 'C'];
        Logic.initializePlayerTracking(players, counts, pairings);
        const { matches, restingPlayers } = Logic.generateMatches(players, counts, pairings);
        expect(matches).toHaveLength(0);
        expect(restingPlayers).toHaveLength(3);
    });

    test('handles exactly 4 players', () => {
        const counts = {};
        const pairings = {};
        const players = ['A', 'B', 'C', 'D'];
        Logic.initializePlayerTracking(players, counts, pairings);
        const { matches, restingPlayers } = Logic.generateMatches(players, counts, pairings);
        expect(matches).toHaveLength(1);
        expect(restingPlayers).toHaveLength(0);
    });

    test('handles empty player list', () => {
        const { matches, restingPlayers } = Logic.generateMatches([], {}, {});
        expect(matches).toHaveLength(0);
        expect(restingPlayers).toHaveLength(0);
    });

    test('prioritizes players with fewer matches', () => {
        const counts = { A: 0, B: 0, C: 0, D: 0, E: 5 };
        const pairings = { A: {}, B: {}, C: {}, D: {}, E: {} };
        const { matches, restingPlayers } = Logic.generateMatches(
            ['A', 'B', 'C', 'D', 'E'], counts, pairings
        );
        // E has the most matches, should be resting
        expect(restingPlayers).toContain('E');
    });
});

describe('validatePlayerName', () => {
    test('rejects empty name', () => {
        const result = Logic.validatePlayerName('', ['Alice'], '');
        expect(result.valid).toBe(false);
        expect(result.reason).toContain('empty');
    });

    test('rejects whitespace-only name', () => {
        const result = Logic.validatePlayerName('   ', ['Alice'], '');
        expect(result.valid).toBe(false);
        expect(result.reason).toContain('empty');
    });

    test('rejects null name', () => {
        const result = Logic.validatePlayerName(null, ['Alice'], '');
        expect(result.valid).toBe(false);
    });

    test('rejects duplicate name (case-insensitive)', () => {
        const result = Logic.validatePlayerName('alice', ['Alice', 'Bob'], '');
        expect(result.valid).toBe(false);
        expect(result.reason).toContain('already exists');
    });

    test('allows same name when editing that player', () => {
        const result = Logic.validatePlayerName('Alice', ['Alice', 'Bob'], '0');
        expect(result.valid).toBe(true);
    });

    test('rejects duplicate when editing a different player', () => {
        const result = Logic.validatePlayerName('Bob', ['Alice', 'Bob'], '0');
        expect(result.valid).toBe(false);
    });

    test('accepts valid unique name', () => {
        const result = Logic.validatePlayerName('Charlie', ['Alice', 'Bob'], '');
        expect(result.valid).toBe(true);
    });
});

describe('parsePlayerList', () => {
    test('splits by newlines and returns names and default skills', () => {
        const result = Logic.parsePlayerList('Alice\nBob\nCharlie');
        expect(result.names).toEqual(['Alice', 'Bob', 'Charlie']);
        expect(result.skills).toEqual({ Alice: 3, Bob: 3, Charlie: 3 });
    });

    test('parses skill ratings from comma-separated format', () => {
        const result = Logic.parsePlayerList('Alice,3\nBob,5\nCharlie,1');
        expect(result.names).toEqual(['Alice', 'Bob', 'Charlie']);
        expect(result.skills).toEqual({ Alice: 3, Bob: 5, Charlie: 1 });
    });

    test('defaults to skill 3 when no skill specified', () => {
        const result = Logic.parsePlayerList('Alice\nBob,2');
        expect(result.skills.Alice).toBe(3);
        expect(result.skills.Bob).toBe(2);
    });

    test('clamps invalid skill values to 3', () => {
        const result = Logic.parsePlayerList('Alice,0\nBob,6\nCharlie,-1');
        expect(result.skills.Alice).toBe(3);
        expect(result.skills.Bob).toBe(3);
        expect(result.skills.Charlie).toBe(3);
    });

    test('filters empty lines', () => {
        const result = Logic.parsePlayerList('Alice\n\nBob\n\n');
        expect(result.names).toEqual(['Alice', 'Bob']);
    });

    test('trims whitespace from names and skills', () => {
        const result = Logic.parsePlayerList('  Alice , 3 \n  Bob  ');
        expect(result.names).toEqual(['Alice', 'Bob']);
        expect(result.skills.Alice).toBe(3);
    });

    test('handles single player', () => {
        const result = Logic.parsePlayerList('Alice');
        expect(result.names).toEqual(['Alice']);
    });

    test('handles empty string', () => {
        const result = Logic.parsePlayerList('');
        expect(result.names).toEqual([]);
        expect(result.skills).toEqual({});
    });

    test('handles Windows-style line endings', () => {
        const result = Logic.parsePlayerList('Alice,3\r\nBob,4\r\nCharlie,5');
        expect(result.names).toEqual(['Alice', 'Bob', 'Charlie']);
        expect(result.skills).toEqual({ Alice: 3, Bob: 4, Charlie: 5 });
    });

    test('handles non-numeric skill values by defaulting to 3', () => {
        const result = Logic.parsePlayerList('Alice,abc');
        expect(result.skills.Alice).toBe(3);
    });
});

describe('filterSitoutPlayers', () => {
    test('returns both sitout-1 and sitout-2 players', () => {
        const players = [
            { playerName: 'Alice' },
            { playerName: 'Bob', sitout: 1 },
            { playerName: 'Charlie', inactive: true },
            { playerName: 'Dave', sitout: 2 },
        ];
        expect(Logic.filterSitoutPlayers(players)).toEqual(['Bob', 'Dave']);
    });

    test('includes sitout-1 players in warning', () => {
        const players = [
            { playerName: 'Alice', sitout: 1 },
            { playerName: 'Bob', sitout: 1 },
        ];
        expect(Logic.filterSitoutPlayers(players)).toEqual(['Alice', 'Bob']);
    });

    test('returns empty array when no one is sitting out', () => {
        const players = [
            { playerName: 'Alice' },
            { playerName: 'Bob', inactive: true },
        ];
        expect(Logic.filterSitoutPlayers(players)).toEqual([]);
    });

    test('returns empty array for all active players', () => {
        const players = [
            { playerName: 'Alice' },
            { playerName: 'Bob' },
        ];
        expect(Logic.filterSitoutPlayers(players)).toEqual([]);
    });

    test('does not include fully inactive players', () => {
        const players = [
            { playerName: 'Alice', inactive: true },
            { playerName: 'Bob', inactive: true },
        ];
        expect(Logic.filterSitoutPlayers(players)).toEqual([]);
    });

    test('handles empty player list', () => {
        expect(Logic.filterSitoutPlayers([])).toEqual([]);
    });

    test('handles mix of all statuses — both sitout levels warned', () => {
        const players = [
            { playerName: 'Active1' },
            { playerName: 'Sitout1', sitout: 1 },
            { playerName: 'Inactive1', inactive: true },
            { playerName: 'Active2' },
            { playerName: 'Sitout2', sitout: 2 },
            { playerName: 'Inactive2', inactive: true },
        ];
        expect(Logic.filterSitoutPlayers(players)).toEqual(['Sitout1', 'Sitout2']);
    });
});

describe('processSitouts', () => {
    test('sitout-1 players return to active and play this round', () => {
        const players = [
            { playerName: 'Alice', sitout: 1 },
            { playerName: 'Bob' },
        ];
        const { activePlayers, updatedPlayers } = Logic.processSitouts(players);
        expect(activePlayers).toContain('Alice');
        expect(activePlayers).toContain('Bob');
        expect(updatedPlayers.find(p => p.playerName === 'Alice').sitout).toBeUndefined();
    });

    test('sitout-2 players transition to sitout-1 and do NOT play', () => {
        const players = [
            { playerName: 'Alice', sitout: 2 },
            { playerName: 'Bob' },
        ];
        const { activePlayers, updatedPlayers } = Logic.processSitouts(players);
        expect(activePlayers).not.toContain('Alice');
        expect(activePlayers).toContain('Bob');
        expect(updatedPlayers.find(p => p.playerName === 'Alice').sitout).toBe(1);
    });

    test('inactive players stay excluded silently', () => {
        const players = [
            { playerName: 'Alice', inactive: true },
            { playerName: 'Bob' },
        ];
        const { activePlayers, updatedPlayers } = Logic.processSitouts(players);
        expect(activePlayers).not.toContain('Alice');
        expect(activePlayers).toContain('Bob');
        expect(updatedPlayers.find(p => p.playerName === 'Alice').inactive).toBe(true);
    });

    test('active players with no status play normally', () => {
        const players = [
            { playerName: 'Alice' },
            { playerName: 'Bob' },
        ];
        const { activePlayers } = Logic.processSitouts(players);
        expect(activePlayers).toEqual(['Alice', 'Bob']);
    });

    test('full lifecycle: sitout-2 → sitout-1 → active over two rounds', () => {
        const players = [
            { playerName: 'Alice', sitout: 2 },
            { playerName: 'Bob' },
        ];
        // Round 1: Alice sits out, transitions to sitout-1
        const round1 = Logic.processSitouts(players);
        expect(round1.activePlayers).not.toContain('Alice');
        expect(round1.updatedPlayers.find(p => p.playerName === 'Alice').sitout).toBe(1);

        // Round 2: Alice returns to active
        const round2 = Logic.processSitouts(round1.updatedPlayers);
        expect(round2.activePlayers).toContain('Alice');
        expect(round2.updatedPlayers.find(p => p.playerName === 'Alice').sitout).toBeUndefined();
    });

    test('handles empty player list', () => {
        const { activePlayers, updatedPlayers } = Logic.processSitouts([]);
        expect(activePlayers).toEqual([]);
        expect(updatedPlayers).toEqual([]);
    });

    test('does not mutate original player objects', () => {
        const original = { playerName: 'Alice', sitout: 1 };
        const players = [original];
        Logic.processSitouts(players);
        expect(original.sitout).toBe(1); // original unchanged
    });

    test('handles mix of all statuses correctly', () => {
        const players = [
            { playerName: 'Active' },
            { playerName: 'Returning', sitout: 1 },
            { playerName: 'SittingOut', sitout: 2 },
            { playerName: 'Gone', inactive: true },
        ];
        const { activePlayers, updatedPlayers } = Logic.processSitouts(players);
        expect(activePlayers).toEqual(['Active', 'Returning']);
        expect(updatedPlayers.find(p => p.playerName === 'SittingOut').sitout).toBe(1);
        expect(updatedPlayers.find(p => p.playerName === 'Returning').sitout).toBeUndefined();
        expect(updatedPlayers.find(p => p.playerName === 'Gone').inactive).toBe(true);
    });
});

describe('getSkillGapPenalty', () => {
    test('returns 0 for same skill level', () => {
        expect(Logic.getSkillGapPenalty('A', 'B', { A: 3, B: 3 })).toBe(0);
    });

    test('returns absolute difference for different skills', () => {
        expect(Logic.getSkillGapPenalty('A', 'B', { A: 5, B: 1 })).toBe(4);
        expect(Logic.getSkillGapPenalty('A', 'B', { A: 1, B: 5 })).toBe(4);
    });

    test('defaults to skill 3 for unknown players', () => {
        expect(Logic.getSkillGapPenalty('A', 'B', {})).toBe(0);
        expect(Logic.getSkillGapPenalty('A', 'B', { A: 2 })).toBe(1); // 3 - 2
    });
});

describe('scoreMatch', () => {
    test('returns 0 for perfectly balanced teams', () => {
        const skills = { A: 5, B: 1, C: 3, D: 3 };
        expect(Logic.scoreMatch(['A', 'B'], ['C', 'D'], skills)).toBe(0); // 6 vs 6
    });

    test('returns skill difference between teams', () => {
        const skills = { A: 5, B: 5, C: 1, D: 1 };
        expect(Logic.scoreMatch(['A', 'B'], ['C', 'D'], skills)).toBe(8); // 10 vs 2
    });

    test('defaults unknown players to skill 3', () => {
        expect(Logic.scoreMatch(['A', 'B'], ['C', 'D'], {})).toBe(0); // all default 3
    });
});

describe('scoreCourtAssignment', () => {
    test('returns 0 for perfectly balanced teams with no history', () => {
        const pairings = { A: {}, B: {}, C: {}, D: {} };
        const skills = { A: 3, B: 3, C: 3, D: 3 };
        expect(Logic.scoreCourtAssignment(['A', 'B'], ['C', 'D'], pairings, skills)).toBe(0);
    });

    test('penalizes skill imbalance quadratically', () => {
        const pairings = { A: {}, B: {}, C: {}, D: {} };
        const skills = { A: 5, B: 5, C: 1, D: 1 };
        // Gap = |10-2| = 8, score = 8*8*100 = 6400 (plus teammate skill gap)
        const score = Logic.scoreCourtAssignment(['A', 'B'], ['C', 'D'], pairings, skills);
        expect(score).toBeGreaterThan(6000);
    });

    test('penalizes repeated teammates', () => {
        const pairings = { A: { B: 3 }, B: { A: 3 }, C: {}, D: {} };
        const skills = { A: 3, B: 3, C: 3, D: 3 };
        // No skill gap, but 3 repeats on team one = 3 * 50 = 150
        const score = Logic.scoreCourtAssignment(['A', 'B'], ['C', 'D'], pairings, skills);
        expect(score).toBe(150);
    });

    test('penalizes skill gap within teammates', () => {
        const pairings = { A: {}, B: {}, C: {}, D: {} };
        const skills = { A: 5, B: 1, C: 4, D: 2 };
        // Teams [A(5),B(1)] vs [C(4),D(2)]: gap = |6-6| = 0
        // But within-team gaps: |5-1|=4 + |4-2|=2 = 6 * 10 = 60
        expect(Logic.scoreCourtAssignment(['A', 'B'], ['C', 'D'], pairings, skills)).toBe(60);
    });
});

describe('findBestSplit', () => {
    test('picks the most skill-balanced split with no history', () => {
        const pairings = { A: {}, B: {}, C: {}, D: {} };
        const skills = { A: 5, B: 1, C: 4, D: 2 };
        const result = Logic.findBestSplit(['A', 'B', 'C', 'D'], pairings, skills);
        const teamOneSkill = skills[result.teamOne[0]] + skills[result.teamOne[1]];
        const teamTwoSkill = skills[result.teamTwo[0]] + skills[result.teamTwo[1]];
        expect(Math.abs(teamOneSkill - teamTwoSkill)).toBeLessThanOrEqual(2);
    });

    test('avoids repeated teammates when skills are equal', () => {
        const pairings = { A: { B: 2 }, B: { A: 2 }, C: {}, D: {} };
        const skills = { A: 5, B: 5, C: 5, D: 5 };
        const result = Logic.findBestSplit(['A', 'B', 'C', 'D'], pairings, skills);
        const teamOneHasAB = result.teamOne.includes('A') && result.teamOne.includes('B');
        const teamTwoHasAB = result.teamTwo.includes('A') && result.teamTwo.includes('B');
        expect(teamOneHasAB || teamTwoHasAB).toBe(false);
    });

    test('prefers similar-skill teammates', () => {
        const pairings = { A: {}, B: {}, C: {}, D: {} };
        const skills = { A: 5, B: 5, C: 1, D: 1 };
        // [A(5)+B(5)] vs [C(1)+D(1)]: teammate gap=0+0=0, team gap=|10-2|=8
        // [A(5)+C(1)] vs [B(5)+D(1)]: teammate gap=4+4=8, team gap=|6-6|=0
        // [A(5)+D(1)] vs [B(5)+C(1)]: teammate gap=4+4=8, team gap=|6-6|=0
        // Score1: 8*8*100 + 0 = 6400
        // Score2: 0 + 80 = 80
        // Algorithm picks score2 (better team balance), trades teammate similarity
        const result = Logic.findBestSplit(['A', 'B', 'C', 'D'], pairings, skills);
        const teamOneSkill = skills[result.teamOne[0]] + skills[result.teamOne[1]];
        const teamTwoSkill = skills[result.teamTwo[0]] + skills[result.teamTwo[1]];
        expect(Math.abs(teamOneSkill - teamTwoSkill)).toBe(0);
    });
});

describe('generateMatches with global optimization', () => {
    test('balances skills across courts', () => {
        const counts = {};
        const pairings = {};
        const players = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        const skills = { A: 5, B: 5, C: 1, D: 1, E: 4, F: 2, G: 3, H: 3 };
        players.forEach(p => { counts[p] = 0; pairings[p] = {}; });
        const { matches } = Logic.generateMatches(players, counts, pairings, skills);
        // Each court should have reasonable skill balance
        matches.forEach(match => {
            const t1 = skills[match.teamOne[0]] + skills[match.teamOne[1]];
            const t2 = skills[match.teamTwo[0]] + skills[match.teamTwo[1]];
            expect(Math.abs(t1 - t2)).toBeLessThanOrEqual(2);
        });
    });

    test('swaps players between courts for better balance', () => {
        const counts = {};
        const pairings = {};
        // Extreme case: 4 strong + 4 weak players
        const players = ['S1', 'S2', 'S3', 'S4', 'W1', 'W2', 'W3', 'W4'];
        const skills = { S1: 5, S2: 5, S3: 5, S4: 5, W1: 1, W2: 1, W3: 1, W4: 1 };
        players.forEach(p => { counts[p] = 0; pairings[p] = {}; });
        const { matches } = Logic.generateMatches(players, counts, pairings, skills);
        // After optimization, each court should have mixed skills
        matches.forEach(match => {
            const t1 = skills[match.teamOne[0]] + skills[match.teamOne[1]];
            const t2 = skills[match.teamTwo[0]] + skills[match.teamTwo[1]];
            expect(Math.abs(t1 - t2)).toBeLessThanOrEqual(2);
        });
    });

    test('works without skill ratings (backward compatible)', () => {
        const counts = { A: 0, B: 0, C: 0, D: 0 };
        const pairings = { A: {}, B: {}, C: {}, D: {} };
        const { matches } = Logic.generateMatches(['A', 'B', 'C', 'D'], counts, pairings);
        expect(matches).toHaveLength(1);
        expect(matches[0].teamOne).toHaveLength(2);
        expect(matches[0].teamTwo).toHaveLength(2);
    });

    test('maximizes variety over multiple rounds', () => {
        const counts = {};
        const pairings = {};
        const players = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        const skills = { A: 3, B: 3, C: 3, D: 3, E: 3, F: 3, G: 3, H: 3 };
        players.forEach(p => { counts[p] = 0; pairings[p] = {}; });

        // Play 3 rounds and track all teammate pairings
        const allTeammates = new Set();
        for (let round = 0; round < 3; round++) {
            const { matches } = Logic.generateMatches(players, counts, pairings, skills);
            Logic.updateMatchTracking(matches, counts, pairings);
            matches.forEach(m => {
                allTeammates.add(`${m.teamOne[0]}-${m.teamOne[1]}`);
                allTeammates.add(`${m.teamTwo[0]}-${m.teamTwo[1]}`);
            });
        }
        // With 8 equal-skill players over 3 rounds (12 teammate pairs),
        // we should see good variety — at least 8 unique pairings out of 28 possible
        expect(allTeammates.size).toBeGreaterThanOrEqual(8);
    });

    test('produces balanced matches even with large skill spread', () => {
        const counts = {};
        const pairings = {};
        const players = ['A', 'B', 'C', 'D'];
        const skills = { A: 5, B: 1, C: 3, D: 2 };
        players.forEach(p => { counts[p] = 0; pairings[p] = {}; });
        const { matches } = Logic.generateMatches(players, counts, pairings, skills);
        const t1 = skills[matches[0].teamOne[0]] + skills[matches[0].teamOne[1]];
        const t2 = skills[matches[0].teamTwo[0]] + skills[matches[0].teamTwo[1]];
        // Best possible: [A(5)+B(1)=6] vs [C(3)+D(2)=5] gap=1
        expect(Math.abs(t1 - t2)).toBeLessThanOrEqual(1);
    });
});

describe('shouldAutoResetTracking', () => {
    const SIX_HOURS = Logic.AUTO_RESET_THRESHOLD_MS;

    test('returns true when more than 6 hours have passed', () => {
        const lastMatch = Date.now() - (7 * 60 * 60 * 1000); // 7 hours ago
        expect(Logic.shouldAutoResetTracking(lastMatch, Date.now(), SIX_HOURS)).toBe(true);
    });

    test('returns false when less than 6 hours have passed', () => {
        const lastMatch = Date.now() - (3 * 60 * 60 * 1000); // 3 hours ago
        expect(Logic.shouldAutoResetTracking(lastMatch, Date.now(), SIX_HOURS)).toBe(false);
    });

    test('returns true when exactly 6 hours have passed', () => {
        const lastMatch = Date.now() - SIX_HOURS;
        expect(Logic.shouldAutoResetTracking(lastMatch, Date.now(), SIX_HOURS)).toBe(true);
    });

    test('returns false when no timestamp exists', () => {
        expect(Logic.shouldAutoResetTracking(null, Date.now(), SIX_HOURS)).toBe(false);
    });

    test('returns false when timestamp is 0', () => {
        expect(Logic.shouldAutoResetTracking(0, Date.now(), SIX_HOURS)).toBe(false);
    });

    test('returns false when match just happened', () => {
        expect(Logic.shouldAutoResetTracking(Date.now(), Date.now(), SIX_HOURS)).toBe(false);
    });

    test('works with custom threshold', () => {
        const oneHour = 60 * 60 * 1000;
        const lastMatch = Date.now() - (2 * oneHour); // 2 hours ago
        expect(Logic.shouldAutoResetTracking(lastMatch, Date.now(), oneHour)).toBe(true);
    });
});

describe('Integration: mid-session player fairness', () => {
    test('new players joining mid-session do not dominate match creation', () => {
        const counts = {};
        const pairings = {};
        const originalPlayers = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        Logic.initializePlayerTracking(originalPlayers, counts, pairings);

        // Simulate 3 rounds of matches
        for (let round = 0; round < 3; round++) {
            const result = Logic.generateMatches(originalPlayers, counts, pairings);
            Logic.updateMatchTracking(result.matches, counts, pairings);
        }

        // Now add 2 new players mid-session
        const allPlayers = [...originalPlayers, 'NewPlayer1', 'NewPlayer2'];
        Logic.initializeNewPlayers(allPlayers, counts, pairings);

        // New players should have the average count, not 0
        expect(counts.NewPlayer1).toBe(3); // average of 3 matches each
        expect(counts.NewPlayer2).toBe(3);

        // Generate matches — new players should NOT always be picked first
        const result = Logic.generateMatches(allPlayers, counts, pairings);
        const playingPlayers = result.matches.flatMap(m => [...m.teamOne, ...m.teamTwo]);

        // With avg count = 3, new players are on equal footing — they won't always play
        // At least verify the result is valid
        const allAssigned = [...playingPlayers, ...result.restingPlayers];
        expect(allAssigned.sort()).toEqual(allPlayers.sort());
    });
});
