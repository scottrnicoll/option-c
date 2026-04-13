// Craft & Combine — Phaser engine with 3 game options.
// Math: Add, multiply, combine quantities to match a recipe/target.
// Options: recipe-mixer, potion-lab, assembly-line

import type { ThemeConfig, MathParams, GameOption } from "./engine-types"
import { phaserGame } from "./base-phaser-template"
import { getOptionDef } from "./game-option-registry"

export function inventoryCraftingPhaserEngine(
  config: ThemeConfig,
  math: MathParams,
  option: GameOption = "recipe-mixer"
): string {
  const validOptions = ["recipe-mixer", "potion-lab", "assembly-line"]
  const activeOption = validOptions.includes(option) ? option : "recipe-mixer"

  const optDef = getOptionDef(activeOption)

  const sceneMap: Record<string, string> = {
    "recipe-mixer": "RecipeMixerScene",
    "potion-lab": "PotionLabScene",
    "assembly-line": "AssemblyLineScene",
  }

  return phaserGame({
    config,
    math,
    option: activeOption,
    sceneName: sceneMap[activeOption],
    introText: optDef?.introText || "Mix the ingredients!",
    helpText: optDef?.helpText || "Set amounts to match the recipe.",
    gameSceneCode: GAME_SCENES,
  })
}

