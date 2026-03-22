const APP_VERSION_DATE = '2026-03-23 10:55';

let createMatchesButton = document.getElementById('create-matches');
let isAnimating = false;
let playerMatchCounts = {};
let playerTeammatePairings = {};

document.addEventListener('DOMContentLoaded', () => {
    getPlayerList().then(players => {
        loadMatchTracking();
        displayPlayers(players);
        setupEventListeners();
        displaySavedMatches();

        // Add event listener to the "Add Player" button to open the modal
        const addPlayerButton = document.getElementById('add-player');
        addPlayerButton.addEventListener('click', () => {
            const addPlayerModal = new bootstrap.Modal(document.getElementById('addPlayerModal'));
            addPlayerModal.show();
        });
        updatePlayerCount();
    });

});

function initializePlayerTracking(players) {
    Logic.initializePlayerTracking(players, playerMatchCounts, playerTeammatePairings);
}

function updateMatchTracking(matches) {
    Logic.updateMatchTracking(matches, playerMatchCounts, playerTeammatePairings);
    saveMatchTracking();
}

createMatchesButton.addEventListener('click', () => {
    if (isAnimating) return;
    const savedSelectedPlayers = JSON.parse(localStorage.getItem('selectedPlayers')) || [];
    const sitoutPlayers = Logic.filterSitoutPlayers(savedSelectedPlayers);
    if (sitoutPlayers.length > 0) {
        document.getElementById('inactive-players-list').innerHTML = `The following players are sitting out and will not be included in this round: </br></br> <span class="inactivePlayers">${sitoutPlayers.join('</br>')}</span>`;
        const inactivePlayersModal = new bootstrap.Modal(document.getElementById('inactivePlayersModal'));
        inactivePlayersModal.show();
    } else {
        proceedWithMatchCreation();
    }
});

document.getElementById('confirmInactivePlayers').addEventListener('click', () => {
    const inactivePlayersModal = bootstrap.Modal.getInstance(document.getElementById('inactivePlayersModal'));
    inactivePlayersModal.hide();
    proceedWithMatchCreation(); // Function to continue with match creation
});

function proceedWithMatchCreation() {
    checkAutoResetTracking();
    const savedSelectedPlayers = JSON.parse(localStorage.getItem('selectedPlayers')) || [];
    const { activePlayers, updatedPlayers } = Logic.processSitouts(savedSelectedPlayers);
    // Save updated sitout states to localStorage and refresh UI
    localStorage.setItem('selectedPlayers', JSON.stringify(updatedPlayers));
    addSelectedPlayers();
    // Initialize new mid-session players with average match count for fairness
    Logic.initializeNewPlayers(activePlayers, playerMatchCounts, playerTeammatePairings);
    // Shuffle players to introduce randomness
    Logic.shuffleArray(activePlayers);
    const matchesList = document.getElementById('matches-list');
    matchesList.innerHTML = '';
    const skillRatings = getSkillRatings();
    const { matches, restingPlayers } = Logic.generateMatches(activePlayers, playerMatchCounts, playerTeammatePairings, skillRatings);
    updateMatchTracking(matches);
    const dataToSave = { matches: matches, resting: restingPlayers };
    localStorage.setItem('matchesData', JSON.stringify(dataToSave));
    animateMatchReveal(matches, restingPlayers, activePlayers);
}


function saveMatchTracking() {
    try {
        localStorage.setItem('playerMatchCounts', JSON.stringify(playerMatchCounts));
        localStorage.setItem('playerTeammatePairings', JSON.stringify(playerTeammatePairings));
        localStorage.setItem('lastMatchTimestamp', Date.now().toString());
    } catch (error) {
        console.error('Failed to save tracking data:', error);
    }
}

function checkAutoResetTracking() {
    try {
        const lastMatch = parseInt(localStorage.getItem('lastMatchTimestamp'), 10) || null;
        if (Logic.shouldAutoResetTracking(lastMatch, Date.now(), Logic.AUTO_RESET_THRESHOLD_MS)) {
            playerMatchCounts = {};
            playerTeammatePairings = {};
            localStorage.removeItem('playerMatchCounts');
            localStorage.removeItem('playerTeammatePairings');
            localStorage.removeItem('lastMatchTimestamp');
        }
    } catch (error) {
        console.error('Failed to check auto-reset:', error);
    }
}

function loadMatchTracking() {
    try {
        playerMatchCounts = JSON.parse(localStorage.getItem('playerMatchCounts')) || {};
        playerTeammatePairings = JSON.parse(localStorage.getItem('playerTeammatePairings')) || {};
    } catch (error) {
        console.error('Failed to load tracking data:', error);
        playerMatchCounts = {};
        playerTeammatePairings = {};
    }
}


document.getElementById('new-matches').addEventListener('click', () => {
    // Show the Bootstrap modal
    const newSessionModal = new bootstrap.Modal(document.getElementById('newSessionModal'));
    newSessionModal.show();
});

