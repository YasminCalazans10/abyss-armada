function setupBattle(){
  createBoards();
  updateFleetIcons();
  updateTurnDisplay();
  showScreen(gameScreen);
  audioMarine.pause();
  audioTrovao.play().catch(()=>{});

 
  if(vsCPU){
    aiTargets = [];
    for(let i=0;i<gameBoardSize*gameBoardSize;i++) aiTargets.push(i);
    shuffleArray(aiTargets);
    aiPriority = [];
    // If CPU starts, schedule its turn
    if(currentPlayer === player2){
      scheduleAITurn();
    }
  }
}


function createBoards(){
  player1Grid.innerHTML=''; player2Grid.innerHTML='';
  for(let i=0;i<gameBoardSize*gameBoardSize;i++){
    const c1=document.createElement('div'); c1.className='cell fog'; c1.dataset.id=i; player1Grid.appendChild(c1);
    const c2=document.createElement('div'); c2.className='cell fog'; c2.dataset.id=i; player2Grid.appendChild(c2);
  }
  // attach listeners on opponent boards so currentPlayer attacks opponent
  player1Grid.addEventListener('click', (e)=>{ if(e.target.classList.contains('cell')) handleAttack(e.target); });
  player2Grid.addEventListener('click', (e)=>{ if(e.target.classList.contains('cell')) handleAttack(e.target); });
  currentPlayer = player1;
}


function getTargetAndGrid(cell){
  const parent = cell.parentElement;
  // Se clicamos no player1Grid, estamos vendo/atacando o tabuleiro do player1
  // Se clicamos no player2Grid, estamos vendo/atacando o tabuleiro do player2
  if(parent===player1Grid) return { target: player1, grid: player1Grid };
  return { target: player2, grid: player2Grid };
}


function handleAttack(cell){
  // Determinar qual jogador está sendo atacado baseado no grid clicado
  const { target, grid } = getTargetAndGrid(cell);
  const opponent = (currentPlayer===player1) ? player2 : player1;
  
  // Verificar se estamos atacando o oponente correto
  // currentPlayer deve atacar o opponent, então target deve ser opponent
  if(target !== opponent) {
    // Não permitir atacar seu próprio tabuleiro
    return;
  }
  
  if(cell.classList.contains('hit') || cell.classList.contains('miss')) return;
  
  // Garantir que a célula clicada está no grid correto
  const clickedGrid = cell.parentElement;
  if(clickedGrid !== grid) return;

  const id = parseInt(cell.dataset.id);
  let hit=false; let hitShip=null;
  
  // Garantir que estamos verificando apenas os navios do oponente correto
  // Criar uma cópia do array de navios para evitar problemas de referência
  const opponentShips = opponent.ships;
  
  // Encontrar o navio específico que foi acertado nesta célula
  for(let i = 0; i < opponentShips.length; i++){
    const s = opponentShips[i];
    // Verificar se esta célula pertence a este navio e ainda não foi acertada
    if(s && s.cells && Array.isArray(s.cells) && s.cells.includes(id)){
      if(!s.hits) s.hits = [];
      if(!s.hits.includes(id)){
        hit=true;
        hitShip=s;
        // Adicionar o hit ao array de hits do navio
        s.hits.push(id);
        break; // Parar assim que encontrar o navio correto
      }
    }
  }

  if(hit && hitShip){
    // Já verificamos que a célula pertence ao navio e não foi acertada no loop acima
    cell.classList.remove('fog');
    
    // Armazenar a imagem do navio acertado para garantir que seja a correta
    // Usar uma cópia da referência para evitar problemas
    const shipImage = hitShip.img || 'navio1.png';
    
    // Primeiro: mostrar a imagem do barco APENAS nesta célula específica
    cell.classList.add('ship');
    cell.style.backgroundImage = `url('imagens/${shipImage}')`;
    cell.style.backgroundSize = 'contain';
    cell.style.backgroundRepeat = 'no-repeat';
    cell.style.backgroundPosition = 'center';
    
    // Segundo: animar a flecha
    playHitEffects(cell, hitShip);
    
    // Terceiro: após a flecha atingir, substituir pela explosão
    setTimeout(() => {
      // Verificar se a célula ainda existe e não foi modificada
      // E garantir que estamos modificando apenas a célula correta
      if(cell && cell.classList.contains('ship') && cell.dataset.id === id.toString()){
        cell.classList.remove('ship');
        cell.classList.add('hit');
        cell.style.backgroundImage = "url('imagens/explosao.png')";
        cell.style.backgroundSize = 'cover';
        cell.style.backgroundRepeat = 'no-repeat';
        cell.style.backgroundPosition = 'center';
      }
    }, 600); // Tempo para a flecha atingir
    
    // Atualizar pontuação apenas para o jogador que está atacando
    const scoreBonus = currentPlayer.combo >= 2 ? 1 : 0;
    currentPlayer.score += 1 + scoreBonus;
    currentPlayer.combo += 1;
    comboCountSpan.textContent = currentPlayer.combo;
    if(currentPlayer.combo===2) audioFuria.play().catch(()=>{});
    audioGrito.play().catch(()=>{});

    
    // Verificar se todas as células do navio foram acertadas
    const allCellsHit = hitShip.cells.every(c => hitShip.hits.includes(c));
    if(allCellsHit){
      setTimeout(() => {
        // Usar o grid correto (onde o navio está sendo atacado)
        // Apenas atualizar as células deste navio específico
        hitShip.cells.forEach(ci=>{
          const cellEl = grid.children[ci];
          if(cellEl && !cellEl.classList.contains('hit')){
            cellEl.classList.remove('fog', 'ship'); 
            cellEl.classList.add('hit'); 
            cellEl.style.backgroundImage=`url('imagens/explosao.png')`;
            cellEl.style.backgroundSize = 'cover';
            cellEl.style.backgroundRepeat = 'no-repeat';
            cellEl.style.backgroundPosition = 'center';
          }
        });
        // Adicionar bônus de afundamento apenas uma vez
        currentPlayer.score += 2;
        shakeScreen();
      }, 650);
    }
    // check win condition
    const allSunk = opponent.ships.every(s=> s.cells.every(c=> s.hits.includes(c)));
    updateHud();
    if(allSunk){ 
      setTimeout(() => {
        endGame(currentPlayer);
      }, 700);
      return; 
    }
  } else {
    cell.classList.remove('fog'); cell.classList.add('miss');
    playMissEffects(cell);
    audioSplash.currentTime = 0; audioSplash.play().catch(()=>{});
    currentPlayer.combo = 0;
    comboCountSpan.textContent = 0;
  }

  
  if(vsCPU && currentPlayer===player2){
    const idx = aiTargets.indexOf(id);
    if(idx!==-1) aiTargets.splice(idx,1);
    if(hit){
      // add neighbors to priority queue
      addNeighborsToPriority(id);
    }
  }

  
  setTimeout(()=>{ switchPlayerTurn(); }, 700);
}

