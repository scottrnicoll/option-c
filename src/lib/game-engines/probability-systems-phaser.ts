// Roll & Predict — Phaser engine with 3 game options.
// Math: Probability, statistics, mode, median, mean, spinners, data analysis.
// Options: find-the-stat, bet-the-spinner, build-the-chart

import type { ThemeConfig, MathParams, GameOption } from "./engine-types"
import { phaserGame } from "./base-phaser-template"
import { getOptionDef } from "./game-option-registry"

export function probabilitySystemsPhaserEngine(
  config: ThemeConfig,
  math: MathParams,
  option: GameOption = "find-the-stat"
): string {
  const validOptions = ["find-the-stat", "bet-the-spinner", "build-the-chart"]
  const activeOption = validOptions.includes(option) ? option : "find-the-stat"
  const optDef = getOptionDef(activeOption)
  const sceneMap: Record<string, string> = {
    "find-the-stat": "FindTheStatScene",
    "bet-the-spinner": "BetTheSpinnerScene",
    "build-the-chart": "BuildTheChartScene",
  }
  return phaserGame({
    config, math, option: activeOption,
    sceneName: sceneMap[activeOption],
    introText: optDef?.introText || "Analyze data and predict outcomes!",
    helpText: optDef?.helpText || "Use statistics and probability to win.",
    gameSceneCode: GAME_SCENES,
  })
}

