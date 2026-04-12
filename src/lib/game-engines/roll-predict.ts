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
  // VARIANT B: Bet the Spinner — see a weighted spinner, bet on the outcome
  if (variant === "variantB") {
    const vB = `
<div class="intro-overlay" id="intro"><div class="intro-box"><h2>${config.title} — Spinner</h2><p>You are a <strong>${config.character}</strong> in <strong>${config.worldName}</strong>. A weighted spinner is shown — some sections are bigger! Bet on the most likely outcome. Win coins!</p><button class="intro-start" onclick="document.getElementById('intro').remove(); startGame()">Spin! →</button></div></div>
<div id="helpPanel" class="help-panel"><div class="help-content"><h3>How to play</h3><p>The spinner has sections of different sizes. Bigger sections are more likely to land. Pick the color you think the spinner will land on, then spin! Bigger section = better bet.</p><button class="help-close" onclick="document.getElementById('helpPanel').classList.remove('open')">Got it</button></div></div>
<div class="game-header"><div class="game-title">${config.title} — Spinner</div><div class="game-stats"><span>Coins: <strong id="scoreDisplay">10</strong></span><span>Round: <strong id="roundD">1</strong>/5</span></div></div>
<div class="game-area" id="gameArea"><div style="text-align:center;width:90%;max-width:400px;">
  <!-- Spinner -->
  <canvas id="spinner" width="200" height="200" style="margin:0 auto 16px;display:block;"></canvas>
  <div id="resultText" style="font-size:18px;font-weight:700;min-height:24px;margin-bottom:12px;"></div>
  <!-- Betting -->
  <div style="font-size:14px;opacity:.6;margin-bottom:8px;">Which color will it land on?</div>
  <div id="bets" style="display:flex;gap:12px;justify-content:center;margin-bottom:16px;"></div>
  <button id="spinBtn" onclick="spin()" style="padding:12px 36px;background:${c.accent};color:${config.vibe === "kawaii" ? "#fff" : c.bg};border:none;border-radius:8px;font-family:inherit;font-size:18px;font-weight:700;cursor:pointer;display:none;">SPIN! 🎡</button>
</div></div>
<script>
const TR=5;let cr=0,coins=10,bet='',sections=[],spinAngle=0;
const COLORS=['#ef4444','#3b82f6','#22c55e','#f59e0b','#a855f7'];const NAMES=['Red','Blue','Green','Gold','Purple'];
const cv=document.getElementById('spinner');const cx=cv.getContext('2d');
function drawSpinner(angle){cx.clearRect(0,0,200,200);let total=sections.reduce((s,v)=>s+v,0);let start=angle||0;
  sections.forEach((size,i)=>{const slice=size/total*Math.PI*2;cx.beginPath();cx.moveTo(100,100);cx.arc(100,100,90,start,start+slice);cx.closePath();cx.fillStyle=COLORS[i];cx.fill();cx.strokeStyle='#fff';cx.lineWidth=2;cx.stroke();start+=slice;});
  // Arrow
  cx.fillStyle='${c.text}';cx.beginPath();cx.moveTo(100,8);cx.lineTo(95,20);cx.lineTo(105,20);cx.closePath();cx.fill();}
function placeBet(color,idx){bet=color;document.querySelectorAll('#bets button').forEach((b,i)=>{b.style.borderWidth=i===idx?'4px':'2px';b.style.borderColor=i===idx?'${c.text}':COLORS[i]+'44';});
  document.getElementById('spinBtn').style.display='inline-block';}
function spin(){if(!bet)return;document.getElementById('spinBtn').disabled=true;
  const totalSpins=Math.random()*720+720;let current=spinAngle;const target=current+totalSpins;const duration=2000;const start=Date.now();
  function animate(){const elapsed=Date.now()-start;const progress=Math.min(elapsed/duration,1);const eased=1-Math.pow(1-progress,3);
    spinAngle=current+(target-current)*eased;drawSpinner(spinAngle*Math.PI/180);if(progress<1){requestAnimationFrame(animate);}else{checkResult();}}
  animate();}
function checkResult(){const total=sections.reduce((s,v)=>s+v,0);const normalAngle=((spinAngle%360)+360)%360;let cumAngle=0;let landed='';
  sections.forEach((size,i)=>{const slice=size/total*360;if(normalAngle>=cumAngle&&normalAngle<cumAngle+slice)landed=NAMES[i];cumAngle+=slice;});
  if(!landed)landed=NAMES[0];const rt=document.getElementById('resultText');
  if(landed===bet){coins+=5;rt.style.color='${c.accent}';rt.textContent='Landed on '+landed+'! You win +5 coins!';addCombo();spawnParticles(window.innerWidth/2,window.innerHeight/2,'${c.accent}',12);}
  else{coins=Math.max(0,coins-2);rt.style.color='${c.danger}';rt.textContent='Landed on '+landed+'. You lose 2 coins.';resetCombo();screenShake();}
  document.getElementById('scoreDisplay').textContent=coins;cr++;document.getElementById('roundD').textContent=Math.min(cr+1,TR);
  if(cr>=TR){if(coins>=10){setTimeout(()=>showVictory('${config.winMessage}'),800);}else{setTimeout(()=>showDefeat('${config.loseMessage}'),800);}}
  else{setTimeout(nextRound,1200);}}
function nextRound(){bet='';document.getElementById('resultText').textContent='';document.getElementById('spinBtn').style.display='none';document.getElementById('spinBtn').disabled=false;
  const numSections=cr<2?3:cr<4?4:5;sections=[];for(let i=0;i<numSections;i++)sections.push(Math.floor(Math.random()*4)+1);drawSpinner(spinAngle*Math.PI/180);
  const bs=document.getElementById('bets');bs.innerHTML='';sections.forEach((s,i)=>{const b=document.createElement('button');b.innerHTML='<div style="width:16px;height:16px;border-radius:50%;background:'+COLORS[i]+';margin:0 auto 4px;"></div><div style="font-size:12px;">'+NAMES[i]+'</div><div style="font-size:10px;opacity:.5;">'+Math.round(s/sections.reduce((a,b2)=>a+b2,0)*100)+'%</div>';
  b.style.cssText='padding:8px 12px;border-radius:8px;border:2px solid '+COLORS[i]+'44;background:transparent;color:${c.text};cursor:pointer;font-family:inherit;transition:all .15s;';
  b.onclick=()=>placeBet(NAMES[i],i);bs.appendChild(b);});}
function startGame(){coins=10;cr=0;document.getElementById('scoreDisplay').textContent=coins;nextRound();}
</script>`
    return baseTemplate(config, vB, variant, 40)
  }

  // VARIANT C: Build the Chart — drag bars to match given stats
  if (variant === "variantC") {
    const vC = `
<div class="intro-overlay" id="intro"><div class="intro-box"><h2>${config.title} — Build a Chart</h2><p>You are a <strong>${config.character}</strong> in <strong>${config.worldName}</strong>. Build a bar chart that matches the given statistics!</p><button class="intro-start" onclick="document.getElementById('intro').remove(); startGame()">Build! →</button></div></div>
<div id="helpPanel" class="help-panel"><div class="help-content"><h3>How to play</h3><p>You're given a mean, median, or mode. Click bars to increase their height. Build a chart where the bars match the given stat!</p><button class="help-close" onclick="document.getElementById('helpPanel').classList.remove('open')">Got it</button></div></div>
<div class="game-header"><div class="game-title">${config.title} — Chart</div><div class="game-stats"><span>Score: <strong id="scoreDisplay">0</strong></span><div class="round-dots" id="roundDots"></div></div></div>
<div class="game-area" id="gameArea"><div style="text-align:center;width:90%;max-width:450px;">
  <div id="statPrompt" style="font-size:18px;font-weight:700;color:${c.accent};margin-bottom:16px;"></div>
  <!-- Bar chart -->
  <div id="chart" style="display:flex;gap:8px;align-items:flex-end;justify-content:center;height:160px;margin-bottom:16px;border-bottom:2px solid ${c.secondary};padding-bottom:4px;"></div>
  <div style="font-size:12px;opacity:.5;margin-bottom:8px;">Click a bar to increase it. Right-click to decrease.</div>
  <div style="margin-bottom:8px;"><span style="opacity:.6;">Current values: </span><strong id="barVals" style="color:${c.primary};"></strong></div>
  <button onclick="checkChart()" style="padding:10px 32px;background:${c.primary};color:${config.vibe === "kawaii" ? "#fff" : c.bg};border:none;border-radius:8px;font-family:inherit;font-size:16px;font-weight:700;cursor:pointer;">Check!</button>
</div></div>
<script>
const TR=5;let cr=0,targetStat='',targetVal=0,bars=[];const NUM_BARS=5;const MAX_HEIGHT=10;
function renderBars(){const ch=document.getElementById('chart');ch.innerHTML='';
  bars.forEach((v,i)=>{const bar=document.createElement('div');bar.style.cssText='width:48px;background:${c.primary};border-radius:6px 6px 0 0;cursor:pointer;display:flex;align-items:flex-start;justify-content:center;padding-top:4px;font-size:14px;font-weight:700;color:${config.vibe === "kawaii" ? "#fff" : c.bg};transition:height .2s;';
  bar.style.height=Math.max(4,v*15)+'px';bar.textContent=v;
  bar.onclick=()=>{if(bars[i]<MAX_HEIGHT){bars[i]++;renderBars();}};
  bar.oncontextmenu=(e)=>{e.preventDefault();if(bars[i]>0){bars[i]--;renderBars();}};
  ch.appendChild(bar);});
  document.getElementById('barVals').textContent=bars.join(', ');}
function checkChart(){const sorted=[...bars].sort((a,b)=>a-b);let actual;
  if(targetStat==='mean'){actual=Math.round(bars.reduce((s,v)=>s+v,0)/bars.length);}
  else if(targetStat==='median'){actual=sorted[Math.floor(sorted.length/2)];}
  else{const freq={};bars.forEach(v=>freq[v]=(freq[v]||0)+1);actual=parseInt(Object.entries(freq).sort((a,b)=>b[1]-a[1])[0][0]);}
  if(actual===targetVal){window.gameScore+=10*(cr+1);document.getElementById('scoreDisplay').textContent=window.gameScore;
  spawnParticles(window.innerWidth/2,window.innerHeight/2,'${c.accent}',12);addCombo();
  const d=document.querySelectorAll('.round-dot');if(d[cr])d[cr].classList.add('done');cr++;if(cr>=TR){setTimeout(()=>showVictory('${config.winMessage}'),500);}else{setTimeout(sr,800);}}
  else{screenShake();resetCombo();trackFail();showScorePopup(window.innerWidth/2,window.innerHeight/2,'The '+targetStat+' of your chart is '+actual+', need '+targetVal);}}
function sr(){resetFails();const stats=['mean','median','mode'];targetStat=stats[cr%3];
  if(targetStat==='mean')targetVal=Math.floor(Math.random()*5)+3;
  else if(targetStat==='median')targetVal=Math.floor(Math.random()*7)+2;
  else targetVal=Math.floor(Math.random()*6)+1;
  document.getElementById('statPrompt').textContent='Build a chart where the '+targetStat.toUpperCase()+' is '+targetVal;
  bars=new Array(NUM_BARS).fill(1);renderBars();
  const d=document.querySelectorAll('.round-dot');d.forEach((x,i)=>{x.classList.remove('current');if(i===cr)x.classList.add('current');});}
function startGame(){const dc=document.getElementById('roundDots');dc.innerHTML='';for(let i=0;i<TR;i++){const d=document.createElement('div');d.className='round-dot';dc.appendChild(d);}sr();}
</script>`
    return baseTemplate(config, vC, variant, 40)
  }

  return baseTemplate(config, gameContent, variant, 40)
}