const GAME_SCENES = `
// ─── Shared helpers ──────────────────────────────────────────────────────────
function generateRecipeRound(round) {
  if (AI_ROUNDS && AI_ROUNDS[round]) {
    const r = AI_ROUNDS[round];
    return { prompt: r.prompt || "Match the recipe!", ingredients: r.items.slice(), target: r.target, hint: r.hint };
  }
  let maxVal, count;
  if (round < 2)      { maxVal = 8;  count = 3; }
  else if (round < 4) { maxVal = 12; count = 4; }
  else                { maxVal = 18; count = 4; }
  const amounts = [];
  let total = 0;
  for (let i = 0; i < count; i++) {
    const v = Math.floor(Math.random() * maxVal) + 1;
    amounts.push(v);
    total += v;
  }
  return { prompt: "Set each ingredient to match", ingredients: amounts, target: total, hint: null };
}

function generatePotionRound(round) {
  let maxBase, multiplier;
  if (round < 2)      { maxBase = 5;  multiplier = 2; }
  else if (round < 4) { maxBase = 8;  multiplier = 3; }
  else                { maxBase = 10; multiplier = 4; }
  const base = Math.floor(Math.random() * maxBase) + 2;
  const mult = Math.floor(Math.random() * (multiplier - 1)) + 2;
  return { base, multiplier: mult, result: base * mult };
}

function generateAssemblyRound(round) {
  let groupSize, groupCount;
  if (round < 2)      { groupSize = 3; groupCount = 2; }
  else if (round < 4) { groupSize = 4; groupCount = 3; }
  else                { groupSize = 5; groupCount = 3; }
  const target = groupSize * groupCount;
  // Offer different group sizes to pick from
  const options = [groupSize];
  while (options.length < 4) {
    const v = Math.floor(Math.random() * 8) + 2;
    if (!options.includes(v)) options.push(v);
  }
  // Shuffle
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  return { target, correctGroupSize: groupSize, correctGroupCount: groupCount, groupOptions: options };
}

// ═══════════════════════════════════════════════════════════════════════════════
// OPTION A: Recipe Mixer — set slider amounts to match a recipe
// ═══════════════════════════════════════════════════════════════════════════════
class RecipeMixerScene extends Phaser.Scene {
  constructor() { super('RecipeMixerScene'); }

  create() {
    this.W = this.scale.width;
    this.H = this.scale.height;
    this.round = 0;
    this.lives = MAX_LIVES;

    this._buildBackground();
    this._buildUI();
    this.hero = addCharacter(this, this.W * 0.85, this.H * 0.35, 0.4);
    this.startRound();
  }

  _buildBackground() {
    const bg = this.add.image(this.W / 2, this.H / 2, 'bg');
    bg.setScale(Math.max(this.W / bg.width, this.H / bg.height));
    this.add.rectangle(this.W / 2, this.H / 2, this.W, this.H, 0x000000, 0.65);
  }

  _buildUI() {
    const W = this.W, pad = 14;
    this.scoreLbl = this.add.text(W - pad, pad, 'Score: 0', {
      fontSize: '16px', color: COL_ACCENT, fontFamily: "'Lexend', system-ui", fontStyle: 'bold'
    }).setOrigin(1, 0).setDepth(10);
    this.heartsGroup = this.add.group();
    this._redrawHearts();
    this.dotGroup = this.add.group();
    this._redrawDots();
    this.promptLbl = this.add.text(W / 2, pad, '', {
      fontSize: '14px', color: COL_TEXT, fontFamily: "'Lexend', system-ui",
      align: 'center', wordWrap: { width: W - 80 }
    }).setOrigin(0.5, 0).setDepth(10);
  }

  _redrawHearts() {
    this.heartsGroup.clear(true, true);
    for (let i = 0; i < this.lives; i++) {
      this.heartsGroup.add(this.add.text(14 + i * 22, 14, '♥', { fontSize: '18px', color: COL_DANGER }).setDepth(10));
    }
  }

  _redrawDots() {
    this.dotGroup.clear(true, true);
    for (let i = 0; i < TOTAL_ROUNDS; i++) {
      const col = i < this.round ? COL_ACCENT : (i === this.round ? COL_PRIMARY : '#555555');
      this.dotGroup.add(this.add.circle(this.W / 2 - 40 + i * 20, this.H - 16, 5, hexToNum(col)).setDepth(10));
    }
  }

  startRound() {
    if (this.ingredientGroup) this.ingredientGroup.clear(true, true);
    this.ingredientGroup = this.add.group();
    const data = getRound(this.round);
    this.recipeAmounts = data.items;
    this.playerAmounts = new Array(data.items.length).fill(0);
    this.promptLbl.setText(data.prompt);
    this._redrawDots();
    this._drawRecipe();
    this._drawCheckButton();
  }

  _drawRecipe() {
    const W = this.W, H = this.H;
    const names = [ITEM_NAME, 'Spice', 'Herb', 'Powder', 'Extract'];
    const startY = H * 0.22;
    const rowH = 55;
    // Recipe card header
    this.ingredientGroup.add(
      this.add.text(W / 2, startY - 25, 'Recipe', {
        fontSize: '16px', color: COL_ACCENT, fontFamily: "'Space Grotesk', sans-serif", fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(6)
    );
    this.playerLbls = [];
    this.recipeAmounts.forEach((target, i) => {
      const y = startY + i * rowH + 20;
      const name = names[i % names.length];
      // Target amount
      this.ingredientGroup.add(
        this.add.text(W * 0.15, y, name + ': ' + target, {
          fontSize: '14px', color: COL_TEXT, fontFamily: "'Lexend', system-ui"
        }).setOrigin(0, 0.5).setDepth(6)
      );
      // Player amount
      const lbl = this.add.text(W * 0.7, y, '0', {
        fontSize: '22px', color: COL_PRIMARY, fontFamily: "'Space Grotesk', sans-serif", fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(7);
      this.playerLbls.push(lbl);
      this.ingredientGroup.add(lbl);
      // +/- buttons
      const minus = this.add.text(W * 0.55, y, '−', {
        fontSize: '24px', color: COL_DANGER, fontFamily: 'sans-serif', fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(7).setInteractive({ useHandCursor: true });
      minus.on('pointerdown', () => {
        if (this.playerAmounts[i] > 0) {
          this.playerAmounts[i]--;
          lbl.setText(String(this.playerAmounts[i]));
        }
      });
      this.ingredientGroup.add(minus);
      const plus = this.add.text(W * 0.85, y, '+', {
        fontSize: '24px', color: COL_ACCENT, fontFamily: 'sans-serif', fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(7).setInteractive({ useHandCursor: true });
      plus.on('pointerdown', () => {
        this.playerAmounts[i]++;
        lbl.setText(String(this.playerAmounts[i]));
      });
      this.ingredientGroup.add(plus);
    });
  }

  _drawCheckButton() {
    const W = this.W, H = this.H;
    const btn = this.add.rectangle(W / 2, H * 0.85, 160, 44, hexToNum(COL_PRIMARY), 1)
      .setInteractive({ useHandCursor: true }).setDepth(10);
    this.add.text(W / 2, H * 0.85, 'Mix!', {
      fontSize: '15px', color: '#fff', fontFamily: "'Lexend', system-ui", fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(11);
    btn.on('pointerdown', () => this._checkRecipe());
    this.ingredientGroup.add(btn);
  }

  _checkRecipe() {
    const correct = this.recipeAmounts.every((v, i) => this.playerAmounts[i] === v);
    if (correct) {
      gameScore += 10 * (this.round + 1);
      this.scoreLbl.setText('Score: ' + gameScore);
      this.cameras.main.flash(200, 34, 197, 94); heroCheer(this, this.hero);
      this.round++;
      if (this.round >= TOTAL_ROUNDS) {
        this.time.delayedCall(600, () => this.scene.start('VictoryScene', { score: gameScore }));
      } else {
        this.time.delayedCall(800, () => this.startRound());
      }
    } else {
      this.lives--;
      this._redrawHearts();
      this.cameras.main.shake(200, 0.01); heroShake(this, this.hero);
      if (this.lives <= 0) {
        this.time.delayedCall(500, () => this.scene.start('LoseScene', { score: gameScore }));
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// OPTION B: Potion Lab — ingredients get multiplied in the cauldron
// ═══════════════════════════════════════════════════════════════════════════════
class PotionLabScene extends Phaser.Scene {
  constructor() { super('PotionLabScene'); }

  create() {
    this.W = this.scale.width;
    this.H = this.scale.height;
    this.round = 0;
    this.lives = MAX_LIVES;
    this._buildBackground();
    this._buildUI();
    this.hero = addCharacter(this, this.W * 0.85, this.H * 0.35, 0.4);
    this.startRound();
  }

  _buildBackground() {
    const bg = this.add.image(this.W / 2, this.H / 2, 'bg');
    bg.setScale(Math.max(this.W / bg.width, this.H / bg.height));
    this.add.rectangle(this.W / 2, this.H / 2, this.W, this.H, 0x000000, 0.65);
  }

  _buildUI() {
    const W = this.W, pad = 14;
    this.scoreLbl = this.add.text(W - pad, pad, 'Score: 0', {
      fontSize: '16px', color: COL_ACCENT, fontFamily: "'Lexend', system-ui", fontStyle: 'bold'
    }).setOrigin(1, 0).setDepth(10);
    this.heartsGroup = this.add.group();
    this._redrawHearts();
    this.dotGroup = this.add.group();
    this._redrawDots();
  }

  _redrawHearts() {
    this.heartsGroup.clear(true, true);
    for (let i = 0; i < this.lives; i++) {
      this.heartsGroup.add(this.add.text(14 + i * 22, 14, '♥', { fontSize: '18px', color: COL_DANGER }).setDepth(10));
    }
  }

  _redrawDots() {
    this.dotGroup.clear(true, true);
    for (let i = 0; i < TOTAL_ROUNDS; i++) {
      const col = i < this.round ? COL_ACCENT : (i === this.round ? COL_PRIMARY : '#555555');
      this.dotGroup.add(this.add.circle(this.W / 2 - 40 + i * 20, this.H - 16, 5, hexToNum(col)).setDepth(10));
    }
  }

  startRound() {
    if (this.roundGroup) this.roundGroup.clear(true, true);
    this.roundGroup = this.add.group();
    const data = getRound(this.round);
    this.correctResult = data.target;
    this._redrawDots();
    const W = this.W, H = this.H;
    // Cauldron visual
    this.roundGroup.add(this.add.circle(W / 2, H * 0.35, 60, hexToNum(COL_SECONDARY), 0.2).setStrokeStyle(3, hexToNum(COL_PRIMARY), 0.6).setDepth(5));
    this.roundGroup.add(this.add.text(W / 2, H * 0.25, 'Cauldron', { fontSize: '12px', color: COL_TEXT, fontFamily: "'Lexend', system-ui", alpha: 0.5 }).setOrigin(0.5).setDepth(6));
    // Show the prompt
    this.roundGroup.add(this.add.text(W / 2, H * 0.35, data.prompt, {
      fontSize: '28px', color: COL_ACCENT, fontFamily: "'Space Grotesk', sans-serif", fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(6));
    this.roundGroup.add(this.add.text(W / 2, H * 0.48, data.hint || 'The cauldron multiplies! What comes out?', {
      fontSize: '13px', color: COL_TEXT, fontFamily: "'Lexend', system-ui"
    }).setOrigin(0.5).setDepth(6));
    // Number pad
    this.inputText = '';
    this.inputLbl = this.add.text(W / 2, H * 0.58, '_', {
      fontSize: '32px', color: COL_PRIMARY, fontFamily: "'Space Grotesk', sans-serif", fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(10);
    this.roundGroup.add(this.inputLbl);
    for (let i = 0; i <= 9; i++) {
      const col = i < 5 ? i : i - 5;
      const row = i < 5 ? 0 : 1;
      const x = W / 2 - 100 + col * 50;
      const y = H * 0.68 + row * 44;
      const btn = this.add.rectangle(x, y, 40, 36, hexToNum(COL_SECONDARY), 0.4)
        .setInteractive({ useHandCursor: true }).setDepth(10);
      this.add.text(x, y, String(i), {
        fontSize: '18px', color: COL_TEXT, fontFamily: "'Space Grotesk', sans-serif", fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(11);
      btn.on('pointerdown', () => {
        if (this.inputText.length < 4) { this.inputText += String(i); this.inputLbl.setText(this.inputText); }
      });
      this.roundGroup.add(btn);
    }
    // Submit
    const sub = this.add.rectangle(W / 2, H * 0.68 + 100, 120, 38, hexToNum(COL_PRIMARY), 1)
      .setInteractive({ useHandCursor: true }).setDepth(10);
    this.add.text(W / 2, H * 0.68 + 100, 'Brew!', {
      fontSize: '14px', color: '#fff', fontFamily: "'Lexend', system-ui", fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(11);
    sub.on('pointerdown', () => this._checkPotion());
    this.roundGroup.add(sub);
  }

  _checkPotion() {
    const answer = parseInt(this.inputText);
    if (answer === this.correctResult) {
      gameScore += 10 * (this.round + 1);
      this.scoreLbl.setText('Score: ' + gameScore);
      this.cameras.main.flash(200, 34, 197, 94); heroCheer(this, this.hero);
      this.round++;
      if (this.round >= TOTAL_ROUNDS) {
        this.time.delayedCall(600, () => this.scene.start('VictoryScene', { score: gameScore }));
      } else {
        this.time.delayedCall(800, () => this.startRound());
      }
    } else {
      this.lives--;
      this._redrawHearts();
      this.cameras.main.shake(200, 0.01); heroShake(this, this.hero);
      this.inputText = '';
      this.inputLbl.setText('_');
      if (this.lives <= 0) {
        this.time.delayedCall(500, () => this.scene.start('LoseScene', { score: gameScore }));
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// OPTION C: Assembly Line — grab groups from conveyor to fill orders
// ═══════════════════════════════════════════════════════════════════════════════
class AssemblyLineScene extends Phaser.Scene {
  constructor() { super('AssemblyLineScene'); }

  create() {
    this.W = this.scale.width;
    this.H = this.scale.height;
    this.round = 0;
    this.lives = MAX_LIVES;
    this.collected = 0;
    this.groupsGrabbed = 0;
    this._buildBackground();
    this._buildUI();
    this.hero = addCharacter(this, this.W * 0.85, this.H * 0.35, 0.4);
    this.startRound();
  }

  _buildBackground() {
    const bg = this.add.image(this.W / 2, this.H / 2, 'bg');
    bg.setScale(Math.max(this.W / bg.width, this.H / bg.height));
    this.add.rectangle(this.W / 2, this.H / 2, this.W, this.H, 0x000000, 0.65);
  }

  _buildUI() {
    const W = this.W, pad = 14;
    this.scoreLbl = this.add.text(W - pad, pad, 'Score: 0', {
      fontSize: '16px', color: COL_ACCENT, fontFamily: "'Lexend', system-ui", fontStyle: 'bold'
    }).setOrigin(1, 0).setDepth(10);
    this.heartsGroup = this.add.group();
    this._redrawHearts();
    this.dotGroup = this.add.group();
    this._redrawDots();
  }

  _redrawHearts() {
    this.heartsGroup.clear(true, true);
    for (let i = 0; i < this.lives; i++) {
      this.heartsGroup.add(this.add.text(14 + i * 22, 14, '♥', { fontSize: '18px', color: COL_DANGER }).setDepth(10));
    }
  }

  _redrawDots() {
    this.dotGroup.clear(true, true);
    for (let i = 0; i < TOTAL_ROUNDS; i++) {
      const col = i < this.round ? COL_ACCENT : (i === this.round ? COL_PRIMARY : '#555555');
      this.dotGroup.add(this.add.circle(this.W / 2 - 40 + i * 20, this.H - 16, 5, hexToNum(col)).setDepth(10));
    }
  }

  startRound() {
    if (this.roundGroup) this.roundGroup.clear(true, true);
    this.roundGroup = this.add.group();
    this.collected = 0;
    this.groupsGrabbed = 0;
    const data = getRound(this.round);
    this.targetTotal = data.target;
    this.correctGroupSize = data.items[0] || 3;
    this.correctGroupCount = Math.round(data.target / (data.items[0] || 3));
    this._redrawDots();
    const W = this.W, H = this.H;
    // Target display
    this.roundGroup.add(this.add.text(W / 2, H * 0.15, data.prompt, {
      fontSize: '18px', color: COL_ACCENT, fontFamily: "'Space Grotesk', sans-serif", fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(6));
    this.roundGroup.add(this.add.text(W / 2, H * 0.22, 'Click groups to grab them', {
      fontSize: '13px', color: COL_TEXT, fontFamily: "'Lexend', system-ui", alpha: 0.6
    }).setOrigin(0.5).setDepth(6));
    // Collected display
    this.collectedLbl = this.add.text(W / 2, H * 0.3, 'Collected: 0', {
      fontSize: '20px', color: COL_PRIMARY, fontFamily: "'Space Grotesk', sans-serif", fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(6);
    this.roundGroup.add(this.collectedLbl);
    // Group buttons — conveyor style
    const groupOptions = data.items;
    const gap = Math.min(90, (W * 0.8) / groupOptions.length);
    const startX = W / 2 - ((groupOptions.length - 1) * gap) / 2;
    groupOptions.forEach((size, i) => {
      const x = startX + i * gap;
      const y = H * 0.5;
      const btn = this.add.rectangle(x, y, 70, 50, hexToNum(COL_SECONDARY), 0.3)
        .setStrokeStyle(2, hexToNum(COL_PRIMARY), 0.4)
        .setInteractive({ useHandCursor: true }).setDepth(7);
      // Draw dots inside to show group size
      for (let d = 0; d < Math.min(size, 6); d++) {
        const dx = (d % 3) * 14 - 14;
        const dy = Math.floor(d / 3) * 14 - 7;
        this.roundGroup.add(this.add.circle(x + dx, y + dy, 4, hexToNum(COL_ACCENT), 0.7).setDepth(8));
      }
      this.roundGroup.add(this.add.text(x, y + 32, 'Group of ' + size, {
        fontSize: '10px', color: COL_TEXT, fontFamily: "'Lexend', system-ui"
      }).setOrigin(0.5).setDepth(8));
      btn.on('pointerdown', () => {
        this.collected += size;
        this.groupsGrabbed++;
        this.collectedLbl.setText('Collected: ' + this.collected);
        this.cameras.main.flash(80, 96, 165, 250);
        // Check
        if (this.collected === this.targetTotal) {
          gameScore += 10 * (this.round + 1);
          this.scoreLbl.setText('Score: ' + gameScore);
          this.cameras.main.flash(200, 34, 197, 94); heroCheer(this, this.hero);
          this.round++;
          if (this.round >= TOTAL_ROUNDS) {
            this.time.delayedCall(600, () => this.scene.start('VictoryScene', { score: gameScore }));
          } else {
            this.time.delayedCall(800, () => this.startRound());
          }
        } else if (this.collected > this.targetTotal) {
          // Over — lose a life and reset
          this.lives--;
          this._redrawHearts();
          this.cameras.main.shake(200, 0.01); heroShake(this, this.hero);
          this.collected = 0;
          this.groupsGrabbed = 0;
          this.collectedLbl.setText('Collected: 0 (too many!)');
          if (this.lives <= 0) {
            this.time.delayedCall(500, () => this.scene.start('LoseScene', { score: gameScore }));
          }
        }
      });
      this.roundGroup.add(btn);
    });
    // Undo button
    const undo = this.add.rectangle(W / 2, H * 0.7, 100, 36, hexToNum(COL_DANGER), 0.3)
      .setInteractive({ useHandCursor: true }).setDepth(7);
    this.roundGroup.add(undo);
    this.roundGroup.add(this.add.text(W / 2, H * 0.7, 'Start over', {
      fontSize: '12px', color: COL_DANGER, fontFamily: "'Lexend', system-ui"
    }).setOrigin(0.5).setDepth(8));
    undo.on('pointerdown', () => {
      this.collected = 0;
      this.groupsGrabbed = 0;
      this.collectedLbl.setText('Collected: 0');
    });
  }
}
`