document.getElementById('confirmNewSession').addEventListener('click', () => {
    // Force re-enable all buttons
    isAnimating = false;
    createMatchesButton.disabled = false;

    // Unselect all players
    document.querySelectorAll('.predefined-player.selected').forEach(player => {
        player.classList.remove('selected');
    });
    // Clear only the matches display, preserving the "New" button and header
    document.getElementById('matches-list').innerHTML = ''; // Clear matches
    // Clear selected players from localStorage
    localStorage.removeItem('selectedPlayers');
    localStorage.removeItem('matchesData');
    localStorage.removeItem('playerMatchCounts');
    localStorage.removeItem('playerTeammatePairings');
    localStorage.removeItem('lastMatchTimestamp');

    // Clear match tracking data
    playerMatchCounts = {};
    playerTeammatePairings = {};

    const storedPlayers = getPlayerFromStorage() || [];
    initializePlayerTracking(storedPlayers);

    // Optionally, clear the player names display if you have a separate list for that
    document.getElementById('selected-players').innerHTML = '';

    // Close the modal after performing the actions
    const newSessionModal = bootstrap.Modal.getInstance(document.getElementById('newSessionModal'));
    newSessionModal.hide();
    updatePlayerCount();
    updateNoMatchesMessage();
});

document.getElementById('save-selected-players').addEventListener('click', () => {
    saveSelectedPredefinedPlayers();
    // Close modal after saving
    const addPlayerModal = bootstrap.Modal.getInstance(document.getElementById('addPlayerModal'));
    addPlayerModal.hide();
});

function displaySavedMatches() {
    const savedData = JSON.parse(localStorage.getItem('matchesData'));
    if (savedData) {
        const matchesContainer = document.getElementById('matches-list');

        if (savedData.matches && savedData.matches.length > 0) {
            savedData.matches.forEach(matchData => {
                const matchElement = createMatchElement(matchData); // Use your existing function
                matchesContainer.appendChild(matchElement);
            });
        }
        if (savedData.resting && savedData.resting.length > 0) {
            const resting = document.createElement('div');
            resting.classList.add('resting');
            resting.textContent = `Resting: ${savedData.resting.join(', ')}`;
            matchesContainer.appendChild(resting);
        }
    }
    updateNoMatchesMessage();
}

function updatePlayerCount() {
    const playerDivs = document.querySelectorAll('#selected-players div:not(.inactive)');
    const count = playerDivs.length;
    const playerCountSpan = document.getElementById("player-count");
    playerCountSpan.textContent = `(${count})`;
}

function addSelectedPlayers() {
    try {
        const savedSelectedPlayers = JSON.parse(localStorage.getItem('selectedPlayers'));
        if (savedSelectedPlayers && savedSelectedPlayers.length > 0) {
            const playerNamesContainer = document.getElementById('selected-players');
            playerNamesContainer.innerHTML = '';
            savedSelectedPlayers.sort((a, b) => a.playerName.localeCompare(b.playerName));
            savedSelectedPlayers.forEach(player => {
                displayPlayerName(player, playerNamesContainer);
            });
        }
    } catch (error) {
        console.error('Failed to load selected players:', error);
    }
}

function getPlayerFromStorage() {
    try {
        let players = JSON.parse(localStorage.getItem('players'));
        if (players) {
            players.sort((a, b) => a.localeCompare(b));
        }
        return players;
    } catch (error) {
        console.error('Failed to load players from storage:', error);
        return null;
    }
}

function savePlayersInStorage(players) {
    players.sort((a, b) => a.localeCompare(b));
    localStorage.setItem('players', JSON.stringify(players));
}

function saveSkillRatings(skills) {
    try {
        localStorage.setItem('skillRatings', JSON.stringify(skills));
    } catch (error) {
        console.error('Failed to save skill ratings:', error);
    }
}

function getSkillRatings() {
    try {
        return JSON.parse(localStorage.getItem('skillRatings')) || {};
    } catch (error) {
        console.error('Failed to load skill ratings:', error);
        return {};
    }
}


function checkForUpdates() {
    const statusEl = document.getElementById('update-status');
    const btn = document.getElementById('check-update-btn');
    statusEl.style.display = 'block';
    statusEl.style.color = '#666';
    statusEl.textContent = 'Checking for updates...';
    btn.disabled = true;

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration().then(reg => {
            if (reg) {
                reg.update().then(() => {
                    if (reg.waiting) {
                        // New version ready — activate and reload
                        reg.waiting.postMessage({ type: 'SKIP_WAITING' });
                        statusEl.style.color = '#198754';
                        statusEl.textContent = '✅ Update found! Reloading...';
                        setTimeout(() => window.location.reload(), 1000);
                    } else if (reg.installing) {
                        // Update installing — wait for it
                        statusEl.textContent = 'Installing update...';
                        reg.installing.addEventListener('statechange', function () {
                            if (this.state === 'installed') {
                                this.postMessage({ type: 'SKIP_WAITING' });
                                statusEl.style.color = '#198754';
                                statusEl.textContent = '✅ Update installed! Reloading...';
                                setTimeout(() => window.location.reload(), 1000);
                            }
                        });
                    } else {
                        statusEl.style.color = '#198754';
                        statusEl.textContent = '✅ You are on the latest version.';
                        btn.disabled = false;
                    }
                }).catch(err => {
                    statusEl.style.color = '#dc3545';
                    statusEl.textContent = '❌ Update check failed: ' + err.message;
                    btn.disabled = false;
                });
            } else {
                statusEl.style.color = '#666';
                statusEl.textContent = 'No service worker registered.';
                btn.disabled = false;
            }
        });
    } else {
        // Fallback: just hard reload
        caches.keys().then(names => {
            return Promise.all(names.map(name => caches.delete(name)));
        }).then(() => {
            statusEl.style.color = '#198754';
            statusEl.textContent = '✅ Cache cleared! Reloading...';
            setTimeout(() => window.location.reload(), 1000);
        });
    }
}

