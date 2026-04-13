// Shared Phaser base template for all 19 game engines.
// Provides: HTML shell, BootScene, VictoryScene, LoseScene, HUD helpers, game juice.
// Each engine provides: GameScene code as a string, intro/help text.

import type { ThemeConfig, MathParams } from "./engine-types"
import { resolveSpriteUrl } from "../sprite-library"

export interface PhaserGameOpts {
  config: ThemeConfig
  math: MathParams
  option: string
  /** JS source code defining one or more Phaser Scene classes. Must include a class
   *  matching `sceneName`. Can reference: THEME, MATH, COL_*, hexToNum(), etc. */
  gameSceneCode: string
  /** The class name of the scene to start after BootScene, e.g. "FreeCollectScene" */
  sceneName: string
  /** Shown on tutorial overlay before game starts */
  introText: string
  /** Shown when player clicks the (?) help button */
  helpText: string
}

export function phaserGame(opts: PhaserGameOpts): string {
  const { config, math, option, gameSceneCode, sceneName, introText, helpText } = opts
  const c = config.colors

  const characterUrl = config.characterSprite
    ? resolveSpriteUrl("characters", config.characterSprite)
    : resolveSpriteUrl("characters", "wizard")

  const itemUrl = config.itemSprite
    ? resolveSpriteUrl("items", config.itemSprite)
    : resolveSpriteUrl("items", "gem")

  const bgUrl = config.backgroundImage
    ? resolveSpriteUrl("backgrounds", config.backgroundImage)
    : resolveSpriteUrl("backgrounds", "cave")

  const bg = c.bg
  const primary = c.primary
  const secondary = c.secondary
  const accent = c.accent
  const danger = c.danger
  const textColor = c.text

  // Escape help text for safe embedding in JS string
  const escapedHelpText = helpText.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n')

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${config.title}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&family=Lexend:wght@300;400;500;600&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 100%; height: 100%; overflow: hidden; background: ${bg}; font-family: 'Lexend', system-ui, sans-serif; }
  #game-container { width: 100%; height: 100%; }

  /* Tutorial overlay */
  #tutorial {
    position: fixed; inset: 0; background: rgba(0,0,0,0.82);
    display: flex; align-items: center; justify-content: center;
    z-index: 1000;
  }
  #tutorial.hidden { display: none; }
  .tut-box {
    background: ${bg}; border: 3px solid ${primary};
    border-radius: 16px; padding: 28px 32px; max-width: 380px; width: 90%;
    color: ${textColor};
  }
  .tut-box h2 { font-family: 'Space Grotesk', sans-serif; font-size: 20px; margin-bottom: 12px; color: ${accent}; }
  .tut-box p { font-size: 14px; line-height: 1.6; margin-bottom: 8px; }
  .tut-box .tut-btn {
    margin-top: 16px; padding: 10px 28px;
    background: ${primary}; color: #fff; border: none;
    border-radius: 8px; font-size: 15px; font-weight: 700;
    cursor: pointer; width: 100%;
  }
  .tut-btn:hover { opacity: 0.85; }

  /* Help overlay */
  #help-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.82);
    display: none; align-items: center; justify-content: center;
    z-index: 1100;
  }
  #help-overlay.open { display: flex; }
  .help-box {
    background: ${bg}; border: 3px solid ${secondary};
    border-radius: 16px; padding: 24px 28px; max-width: 400px; width: 90%;
    color: ${textColor}; white-space: pre-line;
  }
  .help-box h3 { font-family: 'Space Grotesk', sans-serif; font-size: 18px; margin-bottom: 12px; color: ${accent}; }
  .help-box p { font-size: 13px; line-height: 1.6; margin-bottom: 8px; }
  .help-box .help-close {
    margin-top: 12px; padding: 8px 20px;
    background: ${secondary}; color: ${bg}; border: none;
    border-radius: 8px; font-size: 14px; font-weight: 600;
    cursor: pointer;
  }

  /* Help button */
  #help-btn {
    position: fixed; top: 12px; right: 12px;
    width: 36px; height: 36px; border-radius: 50%;
    background: ${primary}; color: #fff;
    border: none; font-size: 18px; font-weight: 700;
    cursor: pointer; z-index: 900; line-height: 36px; text-align: center;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  }
  #help-btn:hover { opacity: 0.85; }
</style>
</head>
<body>

