// Pattern & Repeat engine
// Shows a sequence with a gap. Player picks the next element.
// 5 rounds, progressive difficulty.

import type { ThemeConfig, MathParams, GameVariant } from "./engine-types"
import { baseTemplate } from "./base-template"

export function patternRepeatEngine(config: ThemeConfig, math: MathParams, variant: GameVariant = "classic"): string {
  const c = config.colors

  const gameContent = `
<div class="intro-overlay" id="intro">
  <div class="intro-box">
    <h2>${config.title}</h2>
    <p>You are a <strong>${config.character}</strong> in a <strong>${config.worldName}</strong>.</p>
    <p>Find the pattern and pick what comes next!</p>
    <button class="intro-start" onclick="document.getElementById('intro').remove(); startGame()">Play →</button>
  </div>
</div>
<div id="helpPanel" class="help-panel">
  <div class="help-content">
    <h3>How to play</h3>
    <p>A sequence of numbers appears with a missing piece. Figure out the pattern and click the right answer.</p>
    <h3>Valid moves</h3><p>• Sequence: 2, 4, 6, ? → answer is 8 (adding 2) ✅</p>
    <h3>Invalid moves</h3><p>• Picking 7 for the pattern 2, 4, 6, ? ❌</p>
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
  <div style="text-align: center; width: 90%; max-width: 500px;">
    <div style="font-size: 14px; opacity: 0.6; margin-bottom: 16px;">What comes next?</div>
    <!-- Sequence display -->
    <div id="sequence" style="display: flex; gap: 12px; justify-content: center; align-items: center; margin-bottom: 32px; flex-wrap: wrap;"></div>
    <!-- Answer choices -->
    <div id="choices" style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;"></div>
    <div id="feedback" style="margin-top: 16px; font-size: 14px; min-height: 20px;"></div>
  </div>
</div>
<div class="game-footer">${config.dare || 'Spot the pattern!'}</div>
<script>
const TOTAL_ROUNDS = 5;
let currentRound = 0, correctAnswer = 0;

function createSeqBox(value, isMissing) {
  const el = document.createElement('div');
  el.style.cssText = 'width: 56px; height: 56px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 700;';
  if (isMissing) {
    el.style.background = '${c.accent}22';
    el.style.border = '3px dashed ${c.accent}';
    el.style.color = '${c.accent}';
    el.textContent = '?';
  } else {
    el.style.background = '${c.primary}22';
    el.style.border = '2px solid ${c.primary}';
    el.style.color = '${c.text}';
    el.textContent = value;
  }
  return el;
}

function createChoice(value) {
  const el = document.createElement('button');
  el.style.cssText = 'width: 60px; height: 60px; border-radius: 12px; font-size: 22px; font-weight: 700; cursor: pointer; transition: all 0.15s; border: 2px solid ${c.secondary}; background: ${c.secondary}11; color: ${c.text}; font-family: inherit;';
  el.textContent = value;
  el.addEventListener('mouseenter', () => { el.style.borderColor = '${c.primary}'; el.style.transform = 'scale(1.05)'; });
  el.addEventListener('mouseleave', () => { el.style.borderColor = '${c.secondary}'; el.style.transform = 'scale(1)'; });
  el.addEventListener('click', () => pickAnswer(value, el));
  return el;
}

function pickAnswer(value, el) {
  if (value === correctAnswer) {
    window.gameScore += 10 * (currentRound + 1);
    document.getElementById('scoreDisplay').textContent = window.gameScore;
    el.style.background = '${c.accent}';
    el.style.color = '${config.vibe === "kawaii" ? "#fff" : c.bg}';
    const rect = el.getBoundingClientRect();
    spawnParticles(rect.left + rect.width/2, rect.top + rect.height/2, '${c.accent}', 10);
    addCombo();
    showScorePopup(rect.left + rect.width/2, rect.top - 10, '+' + (10 * (currentRound + 1)));
    // Fill in the missing box
    const boxes = document.querySelectorAll('#sequence > div');
    boxes.forEach(b => { if (b.textContent === '?') { b.textContent = value; b.style.background = '${c.accent}22'; b.style.borderStyle = 'solid'; b.style.borderColor = '${c.accent}'; } });
    const dots = document.querySelectorAll('.round-dot');
    if (dots[currentRound]) dots[currentRound].classList.add('done');
    currentRound++;
    if (currentRound >= TOTAL_ROUNDS) { setTimeout(() => showVictory('${config.winMessage}'), 600); }
    else { setTimeout(startRound, 800); }
  } else {
    screenShake(); resetCombo(); trackFail();
    el.style.background = '${c.danger}33';
    el.style.borderColor = '${c.danger}';
    setTimeout(() => { el.style.background = '${c.secondary}11'; el.style.borderColor = '${c.secondary}'; }, 500);
    document.getElementById('feedback').textContent = 'Not that one — look at the pattern again!';
    document.getElementById('feedback').style.color = '${c.danger}';
    setTimeout(() => { document.getElementById('feedback').textContent = ''; }, 1500);
  }
}

function generatePattern(round) {
  let seqLen, step;
  if (round < 2) {
    step = [2, 3, 5, 10][Math.floor(Math.random() * 4)];
    seqLen = 4;
  } else if (round < 4) {
    step = [3, 4, 6, 7, 9][Math.floor(Math.random() * 5)];
    seqLen = 5;
  } else {
    step = [7, 8, 11, 13, 15][Math.floor(Math.random() * 5)];
    seqLen = 5;
  }
  const start = Math.floor(Math.random() * 10) + 1;
  const isMultiply = round >= 3 && Math.random() < 0.4;
  const seq = [];
  for (let i = 0; i < seqLen + 1; i++) {
    seq.push(isMultiply ? start * Math.pow(2, i) : start + step * i);
  }
  const answer = seq[seqLen];
  const shown = seq.slice(0, seqLen);
  // Generate wrong answers from same table
  const wrongs = new Set();
  while (wrongs.size < 3) {
    const offset = (Math.floor(Math.random() * 4) + 1) * (Math.random() < 0.5 ? 1 : -1);
    const w = answer + offset * step;
    if (w !== answer && w > 0) wrongs.add(w);
    if (wrongs.size < 3) wrongs.add(answer + Math.floor(Math.random() * 10) - 5);
  }
  const wrongArr = Array.from(wrongs).filter(w => w !== answer).slice(0, 3);
  return { shown, answer, wrongs: wrongArr };
}

function startRound() { resetFails();
  const { shown, answer, wrongs } = generatePattern(currentRound);
  correctAnswer = answer;
  const seqEl = document.getElementById('sequence');
  seqEl.innerHTML = '';
  shown.forEach(v => seqEl.appendChild(createSeqBox(v, false)));
  // Arrow
  const arrow = document.createElement('div');
  arrow.style.cssText = 'font-size: 24px; color: ${c.accent};';
  arrow.textContent = '→';
  seqEl.appendChild(arrow);
  seqEl.appendChild(createSeqBox(null, true));
  // Choices
  const choices = [answer, ...wrongs];
  for (let i = choices.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [choices[i], choices[j]] = [choices[j], choices[i]]; }
  const choicesEl = document.getElementById('choices');
  choicesEl.innerHTML = '';
  choices.forEach(v => choicesEl.appendChild(createChoice(v)));
  document.getElementById('feedback').textContent = '';
  const dots = document.querySelectorAll('.round-dot');
  dots.forEach((d, i) => { d.classList.remove('current'); if (i === currentRound) d.classList.add('current'); });
}
function startGame() {
  const dc = document.getElementById('roundDots'); dc.innerHTML = '';
  for (let i = 0; i < TOTAL_ROUNDS; i++) { const d = document.createElement('div'); d.className = 'round-dot'; dc.appendChild(d); }
  startRound();
}
</script>`

  if (variant === "variantB") {
    const vB = `<div class="intro-overlay" id="intro"><div class="intro-box"><h2>${config.title} — Machine</h2><p>Figure out the pattern rule!</p><button class="intro-start" onclick="document.getElementById('intro').remove(); startGame()">Play →</button></div></div><div id="helpPanel" class="help-panel"><div class="help-content"><h3>How to play</h3><p>A sequence is shown. Pick the rule that generates it.</p><button class="help-close" onclick="document.getElementById('helpPanel').classList.remove('open')">Got it</button></div></div><div class="game-header"><div class="game-title">${config.title} — Machine</div><div class="game-stats"><span>Score: <strong id="scoreDisplay">0</strong></span><div class="round-dots" id="roundDots"></div></div></div><div class="game-area" id="gameArea"><div style="text-align:center;width:90%;max-width:450px;"><div id="seq" style="font-size:24px;font-weight:700;color:${c.text};margin-bottom:20px;"></div><div id="rules" style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;"></div></div></div><script>const TR=5;let cr=0,correctR='';function pick(r,el){if(r===correctR){window.gameScore+=10*(cr+1);document.getElementById('scoreDisplay').textContent=window.gameScore;el.style.background='${c.accent}';spawnParticles(window.innerWidth/2,window.innerHeight/2,'${c.accent}',10);addCombo();const d=document.querySelectorAll('.round-dot');if(d[cr])d[cr].classList.add('done');cr++;if(cr>=TR){setTimeout(()=>showVictory('${config.winMessage}'),600);}else{setTimeout(sr,800);}}else{screenShake();resetCombo();trackFail();}}function sr(){resetFails();const ops=[{r:'add 2',f:n=>n+2},{r:'add 3',f:n=>n+3},{r:'add 5',f:n=>n+5},{r:'×2',f:n=>n*2},{r:'subtract 1',f:n=>n-1}];const c2=ops[cr%5];correctR=c2.r;const s=Math.floor(Math.random()*5)+1;const sq=[s];for(let i=0;i<4;i++)sq.push(c2.f(sq[sq.length-1]));document.getElementById('seq').textContent=sq.join(' → ');const wr=ops.filter(o=>o.r!==correctR).slice(0,3);const ch=[c2,...wr];for(let i=ch.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[ch[i],ch[j]]=[ch[j],ch[i]];}const r=document.getElementById('rules');r.innerHTML='';ch.forEach(c3=>{const b=document.createElement('button');b.textContent=c3.r;b.style.cssText='padding:12px 20px;border-radius:8px;border:2px solid ${c.secondary};background:${c.secondary}11;color:${c.text};font-size:16px;font-weight:700;cursor:pointer;font-family:inherit;';b.onclick=()=>pick(c3.r,b);r.appendChild(b);});const d=document.querySelectorAll('.round-dot');d.forEach((x,i)=>{x.classList.remove('current');if(i===cr)x.classList.add('current');});}function startGame(){const dc=document.getElementById('roundDots');dc.innerHTML='';for(let i=0;i<TR;i++){const d=document.createElement('div');d.className='round-dot';dc.appendChild(d);}sr();}</script>`
    return baseTemplate(config, vB, variant, 40)
  }
  if (variant === "variantC") {
    const vC = `<div class="intro-overlay" id="intro"><div class="intro-box"><h2>${config.title} — Find Error</h2><p>One number is wrong. Click it!</p><button class="intro-start" onclick="document.getElementById('intro').remove(); startGame()">Play →</button></div></div><div id="helpPanel" class="help-panel"><div class="help-content"><h3>How to play</h3><p>The sequence follows a rule but one number doesn't fit. Click the imposter!</p><button class="help-close" onclick="document.getElementById('helpPanel').classList.remove('open')">Got it</button></div></div><div class="game-header"><div class="game-title">${config.title} — Error</div><div class="game-stats"><span>Score: <strong id="scoreDisplay">0</strong></span><div class="round-dots" id="roundDots"></div></div></div><div class="game-area" id="gameArea"><div style="text-align:center;width:90%;max-width:500px;"><div style="font-size:14px;opacity:.6;margin-bottom:12px;">One number doesn't belong!</div><div id="seq" style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;"></div></div></div><script>const TR=5;let cr=0,wi=-1;function cl(i,el){if(i===wi){window.gameScore+=10*(cr+1);document.getElementById('scoreDisplay').textContent=window.gameScore;el.style.background='${c.accent}';spawnParticles(window.innerWidth/2,window.innerHeight/2,'${c.accent}',10);addCombo();const d=document.querySelectorAll('.round-dot');if(d[cr])d[cr].classList.add('done');cr++;if(cr>=TR){setTimeout(()=>showVictory('${config.winMessage}'),600);}else{setTimeout(sr,800);}}else{screenShake();resetCombo();trackFail();}}function sr(){resetFails();const step=[2,3,4,5,6][cr%5];const start=Math.floor(Math.random()*5)+1;const sq=[];for(let i=0;i<6;i++)sq.push(start+step*i);wi=Math.floor(Math.random()*6);sq[wi]+=Math.random()<.5?step+1:-(step-1);const c2=document.getElementById('seq');c2.innerHTML='';sq.forEach((v,i)=>{const b=document.createElement('button');b.textContent=v;b.style.cssText='width:56px;height:56px;border-radius:12px;font-size:20px;font-weight:700;cursor:pointer;border:2px solid ${c.secondary};background:${c.secondary}11;color:${c.text};font-family:inherit;';b.onclick=()=>cl(i,b);c2.appendChild(b);});const d=document.querySelectorAll('.round-dot');d.forEach((x,i)=>{x.classList.remove('current');if(i===cr)x.classList.add('current');});}function startGame(){const dc=document.getElementById('roundDots');dc.innerHTML='';for(let i=0;i<TR;i++){const d=document.createElement('div');d.className='round-dot';dc.appendChild(d);}sr();}</script>`
    return baseTemplate(config, vC, variant, 40)
  }
  return baseTemplate(config, gameContent, variant, 40)
}
