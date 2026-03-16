let createMatchesButton = document.getElementById('create-matches');
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
    const allPlayers = Array.from(document.querySelectorAll('#selected-players div'));
    const activePlayers = allPlayers.filter(player => {
        if (player.classList.contains('inactive')) {
            return false;
        } else if (player.classList.contains('sitout-2')) {
            player.classList.remove('sitout-2');
            player.classList.add('sitout-1');
            return false;
        } else if (player.classList.contains('sitout-1')) {
            player.classList.remove('sitout-1');
            return false;
        }
        return true;
    }).map(player => player.textContent);
    // Initialize new mid-session players with average match count for fairness
    Logic.initializeNewPlayers(activePlayers, playerMatchCounts, playerTeammatePairings);
    // Shuffle players to introduce randomness
    Logic.shuffleArray(activePlayers);
    const matchesList = document.getElementById('matches-list');
    matchesList.innerHTML = '';
    const { matches, restingPlayers } = Logic.generateMatches(activePlayers, playerMatchCounts, playerTeammatePairings);
    updateMatchTracking(matches);
    const dataToSave = { matches: matches, resting: restingPlayers };
    localStorage.setItem('matchesData', JSON.stringify(dataToSave));
    displaySavedMatches();
    createBouncingBalls();
}


function saveMatchTracking() {
    try {
        localStorage.setItem('playerMatchCounts', JSON.stringify(playerMatchCounts));
        localStorage.setItem('playerTeammatePairings', JSON.stringify(playerTeammatePairings));
    } catch (error) {
        console.error('Failed to save tracking data:', error);
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
    // This code runs when the "New Session" button in the modal is clicked
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
                // Split the text by new lines to get an array of player names
                let fetchedPlayers = Logic.parsePlayerList(text);
                // Save the fetched players in storage if we're overwriting or no players were previously stored
                if (overwritePlayers || !players) {
                    savePlayersInStorage(fetchedPlayers);
                }
                return fetchedPlayers;
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
        editIcon.innerHTML = '✏️'; // Example edit icon, replace with your preferred icon
        editIcon.classList.add('edit-icon');
        editIcon.onclick = () => openEditPlayerModal(player, index);
        // Add delete icon
        const deleteIcon = document.createElement('span');
        deleteIcon.innerHTML = '&#10060;'; // Example delete icon, replace with your preferred icon
        deleteIcon.classList.add('delete-icon');
        deleteIcon.onclick = () => deletePlayer(index);

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

function setupEventListeners() {
    document.getElementById('add-new-player').addEventListener('click', openAddPlayerModal);
    document.getElementById('save-player').addEventListener('click', savePlayer);
    // Add event listener for the toggle edit mode button
    document.getElementById('toggle-edit-mode').addEventListener('click', toggleEditMode);
    document.getElementById('player-list-label').addEventListener('click', createBouncingBalls);
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
    document.getElementById('editing-player-index').value = '';
    const playerModal = new bootstrap.Modal(document.getElementById('playerModal'));
    playerModal.show();
}

function openEditPlayerModal(playerName, index) {
    document.getElementById('playerModalLabel').textContent = 'Edit Player';
    document.getElementById('player-name-input').value = playerName;
    document.getElementById('editing-player-index').value = index;
    const playerModal = new bootstrap.Modal(document.getElementById('playerModal'));
    playerModal.show();
}

function savePlayer() {
    const playerName = document.getElementById('player-name-input').value.trim();
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
    if (editingIndex !== '') {
        players[editingIndex] = playerName;
    } else {
        players.push(playerName);
    }
    savePlayersInStorage(players);
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
    // Include court number in the match display
    const courtNumber = document.createElement('div');
    courtNumber.innerHTML = `<img src="assets/tennis-ball.png" alt="Court" width="24" height="24"> Court ${matchData.court}`;
    courtNumber.classList.add('court-number');
    const teamOne = document.createElement('div');
    teamOne.classList.add('team');
    teamOne.innerHTML = `<div>${formatPlayerName(matchData.teamOne[0])}</div><div>${formatPlayerName(matchData.teamOne[1])}</div>`;
    const versus = document.createElement('div');
    versus.classList.add('versus');
    versus.textContent = 'vs';
    const teamTwo = document.createElement('div');
    teamTwo.classList.add('team');
    teamTwo.innerHTML = `<div>${formatPlayerName(matchData.teamTwo[0])}</div><div>${formatPlayerName(matchData.teamTwo[1])}</div>`;
    match.appendChild(courtNumber);
    match.appendChild(teamOne);
    match.appendChild(versus);
    match.appendChild(teamTwo);
    return match;
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

