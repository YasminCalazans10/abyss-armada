
const cinemaIntro = document.getElementById('cinema-intro');
const introContinue = document.getElementById('intro-continue');
const levelScreen = document.getElementById('level-screen');
const startScreen = document.getElementById('start-screen');
const placementScreen = document.getElementById('placement-screen');
const gameScreen = document.getElementById('game-screen');
const endScreen = document.getElementById('end-screen');

const player1NameInput = document.getElementById('player1-name');
const player2NameInput = document.getElementById('player2-name');
const levelEasyButton = document.getElementById('level-easy');
const levelMediumButton = document.getElementById('level-medium');
const levelHardButton = document.getElementById('level-hard');
const startGameButton = document.getElementById('start-game-button');
const quickModeButton = document.getElementById('quick-mode');
const vsCpuButton = document.getElementById('vs-cpu');
const restartGameButton = document.getElementById('restart-game-button');

const placementPlayerName = document.getElementById('placement-player-name');
const shipsToPlaceContainer = document.getElementById('ships-to-place');
const rotateShipButton = document.getElementById('rotate-ship-button');
const confirmPlacementButton = document.getElementById('confirm-placement-button');
const placementGrid = document.getElementById('placement-grid');

const player1Grid = document.getElementById('player1-grid');
const player2Grid = document.getElementById('player2-grid');
const currentPlayer1Display = document.getElementById('current-player1');
const currentPlayer2Display = document.getElementById('current-player2');
const turnBanner = document.getElementById('turn-banner');
const turnNameSpan = document.getElementById('turn-name');
const comboCountSpan = document.getElementById('combo-count');
const p1Info = document.getElementById('p1-info');
const p2Info = document.getElementById('p2-info');
const p1Fleet = document.getElementById('p1-fleet');
const p2Fleet = document.getElementById('p2-fleet');
const winnerDisplay = document.getElementById('winner-display');

// Audio
const audioInicio = document.getElementById('audio-inicio');
const audioBase = document.getElementById('audio-base');
const audioMarine = document.getElementById('audio-marine');
const audioTrovao = document.getElementById('audio-trovao');
const audioFlecha = document.getElementById('audio-flecha');
const audioExplode = document.getElementById('audio-explode');
const audioFuria = document.getElementById('audio-furia');
const audioGrito = document.getElementById('audio-grito');
const audioSplash = document.getElementById('audio-splash');

// Game state
let gameBoardSize = 10;
let selectedLevel = null;
let allShips = [];

// Configurações de níveis
const levelConfigs = {
  easy: {
    boardSize: 4,
    ships: [
      { id:'knarr', name:'Knarr', size:2, img:'navio1.png' },
      { id:'karve', name:'Karve', size:1, img:'navio2.png' }
    ]
  },
  medium: {
    boardSize: 6,
    ships: [
      { id:'longship', name:'Barco Longo', size:4, img:'navio1.png' },
      { id:'drakkar', name:'Drakkar', size:3, img:'navio2.png' },
      { id:'knarr', name:'Knarr', size:2, img:'navio1.png' },
      { id:'karve', name:'Karve', size:1, img:'navio2.png' }
    ]
  },
  hard: {
    boardSize: 12,
    ships: [
      { id:'longship', name:'Barco Longo', size:4, img:'navio1.png' },
      { id:'drakkar', name:'Drakkar', size:3, img:'navio2.png' },
      { id:'knarr', name:'Knarr', size:2, img:'navio1.png' },
      { id:'byrding', name:'Byrding', size:2, img:'navio2.png' },
      { id:'karve', name:'Karve', size:1, img:'navio2.png' },
      { id:'snekkja', name:'Snekkja', size:3, img:'navio1.png' }
    ]
  }
};

let player1 = { name:'Ragnar Lothbrok', ships:[], score:0, hits:0, combo:0 };
let player2 = { name:'Ivar, o Desossado', ships:[], score:0, hits:0, combo:0 };
let currentPlayer = null;
let placingPlayer = null;
let shipsToPlace = [];
let selectedShip = null;
let isHorizontal = true;
let quickMode = false;
let vsCPU = false;


let aiTargets = []; // remaining possible targets for AI
let aiPriority = []; // prioritized targets (neighbors after a hit)
let aiThinkingDelay = 600; // ms


