// Bid & Estimate — Phaser engine with 3 game options.
// Math: Estimation, rounding, place value, money, time.
// Options: auction-house, price-is-right, round-and-win

import type { ThemeConfig, MathParams, GameOption } from "./engine-types"
import { phaserGame } from "./base-phaser-template"
import { getOptionDef } from "./game-option-registry"

export function biddingAuctionPhaserEngine(
  config: ThemeConfig,
  math: MathParams,
  option: GameOption = "auction-house"
): string {
  const validOptions = ["auction-house", "price-is-right", "round-and-win"]
  const activeOption = validOptions.includes(option) ? option : "auction-house"
  const optDef = getOptionDef(activeOption)
  const sceneMap: Record<string, string> = {
    "auction-house": "AuctionHouseScene",
    "price-is-right": "PriceIsRightScene",
    "round-and-win": "RoundAndWinScene",
  }
  return phaserGame({
    config, math, option: activeOption,
    sceneName: sceneMap[activeOption],
    introText: optDef?.introText || "Estimate the value!",
    helpText: optDef?.helpText || "Get close to the real value.",
    gameSceneCode: GAME_SCENES,
  })
}

const GAME_SCENES = `
function generateAuctionRound(round) {
  if (AI_ROUNDS && AI_ROUNDS[round]) {
    const r = AI_ROUNDS[round];
    return { prompt: r.prompt, value: r.target, tolerance: Math.ceil(r.target * 0.2), hint: r.hint };
  }
  let maxVal = round < 2 ? 50 : round < 4 ? 200 : 500;
  const value = Math.floor(Math.random() * maxVal) + 10;
  const tolerance = Math.ceil(value * 0.2);
  return { prompt: 'Estimate the value of this ' + ITEM_NAME, value, tolerance, hint: null };
}

function generatePriceRound(round) {
  let maxVal = round < 2 ? 30 : round < 4 ? 100 : 300;
  const price = Math.floor(Math.random() * maxVal) + 5;
  return { price };
}

function generateRoundingRound(round) {
  const roundTo = round < 2 ? 10 : round < 4 ? 100 : [10, 100, 1000][Math.floor(Math.random() * 3)];
  let maxVal = roundTo === 10 ? 100 : roundTo === 100 ? 1000 : 10000;
  const value = Math.floor(Math.random() * maxVal) + roundTo;
  const rounded = Math.round(value / roundTo) * roundTo;
  return { value, roundTo, rounded };
}

// ═══════════════════════════════════════════════════════════════════════════════
class AuctionHouseScene extends Phaser.Scene {
  constructor() { super('AuctionHouseScene'); }
  create() {
    this.W = this.scale.width; this.H = this.scale.height; this.round = 0; this.lives = MAX_LIVES;
    this._bg(); this._ui(); this.hero = addCharacter(this, this.W * 0.85, this.H * 0.35, 0.4); this.startRound();
  }
  _bg() { const bg = this.add.image(this.W/2,this.H/2,'bg'); bg.setScale(Math.max(this.W/bg.width,this.H/bg.height)); this.add.rectangle(this.W/2,this.H/2,this.W,this.H,0x000000,0.65); }
  _ui() { this.scoreLbl = this.add.text(this.W-14,14,'Score: 0',{fontSize:'16px',color:COL_ACCENT,fontFamily:"'Lexend', system-ui",fontStyle:'bold'}).setOrigin(1,0).setDepth(10); this.hg = this.add.group(); this._rh(); this.dg = this.add.group(); this._rd(); }
  _rh() { this.hg.clear(true,true); for(let i=0;i<this.lives;i++) this.hg.add(this.add.text(14+i*22,14,'♥',{fontSize:'18px',color:COL_DANGER}).setDepth(10)); }
  _rd() { this.dg.clear(true,true); for(let i=0;i<TOTAL_ROUNDS;i++){const c=i<this.round?COL_ACCENT:i===this.round?COL_PRIMARY:'#555555';this.dg.add(this.add.circle(this.W/2-40+i*20,this.H-16,5,hexToNum(c)).setDepth(10));} }
  startRound() {
    if(this.rg) this.rg.clear(true,true); this.rg = this.add.group();
    const data = getRound(this.round); this.realValue = data.target; this.tolerance = Math.ceil(data.target * 0.2);
    this._rd();
    const W=this.W, H=this.H;
    this.rg.add(this.add.image(W/2,H*0.3,'item').setScale(1.2).setDepth(5));
    this.rg.add(this.add.text(W/2,H*0.15,data.prompt,{fontSize:'14px',color:COL_TEXT,fontFamily:"'Lexend', system-ui",align:'center',wordWrap:{width:W-60}}).setOrigin(0.5,0).setDepth(6));
    this.rg.add(this.add.text(W/2,H*0.48,'Bid within 20% of the real value!',{fontSize:'12px',color:COL_TEXT,fontFamily:"'Lexend', system-ui",alpha:0.5}).setOrigin(0.5).setDepth(6));
    this.inputText='';
    this.inputLbl = this.add.text(W/2,H*0.56,'Your bid: _',{fontSize:'24px',color:COL_PRIMARY,fontFamily:"'Space Grotesk', sans-serif",fontStyle:'bold'}).setOrigin(0.5).setDepth(10);
    this.rg.add(this.inputLbl);
    for(let i=0;i<=9;i++){const c=i<5?i:i-5;const r=i<5?0:1;const x=W/2-100+c*50;const y=H*0.67+r*44;
      const btn=this.add.rectangle(x,y,40,36,hexToNum(COL_SECONDARY),0.4).setInteractive({useHandCursor:true}).setDepth(10);
      this.add.text(x,y,String(i),{fontSize:'18px',color:COL_TEXT,fontFamily:"'Space Grotesk', sans-serif",fontStyle:'bold'}).setOrigin(0.5).setDepth(11);
      btn.on('pointerdown',()=>{if(this.inputText.length<5){this.inputText+=String(i);this.inputLbl.setText('Your bid: '+this.inputText);}});
      this.rg.add(btn);}
    const sub=this.add.rectangle(W/2,H*0.67+100,120,38,hexToNum(COL_PRIMARY),1).setInteractive({useHandCursor:true}).setDepth(10);
    this.add.text(W/2,H*0.67+100,'Bid!',{fontSize:'14px',color:'#fff',fontFamily:"'Lexend', system-ui",fontStyle:'bold'}).setOrigin(0.5).setDepth(11);
    sub.on('pointerdown',()=>this._check()); this.rg.add(sub);
  }
  _check() {
    const bid=parseInt(this.inputText);
    if(Math.abs(bid-this.realValue)<=this.tolerance){
      gameScore+=10*(this.round+1);this.scoreLbl.setText('Score: '+gameScore);this.cameras.main.flash(200,34,197,94);
      this.round++;if(this.round>=TOTAL_ROUNDS){this.time.delayedCall(600,()=>this.scene.start('VictoryScene',{score:gameScore}));}
      else{this.time.delayedCall(800,()=>this.startRound());}
    }else{this.lives--;this._rh();this.cameras.main.shake(200,0.01);this.inputText='';this.inputLbl.setText('Your bid: _');
      if(this.lives<=0){this.time.delayedCall(500,()=>this.scene.start('LoseScene',{score:gameScore}));}}
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
class PriceIsRightScene extends Phaser.Scene {
  constructor() { super('PriceIsRightScene'); }
  create() { this.W=this.scale.width;this.H=this.scale.height;this.round=0;this.lives=MAX_LIVES;this._bg();this._ui();this.startRound(); }
  _bg() { const bg=this.add.image(this.W/2,this.H/2,'bg');bg.setScale(Math.max(this.W/bg.width,this.H/bg.height));this.add.rectangle(this.W/2,this.H/2,this.W,this.H,0x000000,0.65); }
  _ui() { this.scoreLbl=this.add.text(this.W-14,14,'Score: 0',{fontSize:'16px',color:COL_ACCENT,fontFamily:"'Lexend', system-ui",fontStyle:'bold'}).setOrigin(1,0).setDepth(10);this.hg=this.add.group();this._rh();this.dg=this.add.group();this._rd(); }
  _rh() { this.hg.clear(true,true);for(let i=0;i<this.lives;i++)this.hg.add(this.add.text(14+i*22,14,'♥',{fontSize:'18px',color:COL_DANGER}).setDepth(10)); }
  _rd() { this.dg.clear(true,true);for(let i=0;i<TOTAL_ROUNDS;i++){const c=i<this.round?COL_ACCENT:i===this.round?COL_PRIMARY:'#555555';this.dg.add(this.add.circle(this.W/2-40+i*20,this.H-16,5,hexToNum(c)).setDepth(10));} }
  startRound() {
    if(this.rg)this.rg.clear(true,true);this.rg=this.add.group();
    const data=getRound(this.round);this.realPrice=data.target;this._rd();
    const W=this.W,H=this.H;
    this.rg.add(this.add.image(W/2,H*0.3,'item').setScale(1.2).setDepth(5));
    this.rg.add(this.add.text(W/2,H*0.15,data.prompt,{fontSize:'14px',color:COL_ACCENT,fontFamily:"'Lexend', system-ui"}).setOrigin(0.5).setDepth(6));
    this.inputText='';
    this.inputLbl=this.add.text(W/2,H*0.56,'_ coins',{fontSize:'24px',color:COL_PRIMARY,fontFamily:"'Space Grotesk', sans-serif",fontStyle:'bold'}).setOrigin(0.5).setDepth(10);
    this.rg.add(this.inputLbl);
    for(let i=0;i<=9;i++){const c=i<5?i:i-5;const r=i<5?0:1;const x=W/2-100+c*50;const y=H*0.67+r*44;
      const btn=this.add.rectangle(x,y,40,36,hexToNum(COL_SECONDARY),0.4).setInteractive({useHandCursor:true}).setDepth(10);
      this.add.text(x,y,String(i),{fontSize:'18px',color:COL_TEXT,fontFamily:"'Space Grotesk', sans-serif",fontStyle:'bold'}).setOrigin(0.5).setDepth(11);
      btn.on('pointerdown',()=>{if(this.inputText.length<4){this.inputText+=String(i);this.inputLbl.setText(this.inputText+' coins');}});
      this.rg.add(btn);}
    const sub=this.add.rectangle(W/2,H*0.67+100,120,38,hexToNum(COL_PRIMARY),1).setInteractive({useHandCursor:true}).setDepth(10);
    this.add.text(W/2,H*0.67+100,'Guess!',{fontSize:'14px',color:'#fff',fontFamily:"'Lexend', system-ui",fontStyle:'bold'}).setOrigin(0.5).setDepth(11);
    sub.on('pointerdown',()=>this._check());this.rg.add(sub);
  }
  _check() {
    const guess=parseInt(this.inputText);
    if(guess<=this.realPrice&&guess>=this.realPrice*0.5){
      gameScore+=10*(this.round+1);this.scoreLbl.setText('Score: '+gameScore);this.cameras.main.flash(200,34,197,94);
      this.round++;if(this.round>=TOTAL_ROUNDS){this.time.delayedCall(600,()=>this.scene.start('VictoryScene',{score:gameScore}));}
      else{this.time.delayedCall(800,()=>this.startRound());}
    }else{this.lives--;this._rh();this.cameras.main.shake(200,0.01);this.inputText='';this.inputLbl.setText('_ coins');
      if(this.lives<=0){this.time.delayedCall(500,()=>this.scene.start('LoseScene',{score:gameScore}));}}
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
class RoundAndWinScene extends Phaser.Scene {
  constructor() { super('RoundAndWinScene'); }
  create() { this.W=this.scale.width;this.H=this.scale.height;this.round=0;this.lives=MAX_LIVES;this._bg();this._ui();this.startRound(); }
  _bg() { const bg=this.add.image(this.W/2,this.H/2,'bg');bg.setScale(Math.max(this.W/bg.width,this.H/bg.height));this.add.rectangle(this.W/2,this.H/2,this.W,this.H,0x000000,0.65); }
  _ui() { this.scoreLbl=this.add.text(this.W-14,14,'Score: 0',{fontSize:'16px',color:COL_ACCENT,fontFamily:"'Lexend', system-ui",fontStyle:'bold'}).setOrigin(1,0).setDepth(10);this.hg=this.add.group();this._rh();this.dg=this.add.group();this._rd(); }
  _rh() { this.hg.clear(true,true);for(let i=0;i<this.lives;i++)this.hg.add(this.add.text(14+i*22,14,'♥',{fontSize:'18px',color:COL_DANGER}).setDepth(10)); }
  _rd() { this.dg.clear(true,true);for(let i=0;i<TOTAL_ROUNDS;i++){const c=i<this.round?COL_ACCENT:i===this.round?COL_PRIMARY:'#555555';this.dg.add(this.add.circle(this.W/2-40+i*20,this.H-16,5,hexToNum(c)).setDepth(10));} }
  startRound() {
    if(this.rg)this.rg.clear(true,true);this.rg=this.add.group();
    const data=getRound(this.round);this.correctRounded=data.target;this._rd();
    const W=this.W,H=this.H;
    this.rg.add(this.add.text(W/2,H*0.2,data.prompt,{fontSize:'16px',color:COL_ACCENT,fontFamily:"'Space Grotesk', sans-serif",fontStyle:'bold'}).setOrigin(0.5).setDepth(6));
    this.rg.add(this.add.text(W/2,H*0.35,String(data.items[0] || ''),{fontSize:'48px',color:COL_TEXT,fontFamily:"'Space Grotesk', sans-serif",fontStyle:'bold'}).setOrigin(0.5).setDepth(6));
    this.inputText='';
    this.inputLbl=this.add.text(W/2,H*0.52,'→ _',{fontSize:'28px',color:COL_PRIMARY,fontFamily:"'Space Grotesk', sans-serif",fontStyle:'bold'}).setOrigin(0.5).setDepth(10);
    this.rg.add(this.inputLbl);
    for(let i=0;i<=9;i++){const c=i<5?i:i-5;const r=i<5?0:1;const x=W/2-100+c*50;const y=H*0.64+r*44;
      const btn=this.add.rectangle(x,y,40,36,hexToNum(COL_SECONDARY),0.4).setInteractive({useHandCursor:true}).setDepth(10);
      this.add.text(x,y,String(i),{fontSize:'18px',color:COL_TEXT,fontFamily:"'Space Grotesk', sans-serif",fontStyle:'bold'}).setOrigin(0.5).setDepth(11);
      btn.on('pointerdown',()=>{if(this.inputText.length<6){this.inputText+=String(i);this.inputLbl.setText('→ '+this.inputText);}});
      this.rg.add(btn);}
    const sub=this.add.rectangle(W/2,H*0.64+100,120,38,hexToNum(COL_PRIMARY),1).setInteractive({useHandCursor:true}).setDepth(10);
    this.add.text(W/2,H*0.64+100,'Round!',{fontSize:'14px',color:'#fff',fontFamily:"'Lexend', system-ui",fontStyle:'bold'}).setOrigin(0.5).setDepth(11);
    sub.on('pointerdown',()=>this._check());this.rg.add(sub);
  }
  _check() {
    if(parseInt(this.inputText)===this.correctRounded){
      gameScore+=10*(this.round+1);this.scoreLbl.setText('Score: '+gameScore);this.cameras.main.flash(200,34,197,94);
      this.round++;if(this.round>=TOTAL_ROUNDS){this.time.delayedCall(600,()=>this.scene.start('VictoryScene',{score:gameScore}));}
      else{this.time.delayedCall(800,()=>this.startRound());}
    }else{this.lives--;this._rh();this.cameras.main.shake(200,0.01);this.inputText='';this.inputLbl.setText('→ _');
      if(this.lives<=0){this.time.delayedCall(500,()=>this.scene.start('LoseScene',{score:gameScore}));}}
  }
}
`