// AI helpers
function scheduleAITurn(){
  if(!vsCPU) return;
  setTimeout(()=>{ if(currentPlayer===player2) aiTakeTurn(); }, aiThinkingDelay);
}

function aiTakeTurn(){
  if(!vsCPU || currentPlayer!==player2) return;
  let targetIndex = null;
  while(aiPriority.length>0){
    const cand = aiPriority.shift();
    const el = player1Grid.children[cand];
    if(!el) continue;
    if(el.classList.contains('hit') || el.classList.contains('miss')) continue;
    targetIndex = cand; break;
  }
  if(targetIndex===null){
    while(aiTargets.length>0){
      const cand = aiTargets.shift();
      const el = player1Grid.children[cand];
      if(!el) continue;
      if(el.classList.contains('hit') || el.classList.contains('miss')) continue;
      targetIndex = cand; break;
    }
  }
  if(targetIndex===null) return; // nothing left

  updateTurnDisplay();

  const cellEl = player1Grid.children[targetIndex];
  if(cellEl) handleAttack(cellEl);

  setTimeout(()=>{
    if(currentPlayer===player2) scheduleAITurn();
  }, 900);
}

function addNeighborsToPriority(index){
  const r = Math.floor(index/gameBoardSize);
  const c = index%gameBoardSize;
  const deltas = [[1,0],[-1,0],[0,1],[0,-1]];
  deltas.forEach(d=>{
    const nr=r+d[0], nc=c+d[1];
    if(nr>=0 && nr<gameBoardSize && nc>=0 && nc<gameBoardSize){
      const ni = nr*gameBoardSize+nc;
      if(!aiPriority.includes(ni) && aiTargets.includes(ni)){
        aiPriority.push(ni);
      }
    }
  });
}

function shuffleArray(arr){ for(let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; } return arr; }