function normalizeUrl(input) {
    let url = input.trim().toLowerCase();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }
    return url;
}

function fetchWithProtocolFallback(url) {
    return fetch(url).then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response;
    }).catch(err => {
        // If https failed and we added it, try http
        if (url.startsWith('https://')) {
            const httpUrl = url.replace('https://', 'http://');
            return fetch(httpUrl).then(response => {
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                return response;
            });
        }
        throw err;
    });
}

function loadPlayersFromUrlInput() {
    const urlInput = document.getElementById('players-url-input');
    const overwrite = document.getElementById('overwrite-players-check').checked;
    const statusEl = document.getElementById('load-players-status');
    const rawUrl = urlInput.value.trim();

    if (!rawUrl) {
        statusEl.style.display = 'block';
        statusEl.style.color = '#dc3545';
        statusEl.textContent = 'Please enter a URL.';
        return;
    }

    const url = normalizeUrl(rawUrl);
    urlInput.value = url; // Show normalized URL back to user

    statusEl.style.display = 'block';
    statusEl.style.color = '#666';
    statusEl.textContent = 'Loading...';

    fetchWithProtocolFallback(url)
        .then(response => response.text())
        .then(text => {
            const parsed = Logic.parsePlayerList(text);
            if (!parsed.valid) {
                statusEl.style.color = '#dc3545';
                statusEl.textContent = `❌ ${parsed.error}`;
                return;
            }
            if (parsed.names.length === 0) {
                statusEl.style.color = '#dc3545';
                statusEl.textContent = 'No players found at this URL.';
                return;
            }
            if (overwrite) {
                savePlayersInStorage(parsed.names);
                saveSkillRatings(parsed.skills);
            } else {
                // Merge: add new players only
                let existing = getPlayerFromStorage() || [];
                const existingSkills = getSkillRatings();
                parsed.names.forEach((name, i) => {
                    if (!existing.some(e => e.toLowerCase() === name.toLowerCase())) {
                        existing.push(name);
                    }
                    existingSkills[name] = parsed.skills[name];
                });
                savePlayersInStorage(existing);
                saveSkillRatings(existingSkills);
            }
            // Refresh display
            const players = getPlayerFromStorage();
            displayPlayers(players);
            updatePlayerCount();
            statusEl.style.color = '#198754';
            statusEl.textContent = `✅ Loaded ${parsed.names.length} players${overwrite ? ' (overwritten)' : ' (merged)'}.`;
        })
        .catch(error => {
            statusEl.style.color = '#dc3545';
            statusEl.textContent = `❌ Failed to load: ${error.message}`;
        });
}

function getPlayerList() {
    let defaultPlayers = ["Example player 1", "Example player 2", "Example player 3"];
    // Parse the URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const listUrl = urlParams.get('players_url');
    // Attempt to get players from storage
    let players = getPlayerFromStorage();
    const overwritePlayers = urlParams.get('overwrite_players') === 'true' || Logic.compareArrays(players, defaultPlayers) === true || players === null;
    // If players exist and we're not overwriting, return them
    if (players && players.length > 0 && !overwritePlayers) {
        return Promise.resolve(players);
    }
    players = defaultPlayers
    // If a list URL is provided and (players don't exist or we're overwriting), fetch the list
    if (listUrl && (!players || overwritePlayers)) {
        return fetch(listUrl)
            .then(response => response.text())
            .then(text => {
                const parsed = Logic.parsePlayerList(text);
                if (!parsed.valid) {
                    console.error('Invalid player file format:', parsed.error);
                    savePlayersInStorage(players);
                    return players;
                }
                if (overwritePlayers || !players) {
                    savePlayersInStorage(parsed.names);
                    saveSkillRatings(parsed.skills);
                }
                return parsed.names;
            })
            .catch(error => {
                console.error('Failed to fetch player list:', error);
                // If fetching fails, return the players from storage or an empty array
                savePlayersInStorage(players);
                return Promise.resolve(players);

            });
    } else {
        // If no listUrl is provided or not overwriting, return the stored players or an empty array
        savePlayersInStorage(players);
        return Promise.resolve(players || []);
    }
}

