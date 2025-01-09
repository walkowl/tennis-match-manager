let createMatchesButton = document.getElementById('create-matches');
let isTimerActive = false;
let countdownInterval = null;
let playerMatchCounts = {};
let playerPairings = {};

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
    console.log("Initializing player tracking...");
    players.forEach(player => {
        playerMatchCounts[player] = 0;
        playerPairings[player] = {};
    });
}

function updateMatchTracking(matches) {
    matches.forEach(match => {
        match.teamOne.forEach(player => {
            playerMatchCounts[player] = (playerMatchCounts[player] || 0) + 1;
            match.teamOne.forEach(teammate => {
                if (player !== teammate) {
                    playerPairings[player][teammate] = (playerPairings[player][teammate] || 0) + 1;
                }
            });
            match.teamTwo.forEach(opponent => {
                playerPairings[player][opponent] = (playerPairings[player][opponent] || 0) + 1;
            });
        });
        match.teamTwo.forEach(player => {
            playerMatchCounts[player] = (playerMatchCounts[player] || 0) + 1;
            match.teamTwo.forEach(teammate => {
                if (player !== teammate) {
                    playerPairings[player][teammate] = (playerPairings[player][teammate] || 0) + 1;
                }
            });
            match.teamOne.forEach(opponent => {
                playerPairings[player][opponent] = (playerPairings[player][opponent] || 0) + 1;
            });
        });
    });
    console.log("Player Match Counts:", playerMatchCounts);
    console.log("Player Pairings:", playerPairings);
}

function startCountdown(duration) {
    let timeRemaining = duration;
    createMatchesButton.disabled = true; // Disable the button
    createMatchesButton.textContent = `Create matches (${timeRemaining}s)`;
    countdownInterval = setInterval(() => {
        timeRemaining--;
        createMatchesButton.textContent = `Create matches (${timeRemaining}s)`;
        if (timeRemaining <= 0) {
            clearInterval(countdownInterval);
            createMatchesButton.textContent = 'Create matches';
            createMatchesButton.disabled = false; // Re-enable the button
            isTimerActive = false;
        }
    }, 1000);
}

