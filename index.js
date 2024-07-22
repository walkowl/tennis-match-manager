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
        "Lloyd Newlands"
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

    // Add event listener to the "Add Player" button to open the modal
    const addPlayerButton = document.getElementById('add-player');
    addPlayerButton.addEventListener('click', () => {
        const addPlayerModal = new bootstrap.Modal(document.getElementById('addPlayerModal'));
        addPlayerModal.show();
    });
});

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
    shuffleArray(selectedPlayers); // Randomize the order of selected players

    const matchesContainer = document.querySelector('.matches');
    matchesContainer.innerHTML = '<div class="matches-list-label label">Matches</div>'; // Clear previous matches and add label

    // Create matches
    for (let i = 0; i < selectedPlayers.length; i += 4) {
        // Inside the loop where matches are created
        // Inside the loop where matches are created
        if (i + 3 < selectedPlayers.length) {
            const match = document.createElement('div');
            match.classList.add('match');

            // Create and append the court number header
            const courtHeader = document.createElement('div');
            courtHeader.classList.add('court-header');
            courtHeader.textContent = `Court ${i / 4 + 1}`;
            match.appendChild(courtHeader);

            const teamOne = document.createElement('div');
            teamOne.classList.add('team');
            teamOne.innerHTML = `<div>${selectedPlayers[i]}</div><div>${selectedPlayers[i + 1]}</div>`;

            const versus = document.createElement('div');
            versus.classList.add('versus');
            versus.textContent = 'vs';

            const teamTwo = document.createElement('div');
            teamTwo.classList.add('team');
            teamTwo.innerHTML = `<div>${selectedPlayers[i + 2]}</div><div>${selectedPlayers[i + 3]}</div>`;

            match.appendChild(teamOne);
            match.appendChild(versus);
            match.appendChild(teamTwo);

            matchesContainer.appendChild(match);
        } else {
            // Handle resting players
            const restingPlayers = selectedPlayers.slice(i);
            const resting = document.createElement('div');
            resting.classList.add('resting');
            resting.textContent = `Resting: ${restingPlayers.join(', ')}`;
            matchesContainer.appendChild(resting);
            break; // Exit the loop as we've handled all players
        }
    }
});