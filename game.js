const riddles = [
    { riddle: "I make and enforce laws.", answer: "Government", icon: "fas fa-landmark" },
    { riddle: "I am a person who lives in a community.", answer: "Citizen", icon: "fas fa-user" },
    { riddle: "I guide and make decisions for others.", answer: "Leader", icon: "fas fa-gavel" },
    { riddle: "I tell people what they should and shouldn't do.", answer: "Rules", icon: "fas fa-scroll" },
    { riddle: "A group of people living and working together.", answer: "Community", icon: "fas fa-users" },
    { riddle: "A system where people have the right to choose their leaders.", answer: "Democracy", icon: "fas fa-check-to-slot" }
];

// --- Game State Variables ---
let score = 0;
let availableRiddles = []; 
let currentRiddleAnswer = null;
let isFlipped = false;
let isDragging = false;
let currentRiddleIndex = 0;
let timeLeft = 20;
let timerId = null; // This will hold the ID of our interval
const INITIAL_TIME = 20; // Define the starting time constant
let canClickToFlip = true; // NEW FLAG: Controls if the riddle card can be clicked to flip

// --- NEW PROMPT VARIABLES ---
let tapPromptTimeoutId = null; // To hold the ID for the 7-second timer
const PROMPT_DELAY_MS = 10000; // 10 seconds
// ----------------------------


const riddleTextEl = document.getElementById('riddle-text');
const iconPilesContainerEl = document.getElementById('icon-piles-container');
const statusMessageEl = document.getElementById('status-message');
const scoreDisplayEl = document.getElementById('score-display');
const riddleCardEl = document.getElementById('riddle-card');
const restartButtonEl = document.getElementById('restart-button');
const endGameModalEl = document.getElementById('end-game-modal');
const finalScoreTextEl = document.getElementById('final-score-text');
const modalRestartButtonEl = document.getElementById('modal-restart-button');
const timerDisplayEl = document.getElementById('timer-display'); // New element reference
// NEW: Hand Prompt Element Reference
const tapPromptHandEl = document.getElementById('tap-prompt-hand');
const riddleDrawAreaEl = document.getElementById('riddle-draw-area');


// --- Timer Functions ---

/**
 * Updates the timer display element.
 */
const updateTimerDisplay = () => {
    // We update the content of the inner span, assuming timerDisplayEl is the container
    // and the span is 'timer-countdown' from your HTML example, if not, this still works.
    // Note: It's safer to target the span directly: document.getElementById('timer-countdown')
    // but we'll stick to the existing structure and trust the HTML wrapper:
    const countdownSpan = timerDisplayEl.querySelector('#timer-countdown');
    if (countdownSpan) {
        countdownSpan.textContent = timeLeft;
    }
};

/**
 * Stops the current timer interval.
 */
const stopTimer = () => {
    if (timerId !== null) {
        clearInterval(timerId);
        timerId = null;
    }
};

/**
 * Starts the countdown timer from INITIAL_TIME.
 */
const startTimer = () => {
    // Clear any existing timer
    stopTimer();
    
    // Reset time for the new riddle
    timeLeft = INITIAL_TIME;
    updateTimerDisplay();

    timerId = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();

        if (timeLeft <= 0) {
            stopTimer();
            handleTimeout();
        }
    }, 1000); // Countdown every second
};

/**
 * Handles the game ending when the timer runs out.
 */
const handleTimeout = () => {
    // Ensure the timer is stopped
    stopTimer();
    
    // Visually indicate timeout
    statusMessageEl.textContent = "TIME'S UP! Game Over.";
    statusMessageEl.classList.remove('text-accent-yellow');
    statusMessageEl.classList.add('text-red-300');
    
    // End the game
    endGame(true); // Pass true to indicate a timeout loss
};

// --- Tap Prompt Functions (NEW) ---

/**
 * Shows the hand prompt and sets the timeout to hide it.
 */
const showTapPrompt = () => {
    tapPromptHandEl.classList.remove('hidden');
}

/**
 * Hides the hand prompt and clears the timeout.
 */
const hideTapPrompt = () => {
    if (tapPromptTimeoutId !== null) {
        clearTimeout(tapPromptTimeoutId);
        tapPromptTimeoutId = null;
    }
    tapPromptHandEl.classList.add('hidden');
}

// --- Game Logic (Original Functions with Timer Integration) ---

/**
 * Shuffles an array using the Fisher-Yates algorithm.
 */
const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

/**
 * Loads the next riddle card.
 */