const GAME_SCENES = `
// ─── Round generators ────────────────────────────────────────────────────────

function generateStatRound(round) {
  if (AI_ROUNDS && AI_ROUNDS[round]) { const r=AI_ROUNDS[round]; return { prompt: r.prompt, target: r.target, hint: r.hint, numbers: r.items || [3,5,5,7,10] }; }
  // Progressive: 0-1 mode, 2-3 median, 4 mean
  const statType = round < 2 ? 'mode' : round < 4 ? 'median' : 'mean';
  const len = round < 2 ? 5 : round < 4 ? 5 : 5;
  let numbers = [];
  if (statType === 'mode') {
    const modeVal = Math.floor(Math.random() * 10) + 1;
    numbers.push(modeVal, modeVal);
    while (numbers.length < len) {
      let v = Math.floor(Math.random() * 12) + 1;
      if (v !== modeVal) numbers.push(v);
    }
    numbers.sort((a, b) => a - b);
    return { numbers, statType, target: modeVal, prompt: 'What is the MODE?' };
  } else if (statType === 'median') {
    for (let i = 0; i < len; i++) numbers.push(Math.floor(Math.random() * 15) + 1);
    numbers.sort((a, b) => a - b);
    const median = numbers[Math.floor(len / 2)];
    return { numbers, statType, target: median, prompt: 'What is the MEDIAN?' };
  } else {
    // mean — make sure it's a whole number
    let sum = 0;
    for (let i = 0; i < len - 1; i++) { const v = Math.floor(Math.random() * 10) + 1; numbers.push(v); sum += v; }
    // pick last value so sum is divisible by len
    const remainder = sum % len;
    const last = remainder === 0 ? len : len - remainder + Math.floor(Math.random() * 2) * len;
    numbers.push(last); sum += last;
    numbers.sort((a, b) => a - b);
    const mean = Math.round(sum / len);
    return { numbers, statType, target: mean, prompt: 'What is the MEAN?' };
  }
}

function generateStatChoices(target) {
  const choices = [target];
  while (choices.length < 4) {
    const offset = Math.floor(Math.random() * 5) + 1;
    const candidate = Math.random() < 0.5 ? target + offset : target - offset;
    if (candidate > 0 && choices.indexOf(candidate) === -1) choices.push(candidate);
  }
  // shuffle
  for (let i = choices.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = choices[i]; choices[i] = choices[j]; choices[j] = t; }
  return choices;
}

function generateSpinnerRound(round) {
  // Progressive: more sections, closer sizes
  const sectionCount = round < 2 ? 3 : round < 4 ? 4 : 5;
  const colors = ['Red', 'Blue', 'Green', 'Yellow', 'Purple'];
  const colorHexes = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7'];
  // Generate section sizes (percentages that add to 100)
  let sizes = [];
  const closeness = round < 2 ? 15 : round < 4 ? 8 : 4;
  let remaining = 100;
  for (let i = 0; i < sectionCount - 1; i++) {
    const base = Math.floor(100 / sectionCount);
    const size = base + Math.floor(Math.random() * closeness) - Math.floor(closeness / 2);
    const clamped = Math.max(5, Math.min(remaining - (sectionCount - i - 1) * 5, size));
    sizes.push(clamped);
    remaining -= clamped;
  }
  sizes.push(remaining);
  // Find largest
  let largestIdx = 0;
  for (let i = 1; i < sizes.length; i++) { if (sizes[i] > sizes[largestIdx]) largestIdx = i; }
  const sections = sizes.map((s, i) => ({ name: colors[i], hex: colorHexes[i], pct: s }));
  return { sections, correctIdx: largestIdx, correctName: colors[largestIdx] };
}

function generateChartRound(round) {
  // Show target stats, one value missing. Progressive difficulty.
  const len = round < 2 ? 3 : round < 4 ? 4 : 5;
  const values = [];
  for (let i = 0; i < len; i++) values.push(Math.floor(Math.random() * 8) + 2);
  const sum = values.reduce((a, b) => a + b, 0);
  const mean = Math.round(sum / len);
  // Hide one value
  const hideIdx = Math.floor(Math.random() * len);
  const hidden = values[hideIdx];
  const shown = values.map((v, i) => i === hideIdx ? '?' : String(v));
  return { values, shown, hideIdx, hidden, mean, prompt: 'Mean = ' + mean + '. Find the missing value.' };
}

// ═══════════════════════════════════════════════════════════════════════════════
class FindTheStatScene extends Phaser.Scene {
  constructor() { super('FindTheStatScene'); }
  create() { this.W=this.scale.width;this.H=this.scale.height;this.round=0;this.lives=MAX_LIVES;this._bg();this._ui();this.startRound(); }
  _bg() { const bg=this.add.image(this.W/2,this.H/2,'bg');bg.setScale(Math.max(this.W/bg.width,this.H/bg.height));this.add.rectangle(this.W/2,this.H/2,this.W,this.H,0x000000,0.65); }
  _ui() { this.scoreLbl=this.add.text(this.W-14,14,'Score: 0',{fontSize:'16px',color:COL_ACCENT,fontFamily:"'Lexend', system-ui",fontStyle:'bold'}).setOrigin(1,0).setDepth(10);this.hg=this.add.group();this._rh();this.dg=this.add.group();this._rd(); }
  _rh() { this.hg.clear(true,true);for(let i=0;i<this.lives;i++)this.hg.add(this.add.text(14+i*22,14,'♥',{fontSize:'18px',color:COL_DANGER}).setDepth(10)); }
  _rd() { this.dg.clear(true,true);for(let i=0;i<TOTAL_ROUNDS;i++){const c=i<this.round?COL_ACCENT:i===this.round?COL_PRIMARY:'#555555';this.dg.add(this.add.circle(this.W/2-40+i*20,this.H-16,5,hexToNum(c)).setDepth(10));} }

  startRound() {
    if(this.rg)this.rg.clear(true,true);this.rg=this.add.group();
    const data=getRound(this.round);this.target=data.target;data.numbers=data.items;data.statType=data.prompt.toLowerCase().indexOf('mode')>=0?'mode':data.prompt.toLowerCase().indexOf('median')>=0?'median':'mean';this._rd();
    const W=this.W,H=this.H;
    // Show prompt
    this.rg.add(this.add.text(W/2,H*0.1,data.prompt,{fontSize:'22px',color:COL_ACCENT,fontFamily:"'Space Grotesk', sans-serif",fontStyle:'bold'}).setOrigin(0.5).setDepth(6));
    // Show number cards
    const nums=data.numbers;
    const cardW=50,gap=10,totalW=nums.length*(cardW+gap)-gap;
    const startX=W/2-totalW/2+cardW/2;
    for(let i=0;i<nums.length;i++){
      const x=startX+i*(cardW+gap),y=H*0.3;
      this.rg.add(this.add.rectangle(x,y,cardW,52,hexToNum(COL_SECONDARY),0.25).setDepth(5));
      this.rg.add(this.add.text(x,y,String(nums[i]),{fontSize:'24px',color:COL_TEXT,fontFamily:"'Space Grotesk', sans-serif",fontStyle:'bold'}).setOrigin(0.5).setDepth(6));
    }
    // Hint label for stat type
    const hintMap = { mode: 'Mode = most frequent', median: 'Median = middle value', mean: 'Mean = average' };
    this.rg.add(this.add.text(W/2,H*0.44,hintMap[data.statType]||'',{fontSize:'12px',color:COL_TEXT,fontFamily:"'Lexend', system-ui",alpha:0.5}).setOrigin(0.5).setDepth(5));
    // 4 choice buttons
    const choices=generateStatChoices(this.target);
    const btnW=100,btnH=44,btnGap=14;
    const btnTotalW=choices.length*(btnW+btnGap)-btnGap;
    const btnStartX=W/2-btnTotalW/2+btnW/2;
    choices.forEach((val,i)=>{
      const x=btnStartX+i*(btnW+btnGap),y=H*0.6;
      const btn=this.add.rectangle(x,y,btnW,btnH,hexToNum(COL_SECONDARY),0.3).setInteractive({useHandCursor:true}).setDepth(7);
      this.rg.add(btn);
      this.rg.add(this.add.text(x,y,String(val),{fontSize:'20px',color:COL_TEXT,fontFamily:"'Space Grotesk', sans-serif",fontStyle:'bold'}).setOrigin(0.5).setDepth(8));
      btn.on('pointerdown',()=>this._check(val));
    });
  }

  _check(val) {
    if(val===this.target){
      gameScore+=10*(this.round+1);this.scoreLbl.setText('Score: '+gameScore);this.cameras.main.flash(200,34,197,94);
      this.round++;if(this.round>=TOTAL_ROUNDS)this.time.delayedCall(600,()=>this.scene.start('VictoryScene',{score:gameScore}));
      else this.time.delayedCall(800,()=>this.startRound());
    }else{this.lives--;this._rh();this.cameras.main.shake(200,0.01);
      if(this.lives<=0)this.time.delayedCall(500,()=>this.scene.start('LoseScene',{score:gameScore}));}
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
class BetTheSpinnerScene extends Phaser.Scene {
  constructor() { super('BetTheSpinnerScene'); }
  create() { this.W=this.scale.width;this.H=this.scale.height;this.round=0;this.lives=MAX_LIVES;this._bg();this._ui();this.startRound(); }
  _bg() { const bg=this.add.image(this.W/2,this.H/2,'bg');bg.setScale(Math.max(this.W/bg.width,this.H/bg.height));this.add.rectangle(this.W/2,this.H/2,this.W,this.H,0x000000,0.65); }
  _ui() { this.scoreLbl=this.add.text(this.W-14,14,'Score: 0',{fontSize:'16px',color:COL_ACCENT,fontFamily:"'Lexend', system-ui",fontStyle:'bold'}).setOrigin(1,0).setDepth(10);this.hg=this.add.group();this._rh();this.dg=this.add.group();this._rd(); }
  _rh() { this.hg.clear(true,true);for(let i=0;i<this.lives;i++)this.hg.add(this.add.text(14+i*22,14,'♥',{fontSize:'18px',color:COL_DANGER}).setDepth(10)); }
  _rd() { this.dg.clear(true,true);for(let i=0;i<TOTAL_ROUNDS;i++){const c=i<this.round?COL_ACCENT:i===this.round?COL_PRIMARY:'#555555';this.dg.add(this.add.circle(this.W/2-40+i*20,this.H-16,5,hexToNum(c)).setDepth(10));} }

  startRound() {
    if(this.rg)this.rg.clear(true,true);this.rg=this.add.group();
    const data=getRound(this.round);
    // Build spinner data: fall back to generator for visual display
    const fallback=generateSpinnerRound(this.round);
    data.sections=fallback.sections;
    this.correctName=fallback.correctName;this._rd();
    const W=this.W,H=this.H;
    // Prompt
    this.rg.add(this.add.text(W/2,H*0.06,'Which color is MOST LIKELY?',{fontSize:'18px',color:COL_ACCENT,fontFamily:"'Space Grotesk', sans-serif",fontStyle:'bold'}).setOrigin(0.5).setDepth(6));
    // Draw spinner (pie chart using arcs via graphics)
    const cx=W/2,cy=H*0.36,radius=Math.min(W,H)*0.18;
    const gfx=this.add.graphics().setDepth(5);
    let startAngle=-Math.PI/2;
    data.sections.forEach((s)=>{
      const sweep=s.pct/100*Math.PI*2;
      gfx.fillStyle(hexToNum(s.hex),1);
      gfx.beginPath();
      gfx.moveTo(cx,cy);
      // Draw arc segment with line segments
      const steps=Math.max(12,Math.floor(sweep/(Math.PI/24)));
      for(let j=0;j<=steps;j++){
        const a=startAngle+sweep*j/steps;
        gfx.lineTo(cx+Math.cos(a)*radius,cy+Math.sin(a)*radius);
      }
      gfx.closePath();
      gfx.fillPath();
      // Label inside wedge
      const midAngle=startAngle+sweep/2;
      const lx=cx+Math.cos(midAngle)*radius*0.6;
      const ly=cy+Math.sin(midAngle)*radius*0.6;
      this.rg.add(this.add.text(lx,ly,s.pct+'%',{fontSize:'11px',color:'#fff',fontFamily:"'Lexend', system-ui",fontStyle:'bold',stroke:'#000',strokeThickness:2}).setOrigin(0.5).setDepth(7));
      startAngle+=sweep;
    });
    this.rg.add(gfx);
    // Spinner outline
    gfx.lineStyle(2,hexToNum(COL_TEXT),0.6);
    gfx.strokeCircle(cx,cy,radius);
    // Color buttons
    const btnY=H*0.62;
    const btnW=90,btnH=40,btnGap=10;
    const totalBtnW=data.sections.length*(btnW+btnGap)-btnGap;
    const btnStartX=W/2-totalBtnW/2+btnW/2;
    data.sections.forEach((s,i)=>{
      const x=btnStartX+i*(btnW+btnGap);
      const btn=this.add.rectangle(x,btnY,btnW,btnH,hexToNum(s.hex),0.7).setInteractive({useHandCursor:true}).setDepth(7);
      this.rg.add(btn);
      this.rg.add(this.add.text(x,btnY,s.name,{fontSize:'14px',color:'#fff',fontFamily:"'Space Grotesk', sans-serif",fontStyle:'bold',stroke:'#000',strokeThickness:2}).setOrigin(0.5).setDepth(8));
      btn.on('pointerdown',()=>this._check(s.name));
    });
  }

  _check(name) {
    if(name===this.correctName){
      gameScore+=10*(this.round+1);this.scoreLbl.setText('Score: '+gameScore);this.cameras.main.flash(200,34,197,94);
      this.round++;if(this.round>=TOTAL_ROUNDS)this.time.delayedCall(600,()=>this.scene.start('VictoryScene',{score:gameScore}));
      else this.time.delayedCall(800,()=>this.startRound());
    }else{this.lives--;this._rh();this.cameras.main.shake(200,0.01);
      if(this.lives<=0)this.time.delayedCall(500,()=>this.scene.start('LoseScene',{score:gameScore}));}
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
class BuildTheChartScene extends Phaser.Scene {
  constructor() { super('BuildTheChartScene'); }
  create() { this.W=this.scale.width;this.H=this.scale.height;this.round=0;this.lives=MAX_LIVES;this._bg();this._ui();this.startRound(); }
  _bg() { const bg=this.add.image(this.W/2,this.H/2,'bg');bg.setScale(Math.max(this.W/bg.width,this.H/bg.height));this.add.rectangle(this.W/2,this.H/2,this.W,this.H,0x000000,0.65); }
  _ui() { this.scoreLbl=this.add.text(this.W-14,14,'Score: 0',{fontSize:'16px',color:COL_ACCENT,fontFamily:"'Lexend', system-ui",fontStyle:'bold'}).setOrigin(1,0).setDepth(10);this.hg=this.add.group();this._rh();this.dg=this.add.group();this._rd(); }
  _rh() { this.hg.clear(true,true);for(let i=0;i<this.lives;i++)this.hg.add(this.add.text(14+i*22,14,'♥',{fontSize:'18px',color:COL_DANGER}).setDepth(10)); }
  _rd() { this.dg.clear(true,true);for(let i=0;i<TOTAL_ROUNDS;i++){const c=i<this.round?COL_ACCENT:i===this.round?COL_PRIMARY:'#555555';this.dg.add(this.add.circle(this.W/2-40+i*20,this.H-16,5,hexToNum(c)).setDepth(10));} }

  startRound() {
    if(this.rg)this.rg.clear(true,true);this.rg=this.add.group();
    const data=getRound(this.round);this.target=data.target;
    // Build chart data from getRound
    data.values=data.items.slice();data.hidden=data.target;
    const hideIdx=data.values.indexOf(data.target);
    data.hideIdx=hideIdx>=0?hideIdx:0;
    data.shown=data.values.map(function(v,i){return i===data.hideIdx?'?':String(v);});
    const sum=data.values.reduce(function(a,b){return a+b;},0);
    data.mean=Math.round(sum/data.values.length);
    data.prompt=data.prompt||('Mean = '+data.mean+'. Find the missing value.');this.inputVal='';this._rd();
    const W=this.W,H=this.H;
    // Prompt
    this.rg.add(this.add.text(W/2,H*0.08,data.prompt,{fontSize:'18px',color:COL_ACCENT,fontFamily:"'Space Grotesk', sans-serif",fontStyle:'bold'}).setOrigin(0.5).setDepth(6));
    // Show values as cards
    const cardW=52,gap=10,totalCW=data.shown.length*(cardW+gap)-gap;
    const startX=W/2-totalCW/2+cardW/2;
    data.shown.forEach((v,i)=>{
      const x=startX+i*(cardW+gap),y=H*0.22;
      const isHidden=v==='?';
      const col=isHidden?hexToNum(COL_DANGER):hexToNum(COL_SECONDARY);
      this.rg.add(this.add.rectangle(x,y,cardW,52,col,isHidden?0.5:0.25).setDepth(5));
      this.rg.add(this.add.text(x,y,v,{fontSize:'22px',color:isHidden?COL_DANGER:COL_TEXT,fontFamily:"'Space Grotesk', sans-serif",fontStyle:'bold'}).setOrigin(0.5).setDepth(6));
    });
    // Input display
    this.inputLbl=this.add.text(W/2,H*0.38,'_',{fontSize:'36px',color:COL_PRIMARY,fontFamily:"'Space Grotesk', sans-serif",fontStyle:'bold'}).setOrigin(0.5).setDepth(6);
    this.rg.add(this.inputLbl);
    // Number pad (0-9, backspace, submit)
    const keys=['7','8','9','4','5','6','1','2','3','⌫','0','✓'];
    const padW=56,padH=44,padGap=8;
    const cols=3,rows=4;
    const padTotalW=cols*(padW+padGap)-padGap;
    const padStartX=W/2-padTotalW/2+padW/2;
    const padStartY=H*0.48;
    keys.forEach((k,i)=>{
      const col=Math.floor(i%cols),row=Math.floor(i/cols);
      const x=padStartX+col*(padW+padGap),y=padStartY+row*(padH+padGap);
      const isAction=k==='⌫'||k==='✓';
      const btnCol=k==='✓'?hexToNum(COL_PRIMARY):k==='⌫'?hexToNum(COL_DANGER):hexToNum(COL_SECONDARY);
      const btn=this.add.rectangle(x,y,padW,padH,btnCol,isAction?0.7:0.3).setInteractive({useHandCursor:true}).setDepth(7);
      this.rg.add(btn);
      this.rg.add(this.add.text(x,y,k,{fontSize:'20px',color:isAction?'#fff':COL_TEXT,fontFamily:"'Space Grotesk', sans-serif",fontStyle:'bold'}).setOrigin(0.5).setDepth(8));
      btn.on('pointerdown',()=>{
        if(k==='⌫'){this.inputVal=this.inputVal.slice(0,-1);}
        else if(k==='✓'){this._check();return;}
        else{if(this.inputVal.length<4)this.inputVal+=k;}
        this.inputLbl.setText(this.inputVal||'_');
      });
    });
  }

  _check() {
    const val=parseInt(this.inputVal,10);
    if(val===this.target){
      gameScore+=10*(this.round+1);this.scoreLbl.setText('Score: '+gameScore);this.cameras.main.flash(200,34,197,94);
      this.round++;if(this.round>=TOTAL_ROUNDS)this.time.delayedCall(600,()=>this.scene.start('VictoryScene',{score:gameScore}));
      else this.time.delayedCall(800,()=>this.startRound());
    }else{this.lives--;this._rh();this.cameras.main.shake(200,0.01);
      if(this.lives<=0)this.time.delayedCall(500,()=>this.scene.start('LoseScene',{score:gameScore}));}
  }
}
`