function displayPlayers(players) {
    const predefinedPlayersList = document.getElementById('predefined-players-list');
    predefinedPlayersList.innerHTML = ''; // Clear the list before adding updated items
    players.forEach((player, index) => {
        const playerElement = document.createElement('div');
        playerElement.classList.add('predefined-player');
        playerElement.addEventListener('click', function () {
            this.classList.toggle('selected');
            saveSelectedPredefinedPlayers();
        });

        // Container for the player's name
        const playerName = document.createElement('span');
        playerName.textContent = player;
        playerName.classList.add('player-name');
        // Container for the icons
        const iconsContainer = document.createElement('div');
        // Add edit icon
        const editIcon = document.createElement('span');
        editIcon.innerHTML = '✏️';
        editIcon.classList.add('edit-icon');
        editIcon.onclick = (e) => { e.stopPropagation(); openEditPlayerModal(player, index); };
        const deleteIcon = document.createElement('span');
        deleteIcon.innerHTML = '&#10060;';
        deleteIcon.classList.add('delete-icon');
        deleteIcon.onclick = (e) => { e.stopPropagation(); deletePlayer(index); };

        if (!isEditMode) {
            editIcon.classList.add('edit-icon', 'hidden');
            deleteIcon.classList.add('delete-icon', 'hidden');
        }
        // Append icons to the icons container
        iconsContainer.appendChild(editIcon);
        iconsContainer.appendChild(deleteIcon);
        // Append the player name and icons container to the player element
        playerElement.appendChild(playerName);
        playerElement.appendChild(iconsContainer);
        // Append the player element to the predefined players list
        predefinedPlayersList.appendChild(playerElement);
    });
    markSelectedPredefinedPlayers();
    addSelectedPlayers();
}

// Font scaling
let fontScale = parseInt(localStorage.getItem('fontScale'), 10) || 100;
applyFontScale(fontScale);

function applyFontScale(scale) {
    fontScale = Math.max(50, Math.min(200, scale));
    // Responsive base: scales from 14px at 320px viewport to 18px at 1120px+
    // Equivalent to clamp(0.875rem, 0.75rem + 0.5vw, 1.125rem) but computed in JS for old Safari compat
    var vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    var base = Math.min(Math.max(12 + 0.5 * vw / 100, 14), 18);
    document.documentElement.style.fontSize = (base * fontScale / 100) + 'px';
    var display = document.getElementById('font-scale-display');
    if (display) display.textContent = fontScale + '%';
    localStorage.setItem('fontScale', fontScale.toString());
}

function setupEventListeners() {
    document.getElementById('add-new-player').addEventListener('click', openAddPlayerModal);
    document.getElementById('save-player').addEventListener('click', savePlayer);
    // Add event listener for the toggle edit mode button
    document.getElementById('toggle-edit-mode').addEventListener('click', toggleEditMode);
    document.getElementById('player-list-label').addEventListener('click', createBouncingBalls);
    addDoubleTapListener(document.getElementById('player-list-label'), showVersionInfo);
    addDoubleTapListener(document.getElementById('matches-list'), toggleSkillBadges);
    document.getElementById('options-btn').addEventListener('click', () => {
        const optionsModal = new bootstrap.Modal(document.getElementById('optionsModal'));
        optionsModal.show();
    });
    document.getElementById('font-increase').addEventListener('click', () => applyFontScale(fontScale + 10));
    document.getElementById('font-decrease').addEventListener('click', () => applyFontScale(fontScale - 10));
    document.getElementById('load-players-btn').addEventListener('click', loadPlayersFromUrlInput);
    document.getElementById('check-update-btn').addEventListener('click', checkForUpdates);
    document.getElementById('options-version-date').textContent = APP_VERSION_DATE;
    // Pre-fill URL input from current query param if present
    const urlParams = new URLSearchParams(window.location.search);
    const currentUrl = urlParams.get('players_url');
    if (currentUrl) {
        document.getElementById('players-url-input').value = currentUrl;
    }
    clickSelectedPlayersListener();
}

function clickSelectedPlayersListener() {
    const container = document.getElementById('selected-players');
    container.addEventListener('click', function (event) {
        if (event.target.classList.contains('selected-player')) {
            const playerElement = event.target;
            const playerName = playerElement.textContent;
            const savedSelectedPlayers = JSON.parse(localStorage.getItem('selectedPlayers')) || [];
            const playerIndex = savedSelectedPlayers.findIndex(player => player.playerName === playerName);
            if (playerIndex !== -1) {
                // Cycle through the statuses: none -> sitout-1 -> sitout-2 -> inactive -> none
                if (playerElement.classList.contains('inactive')) {
                    playerElement.classList.remove('inactive');
                    delete savedSelectedPlayers[playerIndex].inactive;
                } else if (playerElement.classList.contains('sitout-2')) {
                    playerElement.classList.remove('sitout-2');
                    playerElement.classList.add('inactive');
                    savedSelectedPlayers[playerIndex].inactive = true;
                    delete savedSelectedPlayers[playerIndex].sitout;
                } else if (playerElement.classList.contains('sitout-1')) {
                    playerElement.classList.remove('sitout-1');
                    playerElement.classList.add('sitout-2');
                    savedSelectedPlayers[playerIndex].sitout = 2;
                } else {
                    playerElement.classList.add('sitout-1');
                    savedSelectedPlayers[playerIndex].sitout = 1;
                }
                // Remove unnecessary properties
                if (!playerElement.classList.contains('sitout-1') && !playerElement.classList.contains('sitout-2')) {
                    delete savedSelectedPlayers[playerIndex].sitout;
                }
                localStorage.setItem('selectedPlayers', JSON.stringify(savedSelectedPlayers));
                updatePlayerCount();
            }
        }
    });
}


let isEditMode = false; // Track the state of edit mode