<!-- Tutorial overlay -->
<div id="tutorial">
  <div class="tut-box">
    <h2>${config.title}</h2>
    <p>You are a <strong>${config.character}</strong> in <strong>${config.worldName}</strong>.</p>
    <p>${introText}</p>
    ${math.standardDescription ? `<p style="opacity:0.7;font-size:12px"><em>Skill: ${math.standardDescription}</em></p>` : ""}
    <p style="opacity:0.7;font-size:12px">3 wrong answers = game over. Good luck!</p>
    <button class="tut-btn" onclick="startGame()">Let's go!</button>
  </div>
</div>

<!-- Help overlay -->
<div id="help-overlay" onclick="closeHelp()">
  <div class="help-box" onclick="event.stopPropagation()">
    <h3>How to play</h3>
    <p id="help-content"></p>
    <button class="help-close" onclick="closeHelp()">Got it</button>
  </div>
</div>

<!-- Help button (visible after game starts) -->
<button id="help-btn" style="display:none" onclick="showHelp()">?</button>

<div id="game-container"></div>

<script src="https://cdn.jsdelivr.net/npm/phaser@3.90.0/dist/phaser.min.js"><\/script>
<script>
// ─── Shared Constants ────────────────────────────────────────────────────────
const TOTAL_ROUNDS   = 5;
const MAX_LIVES      = 3;
const CHARACTER_URL  = "${characterUrl}";
const ITEM_URL       = "${itemUrl}";
const BG_URL         = "${bgUrl}";
const COL_BG         = "${bg}";
const COL_PRIMARY    = "${primary}";
const COL_SECONDARY  = "${secondary}";
const COL_ACCENT     = "${accent}";
const COL_DANGER     = "${danger}";
const COL_TEXT       = "${textColor}";
const WIN_MSG        = ${JSON.stringify(config.winMessage)};
const LOSE_MSG       = ${JSON.stringify(config.loseMessage)};
const ITEM_NAME      = ${JSON.stringify(config.itemName)};
const CHARACTER_NAME = ${JSON.stringify(config.character)};
const WORLD_NAME     = ${JSON.stringify(config.worldName)};
const AI_ROUNDS      = ${math.rounds ? JSON.stringify(math.rounds) : "null"};
const GAME_OPTION    = ${JSON.stringify(option)};
const HELP_TEXT      = '${escapedHelpText}';

const THEME = {
  title: ${JSON.stringify(config.title)},
  character: CHARACTER_NAME,
  itemName: ITEM_NAME,
  worldName: WORLD_NAME,
  winMessage: WIN_MSG,
  loseMessage: LOSE_MSG,
  colors: { bg: COL_BG, primary: COL_PRIMARY, secondary: COL_SECONDARY, accent: COL_ACCENT, danger: COL_DANGER, text: COL_TEXT }
};
const MATH = ${JSON.stringify({ grade: math.grade, standardId: math.standardId, standardDescription: math.standardDescription, difficulty: math.difficulty })};

// ─── Shared Utilities ────────────────────────────────────────────────────────
function hexToNum(hex) {
  return parseInt(hex.replace('#', ''), 16);
}

