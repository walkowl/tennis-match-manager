document.addEventListener('DOMContentLoaded', () => {
    const predefinedPlayers = [
        "Rod Berwick",
        "Bill Wallace",
        "David Phillips",
        "Wayne Perry",
        "Anthony Mina",
        "Gary Hodgson",
        "Wal Merak",
        "Sue Withers",
        "Tom Sullivan",
        "Alton Bowen",
        "Greg Nordsvan",
        "Stewart Johnston",
        "Andrus Tonismae",
        "Dave Williams",
        "Ian Manning",
        "Peter Rufford",
        "Pat Dunkin",
        "Mark Bailey",
        "Reeves John",
        "Bob Bear",
        "Peter Beiers",
        "Lucas Walkow",
        "Allan Large",
        "Paul Warwick",
        "Peter Oliver",
        "Maurie Barry",
        "Brian Morgan",
        "Graham Harding",
        "Peter Amodio",
        "Ron Graham",
        "Andrew Kirkup",
        "John Dring",
        "Mark Porter",
        "Ross Leonard",
        "Fred Hodges",
        "Peter Hart",
        "Greg Mccabe",
        "Lloyd Newlands",
        "Z - Guest Player 1",
        "Z - Guest Player 2",
        "Z - Guest Player 3",
        "Z - Guest Player 4"
    ];
    predefinedPlayers.sort((a, b) => a.localeCompare(b));
    const predefinedPlayersList = document.getElementById('predefined-players-list');
    predefinedPlayers.forEach(player => {
        const playerElement = document.createElement('div');
        playerElement.textContent = player;
        playerElement.classList.add('predefined-player');
        playerElement.addEventListener('click', function () {
            this.classList.toggle('selected');
        });
        predefinedPlayersList.appendChild(playerElement);
    });

    const savedSelectedPlayers = JSON.parse(localStorage.getItem('selectedPlayers'));
    if (savedSelectedPlayers && savedSelectedPlayers.length > 0) {
        const playerNamesContainer = document.getElementById('player-names');
        savedSelectedPlayers.forEach(playerName => {
            displayPlayerName(playerName, playerNamesContainer);
            // Optionally, mark these players as selected in the predefined players list
            const playerElement = Array.from(document.querySelectorAll('.predefined-player')).find(element => element.textContent === playerName);
            if (playerElement) {
                playerElement.classList.add('selected');
            }
        });
    }

    const savedData = JSON.parse(localStorage.getItem('matchesData'));
    if (savedData) {
        const matchesContainer = document.querySelector('.matches');
        matchesContainer.innerHTML = '<div class="matches-list-label label">Matches</div>'; // Clear previous matches and add label
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

    // Add event listener to the "Add Player" button to open the modal
    const addPlayerButton = document.getElementById('add-player');
    addPlayerButton.addEventListener('click', () => {
        const addPlayerModal = new bootstrap.Modal(document.getElementById('addPlayerModal'));
        addPlayerModal.show();
    });
});

// Function to create a match element from match data
function createMatchElement(matchData) {
    const match = document.createElement('div');
    match.classList.add('match');
    // Include court number in the match display
    const courtNumber = document.createElement('div');
    courtNumber.textContent = `Court ${matchData.court}`;
    courtNumber.classList.add('court-number');
    const teamOne = document.createElement('div');
    teamOne.classList.add('team');
    teamOne.innerHTML = `<div>${matchData.teamOne[0]}</div><div>${matchData.teamOne[1]}</div>`;
    const versus = document.createElement('div');
    versus.classList.add('versus');
    versus.textContent = 'vs';
    const teamTwo = document.createElement('div');
    teamTwo.classList.add('team');
    teamTwo.innerHTML = `<div>${matchData.teamTwo[0]}</div><div>${matchData.teamTwo[1]}</div>`;
    match.appendChild(courtNumber);
    match.appendChild(teamOne);
    match.appendChild(versus);
    match.appendChild(teamTwo);
    return match;
}

function displayPlayerName(name, container) {
    const playerElement = document.createElement('div'); // Or 'li' if you're using a list
    playerElement.textContent = name;
    container.appendChild(playerElement);
}

document.getElementById('save-selected-players').addEventListener('click', () => {
    const selectedPlayers = document.querySelectorAll('.predefined-player.selected');
    const playerNamesContainer = document.getElementById('player-names');
    playerNamesContainer.innerHTML = ''; // Clear current list

    const selectedPlayerNames = [];
    selectedPlayers.forEach(player => {
        displayPlayerName(player.textContent, playerNamesContainer);
        selectedPlayerNames.push(player.textContent);
    });

    // Save the selected players to localStorage
    localStorage.setItem('selectedPlayers', JSON.stringify(selectedPlayerNames));

    // Close modal after saving
    const addPlayerModal = bootstrap.Modal.getInstance(document.getElementById('addPlayerModal'));
    addPlayerModal.hide();
});

// Function to shuffle an array (Fisher-Yates Shuffle)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; // Swap elements
    }
}

document.getElementById('create-matches').addEventListener('click', () => {
    const selectedPlayers = Array.from(document.querySelectorAll('.predefined-player.selected')).map(player => player.textContent);
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
            const matchElement = createMatchElement(matchData);
            matchesList.appendChild(matchElement); // Append to matches list
        } else {
            restingPlayers = selectedPlayers.slice(i);
            const resting = document.createElement('div');
            resting.classList.add('resting');
            resting.textContent = `Resting: ${restingPlayers.join(', ')}`;
            matchesList.appendChild(resting); // Append to matches list
            break; // Exit the loop as we've handled all players
        }
    }
    const dataToSave = {
        matches: matches,
        resting: restingPlayers
    };
    localStorage.setItem('matchesData', JSON.stringify(dataToSave));
});

document.getElementById('new-matches').addEventListener('click', () => {
    const confirmation = confirm("Are you sure you want to start a new session? This will unselect all players and remove all matches.");
    if (confirmation) {
        // Unselect all players
        document.querySelectorAll('.predefined-player.selected').forEach(player => {
            player.classList.remove('selected');
        });
        // Clear only the matches display, preserving the "New" button and header
        document.getElementById('matches-list').innerHTML = ''; // Clear matches
        // Clear selected players from localStorage
        localStorage.removeItem('selectedPlayers');
        // Optionally, clear the player names display if you have a separate list for that
        document.getElementById('player-names').innerHTML = '';
    }
});