const loadNewRiddle = () => {
    // Stop the timer from the previous riddle
    stopTimer();
    
    // NEW: Clear and hide any existing tap prompt
    hideTapPrompt(); 
    
    if (availableRiddles.length === 0) {
        endGame();
        return;
    }

    // Reset card state
    isFlipped = false;
    riddleCardEl.classList.remove('flipped');
    riddleCardEl.draggable = false;
    riddleCardEl.style.opacity = 1;
    riddleCardEl.style.cursor = 'pointer';

    // Get the next riddle from the shuffled array
    const currentRiddle = availableRiddles.pop(); 
    riddleTextEl.textContent = currentRiddle.riddle;
    currentRiddleAnswer = currentRiddle.answer;

    statusMessageEl.textContent = 'Tap the card to reveal the riddle!';
    statusMessageEl.classList.remove('text-green-300', 'text-red-300');
    statusMessageEl.classList.add('text-accent-yellow');
    
    // Reset and display the timer
    timeLeft = INITIAL_TIME;
    updateTimerDisplay();
    
    // NEW: Start the 7-second timer for the tap prompt
    tapPromptTimeoutId = setTimeout(showTapPrompt, PROMPT_DELAY_MS);
}

/**
 * Creates and renders all the icon card piles (targets).
 */
const createIconPiles = () => {
    iconPilesContainerEl.innerHTML = '';
    
    // Use a copy of riddles for the icons to ensure all are displayed
    const iconChoices = [...riddles];
    shuffleArray(iconChoices); 

    iconChoices.forEach(riddle => {
        const cardContainer = document.createElement('div');
        cardContainer.className = 'card-stack flex flex-col items-center';
        
        // Get the initial of the answer word
        const initial = riddle.answer.charAt(0).toUpperCase(); // Get the first letter
        
        // This is the actual draggable card
        const cardEl = document.createElement('div');
        cardEl.className = 'icon-card-target card hover:shadow-xl transition';
        cardEl.dataset.answer = riddle.answer;
        cardEl.dataset.icon = riddle.icon;
        cardEl.draggable = true;
        
        // --- HTML STRUCTURE with initials ---
        cardEl.innerHTML = `
            <span class="card-initial top-left-initial">${initial}</span>
            <i class="fas ${riddle.icon} text-5xl mb-2"></i>
            <span class="text-sm font-bold text-center">${riddle.answer.split('/')[0]}</span>
            <span class="card-initial bottom-right-initial">${initial}</span>
        `;
        // -----------------------------------
        
        // Add Drag & Drop Listeners
        cardEl.addEventListener('dragstart', handleDragStart);
        cardEl.addEventListener('dragend', handleDragEnd);

        cardContainer.appendChild(cardEl);
        iconPilesContainerEl.appendChild(cardContainer);
    });
}

// --- Drag & Drop Handlers (Icon Cards) ---

const handleDragStart = (e) => {
    if (!isFlipped) {
        e.preventDefault(); // Cannot drag if riddle isn't flipped
        statusMessageEl.textContent = "Tap the riddle card first!";
        statusMessageEl.classList.add('text-red-300');
        setTimeout(() => clearFeedback(), 1500);
        return;
    }
    
    isDragging = true;
    canClickToFlip = false; // Block clicking while a drag is starting
    e.dataTransfer.setData('text/plain', e.target.dataset.answer);
    e.dataTransfer.effectAllowed = 'move';
    e.target.classList.add('dragging');
}

const handleDragEnd = (e) => {
    isDragging = false;
    e.target.classList.remove('dragging');
    // Re-enable clicking after a short delay to prevent click fire after drop/drag end
    setTimeout(() => {
        canClickToFlip = true;
    }, 50); 
}

// --- Drop Handlers (Riddle Card) ---

const handleRiddleDragOver = (e) => {
    if (isFlipped && isDragging) {
        e.preventDefault(); // Required to allow dropping
        riddleCardEl.classList.add('drag-over');
    }
}

const handleRiddleDragLeave = (e) => {
    riddleCardEl.classList.remove('drag-over');
}