function toggleEditMode() {
    isEditMode = !isEditMode; // Toggle the state
    // Toggle visibility of the Add New Player button
    const addNewPlayerBtn = document.getElementById('add-new-player');
    addNewPlayerBtn.style.display = isEditMode ? 'inline-block' : 'none';
    // Toggle visibility of all delete and edit icons
    const deleteIcons = document.querySelectorAll('.delete-icon');
    const editIcons = document.querySelectorAll('.edit-icon');
    deleteIcons.forEach(icon => icon.style.display = isEditMode ? 'inline-block' : 'none');
    editIcons.forEach(icon => icon.style.display = isEditMode ? 'inline-block' : 'none');
    // Optionally, change the button text based on the mode
    const toggleEditBtn = document.getElementById('toggle-edit-mode');
    toggleEditBtn.textContent = isEditMode ? 'Exit Edit Mode' : 'Edit Mode';
}

function openAddPlayerModal() {
    document.getElementById('playerModalLabel').textContent = 'Add New Player';
    document.getElementById('player-name-input').value = '';
    document.getElementById('player-rating-input').value = '3';
    document.getElementById('editing-player-index').value = '';
    const playerModal = new bootstrap.Modal(document.getElementById('playerModal'));
    playerModal.show();
}

function openEditPlayerModal(playerName, index) {
    const skillRatings = getSkillRatings();
    document.getElementById('playerModalLabel').textContent = 'Edit Player';
    document.getElementById('player-name-input').value = playerName;
    document.getElementById('player-rating-input').value = skillRatings[playerName] || 3;
    document.getElementById('editing-player-index').value = index;
    const playerModal = new bootstrap.Modal(document.getElementById('playerModal'));
    playerModal.show();
}

function savePlayer() {
    const playerName = document.getElementById('player-name-input').value.trim();
    const rating = parseInt(document.getElementById('player-rating-input').value, 10);
    const editingIndex = document.getElementById('editing-player-index').value;
    if (!playerName) {
        alert('Player name cannot be empty.');
        return;
    }
    let players = getPlayerFromStorage();
    const isDuplicate = players.some((p, i) =>
        p.toLowerCase() === playerName.toLowerCase() && String(i) !== editingIndex
    );
    if (isDuplicate) {
        alert('A player with this name already exists.');
        return;
    }
    const oldName = editingIndex !== '' ? players[editingIndex] : null;
    if (editingIndex !== '') {
        players[editingIndex] = playerName;
    } else {
        players.push(playerName);
    }
    savePlayersInStorage(players);
    // Save skill rating
    const skillRatings = getSkillRatings();
    if (oldName && oldName !== playerName) {
        delete skillRatings[oldName];
    }
    skillRatings[playerName] = (rating >= 1 && rating <= 5) ? rating : 3;
    saveSkillRatings(skillRatings);
    displayPlayers(players);
    const playerModal = bootstrap.Modal.getInstance(document.getElementById('playerModal'));
    playerModal.hide();
}

function deletePlayer(index) {
    if (confirm('Are you sure you want to delete this player?')) {
        let players = getPlayerFromStorage();
        players.splice(index, 1);
        savePlayersInStorage(players);
        displayPlayers(players);
    }
}

function updateNoMatchesMessage() {
    const matchesList = document.getElementById('matches-list');
    const noMatchesMessage = document.getElementById('no-matches-message');
    if (matchesList.children.length === 0) {
        noMatchesMessage.style.display = "flex"; // Show the message if no matches
    } else {
        noMatchesMessage.style.display = "none"; // Hide the message if there are matches
    }
}

// Function to create a match element from match data
function createMatchElement(matchData) {
    const match = document.createElement('div');
    match.classList.add('match');
    const courtNumber = document.createElement('div');
    courtNumber.innerHTML = `<img src="assets/tennis-ball.png" alt="Court" width="24" height="24"> Court ${matchData.court}`;
    courtNumber.classList.add('court-number');
    const skillRatings = getSkillRatings();
    const teamOne = document.createElement('div');
    teamOne.classList.add('team');
    teamOne.innerHTML = `<div>${formatPlayerNameWithSkill(matchData.teamOne[0], skillRatings)}</div><div>${formatPlayerNameWithSkill(matchData.teamOne[1], skillRatings)}</div>`;
    const versus = document.createElement('div');
    versus.classList.add('versus');
    versus.textContent = 'vs';
    const teamTwo = document.createElement('div');
    teamTwo.classList.add('team');
    teamTwo.innerHTML = `<div>${formatPlayerNameWithSkill(matchData.teamTwo[0], skillRatings)}</div><div>${formatPlayerNameWithSkill(matchData.teamTwo[1], skillRatings)}</div>`;
    match.appendChild(courtNumber);
    match.appendChild(teamOne);
    match.appendChild(versus);
    match.appendChild(teamTwo);
    return match;
}

function formatPlayerNameWithSkill(playerName, skillRatings) {
    const skill = skillRatings[playerName] || 3;
    return `${Logic.formatPlayerName(playerName)} <span class="skill-badge">${skill}</span>`;
}

let skillTimeout = null;
function toggleSkillBadges() {
    const badges = document.querySelectorAll('.skill-badge');
    badges.forEach(b => b.classList.add('skill-visible'));
    if (skillTimeout) clearTimeout(skillTimeout);
    skillTimeout = setTimeout(() => {
        badges.forEach(b => b.classList.remove('skill-visible'));
    }, 10000);
}

