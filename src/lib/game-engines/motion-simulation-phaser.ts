// Motion Simulation — Phaser engine with 3 game options.
// Math: Speed, distance, time relationships (d=s×t, s=d÷t).
// Options: launch-to-target, speed-trap, catch-up

import type { ThemeConfig, MathParams, GameOption } from "./engine-types"
import { phaserGame } from "./base-phaser-template"
import { getOptionDef } from "./game-option-registry"

export function motionSimulationPhaserEngine(
  config: ThemeConfig,
  math: MathParams,
  option: GameOption = "launch-to-target"
): string {
  const validOptions = ["launch-to-target", "speed-trap", "catch-up"]
  const activeOption = validOptions.includes(option) ? option : "launch-to-target"
  const optDef = getOptionDef(activeOption)
  const sceneMap: Record<string, string> = {
    "launch-to-target": "LaunchToTargetScene",
    "speed-trap": "SpeedTrapScene",
    "catch-up": "CatchUpScene",
  }
  return phaserGame({
    config, math, option: activeOption,
    sceneName: sceneMap[activeOption],
    introText: optDef?.introText || "Set the right speed to hit the target!",
    helpText: optDef?.helpText || "Use speed × time = distance.",
    gameSceneCode: GAME_SCENES,
  })
}

const GAME_SCENES = `
function generateLaunchRound(round) {
  if (AI_ROUNDS && AI_ROUNDS[round]) { const r=AI_ROUNDS[round]; return { target: r.target || r.answer, time: r.time || 3, maxSpeed: r.maxSpeed || 20, hint: r.hint }; }
  const time = round < 2 ? 2 : round < 4 ? 3 : 4;
  const maxSpeed = round < 2 ? 10 : 15;
  const correctSpeed = round < 3 ? Math.floor(Math.random() * (maxSpeed - 2)) + 2 : Math.floor(Math.random() * (maxSpeed * 2 - 3)) / 2 + 1.5;
  const speed = round < 3 ? correctSpeed : Math.round(correctSpeed * 2) / 2;
  const target = Math.round(speed * time * 10) / 10;
  return { target, time, maxSpeed, hint: null };
}

function generateSpeedRound(round) {
  if (AI_ROUNDS && AI_ROUNDS[round]) { const r=AI_ROUNDS[round]; return { distance: r.distance || r.target, time: r.time || 3, answer: r.answer || r.target, hint: r.hint }; }
  const times = round < 2 ? [2, 3, 4, 5] : [3, 4, 5, 6, 8];
  const t = times[Math.floor(Math.random() * times.length)];
  const speed = round < 3 ? Math.floor(Math.random() * 8) + 2 : Math.round((Math.random() * 7 + 2) * 2) / 2;
  const distance = Math.round(speed * t * 10) / 10;
  return { distance, time: t, answer: speed, hint: null };
}

function generateCatchUpRound(round) {
  if (AI_ROUNDS && AI_ROUNDS[round]) { const r=AI_ROUNDS[round]; return { gap: r.gap || r.target, time: r.time || 3, answer: r.answer || r.target, hint: r.hint }; }
  const times = round < 2 ? [2, 3, 4, 5] : [3, 4, 5, 6, 8];
  const t = times[Math.floor(Math.random() * times.length)];
  const speed = round < 3 ? Math.floor(Math.random() * 8) + 2 : Math.round((Math.random() * 7 + 2) * 2) / 2;
  const gap = Math.round(speed * t * 10) / 10;
  return { gap, time: t, answer: speed, hint: null };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Number pad helper — creates a reusable number pad for typing answers
function createNumPad(scene, x, y, onSubmit, opts) {
  const g = scene.add.group();
  const inputW = opts && opts.width || 160;
  let inputStr = '';
  const inputBg = scene.add.rectangle(x, y - 60, inputW, 44, hexToNum(COL_SECONDARY), 0.3).setDepth(8);
  g.add(inputBg);
  const inputLbl = scene.add.text(x, y - 60, '', { fontSize: '24px', color: COL_TEXT, fontFamily: "'Space Grotesk', sans-serif", fontStyle: 'bold' }).setOrigin(0.5).setDepth(9);
  g.add(inputLbl);
  const keys = ['1','2','3','4','5','6','7','8','9','.','0','⌫'];
  const cols = 3, bw = 46, bh = 38, gap = 4;
  const startX = x - (cols * (bw + gap) - gap) / 2 + bw / 2;
  const startY = y - 24;
  keys.forEach(function(k, i) {
    var col = i % cols, row = Math.floor(i / cols);
    var kx = startX + col * (bw + gap), ky = startY + row * (bh + gap);
    var btn = scene.add.rectangle(kx, ky, bw, bh, hexToNum(COL_SECONDARY), 0.25).setInteractive({ useHandCursor: true }).setDepth(8);
    g.add(btn);
    g.add(scene.add.text(kx, ky, k, { fontSize: '18px', color: COL_TEXT, fontFamily: "'Space Grotesk', sans-serif", fontStyle: 'bold' }).setOrigin(0.5).setDepth(9));
    btn.on('pointerdown', function() {
      if (k === '⌫') { inputStr = inputStr.slice(0, -1); }
      else if (k === '.' && inputStr.indexOf('.') >= 0) { return; }
      else if (inputStr.length < 6) { inputStr += k; }
      inputLbl.setText(inputStr);
    });
  });
  // Submit button
  var subY = startY + 4 * (bh + gap) + 4;
  var subBtn = scene.add.rectangle(x, subY, cols * (bw + gap) - gap, 40, hexToNum(COL_PRIMARY), 1).setInteractive({ useHandCursor: true }).setDepth(10);
  g.add(subBtn);
  g.add(scene.add.text(x, subY, opts && opts.submitLabel || 'Check', { fontSize: '16px', color: '#fff', fontFamily: "'Lexend', system-ui", fontStyle: 'bold' }).setOrigin(0.5).setDepth(11));
  subBtn.on('pointerdown', function() {
    var v = parseFloat(inputStr);
    if (!isNaN(v)) onSubmit(v);
  });
  g.resetInput = function() { inputStr = ''; inputLbl.setText(''); };
  g.getInput = function() { return inputStr; };
  return g;
}

// ═══════════════════════════════════════════════════════════════════════════════
class LaunchToTargetScene extends Phaser.Scene {
  constructor() { super('LaunchToTargetScene'); }
  create() { this.W=this.scale.width;this.H=this.scale.height;this.round=0;this.lives=MAX_LIVES;this._bg();this._ui();this.startRound(); }
  _bg() { const bg=this.add.image(this.W/2,this.H/2,'bg');bg.setScale(Math.max(this.W/bg.width,this.H/bg.height));this.add.rectangle(this.W/2,this.H/2,this.W,this.H,0x000000,0.65); }
  _ui() { this.scoreLbl=this.add.text(this.W-14,14,'Score: 0',{fontSize:'16px',color:COL_ACCENT,fontFamily:"'Lexend', system-ui",fontStyle:'bold'}).setOrigin(1,0).setDepth(10);this.hg=this.add.group();this._rh();this.dg=this.add.group();this._rd(); }
  _rh() { this.hg.clear(true,true);for(let i=0;i<this.lives;i++)this.hg.add(this.add.text(14+i*22,14,'♥',{fontSize:'18px',color:COL_DANGER}).setDepth(10)); }
  _rd() { this.dg.clear(true,true);for(let i=0;i<TOTAL_ROUNDS;i++){const c=i<this.round?COL_ACCENT:i===this.round?COL_PRIMARY:'#555555';this.dg.add(this.add.circle(this.W/2-40+i*20,this.H-16,5,hexToNum(c)).setDepth(10));} }

  startRound() {
    if(this.rg)this.rg.clear(true,true);this.rg=this.add.group();
    const data=getRound(this.round);this.target=data.target;this.rTime=data.items[0]||3;this.maxSpeed=data.items[1]||15;this.launched=false;this._rd();
    const W=this.W,H=this.H;
    // Track area
    const trackL=W*0.08,trackR=W*0.92,trackY=H*0.28,trackH=50;
    const maxDist=this.maxSpeed*this.rTime;
    this.trackL=trackL;this.trackR=trackR;this.trackY=trackY;this.maxDist=maxDist;
    // Track bg
    this.rg.add(this.add.rectangle((trackL+trackR)/2,trackY,trackR-trackL,trackH,hexToNum(COL_SECONDARY),0.15).setDepth(4));
    // Target flag
    const tPct=Math.min(this.target/maxDist,1);
    const flagX=trackL+(trackR-trackL)*tPct;
    this.rg.add(this.add.rectangle(flagX,trackY-trackH/2-10,2,20,hexToNum(COL_DANGER),1).setDepth(5));
    this.rg.add(this.add.triangle(flagX+8,trackY-trackH/2-18,0,0,16,5,0,10,hexToNum(COL_DANGER)).setDepth(5));
    this.rg.add(this.add.text(flagX,trackY+trackH/2+6,this.target+'m',{fontSize:'11px',color:COL_DANGER,fontFamily:"'Lexend', system-ui"}).setOrigin(0.5,0).setDepth(5));
    // Launch pad
    this.rg.add(this.add.rectangle(trackL+4,trackY,12,trackH*0.6,hexToNum(COL_PRIMARY),0.5).setDepth(5));
    this.rg.add(this.add.text(trackL+4,trackY+trackH/2+6,'Start',{fontSize:'9px',color:COL_TEXT,fontFamily:"'Lexend', system-ui",alpha:0.4}).setOrigin(0.5,0).setDepth(5));
    // Projectile
    this.proj=this.add.circle(trackL+4,trackY,8,hexToNum(COL_PRIMARY)).setDepth(7);
    this.rg.add(this.proj);
    // Info
    this.rg.add(this.add.text(W/2,H*0.08,'Hit the target at '+this.target+'m',{fontSize:'16px',color:COL_ACCENT,fontFamily:"'Lexend', system-ui",fontStyle:'bold'}).setOrigin(0.5).setDepth(6));
    this.rg.add(this.add.text(W/2,H*0.14,'Time: '+this.rTime+'s   |   distance = speed × '+this.rTime,{fontSize:'12px',color:COL_TEXT,fontFamily:"'Lexend', system-ui",alpha:0.5}).setOrigin(0.5).setDepth(6));
    // Speed display
    this.speedLbl=this.add.text(W*0.28,H*0.44,'Speed: --',{fontSize:'18px',color:COL_PRIMARY,fontFamily:"'Space Grotesk', sans-serif",fontStyle:'bold'}).setOrigin(0.5).setDepth(6);
    this.rg.add(this.speedLbl);
    this.calcLbl=this.add.text(W*0.28,H*0.50,'',{fontSize:'12px',color:COL_TEXT,fontFamily:"'Lexend', system-ui",alpha:0.5}).setOrigin(0.5).setDepth(6);
    this.rg.add(this.calcLbl);
    // Number pad on right side
    var self=this;
    this.numPad=createNumPad(this,W*0.7,H*0.58,function(v){self._launch(v);},{submitLabel:'Launch!',width:140});
    this.rg.add(this.numPad);
    // Slider as alternative input
    // (keeping numpad as primary per spec)
  }

  _launch(speed) {
    if(this.launched)return;
    this.launched=true;
    var dist=Math.round(speed*this.rTime*10)/10;
    var pct=Math.min(dist/this.maxDist,1);
    var destX=this.trackL+(this.trackR-this.trackL)*pct;
    var duration=this.rTime*400;
    this.speedLbl.setText('Speed: '+speed);
    this.calcLbl.setText(speed+' × '+this.rTime+' = '+dist+'m');
    var self=this;
    this.tweens.add({targets:this.proj,x:destX,duration:duration,ease:'Linear',onComplete:function(){
      var diff=Math.abs(dist-self.target);
      if(diff<0.01){
        gameScore+=10*(self.round+1);self.scoreLbl.setText('Score: '+gameScore);self.cameras.main.flash(200,34,197,94);
        self.round++;if(self.round>=TOTAL_ROUNDS)self.time.delayedCall(600,function(){self.scene.start('VictoryScene',{score:gameScore});});
        else self.time.delayedCall(800,function(){self.startRound();});
      }else{
        self.lives--;self._rh();self.cameras.main.shake(200,0.01);
        var msg=dist>self.target?'Too far! ('+dist+'m)':'Too short! ('+dist+'m)';
        var fb=self.add.text(self.W/2,self.H*0.38,msg,{fontSize:'14px',color:COL_DANGER,fontFamily:"'Lexend', system-ui",fontStyle:'bold'}).setOrigin(0.5).setDepth(12);
        self.rg.add(fb);
        if(self.lives<=0){self.time.delayedCall(500,function(){self.scene.start('LoseScene',{score:gameScore});});}
        else{self.time.delayedCall(1200,function(){self.startRound();});}
      }
    }});
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
class SpeedTrapScene extends Phaser.Scene {
  constructor() { super('SpeedTrapScene'); }
  create() { this.W=this.scale.width;this.H=this.scale.height;this.round=0;this.lives=MAX_LIVES;this._bg();this._ui();this.startRound(); }
  _bg() { const bg=this.add.image(this.W/2,this.H/2,'bg');bg.setScale(Math.max(this.W/bg.width,this.H/bg.height));this.add.rectangle(this.W/2,this.H/2,this.W,this.H,0x000000,0.65); }
  _ui() { this.scoreLbl=this.add.text(this.W-14,14,'Score: 0',{fontSize:'16px',color:COL_ACCENT,fontFamily:"'Lexend', system-ui",fontStyle:'bold'}).setOrigin(1,0).setDepth(10);this.hg=this.add.group();this._rh();this.dg=this.add.group();this._rd(); }
  _rh() { this.hg.clear(true,true);for(let i=0;i<this.lives;i++)this.hg.add(this.add.text(14+i*22,14,'♥',{fontSize:'18px',color:COL_DANGER}).setDepth(10)); }
  _rd() { this.dg.clear(true,true);for(let i=0;i<TOTAL_ROUNDS;i++){const c=i<this.round?COL_ACCENT:i===this.round?COL_PRIMARY:'#555555';this.dg.add(this.add.circle(this.W/2-40+i*20,this.H-16,5,hexToNum(c)).setDepth(10));} }

  startRound() {
    if(this.rg)this.rg.clear(true,true);this.rg=this.add.group();
    const data=getRound(this.round);this.answer=data.target;this.dist=data.items[0]||12;this.rTime=data.items[1]||3;this._rd();
    const W=this.W,H=this.H;
    // Track with checkpoints
    const trackL=W*0.1,trackR=W*0.9,trackY=H*0.22,trackH=40;
    this.rg.add(this.add.rectangle((trackL+trackR)/2,trackY,trackR-trackL,trackH,hexToNum(COL_SECONDARY),0.12).setDepth(4));
    // Checkpoint A
    this.rg.add(this.add.rectangle(trackL,trackY,3,trackH+16,hexToNum(COL_ACCENT),0.8).setDepth(5));
    this.rg.add(this.add.text(trackL,trackY+trackH/2+14,'A',{fontSize:'11px',color:COL_ACCENT,fontFamily:"'Lexend', system-ui",fontStyle:'bold'}).setOrigin(0.5,0).setDepth(5));
    // Checkpoint B
    this.rg.add(this.add.rectangle(trackR,trackY,3,trackH+16,hexToNum(COL_ACCENT),0.8).setDepth(5));
    this.rg.add(this.add.text(trackR,trackY+trackH/2+14,'B',{fontSize:'11px',color:COL_ACCENT,fontFamily:"'Lexend', system-ui",fontStyle:'bold'}).setOrigin(0.5,0).setDepth(5));
    // Distance label between checkpoints
    this.rg.add(this.add.text((trackL+trackR)/2,trackY-trackH/2-12,this.dist+'m',{fontSize:'14px',color:COL_PRIMARY,fontFamily:"'Space Grotesk', sans-serif",fontStyle:'bold'}).setOrigin(0.5,1).setDepth(6));
    // Animated object crossing
    var obj=this.add.circle(trackL,trackY,7,hexToNum(COL_PRIMARY)).setDepth(7);
    this.rg.add(obj);
    this.tweens.add({targets:obj,x:trackR,duration:2000,ease:'Linear'});
    // Info cards
    var cardW=100,cardH=70,cardGap=20;
    var cx=W/2-cardW-cardGap/2,cy=H*0.42;
    // Distance card
    this.rg.add(this.add.rectangle(cx,cy,cardW,cardH,hexToNum(COL_PRIMARY),0.12).setStrokeStyle(2,hexToNum(COL_PRIMARY),0.3).setDepth(5));
    this.rg.add(this.add.text(cx,cy-16,'Distance',{fontSize:'10px',color:COL_TEXT,fontFamily:"'Lexend', system-ui",alpha:0.5}).setOrigin(0.5).setDepth(6));
    this.rg.add(this.add.text(cx,cy+8,this.dist+'m',{fontSize:'24px',color:COL_PRIMARY,fontFamily:"'Space Grotesk', sans-serif",fontStyle:'bold'}).setOrigin(0.5).setDepth(6));
    // Divider
    this.rg.add(this.add.text(W/2,cy,'÷',{fontSize:'22px',color:COL_TEXT,fontFamily:"'Space Grotesk', sans-serif",alpha:0.3}).setOrigin(0.5).setDepth(6));
    // Time card
    var tx=W/2+cardW+cardGap/2;
    this.rg.add(this.add.rectangle(tx,cy,cardW,cardH,hexToNum(COL_ACCENT),0.12).setStrokeStyle(2,hexToNum(COL_ACCENT),0.3).setDepth(5));
    this.rg.add(this.add.text(tx,cy-16,'Time',{fontSize:'10px',color:COL_TEXT,fontFamily:"'Lexend', system-ui",alpha:0.5}).setOrigin(0.5).setDepth(6));
    this.rg.add(this.add.text(tx,cy+8,this.rTime+'s',{fontSize:'24px',color:COL_ACCENT,fontFamily:"'Space Grotesk', sans-serif",fontStyle:'bold'}).setOrigin(0.5).setDepth(6));
    // Prompt
    this.rg.add(this.add.text(W/2,H*0.53,'What is the speed?',{fontSize:'15px',color:COL_TEXT,fontFamily:"'Lexend', system-ui",fontStyle:'bold'}).setOrigin(0.5).setDepth(6));
    // Number pad
    var self=this;
    this.numPad=createNumPad(this,W/2,H*0.74,function(v){self._check(v);},{submitLabel:'Check',width:140});
    this.rg.add(this.numPad);
  }

  _check(v) {
    var diff=Math.abs(v-this.answer);
    if(diff<0.01){
      gameScore+=10*(this.round+1);this.scoreLbl.setText('Score: '+gameScore);this.cameras.main.flash(200,34,197,94);
      var fb=this.add.text(this.W/2,this.H*0.53,'Correct! Speed = '+this.answer+' m/s',{fontSize:'14px',color:COL_ACCENT,fontFamily:"'Lexend', system-ui",fontStyle:'bold'}).setOrigin(0.5).setDepth(12);
      this.rg.add(fb);
      this.round++;if(this.round>=TOTAL_ROUNDS)this.time.delayedCall(600,()=>this.scene.start('VictoryScene',{score:gameScore}));
      else this.time.delayedCall(800,()=>this.startRound());
    }else{
      this.lives--;this._rh();this.cameras.main.shake(200,0.01);
      var msg='Not quite! speed = distance ÷ time';
      var fb=this.add.text(this.W/2,this.H*0.53,msg,{fontSize:'13px',color:COL_DANGER,fontFamily:"'Lexend', system-ui",fontStyle:'bold'}).setOrigin(0.5).setDepth(12);
      this.rg.add(fb);
      if(this.lives<=0){this.time.delayedCall(500,()=>this.scene.start('LoseScene',{score:gameScore}));}
      else{var self=this;this.time.delayedCall(1200,function(){self.numPad.resetInput();fb.destroy();});}
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
class CatchUpScene extends Phaser.Scene {
  constructor() { super('CatchUpScene'); }
  create() { this.W=this.scale.width;this.H=this.scale.height;this.round=0;this.lives=MAX_LIVES;this._bg();this._ui();this.startRound(); }
  _bg() { const bg=this.add.image(this.W/2,this.H/2,'bg');bg.setScale(Math.max(this.W/bg.width,this.H/bg.height));this.add.rectangle(this.W/2,this.H/2,this.W,this.H,0x000000,0.65); }
  _ui() { this.scoreLbl=this.add.text(this.W-14,14,'Score: 0',{fontSize:'16px',color:COL_ACCENT,fontFamily:"'Lexend', system-ui",fontStyle:'bold'}).setOrigin(1,0).setDepth(10);this.hg=this.add.group();this._rh();this.dg=this.add.group();this._rd(); }
  _rh() { this.hg.clear(true,true);for(let i=0;i<this.lives;i++)this.hg.add(this.add.text(14+i*22,14,'♥',{fontSize:'18px',color:COL_DANGER}).setDepth(10)); }
  _rd() { this.dg.clear(true,true);for(let i=0;i<TOTAL_ROUNDS;i++){const c=i<this.round?COL_ACCENT:i===this.round?COL_PRIMARY:'#555555';this.dg.add(this.add.circle(this.W/2-40+i*20,this.H-16,5,hexToNum(c)).setDepth(10));} }

  startRound() {
    if(this.rg)this.rg.clear(true,true);this.rg=this.add.group();
    const data=getRound(this.round);this.answer=data.target;this.gap=data.items[0]||12;this.rTime=data.items[1]||3;this._rd();
    const W=this.W,H=this.H;
    // Two-lane track
    const trackL=W*0.08,trackR=W*0.92,trackW=trackR-trackL;
    const yourY=H*0.28,leaderY=H*0.18;
    // Lanes
    this.rg.add(this.add.rectangle((trackL+trackR)/2,leaderY,trackW,24,hexToNum(COL_DANGER),0.08).setDepth(4));
    this.rg.add(this.add.rectangle((trackL+trackR)/2,yourY,trackW,24,hexToNum(COL_PRIMARY),0.08).setDepth(4));
    // Leader (ahead)
    var leaderStartPct=0.55;
    var leader=this.add.circle(trackL+trackW*leaderStartPct,leaderY,7,hexToNum(COL_DANGER)).setDepth(7);
    this.rg.add(leader);
    this.rg.add(this.add.text(trackL+trackW*leaderStartPct,leaderY-16,'Leader',{fontSize:'9px',color:COL_DANGER,fontFamily:"'Lexend', system-ui"}).setOrigin(0.5,1).setDepth(6));
    // You (behind)
    this.you=this.add.circle(trackL+8,yourY,7,hexToNum(COL_PRIMARY)).setDepth(7);
    this.rg.add(this.you);
    this.rg.add(this.add.text(trackL+8,yourY-16,'You',{fontSize:'9px',color:COL_PRIMARY,fontFamily:"'Lexend', system-ui"}).setOrigin(0.5,1).setDepth(6));
    // Gap arrow
    this.rg.add(this.add.text(W/2,H*0.35,'Gap: '+this.gap+' units   |   Time: '+this.rTime+'s',{fontSize:'14px',color:COL_ACCENT,fontFamily:"'Space Grotesk', sans-serif",fontStyle:'bold'}).setOrigin(0.5).setDepth(6));
    // Scenario text
    this.rg.add(this.add.text(W/2,H*0.42,'The leader is '+this.gap+' units ahead.',{fontSize:'14px',color:COL_TEXT,fontFamily:"'Lexend', system-ui"}).setOrigin(0.5).setDepth(6));
    this.rg.add(this.add.text(W/2,H*0.47,'You have '+this.rTime+' seconds to catch up.',{fontSize:'13px',color:COL_TEXT,fontFamily:"'Lexend', system-ui",alpha:0.6}).setOrigin(0.5).setDepth(6));
    this.rg.add(this.add.text(W/2,H*0.52,'What speed do you need?',{fontSize:'15px',color:COL_TEXT,fontFamily:"'Lexend', system-ui",fontStyle:'bold'}).setOrigin(0.5).setDepth(6));
    // Number pad
    var self=this;
    this.numPad=createNumPad(this,W/2,H*0.73,function(v){self._check(v);},{submitLabel:'Go!',width:140});
    this.rg.add(this.numPad);
    // Store track info for animation
    this.trackL=trackL;this.trackW=trackW;this.yourY=yourY;
  }

  _check(v) {
    var diff=Math.abs(v-this.answer);
    // Animate player moving
    var distCovered=v*this.rTime;
    var pct=Math.min(distCovered/(this.gap*2),0.9);
    var destX=this.trackL+this.trackW*pct;
    var self=this;
    this.tweens.add({targets:this.you,x:destX,duration:800,ease:'Power1',onComplete:function(){
      if(diff<0.01){
        gameScore+=10*(self.round+1);self.scoreLbl.setText('Score: '+gameScore);self.cameras.main.flash(200,34,197,94);
        var fb=self.add.text(self.W/2,self.H*0.52,'You caught them! Speed = '+self.answer,{fontSize:'14px',color:COL_ACCENT,fontFamily:"'Lexend', system-ui",fontStyle:'bold'}).setOrigin(0.5).setDepth(12);
        self.rg.add(fb);
        self.round++;if(self.round>=TOTAL_ROUNDS)self.time.delayedCall(600,function(){self.scene.start('VictoryScene',{score:gameScore});});
        else self.time.delayedCall(800,function(){self.startRound();});
      }else{
        self.lives--;self._rh();self.cameras.main.shake(200,0.01);
        var msg=v>self.answer?'Too fast — you passed them!':'Too slow — they got away!';
        var fb=self.add.text(self.W/2,self.H*0.52,msg,{fontSize:'13px',color:COL_DANGER,fontFamily:"'Lexend', system-ui",fontStyle:'bold'}).setOrigin(0.5).setDepth(12);
        self.rg.add(fb);
        if(self.lives<=0){self.time.delayedCall(500,function(){self.scene.start('LoseScene',{score:gameScore});});}
        else{self.time.delayedCall(1200,function(){self.startRound();});}
      }
    }});
  }
}
`
