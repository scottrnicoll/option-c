// Build a Structure — Phaser engine with 3 game options.
// Math: Geometry, shapes, area, perimeter, decomposition.
// Options: shape-matcher, free-build, shape-decomposer

import type { ThemeConfig, MathParams, GameOption } from "./engine-types"
import { phaserGame } from "./base-phaser-template"
import { getOptionDef } from "./game-option-registry"

export function buildStructurePhaserEngine(
  config: ThemeConfig,
  math: MathParams,
  option: GameOption = "shape-matcher"
): string {
  const validOptions = ["shape-matcher", "free-build", "shape-decomposer"]
  const activeOption = validOptions.includes(option) ? option : "shape-matcher"
  const optDef = getOptionDef(activeOption)
  const sceneMap: Record<string, string> = {
    "shape-matcher": "ShapeMatcherScene",
    "free-build": "FreeBuildScene",
    "shape-decomposer": "ShapeDecomposerScene",
  }
  return phaserGame({
    config, math, option: activeOption,
    sceneName: sceneMap[activeOption],
    introText: optDef?.introText || "Build with shapes!",
    helpText: optDef?.helpText || "Match shapes to the blueprint.",
    gameSceneCode: GAME_SCENES,
  })
}

const GAME_SCENES = `
function generateShapeMatcherRound(round) {
  const shapeTypes = ['triangle', 'square', 'circle', 'rectangle', 'pentagon'];
  const numRequired = round < 2 ? 2 : round < 4 ? 3 : 4;
  const blueprint = {};
  for (let i = 0; i < numRequired; i++) {
    const s = shapeTypes[Math.floor(Math.random() * shapeTypes.length)];
    blueprint[s] = (blueprint[s] || 0) + 1;
  }
  // Bank has extras
  const bank = {};
  const keys = Object.keys(blueprint);
  for (let i = 0; i < keys.length; i++) bank[keys[i]] = blueprint[keys[i]];
  // Add distractors
  const extras = round < 2 ? 1 : 2;
  for (let i = 0; i < extras; i++) {
    const s = shapeTypes[Math.floor(Math.random() * shapeTypes.length)];
    bank[s] = (bank[s] || 0) + 1;
  }
  return { blueprint, bank };
}

function generateFreeBuildRound(round) {
  const sides = { triangle: 3, square: 4, pentagon: 5, hexagon: 6 };
  const available = ['triangle', 'square', 'pentagon', 'hexagon'];
  const target = round < 2 ? 12 : round < 4 ? 18 : 24;
  const numShapes = round < 2 ? 3 : round < 4 ? 4 : 5;
  return { target, available, sides, numShapes };
}

function generateDecomposerRound(round) {
  const totalArea = round < 2 ? 12 : round < 4 ? 20 : 30;
  const numParts = round < 2 ? 2 : round < 4 ? 3 : 4;
  const parts = [];
  let remaining = totalArea;
  for (let i = 0; i < numParts - 1; i++) {
    const a = Math.floor(Math.random() * (remaining - (numParts - i - 1))) + 1;
    parts.push(a);
    remaining -= a;
  }
  parts.push(remaining);
  return { totalArea, parts, numParts };
}

function drawShapeIcon(scene, x, y, type, size, color) {
  const g = scene.add.graphics().setDepth(7);
  g.fillStyle(color, 0.6);
  g.lineStyle(2, color, 1);
  if (type === 'triangle') {
    g.fillTriangle(x, y - size, x - size, y + size, x + size, y + size);
    g.strokeTriangle(x, y - size, x - size, y + size, x + size, y + size);
  } else if (type === 'square') {
    g.fillRect(x - size, y - size, size * 2, size * 2);
    g.strokeRect(x - size, y - size, size * 2, size * 2);
  } else if (type === 'circle') {
    g.fillCircle(x, y, size);
    g.strokeCircle(x, y, size);
  } else if (type === 'rectangle') {
    g.fillRect(x - size * 1.4, y - size * 0.7, size * 2.8, size * 1.4);
    g.strokeRect(x - size * 1.4, y - size * 0.7, size * 2.8, size * 1.4);
  } else if (type === 'pentagon') {
    const pts = [];
    for (let i = 0; i < 5; i++) { const a = (Math.PI*2/5)*i - Math.PI/2; pts.push({x: x+Math.cos(a)*size, y: y+Math.sin(a)*size}); }
    g.fillPoints(pts, true);
    g.strokePoints(pts, true);
  } else if (type === 'hexagon') {
    const pts = [];
    for (let i = 0; i < 6; i++) { const a = (Math.PI*2/6)*i - Math.PI/2; pts.push({x: x+Math.cos(a)*size, y: y+Math.sin(a)*size}); }
    g.fillPoints(pts, true);
    g.strokePoints(pts, true);
  }
  return g;
}

// ═══════════════════════════════════════════════════════════════════════════════
class ShapeMatcherScene extends Phaser.Scene {
  constructor() { super('ShapeMatcherScene'); }
  create() { this.W=this.scale.width;this.H=this.scale.height;this.round=0;this.lives=MAX_LIVES;this._bg();this._ui();this.startRound(); }
  _bg() { const bg=this.add.image(this.W/2,this.H/2,'bg');bg.setScale(Math.max(this.W/bg.width,this.H/bg.height));this.add.rectangle(this.W/2,this.H/2,this.W,this.H,0x000000,0.65); }
  _ui() { this.scoreLbl=this.add.text(this.W-14,14,'Score: 0',{fontSize:'16px',color:COL_ACCENT,fontFamily:"'Lexend', system-ui",fontStyle:'bold'}).setOrigin(1,0).setDepth(10);this.hg=this.add.group();this._rh();this.dg=this.add.group();this._rd(); }
  _rh() { this.hg.clear(true,true);for(let i=0;i<this.lives;i++)this.hg.add(this.add.text(14+i*22,14,'\\u2665',{fontSize:'18px',color:COL_DANGER}).setDepth(10)); }
  _rd() { this.dg.clear(true,true);for(let i=0;i<TOTAL_ROUNDS;i++){const c=i<this.round?COL_ACCENT:i===this.round?COL_PRIMARY:'#555555';this.dg.add(this.add.circle(this.W/2-40+i*20,this.H-16,5,hexToNum(c)).setDepth(10));} }

  startRound() {
    if(this.rg)this.rg.clear(true,true);this.rg=this.add.group();
    if(this.gfxList){this.gfxList.forEach(function(g){g.destroy();});} this.gfxList=[];
    const data=getRound(this.round);
    // Build blueprint from getRound: fall back to generator for shape data
    const fallback=generateShapeMatcherRound(this.round);
    this.blueprint=fallback.blueprint;data.bank=fallback.bank;this.selected={};this._rd();
    const W=this.W,H=this.H;
    this.rg.add(this.add.text(W/2,H*0.06,'Match the blueprint!',{fontSize:'16px',color:COL_ACCENT,fontFamily:"'Space Grotesk', sans-serif",fontStyle:'bold'}).setOrigin(0.5).setDepth(6));
    // Blueprint display
    this.rg.add(this.add.text(W*0.25,H*0.14,'BLUEPRINT',{fontSize:'11px',color:COL_ACCENT,fontFamily:"'Lexend', system-ui",alpha:0.6}).setOrigin(0.5).setDepth(6));
    const bpKeys = Object.keys(this.blueprint);
    bpKeys.forEach((shape, i) => {
      const y = H * 0.22 + i * 36;
      const g = drawShapeIcon(this, W * 0.15, y, shape, 10, hexToNum(COL_ACCENT));
      this.gfxList.push(g); this.rg.add(g);
      this.rg.add(this.add.text(W * 0.25, y, this.blueprint[shape] + 'x ' + shape, {fontSize:'12px',color:COL_ACCENT,fontFamily:"'Lexend', system-ui"}).setOrigin(0, 0.5).setDepth(6));
    });
    // Shape bank
    this.rg.add(this.add.text(W*0.7,H*0.14,'BANK (click to pick)',{fontSize:'11px',color:COL_TEXT,fontFamily:"'Lexend', system-ui",alpha:0.6}).setOrigin(0.5).setDepth(6));
    const bankKeys = Object.keys(data.bank);
    this.bankBtns = [];
    bankKeys.forEach((shape, i) => {
      const y = H * 0.22 + i * 44;
      const g = drawShapeIcon(this, W * 0.6, y, shape, 10, hexToNum(COL_PRIMARY));
      this.gfxList.push(g);
      const countLbl = this.add.text(W * 0.72, y, '0 / ' + data.bank[shape], {fontSize:'12px',color:COL_TEXT,fontFamily:"'Lexend', system-ui"}).setOrigin(0, 0.5).setDepth(8);
      this.rg.add(countLbl);
      const btn = this.add.rectangle(W * 0.85, y, 40, 28, hexToNum(COL_SECONDARY), 0.3).setInteractive({useHandCursor:true}).setDepth(9);
      this.rg.add(btn);
      this.rg.add(this.add.text(W * 0.85, y, '+', {fontSize:'18px',color:COL_TEXT,fontFamily:"'Space Grotesk', sans-serif",fontStyle:'bold'}).setOrigin(0.5).setDepth(10));
      this.bankBtns.push({shape, max: data.bank[shape], countLbl});
      btn.on('pointerdown', () => {
        const cur = this.selected[shape] || 0;
        if (cur < data.bank[shape]) {
          this.selected[shape] = cur + 1;
          countLbl.setText(this.selected[shape] + ' / ' + data.bank[shape]);
        }
      });
    });
    // Check
    const check = this.add.rectangle(W/2, H*0.82, 120, 40, hexToNum(COL_PRIMARY), 1).setInteractive({useHandCursor:true}).setDepth(10);
    this.rg.add(check);
    this.rg.add(this.add.text(W/2, H*0.82, 'Check', {fontSize:'14px',color:'#fff',fontFamily:"'Lexend', system-ui",fontStyle:'bold'}).setOrigin(0.5).setDepth(11));
    check.on('pointerdown', () => this._checkMatch());
  }

  _checkMatch() {
    let correct = true;
    const bpKeys = Object.keys(this.blueprint);
    for (let i = 0; i < bpKeys.length; i++) {
      if ((this.selected[bpKeys[i]] || 0) !== this.blueprint[bpKeys[i]]) { correct = false; break; }
    }
    // Check no extras selected
    const selKeys = Object.keys(this.selected);
    for (let i = 0; i < selKeys.length; i++) {
      if ((this.blueprint[selKeys[i]] || 0) !== this.selected[selKeys[i]]) { correct = false; break; }
    }
    if (correct) {
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
class FreeBuildScene extends Phaser.Scene {
  constructor() { super('FreeBuildScene'); }
  create() { this.W=this.scale.width;this.H=this.scale.height;this.round=0;this.lives=MAX_LIVES;this._bg();this._ui();this.startRound(); }
  _bg() { const bg=this.add.image(this.W/2,this.H/2,'bg');bg.setScale(Math.max(this.W/bg.width,this.H/bg.height));this.add.rectangle(this.W/2,this.H/2,this.W,this.H,0x000000,0.65); }
  _ui() { this.scoreLbl=this.add.text(this.W-14,14,'Score: 0',{fontSize:'16px',color:COL_ACCENT,fontFamily:"'Lexend', system-ui",fontStyle:'bold'}).setOrigin(1,0).setDepth(10);this.hg=this.add.group();this._rh();this.dg=this.add.group();this._rd(); }
  _rh() { this.hg.clear(true,true);for(let i=0;i<this.lives;i++)this.hg.add(this.add.text(14+i*22,14,'\\u2665',{fontSize:'18px',color:COL_DANGER}).setDepth(10)); }
  _rd() { this.dg.clear(true,true);for(let i=0;i<TOTAL_ROUNDS;i++){const c=i<this.round?COL_ACCENT:i===this.round?COL_PRIMARY:'#555555';this.dg.add(this.add.circle(this.W/2-40+i*20,this.H-16,5,hexToNum(c)).setDepth(10));} }

  startRound() {
    if(this.rg)this.rg.clear(true,true);this.rg=this.add.group();
    if(this.gfxList){this.gfxList.forEach(function(g){g.destroy();});} this.gfxList=[];
    const data=getRound(this.round);
    const fallback=generateFreeBuildRound(this.round);
    this.target=data.target;this.sides=fallback.sides;data.available=fallback.available;this.totalSides=0;this.selectedShapes=[];this._rd();
    const W=this.W,H=this.H;
    this.rg.add(this.add.text(W/2,H*0.06,'Target total sides: '+this.target,{fontSize:'18px',color:COL_ACCENT,fontFamily:"'Space Grotesk', sans-serif",fontStyle:'bold'}).setOrigin(0.5).setDepth(6));
    this.rg.add(this.add.text(W/2,H*0.13,'Pick shapes whose sides add to the target',{fontSize:'11px',color:COL_TEXT,fontFamily:"'Lexend', system-ui",alpha:0.5}).setOrigin(0.5).setDepth(6));
    this.totalLbl=this.add.text(W/2,H*0.20,'Total sides: 0',{fontSize:'16px',color:COL_PRIMARY,fontFamily:"'Lexend', system-ui",fontStyle:'bold'}).setOrigin(0.5).setDepth(6);
    this.rg.add(this.totalLbl);
    // Shape buttons
    data.available.forEach((shape, i) => {
      const x = W * 0.15 + i * (W * 0.7 / (data.available.length - 1 || 1));
      const y = H * 0.4;
      const g = drawShapeIcon(this, x, y, shape, 18, hexToNum(COL_PRIMARY));
      this.gfxList.push(g);
      this.rg.add(this.add.text(x, y + 28, shape + ' (' + data.sides[shape] + ')', {fontSize:'10px',color:COL_TEXT,fontFamily:"'Lexend', system-ui"}).setOrigin(0.5).setDepth(6));
      const btn = this.add.rectangle(x, y + 48, 50, 28, hexToNum(COL_SECONDARY), 0.3).setInteractive({useHandCursor:true}).setDepth(9);
      this.rg.add(btn);
      this.rg.add(this.add.text(x, y + 48, '+Add', {fontSize:'11px',color:COL_TEXT,fontFamily:"'Lexend', system-ui",fontStyle:'bold'}).setOrigin(0.5).setDepth(10));
      btn.on('pointerdown', () => {
        this.totalSides += data.sides[shape];
        this.selectedShapes.push(shape);
        this.totalLbl.setText('Total sides: ' + this.totalSides);
        this.totalLbl.setColor(this.totalSides === this.target ? COL_ACCENT : this.totalSides > this.target ? COL_DANGER : COL_PRIMARY);
      });
    });
    // Reset
    const rst = this.add.rectangle(W*0.3, H*0.7, 80, 36, hexToNum(COL_DANGER), 0.3).setInteractive({useHandCursor:true}).setDepth(9);
    this.rg.add(rst);
    this.rg.add(this.add.text(W*0.3, H*0.7, 'Reset', {fontSize:'12px',color:COL_DANGER,fontFamily:"'Lexend', system-ui",fontStyle:'bold'}).setOrigin(0.5).setDepth(10));
    rst.on('pointerdown', () => { this.totalSides=0; this.selectedShapes=[]; this.totalLbl.setText('Total sides: 0'); this.totalLbl.setColor(COL_PRIMARY); });
    // Check
    const check = this.add.rectangle(W*0.7, H*0.7, 100, 36, hexToNum(COL_PRIMARY), 1).setInteractive({useHandCursor:true}).setDepth(10);
    this.rg.add(check);
    this.rg.add(this.add.text(W*0.7, H*0.7, 'Check', {fontSize:'13px',color:'#fff',fontFamily:"'Lexend', system-ui",fontStyle:'bold'}).setOrigin(0.5).setDepth(11));
    check.on('pointerdown', () => {
      if (this.totalSides === this.target) {
        gameScore += 10 * (this.round + 1); this.scoreLbl.setText('Score: ' + gameScore); this.cameras.main.flash(200, 34, 197, 94); heroCheer(this, this.hero);
        this.round++; if (this.round >= TOTAL_ROUNDS) this.time.delayedCall(600, () => this.scene.start('VictoryScene', {score: gameScore}));
        else this.time.delayedCall(800, () => this.startRound());
      } else {
        this.lives--; this._rh(); this.cameras.main.shake(200, 0.01); heroShake(this, this.hero);
        if (this.lives <= 0) this.time.delayedCall(500, () => this.scene.start('LoseScene', {score: gameScore}));
      }
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
class ShapeDecomposerScene extends Phaser.Scene {
  constructor() { super('ShapeDecomposerScene'); }
  create() { this.W=this.scale.width;this.H=this.scale.height;this.round=0;this.lives=MAX_LIVES;this._bg();this._ui();this.startRound(); }
  _bg() { const bg=this.add.image(this.W/2,this.H/2,'bg');bg.setScale(Math.max(this.W/bg.width,this.H/bg.height));this.add.rectangle(this.W/2,this.H/2,this.W,this.H,0x000000,0.65); }
  _ui() { this.scoreLbl=this.add.text(this.W-14,14,'Score: 0',{fontSize:'16px',color:COL_ACCENT,fontFamily:"'Lexend', system-ui",fontStyle:'bold'}).setOrigin(1,0).setDepth(10);this.hg=this.add.group();this._rh();this.dg=this.add.group();this._rd(); }
  _rh() { this.hg.clear(true,true);for(let i=0;i<this.lives;i++)this.hg.add(this.add.text(14+i*22,14,'\\u2665',{fontSize:'18px',color:COL_DANGER}).setDepth(10)); }
  _rd() { this.dg.clear(true,true);for(let i=0;i<TOTAL_ROUNDS;i++){const c=i<this.round?COL_ACCENT:i===this.round?COL_PRIMARY:'#555555';this.dg.add(this.add.circle(this.W/2-40+i*20,this.H-16,5,hexToNum(c)).setDepth(10));} }

  startRound() {
    if(this.rg)this.rg.clear(true,true);this.rg=this.add.group();
    if(this.gfxList){this.gfxList.forEach(function(g){g.destroy();});} this.gfxList=[];
    const data=getRound(this.round);this.totalArea=data.target;this.correctParts=data.items;this.numParts=data.items.length;this.enteredAreas=[];this._rd();
    const W=this.W,H=this.H;
    this.rg.add(this.add.text(W/2,H*0.06,'Total area: '+this.totalArea,{fontSize:'18px',color:COL_ACCENT,fontFamily:"'Space Grotesk', sans-serif",fontStyle:'bold'}).setOrigin(0.5).setDepth(6));
    this.rg.add(this.add.text(W/2,H*0.13,'Break into '+this.numParts+' parts. Enter each area.',{fontSize:'12px',color:COL_TEXT,fontFamily:"'Lexend', system-ui",alpha:0.5}).setOrigin(0.5).setDepth(6));
    // Draw composite shape
    const g = this.add.graphics().setDepth(5);
    g.fillStyle(hexToNum(COL_PRIMARY), 0.3);
    g.lineStyle(2, hexToNum(COL_PRIMARY), 0.7);
    // L-shaped composite
    g.fillRect(W*0.3, H*0.2, W*0.4, H*0.12);
    g.strokeRect(W*0.3, H*0.2, W*0.4, H*0.12);
    g.fillRect(W*0.3, H*0.32, W*0.2, H*0.1);
    g.strokeRect(W*0.3, H*0.32, W*0.2, H*0.1);
    this.gfxList.push(g);
    // Part inputs
    this.partInputs = [];
    this.rg.add(this.add.text(W/2,H*0.48,'Enter the area of each part:',{fontSize:'12px',color:COL_TEXT,fontFamily:"'Lexend', system-ui"}).setOrigin(0.5).setDepth(6));
    for (let i = 0; i < this.numParts; i++) {
      const y = H * 0.55 + i * 40;
      this.rg.add(this.add.text(W*0.2, y, 'Part '+(i+1)+':', {fontSize:'13px',color:COL_TEXT,fontFamily:"'Lexend', system-ui"}).setOrigin(0, 0.5).setDepth(6));
      const valLbl = this.add.text(W*0.55, y, '_', {fontSize:'18px',color:COL_PRIMARY,fontFamily:"'Space Grotesk', sans-serif",fontStyle:'bold'}).setOrigin(0.5).setDepth(8);
      this.rg.add(valLbl);
      this.partInputs.push({val: '', lbl: valLbl});
    }
    this.activePartIdx = 0;
    this._highlightPart();
    // Number pad
    for(let d=0;d<=9;d++){
      const px=W*0.12+(d%5)*(W*0.19);const py=H*0.78+Math.floor(d/5)*32;
      const db=this.add.rectangle(px,py,38,26,hexToNum(COL_SECONDARY),0.3).setInteractive({useHandCursor:true}).setDepth(9);
      this.rg.add(db);this.rg.add(this.add.text(px,py,String(d),{fontSize:'14px',color:COL_TEXT,fontFamily:"'Space Grotesk', sans-serif",fontStyle:'bold'}).setOrigin(0.5).setDepth(10));
      db.on('pointerdown',()=>{
        const p=this.partInputs[this.activePartIdx];
        if(p.val.length<3){p.val+=String(d);p.lbl.setText(p.val);}
      });
    }
    // Next part / Check
    const nxt = this.add.rectangle(W*0.88, H*0.78, 50, 26, hexToNum(COL_SECONDARY), 0.4).setInteractive({useHandCursor:true}).setDepth(9);
    this.rg.add(nxt);
    this.rg.add(this.add.text(W*0.88, H*0.78, 'Next', {fontSize:'11px',color:COL_TEXT,fontFamily:"'Lexend', system-ui",fontStyle:'bold'}).setOrigin(0.5).setDepth(10));
    nxt.on('pointerdown', () => { if(this.activePartIdx<this.numParts-1){this.activePartIdx++;this._highlightPart();} });
    // Clear
    const clr = this.add.rectangle(W*0.88, H*0.78+32, 50, 26, hexToNum(COL_DANGER), 0.3).setInteractive({useHandCursor:true}).setDepth(9);
    this.rg.add(clr);
    this.rg.add(this.add.text(W*0.88, H*0.78+32, 'C', {fontSize:'11px',color:COL_DANGER,fontFamily:"'Lexend', system-ui",fontStyle:'bold'}).setOrigin(0.5).setDepth(10));
    clr.on('pointerdown', () => { const p=this.partInputs[this.activePartIdx]; p.val=''; p.lbl.setText('_'); });
    // Check
    const check = this.add.rectangle(W/2, H*0.92, 120, 34, hexToNum(COL_PRIMARY), 1).setInteractive({useHandCursor:true}).setDepth(10);
    this.rg.add(check);
    this.rg.add(this.add.text(W/2, H*0.92, 'Verify', {fontSize:'13px',color:'#fff',fontFamily:"'Lexend', system-ui",fontStyle:'bold'}).setOrigin(0.5).setDepth(11));
    check.on('pointerdown', () => this._verify());
  }

  _highlightPart() {
    for(let i=0;i<this.partInputs.length;i++){
      this.partInputs[i].lbl.setColor(i===this.activePartIdx?COL_ACCENT:COL_PRIMARY);
    }
  }

  _verify() {
    let sum = 0;
    for (let i = 0; i < this.partInputs.length; i++) {
      const v = parseInt(this.partInputs[i].val);
      if (isNaN(v)) { this.lives--; this._rh(); this.cameras.main.shake(200, 0.01); heroShake(this, this.hero); if(this.lives<=0)this.time.delayedCall(500,()=>this.scene.start('LoseScene',{score:gameScore})); return; }
      sum += v;
    }
    if (sum === this.totalArea) {
      gameScore += 10 * (this.round + 1); this.scoreLbl.setText('Score: ' + gameScore); this.cameras.main.flash(200, 34, 197, 94); heroCheer(this, this.hero);
      this.round++; if (this.round >= TOTAL_ROUNDS) this.time.delayedCall(600, () => this.scene.start('VictoryScene', {score: gameScore}));
      else this.time.delayedCall(800, () => this.startRound());
    } else {
      this.lives--; this._rh(); this.cameras.main.shake(200, 0.01); heroShake(this, this.hero);
      if (this.lives <= 0) this.time.delayedCall(500, () => this.scene.start('LoseScene', {score: gameScore}));
    }
  }
}
`
