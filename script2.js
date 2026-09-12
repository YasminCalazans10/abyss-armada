
function startPlacementPhase(player){
  placingPlayer = player;
  shipsToPlace = allShips.map(s=>({...s}));
  selectedShip = null;
  isHorizontal = true;
  placementPlayerName.textContent = `Posicionamento — ${placingPlayer.name}`;
  confirmPlacementButton.disabled = true;
  createPlacementGrid();
  renderShipsToPlace();
  showScreen(placementScreen);
  audioMarine.play().catch(()=>{});
}


function createPlacementGrid(){
  placementGrid.innerHTML='';
  for(let i=0;i<gameBoardSize*gameBoardSize;i++){
    const cell=document.createElement('div');
    cell.className='cell';
    cell.dataset.id=i;
    cell.addEventListener('mouseover', handleMouseOverPlacement);
    cell.addEventListener('mouseout', handleMouseOutPlacement);
    cell.addEventListener('click', handlePlaceShip);
    placementGrid.appendChild(cell);
  }
}


function renderShipsToPlace(){
  shipsToPlaceContainer.innerHTML='';
  if(shipsToPlace.length > 0){
    shipsToPlace.forEach(s=>{
      const el=document.createElement('div');
      el.className='ship-selector';
      el.textContent=`${s.name} (${s.size})`;
      el.dataset.shipId=s.id;
      el.addEventListener('click', ()=>{ selectShip(s); });
      shipsToPlaceContainer.appendChild(el);
    });
    selectShip(shipsToPlace[0]); // Seleciona o primeiro navio restante
    rotateShipButton.disabled = false; // Habilita o botão de rotação
  } else {
    shipsToPlaceContainer.textContent='Todos posicionados';
    confirmPlacementButton.disabled=false;
    selectedShip = null; // Nenhum navio selecionado
    rotateShipButton.disabled = true; // Desabilita o botão de rotação
  }
}

function selectShip(ship){
  selectedShip=ship;
  document.querySelectorAll('.ship-selector').forEach(e=>e.classList.remove('selected'));
  const el=document.querySelector(`.ship-selector[data-ship-id="${ship.id}"]`);
  if(el) el.classList.add('selected');
}

function getShipPlacementCells(startCellId, shipSize, isHoriz){
  const cells=[];
  const r=Math.floor(startCellId/gameBoardSize);
  const c=startCellId%gameBoardSize;
  for(let i=0;i<shipSize;i++){
    const cc = isHoriz ? c+i : c;
    const rr = isHoriz ? r : r+i;
    if(cc>=gameBoardSize || rr>=gameBoardSize) return null;
    cells.push(rr*gameBoardSize+cc);
  }
  return cells;
}

function isValidPlacement(startCellId, shipSize, isHoriz, playerShips){
  const proposed = getShipPlacementCells(startCellId, shipSize, isHoriz);
  if(!proposed) return false;
  for(const ps of playerShips){
    for(const pc of proposed){
      if(ps.cells.includes(pc)) return false;
    }
  }
  return true;
}

function handleMouseOverPlacement(e){
  if(!selectedShip) return;
  const id=parseInt(e.target.dataset.id);
  const cells = getShipPlacementCells(id, selectedShip.size, isHorizontal);
  if(!cells) return;
  const valid = isValidPlacement(id, selectedShip.size, isHorizontal, placingPlayer.ships);
  cells.forEach(i=>{
    const ce=placementGrid.children[i];
    if(ce){ ce.classList.add(valid ? 'placement-preview' : 'invalid'); }
  });
}

function handleMouseOutPlacement(){
  Array.from(placementGrid.children).forEach(c=> c.classList.remove('placement-preview','invalid'));
}

