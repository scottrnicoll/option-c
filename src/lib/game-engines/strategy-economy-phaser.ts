// Strategy & Economy — Phaser engine with 3 game options.
// Math: Multiplication, exponential growth, strategic planning.
// Options: investment-sim, population-boom, doubling-maze

import type { ThemeConfig, MathParams, GameOption } from "./engine-types"
import { phaserGame } from "./base-phaser-template"
import { getOptionDef } from "./game-option-registry"

export function strategyEconomyPhaserEngine(
  config: ThemeConfig,
  math: MathParams,
  option: GameOption = "investment-sim"
): string {
  const validOptions = ["investment-sim", "population-boom", "doubling-maze"]
  const activeOption = validOptions.includes(option) ? option : "investment-sim"
  const optDef = getOptionDef(activeOption)
  const sceneMap: Record<string, string> = {
    "investment-sim": "InvestmentSimScene",
    "population-boom": "PopulationBoomScene",
    "doubling-maze": "DoublingMazeScene",
  }
  return phaserGame({
    config, math, option: activeOption,
    sceneName: sceneMap[activeOption],
    introText: optDef?.introText || "Grow your value strategically!",
    helpText: optDef?.helpText || "Pick multipliers to reach the target.",
    gameSceneCode: GAME_SCENES,
  })
}