// Place the character sprite in a scene. Returns the sprite so scenes can tween it.
// Call in create(): this.hero = addCharacter(this, x, y, scale)
function addCharacter(scene, x, y, scale) {
  const hero = scene.add.image(x, y, 'character').setScale(scale || 0.5).setDepth(20).setAlpha(0.9);
  // Gentle idle bob
  scene.tweens.add({ targets: hero, y: y - 4, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  return hero;
}

// Character reacts to correct answer — jump + scale
function heroCheer(scene, hero) {
  if (!hero) return;
  scene.tweens.add({ targets: hero, y: hero.y - 20, scaleX: 0.55, scaleY: 0.55, duration: 200, yoyo: true, ease: 'Back.easeOut' });
}

// Character reacts to wrong answer — shake head
function heroShake(scene, hero) {
  if (!hero) return;
  const ox = hero.x;
  scene.tweens.add({ targets: hero, x: ox - 8, duration: 60, yoyo: true, repeat: 3, ease: 'Sine.easeInOut', onComplete: () => { hero.x = ox; } });
}

// ─── Shared: Get round data from AI_ROUNDS (required) ────────────────────────
// ALL math content comes from AI_ROUNDS. Engines must NOT generate their own math.
function getRound(roundIndex) {
  if (!AI_ROUNDS || !AI_ROUNDS[roundIndex]) {
    return { prompt: 'Solve this!', target: 10, items: [10, 5, 8, 3, 12, 7], hint: 'Think carefully!' };
  }
  const r = AI_ROUNDS[roundIndex];
  return {
    prompt: r.prompt || 'Solve this!',
    target: typeof r.target === 'number' ? r.target : 10,
    items: Array.isArray(r.items) ? r.items : [10, 5, 8, 3, 12, 7],
    hint: r.hint || null
  };
}

// ─── State ───────────────────────────────────────────────────────────────────
let gameScore = 0;
let gameStarted = false;

// ─── BootScene ───────────────────────────────────────────────────────────────
class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  preload() {
    const W = this.scale.width;
    const H = this.scale.height;

    // Loading bar
    const barBg = this.add.rectangle(W / 2, H / 2, 300, 18, 0x333333, 1).setOrigin(0.5);
    const bar   = this.add.rectangle(W / 2 - 149, H / 2, 2, 14, hexToNum(COL_ACCENT), 1).setOrigin(0, 0.5);
    this.add.text(W / 2, H / 2 - 24, 'Loading...', {
      fontSize: '14px', color: COL_TEXT, fontFamily: "'Lexend', system-ui"
    }).setOrigin(0.5);

    this.load.on('progress', (v) => {
      bar.width = Math.max(2, v * 298);
    });

    // Load shared assets
    this.load.svg('character', CHARACTER_URL, { width: 120, height: 120 });
    this.load.svg('item',      ITEM_URL,      { width: 64,  height: 64  });
    this.load.svg('bg',        BG_URL,        { width: 800, height: 600 });
  }

  create() {
    this.scene.start('${sceneName}');
  }
}

// ─── VictoryScene ────────────────────────────────────────────────────────────
class VictoryScene extends Phaser.Scene {
  constructor() { super('VictoryScene'); }

  create(data) {
    const W = this.scale.width, H = this.scale.height;

    const bg = this.add.image(W / 2, H / 2, 'bg');
    bg.setScale(Math.max(W / bg.width, H / bg.height));
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.6);

    this.add.image(W / 2, H / 2 - 40, 'character').setScale(1.1).setDepth(5);

    this.add.text(W / 2, H / 2 + 80, WIN_MSG, {
      fontSize: '22px', color: '#fff', fontFamily: "'Space Grotesk', sans-serif", fontStyle: 'bold',
      align: 'center', wordWrap: { width: W - 60 }
    }).setOrigin(0.5).setDepth(6);

    this.add.text(W / 2, H / 2 + 120, 'Score: ' + (data.score || 0), {
      fontSize: '18px', color: COL_ACCENT, fontFamily: "'Lexend', system-ui"
    }).setOrigin(0.5).setDepth(6);

    // Fireworks
    const burst = () => {
      const x = 60 + Math.random() * (W - 120);
      const y = 60 + Math.random() * (H / 2);
      const colours = [hexToNum(COL_ACCENT), hexToNum(COL_PRIMARY), 0xffffff, hexToNum(COL_SECONDARY)];
      const col = colours[Math.floor(Math.random() * colours.length)];
      for (let i = 0; i < 20; i++) {
        const angle = (Math.PI * 2 / 20) * i;
        const dist  = 40 + Math.random() * 70;
        const dot   = this.add.circle(x, y, 4 + Math.random() * 4, col, 1).setDepth(10);
        this.tweens.add({
          targets: dot,
          x: x + Math.cos(angle) * dist,
          y: y + Math.sin(angle) * dist,
          alpha: 0, scale: 0.1,
          duration: 600 + Math.random() * 400,
          ease: 'Cubic.easeOut',
          onComplete: () => dot.destroy()
        });
      }
    };
    burst();
    this.time.addEvent({ delay: 500, loop: true, callback: burst });

    this.time.delayedCall(2000, () => {
      window.parent.postMessage({ type: 'game_win' }, '*');
    });
  }
}

// ─── LoseScene ───────────────────────────────────────────────────────────────
class LoseScene extends Phaser.Scene {
  constructor() { super('LoseScene'); }

  create(data) {
    const W = this.scale.width, H = this.scale.height;

    const bg = this.add.image(W / 2, H / 2, 'bg');
    bg.setScale(Math.max(W / bg.width, H / bg.height));
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7);

    this.add.image(W / 2, H / 2 - 50, 'character').setScale(0.9).setDepth(5).setTint(0x888888);

    this.add.text(W / 2, H / 2 + 50, LOSE_MSG, {
      fontSize: '20px', color: COL_DANGER, fontFamily: "'Space Grotesk', sans-serif", fontStyle: 'bold',
      align: 'center', wordWrap: { width: W - 60 }
    }).setOrigin(0.5).setDepth(6);

