// Build & Measure engine
// Stack blocks to match a target height/area. 5 rounds, progressive difficulty.

import type { ThemeConfig, MathParams, GameVariant } from "./engine-types"
import { baseTemplate } from "./base-template"

export function buildMeasureEngine(config: ThemeConfig, math: MathParams, variant: GameVariant = "classic"): string {
  const c = config.colors

  const gameContent = `
<div class="intro-overlay" id="intro">
  <div class="intro-box">
    <h2>${config.title}</h2>
    <p>You are a <strong>${config.character}</strong> in a <strong>${config.worldName}</strong>.</p>
    <p>Stack ${config.itemName} to reach the exact target height. Don't go over!</p>
    <button class="intro-start" onclick="document.getElementById('intro').remove(); startGame()">Play →</button>
  </div>
</div>
<div id="helpPanel" class="help-panel">
  <div class="help-content">
    <h3>How to play</h3>
    <p>Click blocks of different heights to stack them. Your tower must match the target line exactly.</p>
    <h3>Valid moves</h3><p>• Target 12: stack blocks of 5 + 4 + 3 = 12 ✅</p>
    <h3>Invalid moves</h3><p>• Target 12: stacking 5 + 4 + 4 = 13 (too tall!) ❌</p>
    <button class="help-close" onclick="document.getElementById('helpPanel').classList.remove('open')">Got it</button>
  </div>
</div>
<div class="game-header">
  <div class="game-title">${config.title}</div>
  <div class="game-stats">
    <span>Score: <strong id="scoreDisplay">0</strong></span>
    <div class="round-dots" id="roundDots"></div>
  </div>
</div>
<div class="game-area" id="gameArea">
  <div style="display: flex; align-items: flex-end; gap: 40px;">
    <!-- Tower area -->
    <div style="position: relative; width: 120px; height: 300px; border-bottom: 3px solid ${c.secondary};">
      <!-- Target line -->
      <div id="targetLine" style="position: absolute; left: -20px; right: -20px; height: 2px; background: ${c.accent}; transition: bottom 0.3s;">
        <span id="targetLabel" style="position: absolute; right: -40px; top: -8px; font-size: 12px; color: ${c.accent};"></span>
      </div>
      <!-- Stacked blocks -->
      <div id="tower" style="position: absolute; bottom: 0; left: 0; right: 0; display: flex; flex-direction: column-reverse;"></div>
      <!-- Current height -->
      <div id="heightDisplay" style="position: absolute; left: -45px; bottom: 0; font-size: 20px; font-weight: 700; color: ${c.primary}; transition: bottom 0.2s;">0</div>
    </div>
    <!-- Controls -->
    <div style="text-align: center;">
      <div style="font-size: 14px; opacity: 0.6; margin-bottom: 4px;">Target height</div>
      <div id="targetVal" style="font-size: 48px; font-weight: 700; color: ${c.accent};">0</div>
      <div style="font-size: 14px; opacity: 0.6; margin-top: 16px; margin-bottom: 8px;">Add a block</div>
      <div id="blockChoices" style="display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; max-width: 200px;"></div>
      <div style="margin-top: 16px; display: flex; gap: 8px; justify-content: center;">
        <button onclick="undoBlock()" style="padding: 8px 16px; background: ${c.secondary}33; color: ${c.text}; border: 1px solid ${c.secondary}; border-radius: 8px; font-family: inherit; cursor: pointer;">Undo</button>
        <button onclick="checkTower()" style="padding: 8px 20px; background: ${c.primary}; color: ${config.vibe === "kawaii" ? "#fff" : c.bg}; border: none; border-radius: 8px; font-family: inherit; font-weight: 700; cursor: pointer;">Done!</button>
      </div>
    </div>
  </div>
</div>
<script>
const TOTAL_ROUNDS = 5;
let currentRound = 0, targetHeight = 0, currentHeight = 0;
let stackedBlocks = [];
const PX_PER_UNIT = 15;
const BLOCK_COLORS = ['${c.primary}', '${c.accent}', '${c.secondary}', '#22c55e', '#f97316'];

function addBlock(val) {
  stackedBlocks.push(val);
  currentHeight += val;
  renderTower();
}
function undoBlock() {
  if (stackedBlocks.length === 0) return;
  currentHeight -= stackedBlocks.pop();
  renderTower();
}
function renderTower() {
  const tower = document.getElementById('tower');
  tower.innerHTML = '';
  stackedBlocks.forEach((v, i) => {
    const block = document.createElement('div');
    block.style.cssText = 'width: 100%; height: ' + (v * PX_PER_UNIT) + 'px; background: ' + BLOCK_COLORS[i % BLOCK_COLORS.length] + '; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 700; color: ${config.vibe === "kawaii" ? "#fff" : c.bg}; border-radius: 4px; margin-top: 2px;';
    block.textContent = v;
    tower.appendChild(block);
  });
  document.getElementById('heightDisplay').textContent = currentHeight;
  document.getElementById('heightDisplay').style.bottom = (currentHeight * PX_PER_UNIT) + 'px';
}
function checkTower() {
  if (currentHeight === targetHeight) {
    window.gameScore += 10 * (currentRound + 1);
    document.getElementById('scoreDisplay').textContent = window.gameScore;
    const area = document.getElementById('gameArea');
    const rect = area.getBoundingClientRect();
    spawnParticles(rect.left + rect.width/2, rect.top + rect.height/2, '${c.accent}', 12);
    addCombo();
    showScorePopup(rect.left + rect.width/2, rect.top + 50, '+' + (10 * (currentRound + 1)));
    const dots = document.querySelectorAll('.round-dot');
    if (dots[currentRound]) dots[currentRound].classList.add('done');
    currentRound++;
    if (currentRound >= TOTAL_ROUNDS) { setTimeout(() => showVictory('${config.winMessage}'), 500); }
    else { setTimeout(startRound, 800); }
  } else {
    screenShake(); resetCombo(); trackFail();
    showScorePopup(window.innerWidth/2, window.innerHeight/2, currentHeight > targetHeight ? 'Too tall!' : 'Not tall enough!');
  }
}
function startRound() { resetFails();
  stackedBlocks = []; currentHeight = 0;
  let maxBlock;
  if (currentRound < 2) { targetHeight = Math.floor(Math.random() * 8) + 6; maxBlock = 5; }
  else if (currentRound < 4) { targetHeight = Math.floor(Math.random() * 12) + 8; maxBlock = 7; }
  else { targetHeight = Math.floor(Math.random() * 15) + 10; maxBlock = 10; }
  document.getElementById('targetVal').textContent = targetHeight;
  document.getElementById('targetLine').style.bottom = (targetHeight * PX_PER_UNIT) + 'px';
  document.getElementById('targetLabel').textContent = targetHeight;
  renderTower();
  const choices = document.getElementById('blockChoices');
  choices.innerHTML = '';
  const blockSizes = [];
  for (let i = 1; i <= maxBlock; i++) blockSizes.push(i);
  blockSizes.forEach(v => {
    const btn = document.createElement('button');
    btn.textContent = v;
    btn.style.cssText = 'width: 44px; height: 44px; border-radius: 8px; border: 2px solid ${c.primary}; background: ${c.primary}22; color: ${c.text}; font-size: 18px; font-weight: 700; cursor: pointer; font-family: inherit;';
    btn.onclick = () => addBlock(v);
    choices.appendChild(btn);
  });
  const dots = document.querySelectorAll('.round-dot');
  dots.forEach((d, i) => { d.classList.remove('current'); if (i === currentRound) d.classList.add('current'); });
}
function startGame() {
  const dc = document.getElementById('roundDots'); dc.innerHTML = '';
  for (let i = 0; i < TOTAL_ROUNDS; i++) { const d = document.createElement('div'); d.className = 'round-dot'; dc.appendChild(d); }
  startRound();
}
</script>`

  // VARIANT B: Fill the Floor — drag tiles to cover area exactly
  if (variant === "variantB") {
    const vB = `
<div class="intro-overlay" id="intro"><div class="intro-box"><h2>${config.title} — Fill It</h2><p>Cover the floor with tiles! Use exactly the right number to fill the area.</p><button class="intro-start" onclick="document.getElementById('intro').remove(); startGame()">Play →</button></div></div>
<div id="helpPanel" class="help-panel"><div class="help-content"><h3>How to play</h3><p>A grid shows the area to fill. Click tiles of different sizes to place them. Fill the entire area with no gaps!</p><button class="help-close" onclick="document.getElementById('helpPanel').classList.remove('open')">Got it</button></div></div>
<div class="game-header"><div class="game-title">${config.title} — Fill</div><div class="game-stats"><span>Score: <strong id="scoreDisplay">0</strong></span><div class="round-dots" id="roundDots"></div></div></div>
<div class="game-area" id="gameArea"><div style="text-align:center;width:90%;max-width:400px;">
  <div style="font-size:14px;opacity:.6;margin-bottom:4px;">Fill the area</div>
  <div style="display:flex;justify-content:center;gap:16px;margin-bottom:12px;">
    <div><span style="opacity:.6;">Target: </span><strong id="targetArea" style="color:${c.accent};font-size:24px;"></strong><span style="opacity:.6;"> squares</span></div>
    <div><span style="opacity:.6;">Placed: </span><strong id="placedArea" style="color:${c.primary};font-size:24px;">0</strong></div>
  </div>
  <div style="display:flex;gap:8px;justify-content:center;margin-bottom:16px;" id="tileChoices"></div>
  <button onclick="undoTile()" style="margin-right:8px;padding:8px 16px;background:${c.secondary}33;color:${c.text};border:1px solid ${c.secondary};border-radius:8px;font-family:inherit;cursor:pointer;">Undo</button>
  <button onclick="checkArea()" style="padding:8px 24px;background:${c.primary};color:${config.vibe === "kawaii" ? "#fff" : c.bg};border:none;border-radius:8px;font-family:inherit;font-weight:700;cursor:pointer;">Check!</button>
</div></div>
<script>
const TR=5;let cr=0,target=0,placed=0,tiles=[];
function addTile(size){tiles.push(size);placed+=size;document.getElementById('placedArea').textContent=placed;}
function undoTile(){if(tiles.length){placed-=tiles.pop();document.getElementById('placedArea').textContent=placed;}}
function checkArea(){
  if(placed===target){window.gameScore+=10*(cr+1);document.getElementById('scoreDisplay').textContent=window.gameScore;
  spawnParticles(window.innerWidth/2,window.innerHeight/2,'${c.accent}',12);addCombo();
  const d=document.querySelectorAll('.round-dot');if(d[cr])d[cr].classList.add('done');
  cr++;if(cr>=TR){setTimeout(()=>showVictory('${config.winMessage}'),500);}else{setTimeout(sr,800);}}
  else{screenShake();resetCombo();trackFail();showScorePopup(window.innerWidth/2,window.innerHeight/2,placed>target?'Too many!':'Not enough!');}}
function sr(){resetFails();placed=0;tiles=[];document.getElementById('placedArea').textContent='0';
  target=cr<2?Math.floor(Math.random()*8)+6:cr<4?Math.floor(Math.random()*15)+10:Math.floor(Math.random()*20)+15;
  document.getElementById('targetArea').textContent=target;
  const sizes=cr<2?[1,2,3]:cr<4?[1,2,3,4,5]:[1,2,3,4,5,6];
  const ch=document.getElementById('tileChoices');ch.innerHTML='';
  sizes.forEach(s=>{const b=document.createElement('button');b.textContent=s;
  b.style.cssText='width:'+(30+s*8)+'px;height:40px;border-radius:8px;border:2px solid ${c.primary};background:${c.primary}22;color:${c.text};font-size:16px;font-weight:700;cursor:pointer;font-family:inherit;';
  b.onclick=()=>addTile(s);ch.appendChild(b);});
  const d=document.querySelectorAll('.round-dot');d.forEach((x,i)=>{x.classList.remove('current');if(i===cr)x.classList.add('current');});}
function startGame(){const dc=document.getElementById('roundDots');dc.innerHTML='';for(let i=0;i<TR;i++){const d=document.createElement('div');d.className='round-dot';dc.appendChild(d);}sr();}
</script>`
    return baseTemplate(config, vB, variant, 50)
  }

  // VARIANT C: Box Packer — fit blocks to fill exact volume
  if (variant === "variantC") {
    const vC = `
<div class="intro-overlay" id="intro"><div class="intro-box"><h2>${config.title} — Box Pack</h2><p>Pack the box! Choose blocks with the right dimensions to fill the volume exactly.</p><button class="intro-start" onclick="document.getElementById('intro').remove(); startGame()">Play →</button></div></div>
<div id="helpPanel" class="help-panel"><div class="help-content"><h3>How to play</h3><p>The box has a target volume (length × width × height). Pick blocks that add up to fill it exactly.</p><button class="help-close" onclick="document.getElementById('helpPanel').classList.remove('open')">Got it</button></div></div>
<div class="game-header"><div class="game-title">${config.title} — Pack</div><div class="game-stats"><span>Score: <strong id="scoreDisplay">0</strong></span><div class="round-dots" id="roundDots"></div></div></div>
<div class="game-area" id="gameArea"><div style="text-align:center;width:90%;max-width:400px;">
  <div id="boxInfo" style="font-size:16px;color:${c.accent};margin-bottom:8px;"></div>
  <div style="display:flex;justify-content:center;gap:16px;margin-bottom:16px;">
    <div><span style="opacity:.6;">Volume: </span><strong id="targetVol" style="color:${c.accent};font-size:28px;"></strong></div>
    <div><span style="opacity:.6;">Packed: </span><strong id="packedVol" style="color:${c.primary};font-size:28px;">0</strong></div>
  </div>
  <div id="blockChoices" style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-bottom:16px;"></div>
  <button onclick="undoBlock()" style="margin-right:8px;padding:8px 16px;background:${c.secondary}33;color:${c.text};border:1px solid ${c.secondary};border-radius:8px;font-family:inherit;cursor:pointer;">Undo</button>
  <button onclick="checkVol()" style="padding:8px 24px;background:${c.primary};color:${config.vibe === "kawaii" ? "#fff" : c.bg};border:none;border-radius:8px;font-family:inherit;font-weight:700;cursor:pointer;">Check!</button>
</div></div>
<script>
const TR=5;let cr=0,targetV=0,packed=0,blocks=[];
function addBlock(v){blocks.push(v);packed+=v;document.getElementById('packedVol').textContent=packed;}
function undoBlock(){if(blocks.length){packed-=blocks.pop();document.getElementById('packedVol').textContent=packed;}}
function checkVol(){
  if(packed===targetV){window.gameScore+=10*(cr+1);document.getElementById('scoreDisplay').textContent=window.gameScore;
  spawnParticles(window.innerWidth/2,window.innerHeight/2,'${c.accent}',12);addCombo();
  const d=document.querySelectorAll('.round-dot');if(d[cr])d[cr].classList.add('done');
  cr++;if(cr>=TR){setTimeout(()=>showVictory('${config.winMessage}'),500);}else{setTimeout(sr,800);}}
  else{screenShake();resetCombo();trackFail();}}
function sr(){resetFails();packed=0;blocks=[];document.getElementById('packedVol').textContent='0';
  const dims=[[2,3,4],[3,2,5],[4,3,2],[2,4,3],[3,3,3]];const d=dims[cr%5];targetV=d[0]*d[1]*d[2];
  document.getElementById('boxInfo').textContent='Box: '+d[0]+' × '+d[1]+' × '+d[2];
  document.getElementById('targetVol').textContent=targetV;
  const vols=[1,2,3,4,6,8,12];const ch=document.getElementById('blockChoices');ch.innerHTML='';
  vols.forEach(v=>{const b=document.createElement('button');b.textContent=v;
  b.style.cssText='width:50px;height:50px;border-radius:8px;border:2px solid ${c.primary};background:${c.primary}22;color:${c.text};font-size:18px;font-weight:700;cursor:pointer;font-family:inherit;';
  b.onclick=()=>addBlock(v);ch.appendChild(b);});
  const dots=document.querySelectorAll('.round-dot');dots.forEach((x,i)=>{x.classList.remove('current');if(i===cr)x.classList.add('current');});}
function startGame(){const dc=document.getElementById('roundDots');dc.innerHTML='';for(let i=0;i<TR;i++){const d=document.createElement('div');d.className='round-dot';dc.appendChild(d);}sr();}
</script>`
    return baseTemplate(config, vC, variant, 50)
  }

  return baseTemplate(config, gameContent, variant, 50)
}