const handleRiddleDrop = (e) => {
    e.preventDefault();
    riddleCardEl.classList.remove('drag-over');

    const draggedAnswer = e.dataTransfer.getData('text/plain');

    // Check if the drop is correct
    if (draggedAnswer === currentRiddleAnswer) {
        // Correct match - STOP THE TIMER AND RESET CARD STATE IMMEDIATELY
        stopTimer(); 
        isFlipped = false;
        riddleCardEl.classList.remove('flipped'); // Reset transform instantly
        
        score++;
        scoreDisplayEl.textContent = `Score: ${score}`;

        statusMessageEl.textContent = "MATCH! Correct profession found.";
        statusMessageEl.classList.remove('text-accent-yellow', 'text-red-300');
        statusMessageEl.classList.add('text-green-300');

        // Find the icon card that was dragged and mark it as matched
        const matchedIconCard = Array.from(iconPilesContainerEl.querySelectorAll('.icon-card-target')).find(
            card => card.dataset.answer === draggedAnswer
        );
        
        if (matchedIconCard) {
            matchedIconCard.classList.add('matched-reveal');
            matchedIconCard.draggable = false;
            matchedIconCard.style.cursor = 'default';
        }

        // Hide the riddle card (it has been "used")
        riddleCardEl.style.opacity = 0;
        
        // Load the next riddle after a short delay
        setTimeout(loadNewRiddle, 1500);

    } else {
        // Incorrect match
        statusMessageEl.textContent = "Incorrect. Try a different icon card!";
        statusMessageEl.classList.remove('text-accent-yellow', 'text-green-300');
        statusMessageEl.classList.add('text-red-300');
        setTimeout(() => clearFeedback(), 2000);
    }
}

// --- Game Control Handlers ---

const handleRiddleCardClick = () => {
    // Only allow the flip if a drag sequence hasn't just ended (using canClickToFlip)
    if (!isFlipped && canClickToFlip) {
        
        // NEW: Hide the prompt immediately when the user taps
        hideTapPrompt(); 
        
        isFlipped = true;
        riddleCardEl.classList.add('flipped');
        statusMessageEl.textContent = "Now drag the correct icon card here! Time is ticking...";
        statusMessageEl.classList.remove('text-red-300');
        statusMessageEl.classList.add('text-accent-yellow');
        
        // START THE TIMER when the card is flipped
        startTimer();
    }
    // Note: If isFlipped is true, clicking does nothing, preventing flip-flop while trying to drop.
}

const clearFeedback = () => {
    // Only reset to 'Tap to reveal' if the card is NOT flipped
    if (!isFlipped) {
        statusMessageEl.textContent = 'Tap the card to reveal the riddle!';
    } else {
        statusMessageEl.textContent = "Now drag the correct icon card here! Time is ticking...";
    }
    statusMessageEl.classList.remove('text-green-300', 'text-red-300'); 
    statusMessageEl.classList.add('text-accent-yellow');
}

const endGame = (timedOut = false) => {
    // Stop the timer regardless of how the game ended
    stopTimer(); 
    
    // NEW: Ensure the prompt is hidden when the game ends
    hideTapPrompt(); 
    
    if (timedOut) {
        finalScoreTextEl.textContent = `Time ran out! Your final score is ${score}.`;
    } else {
        // Game ended by completing all riddles
        finalScoreTextEl.textContent = `You matched ${score} out of ${riddles.length} community members!`;
    }
    
    endGameModalEl.classList.remove('hidden');
}

const startGame = () => {
    endGameModalEl.classList.add('hidden');
    score = 0;
    scoreDisplayEl.textContent = `Score: 0`;
    
    // Re-fill and shuffle the available riddles
    availableRiddles = [...riddles];
    shuffleArray(availableRiddles);

    // Initialize/Reset the icon piles
    createIconPiles();
    
    // Ensure icon cards are draggable and unfaded
    iconPilesContainerEl.querySelectorAll('.icon-card-target').forEach(card => {
        card.classList.remove('matched-reveal');
        card.draggable = true;
        card.style.cursor = 'pointer';
    });

    // Reset timer display before the first load
    timeLeft = INITIAL_TIME;
    updateTimerDisplay();

    loadNewRiddle();
}

// --- Attach Event Listeners ---

// Riddle Card Listeners (Tap-to-flip, Drop Target)
riddleDrawAreaEl.addEventListener('click', handleRiddleCardClick);
riddleDrawAreaEl.addEventListener('dragover', handleRiddleDragOver);
riddleDrawAreaEl.addEventListener('dragleave', handleRiddleDragLeave);
riddleDrawAreaEl.addEventListener('drop', handleRiddleDrop);

// Restart Buttons
restartButtonEl.addEventListener('click', startGame);
modalRestartButtonEl.addEventListener('click', startGame);

// Initialize game on load
window.onload = startGame;