function showScreen(screen){
  [cinemaIntro,levelScreen,startScreen,placementScreen,gameScreen,endScreen].forEach(s=>s.classList.remove('active'));
  screen.classList.add('active');
}


introContinue.addEventListener('click', ()=>{
  audioInicio.pause();
  if(audioBase) audioBase.volume = 0.4; // Ajustar volume para 0.4
  audioBase.play().catch(()=>{});
  setTimeout(()=>{ if(audioTrovao) audioTrovao.play().catch(()=>{}); }, 200);
  showScreen(levelScreen);
});

levelEasyButton.addEventListener('click', ()=>{ 
  selectedLevel = 'easy';
  applyLevelConfig('easy');
  showScreen(startScreen);
});

levelMediumButton.addEventListener('click', ()=>{ 
  selectedLevel = 'medium';
  applyLevelConfig('medium');
  showScreen(startScreen);
});

levelHardButton.addEventListener('click', ()=>{ 
  selectedLevel = 'hard';
  applyLevelConfig('hard');
  showScreen(startScreen);
});

function applyLevelConfig(level){
  const config = levelConfigs[level];
  gameBoardSize = config.boardSize;
  allShips = config.ships.map(s=>({...s}));
  
  // Ajustar tamanho das células baseado no tamanho do tabuleiro
  const cellSize = gameBoardSize <= 6 ? 50 : gameBoardSize <= 10 ? 40 : 35;
  document.documentElement.style.setProperty('--cell-size', `${cellSize}px`);
  document.documentElement.style.setProperty('--grid-size', gameBoardSize);
  
  // Aplicar CSS dinâmico aos grids
  const style = document.createElement('style');
  style.id = 'dynamic-grid-style';
  const existingStyle = document.getElementById('dynamic-grid-style');
  if(existingStyle) existingStyle.remove();
  
  style.textContent = `
    .grid {
      grid-template-columns: repeat(${gameBoardSize}, ${cellSize}px) !important;
      grid-auto-rows: ${cellSize}px !important;
    }
    .cell {
      width: ${cellSize}px !important;
      height: ${cellSize}px !important;
    }
  `;
  document.head.appendChild(style);
}

// Tocar som de introdução ao carregar ou quando a tela inicial aparecer
function playIntroSound(){
  if(audioInicio){
    audioInicio.currentTime = 66; // Começar a partir de 1:06 (66 segundos)
    audioInicio.play().catch(()=>{});
  }
}

// Tentar tocar quando a página carregar (após interação do usuário)
document.addEventListener('click', ()=>{
  playIntroSound();
},{ once:true });

// Start or quick mode
startGameButton.addEventListener('click', ()=>{ vsCPU=false; quickMode=false; startMatch(); });
quickModeButton.addEventListener('click', ()=>{ quickMode=true; vsCPU=false; startMatch(); });
vsCpuButton.addEventListener('click', ()=>{ vsCPU=true; quickMode=false; startMatch(); });

function startMatch(){
  player1.name = player1NameInput.value || 'Ragnar Lothbrok';
  player2.name = vsCPU ? 'Loki, o Traiçoeiro' : (player2NameInput.value || 'Ivar, o Desossado');
  
  // Criar novos arrays completamente independentes para cada jogador
  player1.ships = [];
  player2.ships = [];
  player1.score = 0;
  player2.score = 0;
  player1.combo = 0;
  player2.combo = 0;
  player1.hits = 0;
  player2.hits = 0;
  
  currentPlayer = player1;
  p1Info.textContent = `${player1.name} — ${player1.score} pts`;
  p2Info.textContent = `${player2.name} — ${player2.score} pts`;
  currentPlayer1Display.textContent = player1.name;
  currentPlayer2Display.textContent = player2.name;

  // Resetar posições usadas para novo jogo
  usedPositions.clear();

 
  if(quickMode){
    // Garantir que cada jogador tenha navios completamente independentes
    placeShipsRandomly(player1);
    // Pequeno delay para garantir sequências diferentes
    setTimeout(() => {
      placeShipsRandomly(player2);
      setupBattle();
    }, 10);
    return;
  }

  
  if(vsCPU){
    placeShipsRandomly(player2);
    startPlacementPhase(player1);
  } else {
    startPlacementPhase(player1);
  }
}
