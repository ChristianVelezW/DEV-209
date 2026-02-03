const state = {
    gridSize: 4,
    cards: [],
    flippedCards: [],
    matchedPairs: 0,
    moves: 0,
    timer: 0,
    timerInterval: null,
    isLocked: false,
    gameActive: false
};

const themes = {
    origami: [
        '001-cat.png', '002-crab.png', '003-rabbit.png', 
        '004-bird.png', '005-frog.png', '006-bird-1.png', 
        '007-heart.png', '008-fox.png', '009-house.png', 
        '010-dog.png', '011-ice-cream.png', '012-turtle.png', 
        '013-koala.png', '014-duck.png', '015-sword.png', 
        '016-koi.png', '017-swan.png', '018-tree.png', 
        '019-candy.png', '020-pine-tree.png', '021-cactus.png', 
        '022-mice.png', '023-leaf.png', '024-fish.png', 
        '025-elephant.png', '026-dress.png', '027-wreath.png', 
        '028-sun.png', '029-tower.png', '030-ribbon.png', 
        '031-star.png'  , '032-boat.png'
    ],
    pokemon: [
        '001-pikachu.png','002-snorlax.png','003-charmander.png'
        ,'004-bullbasaur.png','005-jigglypuff.png','006-psyduck.png'
        ,'007-squirtle.png','008-eevee.png','009-meowth.png',
        '010-dratini.png','011-mankey.png','012-caterpie.png',
        '013-mew.png','014-venonat.png','015-pidgey.png',
        '016-zubat.png','017-rattata.png','018-bellsprout.png'
        ,'019-pokeball.png','020-ultra-ball.png','021-pokecoin.png'
        ,'022-valor.png','023-superball.png','024-mystic.png',
        '025-instinct.png','026-mega-ball.png','027-lucky-egg.png'
        ,'028-pokebag.png','029-egg-incubator.png','030-egg.png',
        '031-pokedex.png','032-abra.png',
    ],
    food: [
        '001-orange.png','002-cherries.png','003-apple.png',
        '004-grapes.png','005-tomato.png','006-raspberry.png'
        ,'007-strawberry.png','008-blueberries.png','009-pineapple.png'
        ,'010-watermelon.png','011-coffee.png','012-tea.png',
        '013-coffee-maker.png','014-chili.png','015-broccoli.png'
        ,'016-cucumber.png','017-shrimp.png','018-cheese.png',
        '019-baguette.png','020-garlic.png','021-salad.png',
        '022-carrot.png','023-potatoes.png','024-cabbage.png',
        '025-bacon.png','026-aubergine.png','027-avocado.png',
        '028-banana.png','029-lime.png','030-pumpkin.png',
        '031-mug.png','032-coffee-1.png',
    ]
};

// Default theme 
let currentTheme = 'origami';

// DOM Elements
const boardEl = document.getElementById('game-board');
const movesEl = document.getElementById('moves');
const timerEl = document.getElementById('timer');
const restartBtn = document.getElementById('restart-btn');
const gridSizeSelect = document.getElementById('grid-size');
const themeSelect = document.getElementById('theme-select');
const modalEl = document.getElementById('game-over-modal');
const finalMovesEl = document.getElementById('final-moves');
const finalTimeEl = document.getElementById('final-time');
const modalRestartBtn = document.getElementById('modal-restart-btn');
const globalMovesEl = document.getElementById('global-moves');

// Helper: Get Theme Images
const getThemeImages = (themeName) => {
    const basePath = `assets/memorygame/themes/${themeName}/`;
    const files = themes[themeName];
    if (!files) return [];
    return files.map(fileName => basePath + fileName);
};

// --- STORAGE LOGIC ---

