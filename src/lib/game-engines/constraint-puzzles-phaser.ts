// Constraint Puzzles — Phaser engine with 3 game options.
// Math: Logic, elimination, deduction, number properties.
// Options: elimination-grid, twenty-questions, logic-chain

import type { ThemeConfig, MathParams, GameOption } from "./engine-types"
import { phaserGame } from "./base-phaser-template"
import { getOptionDef } from "./game-option-registry"

export function constraintPuzzlesPhaserEngine(
  config: ThemeConfig,
  math: MathParams,
  option: GameOption = "elimination-grid"
): string {
  const validOptions = ["elimination-grid", "twenty-questions", "logic-chain"]
  const activeOption = validOptions.includes(option) ? option : "elimination-grid"
  const optDef = getOptionDef(activeOption)
  const sceneMap: Record<string, string> = {
    "elimination-grid": "EliminationGridScene",
    "twenty-questions": "TwentyQuestionsScene",
    "logic-chain": "LogicChainScene",
  }
  return phaserGame({
    config, math, option: activeOption,
    sceneName: sceneMap[activeOption],
    introText: optDef?.introText || "Use clues to find the answer!",
    helpText: optDef?.helpText || "Eliminate wrong answers using logic.",
    gameSceneCode: GAME_SCENES,
  })
}

