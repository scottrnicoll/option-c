// Rise & Fall — Phaser engine with 3 game options.
// Math: Negative numbers, integers, absolute value, number line.
// Options: depth-navigator, temperature-swing, elevator-operator

import type { ThemeConfig, MathParams, GameOption } from "./engine-types"
import { phaserGame } from "./base-phaser-template"
import { getOptionDef } from "./game-option-registry"

export function aboveBelowZeroPhaserEngine(
  config: ThemeConfig,
  math: MathParams,
  option: GameOption = "depth-navigator"
): string {
  const validOptions = ["depth-navigator", "temperature-swing", "elevator-operator"]
  const activeOption = validOptions.includes(option) ? option : "depth-navigator"
  const optDef = getOptionDef(activeOption)
  const sceneMap: Record<string, string> = {
    "depth-navigator": "DepthNavigatorScene",
    "temperature-swing": "TemperatureSwingScene",
    "elevator-operator": "ElevatorOperatorScene",
  }
  return phaserGame({
    config, math, option: activeOption,
    sceneName: sceneMap[activeOption],
    introText: optDef?.introText || "Navigate the number line!",
    helpText: optDef?.helpText || "Move above and below zero.",
    gameSceneCode: GAME_SCENES,
  })
}

const GAME_SCENES = `
function generateDepthRound(round) {
  if (AI_ROUNDS && AI_ROUNDS[round]) { const r=AI_ROUNDS[round]; return { prompt: r.prompt, target: r.target, hint: r.hint }; }
  const range = round < 2 ? 10 : round < 4 ? 15 : 20;
  const target = Math.floor(Math.random() * range * 2) - range;
  return { prompt: 'Move to ' + target, target, hint: null };
}

function generateTempRound(round) {
  const range = round < 2 ? 10 : round < 4 ? 20 : 30;
  const min = -Math.floor(range / 2);
  const max = Math.floor(range / 2);
  const targetMin = min + Math.floor(Math.random() * 5);
  const targetMax = targetMin + Math.floor(Math.random() * 8) + 3;
  const changes = round < 2 ? 3 : round < 4 ? 4 : 5;
  return { targetMin, targetMax, changes, startTemp: Math.floor(Math.random() * 10) };
}

function generateElevatorRound(round) {
  const floors = round < 2 ? 5 : round < 4 ? 8 : 10;
  const passengers = round < 2 ? 2 : round < 4 ? 3 : 4;
  const pickups = [];
  for (let i = 0; i < passengers; i++) {
    const floor = Math.floor(Math.random() * (floors * 2 + 1)) - floors;
    pickups.push(floor);
  }
  return { totalFloors: floors, pickups };
}

// ═══════════════════════════════════════════════════════════════════════════════
class DepthNavigatorScene extends Phaser.Scene {
  constructor() { super('DepthNavigatorScene'); }
  create() { this.W=this.scale.width;this.H=this.scale.height;this.round=0;this.lives=MAX_LIVES;this.position=0;this._bg();this._ui();this.startRound(); }
  _bg() { const bg=this.add.image(this.W/2,this.H/2,'bg');bg.setScale(Math.max(this.W/bg.width,this.H/bg.height));this.add.rectangle(this.W/2,this.H/2,this.W,this.H,0x000000,0.65); }
  _ui() { this.scoreLbl=this.add.text(this.W-14,14,'Score: 0',{fontSize:'16px',color:COL_ACCENT,fontFamily:"'Lexend', system-ui",fontStyle:'bold'}).setOrigin(1,0).setDepth(10);this.hg=this.add.group();this._rh();this.dg=this.add.group();this._rd(); }
  _rh() { this.hg.clear(true,true);for(let i=0;i<this.lives;i++)this.hg.add(this.add.text(14+i*22,14,'♥',{fontSize:'18px',color:COL_DANGER}).setDepth(10)); }
  _rd() { this.dg.clear(true,true);for(let i=0;i<TOTAL_ROUNDS;i++){const c=i<this.round?COL_ACCENT:i===this.round?COL_PRIMARY:'#555555';this.dg.add(this.add.circle(this.W/2-40+i*20,this.H-16,5,hexToNum(c)).setDepth(10));} }

  startRound() {
    if(this.rg)this.rg.clear(true,true);this.rg=this.add.group();
    this.position=0;
    const data=getRound(this.round);this.target=data.target;this._rd();
    const W=this.W,H=this.H;
    // Number line (vertical)
    const lineX=W*0.2,lineTop=H*0.15,lineBot=H*0.85;
    this.rg.add(this.add.rectangle(lineX,H/2,3,lineBot-lineTop,hexToNum(COL_TEXT),0.4).setDepth(5));
    // Ticks
    const range=20;const step=(lineBot-lineTop)/(range*2);
    for(let v=-range;v<=range;v+=5){
      const y=H/2-v*step;
      this.rg.add(this.add.rectangle(lineX,y,12,1,hexToNum(COL_TEXT),0.4).setDepth(5));
      this.rg.add(this.add.text(lineX-20,y,String(v),{fontSize:'10px',color:COL_TEXT,fontFamily:"'Lexend', system-ui",alpha:0.5}).setOrigin(1,0.5).setDepth(5));
    }
    // Zero line
    this.rg.add(this.add.rectangle(lineX+20,H/2,40,2,hexToNum(COL_ACCENT),0.5).setDepth(5));
    this.rg.add(this.add.text(lineX+45,H/2,'0',{fontSize:'12px',color:COL_ACCENT,fontFamily:"'Lexend', system-ui"}).setOrigin(0,0.5).setDepth(5));
    // Target marker
    const targetY=H/2-this.target*step;
    this.rg.add(this.add.triangle(lineX+15,targetY,0,6,12,0,12,12,hexToNum(COL_DANGER)).setDepth(6));
    this.rg.add(this.add.text(lineX+30,targetY,'Target: '+this.target,{fontSize:'12px',color:COL_DANGER,fontFamily:"'Lexend', system-ui"}).setOrigin(0,0.5).setDepth(6));
    // Player marker
    this.playerY=H/2;
    this.playerMarker=this.add.circle(lineX,this.playerY,8,hexToNum(COL_PRIMARY)).setDepth(7);
    this.rg.add(this.playerMarker);
    this.posLbl=this.add.text(lineX+30,this.playerY,'You: 0',{fontSize:'14px',color:COL_PRIMARY,fontFamily:"'Lexend', system-ui",fontStyle:'bold'}).setOrigin(0,0.5).setDepth(7);
    this.rg.add(this.posLbl);
    // Prompt
    this.rg.add(this.add.text(W*0.6,H*0.2,data.prompt,{fontSize:'20px',color:COL_ACCENT,fontFamily:"'Space Grotesk', sans-serif",fontStyle:'bold'}).setOrigin(0.5).setDepth(6));
    // Buttons
    const btnX=W*0.6;
    [{label:'+5',val:5,y:H*0.4},{label:'+1',val:1,y:H*0.48},{label:'-1',val:-1,y:H*0.56},{label:'-5',val:-5,y:H*0.64}].forEach(b=>{
      const btn=this.add.rectangle(btnX,b.y,100,36,hexToNum(COL_SECONDARY),0.3).setInteractive({useHandCursor:true}).setDepth(7);
      this.rg.add(btn);this.rg.add(this.add.text(btnX,b.y,b.label,{fontSize:'18px',color:COL_TEXT,fontFamily:"'Space Grotesk', sans-serif",fontStyle:'bold'}).setOrigin(0.5).setDepth(8));
      btn.on('pointerdown',()=>{
        this.position+=b.val;
        this.playerY=H/2-this.position*step;
        this.playerMarker.y=this.playerY;
        this.posLbl.y=this.playerY;
        this.posLbl.setText('You: '+this.position);
      });
    });
    // Check
    const check=this.add.rectangle(btnX,H*0.78,120,40,hexToNum(COL_PRIMARY),1).setInteractive({useHandCursor:true}).setDepth(10);
    this.rg.add(check);this.rg.add(this.add.text(btnX,H*0.78,'Lock in',{fontSize:'14px',color:'#fff',fontFamily:"'Lexend', system-ui",fontStyle:'bold'}).setOrigin(0.5).setDepth(11));
    check.on('pointerdown',()=>this._check());
  }

  _check() {
    if(this.position===this.target){
      gameScore+=10*(this.round+1);this.scoreLbl.setText('Score: '+gameScore);this.cameras.main.flash(200,34,197,94);
      this.round++;if(this.round>=TOTAL_ROUNDS)this.time.delayedCall(600,()=>this.scene.start('VictoryScene',{score:gameScore}));
      else this.time.delayedCall(800,()=>this.startRound());
    }else{this.lives--;this._rh();this.cameras.main.shake(200,0.01);
      if(this.lives<=0)this.time.delayedCall(500,()=>this.scene.start('LoseScene',{score:gameScore}));}
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
class TemperatureSwingScene extends Phaser.Scene {
  constructor() { super('TemperatureSwingScene'); }
  create() { this.W=this.scale.width;this.H=this.scale.height;this.round=0;this.lives=MAX_LIVES;this._bg();this._ui();this.startRound(); }
  _bg() { const bg=this.add.image(this.W/2,this.H/2,'bg');bg.setScale(Math.max(this.W/bg.width,this.H/bg.height));this.add.rectangle(this.W/2,this.H/2,this.W,this.H,0x000000,0.65); }
  _ui() { this.scoreLbl=this.add.text(this.W-14,14,'Score: 0',{fontSize:'16px',color:COL_ACCENT,fontFamily:"'Lexend', system-ui",fontStyle:'bold'}).setOrigin(1,0).setDepth(10);this.hg=this.add.group();this._rh();this.dg=this.add.group();this._rd(); }
  _rh() { this.hg.clear(true,true);for(let i=0;i<this.lives;i++)this.hg.add(this.add.text(14+i*22,14,'♥',{fontSize:'18px',color:COL_DANGER}).setDepth(10)); }
  _rd() { this.dg.clear(true,true);for(let i=0;i<TOTAL_ROUNDS;i++){const c=i<this.round?COL_ACCENT:i===this.round?COL_PRIMARY:'#555555';this.dg.add(this.add.circle(this.W/2-40+i*20,this.H-16,5,hexToNum(c)).setDepth(10));} }

  startRound() {
    if(this.rg)this.rg.clear(true,true);this.rg=this.add.group();
    const data=getRound(this.round);
    this.targetMin=data.items[0]||0;this.targetMax=data.items[1]||10;this.temp=data.items[2]||0;this.movesLeft=data.target||3;this._rd();
    const W=this.W,H=this.H;
    this.rg.add(this.add.text(W/2,H*0.1,data.prompt||('Keep temperature between '+this.targetMin+'° and '+this.targetMax+'°'),{fontSize:'13px',color:COL_ACCENT,fontFamily:"'Lexend', system-ui"}).setOrigin(0.5).setDepth(6));
    this.rg.add(this.add.text(W/2,H*0.18,this.movesLeft+' changes to survive',{fontSize:'12px',color:COL_TEXT,fontFamily:"'Lexend', system-ui",alpha:0.5}).setOrigin(0.5).setDepth(6));
    // Thermometer
    this.tempLbl=this.add.text(W/2,H*0.35,this.temp+'°',{fontSize:'48px',color:COL_PRIMARY,fontFamily:"'Space Grotesk', sans-serif",fontStyle:'bold'}).setOrigin(0.5).setDepth(6);
    this.rg.add(this.tempLbl);
    this.zoneLbl=this.add.text(W/2,H*0.48,'',{fontSize:'14px',color:COL_ACCENT,fontFamily:"'Lexend', system-ui"}).setOrigin(0.5).setDepth(6);
    this.rg.add(this.zoneLbl);
    this.movesLbl=this.add.text(W/2,H*0.55,'Moves left: '+this.movesLeft,{fontSize:'13px',color:COL_TEXT,fontFamily:"'Lexend', system-ui"}).setOrigin(0.5).setDepth(6);
    this.rg.add(this.movesLbl);
    this._updateZone();
    // Buttons
    [{label:'+5',val:5},{label:'+1',val:1},{label:'-1',val:-1},{label:'-5',val:-5}].forEach((b,i)=>{
      const x=W*0.25+i*(W*0.5/3);const y=H*0.7;
      const btn=this.add.rectangle(x,y,60,40,hexToNum(COL_SECONDARY),0.3).setInteractive({useHandCursor:true}).setDepth(7);
      this.rg.add(btn);this.rg.add(this.add.text(x,y,b.label,{fontSize:'16px',color:COL_TEXT,fontFamily:"'Space Grotesk', sans-serif",fontStyle:'bold'}).setOrigin(0.5).setDepth(8));
      btn.on('pointerdown',()=>{
        this.temp+=b.val;this.movesLeft--;
        this.tempLbl.setText(this.temp+'°');this.movesLbl.setText('Moves left: '+this.movesLeft);
        this._updateZone();
        if(this.temp<this.targetMin||this.temp>this.targetMax){
          this.lives--;this._rh();this.cameras.main.shake(200,0.01);
          if(this.lives<=0){this.time.delayedCall(500,()=>this.scene.start('LoseScene',{score:gameScore}));return;}
        }
        if(this.movesLeft<=0&&this.temp>=this.targetMin&&this.temp<=this.targetMax){
          gameScore+=10*(this.round+1);this.scoreLbl.setText('Score: '+gameScore);this.cameras.main.flash(200,34,197,94);
          this.round++;if(this.round>=TOTAL_ROUNDS)this.time.delayedCall(600,()=>this.scene.start('VictoryScene',{score:gameScore}));
          else this.time.delayedCall(800,()=>this.startRound());
        }
      });
    });
  }

  _updateZone() {
    const inZone=this.temp>=this.targetMin&&this.temp<=this.targetMax;
    this.zoneLbl.setText(inZone?'In the safe zone!':'Outside the zone!');
    this.zoneLbl.setColor(inZone?COL_ACCENT:COL_DANGER);
    this.tempLbl.setColor(inZone?COL_PRIMARY:COL_DANGER);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
class ElevatorOperatorScene extends Phaser.Scene {
  constructor() { super('ElevatorOperatorScene'); }
  create() { this.W=this.scale.width;this.H=this.scale.height;this.round=0;this.lives=MAX_LIVES;this._bg();this._ui();this.startRound(); }
  _bg() { const bg=this.add.image(this.W/2,this.H/2,'bg');bg.setScale(Math.max(this.W/bg.width,this.H/bg.height));this.add.rectangle(this.W/2,this.H/2,this.W,this.H,0x000000,0.65); }
  _ui() { this.scoreLbl=this.add.text(this.W-14,14,'Score: 0',{fontSize:'16px',color:COL_ACCENT,fontFamily:"'Lexend', system-ui",fontStyle:'bold'}).setOrigin(1,0).setDepth(10);this.hg=this.add.group();this._rh();this.dg=this.add.group();this._rd(); }
  _rh() { this.hg.clear(true,true);for(let i=0;i<this.lives;i++)this.hg.add(this.add.text(14+i*22,14,'♥',{fontSize:'18px',color:COL_DANGER}).setDepth(10)); }
  _rd() { this.dg.clear(true,true);for(let i=0;i<TOTAL_ROUNDS;i++){const c=i<this.round?COL_ACCENT:i===this.round?COL_PRIMARY:'#555555';this.dg.add(this.add.circle(this.W/2-40+i*20,this.H-16,5,hexToNum(c)).setDepth(10));} }

  startRound() {
    if(this.rg)this.rg.clear(true,true);this.rg=this.add.group();
    const data=getRound(this.round);this.pickups=data.items.slice();this.currentFloor=0;this.currentPickup=0;this._rd();
    const W=this.W,H=this.H;
    this.rg.add(this.add.text(W/2,H*0.08,'Pick up passengers at each floor!',{fontSize:'13px',color:COL_ACCENT,fontFamily:"'Lexend', system-ui"}).setOrigin(0.5).setDepth(6));
    // Current floor
    this.floorLbl=this.add.text(W/2,H*0.25,'Floor: 0',{fontSize:'36px',color:COL_PRIMARY,fontFamily:"'Space Grotesk', sans-serif",fontStyle:'bold'}).setOrigin(0.5).setDepth(6);
    this.rg.add(this.floorLbl);
    // Target
    this.targetLbl=this.add.text(W/2,H*0.38,'Next pickup: Floor '+this.pickups[0],{fontSize:'16px',color:COL_ACCENT,fontFamily:"'Lexend', system-ui"}).setOrigin(0.5).setDepth(6);
    this.rg.add(this.targetLbl);
    this.progressLbl=this.add.text(W/2,H*0.45,'Passenger '+(this.currentPickup+1)+' of '+this.pickups.length,{fontSize:'12px',color:COL_TEXT,fontFamily:"'Lexend', system-ui",alpha:0.5}).setOrigin(0.5).setDepth(6);
    this.rg.add(this.progressLbl);
    // Buttons
    [{label:'▲ Up',val:1,y:H*0.58},{label:'▼ Down',val:-1,y:H*0.66}].forEach(b=>{
      const btn=this.add.rectangle(W/2,b.y,160,40,hexToNum(COL_SECONDARY),0.3).setInteractive({useHandCursor:true}).setDepth(7);
      this.rg.add(btn);this.rg.add(this.add.text(W/2,b.y,b.label,{fontSize:'16px',color:COL_TEXT,fontFamily:"'Space Grotesk', sans-serif",fontStyle:'bold'}).setOrigin(0.5).setDepth(8));
      btn.on('pointerdown',()=>{
        this.currentFloor+=b.val;this.floorLbl.setText('Floor: '+this.currentFloor);
        if(this.currentFloor===this.pickups[this.currentPickup]){
          this.cameras.main.flash(100,34,197,94);this.currentPickup++;
          if(this.currentPickup>=this.pickups.length){
            gameScore+=10*(this.round+1);this.scoreLbl.setText('Score: '+gameScore);
            this.round++;if(this.round>=TOTAL_ROUNDS)this.time.delayedCall(600,()=>this.scene.start('VictoryScene',{score:gameScore}));
            else this.time.delayedCall(800,()=>this.startRound());
          }else{
            this.targetLbl.setText('Next pickup: Floor '+this.pickups[this.currentPickup]);
            this.progressLbl.setText('Passenger '+(this.currentPickup+1)+' of '+this.pickups.length);
          }
        }
      });
    });
  }
}
`