    this.add.text(W / 2, H / 2 + 90, 'Score: ' + (data.score || 0), {
      fontSize: '16px', color: '#aaa', fontFamily: "'Lexend', system-ui"
    }).setOrigin(0.5).setDepth(6);
  }
}

// ─── Game Juice Mixin ────────────────────────────────────────────────────────
// Engines can call these on any scene: this._screenShake(), this._burstParticles(), etc.
// We add them to Phaser.Scene prototype so all scenes get them.
Phaser.Scene.prototype._screenShake = function(intensity) {
  if (this._shaking) return;
  this._shaking = true;
  this.cameras.main.shake(380, intensity || 0.012);
  this.time.delayedCall(420, () => { this._shaking = false; });
};

Phaser.Scene.prototype._burstParticles = function(x, y, count) {
  count = count || 18;
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 / count) * i;
    const dist  = 60 + Math.random() * 80;
    const dot   = this.add.circle(x, y, 5 + Math.random() * 6, hexToNum(COL_ACCENT), 1).setDepth(20);
    this.tweens.add({
      targets: dot,
      x: x + Math.cos(angle) * dist,
      y: y + Math.sin(angle) * dist,
      alpha: 0, scale: 0.2,
      duration: 550 + Math.random() * 200,
      ease: 'Cubic.easeOut',
      onComplete: () => dot.destroy()
    });
  }
  for (let i = 0; i < 8; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist  = 30 + Math.random() * 60;
    const dot   = this.add.circle(x, y, 3 + Math.random() * 4, hexToNum(COL_PRIMARY), 1).setDepth(20);
    this.tweens.add({
      targets: dot,
      x: x + Math.cos(angle) * dist,
      y: y + Math.sin(angle) * dist,
      alpha: 0, scale: 0.1,
      duration: 400 + Math.random() * 300,
      ease: 'Cubic.easeOut',
      onComplete: () => dot.destroy()
    });
  }
};

Phaser.Scene.prototype._showScorePop = function(txt, col) {
  const color = col || COL_ACCENT;
  const pop = this.add.text(this.scale.width / 2, this.scale.height / 2 - 40, txt, {
    fontSize: '22px', fontStyle: 'bold', color: color,
    fontFamily: "'Lexend', system-ui", stroke: '#000', strokeThickness: 4
  }).setOrigin(0.5).setDepth(30).setAlpha(0);

  this.tweens.add({
    targets: pop, alpha: 1, y: this.scale.height / 2 - 80,
    duration: 300, ease: 'Cubic.easeOut',
    onComplete: () => {
      this.tweens.add({
        targets: pop, alpha: 0, y: this.scale.height / 2 - 110,
        delay: 600, duration: 300,
        onComplete: () => pop.destroy()
      });
    }
  });
};

// ─── Engine-Specific Game Scene(s) ───────────────────────────────────────────
${gameSceneCode}

// ─── Phaser Config ───────────────────────────────────────────────────────────
const phaserConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: COL_BG,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: window.innerWidth,
    height: window.innerHeight,
  },
  scene: [BootScene, ${sceneName}, VictoryScene, LoseScene],
};

// ─── Bootstrap ───────────────────────────────────────────────────────────────
let _game = null;

function startGame() {
  document.getElementById('tutorial').classList.add('hidden');
  document.getElementById('help-btn').style.display = 'block';
  _game = new Phaser.Game(phaserConfig);
}

function showHelp() {
  // Use AI-generated hints when available (standard-specific), fall back to generic
  let helpContent = HELP_TEXT;
  if (AI_ROUNDS && AI_ROUNDS.length > 0) {
    const hints = AI_ROUNDS.filter(r => r.hint).map(r => r.hint);
    if (hints.length > 0) {
      helpContent = 'Skill: ' + MATH.standardDescription + '\\n\\n' + hints[0] + '\\n\\nExample: ' + AI_ROUNDS[0].prompt;
    } else {
      helpContent = 'Skill: ' + MATH.standardDescription + '\\n\\nExample: ' + AI_ROUNDS[0].prompt + '\\n\\n' + HELP_TEXT;
    }
  }
  document.getElementById('help-content').textContent = helpContent;
  document.getElementById('help-overlay').classList.add('open');
}

function closeHelp() {
  document.getElementById('help-overlay').classList.remove('open');
}
<\/script>
</body>
</html>`
}
