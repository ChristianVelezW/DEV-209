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

// We need 32 pairs for 8x8 (64 cards). 
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
let currentTheme = 'origami'

// Function to get the full paths for the game
const getThemeImages = (themeName) => {
    const basePath = `assets/memorygame/themes/${themeName}/`;
    const files = themes[themeName];

    // Return the full array
    return files.map(fileName => basePath + fileName);
};

const boardEl = document.getElementById('game-board');
const movesEl = document.getElementById('moves');
const timerEl = document.getElementById('timer');
const restartBtn = document.getElementById('restart-btn');
const gridSizeSelect = document.getElementById('grid-size');
const modalEl = document.getElementById('game-over-modal');
const finalMovesEl = document.getElementById('final-moves');
const finalTimeEl = document.getElementById('final-time');

const initGame = () => {
    clearInterval(state.timerInterval);
    state.gridSize = parseInt(gridSizeSelect.value);
    state.flippedCards = [];
    state.matchedPairs = 0;
    state.moves = 0;
    state.timer = 0;
    state.isLocked = false;
    state.gameActive = true;

    movesEl.textContent = state.moves;
    timerEl.textContent = "00:00";
    modalEl.style.display = 'none';
    
    // Dynamic Grid Styling
    boardEl.style.gridTemplateColumns = `repeat(${state.gridSize}, var(--card-size))`;
    
    // Resize cards for Hard Mode (8x8) so they fit on screen
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

    generateCards();
    startTimer();
};

const startTimer = () => {
    state.timerInterval = setInterval(() => {
        state.timer++;
        const minutes = Math.floor(state.timer / 60).toString().padStart(2, '0');
        const seconds = (state.timer % 60).toString().padStart(2, '0');
        timerEl.textContent = `${minutes}:${seconds}`;
    }, 1000);
};

const generateCards = () => {

    // Get the list of images for the current theme
    const themeImages = getThemeImages(currentTheme);

    const totalCards = state.gridSize * state.gridSize;
    const totalPairs = totalCards / 2;
    
    // Slice exactly the number of emojis we need
    const gameSymbols = themeImages.slice(0, totalPairs);
    const cardValues = [...gameSymbols, ...gameSymbols];

    // Fisher-Yates Shuffle
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
};

const createCardElement = (imagePath, index) => {
    const card = document.createElement('div');
    card.classList.add('card');
    card.dataset.index = index;

    card.innerHTML = `
        <div class="card-inner">
            <div class="card-front"></div>
            <div class="card-back">
                <img src="${imagePath}" alt="card" style="width: 80%; height: 80%; object-fit: contain;"></div>
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

        if (state.matchedPairs === (state.gridSize * state.gridSize) / 2) {
            gameOver();
        }
    } else {
        setTimeout(() => {
            unflipCard(card1);
            unflipCard(card2);
            state.flippedCards = [];
            state.isLocked = false;
        }, 1000);
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

restartBtn.addEventListener('click', initGame);
gridSizeSelect.addEventListener('change', initGame);

const themeSelect = document.getElementById('theme-select');
if (themeSelect) {
    themeSelect.addEventListener('change', (e) => {
        currentTheme = e.target.value;
        initGame();
    });
}

// Start game on load
initGame();