function formatPlayerName(playerName) {
    return Logic.formatPlayerName(playerName);
}

function displayPlayerName(player, container) {
    const playerElement = document.createElement('div');
    playerElement.textContent = player.playerName;
    playerElement.classList.add('selected-player');
    if (player.inactive) {
        playerElement.classList.add('inactive');
    } else if (player.sitout === 2) {
        playerElement.classList.add('sitout-2');
    } else if (player.sitout === 1) {
        playerElement.classList.add('sitout-1');
    }
    container.appendChild(playerElement);
}

function markSelectedPredefinedPlayers() {
    try {
        const savedSelectedPlayers = JSON.parse(localStorage.getItem('selectedPlayers'));
        if (savedSelectedPlayers && savedSelectedPlayers.length > 0) {
            const playerElements = new Map(
                Array.from(document.querySelectorAll('.predefined-player .player-name'))
                    .map(el => [el.textContent, el.parentElement])
            );
            savedSelectedPlayers.forEach(player => {
                const element = playerElements.get(player.playerName);
                if (element) {
                    element.classList.add('selected');
                }
            });
        }
    } catch (error) {
        console.error('Failed to load selected players:', error);
    }
}

function saveSelectedPredefinedPlayers() {
    // Get all selected player elements
    const selectedPlayersElements = document.querySelectorAll('.predefined-player.selected .player-name');
    // Convert NodeList to an array of player names
    const selectedPlayersNamesFromUI = Array.from(selectedPlayersElements).map(element => element.textContent);
    // Retrieve the currently stored players from localStorage, or initialize an empty array if none
    let storedPlayers = JSON.parse(localStorage.getItem('selectedPlayers')) || [];
    // Filter out players that are no longer selected
    storedPlayers = storedPlayers.filter(player => selectedPlayersNamesFromUI.includes(player.playerName));
    // Find and add new players that are selected but not in localStorage
    selectedPlayersNamesFromUI.forEach(playerNameFromUI => {
        if (!storedPlayers.find(player => player.playerName === playerNameFromUI)) {
            storedPlayers.push({playerName: playerNameFromUI});
        }
    });

    // Save the updated list of selected players to localStorage
    localStorage.setItem('selectedPlayers', JSON.stringify(storedPlayers));

    addSelectedPlayers();
    updatePlayerCount();
}


// Audio context for wheel-of-fortune style clicking sound
let audioCtx = null;

// Create a short burst of filtered noise to simulate a mechanical flapper click
function playTick() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const now = audioCtx.currentTime;
    const duration = 0.03 + Math.random() * 0.015; // 30-45ms click

    // White noise buffer
    const bufferSize = Math.ceil(audioCtx.sampleRate * duration);
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1);
    }

    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;

    // Bandpass filter to shape the click — like a wooden peg being struck
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1800 + Math.random() * 400;
    filter.Q.value = 1.5;

    // Sharp envelope for a snappy click
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    noise.start(now);
    noise.stop(now + duration);
}

// Final landing sound — emphasized click with a snap on top
function playStopSound() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const now = audioCtx.currentTime;

    // Main click — same character as rolling, but punchier
    const mainDur = 0.055;
    const mainBuf = audioCtx.createBuffer(1, Math.ceil(audioCtx.sampleRate * mainDur), audioCtx.sampleRate);
    const mainData = mainBuf.getChannelData(0);
    for (let i = 0; i < mainData.length; i++) mainData[i] = Math.random() * 2 - 1;
    const mainNoise = audioCtx.createBufferSource();
    mainNoise.buffer = mainBuf;
    const mainFilter = audioCtx.createBiquadFilter();
    mainFilter.type = 'bandpass';
    mainFilter.frequency.value = 1900;
    mainFilter.Q.value = 1.5;
    const mainGain = audioCtx.createGain();
    mainGain.gain.setValueAtTime(0.38, now);
    mainGain.gain.exponentialRampToValueAtTime(0.001, now + mainDur);
    mainNoise.connect(mainFilter);
    mainFilter.connect(mainGain);
    mainGain.connect(audioCtx.destination);
    mainNoise.start(now);
    mainNoise.stop(now + mainDur);

    // High snap layer — brief bright edge for extra click
    const snapDur = 0.015;
    const snapBuf = audioCtx.createBuffer(1, Math.ceil(audioCtx.sampleRate * snapDur), audioCtx.sampleRate);
    const snapData = snapBuf.getChannelData(0);
    for (let i = 0; i < snapData.length; i++) snapData[i] = Math.random() * 2 - 1;
    const snapNoise = audioCtx.createBufferSource();
    snapNoise.buffer = snapBuf;
    const snapFilter = audioCtx.createBiquadFilter();
    snapFilter.type = 'bandpass';
    snapFilter.frequency.value = 4000;
    snapFilter.Q.value = 1;
    const snapGain = audioCtx.createGain();
    snapGain.gain.setValueAtTime(0.1, now);
    snapGain.gain.exponentialRampToValueAtTime(0.001, now + snapDur);
    snapNoise.connect(snapFilter);
    snapFilter.connect(snapGain);
    snapGain.connect(audioCtx.destination);
    snapNoise.start(now);
    snapNoise.stop(now + snapDur);
}

