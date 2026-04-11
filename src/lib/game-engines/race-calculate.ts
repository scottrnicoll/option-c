// Race & Calculate — set speed/angle to hit a target distance.

import type { ThemeConfig, MathParams, GameVariant } from "./engine-types"
import { baseTemplate } from "./base-template"

export function raceCalculateEngine(config: ThemeConfig, math: MathParams, variant: GameVariant = "classic"): string {
  const c = config.colors
  const gameContent = `
<div class="intro-overlay" id="intro"><div class="intro-box"><h2>${config.title}</h2><p>You are a <strong>${config.character}</strong> in a <strong>${config.worldName}</strong>.</p><p>Set the speed to land the ${config.itemName} in the target zone!</p><button class="intro-start" onclick="document.getElementById('intro').remove(); startGame()">Play →</button></div></div>
<div id="helpPanel" class="help-panel"><div class="help-content"><h3>How to play</h3><p>A target distance is shown. Set the speed using the slider. The ${config.itemName} travels for a fixed time. Speed × time = distance. Hit the target zone!</p><button class="help-close" onclick="document.getElementById('helpPanel').classList.remove('open')">Got it</button></div></div>
<div class="game-header"><div class="game-title">${config.title}</div><div class="game-stats"><span>Score: <strong id="scoreDisplay">0</strong></span><div class="round-dots" id="roundDots"></div></div></div>
<div class="game-area" id="gameArea">
  <div style="width: 90%; max-width: 500px; text-align: center;">
    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
      <span style="font-size: 14px; opacity: 0.6;">Target distance: <strong id="targetDist" style="color: ${c.accent};">?</strong></span>
      <span style="font-size: 14px; opacity: 0.6;">Time: <strong id="timeVal" style="color: ${c.primary};">?</strong> sec</span>
    </div>
    <!-- Track -->
    <div style="position: relative; height: 60px; background: ${c.secondary}11; border: 1px solid ${c.secondary}33; border-radius: 8px; margin-bottom: 16px; overflow: hidden;">
      <div id="targetZone" style="position: absolute; top: 0; bottom: 0; background: ${c.accent}22; border-left: 2px solid ${c.accent}; border-right: 2px solid ${c.accent};"></div>
      <div id="projectile" style="position: absolute; top: 50%; left: 0; width: 20px; height: 20px; background: ${c.primary}; border-radius: 50%; transform: translateY(-50%); transition: left 1s linear;"></div>
      <!-- Start label -->
      <div style="position: absolute; bottom: 2px; left: 4px; font-size: 10px; color: ${c.text}44;">0</div>
    </div>
    <!-- Speed control -->
    <div style="margin-bottom: 16px;">
      <div style="font-size: 14px; opacity: 0.6; margin-bottom: 4px;">Set speed</div>
      <input type="range" id="speedSlider" min="1" max="20" value="5" style="width: 80%; accent-color: ${c.primary};">
      <div style="font-size: 24px; font-weight: 700; color: ${c.primary};"><span id="speedVal">5</span> per sec</div>
      <div style="font-size: 14px; opacity: 0.5;">Distance = <span id="speedVal2">5</span> × <span id="timeVal2">?</span> = <strong id="calcDist">?</strong></div>
    </div>
    <button id="launchBtn" onclick="launch()" style="padding: 12px 40px; background: ${c.accent}; color: ${config.vibe === "kawaii" ? "#fff" : c.bg}; border: none; border-radius: 8px; font-family: inherit; font-size: 18px; font-weight: 700; cursor: pointer;">Launch!</button>
  </div>
</div>
<script>
const TOTAL_ROUNDS = 5; let currentRound = 0, targetDist = 0, timeVal = 0, trackWidth = 0, maxDist = 0;
const slider = document.getElementById('speedSlider');
slider.oninput = () => { document.getElementById('speedVal').textContent = slider.value; document.getElementById('speedVal2').textContent = slider.value; document.getElementById('calcDist').textContent = parseInt(slider.value) * timeVal; };
function launch() {
  const speed = parseInt(slider.value);
  const dist = speed * timeVal;
  const pct = Math.min(dist / maxDist, 1);
  document.getElementById('projectile').style.left = (pct * 100) + '%';
  document.getElementById('launchBtn').disabled = true;
  setTimeout(() => {
    const diff = Math.abs(dist - targetDist);
    const tolerance = currentRound < 2 ? targetDist * 0.15 : targetDist * 0.1;
    if (diff <= tolerance) {
      window.gameScore += 10*(currentRound+1); document.getElementById('scoreDisplay').textContent = window.gameScore;
      const area = document.getElementById('gameArea'); const rect = area.getBoundingClientRect();
      spawnParticles(rect.left+rect.width/2, rect.top+rect.height/2, '${c.accent}', 12); addCombo();
      showScorePopup(rect.left+rect.width/2, rect.top+50, diff===0?'Perfect!':'Close enough!');
      const dots = document.querySelectorAll('.round-dot'); if(dots[currentRound]) dots[currentRound].classList.add('done');
      currentRound++; if(currentRound>=TOTAL_ROUNDS){setTimeout(()=>showVictory('${config.winMessage}'),600);}else{setTimeout(startRound,1000);}
    } else {
      screenShake(); resetCombo(); trackFail();
      showScorePopup(window.innerWidth/2, window.innerHeight/2, dist>targetDist?'Too far! ('+dist+')':'Too short! ('+dist+')');
      setTimeout(()=>{document.getElementById('projectile').style.left='0';document.getElementById('launchBtn').disabled=false;},800);
    }
  }, 1100);
}
function startRound() { resetFails();
  timeVal = currentRound < 2 ? 2 : currentRound < 4 ? 3 : 4;
  const maxSpeed = currentRound < 2 ? 10 : 20;
  const correctSpeed = Math.floor(Math.random() * (maxSpeed - 2)) + 2;
  targetDist = correctSpeed * timeVal;
  maxDist = maxSpeed * timeVal;
  slider.max = maxSpeed; slider.value = Math.floor(maxSpeed / 2);
  document.getElementById('speedVal').textContent = slider.value;
  document.getElementById('speedVal2').textContent = slider.value;
  document.getElementById('timeVal').textContent = timeVal;
  document.getElementById('timeVal2').textContent = timeVal;
  document.getElementById('calcDist').textContent = parseInt(slider.value) * timeVal;
  document.getElementById('targetDist').textContent = targetDist;
  // Target zone on track
  const tolerance = currentRound < 2 ? 0.15 : 0.1;
  const zonePct = targetDist / maxDist;
  const zoneWidth = tolerance * 2;
  const tz = document.getElementById('targetZone');
  tz.style.left = Math.max(0, (zonePct - tolerance)) * 100 + '%';
  tz.style.width = zoneWidth * 100 + '%';
  document.getElementById('projectile').style.left = '0';
  document.getElementById('launchBtn').disabled = false;
  const dots = document.querySelectorAll('.round-dot'); dots.forEach((d,i)=>{d.classList.remove('current');if(i===currentRound)d.classList.add('current');});
}
function startGame(){
</script>`
  return baseTemplate(config, gameContent, variant, 40)
}