createMatchesButton.addEventListener('click', () => {
    if (isTimerActive) return; // Exit if the timer is active
    const inactivePlayers = Array.from(document.querySelectorAll('#selected-players div'))
        .filter(player => player.classList.contains('inactive') || player.classList.contains('sitout-2') || player.classList.contains('sitout-1'))
        .map(player => player.textContent);
    if (inactivePlayers.length > 0) {
        document.getElementById('inactive-players-list').innerHTML = `The following players are marked as inactive and will not be included in the matches: </br></br> <span class="inactivePlayers">${inactivePlayers.join('</br>')}</span>`;
        const inactivePlayersModal = new bootstrap.Modal(document.getElementById('inactivePlayersModal'));
        inactivePlayersModal.show();
    } else {
        proceedWithMatchCreation(); // Proceed directly if no inactive players
    }
    // // Start the countdown timer
    // isTimerActive = true;
    // startCountdown(20); // 20 seconds countdown
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
    // Initialize player tracking data if not present
    activePlayers.forEach(player => {
        if (!(player in playerMatchCounts)) {
            playerMatchCounts[player] = 0;
        }
        if (!(player in playerPairings)) {
            playerPairings[player] = {};
        }
    });
    // Shuffle players to introduce randomness
    shuffleArray(activePlayers);
    const sortedPlayers = sortPlayersByMatchCounts(activePlayers);
    const matchesList = document.getElementById('matches-list');
    matchesList.innerHTML = '';
    const matches = [];
    let restingPlayers = [];
    for (let i = 0; i < sortedPlayers.length; i += 4) {
        if (i + 3 < sortedPlayers.length) {
            let teamOne = [sortedPlayers[i], sortedPlayers[i + 1]];
            let teamTwo = [sortedPlayers[i + 2], sortedPlayers[i + 3]];
            // Check for existing pairings and swap if necessary
            if (playerPairings[teamOne[0]][teamOne[1]] || playerPairings[teamTwo[0]][teamTwo[1]]) {
                // Try swapping players to avoid repeats
                [teamOne[1], teamTwo[0]] = [teamTwo[0], teamOne[1]];
                if (playerPairings[teamOne[0]][teamOne[1]] || playerPairings[teamTwo[0]][teamTwo[1]]) {
                    // If still problematic, try another swap
                    [teamOne[1], teamTwo[1]] = [teamTwo[1], teamOne[1]];
                }
            }
            matches.push({ court: Math.floor(i / 4) + 1, teamOne, teamTwo });
        } else {
            restingPlayers = sortedPlayers.slice(i);
            break;
        }
    }
    console.log("Created Matches:", matches);
    console.log("Resting Players:", restingPlayers);
    updateMatchTracking(matches);
    const dataToSave = { matches: matches, resting: restingPlayers };
    localStorage.setItem('matchesData', JSON.stringify(dataToSave));
    displaySavedMatches();
    createBouncingBalls();
}

function sortPlayersByMatchCounts(players) {
    return players.sort((a, b) => {
        return playerMatchCounts[a] - playerMatchCounts[b];
    });
}

function saveMatchTracking() {
    localStorage.setItem('playerMatchCounts', JSON.stringify(playerMatchCounts));
    localStorage.setItem('playerPairings', JSON.stringify(playerPairings));
}

function loadMatchTracking() {
    playerMatchCounts = JSON.parse(localStorage.getItem('playerMatchCounts')) || {};
    playerPairings = JSON.parse(localStorage.getItem('playerPairings')) || {};
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
    localStorage.removeItem('playerPairings');

    initializePlayerTracking(players);

    // Clear match tracking data
    playerMatchCounts = {};
    playerPairings = {};

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
    const savedSelectedPlayers = JSON.parse(localStorage.getItem('selectedPlayers'));
    if (savedSelectedPlayers && savedSelectedPlayers.length > 0) {
        const playerNamesContainer = document.getElementById('selected-players');
        playerNamesContainer.innerHTML = ''; // Clear the container before adding updated items
        savedSelectedPlayers.sort((a, b) => a.playerName.localeCompare(b.playerName));
        savedSelectedPlayers.forEach(player => {
            displayPlayerName(player, playerNamesContainer);
        });
    }
}


function getPlayerFromStorage() {
    let players = JSON.parse(localStorage.getItem('players'));
    if (players) {
        players.sort((a, b) => a.localeCompare(b));
    }
    return players;
}

function savePlayersInStorage(players) {
    players.sort((a, b) => a.localeCompare(b));
    localStorage.setItem('players', JSON.stringify(players));
}

function compareArrays(array1, array2) {
    return JSON.stringify(array1) === JSON.stringify(array2)
}

function getPlayerList() {
    let defaultPlayers = ["Example player 1", "Example player 2", "Example player 3"];
    // Parse the URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const listUrl = urlParams.get('players_url');
    // Attempt to get players from storage
    let players = getPlayerFromStorage();
    const overwritePlayers = urlParams.get('overwrite_players') === 'true' || compareArrays(players, defaultPlayers) === true || players === null;
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
                let fetchedPlayers = text.split('\n').map(player => player.trim()).filter(player => player);
                // Save the fetched players in storage if we're overwriting or no players were previously stored
                if (overwritePlayers || !players) {
                    savePlayersInStorage(fetchedPlayers);
                }
                console.log(fetchedPlayers.length + ' players fetched added! Enjoy!');
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
    let players = getPlayerFromStorage();
    if (editingIndex) {
        players[editingIndex] = playerName; // Edit existing player
    } else if (playerName) {
        players.push(playerName); // Add new player
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
    let names = playerName.split(' '); // Split the name into an array of [first_name, surname]
    if (names.length > 1) {
        let firstName = names[0].toUpperCase(); // Convert the first name to uppercase
        let surname = names.slice(1).join(' '); // Handle cases where there might be a middle name or multiple surnames
        return `${firstName} ${surname}`; // Combine and return the formatted name
    } else {
        // In case the playerName doesn't have a surname, just convert the entire name to uppercase
        return playerName.toUpperCase();
    }
}

function displayPlayerName(player, container) {
    const playerElement = document.createElement('div'); // Or 'li' if you're using a list
    playerElement.textContent = player.playerName;
    playerElement.classList.add('selected-player');
    if (player.inactive) {
        playerElement.classList.add('inactive');
    }
    container.appendChild(playerElement);
}

function markSelectedPredefinedPlayers() {
    const savedSelectedPlayers = JSON.parse(localStorage.getItem('selectedPlayers'));
    if (savedSelectedPlayers && savedSelectedPlayers.length > 0) {
        savedSelectedPlayers.forEach(player => {
            const playerElement = Array.from(document.querySelectorAll('.predefined-player .player-name')).find(element => element.textContent === player.playerName);
            if (playerElement) {
                playerElement.parentElement.classList.add('selected');
            }
        });
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

// Function to shuffle an array (Fisher-Yates Shuffle)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; // Swap elements
    }
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

