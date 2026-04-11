// Roll & Predict engine
// See data, predict the most likely outcome, spin to check.

import type { ThemeConfig, MathParams, GameVariant } from "./engine-types"
import { baseTemplate } from "./base-template"

export function rollPredictEngine(config: ThemeConfig, math: MathParams, variant: GameVariant = "classic"): string {
  const c = config.colors
  const gameContent = `
<div class="intro-overlay" id="intro"><div class="intro-box">
  <h2>${config.title}</h2>
  <p>You are a <strong>${config.character}</strong> in a <strong>${config.worldName}</strong>.</p>
  <p>Look at the data and predict which outcome is most likely!</p>
  <button class="intro-start" onclick="document.getElementById('intro').remove(); startGame()">Play →</button>
</div></div>
<div id="helpPanel" class="help-panel"><div class="help-content">
  <h3>How to play</h3><p>A set of data is shown. Pick which value appears most often (mode), or is in the middle (median), or is the average (mean).</p>
  <button class="help-close" onclick="document.getElementById('helpPanel').classList.remove('open')">Got it</button>
</div></div>
<div class="game-header"><div class="game-title">${config.title}</div>
  <div class="game-stats"><span>Score: <strong id="scoreDisplay">0</strong></span><div class="round-dots" id="roundDots"></div></div>
</div>
<div class="game-area" id="gameArea">
  <div style="text-align: center; width: 90%; max-width: 500px;">
    <div id="questionType" style="font-size: 16px; font-weight: 700; color: ${c.accent}; margin-bottom: 16px;"></div>
    <div id="dataDisplay" style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; margin-bottom: 20px;"></div>
    <div id="choices" style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;"></div>
    <div id="feedback" style="margin-top: 16px; font-size: 14px; min-height: 20px;"></div>
  </div>
</div>
<script>
const TOTAL_ROUNDS = 5;
let currentRound = 0, correctAnswer = 0;
function createDataBubble(v) {
  const el = document.createElement('div');
  el.style.cssText = 'width: 44px; height: 44px; border-radius: 50%; background: ${c.primary}22; border: 2px solid ${c.primary}; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 700; color: ${c.text};';
  el.textContent = v; return el;
}
function createChoice(v) {
  const el = document.createElement('button');
  el.style.cssText = 'width: 64px; height: 64px; border-radius: 12px; font-size: 22px; font-weight: 700; cursor: pointer; border: 2px solid ${c.secondary}; background: ${c.secondary}11; color: ${c.text}; font-family: inherit; transition: all 0.15s;';
  el.textContent = v;
  el.onclick = () => pickAnswer(v, el);
  return el;
}
function pickAnswer(v, el) {
  if (v === correctAnswer) {
    window.gameScore += 10 * (currentRound + 1); document.getElementById('scoreDisplay').textContent = window.gameScore;
    el.style.background = '${c.accent}'; el.style.color = '${config.vibe === "kawaii" ? "#fff" : c.bg}';
    const rect = el.getBoundingClientRect(); spawnParticles(rect.left+32, rect.top+32, '${c.accent}', 10); addCombo();
    showScorePopup(rect.left+32, rect.top-10, '+' + (10*(currentRound+1)));
    const dots = document.querySelectorAll('.round-dot'); if (dots[currentRound]) dots[currentRound].classList.add('done');
    currentRound++;
    if (currentRound >= TOTAL_ROUNDS) { setTimeout(() => showVictory('${config.winMessage}'), 600); }
    else { setTimeout(startRound, 800); }
  } else {
    screenShake(); resetCombo(); trackFail();
    el.style.background = '${c.danger}33'; el.style.borderColor = '${c.danger}';
    setTimeout(() => { el.style.background = '${c.secondary}11'; el.style.borderColor = '${c.secondary}'; }, 500);
    document.getElementById('feedback').style.color = '${c.danger}'; document.getElementById('feedback').textContent = 'Not that one!';
    setTimeout(() => { document.getElementById('feedback').textContent = ''; }, 1200);
  }
}
function startRound() { resetFails();
  const count = currentRound < 2 ? 6 : currentRound < 4 ? 8 : 10;
  const max = currentRound < 2 ? 10 : 20;
  const data = [];
  for (let i = 0; i < count; i++) data.push(Math.floor(Math.random() * max) + 1);
  // Ensure a clear mode by duplicating one value
  const modeVal = data[Math.floor(Math.random() * data.length)];
  data.push(modeVal); data.push(modeVal);
  data.sort((a, b) => a - b);
  const types = ['mode', 'median', 'mean'];
  const type = types[currentRound % 3];
  let answer;
  if (type === 'mode') { const freq = {}; data.forEach(v => freq[v] = (freq[v]||0)+1); answer = parseInt(Object.entries(freq).sort((a,b)=>b[1]-a[1])[0][0]); document.getElementById('questionType').textContent = 'Which number appears MOST often?'; }
  else if (type === 'median') { const mid = Math.floor(data.length/2); answer = data.length%2 ? data[mid] : Math.round((data[mid-1]+data[mid])/2); document.getElementById('questionType').textContent = 'What is the MIDDLE value?'; }
  else { answer = Math.round(data.reduce((a,b)=>a+b,0)/data.length); document.getElementById('questionType').textContent = 'What is the AVERAGE (mean)?'; }
  correctAnswer = answer;
  const dd = document.getElementById('dataDisplay'); dd.innerHTML = '';
  data.forEach(v => dd.appendChild(createDataBubble(v)));
  const wrongs = new Set(); wrongs.add(answer);
  while (wrongs.size < 4) wrongs.add(answer + Math.floor(Math.random()*6)-3);
  const choices = Array.from(wrongs); for (let i = choices.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[choices[i],choices[j]]=[choices[j],choices[i]];}
  const ce = document.getElementById('choices'); ce.innerHTML = ''; choices.forEach(v => ce.appendChild(createChoice(v)));
  document.getElementById('feedback').textContent = '';
  const dots = document.querySelectorAll('.round-dot'); dots.forEach((d,i)=>{d.classList.remove('current'); if(i===currentRound)d.classList.add('current');});
}
function startGame(){
</script>`
  return baseTemplate(config, gameContent, variant, 40)
}
