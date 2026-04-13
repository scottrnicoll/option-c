// Terrain Generation — Phaser engine with 3 game options.
// Math: Coordinate grids, plotting points, reading (x,y) positions.
// Options: coordinate-hunter, battleship, treasure-trail

import type { ThemeConfig, MathParams, GameOption } from "./engine-types"
import { phaserGame } from "./base-phaser-template"
import { getOptionDef } from "./game-option-registry"

export function terrainGenerationPhaserEngine(
  config: ThemeConfig,
  math: MathParams,
  option: GameOption = "coordinate-hunter"
): string {
  const validOptions = ["coordinate-hunter", "battleship", "treasure-trail"]
  const activeOption = validOptions.includes(option) ? option : "coordinate-hunter"
  const optDef = getOptionDef(activeOption)
  const sceneMap: Record<string, string> = {
    "coordinate-hunter": "CoordinateHunterScene",
    "battleship": "BattleshipScene",
    "treasure-trail": "TreasureTrailScene",
  }
  return phaserGame({
    config, math, option: activeOption,
    sceneName: sceneMap[activeOption],
    introText: optDef?.introText || "Find the coordinates!",
    helpText: optDef?.helpText || "Click the correct spot on the grid.",
    gameSceneCode: GAME_SCENES,
  })
}

