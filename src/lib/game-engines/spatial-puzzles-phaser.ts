// Fit & Rotate — Phaser engine with 3 game options.
// Math: Spatial reasoning, rotation, symmetry, area composition.
// Options: rotate-to-match, tangram-fill, mirror-puzzle

import type { ThemeConfig, MathParams, GameOption } from "./engine-types"
import { phaserGame } from "./base-phaser-template"
import { getOptionDef } from "./game-option-registry"

export function spatialPuzzlesPhaserEngine(
  config: ThemeConfig,
  math: MathParams,
  option: GameOption = "rotate-to-match"
): string {
  const validOptions = ["rotate-to-match", "tangram-fill", "mirror-puzzle"]
  const activeOption = validOptions.includes(option) ? option : "rotate-to-match"
  const optDef = getOptionDef(activeOption)
  const sceneMap: Record<string, string> = {
    "rotate-to-match": "RotateToMatchScene",
    "tangram-fill": "TangramFillScene",
    "mirror-puzzle": "MirrorPuzzleScene",
  }
  return phaserGame({
    config, math, option: activeOption,
    sceneName: sceneMap[activeOption],
    introText: optDef?.introText || "Solve spatial puzzles!",
    helpText: optDef?.helpText || "Rotate, fill, and mirror shapes.",
    gameSceneCode: GAME_SCENES,
  })
}

