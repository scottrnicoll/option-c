// Build a Structure — drag shapes to match a blueprint.

import type { ThemeConfig, MathParams, GameVariant } from "./engine-types"
import { baseTemplate } from "./base-template"

export function buildStructureEngine(config: ThemeConfig, math: MathParams, variant: GameVariant = "classic"): string {
  const c = config.colors
  const gameContent = `
<div class="intro-overlay" id="intro"><div class="intro-box"><h2>${config.title}</h2><p>You are a <strong>${config.character}</strong> in a <strong>${config.worldName}</strong>.</p><p>Pick the right shapes to build the ${config.targetName}!</p><button class="intro-start" onclick="document.getElementById('intro').remove(); startGame()">Play →</button></div></div>
<div id="helpPanel" class="help-panel"><div class="help-content"><h3>How to play</h3><p>A blueprint shows which shapes you need. Click the matching shapes from the bank to build it. Get all the shapes right!</p><button class="help-close" onclick="document.getElementById('helpPanel').classList.remove('open')">Got it</button></div></div>
<div class="game-header"><div class="game-title">${config.title}</div><div class="game-stats"><span>Score: <strong id="scoreDisplay">0</strong></span><div class="round-dots" id="roundDots"></div></div></div>
<div class="game-area" id="gameArea">
  <div style="display: flex; gap: 40px; align-items: flex-start;">
    <!-- Blueprint -->
    <div style="text-align: center;">
      <div style="font-size: 12px; opacity: 0.5; margin-bottom: 8px;">BLUEPRINT</div>
      <div id="blueprint" style="display: flex; flex-wrap: wrap; gap: 4px; width: 160px; padding: 12px; border: 2px dashed ${c.accent}; border-radius: 12px; min-height: 100px; justify-content: center;"></div>
    </div>
    <!-- Your build -->
    <div style="text-align: center;">
      <div style="font-size: 12px; opacity: 0.5; margin-bottom: 8px;">YOUR BUILD</div>
      <div id="build" style="display: flex; flex-wrap: wrap; gap: 4px; width: 160px; padding: 12px; border: 2px solid ${c.primary}; border-radius: 12px; min-height: 100px; justify-content: center;"></div>
      <div style="margin-top: 8px; font-size: 13px;"><span id="buildCount">0</span>/<span id="needCount">0</span> pieces</div>
    </div>
  </div>
  <!-- Shape bank -->
  <div style="margin-top: 20px; text-align: center;">
    <div style="font-size: 12px; opacity: 0.5; margin-bottom: 8px;">Click shapes to add them</div>
    <div id="bank" style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;"></div>
    <div style="margin-top: 12px; display: flex; gap: 8px; justify-content: center;">
      <button onclick="undoBuild()" style="padding: 8px 16px; background: ${c.secondary}33; color: ${c.text}; border: 1px solid ${c.secondary}; border-radius: 8px; font-family: inherit; cursor: pointer;">Undo</button>
      <button onclick="checkBuild()" style="padding: 8px 24px; background: ${c.primary}; color: ${config.vibe === "kawaii" ? "#fff" : c.bg}; border: none; border-radius: 8px; font-family: inherit; font-weight: 700; cursor: pointer;">Check!</button>
    </div>
  </div>
</div>
<script>
const TOTAL_ROUNDS = 5; let currentRound = 0;
const SHAPES = [
  { name: 'square', svg: '<rect x="5" y="5" width="30" height="30" rx="3"/>', color: '${c.primary}' },
  { name: 'triangle', svg: '<polygon points="20,5 35,35 5,35"/>', color: '${c.accent}' },
  { name: 'circle', svg: '<circle cx="20" cy="20" r="15"/>', color: '#22c55e' },
  { name: 'rectangle', svg: '<rect x="2" y="10" width="36" height="20" rx="3"/>', color: '#f97316' },
  { name: 'diamond', svg: '<polygon points="20,2 38,20 20,38 2,20"/>', color: '#a855f7' },
];
let targetPieces = [], builtPieces = [];

function shapeSvg(shape, size) {
  return '<svg width="'+size+'" height="'+size+'" viewBox="0 0 40 40"><g fill="'+shape.color+'44" stroke="'+shape.color+'" stroke-width="2">'+shape.svg+'</g></svg>';
}
function addPiece(shapeIdx) {
  builtPieces.push(shapeIdx);
  renderBuild();
}
function undoBuild() { if (builtPieces.length > 0) { builtPieces.pop(); renderBuild(); } }
function renderBuild() {
  const build = document.getElementById('build'); build.innerHTML = '';
  builtPieces.forEach(idx => { const d = document.createElement('div'); d.innerHTML = shapeSvg(SHAPES[idx], 36); build.appendChild(d); });
  document.getElementById('buildCount').textContent = builtPieces.length;
}
function checkBuild() {
  if (builtPieces.length !== targetPieces.length) { showScorePopup(window.innerWidth/2, window.innerHeight/2, 'Need '+targetPieces.length+' pieces!'); return; }
  const targetSorted = [...targetPieces].sort(); const builtSorted = [...builtPieces].sort();
  let match = true;
  for (let i = 0; i < targetSorted.length; i++) { if (targetSorted[i] !== builtSorted[i]) { match = false; break; } }
  if (match) {
    window.gameScore += 10*(currentRound+1); document.getElementById('scoreDisplay').textContent = window.gameScore;
    const area = document.getElementById('gameArea'); const rect = area.getBoundingClientRect();
    spawnParticles(rect.left+rect.width/2, rect.top+rect.height/2, '${c.accent}', 12); addCombo();
    showScorePopup(rect.left+rect.width/2, rect.top+50, '+'+(10*(currentRound+1)));
    const dots = document.querySelectorAll('.round-dot'); if(dots[currentRound]) dots[currentRound].classList.add('done');
    currentRound++; if(currentRound>=TOTAL_ROUNDS){setTimeout(()=>showVictory('${config.winMessage}'),500);}else{setTimeout(startRound,800);}
  } else { screenShake(); resetCombo(); trackFail(); showScorePopup(window.innerWidth/2, window.innerHeight/2, 'Wrong shapes! Check the blueprint.'); }
}
function startRound() { resetFails();
  const pieceCount = currentRound < 2 ? 3 : currentRound < 4 ? 4 : 5;
  targetPieces = []; builtPieces = [];
  for (let i = 0; i < pieceCount; i++) targetPieces.push(Math.floor(Math.random() * SHAPES.length));
  const bp = document.getElementById('blueprint'); bp.innerHTML = '';
  targetPieces.forEach(idx => { const d = document.createElement('div'); d.innerHTML = shapeSvg(SHAPES[idx], 36); bp.appendChild(d); });
  document.getElementById('needCount').textContent = pieceCount;
  renderBuild();
  const bank = document.getElementById('bank'); bank.innerHTML = '';
  SHAPES.forEach((s, i) => {
    const btn = document.createElement('button');
    btn.style.cssText = 'padding: 8px; border: 2px solid ${c.secondary}44; border-radius: 8px; background: transparent; cursor: pointer; transition: all 0.15s;';
    btn.innerHTML = shapeSvg(s, 40);
    btn.onclick = () => addPiece(i);
    bank.appendChild(btn);
  });
  const dots = document.querySelectorAll('.round-dot'); dots.forEach((d,i)=>{d.classList.remove('current');if(i===currentRound)d.classList.add('current');});
}
function startGame(){
</script>`
  return baseTemplate(config, gameContent, variant, 40)
}
