const display = document.querySelector('.main')

// generate 10 random numbers in the main window
for (let i = 0; i < 10; i++) {
    display.innerHTML += Math.floor(Math.random() * 100) + '<br>'
}
