// Split & Share engine
// A shape/bar is shown. Click to divide it into equal parts matching a target fraction.

import type { ThemeConfig, MathParams, GameVariant } from "./engine-types"
import { baseTemplate } from "./base-template"

export function splitShareEngine(config: ThemeConfig, math: MathParams, variant: GameVariant = "classic"): string {
  const c = config.colors
  const gameContent = `
<div class="intro-overlay" id="intro">
  <div class="intro-box">
    <h2>${config.title}</h2>
    <p>You are a <strong>${config.character}</strong> in a <strong>${config.worldName}</strong>.</p>
    <p>Split the ${config.itemName} into equal parts to match the target fraction!</p>
    <button class="intro-start" onclick="document.getElementById('intro').remove(); startGame()">Play →</button>
  </div>
</div>
<div id="helpPanel" class="help-panel"><div class="help-content">
  <h3>How to play</h3><p>Click on the bar to add cut lines. Divide it into equal parts. Then click the parts that should be shaded to match the fraction.</p>
  <h3>Example</h3><p>• For 2/4: cut the bar into 4 equal parts, then shade 2 of them ✅</p>
  <button class="help-close" onclick="document.getElementById('helpPanel').classList.remove('open')">Got it</button>
</div></div>
<div class="game-header"><div class="game-title">${config.title}</div>
  <div class="game-stats"><span>Score: <strong id="scoreDisplay">0</strong></span><div class="round-dots" id="roundDots"></div></div>
</div>
<div class="game-area" id="gameArea">
  <div style="text-align: center; width: 90%; max-width: 500px;">
    <div style="font-size: 14px; opacity: 0.6; margin-bottom: 8px;">Show this fraction</div>
    <div id="fractionDisplay" style="font-size: 48px; font-weight: 700; color: ${c.accent}; margin-bottom: 20px;"></div>
    <!-- Bar to split -->
    <div style="position: relative; margin: 0 auto; margin-bottom: 16px;">
      <div id="bar" style="display: flex; height: 60px; border: 3px solid ${c.primary}; border-radius: 8px; overflow: hidden; cursor: pointer;"></div>
    </div>
    <div style="display: flex; gap: 12px; justify-content: center; margin-bottom: 12px;">
      <span style="font-size: 13px; opacity: 0.6;">Cuts: <strong id="cutCount">0</strong></span>
      <span style="font-size: 13px; opacity: 0.6;">Shaded: <strong id="shadeCount">0</strong></span>
    </div>
    <div style="display: flex; gap: 8px; justify-content: center;">
      <button onclick="addCut()" style="padding: 8px 20px; background: ${c.secondary}33; color: ${c.text}; border: 1px solid ${c.secondary}; border-radius: 8px; font-family: inherit; cursor: pointer;">+ Add Cut</button>
      <button onclick="removeCut()" style="padding: 8px 20px; background: ${c.secondary}33; color: ${c.text}; border: 1px solid ${c.secondary}; border-radius: 8px; font-family: inherit; cursor: pointer;">− Remove Cut</button>
      <button onclick="checkFraction()" style="padding: 8px 24px; background: ${c.primary}; color: ${config.vibe === "kawaii" ? "#fff" : c.bg}; border: none; border-radius: 8px; font-family: inherit; font-weight: 700; cursor: pointer;">Check!</button>
    </div>
  </div>
</div>
<script>
const TOTAL_ROUNDS = 5;
let currentRound = 0, targetNum = 0, targetDen = 0, cuts = 0, shaded = new Set();

function renderBar() {
  const bar = document.getElementById('bar');
  bar.innerHTML = '';
  const parts = cuts + 1;
  for (let i = 0; i < parts; i++) {
    const part = document.createElement('div');
    part.style.cssText = 'flex: 1; height: 100%; border-right: ' + (i < parts - 1 ? '2px dashed ${c.secondary}' : 'none') + '; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; cursor: pointer; transition: background 0.2s;';
    part.style.background = shaded.has(i) ? '${c.accent}88' : 'transparent';
    part.style.color = shaded.has(i) ? '${config.vibe === "kawaii" ? "#fff" : c.bg}' : '${c.text}44';
    part.textContent = (i + 1);
    part.onclick = () => { if (shaded.has(i)) shaded.delete(i); else shaded.add(i); renderBar(); document.getElementById('shadeCount').textContent = shaded.size; };
    bar.appendChild(part);
  }
  document.getElementById('cutCount').textContent = cuts;
}

function addCut() { if (cuts < 11) { cuts++; shaded.clear(); renderBar(); document.getElementById('shadeCount').textContent = 0; } }
function removeCut() { if (cuts > 0) { cuts--; shaded.clear(); renderBar(); document.getElementById('shadeCount').textContent = 0; } }

function checkFraction() {
  const parts = cuts + 1;
  const shadedCount = shaded.size;
  if (parts === targetDen && shadedCount === targetNum) {
    window.gameScore += 10 * (currentRound + 1);
    document.getElementById('scoreDisplay').textContent = window.gameScore;
    const area = document.getElementById('gameArea'); const rect = area.getBoundingClientRect();
    spawnParticles(rect.left + rect.width/2, rect.top + rect.height/2, '${c.accent}', 12);
    addCombo(); showScorePopup(rect.left + rect.width/2, rect.top + 50, '+' + (10 * (currentRound + 1)));
    const dots = document.querySelectorAll('.round-dot');
    if (dots[currentRound]) dots[currentRound].classList.add('done');
    currentRound++;
    if (currentRound >= TOTAL_ROUNDS) { setTimeout(() => showVictory('${config.winMessage}'), 500); }
    else { setTimeout(startRound, 800); }
  } else {
    screenShake(); resetCombo(); trackFail();
    if (parts !== targetDen) showScorePopup(window.innerWidth/2, window.innerHeight/2, 'Need ' + targetDen + ' equal parts, you have ' + parts);
    else showScorePopup(window.innerWidth/2, window.innerHeight/2, 'Shade ' + targetNum + ' parts, not ' + shadedCount);
  }
}

function startRound() { resetFails();
  cuts = 0; shaded = new Set();
  const denoms = currentRound < 2 ? [2, 3, 4] : currentRound < 4 ? [3, 4, 5, 6] : [4, 5, 6, 8];
  targetDen = denoms[Math.floor(Math.random() * denoms.length)];
  targetNum = Math.floor(Math.random() * (targetDen - 1)) + 1;
  document.getElementById('fractionDisplay').textContent = targetNum + '/' + targetDen;
  renderBar();
  document.getElementById('shadeCount').textContent = '0';
  const dots = document.querySelectorAll('.round-dot');
  dots.forEach((d, i) => { d.classList.remove('current'); if (i === currentRound) d.classList.add('current'); });
}
function startGame() {
  const dc = document.getElementById('roundDots'); dc.innerHTML = '';
  for (let i = 0; i < TOTAL_ROUNDS; i++) { const d = document.createElement('div'); d.className = 'round-dot'; dc.appendChild(d); }
  startRound();
}
</script>`
  // VARIANT B: Pour the Liquid — drag slider to pour the right fraction
  if (variant === "variantB") {
    const vB = `
<div class="intro-overlay" id="intro"><div class="intro-box"><h2>${config.title} — Pour</h2><p>You are a <strong>${config.character}</strong> in <strong>${config.worldName}</strong>. Pour the exact fraction into the glass! Drag the slider to control how much you pour.</p><button class="intro-start" onclick="document.getElementById('intro').remove(); startGame()">Pour! →</button></div></div>
<div id="helpPanel" class="help-panel"><div class="help-content"><h3>How to play</h3><p>A fraction is shown (e.g. 3/4). Drag the slider to fill the glass to exactly that level. The glass is divided into equal parts to help you.</p><button class="help-close" onclick="document.getElementById('helpPanel').classList.remove('open')">Got it</button></div></div>
<div class="game-header"><div class="game-title">${config.title} — Pour</div><div class="game-stats"><span>Score: <strong id="scoreDisplay">0</strong></span><div class="round-dots" id="roundDots"></div></div></div>
<div class="game-area" id="gameArea"><div style="text-align:center;width:90%;max-width:400px;">
  <div style="font-size:14px;opacity:.6;margin-bottom:8px;">Pour exactly this much</div>
  <div id="fracDisplay" style="font-size:52px;font-weight:700;color:${c.accent};margin-bottom:20px;"></div>
  <div style="display:flex;align-items:flex-end;justify-content:center;gap:24px;margin-bottom:20px;">
    <!-- Glass -->
    <div style="position:relative;width:80px;height:200px;border:3px solid ${c.secondary};border-top:none;border-radius:0 0 12px 12px;overflow:hidden;">
      <div id="liquid" style="position:absolute;bottom:0;left:0;right:0;background:${c.primary}44;transition:height .2s;"></div>
      <!-- Fraction lines -->
      <div id="glassLines" style="position:absolute;inset:0;"></div>
    </div>
    <!-- Slider -->
    <div style="display:flex;flex-direction:column;align-items:center;height:200px;">
      <input type="range" id="pourSlider" min="0" max="100" value="0" orient="vertical"
        style="writing-mode:vertical-lr;direction:rtl;height:180px;accent-color:${c.primary};"
        oninput="updatePour(this.value)">
      <div id="pourPercent" style="font-size:14px;color:${c.text};margin-top:4px;">0%</div>
    </div>
  </div>
  <button onclick="checkPour()" style="padding:10px 32px;background:${c.primary};color:${config.vibe === "kawaii" ? "#fff" : c.bg};border:none;border-radius:8px;font-family:inherit;font-size:16px;font-weight:700;cursor:pointer;">Lock in!</button>
</div></div>
<script>
const TR=5;let cr=0,tNum=0,tDen=0;
function updatePour(v){document.getElementById('liquid').style.height=v+'%';document.getElementById('pourPercent').textContent=v+'%';}
function checkPour(){const v=parseInt(document.getElementById('pourSlider').value);const target=Math.round(tNum/tDen*100);const diff=Math.abs(v-target);
  if(diff<=5){window.gameScore+=Math.max(5,15-diff)*(cr+1);document.getElementById('scoreDisplay').textContent=window.gameScore;
  spawnParticles(window.innerWidth/2,window.innerHeight/2,'${c.accent}',12);addCombo();showScorePopup(window.innerWidth/2,100,diff===0?'Perfect pour!':'Close enough!');
  const d=document.querySelectorAll('.round-dot');if(d[cr])d[cr].classList.add('done');cr++;if(cr>=TR){setTimeout(()=>showVictory('${config.winMessage}'),500);}else{setTimeout(sr,800);}}
  else{screenShake();resetCombo();trackFail();showScorePopup(window.innerWidth/2,window.innerHeight/2,v>target?'Too much!':'Not enough!');}}
function sr(){resetFails();document.getElementById('pourSlider').value=0;updatePour(0);
  const denoms=cr<2?[2,4]:cr<4?[3,4,5]:[ 4,5,6,8];tDen=denoms[Math.floor(Math.random()*denoms.length)];tNum=Math.floor(Math.random()*(tDen-1))+1;
  document.getElementById('fracDisplay').textContent=tNum+'/'+tDen;
  const gl=document.getElementById('glassLines');gl.innerHTML='';
  for(let i=1;i<tDen;i++){const line=document.createElement('div');line.style.cssText='position:absolute;left:0;right:0;height:1px;background:${c.secondary}44;';line.style.bottom=(i/tDen*100)+'%';gl.appendChild(line);}
  const d=document.querySelectorAll('.round-dot');d.forEach((x,i)=>{x.classList.remove('current');if(i===cr)x.classList.add('current');});}
function startGame(){const dc=document.getElementById('roundDots');dc.innerHTML='';for(let i=0;i<TR;i++){const d=document.createElement('div');d.className='round-dot';dc.appendChild(d);}sr();}
</script>`
    return baseTemplate(config, vB, variant, 45)
  }

  // VARIANT C: Share the Pizza — drag slices to plates so everyone gets equal
  if (variant === "variantC") {
    const vC = `
<div class="intro-overlay" id="intro"><div class="intro-box"><h2>${config.title} — Share</h2><p>You are a <strong>${config.character}</strong> in <strong>${config.worldName}</strong>. Share the ${config.itemName} equally! Give each plate the same number of pieces.</p><button class="intro-start" onclick="document.getElementById('intro').remove(); startGame()">Share! →</button></div></div>
<div id="helpPanel" class="help-panel"><div class="help-content"><h3>How to play</h3><p>You have a number of items and a number of plates. Click items to assign them to plates. Each plate must get the same number!</p><button class="help-close" onclick="document.getElementById('helpPanel').classList.remove('open')">Got it</button></div></div>
<div class="game-header"><div class="game-title">${config.title} — Share</div><div class="game-stats"><span>Score: <strong id="scoreDisplay">0</strong></span><div class="round-dots" id="roundDots"></div></div></div>
<div class="game-area" id="gameArea"><div style="text-align:center;width:90%;max-width:450px;">
  <div id="prompt" style="font-size:16px;color:${c.text};margin-bottom:16px;"></div>
  <!-- Plates -->
  <div id="plates" style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-bottom:16px;"></div>
  <!-- Items to share -->
  <div style="font-size:12px;opacity:.5;margin-bottom:8px;">Click an item, then click a plate to place it</div>
  <div id="items" style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin-bottom:16px;"></div>
  <button onclick="checkShare()" style="padding:10px 32px;background:${c.primary};color:${config.vibe === "kawaii" ? "#fff" : c.bg};border:none;border-radius:8px;font-family:inherit;font-size:16px;font-weight:700;cursor:pointer;">Check!</button>
</div></div>
<script>
const TR=5;let cr=0,totalItems=0,numPlates=0,perPlate=0,plateCounts=[],selectedItem=null;
function createPlate(idx){const el=document.createElement('div');el.style.cssText='width:80px;min-height:80px;border:3px dashed ${c.accent}44;border-radius:16px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:8px;cursor:pointer;transition:all .15s;';
  el.innerHTML='<div style="font-size:24px;font-weight:700;color:${c.accent};" id="pc'+idx+'">0</div><div style="font-size:10px;opacity:.5;">Plate '+(idx+1)+'</div>';
  el.onclick=()=>{if(selectedItem!==null){plateCounts[idx]++;document.getElementById('pc'+idx).textContent=plateCounts[idx];selectedItem.remove();selectedItem=null;el.style.borderColor='${c.accent}44';}};
  el.onmouseenter=()=>{if(selectedItem)el.style.borderColor='${c.accent}';};el.onmouseleave=()=>{el.style.borderColor='${c.accent}44';};
  return el;}
function createItem(){const el=document.createElement('div');el.style.cssText='width:32px;height:32px;border-radius:50%;background:${c.primary};cursor:pointer;transition:all .15s;';
  el.onclick=()=>{if(selectedItem)selectedItem.style.boxShadow='none';selectedItem=el;el.style.boxShadow='0 0 0 3px ${c.accent}';};return el;}
function checkShare(){let allEqual=true;for(let i=1;i<numPlates;i++){if(plateCounts[i]!==plateCounts[0]){allEqual=false;break;}}
  if(allEqual&&plateCounts[0]===perPlate){window.gameScore+=10*(cr+1);document.getElementById('scoreDisplay').textContent=window.gameScore;
  spawnParticles(window.innerWidth/2,window.innerHeight/2,'${c.accent}',12);addCombo();
  const d=document.querySelectorAll('.round-dot');if(d[cr])d[cr].classList.add('done');cr++;if(cr>=TR){setTimeout(()=>showVictory('${config.winMessage}'),500);}else{setTimeout(sr,800);}}
  else{screenShake();resetCombo();trackFail();showScorePopup(window.innerWidth/2,window.innerHeight/2,'Not equal! Each plate needs '+perPlate);}}
function sr(){resetFails();selectedItem=null;numPlates=cr<2?2:cr<4?3:4;perPlate=cr<2?3:cr<4?4:5;totalItems=numPlates*perPlate;plateCounts=new Array(numPlates).fill(0);
  document.getElementById('prompt').textContent='Share '+totalItems+' items equally among '+numPlates+' plates ('+perPlate+' each)';
  const pl=document.getElementById('plates');pl.innerHTML='';for(let i=0;i<numPlates;i++)pl.appendChild(createPlate(i));
  const it=document.getElementById('items');it.innerHTML='';for(let i=0;i<totalItems;i++)it.appendChild(createItem());
  const d=document.querySelectorAll('.round-dot');d.forEach((x,i)=>{x.classList.remove('current');if(i===cr)x.classList.add('current');});}
function startGame(){const dc=document.getElementById('roundDots');dc.innerHTML='';for(let i=0;i<TR;i++){const d=document.createElement('div');d.className='round-dot';dc.appendChild(d);}sr();}
</script>`
    return baseTemplate(config, vC, variant, 45)
  }

  return baseTemplate(config, gameContent, variant, 45)
}