// 1. Session Storage (For F5 Refresh - Tab Specific)
const saveSessionState = () => {
    // We map the cards to simple objects (we can't save the DOM elements directly)
    const cardsData = state.cards.map(c => ({
        id: c.id,
        value: c.value, // This is the image path
        matched: c.matched,
        flipped: c.element.classList.contains('flipped')
    }));

    const sessionData = {
        gridSize: state.gridSize,
        currentTheme: currentTheme,
        moves: state.moves,
        timer: state.timer,
        matchedPairs: state.matchedPairs,
        cards: cardsData,
        gameActive: state.gameActive
    };
    
    sessionStorage.setItem('memoryGameState', JSON.stringify(sessionData));
};

const clearSessionState = () => {
    sessionStorage.removeItem('memoryGameState');
};

// 2. Local Storage (For Global Moves - Cross Tab)
const updateGlobalMoves = () => {
    let global = parseInt(localStorage.getItem('memoryGlobalMoves') || '0');
    global++;
    localStorage.setItem('memoryGlobalMoves', global);
    globalMovesEl.textContent = global;
};

const initGlobalMoves = () => {
    globalMovesEl.textContent = localStorage.getItem('memoryGlobalMoves') || '0';
};

// Listen for updates from other tabs
window.addEventListener('storage', (e) => {
    if (e.key === 'memoryGlobalMoves') {
        globalMovesEl.textContent = e.newValue;
    }
});

// --- GAME LOGIC ---

const startNewGame = () => {
    // When manually starting new game, we clear the saved session
    clearSessionState();
    initGame();
};

const initGame = () => {
    clearInterval(state.timerInterval);
    modalEl.style.display = 'none';
    initGlobalMoves();

    // CHECK: Is there saved data in SessionStorage?
    const savedState = sessionStorage.getItem('memoryGameState');

    if (savedState) {
        // --- RESTORE MODE ---
        const data = JSON.parse(savedState);
        
        // Restore variables
        state.gridSize = data.gridSize;
        currentTheme = data.currentTheme;
        state.moves = data.moves;
        state.timer = data.timer;
        state.matchedPairs = data.matchedPairs;
        state.gameActive = data.gameActive;
        state.flippedCards = [];
        state.isLocked = false;

        // Restore UI
        movesEl.textContent = state.moves;
        gridSizeSelect.value = state.gridSize;
        if(themeSelect) themeSelect.value = currentTheme;
        updateTimerDisplay();

        // Restore Grid Layout
        adjustGridCSS();

        // Rebuild Board from saved card data
        boardEl.innerHTML = '';
        state.cards = data.cards.map((savedCard) => {
            const cardEl = createCardElement(savedCard.value, savedCard.id);
            
            // Re-apply classes
            if (savedCard.flipped || savedCard.matched) {
                cardEl.classList.add('flipped');
            }
            if (savedCard.matched) {
                cardEl.classList.add('matched');
            }
            
            boardEl.appendChild(cardEl);

            return { 
                id: savedCard.id, 
                value: savedCard.value, 
                element: cardEl, 
                matched: savedCard.matched 
            };
        });

        // If user refreshed while cards were flipped but not matched, add them to logic array
        state.cards.forEach(card => {
            if (card.element.classList.contains('flipped') && !card.matched) {
                state.flippedCards.push(card);
            }
        });

    } else {
        // --- NEW GAME MODE ---
        state.gridSize = parseInt(gridSizeSelect.value);
        state.flippedCards = [];
        state.matchedPairs = 0;
        state.moves = 0;
        state.timer = 0;
        state.isLocked = false;
        state.gameActive = true;
        currentTheme = themeSelect ? themeSelect.value : 'origami';

        movesEl.textContent = state.moves;
        timerEl.textContent = "00:00";
        
        adjustGridCSS();
        generateCards();
    }

    startTimer();
};

const adjustGridCSS = () => {
    boardEl.style.gridTemplateColumns = `repeat(${state.gridSize}, var(--card-size))`;
    
    if (state.gridSize === 8) {
        document.documentElement.style.setProperty('--card-size', '50px');
        document.documentElement.style.setProperty('--gap-size', '8px');
    } else if (state.gridSize === 6) {
        document.documentElement.style.setProperty('--card-size', '65px');
        document.documentElement.style.setProperty('--gap-size', '10px');
    } else {
        document.documentElement.style.setProperty('--card-size', '80px');
        document.documentElement.style.setProperty('--gap-size', '15px');
    }
};

