// Pattern & Repeat — Phaser engine with 3 game options.
// Math: Patterns, sequences, rules, arithmetic/geometric sequences.
// Options: sequence-builder, pattern-machine, broken-pattern

import type { ThemeConfig, MathParams, GameOption } from "./engine-types"
import { phaserGame } from "./base-phaser-template"
import { getOptionDef } from "./game-option-registry"

export function timingRhythmPhaserEngine(
  config: ThemeConfig,
  math: MathParams,
  option: GameOption = "sequence-builder"
): string {
  const validOptions = ["sequence-builder", "pattern-machine", "broken-pattern"]
  const activeOption = validOptions.includes(option) ? option : "sequence-builder"
  const optDef = getOptionDef(activeOption)
  const sceneMap: Record<string, string> = {
    "sequence-builder": "SequenceBuilderScene",
    "pattern-machine": "PatternMachineScene",
    "broken-pattern": "BrokenPatternScene",
  }
  return phaserGame({
    config, math, option: activeOption,
    sceneName: sceneMap[activeOption],
    introText: optDef?.introText || "Find the pattern!",
    helpText: optDef?.helpText || "Look for the rule in the sequence.",
    gameSceneCode: GAME_SCENES,
  })
}

const GAME_SCENES = `
function generateSequenceRound(round) {
  if (AI_ROUNDS && AI_ROUNDS[round]) {
    const r = AI_ROUNDS[round]; return { prompt: r.prompt, sequence: r.items.slice(), answer: r.target, hint: r.hint };
  }
  const rules = round < 2
    ? [{ type: 'add', val: Math.floor(Math.random() * 5) + 2 }]
    : round < 4
      ? [{ type: 'add', val: Math.floor(Math.random() * 8) + 3 }, { type: 'mult', val: 2 }]
      : [{ type: 'add', val: Math.floor(Math.random() * 10) + 5 }, { type: 'mult', val: 2 }, { type: 'mult', val: 3 }];
  const rule = rules[Math.floor(Math.random() * rules.length)];
  let start = Math.floor(Math.random() * 10) + 1;
  const seq = [start];
  for (let i = 0; i < 4; i++) {
    start = rule.type === 'add' ? start + rule.val : start * rule.val;
    seq.push(start);
  }
  const answer = seq.pop();
  return { prompt: 'What comes next?', sequence: seq, answer, hint: null };
}

function generatePatternRuleRound(round) {
  const addVal = round < 2 ? Math.floor(Math.random() * 4) + 2 : Math.floor(Math.random() * 8) + 3;
  const isMultiply = round >= 3 && Math.random() > 0.5;
  const rule = isMultiply ? { type: 'multiply', val: 2 } : { type: 'add', val: addVal };
  let start = Math.floor(Math.random() * 5) + 1;
  const seq = [start];
  for (let i = 0; i < 5; i++) {
    start = rule.type === 'add' ? start + rule.val : start * rule.val;
    seq.push(start);
  }
  // Options for the rule
  const options = [
    { label: '+' + addVal, correct: rule.type === 'add' },
    { label: '×2', correct: rule.type === 'multiply' && rule.val === 2 },
    { label: '+' + (addVal + 2), correct: false },
    { label: '×3', correct: rule.type === 'multiply' && rule.val === 3 },
  ].filter(o => o.label !== (rule.type === 'add' ? '×2' : '+' + addVal) || !o.correct);
  // Ensure exactly one correct
  if (!options.some(o => o.correct)) options[0].correct = true;
  return { sequence: seq, rule, options: options.slice(0, 4) };
}

function generateBrokenRound(round) {
  const addVal = round < 2 ? Math.floor(Math.random() * 4) + 2 : Math.floor(Math.random() * 8) + 3;
  let start = Math.floor(Math.random() * 5) + 1;
  const seq = [start];
  for (let i = 0; i < 5; i++) { start += addVal; seq.push(start); }
  // Break one
  const breakIdx = Math.floor(Math.random() * (seq.length - 2)) + 1;
  const original = seq[breakIdx];
  seq[breakIdx] += (Math.random() > 0.5 ? 1 : -1) * (Math.floor(Math.random() * 3) + 1);
  return { sequence: seq, brokenIdx: breakIdx, correctValue: original };
}

// ═══════════════════════════════════════════════════════════════════════════════
class SequenceBuilderScene extends Phaser.Scene {
  constructor() { super('SequenceBuilderScene'); }
  create() { this.W=this.scale.width;this.H=this.scale.height;this.round=0;this.lives=MAX_LIVES;this._bg();this._ui();this.startRound(); }
  _bg() { const bg=this.add.image(this.W/2,this.H/2,'bg');bg.setScale(Math.max(this.W/bg.width,this.H/bg.height));this.add.rectangle(this.W/2,this.H/2,this.W,this.H,0x000000,0.48); }
  _ui() { this.scoreLbl=this.add.text(this.W-14,14,'Score: 0',{fontSize:'16px',color:COL_ACCENT,fontFamily:"'Lexend', system-ui",fontStyle:'bold'}).setOrigin(1,0).setDepth(10);this.hg=this.add.group();this._rh();this.dg=this.add.group();this._rd(); }
  _rh() { this.hg.clear(true,true);for(let i=0;i<this.lives;i++)this.hg.add(this.add.text(14+i*22,14,'♥',{fontSize:'18px',color:COL_DANGER}).setDepth(10)); }
  _rd() { this.dg.clear(true,true);for(let i=0;i<TOTAL_ROUNDS;i++){const c=i<this.round?COL_ACCENT:i===this.round?COL_PRIMARY:'#555555';this.dg.add(this.add.circle(this.W/2-40+i*20,this.H-16,5,hexToNum(c)).setDepth(10));} }

  startRound() {
    if(this.rg)this.rg.clear(true,true);this.rg=this.add.group();
    const data=generateSequenceRound(this.round);this.correctAnswer=data.answer;this._rd();
    const W=this.W,H=this.H;
    this.rg.add(this.add.text(W/2,H*0.12,data.prompt,{fontSize:'16px',color:COL_ACCENT,fontFamily:"'Space Grotesk', sans-serif",fontStyle:'bold'}).setOrigin(0.5).setDepth(6));
    // Show sequence
    const gap=Math.min(70,(W*0.8)/(data.sequence.length+1));
    const startX=W/2-((data.sequence.length)*gap)/2;
    data.sequence.forEach((v,i)=>{
      const x=startX+i*gap;
      this.rg.add(this.add.rectangle(x,H*0.3,55,44,hexToNum(COL_SECONDARY),0.3).setDepth(5));
      this.rg.add(this.add.text(x,H*0.3,String(v),{fontSize:'22px',color:COL_TEXT,fontFamily:"'Space Grotesk', sans-serif",fontStyle:'bold'}).setOrigin(0.5).setDepth(6));
      if(i<data.sequence.length-1) this.rg.add(this.add.text(x+gap/2,H*0.3,'→',{fontSize:'16px',color:'#555'}).setOrigin(0.5).setDepth(5));
    });
    // Question mark box
    const qx=startX+data.sequence.length*gap;
    this.rg.add(this.add.rectangle(qx,H*0.3,55,44,hexToNum(COL_PRIMARY),0.2).setStrokeStyle(2,hexToNum(COL_PRIMARY),0.5).setDepth(5));
    this.rg.add(this.add.text(qx-gap/2,H*0.3,'→',{fontSize:'16px',color:'#555'}).setOrigin(0.5).setDepth(5));
    this.ansLbl=this.add.text(qx,H*0.3,'?',{fontSize:'22px',color:COL_PRIMARY,fontFamily:"'Space Grotesk', sans-serif",fontStyle:'bold'}).setOrigin(0.5).setDepth(6);
    this.rg.add(this.ansLbl);
    // Input
    this.inputText='';
    this.inputLbl=this.add.text(W/2,H*0.48,'_',{fontSize:'32px',color:COL_PRIMARY,fontFamily:"'Space Grotesk', sans-serif",fontStyle:'bold'}).setOrigin(0.5).setDepth(10);
    this.rg.add(this.inputLbl);
    for(let i=0;i<=9;i++){const c=i<5?i:i-5;const r=i<5?0:1;const x=W/2-100+c*50;const y=H*0.6+r*44;
      const btn=this.add.rectangle(x,y,40,36,hexToNum(COL_SECONDARY),0.4).setInteractive({useHandCursor:true}).setDepth(10);
      this.add.text(x,y,String(i),{fontSize:'18px',color:COL_TEXT,fontFamily:"'Space Grotesk', sans-serif",fontStyle:'bold'}).setOrigin(0.5).setDepth(11);
      btn.on('pointerdown',()=>{if(this.inputText.length<5){this.inputText+=String(i);this.inputLbl.setText(this.inputText);this.ansLbl.setText(this.inputText);}});
      this.rg.add(btn);}
    const sub=this.add.rectangle(W/2,H*0.6+100,120,38,hexToNum(COL_PRIMARY),1).setInteractive({useHandCursor:true}).setDepth(10);
    this.add.text(W/2,H*0.6+100,'Check',{fontSize:'14px',color:'#fff',fontFamily:"'Lexend', system-ui",fontStyle:'bold'}).setOrigin(0.5).setDepth(11);
    sub.on('pointerdown',()=>this._check());this.rg.add(sub);
  }

  _check() {
    if(parseInt(this.inputText)===this.correctAnswer){
      gameScore+=10*(this.round+1);this.scoreLbl.setText('Score: '+gameScore);this.cameras.main.flash(200,34,197,94);
      this.round++;if(this.round>=TOTAL_ROUNDS)this.time.delayedCall(600,()=>this.scene.start('VictoryScene',{score:gameScore}));
      else this.time.delayedCall(800,()=>this.startRound());
    }else{this.lives--;this._rh();this.cameras.main.shake(200,0.01);this.inputText='';this.inputLbl.setText('_');this.ansLbl.setText('?');
      if(this.lives<=0)this.time.delayedCall(500,()=>this.scene.start('LoseScene',{score:gameScore}));}
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
class PatternMachineScene extends Phaser.Scene {
  constructor() { super('PatternMachineScene'); }
  create() { this.W=this.scale.width;this.H=this.scale.height;this.round=0;this.lives=MAX_LIVES;this._bg();this._ui();this.startRound(); }
  _bg() { const bg=this.add.image(this.W/2,this.H/2,'bg');bg.setScale(Math.max(this.W/bg.width,this.H/bg.height));this.add.rectangle(this.W/2,this.H/2,this.W,this.H,0x000000,0.48); }
  _ui() { this.scoreLbl=this.add.text(this.W-14,14,'Score: 0',{fontSize:'16px',color:COL_ACCENT,fontFamily:"'Lexend', system-ui",fontStyle:'bold'}).setOrigin(1,0).setDepth(10);this.hg=this.add.group();this._rh();this.dg=this.add.group();this._rd(); }
  _rh() { this.hg.clear(true,true);for(let i=0;i<this.lives;i++)this.hg.add(this.add.text(14+i*22,14,'♥',{fontSize:'18px',color:COL_DANGER}).setDepth(10)); }
  _rd() { this.dg.clear(true,true);for(let i=0;i<TOTAL_ROUNDS;i++){const c=i<this.round?COL_ACCENT:i===this.round?COL_PRIMARY:'#555555';this.dg.add(this.add.circle(this.W/2-40+i*20,this.H-16,5,hexToNum(c)).setDepth(10));} }

  startRound() {
    if(this.rg)this.rg.clear(true,true);this.rg=this.add.group();
    const data=generatePatternRuleRound(this.round);this.correctRule=data.rule;this._rd();
    const W=this.W,H=this.H;
    this.rg.add(this.add.text(W/2,H*0.1,'What rule makes this pattern?',{fontSize:'14px',color:COL_ACCENT,fontFamily:"'Lexend', system-ui"}).setOrigin(0.5).setDepth(6));
    // Sequence
    const gap=Math.min(55,(W*0.85)/data.sequence.length);
    const sx=W/2-((data.sequence.length-1)*gap)/2;
    data.sequence.forEach((v,i)=>{
      this.rg.add(this.add.text(sx+i*gap,H*0.25,String(v),{fontSize:'20px',color:COL_TEXT,fontFamily:"'Space Grotesk', sans-serif",fontStyle:'bold'}).setOrigin(0.5).setDepth(6));
      if(i<data.sequence.length-1)this.rg.add(this.add.text(sx+i*gap+gap/2,H*0.25,'→',{fontSize:'12px',color:'#555'}).setOrigin(0.5).setDepth(5));
    });
    // Rule options
    const optY=H*0.5;
    const optGap=Math.min(120,(W*0.8)/data.options.length);
    const optSx=W/2-((data.options.length-1)*optGap)/2;
    data.options.forEach((opt,i)=>{
      const x=optSx+i*optGap;
      const btn=this.add.rectangle(x,optY,90,50,hexToNum(COL_SECONDARY),0.3).setStrokeStyle(2,hexToNum(COL_PRIMARY),0.3).setInteractive({useHandCursor:true}).setDepth(7);
      this.rg.add(btn);
      this.rg.add(this.add.text(x,optY,opt.label,{fontSize:'18px',color:COL_TEXT,fontFamily:"'Space Grotesk', sans-serif",fontStyle:'bold'}).setOrigin(0.5).setDepth(8));
      btn.on('pointerdown',()=>{
        if(opt.correct){
          gameScore+=10*(this.round+1);this.scoreLbl.setText('Score: '+gameScore);this.cameras.main.flash(200,34,197,94);
          this.round++;if(this.round>=TOTAL_ROUNDS)this.time.delayedCall(600,()=>this.scene.start('VictoryScene',{score:gameScore}));
          else this.time.delayedCall(800,()=>this.startRound());
        }else{this.lives--;this._rh();this.cameras.main.shake(200,0.01);
          if(this.lives<=0)this.time.delayedCall(500,()=>this.scene.start('LoseScene',{score:gameScore}));}
      });
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
class BrokenPatternScene extends Phaser.Scene {
  constructor() { super('BrokenPatternScene'); }
  create() { this.W=this.scale.width;this.H=this.scale.height;this.round=0;this.lives=MAX_LIVES;this._bg();this._ui();this.startRound(); }
  _bg() { const bg=this.add.image(this.W/2,this.H/2,'bg');bg.setScale(Math.max(this.W/bg.width,this.H/bg.height));this.add.rectangle(this.W/2,this.H/2,this.W,this.H,0x000000,0.48); }
  _ui() { this.scoreLbl=this.add.text(this.W-14,14,'Score: 0',{fontSize:'16px',color:COL_ACCENT,fontFamily:"'Lexend', system-ui",fontStyle:'bold'}).setOrigin(1,0).setDepth(10);this.hg=this.add.group();this._rh();this.dg=this.add.group();this._rd(); }
  _rh() { this.hg.clear(true,true);for(let i=0;i<this.lives;i++)this.hg.add(this.add.text(14+i*22,14,'♥',{fontSize:'18px',color:COL_DANGER}).setDepth(10)); }
  _rd() { this.dg.clear(true,true);for(let i=0;i<TOTAL_ROUNDS;i++){const c=i<this.round?COL_ACCENT:i===this.round?COL_PRIMARY:'#555555';this.dg.add(this.add.circle(this.W/2-40+i*20,this.H-16,5,hexToNum(c)).setDepth(10));} }

  startRound() {
    if(this.rg)this.rg.clear(true,true);this.rg=this.add.group();
    const data=generateBrokenRound(this.round);this.brokenIdx=data.brokenIdx;this._rd();
    const W=this.W,H=this.H;
    this.rg.add(this.add.text(W/2,H*0.1,'One number is WRONG. Click it!',{fontSize:'14px',color:COL_DANGER,fontFamily:"'Lexend', system-ui",fontStyle:'bold'}).setOrigin(0.5).setDepth(6));
    const gap=Math.min(70,(W*0.8)/data.sequence.length);
    const sx=W/2-((data.sequence.length-1)*gap)/2;
    data.sequence.forEach((v,i)=>{
      const x=sx+i*gap;
      const box=this.add.rectangle(x,H*0.35,55,44,hexToNum(COL_SECONDARY),0.3).setInteractive({useHandCursor:true}).setDepth(5);
      this.rg.add(box);
      const lbl=this.add.text(x,H*0.35,String(v),{fontSize:'22px',color:COL_TEXT,fontFamily:"'Space Grotesk', sans-serif",fontStyle:'bold'}).setOrigin(0.5).setDepth(6);
      this.rg.add(lbl);
      box.on('pointerdown',()=>{
        if(i===this.brokenIdx){
          box.setFillStyle(hexToNum(COL_ACCENT),0.5);lbl.setText(String(data.correctValue));lbl.setColor(COL_ACCENT);
          gameScore+=10*(this.round+1);this.scoreLbl.setText('Score: '+gameScore);this.cameras.main.flash(200,34,197,94);
          this.round++;if(this.round>=TOTAL_ROUNDS)this.time.delayedCall(600,()=>this.scene.start('VictoryScene',{score:gameScore}));
          else this.time.delayedCall(800,()=>this.startRound());
        }else{this.lives--;this._rh();this.cameras.main.shake(200,0.01);box.setFillStyle(hexToNum(COL_DANGER),0.3);
          this.time.delayedCall(300,()=>box.setFillStyle(hexToNum(COL_SECONDARY),0.3));
          if(this.lives<=0)this.time.delayedCall(500,()=>this.scene.start('LoseScene',{score:gameScore}));}
      });
    });
  }
}
`
