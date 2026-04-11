// Fit & Rotate engine — click to rotate shapes and drag to fit them into an outline.
// Simplified: choose the correct rotation to match the target.

import type { ThemeConfig, MathParams, GameVariant } from "./engine-types"
import { baseTemplate } from "./base-template"

export function fitRotateEngine(config: ThemeConfig, math: MathParams, variant: GameVariant = "classic"): string {
  const c = config.colors
  const gameContent = `
<div class="intro-overlay" id="intro"><div class="intro-box">
  <h2>${config.title}</h2><p>You are a <strong>${config.character}</strong> in a <strong>${config.worldName}</strong>.</p>
  <p>Rotate the ${config.itemName} to match the target shape!</p>
  <button class="intro-start" onclick="document.getElementById('intro').remove(); startGame()">Play →</button>
</div></div>
<div id="helpPanel" class="help-panel"><div class="help-content"><h3>How to play</h3><p>A target shape is shown. Click the rotate button to turn the shape until it matches, then click Lock In.</p><button class="help-close" onclick="document.getElementById('helpPanel').classList.remove('open')">Got it</button></div></div>
<div class="game-header"><div class="game-title">${config.title}</div><div class="game-stats"><span>Score: <strong id="scoreDisplay">0</strong></span><div class="round-dots" id="roundDots"></div></div></div>
<div class="game-area" id="gameArea">
  <div style="display: flex; gap: 60px; align-items: center;">
    <div style="text-align: center;"><div style="font-size: 12px; opacity: 0.5; margin-bottom: 8px;">TARGET</div>
      <svg id="targetSvg" width="120" height="120" viewBox="0 0 120 120"></svg></div>
    <div style="text-align: center;"><div style="font-size: 12px; opacity: 0.5; margin-bottom: 8px;">YOUR SHAPE</div>
      <svg id="playerSvg" width="120" height="120" viewBox="0 0 120 120" style="transition: transform 0.3s;"></svg>
      <div style="margin-top: 12px; display: flex; gap: 8px; justify-content: center;">
        <button onclick="rotateShape()" style="padding: 8px 20px; background: ${c.primary}; color: ${config.vibe === "kawaii" ? "#fff" : c.bg}; border: none; border-radius: 8px; font-family: inherit; font-weight: 700; cursor: pointer;">↻ Rotate 90°</button>
        <button onclick="checkRotation()" style="padding: 8px 20px; background: ${c.accent}; color: ${config.vibe === "kawaii" ? "#fff" : c.bg}; border: none; border-radius: 8px; font-family: inherit; font-weight: 700; cursor: pointer;">Lock In</button>
      </div>
    </div>
  </div>
</div>
<script>
const TOTAL_ROUNDS = 5; let currentRound = 0, targetRotation = 0, playerRotation = 0;
const SHAPES = [
  'M20,100 L60,20 L100,100 Z', // triangle
  'M20,20 L100,20 L100,80 L20,80 Z', // rectangle
  'M60,10 L100,40 L85,90 L35,90 L20,40 Z', // pentagon
  'M20,60 L60,20 L100,60 L60,100 Z', // diamond
  'M30,20 L90,20 L100,60 L70,100 L20,80 Z', // irregular
];
function drawShape(svgId, path, rotation, color) {
  const svg = document.getElementById(svgId);
  svg.innerHTML = '<g transform="rotate('+rotation+' 60 60)"><path d="'+path+'" fill="'+color+'22" stroke="'+color+'" stroke-width="3"/></g>';
}
function rotateShape() { playerRotation = (playerRotation + 90) % 360; drawShape('playerSvg', SHAPES[currentRound % SHAPES.length], playerRotation, '${c.primary}'); }
function checkRotation() {
  if (playerRotation === targetRotation) {
    window.gameScore += 10*(currentRound+1); document.getElementById('scoreDisplay').textContent = window.gameScore;
    const area = document.getElementById('gameArea'); const rect = area.getBoundingClientRect();
    spawnParticles(rect.left+rect.width/2, rect.top+rect.height/2, '${c.accent}', 12); addCombo();
    showScorePopup(rect.left+rect.width/2, rect.top+50, '+'+(10*(currentRound+1)));
    const dots = document.querySelectorAll('.round-dot'); if(dots[currentRound]) dots[currentRound].classList.add('done');
    currentRound++; if(currentRound>=TOTAL_ROUNDS){setTimeout(()=>showVictory('${config.winMessage}'),500);}else{setTimeout(startRound,800);}
  } else { screenShake(); resetCombo(); trackFail(); showScorePopup(window.innerWidth/2, window.innerHeight/2, 'Not matching yet!'); }
}
function startRound() { resetFails();
  playerRotation = 0; targetRotation = [90, 180, 270][Math.floor(Math.random()*3)];
  const shape = SHAPES[currentRound % SHAPES.length];
  drawShape('targetSvg', shape, targetRotation, '${c.accent}');
  drawShape('playerSvg', shape, 0, '${c.primary}');
  const dots = document.querySelectorAll('.round-dot'); dots.forEach((d,i)=>{d.classList.remove('current');if(i===currentRound)d.classList.add('current');});
}
function startGame(){
</script>`
  return baseTemplate(config, gameContent, variant, 30)
}