const updateTimerDisplay = () => {
    const minutes = Math.floor(state.timer / 60).toString().padStart(2, '0');
    const seconds = (state.timer % 60).toString().padStart(2, '0');
    timerEl.textContent = `${minutes}:${seconds}`;
};

const startTimer = () => {
    state.timerInterval = setInterval(() => {
        state.timer++;
        updateTimerDisplay();
        // Save state on every second (so timer persists on refresh)
        saveSessionState();
    }, 1000);
};

const generateCards = () => {
    const themeImages = getThemeImages(currentTheme);
    const totalCards = state.gridSize * state.gridSize;
    const totalPairs = totalCards / 2;
    
    const gameSymbols = themeImages.slice(0, totalPairs);
    const cardValues = [...gameSymbols, ...gameSymbols];

    for (let i = cardValues.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cardValues[i], cardValues[j]] = [cardValues[j], cardValues[i]];
    }

    boardEl.innerHTML = '';
    state.cards = cardValues.map((val, index) => {
        const card = createCardElement(val, index);
        boardEl.appendChild(card);
        return { id: index, value: val, element: card, matched: false };
    });

    saveSessionState(); // Save initial layout
};

const createCardElement = (imagePath, index) => {
    const card = document.createElement('div');
    card.classList.add('card');
    card.dataset.index = index;

    card.innerHTML = `
        <div class="card-inner">
            <div class="card-front"></div>
            <div class="card-back">
                <img src="${imagePath}" alt="card" style="width: 80%; height: 80%; object-fit: contain;">
            </div>
        </div>
    `;
    
    card.addEventListener('click', () => handleCardClick(index));
    return card;
};

const handleCardClick = (index) => {
    const clickedCard = state.cards[index];

    if (state.isLocked || 
        state.flippedCards.includes(clickedCard) || 
        clickedCard.matched) return;

    flipCard(clickedCard);
    state.flippedCards.push(clickedCard);
    
    // Save state immediately after flip
    saveSessionState();

    if (state.flippedCards.length === 2) {
        state.moves++;
        movesEl.textContent = state.moves;
        
        // Update Global Moves (Local Storage)
        updateGlobalMoves();
        
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
    state.isLocked = true;
    const [card1, card2] = state.flippedCards;

    if (card1.value === card2.value) {
        card1.matched = true;
        card2.matched = true;
        card1.element.classList.add('matched');
        card2.element.classList.add('matched');
        
        state.matchedPairs++;
        state.flippedCards = [];
        state.isLocked = false;
        
        // Save state after match
        saveSessionState();

        if (state.matchedPairs === (state.gridSize * state.gridSize) / 2) {
            gameOver();
        }
    } else {
        setTimeout(() => {
            unflipCard(card1);
            unflipCard(card2);
            state.flippedCards = [];
            state.isLocked = false;
            
            // Save state after un-flip
            saveSessionState();
        }, 1000);
    }
};

const gameOver = () => {
    clearInterval(state.timerInterval);
    state.gameActive = false;
    finalMovesEl.textContent = state.moves;
    finalTimeEl.textContent = timerEl.textContent;
    
    // Clear the specific game session so F5 starts fresh after a win
    clearSessionState();
    
    setTimeout(() => {
        modalEl.style.display = 'flex';
    }, 500);
};

// Event Listeners
restartBtn.addEventListener('click', startNewGame);

// Add listener to the modal button if it exists
if (modalRestartBtn) {
    modalRestartBtn.addEventListener('click', startNewGame);
}

gridSizeSelect.addEventListener('change', startNewGame);

if (themeSelect) {
    themeSelect.addEventListener('change', (e) => {
        currentTheme = e.target.value;
        startNewGame();
    });
}

// Start game on load
initGame();