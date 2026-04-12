// Solve & Eliminate engine
// Grid of possibilities. Use clues to eliminate wrong answers and find the correct one.
// 5 rounds, progressive difficulty.

import type { ThemeConfig, MathParams, GameVariant } from "./engine-types"
import { baseTemplate } from "./base-template"

export function solveEliminateEngine(config: ThemeConfig, math: MathParams, variant: GameVariant = "classic"): string {
  const c = config.colors

  const gameContent = `
<div class="intro-overlay" id="intro">
  <div class="intro-box">
    <h2>${config.title}</h2>
    <p>You are a <strong>${config.character}</strong> in a <strong>${config.worldName}</strong>.</p>
    <p>Use the clues to eliminate wrong answers. Find the hidden ${config.itemName}!</p>
    <button class="intro-start" onclick="document.getElementById('intro').remove(); startGame()">Play →</button>
  </div>
</div>
<div id="helpPanel" class="help-panel">
  <div class="help-content">
    <h3>How to play</h3>
    <p>Numbers appear in a grid. Read each clue and click numbers that DON'T match the clue to eliminate them. The last one standing is your answer!</p>
    <h3>Example</h3><p>• Clue: "It's even" → eliminate all odd numbers ✅</p>
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
    <!-- Clue -->
    <div style="background: ${c.accent}11; border: 2px solid ${c.accent}44; border-radius: 12px; padding: 12px 20px; margin-bottom: 20px;">
      <div style="font-size: 12px; color: ${c.accent}; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">Clue</div>
      <div id="clue" style="font-size: 18px; font-weight: 700; color: ${c.text};"></div>
    </div>
    <div style="font-size: 13px; opacity: 0.5; margin-bottom: 12px;">Click numbers that DON'T match the clue to eliminate them</div>
    <!-- Grid -->
    <div id="grid" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; max-width: 300px; margin: 0 auto;"></div>
    <div style="margin-top: 16px;">
      <button onclick="submitAnswer()" style="padding: 10px 32px; background: ${c.primary}; color: ${config.vibe === "kawaii" ? "#fff" : c.bg}; border: none; border-radius: 8px; font-family: inherit; font-size: 16px; font-weight: 700; cursor: pointer;">
        That's my answer!
      </button>
      <div style="font-size: 11px; opacity: 0.4; margin-top: 4px;">Click when only the answer remains</div>
    </div>
  </div>
</div>
<script>
const TOTAL_ROUNDS = 5;
let currentRound = 0, answer = 0, eliminated = new Set(), gridNums = [];

function createCell(value) {
  const el = document.createElement('button');
  el.style.cssText = 'width: 60px; height: 60px; border-radius: 12px; font-size: 20px; font-weight: 700; cursor: pointer; transition: all 0.2s; border: 2px solid ${c.primary}44; background: ${c.primary}11; color: ${c.text}; font-family: inherit;';
  el.textContent = value;
  el.dataset.value = value;
  el.onclick = () => eliminateCell(el, parseInt(value));
  return el;
}

function eliminateCell(el, value) {
  if (value === answer) {
    // Wrong elimination — that's the answer!
    el.style.borderColor = '${c.danger}';
    el.style.background = '${c.danger}22';
    screenShake();
    showScorePopup(window.innerWidth/2, window.innerHeight/2, "Don't eliminate that one!");
    setTimeout(() => { el.style.borderColor = '${c.primary}44'; el.style.background = '${c.primary}11'; }, 600);
    return;
  }
  eliminated.add(value);
  el.style.opacity = '0.2';
  el.style.borderColor = '${c.secondary}22';
  el.style.cursor = 'default';
  el.onclick = null;
  spawnParticles(el.getBoundingClientRect().left + 30, el.getBoundingClientRect().top + 30, '${c.secondary}', 4);
}

function submitAnswer() {
  const remaining = gridNums.filter(n => !eliminated.has(n));
  if (remaining.length === 1 && remaining[0] === answer) {
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
  } else if (remaining.length > 1) {
    showScorePopup(window.innerWidth/2, window.innerHeight/2, 'Eliminate more! ' + remaining.length + ' left.');
  } else {
    screenShake(); resetCombo();
    showScorePopup(window.innerWidth/2, window.innerHeight/2, 'The answer was ' + answer);
    currentRound++;
    if (currentRound >= TOTAL_ROUNDS) { setTimeout(() => showDefeat('${config.loseMessage}'), 500); }
    else { setTimeout(startRound, 800); }
  }
}

function generateRound(round) {
  const count = round < 2 ? 8 : round < 4 ? 12 : 16;
  const max = round < 2 ? 20 : round < 4 ? 50 : 100;
  const nums = new Set();
  // Generate answer first
  const ans = Math.floor(Math.random() * max) + 1;
  nums.add(ans);
  while (nums.size < count) nums.add(Math.floor(Math.random() * max) + 1);
  // Generate clue about the answer
  const clues = [];
  if (ans % 2 === 0) clues.push('It is an even number');
  else clues.push('It is an odd number');
  if (ans > max / 2) clues.push('It is greater than ' + Math.floor(max / 2));
  else clues.push('It is less than ' + Math.ceil(max / 2));
  if (ans % 5 === 0) clues.push('It is a multiple of 5');
  if (ans < 10) clues.push('It is a single digit number');
  else clues.push('It has ' + String(ans).length + ' digits');
  const clue = clues[Math.floor(Math.random() * clues.length)];
  return { nums: Array.from(nums), answer: ans, clue };
}

function startRound() {
  eliminated = new Set();
  const data = generateRound(currentRound);
  gridNums = data.nums;
  answer = data.answer;
  document.getElementById('clue').textContent = data.clue;
  const grid = document.getElementById('grid');
  grid.innerHTML = '';
  // Shuffle
  const shuffled = [...data.nums];
  for (let i = shuffled.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; }
  grid.style.gridTemplateColumns = 'repeat(' + Math.ceil(Math.sqrt(shuffled.length)) + ', 1fr)';
  shuffled.forEach(n => grid.appendChild(createCell(n)));
  const dots = document.querySelectorAll('.round-dot');
  dots.forEach((d, i) => { d.classList.remove('current'); if (i === currentRound) d.classList.add('current'); });
}
function startGame() {
  const dc = document.getElementById('roundDots'); dc.innerHTML = '';
  for (let i = 0; i < TOTAL_ROUNDS; i++) { const d = document.createElement('div'); d.className = 'round-dot'; dc.appendChild(d); }
  startRound();
}
</script>`

  // VARIANT B: 20 Questions
  if (variant === "variantB") {
    const vB = `
<div class="intro-overlay" id="intro"><div class="intro-box"><h2>${config.title} — 20 Questions</h2><p>A secret number is hiding! Ask yes/no questions to find it in as few questions as possible.</p><button class="intro-start" onclick="document.getElementById('intro').remove(); startGame()">Ask away! →</button></div></div>
<div id="helpPanel" class="help-panel"><div class="help-content"><h3>How to play</h3><p>Click question buttons to narrow down the secret number. Then guess!</p><button class="help-close" onclick="document.getElementById('helpPanel').classList.remove('open')">Got it</button></div></div>
<div class="game-header"><div class="game-title">${config.title} — 20Q</div><div class="game-stats"><span>Questions: <strong id="qC">0</strong></span><span>Score: <strong id="scoreDisplay">0</strong></span><div class="round-dots" id="roundDots"></div></div></div>
<div class="game-area" id="gameArea"><div style="text-align:center;width:90%;max-width:450px;">
  <div style="font-size:14px;opacity:.6;margin-bottom:4px;">Secret number is between</div>
  <div id="rng" style="font-size:24px;font-weight:700;color:${c.accent};margin-bottom:16px;"></div>
  <div id="clues" style="min-height:40px;margin-bottom:16px;text-align:left;padding:8px;background:${c.primary}08;border-radius:8px;"></div>
  <div id="qs" style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-bottom:16px;"></div>
  <div style="display:flex;gap:8px;justify-content:center;align-items:center;">
    <input type="number" id="gI" style="width:80px;font-size:24px;font-weight:700;text-align:center;background:${c.bg};color:${c.text};border:3px solid ${c.accent};border-radius:12px;padding:8px;font-family:inherit;outline:none;" placeholder="?">
    <button onclick="mg()" style="padding:10px 20px;background:${c.accent};color:${config.vibe === "kawaii" ? "#fff" : c.bg};border:none;border-radius:8px;font-family:inherit;font-size:14px;font-weight:700;cursor:pointer;">Guess!</button>
  </div>
</div></div>
<script>
const TR=5;let cr=0,sec=0,qA=0,mx=20;
function aq(t,a){qA++;document.getElementById('qC').textContent=qA;const c=document.createElement('div');c.style.cssText='font-size:13px;margin-bottom:4px;color:${c.text};';c.innerHTML='<span style="color:${c.primary};">'+t+'</span> → <strong style="color:'+(a?'${c.accent}':'${c.danger}')+';">'+(a?'YES':'NO')+'</strong>';document.getElementById('clues').appendChild(c);spawnParticles(window.innerWidth/2,window.innerHeight/2,'${c.primary}',4);}
function mg(){const g=parseInt(document.getElementById('gI').value);if(isNaN(g)){showScorePopup(window.innerWidth/2,window.innerHeight/2,'Type a number!');return;}
if(g===sec){const pts=Math.max(5,(10-qA)*5)*(cr+1);window.gameScore+=pts;document.getElementById('scoreDisplay').textContent=window.gameScore;spawnParticles(window.innerWidth/2,window.innerHeight/2,'${c.accent}',16);addCombo();showScorePopup(window.innerWidth/2,100,'Found it! +'+pts);
const d=document.querySelectorAll('.round-dot');if(d[cr])d[cr].classList.add('done');cr++;if(cr>=TR){setTimeout(()=>showVictory('${config.winMessage}'),600);}else{setTimeout(sr,1000);}}
else{screenShake();resetCombo();trackFail();showScorePopup(window.innerWidth/2,window.innerHeight/2,g>sec?'Too high!':'Too low!');}}
function sr(){resetFails();qA=0;document.getElementById('qC').textContent='0';document.getElementById('clues').innerHTML='';document.getElementById('gI').value='';
if(cr<2)mx=20;else if(cr<4)mx=50;else mx=100;sec=Math.floor(Math.random()*mx)+1;document.getElementById('rng').textContent='1 and '+mx;
const qc=document.getElementById('qs');qc.innerHTML='';const h=Math.floor(mx/2);const q=Math.floor(mx/4);
[{t:'Is it even?',a:sec%2===0},{t:'Is it > '+h+'?',a:sec>h},{t:'Is it > '+q+'?',a:sec>q},{t:'Multiple of 5?',a:sec%5===0},{t:'Multiple of 3?',a:sec%3===0},{t:'Is it < '+(h+q)+'?',a:sec<h+q}].forEach(q2=>{
const b=document.createElement('button');b.textContent=q2.t;b.style.cssText='padding:8px 14px;border-radius:8px;border:1px solid ${c.primary}44;background:${c.primary}11;color:${c.text};font-size:13px;cursor:pointer;font-family:inherit;transition:all .15s;';
b.onclick=()=>{aq(q2.t,q2.a);b.disabled=true;b.style.opacity='.3';b.style.cursor='default';};qc.appendChild(b);});
const d=document.querySelectorAll('.round-dot');d.forEach((x,i)=>{x.classList.remove('current');if(i===cr)x.classList.add('current');});}
function startGame(){const dc=document.getElementById('roundDots');dc.innerHTML='';for(let i=0;i<TR;i++){const d=document.createElement('div');d.className='round-dot';dc.appendChild(d);}sr();}
document.addEventListener('keydown',(e)=>{if(e.key==='Enter')mg();});
</script>`
    return baseTemplate(config, vB, variant, 60)
  }

  // VARIANT C: Logic Chain
  if (variant === "variantC") {
    const vC = `
<div class="intro-overlay" id="intro"><div class="intro-box"><h2>${config.title} — Logic Chain</h2><p>Clues are chained! Solve one to reveal the next. Follow the chain to find the answer.</p><button class="intro-start" onclick="document.getElementById('intro').remove(); startGame()">Start! →</button></div></div>
<div id="helpPanel" class="help-panel"><div class="help-content"><h3>How to play</h3><p>One clue appears. Eliminate numbers that don't match. Then the next clue reveals. After all clues, only the answer remains!</p><button class="help-close" onclick="document.getElementById('helpPanel').classList.remove('open')">Got it</button></div></div>
<div class="game-header"><div class="game-title">${config.title} — Chain</div><div class="game-stats"><span>Score: <strong id="scoreDisplay">0</strong></span><span>Clue: <strong id="cN">1</strong>/<strong id="tC">3</strong></span><div class="round-dots" id="roundDots"></div></div></div>
<div class="game-area" id="gameArea"><div style="text-align:center;width:90%;max-width:450px;">
  <div style="background:${c.accent}11;border:2px solid ${c.accent}44;border-radius:12px;padding:12px 20px;margin-bottom:16px;">
    <div style="font-size:12px;color:${c.accent};text-transform:uppercase;letter-spacing:1px;">Clue</div>
    <div id="clue" style="font-size:18px;font-weight:700;color:${c.text};margin-top:4px;"></div>
  </div>
  <div style="font-size:12px;opacity:.5;margin-bottom:8px;">Click numbers that DON'T match</div>
  <div id="grid" style="display:grid;gap:6px;max-width:320px;margin:0 auto;margin-bottom:16px;"></div>
  <button id="nB" onclick="nc()" style="padding:10px 28px;background:${c.primary};color:${config.vibe === "kawaii" ? "#fff" : c.bg};border:none;border-radius:8px;font-family:inherit;font-size:14px;font-weight:700;cursor:pointer;display:none;">Next clue →</button>
  <button id="gB" onclick="fg()" style="padding:10px 28px;background:${c.accent};color:${config.vibe === "kawaii" ? "#fff" : c.bg};border:none;border-radius:8px;font-family:inherit;font-size:14px;font-weight:700;cursor:pointer;display:none;">That's my answer!</button>
</div></div>
<script>
const TR=5;let cr=0,ans=0,ci=0,cls=[],elim=new Set(),nums=[],nC=3;
function en(v,el){if(v===ans){el.style.borderColor='${c.danger}';el.style.background='${c.danger}22';screenShake();setTimeout(()=>{el.style.borderColor='${c.primary}44';el.style.background='${c.primary}11';},600);return;}
elim.add(v);el.style.opacity='.15';el.style.cursor='default';el.onclick=null;spawnParticles(el.getBoundingClientRect().left+20,el.getBoundingClientRect().top+20,'${c.secondary}',3);
const rem=nums.filter(n=>!elim.has(n));if(rem.length<=nums.length/2){if(ci<nC-1)document.getElementById('nB').style.display='inline-block';else document.getElementById('gB').style.display='inline-block';}}
function nc(){ci++;document.getElementById('cN').textContent=ci+1;document.getElementById('clue').textContent=cls[ci];document.getElementById('nB').style.display='none';}
function fg(){const rem=nums.filter(n=>!elim.has(n));if(rem.length===1&&rem[0]===ans){window.gameScore+=10*(cr+1);document.getElementById('scoreDisplay').textContent=window.gameScore;spawnParticles(window.innerWidth/2,window.innerHeight/2,'${c.accent}',16);addCombo();
const d=document.querySelectorAll('.round-dot');if(d[cr])d[cr].classList.add('done');cr++;if(cr>=TR){setTimeout(()=>showVictory('${config.winMessage}'),500);}else{setTimeout(sr,800);}}
else if(rem.length>1){showScorePopup(window.innerWidth/2,window.innerHeight/2,'Still '+rem.length+' left!');}else{screenShake();resetCombo();trackFail();}}
function sr(){resetFails();ci=0;elim=new Set();document.getElementById('nB').style.display='none';document.getElementById('gB').style.display='none';
const cnt=cr<2?8:cr<4?12:16;nC=cr<2?2:3;const mx=cr<2?20:cr<4?50:100;document.getElementById('tC').textContent=nC;document.getElementById('cN').textContent='1';
nums=[];const ns=new Set();ans=Math.floor(Math.random()*mx)+1;ns.add(ans);while(ns.size<cnt)ns.add(Math.floor(Math.random()*mx)+1);nums=[...ns];
for(let i=nums.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[nums[i],nums[j]]=[nums[j],nums[i]];}
cls=[];if(ans%2===0)cls.push('It is EVEN');else cls.push('It is ODD');if(ans>mx/2)cls.push('It is > '+Math.floor(mx/2));else cls.push('It is ≤ '+Math.floor(mx/2));
if(ans%5===0)cls.push('Multiple of 5');else if(ans%3===0)cls.push('Multiple of 3');else cls.push('It has '+String(ans).length+' digit'+(String(ans).length>1?'s':''));
cls=cls.slice(0,nC);document.getElementById('clue').textContent=cls[0];
const g=document.getElementById('grid');const c2=Math.ceil(Math.sqrt(cnt));g.style.gridTemplateColumns='repeat('+c2+',1fr)';g.innerHTML='';
nums.forEach(n=>{const c3=document.createElement('button');c3.textContent=n;c3.style.cssText='height:44px;border-radius:8px;font-size:16px;font-weight:700;cursor:pointer;border:1px solid ${c.primary}44;background:${c.primary}11;color:${c.text};font-family:inherit;transition:all .15s;';c3.onclick=()=>en(n,c3);g.appendChild(c3);});
const d=document.querySelectorAll('.round-dot');d.forEach((x,i)=>{x.classList.remove('current');if(i===cr)x.classList.add('current');});}
function startGame(){const dc=document.getElementById('roundDots');dc.innerHTML='';for(let i=0;i<TR;i++){const d=document.createElement('div');d.className='round-dot';dc.appendChild(d);}sr();}
</script>`
    return baseTemplate(config, vC, variant, 60)
  }

  return baseTemplate(config, gameContent, variant, 60)
}
