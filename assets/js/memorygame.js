/**
 * STATE MANAGEMENT
 */
const state = {
    gridSize: 4,
    cards: [],
    flippedCards: [],
    matchedPairs: 0,
    moves: 0,
    timer: 0,
    timerInterval: null,
    isLocked: false, // Prevents clicking more than 2 cards
    gameActive: false
};

// Symbols to use for the cards (Letters A-Z)
const symbols = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

/**
 * DOM ELEMENTS
 */
const boardEl = document.getElementById('game-board');
const movesEl = document.getElementById('moves');
const timerEl = document.getElementById('timer');
const restartBtn = document.getElementById('restart-btn');
const gridSizeSelect = document.getElementById('grid-size');
const modalEl = document.getElementById('game-over-modal');
const finalMovesEl = document.getElementById('final-moves');
const finalTimeEl = document.getElementById('final-time');

/**
 * GAME LOGIC
 */

// Initialize Game
const initGame = () => {
    // 1. Reset State
    clearInterval(state.timerInterval);
    state.gridSize = parseInt(gridSizeSelect.value);
    state.flippedCards = [];
    state.matchedPairs = 0;
    state.moves = 0;
    state.timer = 0;
    state.isLocked = false;
    state.gameActive = true;

    // 2. Update UI
    movesEl.textContent = state.moves;
    timerEl.textContent = "00:00";
    modalEl.style.display = 'none';
    
    // Adjust grid columns based on size
    boardEl.style.gridTemplateColumns = `repeat(${state.gridSize}, var(--card-size))`;

    // 3. Generate Cards
    generateCards();

    // 4. Start Timer
    startTimer();
};

// Timer Logic
const startTimer = () => {
    state.timerInterval = setInterval(() => {
        state.timer++;
        const minutes = Math.floor(state.timer / 60).toString().padStart(2, '0');
        const seconds = (state.timer % 60).toString().padStart(2, '0');
        timerEl.textContent = `${minutes}:${seconds}`;
    }, 1000);
};

// Generate and Shuffle Cards
const generateCards = () => {
    const totalCards = state.gridSize * state.gridSize;
    const totalPairs = totalCards / 2;
    
    // Slice needed symbols and duplicate them to create pairs
    const gameSymbols = symbols.slice(0, totalPairs);
    const cardValues = [...gameSymbols, ...gameSymbols];

    // Fisher-Yates Shuffle Algorithm
    for (let i = cardValues.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cardValues[i], cardValues[j]] = [cardValues[j], cardValues[i]];
    }

    // Clear board and render
    boardEl.innerHTML = '';
    state.cards = cardValues.map((val, index) => {
        const card = createCardElement(val, index);
        boardEl.appendChild(card);
        return { id: index, value: val, element: card, matched: false };
    });
};

// Create HTML for a single card
const createCardElement = (value, index) => {
    const card = document.createElement('div');
    card.classList.add('card');
    card.dataset.index = index;

    card.innerHTML = `
        <div class="card-inner">
            <div class="card-front"></div>
            <div class="card-back">${value}</div>
        </div>
    `;
    
    card.addEventListener('click', () => handleCardClick(index));
    return card;
};

// Handle Card Click
const handleCardClick = (index) => {
    const clickedCard = state.cards[index];

    // Guard clauses: Ignore if board locked, card already flipped, or card already matched
    if (state.isLocked || 
        state.flippedCards.includes(clickedCard) || 
        clickedCard.matched) return;

    // Flip logic
    flipCard(clickedCard);
    state.flippedCards.push(clickedCard);

    if (state.flippedCards.length === 2) {
        state.moves++;
        movesEl.textContent = state.moves;
        checkForMatch();
    }
};

const flipCard = (cardObj) => {
    cardObj.element.classList.add('flipped');
};

const unflipCard = (cardObj) => {
    cardObj.element.classList.remove('flipped');
};

const checkForMatch = () => {
    state.isLocked = true; // Lock board while checking
    const [card1, card2] = state.flippedCards;

    if (card1.value === card2.value) {
        // Match found
        card1.matched = true;
        card2.matched = true;
        card1.element.classList.add('matched');
        card2.element.classList.add('matched');
        
        state.matchedPairs++;
        state.flippedCards = [];
        state.isLocked = false;

        // Check Win Condition
        if (state.matchedPairs === (state.gridSize * state.gridSize) / 2) {
            gameOver();
        }
    } else {
        // No match
        setTimeout(() => {
            unflipCard(card1);
            unflipCard(card2);
            state.flippedCards = [];
            state.isLocked = false;
        }, 1000); // 1 second delay
    }
};

const gameOver = () => {
    clearInterval(state.timerInterval);
    state.gameActive = false;
    finalMovesEl.textContent = state.moves;
    finalTimeEl.textContent = timerEl.textContent;
    setTimeout(() => {
        modalEl.style.display = 'flex';
    }, 500);
};

/**
 * EVENT LISTENERS
 */
restartBtn.addEventListener('click', initGame);
gridSizeSelect.addEventListener('change', initGame);

// Start game on load
initGame();