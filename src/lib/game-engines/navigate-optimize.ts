// Navigate & Optimize — find the shortest path through nodes.
// Simplified: given distances, pick the route with the shortest total.

import type { ThemeConfig, MathParams, GameVariant } from "./engine-types"
import { baseTemplate } from "./base-template"

export function navigateOptimizeEngine(config: ThemeConfig, math: MathParams, variant: GameVariant = "classic"): string {
  const c = config.colors
  const gameContent = `
<div class="intro-overlay" id="intro"><div class="intro-box"><h2>${config.title}</h2><p>You are a <strong>${config.character}</strong> in a <strong>${config.worldName}</strong>.</p><p>Find the shortest route! Add up the distances and pick the best path.</p><button class="intro-start" onclick="document.getElementById('intro').remove(); startGame()">Play →</button></div></div>
<div id="helpPanel" class="help-panel"><div class="help-content"><h3>How to play</h3><p>Two or three routes are shown with distances. Add up each route's total and click the shortest one.</p><button class="help-close" onclick="document.getElementById('helpPanel').classList.remove('open')">Got it</button></div></div>
<div class="game-header"><div class="game-title">${config.title}</div><div class="game-stats"><span>Score: <strong id="scoreDisplay">0</strong></span><div class="round-dots" id="roundDots"></div></div></div>
<div class="game-area" id="gameArea">
  <div style="text-align: center; width: 90%; max-width: 500px;">
    <div style="font-size: 16px; font-weight: 700; color: ${c.accent}; margin-bottom: 20px;">Which route is shortest?</div>
    <div id="routes" style="display: flex; flex-direction: column; gap: 12px;"></div>
    <div id="feedback" style="margin-top: 16px; font-size: 14px; min-height: 20px;"></div>
  </div>
</div>
<script>
const TOTAL_ROUNDS = 5; let currentRound = 0, correctIdx = 0;
function createRoute(legs, total, idx) {
  const el = document.createElement('button');
  el.style.cssText = 'display: flex; align-items: center; gap: 8px; padding: 16px; border: 2px solid ${c.primary}44; border-radius: 12px; background: ${c.primary}08; cursor: pointer; transition: all 0.2s; font-family: inherit; width: 100%;';
  const label = document.createElement('div'); label.style.cssText = 'font-size: 14px; font-weight: 700; color: ${c.text}; width: 60px; text-align: left;';
  label.textContent = 'Route '+'ABC'[idx];
  const path = document.createElement('div'); path.style.cssText = 'flex: 1; display: flex; align-items: center; gap: 4px; font-size: 16px; color: ${c.text};';
  legs.forEach((leg, i) => {
    if (i > 0) { const arrow = document.createElement('span'); arrow.textContent = '→'; arrow.style.color = '${c.secondary}'; path.appendChild(arrow); }
    const seg = document.createElement('span'); seg.style.cssText = 'background: ${c.accent}22; padding: 2px 8px; border-radius: 4px; font-weight: 700;'; seg.textContent = leg; path.appendChild(seg);
  });
  const totalEl = document.createElement('div'); totalEl.style.cssText = 'font-size: 14px; color: ${c.text}80; width: 60px; text-align: right;';
  totalEl.textContent = '= ' + total;
  el.appendChild(label); el.appendChild(path); el.appendChild(totalEl);
  el.onclick = () => pickRoute(idx, el);
  return el;
}
function pickRoute(idx, el) {
  if (idx === correctIdx) {
    window.gameScore += 10*(currentRound+1); document.getElementById('scoreDisplay').textContent = window.gameScore;
    el.style.borderColor = '${c.accent}'; el.style.background = '${c.accent}22';
    const rect = el.getBoundingClientRect(); spawnParticles(rect.left+rect.width/2, rect.top+30, '${c.accent}', 10); addCombo();
    showScorePopup(rect.left+rect.width/2, rect.top-10, '+'+(10*(currentRound+1)));
    const dots = document.querySelectorAll('.round-dot'); if(dots[currentRound]) dots[currentRound].classList.add('done');
    currentRound++; if(currentRound>=TOTAL_ROUNDS){setTimeout(()=>showVictory('${config.winMessage}'),600);}else{setTimeout(startRound,800);}
  } else { screenShake(); resetCombo(); trackFail(); el.style.borderColor='${c.danger}'; setTimeout(()=>{el.style.borderColor='${c.primary}44';},500);
    document.getElementById('feedback').style.color='${c.danger}'; document.getElementById('feedback').textContent='Not the shortest! Add up the numbers.'; setTimeout(()=>{document.getElementById('feedback').textContent='';},1500); }
}
function startRound() { resetFails();
  const routeCount = currentRound < 2 ? 2 : 3;
  const legCount = currentRound < 2 ? 2 : currentRound < 4 ? 3 : 4;
  const maxLeg = currentRound < 2 ? 10 : currentRound < 4 ? 20 : 30;
  const routes = [];
  for (let r = 0; r < routeCount; r++) {
    const legs = []; let total = 0;
    for (let l = 0; l < legCount; l++) { const v = Math.floor(Math.random()*maxLeg)+1; legs.push(v); total += v; }
    routes.push({ legs, total });
  }
  // Ensure unique totals
  const totals = routes.map(r => r.total);
  correctIdx = totals.indexOf(Math.min(...totals));
  const re = document.getElementById('routes'); re.innerHTML = '';
  routes.forEach((r, i) => re.appendChild(createRoute(r.legs, r.total, i)));
  document.getElementById('feedback').textContent = '';
  const dots = document.querySelectorAll('.round-dot'); dots.forEach((d,i)=>{d.classList.remove('current');if(i===currentRound)d.classList.add('current');});
}
function startGame(){
</script>`
  return baseTemplate(config, gameContent, variant, 45)
}
