function playHitEffects(cell, ship){
  const rect = cell.getBoundingClientRect();
  
  // Criar a animação da flecha
  const arrow = document.createElement('div');
  arrow.style.position = 'fixed';
  arrow.style.width = '60px';
  arrow.style.height = '60px';
  arrow.style.backgroundImage = "url('imagens/flecha.png')";
  arrow.style.backgroundSize = 'contain';
  arrow.style.backgroundRepeat = 'no-repeat';
  arrow.style.backgroundPosition = 'center';
  arrow.style.zIndex = '9999';
  arrow.style.pointerEvents = 'none';
  arrow.style.filter = 'drop-shadow(0 0 8px rgba(212, 175, 55, 0.8))';
  
  // Posição inicial (topo da tela, centro horizontal)
  const startX = window.innerWidth / 2 - 30;
  const startY = -60;
  arrow.style.left = startX + 'px';
  arrow.style.top = startY + 'px';
  arrow.style.transform = 'rotate(45deg) scale(1)';
  arrow.style.transition = 'all 0.6s ease-in';
  arrow.style.opacity = '1';
  
  document.body.appendChild(arrow);
  
  // Forcar reflow
  arrow.offsetHeight;
  
  // Animar a flecha para o quadrado
  arrow.style.left = (rect.left + rect.width / 2 - 30) + 'px';
  arrow.style.top = (rect.top + rect.height / 2 - 30) + 'px';
  arrow.style.opacity = '0.8';
  
  // Remover a flecha após a animação
  setTimeout(() => {
    arrow.style.opacity = '0';
    arrow.style.transition = 'opacity 0.2s ease-out';
    setTimeout(() => arrow.remove(), 200);
  }, 600);
  
  // Som da flecha
  audioFlecha.currentTime = 0;
  audioFlecha.play().catch(() => {});
  
  // Som da explosão (quando a flecha atingir)
  setTimeout(() => {
    audioExplode.currentTime = 0;
    audioExplode.play().catch(() => {});
  }, 600);
}

// Função para animar a seta em ataques que erram
function playMissEffects(cell){
  console.log("playMissEffects chamado, tentando tocar audioSplash"); // Log para debug
  const rect = cell.getBoundingClientRect();
  
  // Criar a animação da flecha
  const arrow = document.createElement('div');
  arrow.style.position = 'fixed';
  arrow.style.width = '60px';
  arrow.style.height = '60px';
  arrow.style.backgroundImage = "url('imagens/flecha.png')";
  arrow.style.backgroundSize = 'contain';
  arrow.style.backgroundRepeat = 'no-repeat';
  arrow.style.backgroundPosition = 'center';
  arrow.style.zIndex = '9999';
  arrow.style.pointerEvents = 'none';
  arrow.style.filter = 'drop-shadow(0 0 8px rgba(100, 150, 200, 0.6))';
  
  // Posição inicial (topo da tela, centro horizontal)
  const startX = window.innerWidth / 2 - 30;
  const startY = -60;
  arrow.style.left = startX + 'px';
  arrow.style.top = startY + 'px';
  arrow.style.transform = 'rotate(45deg) scale(1)';
  arrow.style.transition = 'all 0.6s ease-in';
  arrow.style.opacity = '1';
  
  document.body.appendChild(arrow);
  
  // Forcar reflow
  arrow.offsetHeight;
  
  // Animar a flecha para o quadrado
  arrow.style.left = (rect.left + rect.width / 2 - 30) + 'px';
  arrow.style.top = (rect.top + rect.height / 2 - 30) + 'px';
  arrow.style.opacity = '0.6';
  
  // Remover a flecha após a animação
  setTimeout(() => {
    arrow.style.opacity = '0';
    arrow.style.transition = 'opacity 0.2s ease-out';
    setTimeout(() => arrow.remove(), 200);
  }, 600);
  
  // Som da flecha
  if(audioFlecha) audioFlecha.currentTime = 0; 
  if(audioFlecha) audioFlecha.play().catch(() => {});
  
  // Som da onda (splash)
  if(audioSplash) audioSplash.volume = 0.8;
  setTimeout(() => {
    if(audioSplash) audioSplash.currentTime = 0;
    if(audioSplash) audioSplash.play().catch(()=>{});
  }, 50); // Pequeno delay para evitar conflitos
}

function shakeScreen(){
  document.body.animate([{transform:'translateY(0)'},{transform:'translateY(-8px)'},{transform:'translateY(0)'}], { duration:300, iterations:1 });
}

function switchPlayerTurn(){
  currentPlayer = (currentPlayer===player1) ? player2 : player1;
  updateTurnDisplay();
  if(vsCPU && currentPlayer===player2){
    scheduleAITurn();
  }
}

function updateTurnDisplay(){
  turnNameSpan.textContent = currentPlayer.name;
  turnBanner.classList.add('pulse');
  setTimeout(()=> turnBanner.classList.remove('pulse'),600);
  updateHud();
}

function updateHud(){
  p1Info.textContent = `${player1.name} — ${player1.score} pts`; p2Info.textContent = `${player2.name} — ${player2.score} pts`;
  updateFleetIcons();
}

function updateFleetIcons(){
  // Verificar se os elementos existem antes de atualizar
  if(p1Fleet && p2Fleet){
    p1Fleet.innerHTML = ''; p2Fleet.innerHTML='';
    player1.ships.forEach(s=>{ const ic=document.createElement('div'); ic.className='fleet-icon'; ic.title=s.name; ic.textContent='⛵'; p1Fleet.appendChild(ic); });
    player2.ships.forEach(s=>{ const ic=document.createElement('div'); ic.className='fleet-icon'; ic.title=s.name; ic.textContent='⛵'; p2Fleet.appendChild(ic); });
  }
}

function endGame(winner){
  winnerDisplay.textContent = `${winner.name} conquistou os mares gelados!`;
  audioTrovao.play().catch(()=>{});
  audioFuria.play().catch(()=>{});
  showScreen(endScreen);
}

restartGameButton.addEventListener('click', ()=>{
  location.reload();
});

showScreen(cinemaIntro);
// Tentar tocar o som da tela inicial
setTimeout(() => {
  playIntroSound();
}, 100);
