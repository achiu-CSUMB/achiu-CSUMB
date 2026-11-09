//Event Listeners
document.querySelector("#guessBtn").addEventListener("click", checkGuess);
document.querySelector("#resetBtn").addEventListener("click", initializeGame);

//Global variables
let randomNumber;
let attempts = 0;
const maxAttempts = 7;
let totalWins = 0;    // persists across games (not reset in initializeGame)
let totalLosses = 0;

initializeGame();

function initializeGame() {
   randomNumber = Math.floor(Math.random() * 99) + 1;
   console.log("Random number: " + randomNumber);
   attempts = 0;

   //hiding the Reset button
   document.querySelector("#resetBtn").style.display = "none";

   //Showing the Guess button
   document.querySelector("#guessBtn").style.display = "inline";

   let playerGuess = document.querySelector("#playerGuess");
   playerGuess.disabled = false;
   playerGuess.value = "";
   playerGuess.focus();

   let feedback = document.querySelector("#feedback");
   feedback.textContent = "";

   document.querySelector("#guesses").textContent = "";

   updateAttemptsLeft();
   updateScoreboard();
}

function checkGuess(){
    let feedback = document.querySelector("#feedback");
    feedback.textContent = "";
    let guess = Number(document.querySelector("#playerGuess").value);
    console.log("Player guess: " + guess);

    // Rejects empty input, non-numbers, decimals, and out-of-range values
    if (!Number.isInteger(guess) || guess < 1 || guess > 99) {
        feedback.textContent = "Enter a number between 1 and 99";
        feedback.style.color = "red";
        return;
    }

    attempts++;
    console.log("Attempts:" + attempts);
    updateAttemptsLeft();

    feedback.style.color = "orange";
    if (guess == randomNumber) {
        feedback.textContent = "You guessed it! You Won!";
        feedback.style.color = "darkgreen";
        totalWins++;
        gameOver();
    } else {
        document.querySelector("#guesses").textContent += guess + " ";
        if (attempts == maxAttempts) {
            feedback.textContent = "Sorry, you lost! The number was " + randomNumber;
            feedback.style.color = "red";
            totalLosses++;
            gameOver();
        } else if (guess > randomNumber) {
            feedback.textContent = "Guess was high";
        } else {
            feedback.textContent = "Guess was low";
        }
    }

    // Clear the box so the next guess can be typed right away
    let playerGuess = document.querySelector("#playerGuess");
    playerGuess.value = "";
    playerGuess.focus();
}

function updateAttemptsLeft() {
    document.querySelector("#attemptsLeftCount").textContent = maxAttempts - attempts;
}

function updateScoreboard() {
    document.querySelector("#wins").textContent = totalWins;
    document.querySelector("#losses").textContent = totalLosses;
}

function gameOver(){
    let guessBtn = document.querySelector("#guessBtn");
    let resetBtn = document.querySelector("#resetBtn");
    guessBtn.style.display = "none";
    resetBtn.style.display = "inline";
    document.querySelector("#playerGuess").disabled = true;
    updateScoreboard();
}