const GAME_SCENES = `
function generateEliminationRound(round) {
  if (AI_ROUNDS && AI_ROUNDS[round]) { const r=AI_ROUNDS[round]; return { prompt: r.prompt, target: r.target, hint: r.hint }; }
  const count = 6;
  const nums = [];
  const range = round < 2 ? 20 : round < 4 ? 50 : 100;
  while (nums.length < count) { const n = Math.floor(Math.random() * range) + 1; if (!nums.includes(n)) nums.push(n); }
  const answer = nums[Math.floor(Math.random() * nums.length)];
  const clues = [];
  if (answer % 2 === 0) clues.push({text: 'It is even', test: function(n){return n%2===0;}});
  else clues.push({text: 'It is odd', test: function(n){return n%2!==0;}});
  if (answer > range / 2) clues.push({text: 'It is greater than ' + Math.floor(range/2), test: function(n){return n>Math.floor(range/2);}});
  else clues.push({text: 'It is ' + Math.floor(range/2) + ' or less', test: function(n){return n<=Math.floor(range/2);}});
  if (answer > 10) clues.push({text: 'It is greater than 10', test: function(n){return n>10;}});
  else clues.push({text: 'It is 10 or less', test: function(n){return n<=10;}});
  const numClues = round < 2 ? 2 : 3;
  return { nums, answer, clues: clues.slice(0, numClues) };
}

function generateTwentyQRound(round) {
  const max = round < 2 ? 20 : round < 4 ? 35 : 50;
  const hidden = Math.floor(Math.random() * max) + 1;
  const mid = Math.floor(max / 2);
  const questions = [
    {text: 'Is it greater than ' + mid + '?', answer: hidden > mid},
    {text: 'Is it even?', answer: hidden % 2 === 0},
    {text: 'Is it greater than ' + Math.floor(max/4) + '?', answer: hidden > Math.floor(max/4)},
    {text: 'Is it less than ' + Math.floor(max*3/4) + '?', answer: hidden < Math.floor(max*3/4)},
    {text: 'Is it a multiple of 5?', answer: hidden % 5 === 0},
    {text: 'Is it a multiple of 3?', answer: hidden % 3 === 0},
  ];
  return { hidden, max, questions };
}

function generateLogicChainRound(round) {
  const range = round < 2 ? 20 : round < 4 ? 40 : 60;
  const answer = Math.floor(Math.random() * range) + 1;
  const chain = [];
  if (answer % 2 === 0) chain.push({clue: 'The number is even.', narrowed: 'Even numbers only.'});
  else chain.push({clue: 'The number is odd.', narrowed: 'Odd numbers only.'});
  const decade = Math.floor(answer / 10) * 10;
  chain.push({clue: 'It is between ' + decade + ' and ' + (decade + 10) + '.', narrowed: 'Range: ' + decade + '-' + (decade+10)});
  chain.push({clue: 'The ones digit is ' + (answer % 10) + '.', narrowed: 'Final digit revealed!'});
  return { answer, chain, range };
}

// ═══════════════════════════════════════════════════════════════════════════════
class EliminationGridScene extends Phaser.Scene {
  constructor() { super('EliminationGridScene'); }
  create() { this.W=this.scale.width;this.H=this.scale.height;this.round=0;this.lives=MAX_LIVES;this._bg();this._ui();this.startRound(); }
  _bg() { const bg=this.add.image(this.W/2,this.H/2,'bg');bg.setScale(Math.max(this.W/bg.width,this.H/bg.height));this.add.rectangle(this.W/2,this.H/2,this.W,this.H,0x000000,0.65); }
  _ui() { this.scoreLbl=this.add.text(this.W-14,14,'Score: 0',{fontSize:'16px',color:COL_ACCENT,fontFamily:"'Lexend', system-ui",fontStyle:'bold'}).setOrigin(1,0).setDepth(10);this.hg=this.add.group();this._rh();this.dg=this.add.group();this._rd(); }
  _rh() { this.hg.clear(true,true);for(let i=0;i<this.lives;i++)this.hg.add(this.add.text(14+i*22,14,'\\u2665',{fontSize:'18px',color:COL_DANGER}).setDepth(10)); }
  _rd() { this.dg.clear(true,true);for(let i=0;i<TOTAL_ROUNDS;i++){const c=i<this.round?COL_ACCENT:i===this.round?COL_PRIMARY:'#555555';this.dg.add(this.add.circle(this.W/2-40+i*20,this.H-16,5,hexToNum(c)).setDepth(10));} }

  startRound() {
    if(this.rg)this.rg.clear(true,true);this.rg=this.add.group();
    const data=getRound(this.round);this.answer=data.target;this.clueIdx=0;
    // Build elimination data: items = number pool, target = answer
    data.nums = data.items.slice();
    // Build clues from the answer
    const answer = data.target;
    const clues = [];
    if (answer % 2 === 0) clues.push({text: 'It is even', test: function(n){return n%2===0;}});
    else clues.push({text: 'It is odd', test: function(n){return n%2!==0;}});
    if (answer > 10) clues.push({text: 'It is greater than 10', test: function(n){return n>10;}});
    else clues.push({text: 'It is 10 or less', test: function(n){return n<=10;}});
    this.clues=clues;this._rd();
    const W=this.W,H=this.H;
    this.rg.add(this.add.text(W/2,H*0.06,'Find the number! Use clues to eliminate.',{fontSize:'13px',color:COL_ACCENT,fontFamily:"'Lexend', system-ui"}).setOrigin(0.5).setDepth(6));
    // Clue display
    this.clueLbl=this.add.text(W/2,H*0.15,'Clue: '+this.clues[0].text,{fontSize:'14px',color:COL_ACCENT,fontFamily:"'Lexend', system-ui",fontStyle:'bold'}).setOrigin(0.5).setDepth(6);
    this.rg.add(this.clueLbl);
    // Number grid (2 rows of 3)
    this.numBtns = [];
    data.nums.forEach((n, i) => {
      const col = i % 3; const row = Math.floor(i / 3);
      const x = W * 0.25 + col * (W * 0.25);
      const y = H * 0.35 + row * 70;
      const bg = this.add.rectangle(x, y, 70, 50, hexToNum(COL_SECONDARY), 0.3).setInteractive({useHandCursor:true}).setDepth(7);
      const lbl = this.add.text(x, y, String(n), {fontSize:'20px',color:COL_TEXT,fontFamily:"'Space Grotesk', sans-serif",fontStyle:'bold'}).setOrigin(0.5).setDepth(8);
      this.rg.add(bg); this.rg.add(lbl);
      this.numBtns.push({bg, lbl, val: n, eliminated: false});
      bg.on('pointerdown', () => this._pickNumber(i));
    });
    // Next clue button
    if (this.clues.length > 1) {
      const nxt = this.add.rectangle(W/2, H*0.78, 120, 36, hexToNum(COL_PRIMARY), 0.5).setInteractive({useHandCursor:true}).setDepth(9);
      this.rg.add(nxt);
      this.rg.add(this.add.text(W/2, H*0.78, 'Next clue', {fontSize:'13px',color:'#fff',fontFamily:"'Lexend', system-ui",fontStyle:'bold'}).setOrigin(0.5).setDepth(10));
      nxt.on('pointerdown', () => {
        if (this.clueIdx < this.clues.length - 1) {
          this.clueIdx++;
          this.clueLbl.setText('Clue: ' + this.clues[this.clueIdx].text);
        }
      });
    }
  }

  _pickNumber(idx) {
    const btn = this.numBtns[idx];
    if (btn.eliminated) return;
    if (btn.val === this.answer) {
      gameScore += 10 * (this.round + 1); this.scoreLbl.setText('Score: ' + gameScore); this.cameras.main.flash(200, 34, 197, 94); heroCheer(this, this.hero);
      this.round++; if (this.round >= TOTAL_ROUNDS) this.time.delayedCall(600, () => this.scene.start('VictoryScene', {score: gameScore}));
      else this.time.delayedCall(800, () => this.startRound());
    } else {
      this.lives--; this._rh(); this.cameras.main.shake(200, 0.01); heroShake(this, this.hero);
      btn.bg.setFillStyle(hexToNum(COL_DANGER), 0.3); btn.lbl.setColor(COL_DANGER); btn.eliminated = true;
      if (this.lives <= 0) this.time.delayedCall(500, () => this.scene.start('LoseScene', {score: gameScore}));
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
class TwentyQuestionsScene extends Phaser.Scene {
  constructor() { super('TwentyQuestionsScene'); }
  create() { this.W=this.scale.width;this.H=this.scale.height;this.round=0;this.lives=MAX_LIVES;this._bg();this._ui();this.startRound(); }
  _bg() { const bg=this.add.image(this.W/2,this.H/2,'bg');bg.setScale(Math.max(this.W/bg.width,this.H/bg.height));this.add.rectangle(this.W/2,this.H/2,this.W,this.H,0x000000,0.65); }
  _ui() { this.scoreLbl=this.add.text(this.W-14,14,'Score: 0',{fontSize:'16px',color:COL_ACCENT,fontFamily:"'Lexend', system-ui",fontStyle:'bold'}).setOrigin(1,0).setDepth(10);this.hg=this.add.group();this._rh();this.dg=this.add.group();this._rd(); }
  _rh() { this.hg.clear(true,true);for(let i=0;i<this.lives;i++)this.hg.add(this.add.text(14+i*22,14,'\\u2665',{fontSize:'18px',color:COL_DANGER}).setDepth(10)); }
  _rd() { this.dg.clear(true,true);for(let i=0;i<TOTAL_ROUNDS;i++){const c=i<this.round?COL_ACCENT:i===this.round?COL_PRIMARY:'#555555';this.dg.add(this.add.circle(this.W/2-40+i*20,this.H-16,5,hexToNum(c)).setDepth(10));} }

  startRound() {
    if(this.rg)this.rg.clear(true,true);this.rg=this.add.group();
    const data=getRound(this.round);this.hidden=data.target;
    // Derive questions from target
    const max = Math.max(...data.items, data.target) + 5;
    data.max = max;
    const hidden = data.target;
    const mid = Math.floor(max / 2);
    data.questions = [
      {text: 'Is it greater than ' + mid + '?', answer: hidden > mid},
      {text: 'Is it even?', answer: hidden % 2 === 0},
      {text: 'Is it greater than ' + Math.floor(max/4) + '?', answer: hidden > Math.floor(max/4)},
      {text: 'Is it less than ' + Math.floor(max*3/4) + '?', answer: hidden < Math.floor(max*3/4)},
      {text: 'Is it a multiple of 5?', answer: hidden % 5 === 0},
      {text: 'Is it a multiple of 3?', answer: hidden % 3 === 0},
    ];this.questionsAsked=0;this._rd();
    const W=this.W,H=this.H;
    this.rg.add(this.add.text(W/2,H*0.06,'Hidden number: 1 to '+data.max,{fontSize:'16px',color:COL_ACCENT,fontFamily:"'Space Grotesk', sans-serif",fontStyle:'bold'}).setOrigin(0.5).setDepth(6));
    this.rg.add(this.add.text(W/2,H*0.13,'Ask questions, then guess!',{fontSize:'11px',color:COL_TEXT,fontFamily:"'Lexend', system-ui",alpha:0.5}).setOrigin(0.5).setDepth(6));
    this.qCountLbl=this.add.text(W/2,H*0.18,'Questions asked: 0',{fontSize:'12px',color:COL_TEXT,fontFamily:"'Lexend', system-ui"}).setOrigin(0.5).setDepth(6);
    this.rg.add(this.qCountLbl);
    this.answerLbl=this.add.text(W/2,H*0.24,'',{fontSize:'13px',color:COL_ACCENT,fontFamily:"'Lexend', system-ui",fontStyle:'bold'}).setOrigin(0.5).setDepth(6);
    this.rg.add(this.answerLbl);
    // Question buttons
    data.questions.forEach((q, i) => {
      const y = H * 0.34 + i * 36;
      const btn = this.add.rectangle(W/2, y, W * 0.7, 28, hexToNum(COL_SECONDARY), 0.25).setInteractive({useHandCursor:true}).setDepth(7);
      this.rg.add(btn);
      this.rg.add(this.add.text(W/2, y, q.text, {fontSize:'12px',color:COL_TEXT,fontFamily:"'Lexend', system-ui"}).setOrigin(0.5).setDepth(8));
      btn.on('pointerdown', () => {
        this.questionsAsked++;
        this.qCountLbl.setText('Questions asked: ' + this.questionsAsked);
        this.answerLbl.setText(q.text + ' -> ' + (q.answer ? 'YES' : 'NO'));
        btn.setFillStyle(hexToNum(q.answer ? COL_ACCENT : COL_DANGER), 0.3);
      });
    });
    // Guess input area — number pad
    this.guess = '';
    this.guessLbl = this.add.text(W/2, H*0.72, 'Guess: _', {fontSize:'20px',color:COL_PRIMARY,fontFamily:"'Space Grotesk', sans-serif",fontStyle:'bold'}).setOrigin(0.5).setDepth(8);
    this.rg.add(this.guessLbl);
    // Number pad (0-9)
    for (let d = 0; d <= 9; d++) {
      const px = W * 0.18 + (d % 5) * (W * 0.16);
      const py = H * 0.80 + Math.floor(d / 5) * 34;
      const db = this.add.rectangle(px, py, 36, 28, hexToNum(COL_SECONDARY), 0.3).setInteractive({useHandCursor:true}).setDepth(9);
      this.rg.add(db);
      this.rg.add(this.add.text(px, py, String(d), {fontSize:'14px',color:COL_TEXT,fontFamily:"'Space Grotesk', sans-serif",fontStyle:'bold'}).setOrigin(0.5).setDepth(10));
      db.on('pointerdown', () => { if(this.guess.length<3){this.guess+=String(d);this.guessLbl.setText('Guess: '+this.guess);} });
    }
    // Submit guess
    const sub = this.add.rectangle(W*0.82, H*0.80, 60, 28, hexToNum(COL_PRIMARY), 1).setInteractive({useHandCursor:true}).setDepth(9);
    this.rg.add(sub);
    this.rg.add(this.add.text(W*0.82, H*0.80, 'Go', {fontSize:'13px',color:'#fff',fontFamily:"'Lexend', system-ui",fontStyle:'bold'}).setOrigin(0.5).setDepth(10));
    sub.on('pointerdown', () => this._submitGuess());
    // Clear
    const clr = this.add.rectangle(W*0.82, H*0.814+34, 60, 28, hexToNum(COL_DANGER), 0.4).setInteractive({useHandCursor:true}).setDepth(9);
    this.rg.add(clr);
    this.rg.add(this.add.text(W*0.82, H*0.814+34, 'C', {fontSize:'13px',color:COL_DANGER,fontFamily:"'Lexend', system-ui",fontStyle:'bold'}).setOrigin(0.5).setDepth(10));
    clr.on('pointerdown', () => { this.guess=''; this.guessLbl.setText('Guess: _'); });
  }

  _submitGuess() {
    const g = parseInt(this.guess);
    if (isNaN(g)) return;
    if (g === this.hidden) {
      const bonus = Math.max(1, 6 - this.questionsAsked);
      gameScore += bonus * (this.round + 1); this.scoreLbl.setText('Score: ' + gameScore); this.cameras.main.flash(200, 34, 197, 94); heroCheer(this, this.hero);
      this.round++; if (this.round >= TOTAL_ROUNDS) this.time.delayedCall(600, () => this.scene.start('VictoryScene', {score: gameScore}));
      else this.time.delayedCall(800, () => this.startRound());
    } else {
      this.lives--; this._rh(); this.cameras.main.shake(200, 0.01); heroShake(this, this.hero);
      this.guess = ''; this.guessLbl.setText('Guess: _');
      if (this.lives <= 0) this.time.delayedCall(500, () => this.scene.start('LoseScene', {score: gameScore}));
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
class LogicChainScene extends Phaser.Scene {
  constructor() { super('LogicChainScene'); }
  create() { this.W=this.scale.width;this.H=this.scale.height;this.round=0;this.lives=MAX_LIVES;this._bg();this._ui();this.startRound(); }
  _bg() { const bg=this.add.image(this.W/2,this.H/2,'bg');bg.setScale(Math.max(this.W/bg.width,this.H/bg.height));this.add.rectangle(this.W/2,this.H/2,this.W,this.H,0x000000,0.65); }
  _ui() { this.scoreLbl=this.add.text(this.W-14,14,'Score: 0',{fontSize:'16px',color:COL_ACCENT,fontFamily:"'Lexend', system-ui",fontStyle:'bold'}).setOrigin(1,0).setDepth(10);this.hg=this.add.group();this._rh();this.dg=this.add.group();this._rd(); }
  _rh() { this.hg.clear(true,true);for(let i=0;i<this.lives;i++)this.hg.add(this.add.text(14+i*22,14,'\\u2665',{fontSize:'18px',color:COL_DANGER}).setDepth(10)); }
  _rd() { this.dg.clear(true,true);for(let i=0;i<TOTAL_ROUNDS;i++){const c=i<this.round?COL_ACCENT:i===this.round?COL_PRIMARY:'#555555';this.dg.add(this.add.circle(this.W/2-40+i*20,this.H-16,5,hexToNum(c)).setDepth(10));} }

  startRound() {
    if(this.rg)this.rg.clear(true,true);this.rg=this.add.group();
    const data=getRound(this.round);this.answer=data.target;
    // Build logic chain clues from target
    const ans = data.target;
    const chain = [];
    if (ans % 2 === 0) chain.push({clue: 'The number is even.', narrowed: 'Even numbers only.'});
    else chain.push({clue: 'The number is odd.', narrowed: 'Odd numbers only.'});
    const decade = Math.floor(ans / 10) * 10;
    chain.push({clue: 'It is between ' + decade + ' and ' + (decade + 10) + '.', narrowed: 'Range: ' + decade + '-' + (decade+10)});
    chain.push({clue: 'The ones digit is ' + (ans % 10) + '.', narrowed: 'Final digit revealed!'});
    this.chain=chain;this.chainIdx=0;this._rd();
    const W=this.W,H=this.H;
    this.rg.add(this.add.text(W/2,H*0.06,'Follow the clue chain!',{fontSize:'16px',color:COL_ACCENT,fontFamily:"'Space Grotesk', sans-serif",fontStyle:'bold'}).setOrigin(0.5).setDepth(6));
    // Show clues as they unlock
    this.clueLabels=[];
    this.chain.forEach((c,i) => {
      const y = H*0.18 + i*40;
      const txt = i===0 ? 'Clue 1: '+c.clue : 'Clue '+(i+1)+': ???';
      const lbl = this.add.text(W/2, y, txt, {fontSize:'13px',color:i===0?COL_ACCENT:'#555555',fontFamily:"'Lexend', system-ui"}).setOrigin(0.5).setDepth(6);
      this.rg.add(lbl);
      this.clueLabels.push(lbl);
    });
    // Reveal next clue button
    const reveal = this.add.rectangle(W/2, H*0.52, 140, 36, hexToNum(COL_SECONDARY), 0.4).setInteractive({useHandCursor:true}).setDepth(7);
    this.rg.add(reveal);
    this.revealLbl = this.add.text(W/2, H*0.52, 'Reveal next clue', {fontSize:'12px',color:COL_TEXT,fontFamily:"'Lexend', system-ui",fontStyle:'bold'}).setOrigin(0.5).setDepth(8);
    this.rg.add(this.revealLbl);
    reveal.on('pointerdown', () => {
      if (this.chainIdx < this.chain.length - 1) {
        this.chainIdx++;
        this.clueLabels[this.chainIdx].setText('Clue '+(this.chainIdx+1)+': '+this.chain[this.chainIdx].clue);
        this.clueLabels[this.chainIdx].setColor(COL_ACCENT);
      }
    });
    // Number pad for final answer
    this.guess='';
    this.guessLbl=this.add.text(W/2,H*0.62,'Answer: _',{fontSize:'20px',color:COL_PRIMARY,fontFamily:"'Space Grotesk', sans-serif",fontStyle:'bold'}).setOrigin(0.5).setDepth(8);
    this.rg.add(this.guessLbl);
    for(let d=0;d<=9;d++){
      const px=W*0.18+(d%5)*(W*0.16);const py=H*0.72+Math.floor(d/5)*34;
      const db=this.add.rectangle(px,py,36,28,hexToNum(COL_SECONDARY),0.3).setInteractive({useHandCursor:true}).setDepth(9);
      this.rg.add(db);this.rg.add(this.add.text(px,py,String(d),{fontSize:'14px',color:COL_TEXT,fontFamily:"'Space Grotesk', sans-serif",fontStyle:'bold'}).setOrigin(0.5).setDepth(10));
      db.on('pointerdown',()=>{if(this.guess.length<3){this.guess+=String(d);this.guessLbl.setText('Answer: '+this.guess);}});
    }
    const sub=this.add.rectangle(W*0.82,H*0.72,60,28,hexToNum(COL_PRIMARY),1).setInteractive({useHandCursor:true}).setDepth(9);
    this.rg.add(sub);this.rg.add(this.add.text(W*0.82,H*0.72,'Go',{fontSize:'13px',color:'#fff',fontFamily:"'Lexend', system-ui",fontStyle:'bold'}).setOrigin(0.5).setDepth(10));
    sub.on('pointerdown',()=>this._submitAnswer());
    const clr=this.add.rectangle(W*0.82,H*0.72+34,60,28,hexToNum(COL_DANGER),0.4).setInteractive({useHandCursor:true}).setDepth(9);
    this.rg.add(clr);this.rg.add(this.add.text(W*0.82,H*0.72+34,'C',{fontSize:'13px',color:COL_DANGER,fontFamily:"'Lexend', system-ui",fontStyle:'bold'}).setOrigin(0.5).setDepth(10));
    clr.on('pointerdown',()=>{this.guess='';this.guessLbl.setText('Answer: _');});
  }

  _submitAnswer() {
    const g=parseInt(this.guess);
    if(isNaN(g))return;
    if(g===this.answer){
      gameScore+=10*(this.round+1);this.scoreLbl.setText('Score: '+gameScore);this.cameras.main.flash(200,34,197,94);
      this.round++;if(this.round>=TOTAL_ROUNDS)this.time.delayedCall(600,()=>this.scene.start('VictoryScene',{score:gameScore}));
      else this.time.delayedCall(800,()=>this.startRound());
    }else{
      this.lives--;this._rh();this.cameras.main.shake(200,0.01);
      this.guess='';this.guessLbl.setText('Answer: _');
      if(this.lives<=0)this.time.delayedCall(500,()=>this.scene.start('LoseScene',{score:gameScore}));
    }
  }
}
`
