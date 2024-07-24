document.addEventListener('DOMContentLoaded', () => {
    const players = getPlayerList();

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

document.getElementById('create-matches').addEventListener('click', () => {
    const selectedPlayers = Array.from(document.querySelectorAll('#selected-players div'))
        .filter(player => !player.classList.contains('inactive'))
        .map(player => player.textContent);
    shuffleArray(selectedPlayers);
    // Target the #matches-list for clearing and adding matches
    const matchesList = document.getElementById('matches-list');
    matchesList.innerHTML = ''; // Clear only the matches list
    const matches = [];
    let restingPlayers = [];
    for (let i = 0; i < selectedPlayers.length; i += 4) {
        if (i + 3 < selectedPlayers.length) {
            const matchData = {
                court: Math.floor(i / 4) + 1, // Calculate court number
                teamOne: [selectedPlayers[i], selectedPlayers[i + 1]],
                teamTwo: [selectedPlayers[i + 2], selectedPlayers[i + 3]]
            };
            matches.push(matchData);
        } else {
            restingPlayers = selectedPlayers.slice(i);
            break; // Exit the loop as we've handled all players
        }
    }
    const dataToSave = {
        matches: matches, resting: restingPlayers
    };
    localStorage.setItem('matchesData', JSON.stringify(dataToSave));
    displaySavedMatches();
    createBouncingBalls();
});

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

    // Optionally, clear the player names display if you have a separate list for that
    document.getElementById('selected-players').innerHTML = '';

    // Close the modal after performing the actions
    const newSessionModal = bootstrap.Modal.getInstance(document.getElementById('newSessionModal'));
    newSessionModal.hide();
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
    const playerDivs = document.querySelectorAll('#selected-players div');
    const count = playerDivs.length;
    const playerCountSpan = document.getElementById("player-count");
    playerCountSpan.textContent = `(${count})`;
}

function addSelectedPlayers() {
    const savedSelectedPlayers = JSON.parse(localStorage.getItem('selectedPlayers'));
    if (savedSelectedPlayers && savedSelectedPlayers.length > 0) {
        const playerNamesContainer = document.getElementById('selected-players');
        playerNamesContainer.innerHTML = ''; // Clear the container before adding updated items
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

function getPlayerList() {
    let players = getPlayerFromStorage();
    if (!players) {
        players = ["Rod Berwick", "Bill Wallace", "David Phillips", "Wayne Perry", "Anthony Mina", "Gary Hodgson", "Wal Merak", "Sue Withers", "Tom Sullivan", "Alton Bowen", "Greg Nordsvan", "Stewart Johnston", "Andrus Tonismae", "Dave Williams", "Ian Manning", "Peter Rufford", "Pat Dunkin", "Mark Bailey", "John Reeves", "Bob Bear", "Peter Beiers", "Lukas Walkow", "Allan Large", "Paul Warwick", "Peter Oliver", "Maurie Barry", "Brian Morgan", "Graham Harding", "Peter Amodio", "Ron Graham", "Andrew Kirkup", "John Dring", "Mark Porter", "Ross Leonard", "Fred Hodges", "Peter Hart", "Greg Mccabe", "Lloyd Newlands"];
        savePlayersInStorage(players);
    }
    players.sort((a, b) => a.localeCompare(b));
    return players;
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
        // Check if the clicked element has the class 'selected-player'
        if (event.target.classList.contains('selected-player')) {
            const playerElement = event.target;
            const playerName = playerElement.textContent; // Assuming the player's name is the text content of the clicked element
            const savedSelectedPlayers = JSON.parse(localStorage.getItem('selectedPlayers')) || [];
            // Find the player in the savedSelectedPlayers array
            const playerIndex = savedSelectedPlayers.findIndex(player => player.playerName === playerName);
            if (playerIndex !== -1) {
                // Toggle the 'inactive' class on the player element
                if (playerElement.classList.contains('inactive')) {
                    playerElement.classList.remove('inactive');
                    // Remove the 'inactive' property from the player object
                    delete savedSelectedPlayers[playerIndex].inactive;
                } else {
                    playerElement.classList.add('inactive');
                    // Add the 'inactive' property to the player object
                    savedSelectedPlayers[playerIndex].inactive = true;
                }
                // Update localStorage with the modified savedSelectedPlayers array
                localStorage.setItem('selectedPlayers', JSON.stringify(savedSelectedPlayers));
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