const GAME_SCENES = `
// ─── Shape path data (used by RotateToMatch and MirrorPuzzle) ──────────────
var SHAPE_PATHS = [
  { name:'triangle', pts:function(cx,cy,s){ return [{x:cx,y:cy-s},{x:cx-s*0.87,y:cy+s*0.5},{x:cx+s*0.87,y:cy+s*0.5}]; } },
  { name:'rectangle', pts:function(cx,cy,s){ return [{x:cx-s,y:cy-s*0.6},{x:cx+s,y:cy-s*0.6},{x:cx+s,y:cy+s*0.6},{x:cx-s,y:cy+s*0.6}]; } },
  { name:'pentagon', pts:function(cx,cy,s){ var p=[];for(var i=0;i<5;i++){var a=Math.PI*2/5*i-Math.PI/2;p.push({x:cx+Math.cos(a)*s,y:cy+Math.sin(a)*s});}return p; } },
  { name:'diamond', pts:function(cx,cy,s){ return [{x:cx,y:cy-s},{x:cx+s*0.6,y:cy},{x:cx,y:cy+s},{x:cx-s*0.6,y:cy}]; } },
  { name:'irregular', pts:function(cx,cy,s){ return [{x:cx-s,y:cy-s*0.4},{x:cx-s*0.2,y:cy-s},{x:cx+s*0.8,y:cy-s*0.3},{x:cx+s,y:cy+s*0.5},{x:cx-s*0.3,y:cy+s*0.7}]; } }
];

function rotatePoints(pts, cx, cy, angleDeg) {
  var rad = angleDeg * Math.PI / 180;
  return pts.map(function(p) {
    var dx = p.x - cx, dy = p.y - cy;
    return { x: cx + dx * Math.cos(rad) - dy * Math.sin(rad), y: cy + dx * Math.sin(rad) + dy * Math.cos(rad) };
  });
}

function drawShapePoly(scene, grp, pts, color, alpha, lineW) {
  var g = scene.add.graphics().setDepth(6);
  g.lineStyle(lineW || 3, hexToNum(color), alpha || 1);
  g.beginPath();
  g.moveTo(pts[0].x, pts[0].y);
  for (var i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y);
  g.closePath();
  g.strokePath();
  grp.add(g);
  return g;
}

function drawShapePolyFilled(scene, grp, pts, fillColor, fillAlpha, strokeColor, lineW) {
  var g = scene.add.graphics().setDepth(6);
  g.fillStyle(hexToNum(fillColor), fillAlpha || 0.3);
  g.lineStyle(lineW || 3, hexToNum(strokeColor), 1);
  g.beginPath();
  g.moveTo(pts[0].x, pts[0].y);
  for (var i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y);
  g.closePath();
  g.fillPath();
  g.strokePath();
  grp.add(g);
  return g;
}

// ─── Round generators ───────────────────────────────────────────────────────

function generateRotateRound(round) {
  var angles = [90, 180, 270];
  var targetAngle = angles[Math.floor(Math.random() * angles.length)];
  var shapeIdx = round < SHAPE_PATHS.length ? round : Math.floor(Math.random() * SHAPE_PATHS.length);
  return { shapeIdx: shapeIdx, targetAngle: targetAngle };
}

function generateTangramRound(round) {
  // Progressive difficulty: larger targets, more piece options
  var basePieces, target;
  if (round < 2) {
    // Easy: target 5-10, pieces 1-4
    basePieces = [1, 2, 3, 4, 1, 2, 3];
    target = 5 + Math.floor(Math.random() * 6);
  } else if (round < 4) {
    // Medium: target 10-18, pieces 1-6
    basePieces = [1, 2, 3, 4, 5, 6, 2, 3, 4];
    target = 10 + Math.floor(Math.random() * 9);
  } else {
    // Hard: target 18-30, pieces 1-6
    basePieces = [1, 2, 3, 4, 5, 6, 3, 4, 5, 6, 2];
    target = 18 + Math.floor(Math.random() * 13);
  }
  // Shuffle pieces
  for (var i = basePieces.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = basePieces[i]; basePieces[i] = basePieces[j]; basePieces[j] = tmp;
  }
  return { target: target, pieces: basePieces };
}

function generateMirrorRound(round) {
  // Dot on the left side of mirror line at center
  var offsetRange = round < 2 ? 60 : round < 4 ? 100 : 140;
  var dotX = -(20 + Math.floor(Math.random() * offsetRange));
  var dotY = -80 + Math.floor(Math.random() * 160);
  var tolerance = round < 2 ? 30 : round < 4 ? 22 : 15;
  var shapeIdx = Math.floor(Math.random() * SHAPE_PATHS.length);
  return { dotX: dotX, dotY: dotY, tolerance: tolerance, shapeIdx: shapeIdx };
}

// ═══════════════════════════════════════════════════════════════════════════════
class RotateToMatchScene extends Phaser.Scene {
  constructor() { super('RotateToMatchScene'); }
  create() { this.W=this.scale.width;this.H=this.scale.height;this.round=0;this.lives=MAX_LIVES;this._bg();this._ui();this.startRound(); }
  _bg() { const bg=this.add.image(this.W/2,this.H/2,'bg');bg.setScale(Math.max(this.W/bg.width,this.H/bg.height));this.add.rectangle(this.W/2,this.H/2,this.W,this.H,0x000000,0.48); }
  _ui() { this.scoreLbl=this.add.text(this.W-14,14,'Score: 0',{fontSize:'16px',color:COL_ACCENT,fontFamily:"'Lexend', system-ui",fontStyle:'bold'}).setOrigin(1,0).setDepth(10);this.hg=this.add.group();this._rh();this.dg=this.add.group();this._rd(); }
  _rh() { this.hg.clear(true,true);for(let i=0;i<this.lives;i++)this.hg.add(this.add.text(14+i*22,14,'\\u2665',{fontSize:'18px',color:COL_DANGER}).setDepth(10)); }
  _rd() { this.dg.clear(true,true);for(let i=0;i<TOTAL_ROUNDS;i++){const c=i<this.round?COL_ACCENT:i===this.round?COL_PRIMARY:'#555555';this.dg.add(this.add.circle(this.W/2-40+i*20,this.H-16,5,hexToNum(c)).setDepth(10));} }

  startRound() {
    if(this.rg)this.rg.clear(true,true);this.rg=this.add.group();
    const data=generateRotateRound(this.round);this.targetAngle=data.targetAngle;this.currentAngle=0;this.shapeIdx=data.shapeIdx;this._rd();
    const W=this.W,H=this.H;
    const shapeSize=Math.min(W,H)*0.12;

    // Title
    this.rg.add(this.add.text(W/2,H*0.07,'Rotate to Match!',{fontSize:'18px',color:COL_ACCENT,fontFamily:"'Space Grotesk', sans-serif",fontStyle:'bold'}).setOrigin(0.5).setDepth(6));
    this.rg.add(this.add.text(W/2,H*0.13,'Shape: '+SHAPE_PATHS[this.shapeIdx].name,{fontSize:'12px',color:COL_TEXT,fontFamily:"'Lexend', system-ui",alpha:0.6}).setOrigin(0.5).setDepth(6));

    // Target shape (left side)
    var targetCx=W*0.28,targetCy=H*0.42;
    this.rg.add(this.add.text(targetCx,H*0.2,'TARGET',{fontSize:'13px',color:COL_DANGER,fontFamily:"'Lexend', system-ui",fontStyle:'bold'}).setOrigin(0.5).setDepth(6));
    var basePts=SHAPE_PATHS[this.shapeIdx].pts(targetCx,targetCy,shapeSize);
    var targetPts=rotatePoints(basePts,targetCx,targetCy,this.targetAngle);
    drawShapePolyFilled(this,this.rg,targetPts,COL_DANGER,0.2,COL_DANGER,3);

    // Player shape (right side)
    this.playerCx=W*0.72;this.playerCy=H*0.42;
    this.rg.add(this.add.text(this.playerCx,H*0.2,'YOUR SHAPE',{fontSize:'13px',color:COL_PRIMARY,fontFamily:"'Lexend', system-ui",fontStyle:'bold'}).setOrigin(0.5).setDepth(6));
    this._drawPlayerShape();

    // Angle label
    this.angleLbl=this.add.text(this.playerCx,H*0.62,'Rotation: 0\\u00b0',{fontSize:'14px',color:COL_TEXT,fontFamily:"'Lexend', system-ui"}).setOrigin(0.5).setDepth(6);
    this.rg.add(this.angleLbl);

    // Rotate button
    var rotBtn=this.add.rectangle(W*0.35,H*0.78,130,42,hexToNum(COL_SECONDARY),0.3).setInteractive({useHandCursor:true}).setDepth(7);
    this.rg.add(rotBtn);this.rg.add(this.add.text(W*0.35,H*0.78,'Rotate 90\\u00b0',{fontSize:'15px',color:COL_TEXT,fontFamily:"'Space Grotesk', sans-serif",fontStyle:'bold'}).setOrigin(0.5).setDepth(8));
    rotBtn.on('pointerdown',()=>{
      this.currentAngle=(this.currentAngle+90)%360;
      this.angleLbl.setText('Rotation: '+this.currentAngle+'\\u00b0');
      this._drawPlayerShape();
    });

    // Lock In button
    var lockBtn=this.add.rectangle(W*0.65,H*0.78,120,42,hexToNum(COL_PRIMARY),1).setInteractive({useHandCursor:true}).setDepth(10);
    this.rg.add(lockBtn);this.rg.add(this.add.text(W*0.65,H*0.78,'Lock In',{fontSize:'14px',color:'#fff',fontFamily:"'Lexend', system-ui",fontStyle:'bold'}).setOrigin(0.5).setDepth(11));
    lockBtn.on('pointerdown',()=>this._check());
  }

  _drawPlayerShape() {
    if(this.playerGfx)this.playerGfx.destroy();
    var pts=SHAPE_PATHS[this.shapeIdx].pts(this.playerCx,this.playerCy,Math.min(this.W,this.H)*0.12);
    var rotated=rotatePoints(pts,this.playerCx,this.playerCy,this.currentAngle);
    var g=this.add.graphics().setDepth(6);
    g.fillStyle(hexToNum(COL_PRIMARY),0.25);
    g.lineStyle(3,hexToNum(COL_PRIMARY),1);
    g.beginPath();g.moveTo(rotated[0].x,rotated[0].y);
    for(var i=1;i<rotated.length;i++)g.lineTo(rotated[i].x,rotated[i].y);
    g.closePath();g.fillPath();g.strokePath();
    this.playerGfx=g;this.rg.add(g);
  }

  _check() {
    if(this.currentAngle===this.targetAngle){
      gameScore+=10*(this.round+1);this.scoreLbl.setText('Score: '+gameScore);this.cameras.main.flash(200,34,197,94);
      this.round++;if(this.round>=TOTAL_ROUNDS)this.time.delayedCall(600,()=>this.scene.start('VictoryScene',{score:gameScore}));
      else this.time.delayedCall(800,()=>this.startRound());
    }else{this.lives--;this._rh();this.cameras.main.shake(200,0.01);
      if(this.lives<=0)this.time.delayedCall(500,()=>this.scene.start('LoseScene',{score:gameScore}));}
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
class TangramFillScene extends Phaser.Scene {
  constructor() { super('TangramFillScene'); }
  create() { this.W=this.scale.width;this.H=this.scale.height;this.round=0;this.lives=MAX_LIVES;this._bg();this._ui();this.startRound(); }
  _bg() { const bg=this.add.image(this.W/2,this.H/2,'bg');bg.setScale(Math.max(this.W/bg.width,this.H/bg.height));this.add.rectangle(this.W/2,this.H/2,this.W,this.H,0x000000,0.48); }
  _ui() { this.scoreLbl=this.add.text(this.W-14,14,'Score: 0',{fontSize:'16px',color:COL_ACCENT,fontFamily:"'Lexend', system-ui",fontStyle:'bold'}).setOrigin(1,0).setDepth(10);this.hg=this.add.group();this._rh();this.dg=this.add.group();this._rd(); }
  _rh() { this.hg.clear(true,true);for(let i=0;i<this.lives;i++)this.hg.add(this.add.text(14+i*22,14,'\\u2665',{fontSize:'18px',color:COL_DANGER}).setDepth(10)); }
  _rd() { this.dg.clear(true,true);for(let i=0;i<TOTAL_ROUNDS;i++){const c=i<this.round?COL_ACCENT:i===this.round?COL_PRIMARY:'#555555';this.dg.add(this.add.circle(this.W/2-40+i*20,this.H-16,5,hexToNum(c)).setDepth(10));} }

  startRound() {
    if(this.rg)this.rg.clear(true,true);this.rg=this.add.group();
    const data=generateTangramRound(this.round);this.target=data.target;this.pieces=data.pieces;this.currentTotal=0;this.selectedPieces=[];this._rd();
    const W=this.W,H=this.H;

    // Title
    this.rg.add(this.add.text(W/2,H*0.07,'Fill the Area!',{fontSize:'18px',color:COL_ACCENT,fontFamily:"'Space Grotesk', sans-serif",fontStyle:'bold'}).setOrigin(0.5).setDepth(6));

    // Target area display
    this.rg.add(this.add.text(W/2,H*0.16,'Target Area:',{fontSize:'13px',color:COL_TEXT,fontFamily:"'Lexend', system-ui"}).setOrigin(0.5).setDepth(6));
    this.rg.add(this.add.text(W/2,H*0.23,this.target+' sq',{fontSize:'36px',color:COL_DANGER,fontFamily:"'Space Grotesk', sans-serif",fontStyle:'bold'}).setOrigin(0.5).setDepth(6));

    // Visual fill bar
    this.fillBarBg=this.add.rectangle(W/2,H*0.32,W*0.6,20,hexToNum(COL_SECONDARY),0.2).setDepth(5);
    this.rg.add(this.fillBarBg);
    this.fillBar=this.add.rectangle(W/2-W*0.3,H*0.32,2,16,hexToNum(COL_PRIMARY),0.8).setOrigin(0,0.5).setDepth(6);
    this.rg.add(this.fillBar);
    // Target line on fill bar
    this.rg.add(this.add.rectangle(W/2-W*0.3+W*0.6,H*0.32,2,24,hexToNum(COL_DANGER),0.8).setOrigin(0.5).setDepth(7));

    // Current total label
    this.totalLbl=this.add.text(W/2,H*0.39,'Your total: 0 sq',{fontSize:'16px',color:COL_PRIMARY,fontFamily:"'Lexend', system-ui",fontStyle:'bold'}).setOrigin(0.5).setDepth(6);
    this.rg.add(this.totalLbl);

    // Piece buttons — arranged in a grid
    var cols=Math.min(this.pieces.length,4);
    var rows=Math.ceil(this.pieces.length/cols);
    var btnW=60,btnH=50,gapX=10,gapY=8;
    var gridW=cols*btnW+(cols-1)*gapX;
    var startX=W/2-gridW/2+btnW/2;
    var startY=H*0.48;

    this.pieceBtns=[];
    for(var i=0;i<this.pieces.length;i++){
      var col=i%cols,row=Math.floor(i/cols);
      var px=startX+col*(btnW+gapX);
      var py=startY+row*(btnH+gapY);
      var val=this.pieces[i];
      (function(scene,idx,v,bx,by){
        var btn=scene.add.rectangle(bx,by,btnW-4,btnH-4,hexToNum(COL_SECONDARY),0.3).setInteractive({useHandCursor:true}).setDepth(7);
        scene.rg.add(btn);
        var txt=scene.add.text(bx,by-6,v+' sq',{fontSize:'14px',color:COL_TEXT,fontFamily:"'Space Grotesk', sans-serif",fontStyle:'bold'}).setOrigin(0.5).setDepth(8);
        scene.rg.add(txt);
        // Draw small squares to visualize size
        var sqSize=6,sqGap=2;
        var sqTotalW=v*(sqSize+sqGap)-sqGap;
        for(var s=0;s<v;s++){
          var sx=bx-sqTotalW/2+s*(sqSize+sqGap)+sqSize/2;
          var sq=scene.add.rectangle(sx,by+12,sqSize,sqSize,hexToNum(COL_ACCENT),0.5).setDepth(8);
          scene.rg.add(sq);
        }
        scene.pieceBtns.push({btn:btn,txt:txt,val:v,used:false,idx:idx});
        btn.on('pointerdown',function(){
          if(scene.pieceBtns[idx].used)return;
          scene.pieceBtns[idx].used=true;
          btn.setFillStyle(hexToNum(COL_PRIMARY),0.5);
          scene.currentTotal+=v;
          scene.selectedPieces.push(idx);
          scene._updateTotal();
        });
      })(this,i,val,px,py);
    }

    // Undo button
    var undoBtn=this.add.rectangle(W*0.3,H*0.85,100,38,hexToNum(COL_SECONDARY),0.3).setInteractive({useHandCursor:true}).setDepth(7);
    this.rg.add(undoBtn);this.rg.add(this.add.text(W*0.3,H*0.85,'Undo',{fontSize:'14px',color:COL_TEXT,fontFamily:"'Space Grotesk', sans-serif",fontStyle:'bold'}).setOrigin(0.5).setDepth(8));
    undoBtn.on('pointerdown',()=>{
      if(this.selectedPieces.length===0)return;
      var lastIdx=this.selectedPieces.pop();
      var pb=this.pieceBtns[lastIdx];
      pb.used=false;pb.btn.setFillStyle(hexToNum(COL_SECONDARY),0.3);
      this.currentTotal-=pb.val;
      this._updateTotal();
    });

    // Lock In button
    var lockBtn=this.add.rectangle(W*0.7,H*0.85,120,38,hexToNum(COL_PRIMARY),1).setInteractive({useHandCursor:true}).setDepth(10);
    this.rg.add(lockBtn);this.rg.add(this.add.text(W*0.7,H*0.85,'Lock In',{fontSize:'14px',color:'#fff',fontFamily:"'Lexend', system-ui",fontStyle:'bold'}).setOrigin(0.5).setDepth(11));
    lockBtn.on('pointerdown',()=>this._check());
  }

  _updateTotal() {
    this.totalLbl.setText('Your total: '+this.currentTotal+' sq');
    var pct=Math.min(this.currentTotal/this.target,1.2);
    this.fillBar.width=Math.max(2,pct*this.W*0.6);
    if(this.currentTotal===this.target){this.totalLbl.setColor(COL_ACCENT);this.fillBar.setFillStyle(hexToNum(COL_ACCENT),0.8);}
    else if(this.currentTotal>this.target){this.totalLbl.setColor(COL_DANGER);this.fillBar.setFillStyle(hexToNum(COL_DANGER),0.8);}
    else{this.totalLbl.setColor(COL_PRIMARY);this.fillBar.setFillStyle(hexToNum(COL_PRIMARY),0.8);}
  }

  _check() {
    if(this.currentTotal===this.target){
      gameScore+=10*(this.round+1);this.scoreLbl.setText('Score: '+gameScore);this.cameras.main.flash(200,34,197,94);
      this.round++;if(this.round>=TOTAL_ROUNDS)this.time.delayedCall(600,()=>this.scene.start('VictoryScene',{score:gameScore}));
      else this.time.delayedCall(800,()=>this.startRound());
    }else{this.lives--;this._rh();this.cameras.main.shake(200,0.01);
      if(this.lives<=0)this.time.delayedCall(500,()=>this.scene.start('LoseScene',{score:gameScore}));}
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
class MirrorPuzzleScene extends Phaser.Scene {
  constructor() { super('MirrorPuzzleScene'); }
  create() { this.W=this.scale.width;this.H=this.scale.height;this.round=0;this.lives=MAX_LIVES;this._bg();this._ui();this.startRound(); }
  _bg() { const bg=this.add.image(this.W/2,this.H/2,'bg');bg.setScale(Math.max(this.W/bg.width,this.H/bg.height));this.add.rectangle(this.W/2,this.H/2,this.W,this.H,0x000000,0.48); }
  _ui() { this.scoreLbl=this.add.text(this.W-14,14,'Score: 0',{fontSize:'16px',color:COL_ACCENT,fontFamily:"'Lexend', system-ui",fontStyle:'bold'}).setOrigin(1,0).setDepth(10);this.hg=this.add.group();this._rh();this.dg=this.add.group();this._rd(); }
  _rh() { this.hg.clear(true,true);for(let i=0;i<this.lives;i++)this.hg.add(this.add.text(14+i*22,14,'\\u2665',{fontSize:'18px',color:COL_DANGER}).setDepth(10)); }
  _rd() { this.dg.clear(true,true);for(let i=0;i<TOTAL_ROUNDS;i++){const c=i<this.round?COL_ACCENT:i===this.round?COL_PRIMARY:'#555555';this.dg.add(this.add.circle(this.W/2-40+i*20,this.H-16,5,hexToNum(c)).setDepth(10));} }

  startRound() {
    if(this.rg)this.rg.clear(true,true);this.rg=this.add.group();
    const data=generateMirrorRound(this.round);this.dotOffsetX=data.dotX;this.dotOffsetY=data.dotY;this.tolerance=data.tolerance;this.shapeIdx=data.shapeIdx;this.placed=false;this._rd();
    const W=this.W,H=this.H;
    var mirrorX=W/2;
    var areaTop=H*0.15,areaBot=H*0.75;
    var areaCy=(areaTop+areaBot)/2;

    // Title
    this.rg.add(this.add.text(W/2,H*0.06,'Mirror Puzzle!',{fontSize:'18px',color:COL_ACCENT,fontFamily:"'Space Grotesk', sans-serif",fontStyle:'bold'}).setOrigin(0.5).setDepth(6));
    this.rg.add(this.add.text(W/2,H*0.12,'Click where the reflection should go',{fontSize:'11px',color:COL_TEXT,fontFamily:"'Lexend', system-ui",alpha:0.6}).setOrigin(0.5).setDepth(6));

    // Mirror line (vertical dashed)
    for(var dy=areaTop;dy<areaBot;dy+=12){
      this.rg.add(this.add.rectangle(mirrorX,dy,2,8,hexToNum(COL_ACCENT),0.6).setDepth(5));
    }
    this.rg.add(this.add.text(mirrorX,areaTop-10,'MIRROR',{fontSize:'10px',color:COL_ACCENT,fontFamily:"'Lexend', system-ui",alpha:0.5}).setOrigin(0.5).setDepth(5));

    // Left side label
    this.rg.add(this.add.text(W*0.25,areaTop-10,'Original',{fontSize:'10px',color:COL_TEXT,fontFamily:"'Lexend', system-ui",alpha:0.4}).setOrigin(0.5).setDepth(5));
    // Right side label
    this.rg.add(this.add.text(W*0.75,areaTop-10,'Reflection',{fontSize:'10px',color:COL_TEXT,fontFamily:"'Lexend', system-ui",alpha:0.4}).setOrigin(0.5).setDepth(5));

    // Left/right area backgrounds
    this.rg.add(this.add.rectangle(W*0.25,areaCy,W/2-8,areaBot-areaTop,hexToNum(COL_SECONDARY),0.06).setDepth(3));
    this.rg.add(this.add.rectangle(W*0.75,areaCy,W/2-8,areaBot-areaTop,hexToNum(COL_PRIMARY),0.04).setDepth(3));

    // Original shape/dot on left side
    var origX=mirrorX+this.dotOffsetX;
    var origY=areaCy+this.dotOffsetY;
    // Correct reflection position: same distance from mirror line but on right side
    this.correctX=mirrorX-this.dotOffsetX;
    this.correctY=origY;

    // Draw original shape
    var shapeSize=Math.min(W,H)*0.04;
    var origPts=SHAPE_PATHS[this.shapeIdx].pts(origX,origY,shapeSize);
    drawShapePolyFilled(this,this.rg,origPts,COL_DANGER,0.4,COL_DANGER,2);
    this.rg.add(this.add.circle(origX,origY,5,hexToNum(COL_DANGER)).setDepth(7));

    // Distance indicator from mirror
    var distFromMirror=Math.abs(this.dotOffsetX);
    this.rg.add(this.add.text(origX,origY-20,Math.round(distFromMirror)+'px',{fontSize:'10px',color:COL_TEXT,fontFamily:"'Lexend', system-ui",alpha:0.4}).setOrigin(0.5).setDepth(6));

    // Clickable area on right side
    var clickZone=this.add.rectangle(W*0.75,areaCy,W/2-8,areaBot-areaTop,0x000000,0.001).setInteractive({useHandCursor:true}).setDepth(8);
    this.rg.add(clickZone);

    // Player placement marker (hidden initially)
    this.playerMarker=this.add.circle(-100,-100,7,hexToNum(COL_PRIMARY)).setDepth(9).setAlpha(0);
    this.rg.add(this.playerMarker);
    this.playerShapeGfx=null;

    clickZone.on('pointerdown',(pointer)=>{
      if(this.placed)return;
      var px=pointer.x,py=pointer.y;
      // Clamp to right side
      if(px<=mirrorX)return;
      this.placedX=px;this.placedY=py;
      this.playerMarker.setPosition(px,py).setAlpha(1);

      // Draw mirrored shape at placed position
      if(this.playerShapeGfx)this.playerShapeGfx.destroy();
      var pPts=SHAPE_PATHS[this.shapeIdx].pts(px,py,shapeSize);
      this.playerShapeGfx=this.add.graphics().setDepth(8);
      this.playerShapeGfx.fillStyle(hexToNum(COL_PRIMARY),0.3);
      this.playerShapeGfx.lineStyle(2,hexToNum(COL_PRIMARY),1);
      this.playerShapeGfx.beginPath();this.playerShapeGfx.moveTo(pPts[0].x,pPts[0].y);
      for(var i=1;i<pPts.length;i++)this.playerShapeGfx.lineTo(pPts[i].x,pPts[i].y);
      this.playerShapeGfx.closePath();this.playerShapeGfx.fillPath();this.playerShapeGfx.strokePath();
      this.rg.add(this.playerShapeGfx);
    });

    // Tolerance indicator
    this.rg.add(this.add.text(W/2,H*0.79,'Tolerance: \\u00b1'+this.tolerance+'px',{fontSize:'11px',color:COL_TEXT,fontFamily:"'Lexend', system-ui",alpha:0.4}).setOrigin(0.5).setDepth(6));

    // Lock In button
    var lockBtn=this.add.rectangle(W/2,H*0.87,120,40,hexToNum(COL_PRIMARY),1).setInteractive({useHandCursor:true}).setDepth(10);
    this.rg.add(lockBtn);this.rg.add(this.add.text(W/2,H*0.87,'Lock In',{fontSize:'14px',color:'#fff',fontFamily:"'Lexend', system-ui",fontStyle:'bold'}).setOrigin(0.5).setDepth(11));
    lockBtn.on('pointerdown',()=>this._check());
  }

  _check() {
    if(!this.placedX){this.cameras.main.shake(100,0.005);return;}
    var dx=this.placedX-this.correctX;
    var dy=this.placedY-this.correctY;
    var dist=Math.sqrt(dx*dx+dy*dy);

    if(dist<=this.tolerance){
      gameScore+=10*(this.round+1);this.scoreLbl.setText('Score: '+gameScore);this.cameras.main.flash(200,34,197,94);
      // Show correct position briefly
      this.rg.add(this.add.circle(this.correctX,this.correctY,8,hexToNum(COL_ACCENT),0.5).setDepth(12));
      this.round++;if(this.round>=TOTAL_ROUNDS)this.time.delayedCall(600,()=>this.scene.start('VictoryScene',{score:gameScore}));
      else this.time.delayedCall(800,()=>this.startRound());
    }else{
      // Show where correct was
      this.rg.add(this.add.circle(this.correctX,this.correctY,8,hexToNum(COL_ACCENT),0.6).setDepth(12));
      this.rg.add(this.add.text(this.correctX,this.correctY-16,'Here!',{fontSize:'10px',color:COL_ACCENT,fontFamily:"'Lexend', system-ui"}).setOrigin(0.5).setDepth(12));
      this.lives--;this._rh();this.cameras.main.shake(200,0.01);
      if(this.lives<=0)this.time.delayedCall(500,()=>this.scene.start('LoseScene',{score:gameScore}));
      else{this.placedX=null;this.placedY=null;}
    }
  }
}
`