function buildReelNames(allPlayers, finalName, count) {
    // Build a list of random names ending with the final name
    const names = [];
    for (let i = 0; i < count; i++) {
        names.push(allPlayers[Math.floor(Math.random() * allPlayers.length)]);
    }
    names.push(finalName); // last name is always the final one
    return names;
}

function animateMatchReveal(matches, restingPlayers, allPlayers) {
    isAnimating = true;
    createMatchesButton.disabled = true;

    // No matches to animate — show resting and re-enable immediately
    if (!matches || matches.length === 0) {
        const matchesList = document.getElementById('matches-list');
        matchesList.innerHTML = '';
        if (restingPlayers && restingPlayers.length > 0) {
            const resting = document.createElement('div');
            resting.classList.add('resting');
            resting.textContent = `Resting: ${restingPlayers.join(', ')}`;
            matchesList.appendChild(resting);
        }
        updateNoMatchesMessage();
        isAnimating = false;
        createMatchesButton.disabled = false;
        return;
    }

    const matchesList = document.getElementById('matches-list');
    matchesList.innerHTML = '';

    const skillRatings = getSkillRatings();
    const reels = [];

    matches.forEach(matchData => {
        const match = document.createElement('div');
        match.classList.add('match');

        const courtNumber = document.createElement('div');
        courtNumber.innerHTML = `<img src="assets/tennis-ball.png" alt="Court" width="24" height="24"> Court ${matchData.court}`;
        courtNumber.classList.add('court-number');

        const teamOne = document.createElement('div');
        teamOne.classList.add('team');
        const versus = document.createElement('div');
        versus.classList.add('versus');
        versus.textContent = 'vs';
        const teamTwo = document.createElement('div');
        teamTwo.classList.add('team');

        const playerNames = [
            matchData.teamOne[0], matchData.teamOne[1],
            matchData.teamTwo[0], matchData.teamTwo[1]
        ];
        const teams = [teamOne, teamOne, teamTwo, teamTwo];

        playerNames.forEach((finalName, idx) => {
            const viewport = document.createElement('div');
            viewport.classList.add('reel-viewport');

            const strip = document.createElement('div');
            strip.classList.add('reel-strip');

            viewport.appendChild(strip);
            teams[idx].appendChild(viewport);

            reels.push({ viewport, strip, finalName });
        });

        match.appendChild(courtNumber);
        match.appendChild(teamOne);
        match.appendChild(versus);
        match.appendChild(teamTwo);
        matchesList.appendChild(match);
    });

    updateNoMatchesMessage();

    // Timing: 5-7s total
    const FAST_PHASE = 3500;
    const DRAMA_EXTRA = 3500;
    const DRAMA_COUNT = 3;

    const stopOrder = reels.map((_, i) => i);
    Logic.shuffleArray(stopOrder);

    const normalCount = Math.max(reels.length - DRAMA_COUNT, 0);
    const normalStagger = normalCount > 0 ? FAST_PHASE / normalCount : 0;

    reels.forEach((reel, i) => {
        const stopIndex = stopOrder.indexOf(i);
        if (stopIndex < normalCount) {
            reel.stopTime = 2000 + (stopIndex * normalStagger);
            reel.dramatic = false;
        } else {
            const dramaIndex = stopIndex - normalCount;
            reel.stopTime = FAST_PHASE + 2000 + (dramaIndex * (DRAMA_EXTRA / DRAMA_COUNT));
            reel.dramatic = true;
        }

        // More names for reels that spin longer
        const nameCount = Math.floor(reel.stopTime / 60);
        reel.names = buildReelNames(allPlayers, reel.finalName, nameCount);

        // Build the strip with all name elements
        reel.names.forEach((name, idx) => {
            const nameEl = document.createElement('div');
            nameEl.classList.add('reel-name');
            if (idx === reel.names.length - 1) {
                // Last name is the final one — pre-render with skill badge
                nameEl.innerHTML = formatPlayerNameWithSkill(name, skillRatings);
            } else {
                nameEl.textContent = Logic.formatPlayerName(name);
            }
            reel.strip.appendChild(nameEl);
        });
    });

    // Start all reels spinning after layout is complete
    requestAnimationFrame(() => {
    requestAnimationFrame(() => {
        reels.forEach(reel => {
            // Measure actual rendered height of first name element
            const firstNameEl = reel.strip.firstElementChild;
            const nameHeight = firstNameEl ? firstNameEl.offsetHeight : 28;
            const totalScroll = nameHeight * (reel.names.length - 1);
            reel.strip.style.transition = `transform ${reel.stopTime}ms cubic-bezier(0.15, 0.0, 0.15, 1.0)`;
            reel.strip.style.transform = `translateY(-${totalScroll}px)`;
        });

        // Set up tick sounds and landing events
        const startTime = Date.now();
        let lastTickTime = 0;
        let stoppedCount = 0;

        function tickLoop() {
            const elapsed = Date.now() - startTime;
            let anySpinning = false;

            reels.forEach(reel => {
                if (reel.stopped) return;

                if (elapsed >= reel.stopTime) {
                    reel.stopped = true;
                    stoppedCount++;
                    // Just add the landing animation to the last name (already correct)
                    const lastNameEl = reel.strip.lastElementChild;
                    lastNameEl.classList.add('slot-landed');
                    playStopSound();

                    if (stoppedCount === reels.length) {
                        // All done
                        if (restingPlayers && restingPlayers.length > 0) {
                            const resting = document.createElement('div');
                            resting.classList.add('resting');
                            resting.textContent = `Resting: ${restingPlayers.join(', ')}`;
                            matchesList.appendChild(resting);
                        }
                        updateNoMatchesMessage();
                        isAnimating = false;
                        createMatchesButton.disabled = false;
                        setTimeout(createBouncingBalls, 300);
                    }
                    return;
                }

                anySpinning = true;
            });

            // Play tick sounds at intervals
            if (anySpinning) {
                const tickInterval = elapsed < 2000 ? 80 : 80 + ((elapsed - 2000) / 50);
                if (elapsed - lastTickTime >= tickInterval) {
                    playTick();
                    lastTickTime = elapsed;
                }
                requestAnimationFrame(tickLoop);
            }
        }

        requestAnimationFrame(tickLoop);
    });
    });
}