function handlePlaceShip(e){
  if(!selectedShip){ alert('Selecione um navio.'); return; }
  const start = parseInt(e.target.dataset.id);
  const proposed = getShipPlacementCells(start, selectedShip.size, isHorizontal);
  if(!proposed || !isValidPlacement(start, selectedShip.size, isHorizontal, placingPlayer.ships)) { alert('Posição inválida.'); return; }
  // Criar uma cópia completa e independente do navio
  const newShip = {
    id: selectedShip.id,
    name: selectedShip.name,
    size: selectedShip.size,
    img: selectedShip.img,
    cells: [...proposed], // Cópia do array de células
    hits: [] // Array vazio independente
  };
  placingPlayer.ships.push(newShip);
  proposed.forEach(i=>{
    const c = placementGrid.children[i];
    c.classList.add('ship'); c.style.backgroundImage=`url('imagens/${selectedShip.img}')`;
  });
  shipsToPlace = shipsToPlace.filter(s=> s.id!==selectedShip.id);
  renderShipsToPlace();
  handleMouseOutPlacement();
  if(shipsToPlace.length===0){
    confirmPlacementButton.disabled=false;
  }
}

// rotate button
rotateShipButton.addEventListener('click', ()=>{ isHorizontal=!isHorizontal; })

// confirm placement
confirmPlacementButton.addEventListener('click', ()=>{
  if(placingPlayer===player1){
    // after player1 finishes, either show placement for player2 (human) or start battle if vsCPU
    if(vsCPU){
      setupBattle();
    } else {
      startPlacementPhase(player2);
    }
  } else {
    setupBattle();
  }
});


// Armazenar posições já usadas para evitar repetição entre jogadores
let usedPositions = new Set();
let randomCallCounter = 0;

// Função auxiliar para gerar número aleatório único baseado no jogador
function getUniqueRandom(player, max){
  randomCallCounter++;
  const playerId = player === player1 ? 123456 : 789012;
  const timestamp = Date.now();
  const randomSeed = Math.random() * 1000000;
  // Combinar múltiplos fatores para garantir unicidade: playerId, timestamp, randomSeed e contador
  const uniqueValue = (playerId * 10000 + timestamp % 100000 + randomSeed + randomCallCounter * 1000) % 1000000;
  return Math.floor((uniqueValue / 1000000) * max);
}

function placeShipsRandomly(player){
  player.ships = [];
  const triesLimit = 2000;
  
  // Resetar contador para cada jogador
  randomCallCounter = 0;
  
  // Criar um conjunto de posições usadas para este jogador
  const playerUsedCells = new Set();
  
  // Adicionar um pequeno delay baseado no jogador para garantir sequências diferentes
  const playerOffset = player === player1 ? 0 : 100;
  
  for(const ship of allShips){
    let placed=false;
    let tries=0;
    while(!placed && tries<triesLimit){
      tries++;
      
      // Usar múltiplas chamadas de Math.random() para garantir aleatoriedade
      // Combinar com offset do jogador para garantir diferença
      const random1 = Math.random();
      const random2 = Math.random();
      const random3 = Math.random();
      
      // Combinar múltiplos valores aleatórios com offset do jogador
      const combinedRandom = (random1 * 1000 + random2 * 100 + random3 * 10 + playerOffset + tries) % 1;
      
      const orientation = combinedRandom < 0.5;
      const start = Math.floor(combinedRandom * (gameBoardSize * gameBoardSize));
      const cells = getShipPlacementCells(start, ship.size, orientation);
      
      if(!cells) continue;
      
      // Verificar se alguma célula já foi usada por este jogador
      let overlap=false;
      for(const c of cells){
        if(playerUsedCells.has(c)){
          overlap=true;
          break;
        }
      }
      if(overlap) continue;
      
      // Verificar overlap com navios já posicionados
      for(const s of player.ships){
        for(const c of cells) {
          if(s.cells.includes(c)) { 
            overlap=true; 
            break; 
          }
        }
        if(overlap) break;
      }
      if(overlap) continue;
      
      // Adicionar células às usadas e posicionar o navio
      cells.forEach(c => playerUsedCells.add(c));
      // Criar uma cópia completa e independente do navio
      const newShip = {
        id: ship.id,
        name: ship.name,
        size: ship.size,
        img: ship.img,
        cells: [...cells], // Cópia do array de células
        hits: [] // Array vazio independente
      };
      player.ships.push(newShip);
      placed=true;
    }
    if(!placed) console.warn('Falha ao posicionar um navio depois de muitas tentativas.');
  }
  
  // Adicionar posições deste jogador ao conjunto global
  playerUsedCells.forEach(cell => usedPositions.add(cell));
}