const GAME_SCENES = `
// ─── Shared: Round Generation ────────────────────────────────────────────────
function generateCoordinateHunterRound(round) {
  if (AI_ROUNDS && AI_ROUNDS[round]) {
    const r = AI_ROUNDS[round];
    return { prompt: r.prompt || 'Find the coordinate!', targetX: r.target, targetY: r.items[0], hint: r.hint || null };
  }
  let gridSize, allowNeg;
  if (round < 2)      { gridSize = 6; allowNeg = false; }
  else if (round < 4) { gridSize = 8; allowNeg = false; }
  else                 { gridSize = 10; allowNeg = true; }
  const minVal = allowNeg ? -Math.floor(gridSize / 2) : 0;
  const maxVal = allowNeg ? Math.floor(gridSize / 2) : gridSize;
  const tx = Math.floor(Math.random() * (maxVal - minVal)) + minVal;
  const ty = Math.floor(Math.random() * (maxVal - minVal)) + minVal;
  return {
    prompt: 'Find (' + tx + ',' + ty + ')',
    targetX: tx, targetY: ty,
    gridSize: gridSize, allowNeg: allowNeg,
    hint: 'x goes right, y goes up'
  };
}

function generateBattleshipRound(round) {
  if (AI_ROUNDS && AI_ROUNDS[round]) {
    const r = AI_ROUNDS[round];
    const ships = [];
    for (let i = 0; i < Math.min(r.items.length, 3); i += 2) {
      ships.push({ x: r.items[i], y: r.items[i + 1] || 0 });
    }
    if (ships.length === 0) ships.push({ x: r.target, y: 0 });
    return { prompt: r.prompt || 'Sink all ' + ITEM_NAME + '!', ships: ships, hint: r.hint || null };
  }
  let gridSize, shipCount;
  if (round < 2)      { gridSize = 5; shipCount = 2; }
  else if (round < 4) { gridSize = 6; shipCount = 3; }
  else                 { gridSize = 7; shipCount = 3; }
  const ships = [];
  while (ships.length < shipCount) {
    const sx = Math.floor(Math.random() * gridSize);
    const sy = Math.floor(Math.random() * gridSize);
    const dupe = ships.some(function(s) { return s.x === sx && s.y === sy; });
    if (!dupe) ships.push({ x: sx, y: sy });
  }
  return { prompt: 'Sink all ' + ITEM_NAME + '!', ships: ships, gridSize: gridSize, hint: null };
}

function generateTreasureTrailRound(round) {
  if (AI_ROUNDS && AI_ROUNDS[round]) {
    const r = AI_ROUNDS[round];
    const clues = [];
    for (let i = 0; i < r.items.length; i += 2) {
      clues.push({ x: r.items[i], y: r.items[i + 1] || 0 });
    }
    if (clues.length === 0) clues.push({ x: r.target, y: 0 });
    return { prompt: r.prompt || 'Follow the trail!', clues: clues, hint: r.hint || null };
  }
  let gridSize, clueCount;
  if (round < 2)      { gridSize = 6; clueCount = 3; }
  else if (round < 4) { gridSize = 7; clueCount = 4; }
  else                 { gridSize = 8; clueCount = 5; }
  const clues = [];
  while (clues.length < clueCount) {
    const cx = Math.floor(Math.random() * gridSize);
    const cy = Math.floor(Math.random() * gridSize);
    const dupe = clues.some(function(c) { return c.x === cx && c.y === cy; });
    if (!dupe) clues.push({ x: cx, y: cy });
  }
  return { prompt: 'Follow the trail!', clues: clues, gridSize: gridSize, hint: null };
}

// ═══════════════════════════════════════════════════════════════════════════════
// OPTION A: Coordinate Hunter — find the target coordinate on the grid
// ═══════════════════════════════════════════════════════════════════════════════
class CoordinateHunterScene extends Phaser.Scene {
  constructor() { super('CoordinateHunterScene'); }
  create() { this.W=this.scale.width;this.H=this.scale.height;this.round=0;this.lives=MAX_LIVES;this._bg();this._ui();this.startRound(); }
  _bg() { const bg=this.add.image(this.W/2,this.H/2,'bg');bg.setScale(Math.max(this.W/bg.width,this.H/bg.height));this.add.rectangle(this.W/2,this.H/2,this.W,this.H,0x000000,0.65); }
  _ui() { this.scoreLbl=this.add.text(this.W-14,14,'Score: 0',{fontSize:'16px',color:COL_ACCENT,fontFamily:"'Lexend', system-ui",fontStyle:'bold'}).setOrigin(1,0).setDepth(10);this.hg=this.add.group();this._rh();this.dg=this.add.group();this._rd(); }
  _rh() { this.hg.clear(true,true);for(let i=0;i<this.lives;i++)this.hg.add(this.add.text(14+i*22,14,'\\u2665',{fontSize:'18px',color:COL_DANGER}).setDepth(10)); }
  _rd() { this.dg.clear(true,true);for(let i=0;i<TOTAL_ROUNDS;i++){const c=i<this.round?COL_ACCENT:i===this.round?COL_PRIMARY:'#555555';this.dg.add(this.add.circle(this.W/2-40+i*20,this.H-16,5,hexToNum(c)).setDepth(10));} }

  startRound() {
    if(this.rg)this.rg.clear(true,true);this.rg=this.add.group();
    const data=getRound(this.round);
    this.targetX=data.target;this.targetY=data.items[0]||0;
    this._rd();

    const W=this.W,H=this.H;
    // Prompt
    this.rg.add(this.add.text(W/2,40,data.prompt,{fontSize:'20px',color:COL_ACCENT,fontFamily:"'Space Grotesk', sans-serif",fontStyle:'bold'}).setOrigin(0.5).setDepth(6));

    // Grid params — progressive sizing
    let gridSize, allowNeg;
    if(this.round<2){ gridSize=6;allowNeg=false; }
    else if(this.round<4){ gridSize=8;allowNeg=false; }
    else{ gridSize=10;allowNeg=true; }
    if(data.gridSize) gridSize=data.gridSize;
    if(data.allowNeg!==undefined) allowNeg=data.allowNeg;

    const minVal=allowNeg?-Math.floor(gridSize/2):0;
    const maxVal=allowNeg?Math.floor(gridSize/2):gridSize;
    const range=maxVal-minVal;

    const gridLeft=W*0.1;
    const gridTop=H*0.15;
    const gridW=W*0.8;
    const gridH=H*0.65;
    const cellW=gridW/range;
    const cellH=gridH/range;

    // Draw grid lines and labels
    for(let i=0;i<=range;i++){
      const x=gridLeft+i*cellW;
      const y=gridTop+i*cellH;
      // Vertical line
      this.rg.add(this.add.rectangle(x,gridTop+gridH/2,1,gridH,hexToNum(COL_SECONDARY),0.25).setDepth(3));
      // Horizontal line
      this.rg.add(this.add.rectangle(gridLeft+gridW/2,y,gridW,1,hexToNum(COL_SECONDARY),0.25).setDepth(3));
      // X label
      const xVal=minVal+i;
      this.rg.add(this.add.text(x,gridTop+gridH+10,String(xVal),{fontSize:'10px',color:COL_SECONDARY,fontFamily:"'Space Grotesk', sans-serif"}).setOrigin(0.5,0).setDepth(4));
      // Y label (inverted — top is max)
      const yVal=maxVal-i;
      this.rg.add(this.add.text(gridLeft-12,y,String(yVal),{fontSize:'10px',color:COL_SECONDARY,fontFamily:"'Space Grotesk', sans-serif"}).setOrigin(1,0.5).setDepth(4));
    }

    // Axis labels
    this.rg.add(this.add.text(gridLeft+gridW/2,gridTop+gridH+26,'x',{fontSize:'12px',color:COL_TEXT,fontFamily:"'Space Grotesk', sans-serif",fontStyle:'bold'}).setOrigin(0.5).setDepth(4));
    this.rg.add(this.add.text(gridLeft-26,gridTop+gridH/2,'y',{fontSize:'12px',color:COL_TEXT,fontFamily:"'Space Grotesk', sans-serif",fontStyle:'bold'}).setOrigin(0.5).setDepth(4));

    // Clickable cells
    for(let gx=0;gx<range;gx++){
      for(let gy=0;gy<range;gy++){
        const cx=gridLeft+gx*cellW+cellW/2;
        const cy=gridTop+gy*cellH+cellH/2;
        const cellXVal=minVal+gx;
        const cellYVal=maxVal-gy-1;
        const cell=this.add.rectangle(cx,cy,cellW-2,cellH-2,hexToNum(COL_SECONDARY),0.05)
          .setInteractive({useHandCursor:true}).setDepth(4);
        this.rg.add(cell);
        cell.on('pointerover',function(){ cell.setFillStyle(hexToNum(COL_PRIMARY),0.15); });
        cell.on('pointerout',function(){ cell.setFillStyle(hexToNum(COL_SECONDARY),0.05); });
        cell.on('pointerdown',()=>{
          this._checkCoordinate(cellXVal,cellYVal,cell);
        });
      }
    }

    // Feedback label
    this.feedLbl=this.add.text(W/2,H*0.88,'Click the coordinate on the grid',{fontSize:'13px',color:COL_TEXT,fontFamily:"'Lexend', system-ui"}).setOrigin(0.5).setDepth(10);
    this.rg.add(this.feedLbl);
  }

  _checkCoordinate(cx,cy,cell) {
    const dx=Math.abs(cx-this.targetX);
    const dy=Math.abs(cy-this.targetY);
    if(dx<=1&&dy<=1){
      // Correct (tolerance 1)
      cell.setFillStyle(hexToNum(COL_ACCENT),0.5);
      const exact=dx===0&&dy===0;
      const bonus=exact?10:5;
      gameScore+=bonus*(this.round+1);
      this.scoreLbl.setText('Score: '+gameScore);
      this.feedLbl.setText(exact?'Perfect!':'Close enough!');
      this.cameras.main.flash(200,34,197,94);
      this.round++;
      if(this.round>=TOTAL_ROUNDS){
        this.time.delayedCall(600,()=>this.scene.start('VictoryScene',{score:gameScore}));
      }else{
        this.time.delayedCall(800,()=>this.startRound());
      }
    }else{
      // Wrong
      cell.setFillStyle(hexToNum(COL_DANGER),0.4);
      this.time.delayedCall(400,()=>cell.setFillStyle(hexToNum(COL_SECONDARY),0.05));
      this.feedLbl.setText('Miss! You clicked ('+cx+','+cy+')');
      this.lives--;
      this._rh();
      this.cameras.main.shake(200,0.01);
      if(this.lives<=0){
        this.time.delayedCall(500,()=>this.scene.start('LoseScene',{score:gameScore}));
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// OPTION B: Battleship — find hidden items on the grid
// ═══════════════════════════════════════════════════════════════════════════════
class BattleshipScene extends Phaser.Scene {
  constructor() { super('BattleshipScene'); }
  create() { this.W=this.scale.width;this.H=this.scale.height;this.round=0;this.lives=MAX_LIVES;this._bg();this._ui();this.startRound(); }
  _bg() { const bg=this.add.image(this.W/2,this.H/2,'bg');bg.setScale(Math.max(this.W/bg.width,this.H/bg.height));this.add.rectangle(this.W/2,this.H/2,this.W,this.H,0x000000,0.65); }
  _ui() { this.scoreLbl=this.add.text(this.W-14,14,'Score: 0',{fontSize:'16px',color:COL_ACCENT,fontFamily:"'Lexend', system-ui",fontStyle:'bold'}).setOrigin(1,0).setDepth(10);this.hg=this.add.group();this._rh();this.dg=this.add.group();this._rd(); }
  _rh() { this.hg.clear(true,true);for(let i=0;i<this.lives;i++)this.hg.add(this.add.text(14+i*22,14,'\\u2665',{fontSize:'18px',color:COL_DANGER}).setDepth(10)); }
  _rd() { this.dg.clear(true,true);for(let i=0;i<TOTAL_ROUNDS;i++){const c=i<this.round?COL_ACCENT:i===this.round?COL_PRIMARY:'#555555';this.dg.add(this.add.circle(this.W/2-40+i*20,this.H-16,5,hexToNum(c)).setDepth(10));} }

  startRound() {
    if(this.rg)this.rg.clear(true,true);this.rg=this.add.group();
    const data=getRound(this.round);
    // Build ships from items: pairs of [x,y] coords
    const shipList = [];
    for (let i = 0; i < data.items.length; i += 2) {
      shipList.push({ x: data.items[i], y: data.items[i + 1] || 0 });
    }
    if (shipList.length === 0) shipList.push({ x: data.target, y: 0 });
    data.ships = shipList;
    this.ships=data.ships.map(function(s){ return {x:s.x,y:s.y,found:false}; });
    this.hitsRemaining=this.ships.length;
    this._rd();

    const W=this.W,H=this.H;
    let gridSize;
    if(this.round<2) gridSize=5;
    else if(this.round<4) gridSize=6;
    else gridSize=7;
    if(data.gridSize) gridSize=data.gridSize;
    this.gridSize=gridSize;

    // Prompt
    this.promptLbl=this.add.text(W/2,38,data.prompt+' ('+this.hitsRemaining+' hidden)',{fontSize:'16px',color:COL_ACCENT,fontFamily:"'Space Grotesk', sans-serif",fontStyle:'bold'}).setOrigin(0.5).setDepth(6);
    this.rg.add(this.promptLbl);

    const gridLeft=W*0.12;
    const gridTop=H*0.14;
    const gridW=W*0.76;
    const gridH=H*0.62;
    const cellW=gridW/gridSize;
    const cellH=gridH/gridSize;

    // Grid lines and labels
    for(let i=0;i<=gridSize;i++){
      const x=gridLeft+i*cellW;
      const y=gridTop+i*cellH;
      this.rg.add(this.add.rectangle(x,gridTop+gridH/2,1,gridH,hexToNum(COL_SECONDARY),0.3).setDepth(3));
      this.rg.add(this.add.rectangle(gridLeft+gridW/2,y,gridW,1,hexToNum(COL_SECONDARY),0.3).setDepth(3));
      if(i<gridSize){
        this.rg.add(this.add.text(gridLeft+i*cellW+cellW/2,gridTop+gridH+8,String(i),{fontSize:'10px',color:COL_SECONDARY,fontFamily:"'Space Grotesk', sans-serif"}).setOrigin(0.5,0).setDepth(4));
        this.rg.add(this.add.text(gridLeft-10,gridTop+i*cellH+cellH/2,String(gridSize-1-i),{fontSize:'10px',color:COL_SECONDARY,fontFamily:"'Space Grotesk', sans-serif"}).setOrigin(1,0.5).setDepth(4));
      }
    }

    // Clickable cells
    this.cellRefs=[];
    for(let gx=0;gx<gridSize;gx++){
      for(let gy=0;gy<gridSize;gy++){
        const cx=gridLeft+gx*cellW+cellW/2;
        const cy=gridTop+gy*cellH+cellH/2;
        const cellYVal=gridSize-1-gy;
        const cell=this.add.rectangle(cx,cy,cellW-2,cellH-2,hexToNum(COL_SECONDARY),0.08)
          .setInteractive({useHandCursor:true}).setDepth(4);
        this.rg.add(cell);
        cell.cellX=gx;cell.cellY=cellYVal;cell.clicked=false;
        cell.on('pointerover',function(){ if(!cell.clicked)cell.setFillStyle(hexToNum(COL_PRIMARY),0.2); });
        cell.on('pointerout',function(){ if(!cell.clicked)cell.setFillStyle(hexToNum(COL_SECONDARY),0.08); });
        cell.on('pointerdown',()=>{
          if(cell.clicked)return;
          cell.clicked=true;
          this._fireAt(gx,cellYVal,cell);
        });
        this.cellRefs.push(cell);
      }
    }

    // Feedback
    this.feedLbl=this.add.text(W/2,H*0.84,'Click cells to find hidden '+ITEM_NAME+'!',{fontSize:'13px',color:COL_TEXT,fontFamily:"'Lexend', system-ui"}).setOrigin(0.5).setDepth(10);
    this.rg.add(this.feedLbl);
  }

  _fireAt(fx,fy,cell) {
    const hit=this.ships.find(function(s){ return s.x===fx&&s.y===fy&&!s.found; });
    if(hit){
      // Hit!
      hit.found=true;
      this.hitsRemaining--;
      cell.setFillStyle(hexToNum(COL_ACCENT),0.6);
      this.rg.add(this.add.text(cell.x,cell.y,'HIT',{fontSize:'11px',color:COL_ACCENT,fontFamily:"'Lexend', system-ui",fontStyle:'bold'}).setOrigin(0.5).setDepth(8));
      this.feedLbl.setText('HIT at ('+fx+','+fy+')! '+this.hitsRemaining+' left');
      this.cameras.main.flash(150,34,197,94);

      if(this.hitsRemaining<=0){
        // All found — round complete
        gameScore+=10*(this.round+1);
        this.scoreLbl.setText('Score: '+gameScore);
        this.promptLbl.setText('All found!');
        this.round++;
        if(this.round>=TOTAL_ROUNDS){
          this.time.delayedCall(600,()=>this.scene.start('VictoryScene',{score:gameScore}));
        }else{
          this.time.delayedCall(800,()=>this.startRound());
        }
      }
    }else{
      // Miss
      cell.setFillStyle(hexToNum(COL_DANGER),0.25);
      this.rg.add(this.add.text(cell.x,cell.y,'\\u00b7',{fontSize:'18px',color:COL_DANGER,fontFamily:"sans-serif"}).setOrigin(0.5).setDepth(8));
      this.feedLbl.setText('MISS at ('+fx+','+fy+')');
      this.lives--;
      this._rh();
      this.cameras.main.shake(200,0.01);
      if(this.lives<=0){
        this.time.delayedCall(500,()=>this.scene.start('LoseScene',{score:gameScore}));
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// OPTION C: Treasure Trail — follow coordinate clues in sequence
// ═══════════════════════════════════════════════════════════════════════════════
class TreasureTrailScene extends Phaser.Scene {
  constructor() { super('TreasureTrailScene'); }
  create() { this.W=this.scale.width;this.H=this.scale.height;this.round=0;this.lives=MAX_LIVES;this._bg();this._ui();this.startRound(); }
  _bg() { const bg=this.add.image(this.W/2,this.H/2,'bg');bg.setScale(Math.max(this.W/bg.width,this.H/bg.height));this.add.rectangle(this.W/2,this.H/2,this.W,this.H,0x000000,0.65); }
  _ui() { this.scoreLbl=this.add.text(this.W-14,14,'Score: 0',{fontSize:'16px',color:COL_ACCENT,fontFamily:"'Lexend', system-ui",fontStyle:'bold'}).setOrigin(1,0).setDepth(10);this.hg=this.add.group();this._rh();this.dg=this.add.group();this._rd(); }
  _rh() { this.hg.clear(true,true);for(let i=0;i<this.lives;i++)this.hg.add(this.add.text(14+i*22,14,'\\u2665',{fontSize:'18px',color:COL_DANGER}).setDepth(10)); }
  _rd() { this.dg.clear(true,true);for(let i=0;i<TOTAL_ROUNDS;i++){const c=i<this.round?COL_ACCENT:i===this.round?COL_PRIMARY:'#555555';this.dg.add(this.add.circle(this.W/2-40+i*20,this.H-16,5,hexToNum(c)).setDepth(10));} }

  startRound() {
    if(this.rg)this.rg.clear(true,true);this.rg=this.add.group();
    const data=getRound(this.round);
    // Build clues from items: pairs of [x,y] coords
    const clueList = [];
    for (let i = 0; i < data.items.length; i += 2) {
      clueList.push({ x: data.items[i], y: data.items[i + 1] || 0 });
    }
    if (clueList.length === 0) clueList.push({ x: data.target, y: 0 });
    data.clues = clueList;
    this.clues=data.clues;
    this.currentClue=0;
    this._rd();

    const W=this.W,H=this.H;
    let gridSize;
    if(this.round<2) gridSize=6;
    else if(this.round<4) gridSize=7;
    else gridSize=8;
    if(data.gridSize) gridSize=data.gridSize;
    this.gridSize=gridSize;

    // Progress label
    this.progressLbl=this.add.text(W/2,28,'Clue 1 of '+this.clues.length,{fontSize:'12px',color:COL_SECONDARY,fontFamily:"'Lexend', system-ui"}).setOrigin(0.5).setDepth(10);
    this.rg.add(this.progressLbl);

    // Current clue prompt
    const clue=this.clues[0];
    this.clueLbl=this.add.text(W/2,48,'Go to ('+clue.x+','+clue.y+')',{fontSize:'18px',color:COL_ACCENT,fontFamily:"'Space Grotesk', sans-serif",fontStyle:'bold'}).setOrigin(0.5).setDepth(6);
    this.rg.add(this.clueLbl);

    const gridLeft=W*0.12;
    const gridTop=H*0.16;
    const gridW=W*0.76;
    const gridH=H*0.6;
    const cellW=gridW/gridSize;
    const cellH=gridH/gridSize;
    this.gridLeft=gridLeft;this.gridTop=gridTop;this.cellW=cellW;this.cellH=cellH;

    // Grid lines and labels
    for(let i=0;i<=gridSize;i++){
      const x=gridLeft+i*cellW;
      const y=gridTop+i*cellH;
      this.rg.add(this.add.rectangle(x,gridTop+gridH/2,1,gridH,hexToNum(COL_SECONDARY),0.25).setDepth(3));
      this.rg.add(this.add.rectangle(gridLeft+gridW/2,y,gridW,1,hexToNum(COL_SECONDARY),0.25).setDepth(3));
      if(i<gridSize){
        this.rg.add(this.add.text(gridLeft+i*cellW+cellW/2,gridTop+gridH+8,String(i),{fontSize:'10px',color:COL_SECONDARY,fontFamily:"'Space Grotesk', sans-serif"}).setOrigin(0.5,0).setDepth(4));
        this.rg.add(this.add.text(gridLeft-10,gridTop+i*cellH+cellH/2,String(gridSize-1-i),{fontSize:'10px',color:COL_SECONDARY,fontFamily:"'Space Grotesk', sans-serif"}).setOrigin(1,0.5).setDepth(4));
      }
    }

    // Clickable cells
    for(let gx=0;gx<gridSize;gx++){
      for(let gy=0;gy<gridSize;gy++){
        const cx=gridLeft+gx*cellW+cellW/2;
        const cy=gridTop+gy*cellH+cellH/2;
        const cellYVal=gridSize-1-gy;
        const cell=this.add.rectangle(cx,cy,cellW-2,cellH-2,hexToNum(COL_SECONDARY),0.05)
          .setInteractive({useHandCursor:true}).setDepth(4);
        this.rg.add(cell);
        cell.on('pointerover',function(){ cell.setFillStyle(hexToNum(COL_PRIMARY),0.15); });
        cell.on('pointerout',function(){ cell.setFillStyle(hexToNum(COL_SECONDARY),0.05); });
        cell.on('pointerdown',()=>{
          this._checkTrailStep(gx,cellYVal,cell);
        });
      }
    }

    // Trail markers for already-found clues
    this.trailMarkers=[];

    // Feedback
    this.feedLbl=this.add.text(W/2,H*0.84,'Follow the clues in order!',{fontSize:'13px',color:COL_TEXT,fontFamily:"'Lexend', system-ui"}).setOrigin(0.5).setDepth(10);
    this.rg.add(this.feedLbl);
  }

  _checkTrailStep(cx,cy,cell) {
    const target=this.clues[this.currentClue];
    if(cx===target.x&&cy===target.y){
      // Correct step
      cell.setFillStyle(hexToNum(COL_ACCENT),0.5);
      // Mark with step number
      const marker=this.add.text(cell.x,cell.y,String(this.currentClue+1),{fontSize:'14px',color:COL_ACCENT,fontFamily:"'Space Grotesk', sans-serif",fontStyle:'bold'}).setOrigin(0.5).setDepth(8);
      this.rg.add(marker);
      this.trailMarkers.push(marker);

      // Draw trail line from previous marker
      if(this.currentClue>0){
        const prev=this.clues[this.currentClue-1];
        const prevCx=this.gridLeft+prev.x*this.cellW+this.cellW/2;
        const prevCy=this.gridTop+(this.gridSize-1-prev.y)*this.cellH+this.cellH/2;
        const curCx=this.gridLeft+target.x*this.cellW+this.cellW/2;
        const curCy=this.gridTop+(this.gridSize-1-target.y)*this.cellH+this.cellH/2;
        const line=this.add.line(0,0,prevCx,prevCy,curCx,curCy,hexToNum(COL_ACCENT),0.4).setOrigin(0).setDepth(5);
        this.rg.add(line);
      }

      this.cameras.main.flash(120,34,197,94);
      this.currentClue++;

      if(this.currentClue>=this.clues.length){
        // Trail complete!
        gameScore+=10*(this.round+1);
        this.scoreLbl.setText('Score: '+gameScore);
        this.feedLbl.setText('Trail complete!');
        this.round++;
        if(this.round>=TOTAL_ROUNDS){
          this.time.delayedCall(600,()=>this.scene.start('VictoryScene',{score:gameScore}));
        }else{
          this.time.delayedCall(800,()=>this.startRound());
        }
      }else{
        // Show next clue
        const next=this.clues[this.currentClue];
        this.clueLbl.setText('Now go to ('+next.x+','+next.y+')');
        this.progressLbl.setText('Clue '+(this.currentClue+1)+' of '+this.clues.length);
        this.feedLbl.setText('Good! Keep going...');
      }
    }else{
      // Wrong
      cell.setFillStyle(hexToNum(COL_DANGER),0.3);
      this.time.delayedCall(400,function(){ cell.setFillStyle(hexToNum(COL_SECONDARY),0.05); });
      this.feedLbl.setText('Wrong! That was ('+cx+','+cy+')');
      this.lives--;
      this._rh();
      this.cameras.main.shake(200,0.01);
      if(this.lives<=0){
        this.time.delayedCall(500,()=>this.scene.start('LoseScene',{score:gameScore}));
      }
    }
  }
}
`