// Custom double-tap handler that works with touch-action: manipulation
function addDoubleTapListener(element, callback, delay) {
    let lastTap = 0;
    const tapDelay = delay || 400;
    element.addEventListener('touchend', function (e) {
        const now = Date.now();
        if (now - lastTap < tapDelay) {
            e.preventDefault();
            callback();
            lastTap = 0;
        } else {
            lastTap = now;
        }
    });
    // Keep dblclick for desktop/mouse
    element.addEventListener('dblclick', callback);
}

function showVersionInfo() {
    const versionEl = document.getElementById('version-info');
    versionEl.textContent = `Last updated: ${APP_VERSION_DATE}`;
    versionEl.classList.add('visible');
    setTimeout(() => {
        versionEl.classList.remove('visible');
    }, 3000);
}

let ballsRunning = false;

function createBouncingBalls() {
    if (ballsRunning) return; // Prevent multiple instances
    ballsRunning = true;
    // Engine creation
    let engine = Matter.Engine.create();
    let world = engine.world;
    let render = Matter.Render.create({
        element: document.body, engine: engine, options: {
            width: window.innerWidth, height: window.innerHeight, wireframes: false, // Set to false to see the tennis balls with colors
            background: 'transparent'
        }
    });
    // Add walls to the world so balls will bounce off the sides and bottom
    let ground = Matter.Bodies.rectangle(window.innerWidth / 2, window.innerHeight, window.innerWidth, 10, {isStatic: true});
    let leftWall = Matter.Bodies.rectangle(0, window.innerHeight / 2, 10, window.innerHeight, {isStatic: true});
    let rightWall = Matter.Bodies.rectangle(window.innerWidth, window.innerHeight / 2, 10, window.innerHeight, {isStatic: true});
    Matter.World.add(world, [ground, leftWall, rightWall]);

    // Function to add a ball
    function addBall() {
        let ballScale = 0.3;
        let ball = Matter.Bodies.circle(Math.random() * window.innerWidth, -30, 125 * ballScale, {
            restitution: 1.1, // Bounciness
            render: {
                sprite: {
                    texture: './assets/tennis-ball.png', xScale: ballScale, yScale: ballScale
                }
            }
        });
        Matter.World.add(world, ball);
        // Randomize initial velocity
        // Random X velocity between -5 and 5
        let velocityX = Math.random() * 10 - 5;
        // Random Y velocity to simulate dropping, you can adjust the range for different effects
        let velocityY = Math.random() * -5; // Negative for upward movement, adjust range as needed
        // Set the initial velocity of the ball
        Matter.Body.setVelocity(ball, {x: velocityX, y: velocityY});
        // Make the ball disappear after 5-6 seconds
        setTimeout(() => {
            Matter.World.remove(world, ball);
        }, 5000 + Math.random() * 1000);
    }

    // Add several balls for effect
    for (let i = 0; i < 10; i++) {
        setTimeout(addBall, i * 50);
    }
    // Run the engine and renderer
    Matter.Engine.run(engine);
    Matter.Render.run(render);
    // Stop the engine and renderer after a while
    setTimeout(() => {
        Matter.Render.stop(render);
        Matter.World.clear(world);
        Matter.Engine.clear(engine);
        render.canvas.remove();
        render.textures = {};
        ballsRunning = false;
    }, 7000); // Stop everything after 5 seconds
}

document.getElementById('clear-tracking').addEventListener('click', () => {
    // Show the Bootstrap modal for confirmation
    const clearTrackingModal = new bootstrap.Modal(document.getElementById('clearTrackingModal'));
    clearTrackingModal.show();
});
document.getElementById('confirmClearTracking').addEventListener('click', () => {
    // Clear fairness tracking data
    playerMatchCounts = {};
    playerTeammatePairings = {};
    // Update local storage
    saveMatchTracking();
    // Close the modal after clearing
    const clearTrackingModal = bootstrap.Modal.getInstance(document.getElementById('clearTrackingModal'));
    clearTrackingModal.hide();
});

