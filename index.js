document.addEventListener('DOMContentLoaded', () => {
    const addPlayerButton = document.getElementById('add-player');
    const playerNamesContainer = document.getElementById('player-names');

    addPlayerButton.addEventListener('click', () => {
        const playerName = prompt('Enter the player name:');
        if (playerName) { // Check if the user entered a name
            displayPlayerName(playerName, playerNamesContainer);
        }
    });

    // Call the prepopulate function
    prepopulatePlayers(playerNamesContainer);
});

function displayPlayerName(name, container) {
    const playerElement = document.createElement('div'); // Or 'li' if you're using a list
    playerElement.textContent = name;
    container.appendChild(playerElement);
}

// Function to prepopulate the player list
function prepopulatePlayers(container) {
    for (let i = 1; i <= 30; i++) {
        displayPlayerName(`Player ${i}`, container);
    }
}