const GAME_SCENES = `
function generateInvestmentRound(round) {
  if (AI_ROUNDS && AI_ROUNDS[round]) { const r=AI_ROUNDS[round]; return { prompt: r.prompt, target: r.target, hint: r.hint }; }
  const starts = [2, 3, 4, 5, 6];
  const start = starts[round % starts.length];
  const mults = [2, 3];
  const steps = round < 2 ? 2 : round < 4 ? 3 : 3;
  let val = start;
  const path = [];
  for (let i = 0; i < steps; i++) { const m = mults[Math.floor(Math.random() * mults.length)]; val *= m; path.push(m); }
  return { start, target: val, steps, multipliers: [2, 3, 4] };
}

function generatePopulationRound(round) {
  const start = round < 2 ? 10 : round < 4 ? 20 : 50;
  const targetMin = round < 2 ? 30 : round < 4 ? 80 : 200;
  const targetMax = targetMin + Math.floor(targetMin * 0.1);
  const cap = targetMax + Math.floor(targetMax * 0.2);
  const turns = round < 2 ? 3 : round < 4 ? 4 : 5;
  return { start, targetMin, targetMax, cap, turns };
}

function generateDoublingRound(round) {
  const start = round < 2 ? 2 : round < 4 ? 3 : 4;
  const forks = round < 2 ? 3 : 4;
  const choices = [];
  let val = start;
  for (let i = 0; i < forks; i++) { const m = Math.random() < 0.5 ? 2 : 3; val *= m; choices.push(m); }
  return { start, target: val, forks, correctPath: choices };
}

// ═══════════════════════════════════════════════════════════════════════════════
class InvestmentSimScene extends Phaser.Scene {
  constructor() { super('InvestmentSimScene'); }
  create() { this.W=this.scale.width;this.H=this.scale.height;this.round=0;this.lives=MAX_LIVES;this._bg();this._ui();this.startRound(); }
  _bg() { const bg=this.add.image(this.W/2,this.H/2,'bg');bg.setScale(Math.max(this.W/bg.width,this.H/bg.height));this.add.rectangle(this.W/2,this.H/2,this.W,this.H,0x000000,0.65); }
  _ui() { this.scoreLbl=this.add.text(this.W-14,14,'Score: 0',{fontSize:'16px',color:COL_ACCENT,fontFamily:"'Lexend', system-ui",fontStyle:'bold'}).setOrigin(1,0).setDepth(10);this.hg=this.add.group();this._rh();this.dg=this.add.group();this._rd(); }
  _rh() { this.hg.clear(true,true);for(let i=0;i<this.lives;i++)this.hg.add(this.add.text(14+i*22,14,'\\u2665',{fontSize:'18px',color:COL_DANGER}).setDepth(10)); }
  _rd() { this.dg.clear(true,true);for(let i=0;i<TOTAL_ROUNDS;i++){const c=i<this.round?COL_ACCENT:i===this.round?COL_PRIMARY:'#555555';this.dg.add(this.add.circle(this.W/2-40+i*20,this.H-16,5,hexToNum(c)).setDepth(10));} }

  startRound() {
    if(this.rg)this.rg.clear(true,true);this.rg=this.add.group();
    const data=getRound(this.round);this.target=data.target;this.currentVal=data.items[0]||2;this._rd();
    const W=this.W,H=this.H;
    this.rg.add(this.add.text(W/2,H*0.08,'Reach target: '+this.target,{fontSize:'18px',color:COL_ACCENT,fontFamily:"'Space Grotesk', sans-serif",fontStyle:'bold'}).setOrigin(0.5).setDepth(6));
    this.valueLbl=this.add.text(W/2,H*0.28,String(this.currentVal),{fontSize:'52px',color:COL_PRIMARY,fontFamily:"'Space Grotesk', sans-serif",fontStyle:'bold'}).setOrigin(0.5).setDepth(6);
    this.rg.add(this.valueLbl);
    this.rg.add(this.add.text(W/2,H*0.18,'Current value',{fontSize:'12px',color:COL_TEXT,fontFamily:"'Lexend', system-ui",alpha:0.5}).setOrigin(0.5).setDepth(6));
    // Multiplier buttons
    const mults = [2, 3, 4];
    mults.forEach((m, i) => {
      const x = W * 0.25 + i * (W * 0.25);
      const y = H * 0.5;
      const btn = this.add.rectangle(x, y, 80, 50, hexToNum(COL_SECONDARY), 0.3).setInteractive({useHandCursor:true}).setDepth(7);
      this.rg.add(btn);
      this.rg.add(this.add.text(x, y, 'x' + m, {fontSize:'22px',color:COL_TEXT,fontFamily:"'Space Grotesk', sans-serif",fontStyle:'bold'}).setOrigin(0.5).setDepth(8));
      btn.on('pointerdown', () => {
        this.currentVal *= m;
        this.valueLbl.setText(String(this.currentVal));
        this._checkValue();
      });
    });
    // Reset button
    const resetBtn = this.add.rectangle(W/2, H*0.65, 100, 36, hexToNum(COL_DANGER), 0.3).setInteractive({useHandCursor:true}).setDepth(7);
    this.rg.add(resetBtn);
    this.rg.add(this.add.text(W/2, H*0.65, 'Reset', {fontSize:'14px',color:COL_DANGER,fontFamily:"'Lexend', system-ui",fontStyle:'bold'}).setOrigin(0.5).setDepth(8));
    resetBtn.on('pointerdown', () => { this.currentVal = data.items[0]||2; this.valueLbl.setText(String(this.currentVal)); });
    // Lock in button
    const lock = this.add.rectangle(W/2, H*0.78, 120, 40, hexToNum(COL_PRIMARY), 1).setInteractive({useHandCursor:true}).setDepth(10);
    this.rg.add(lock);
    this.rg.add(this.add.text(W/2, H*0.78, 'Lock in', {fontSize:'14px',color:'#fff',fontFamily:"'Lexend', system-ui",fontStyle:'bold'}).setOrigin(0.5).setDepth(11));
    lock.on('pointerdown', () => this._submit());
  }

  _checkValue() {
    if (this.currentVal > this.target * 1.5) {
      this.valueLbl.setColor(COL_DANGER);
    } else if (this.currentVal >= this.target * 0.9 && this.currentVal <= this.target * 1.1) {
      this.valueLbl.setColor(COL_ACCENT);
    } else {
      this.valueLbl.setColor(COL_PRIMARY);
    }
  }

  _submit() {
    const diff = Math.abs(this.currentVal - this.target);
    const tolerance = this.target * 0.1;
    if (diff <= tolerance) {
      gameScore += 10 * (this.round + 1); this.scoreLbl.setText('Score: ' + gameScore); this.cameras.main.flash(200, 34, 197, 94); heroCheer(this, this.hero);
      this.round++; if (this.round >= TOTAL_ROUNDS) this.time.delayedCall(600, () => this.scene.start('VictoryScene', {score: gameScore}));
      else this.time.delayedCall(800, () => this.startRound());
    } else {
      this.lives--; this._rh(); this.cameras.main.shake(200, 0.01); heroShake(this, this.hero);
      if (this.lives <= 0) this.time.delayedCall(500, () => this.scene.start('LoseScene', {score: gameScore}));
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
class PopulationBoomScene extends Phaser.Scene {
  constructor() { super('PopulationBoomScene'); }
  create() { this.W=this.scale.width;this.H=this.scale.height;this.round=0;this.lives=MAX_LIVES;this._bg();this._ui();this.startRound(); }
  _bg() { const bg=this.add.image(this.W/2,this.H/2,'bg');bg.setScale(Math.max(this.W/bg.width,this.H/bg.height));this.add.rectangle(this.W/2,this.H/2,this.W,this.H,0x000000,0.65); }
  _ui() { this.scoreLbl=this.add.text(this.W-14,14,'Score: 0',{fontSize:'16px',color:COL_ACCENT,fontFamily:"'Lexend', system-ui",fontStyle:'bold'}).setOrigin(1,0).setDepth(10);this.hg=this.add.group();this._rh();this.dg=this.add.group();this._rd(); }
  _rh() { this.hg.clear(true,true);for(let i=0;i<this.lives;i++)this.hg.add(this.add.text(14+i*22,14,'\\u2665',{fontSize:'18px',color:COL_DANGER}).setDepth(10)); }
  _rd() { this.dg.clear(true,true);for(let i=0;i<TOTAL_ROUNDS;i++){const c=i<this.round?COL_ACCENT:i===this.round?COL_PRIMARY:'#555555';this.dg.add(this.add.circle(this.W/2-40+i*20,this.H-16,5,hexToNum(c)).setDepth(10));} }

  startRound() {
    if(this.rg)this.rg.clear(true,true);this.rg=this.add.group();
    const data=getRound(this.round);
    this.pop=data.items[0]||10;this.targetMin=data.target;this.targetMax=data.target+Math.floor(data.target*0.1);this.cap=data.target+Math.floor(data.target*0.3);this.turnsLeft=data.items[1]||3;this._rd();
    const W=this.W,H=this.H;
    this.rg.add(this.add.text(W/2,H*0.06,data.prompt||('Target: '+this.targetMin+' - '+this.targetMax+' (cap: '+this.cap+')'),{fontSize:'13px',color:COL_ACCENT,fontFamily:"'Lexend', system-ui"}).setOrigin(0.5).setDepth(6));
    this.popLbl=this.add.text(W/2,H*0.25,String(this.pop),{fontSize:'48px',color:COL_PRIMARY,fontFamily:"'Space Grotesk', sans-serif",fontStyle:'bold'}).setOrigin(0.5).setDepth(6);
    this.rg.add(this.popLbl);
    this.rg.add(this.add.text(W/2,H*0.16,'Population',{fontSize:'12px',color:COL_TEXT,fontFamily:"'Lexend', system-ui",alpha:0.5}).setOrigin(0.5).setDepth(6));
    this.turnsLbl=this.add.text(W/2,H*0.38,'Turns left: '+this.turnsLeft,{fontSize:'13px',color:COL_TEXT,fontFamily:"'Lexend', system-ui"}).setOrigin(0.5).setDepth(6);
    this.rg.add(this.turnsLbl);
    // Growth rate buttons
    const rates = [10, 25, 50, 100];
    rates.forEach((r, i) => {
      const x = W * 0.15 + i * (W * 0.7 / 3);
      const y = H * 0.55;
      const btn = this.add.rectangle(x, y, 70, 44, hexToNum(COL_SECONDARY), 0.3).setInteractive({useHandCursor:true}).setDepth(7);
      this.rg.add(btn);
      this.rg.add(this.add.text(x, y, '+' + r + '%', {fontSize:'15px',color:COL_TEXT,fontFamily:"'Space Grotesk', sans-serif",fontStyle:'bold'}).setOrigin(0.5).setDepth(8));
      btn.on('pointerdown', () => {
        this.pop = Math.round(this.pop * (1 + r / 100));
        this.turnsLeft--;
        this.popLbl.setText(String(this.pop));
        this.turnsLbl.setText('Turns left: ' + this.turnsLeft);
        if (this.pop > this.cap) {
          this.lives--; this._rh(); this.cameras.main.shake(200, 0.01); heroShake(this, this.hero);
          this.popLbl.setColor(COL_DANGER);
          if (this.lives <= 0) { this.time.delayedCall(500, () => this.scene.start('LoseScene', {score: gameScore})); return; }
          this.time.delayedCall(800, () => this.startRound());
          return;
        }
        if (this.turnsLeft <= 0) {
          if (this.pop >= this.targetMin && this.pop <= this.targetMax) {
            gameScore += 10 * (this.round + 1); this.scoreLbl.setText('Score: ' + gameScore); this.cameras.main.flash(200, 34, 197, 94); heroCheer(this, this.hero);
            this.round++; if (this.round >= TOTAL_ROUNDS) this.time.delayedCall(600, () => this.scene.start('VictoryScene', {score: gameScore}));
            else this.time.delayedCall(800, () => this.startRound());
          } else {
            this.lives--; this._rh(); this.cameras.main.shake(200, 0.01); heroShake(this, this.hero);
            if (this.lives <= 0) this.time.delayedCall(500, () => this.scene.start('LoseScene', {score: gameScore}));
            else this.time.delayedCall(800, () => this.startRound());
          }
        }
      });
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
class DoublingMazeScene extends Phaser.Scene {
  constructor() { super('DoublingMazeScene'); }
  create() { this.W=this.scale.width;this.H=this.scale.height;this.round=0;this.lives=MAX_LIVES;this._bg();this._ui();this.startRound(); }
  _bg() { const bg=this.add.image(this.W/2,this.H/2,'bg');bg.setScale(Math.max(this.W/bg.width,this.H/bg.height));this.add.rectangle(this.W/2,this.H/2,this.W,this.H,0x000000,0.65); }
  _ui() { this.scoreLbl=this.add.text(this.W-14,14,'Score: 0',{fontSize:'16px',color:COL_ACCENT,fontFamily:"'Lexend', system-ui",fontStyle:'bold'}).setOrigin(1,0).setDepth(10);this.hg=this.add.group();this._rh();this.dg=this.add.group();this._rd(); }
  _rh() { this.hg.clear(true,true);for(let i=0;i<this.lives;i++)this.hg.add(this.add.text(14+i*22,14,'\\u2665',{fontSize:'18px',color:COL_DANGER}).setDepth(10)); }
  _rd() { this.dg.clear(true,true);for(let i=0;i<TOTAL_ROUNDS;i++){const c=i<this.round?COL_ACCENT:i===this.round?COL_PRIMARY:'#555555';this.dg.add(this.add.circle(this.W/2-40+i*20,this.H-16,5,hexToNum(c)).setDepth(10));} }

  startRound() {
    if(this.rg)this.rg.clear(true,true);this.rg=this.add.group();
    const data=getRound(this.round);this.target=data.target;this.currentVal=data.items[0]||2;this.forksLeft=data.items[1]||3;data.start=data.items[0]||2;this.pathTaken=[];this._rd();
    const W=this.W,H=this.H;
    this.rg.add(this.add.text(W/2,H*0.06,'Target: '+this.target,{fontSize:'18px',color:COL_ACCENT,fontFamily:"'Space Grotesk', sans-serif",fontStyle:'bold'}).setOrigin(0.5).setDepth(6));
    this.valueLbl=this.add.text(W/2,H*0.22,String(this.currentVal),{fontSize:'48px',color:COL_PRIMARY,fontFamily:"'Space Grotesk', sans-serif",fontStyle:'bold'}).setOrigin(0.5).setDepth(6);
    this.rg.add(this.valueLbl);
    this.pathLbl=this.add.text(W/2,H*0.35,'Path: '+this.currentVal,{fontSize:'13px',color:COL_TEXT,fontFamily:"'Lexend', system-ui"}).setOrigin(0.5).setDepth(6);
    this.rg.add(this.pathLbl);
    this.forksLbl=this.add.text(W/2,H*0.42,'Forks left: '+this.forksLeft,{fontSize:'12px',color:COL_TEXT,fontFamily:"'Lexend', system-ui",alpha:0.5}).setOrigin(0.5).setDepth(6);
    this.rg.add(this.forksLbl);
    // Fork buttons
    const forkBtns = [{label:'x2',val:2},{label:'x3',val:3}];
    forkBtns.forEach((f, i) => {
      const x = W * 0.33 + i * (W * 0.34);
      const y = H * 0.58;
      const btn = this.add.rectangle(x, y, 100, 50, hexToNum(COL_SECONDARY), 0.3).setInteractive({useHandCursor:true}).setDepth(7);
      this.rg.add(btn);
      this.rg.add(this.add.text(x, y, f.label, {fontSize:'24px',color:COL_TEXT,fontFamily:"'Space Grotesk', sans-serif",fontStyle:'bold'}).setOrigin(0.5).setDepth(8));
      btn.on('pointerdown', () => {
        if (this.forksLeft <= 0) return;
        this.currentVal *= f.val;
        this.forksLeft--;
        this.pathTaken.push(f.label);
        this.valueLbl.setText(String(this.currentVal));
        this.pathLbl.setText('Path: ' + data.start + ' > ' + this.pathTaken.join(' > '));
        this.forksLbl.setText('Forks left: ' + this.forksLeft);
        if (this.forksLeft <= 0) {
          this.time.delayedCall(400, () => this._check());
        }
      });
    });
  }

  _check() {
    if (this.currentVal === this.target) {
      gameScore += 10 * (this.round + 1); this.scoreLbl.setText('Score: ' + gameScore); this.cameras.main.flash(200, 34, 197, 94); heroCheer(this, this.hero);
      this.round++; if (this.round >= TOTAL_ROUNDS) this.time.delayedCall(600, () => this.scene.start('VictoryScene', {score: gameScore}));
      else this.time.delayedCall(800, () => this.startRound());
    } else {
      this.lives--; this._rh(); this.cameras.main.shake(200, 0.01); heroShake(this, this.hero);
      if (this.lives <= 0) this.time.delayedCall(500, () => this.scene.start('LoseScene', {score: gameScore}));
      else this.time.delayedCall(800, () => this.startRound());
    }
  }
}
`
