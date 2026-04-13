// Balance & Equalize — Phaser engine with 3 game options.
// Math: Keep both sides equal — solving equations by balancing.
// Options: free-balance, mystery-side, chain-scales

import type { ThemeConfig, MathParams, GameOption } from "./engine-types"
import { phaserGame } from "./base-phaser-template"
import { getOptionDef } from "./game-option-registry"

export function balanceSystemsPhaserEngine(
  config: ThemeConfig,
  math: MathParams,
  option: GameOption = "free-balance"
): string {
  const validOptions = ["free-balance", "mystery-side", "chain-scales"]
  const activeOption = validOptions.includes(option) ? option : "free-balance"

  const optDef = getOptionDef(activeOption)

  const sceneMap: Record<string, string> = {
    "free-balance": "FreeBalanceScene",
    "mystery-side": "MysterySideScene",
    "chain-scales": "ChainScalesScene",
  }

  return phaserGame({
    config,
    math,
    option: activeOption,
    sceneName: sceneMap[activeOption],
    introText: optDef?.introText || "Balance the scale!",
    helpText: optDef?.helpText || "Make both sides equal.",
    gameSceneCode: GAME_SCENES,
  })
}

const GAME_SCENES = `
// ─── Shared: Round Generation ────────────────────────────────────────────────
function generateBalanceRound(round) {
  if (AI_ROUNDS && AI_ROUNDS[round]) {
    const r = AI_ROUNDS[round];
    return {
      prompt: r.prompt || "Balance the scale!",
      leftValue: r.target,
      weights: r.items.slice(),
      hint: r.hint || null
    };
  }
  let maxVal, weightCount;
  if (round < 2)      { maxVal = 12; weightCount = 5; }
  else if (round < 4) { maxVal = 20; weightCount = 6; }
  else                { maxVal = 30; weightCount = 7; }

  const leftValue = Math.floor(Math.random() * (maxVal - 4)) + 5;
  const weights = [];
  // Ensure at least one valid combination that sums to leftValue (2-3 weights)
  // Force at least 2 weights so no single weight = target
  const a = Math.floor(Math.random() * Math.floor(leftValue / 2)) + 1;
  const remainder = leftValue - a;
  if (remainder > maxVal * 0.7 && remainder > 3) {
    // Split remainder further so no single weight is too close to target
    const b = Math.floor(Math.random() * (remainder - 1)) + 1;
    weights.push(a, b, remainder - b);
  } else {
    weights.push(a, remainder);
  }
  // Add distractors — never equal to leftValue, never equal to any existing weight
  const usedValues = new Set(weights);
  usedValues.add(leftValue);
  while (weights.length < weightCount) {
    const v = Math.floor(Math.random() * maxVal) + 1;
    if (!usedValues.has(v)) { weights.push(v); usedValues.add(v); }
  }
  // Shuffle
  for (let i = weights.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [weights[i], weights[j]] = [weights[j], weights[i]];
  }
  return { prompt: "Balance the scale!", leftValue, weights, hint: null };
}

function generateMysteryRound(round) {
  let maxVal;
  if (round < 2)      { maxVal = 15; }
  else if (round < 4) { maxVal = 25; }
  else                { maxVal = 40; }
  const mystery = Math.floor(Math.random() * maxVal) + 3;
  return { mystery, hint: "Add up what you can see on the other side." };
}

function generateChainRound(round) {
  let maxVal;
  if (round < 2)      { maxVal = 10; }
  else if (round < 4) { maxVal = 18; }
  else                { maxVal = 25; }
  const values = [
    Math.floor(Math.random() * maxVal) + 3,
    Math.floor(Math.random() * maxVal) + 3,
    Math.floor(Math.random() * maxVal) + 3,
  ];
  return { values };
}

// ═══════════════════════════════════════════════════════════════════════════════
// OPTION A: Free Balance — drag weights to make both sides equal
// ═══════════════════════════════════════════════════════════════════════════════
class FreeBalanceScene extends Phaser.Scene {
  constructor() { super('FreeBalanceScene'); }

  create() {
    this.W = this.scale.width;
    this.H = this.scale.height;
    this.round = 0;
    this.lives = MAX_LIVES;
    this.rightTotal = 0;
    this.placedWeights = [];

    this._buildBackground();
    this._buildUI();
    this._buildScale();
    this._buildDoneButton();
    this.hero = addCharacter(this, this.W * 0.85, this.H * 0.4, 0.45);
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
      this.heartsGroup.add(
        this.add.text(14 + i * 22, 14, '♥', { fontSize: '18px', color: COL_DANGER }).setDepth(10)
      );
    }
  }

  _redrawDots() {
    this.dotGroup.clear(true, true);
    for (let i = 0; i < TOTAL_ROUNDS; i++) {
      const col = i < this.round ? COL_ACCENT : (i === this.round ? COL_PRIMARY : '#555555');
      this.dotGroup.add(
        this.add.circle(this.W / 2 - 40 + i * 20, this.H - 16, 5, hexToNum(col)).setDepth(10)
      );
    }
  }

  _buildScale() {
    const W = this.W, H = this.H;
    const centerX = W / 2, beamY = H * 0.55;
    // Fulcrum triangle
    this.add.triangle(centerX, beamY + 30, 0, 30, 15, 0, 30, 30, hexToNum(COL_SECONDARY), 1).setDepth(5);
    // Beam
    this.beam = this.add.rectangle(centerX, beamY, W * 0.6, 6, hexToNum(COL_TEXT), 1).setDepth(5);
    // Left pan label
    this.leftLbl = this.add.text(centerX - W * 0.22, beamY - 30, '', {
      fontSize: '28px', color: COL_ACCENT, fontFamily: "'Space Grotesk', sans-serif", fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(6);
    // Right pan label
    this.rightLbl = this.add.text(centerX + W * 0.22, beamY - 30, '0', {
      fontSize: '28px', color: COL_PRIMARY, fontFamily: "'Space Grotesk', sans-serif", fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(6);
    // Pans
    this.add.rectangle(centerX - W * 0.22, beamY + 8, 100, 4, hexToNum(COL_ACCENT), 0.5).setDepth(5);
    this.add.rectangle(centerX + W * 0.22, beamY + 8, 100, 4, hexToNum(COL_PRIMARY), 0.5).setDepth(5);
  }

  _buildDoneButton() {
    const W = this.W, H = this.H;
    const btn = this.add.rectangle(W / 2, H - 50, 160, 44, hexToNum(COL_PRIMARY), 1)
      .setInteractive({ useHandCursor: true }).setDepth(10);
    this.add.text(W / 2, H - 50, 'Check Balance', {
      fontSize: '15px', color: '#fff', fontFamily: "'Lexend', system-ui", fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(11);
    btn.on('pointerdown', () => this.checkBalance());
  }

  startRound() {
    this.rightTotal = 0;
    this.placedWeights = [];
    this.rightLbl.setText('0');
    const data = getRound(this.round);
    this.currentLeft = data.target;
    this.leftLbl.setText(String(data.target));
    this.promptLbl.setText(data.prompt);
    this._redrawDots();
    // Remove old weight buttons
    if (this.weightButtons) this.weightButtons.forEach(b => b.destroy());
    this.weightButtons = [];
    // Create weight buttons
    const startX = this.W * 0.15;
    const gap = Math.min(70, (this.W * 0.7) / data.items.length);
    data.items.forEach((val, i) => {
      const x = startX + i * gap;
      const y = this.H * 0.3;
      const bg = this.add.rectangle(x, y, 50, 36, hexToNum(COL_SECONDARY), 0.3)
        .setInteractive({ useHandCursor: true }).setDepth(7);
      const lbl = this.add.text(x, y, String(val), {
        fontSize: '18px', color: COL_TEXT, fontFamily: "'Space Grotesk', sans-serif", fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(8);
      let placed = false;
      bg.on('pointerdown', () => {
        if (!placed) {
          placed = true;
          bg.setFillStyle(hexToNum(COL_PRIMARY), 0.6);
          lbl.setColor(COL_PRIMARY);
          this.rightTotal += val;
          this.placedWeights.push(val);
        } else {
          placed = false;
          bg.setFillStyle(hexToNum(COL_SECONDARY), 0.3);
          lbl.setColor(COL_TEXT);
          this.rightTotal -= val;
          this.placedWeights = this.placedWeights.filter((v, idx) => {
            if (v === val) { return false; }
            return true;
          });
        }
        this.rightLbl.setText(String(this.rightTotal));
        // Tilt beam
        const diff = this.rightTotal - this.currentLeft;
        const angle = Math.max(-0.15, Math.min(0.15, diff * 0.01));
        this.beam.setRotation(angle);
      });
      this.weightButtons.push(bg, lbl);
    });
  }

  checkBalance() {
    if (this.rightTotal === this.currentLeft) {
      // Correct!
      gameScore += 10 * (this.round + 1);
      this.scoreLbl.setText('Score: ' + gameScore);
      // Flash green
      this.cameras.main.flash(200, 34, 197, 94); heroCheer(this, this.hero);
      this.beam.setRotation(0);
      this.round++;
      if (this.round >= TOTAL_ROUNDS) {
        this.time.delayedCall(600, () => this.scene.start('VictoryScene', { score: gameScore }));
      } else {
        this.time.delayedCall(800, () => this.startRound());
      }
    } else {
      // Wrong
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
// OPTION B: Mystery Side — one side hidden, figure out its value
// ═══════════════════════════════════════════════════════════════════════════════
class MysterySideScene extends Phaser.Scene {
  constructor() { super('MysterySideScene'); }

  create() {
    this.W = this.scale.width;
    this.H = this.scale.height;
    this.round = 0;
    this.lives = MAX_LIVES;

    this._buildBackground();
    this._buildUI();
    this._buildScale();
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
      this.heartsGroup.add(
        this.add.text(14 + i * 22, 14, '♥', { fontSize: '18px', color: COL_DANGER }).setDepth(10)
      );
    }
  }

  _redrawDots() {
    this.dotGroup.clear(true, true);
    for (let i = 0; i < TOTAL_ROUNDS; i++) {
      const col = i < this.round ? COL_ACCENT : (i === this.round ? COL_PRIMARY : '#555555');
      this.dotGroup.add(
        this.add.circle(this.W / 2 - 40 + i * 20, this.H - 16, 5, hexToNum(col)).setDepth(10)
      );
    }
  }

  _buildScale() {
    const W = this.W, H = this.H;
    const centerX = W / 2, beamY = H * 0.45;
    this.add.triangle(centerX, beamY + 30, 0, 30, 15, 0, 30, 30, hexToNum(COL_SECONDARY), 1).setDepth(5);
    this.beam = this.add.rectangle(centerX, beamY, W * 0.6, 6, hexToNum(COL_TEXT), 1).setDepth(5);
    // Left pan — mystery
    this.mysteryLbl = this.add.text(centerX - W * 0.22, beamY - 30, '?', {
      fontSize: '36px', color: COL_DANGER, fontFamily: "'Space Grotesk', sans-serif", fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(6);
    // Right pan — visible values
    this.rightLbl = this.add.text(centerX + W * 0.22, beamY - 30, '', {
      fontSize: '22px', color: COL_PRIMARY, fontFamily: "'Space Grotesk', sans-serif", fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(6);
    // Input
    this.inputText = '';
    this.inputLbl = this.add.text(centerX, H * 0.7, 'Your answer: _', {
      fontSize: '24px', color: COL_TEXT, fontFamily: "'Space Grotesk', sans-serif", fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(10);
    // Number pad
    const padY = H * 0.82;
    for (let i = 0; i <= 9; i++) {
      const col = i < 5 ? i : i - 5;
      const row = i < 5 ? 0 : 1;
      const x = centerX - 100 + col * 50;
      const y = padY + row * 44;
      const btn = this.add.rectangle(x, y, 40, 36, hexToNum(COL_SECONDARY), 0.4)
        .setInteractive({ useHandCursor: true }).setDepth(10);
      this.add.text(x, y, String(i), {
        fontSize: '18px', color: COL_TEXT, fontFamily: "'Space Grotesk', sans-serif", fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(11);
      btn.on('pointerdown', () => {
        if (this.inputText.length < 3) {
          this.inputText += String(i);
          this.inputLbl.setText('Your answer: ' + this.inputText);
        }
      });
    }
    // Clear button
    const clrBtn = this.add.rectangle(centerX + 150, padY + 22, 50, 36, hexToNum(COL_DANGER), 0.4)
      .setInteractive({ useHandCursor: true }).setDepth(10);
    this.add.text(centerX + 150, padY + 22, 'CLR', {
      fontSize: '12px', color: COL_DANGER, fontFamily: "'Lexend', system-ui", fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(11);
    clrBtn.on('pointerdown', () => { this.inputText = ''; this.inputLbl.setText('Your answer: _'); });
    // Submit
    const subBtn = this.add.rectangle(centerX, padY + 80, 140, 40, hexToNum(COL_PRIMARY), 1)
      .setInteractive({ useHandCursor: true }).setDepth(10);
    this.add.text(centerX, padY + 80, 'Check', {
      fontSize: '15px', color: '#fff', fontFamily: "'Lexend', system-ui", fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(11);
    subBtn.on('pointerdown', () => this.checkAnswer());
  }

  startRound() {
    this.inputText = '';
    this.inputLbl.setText('Your answer: _');
    const data = getRound(this.round);
    this.mysteryValue = data.target;
    this.mysteryLbl.setText('?');
    // Show visible weights on right side from items
    this.rightLbl.setText(data.items.join(' + '));
    this._redrawDots();
  }

  checkAnswer() {
    const answer = parseInt(this.inputText);
    if (answer === this.mysteryValue) {
      gameScore += 10 * (this.round + 1);
      this.scoreLbl.setText('Score: ' + gameScore);
      this.mysteryLbl.setText(String(this.mysteryValue));
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
      this.inputLbl.setText('Your answer: _');
      if (this.lives <= 0) {
        this.time.delayedCall(500, () => this.scene.start('LoseScene', { score: gameScore }));
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// OPTION C: Chain Scales — balance 3 connected scales in sequence
// ═══════════════════════════════════════════════════════════════════════════════
class ChainScalesScene extends Phaser.Scene {
  constructor() { super('ChainScalesScene'); }

  create() {
    this.W = this.scale.width;
    this.H = this.scale.height;
    this.round = 0;
    this.lives = MAX_LIVES;
    this.currentScale = 0;
    this.answers = [0, 0, 0];

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
    this.promptLbl = this.add.text(W / 2, pad, 'Balance all 3 scales!', {
      fontSize: '14px', color: COL_TEXT, fontFamily: "'Lexend', system-ui"
    }).setOrigin(0.5, 0).setDepth(10);
  }

  _redrawHearts() {
    this.heartsGroup.clear(true, true);
    for (let i = 0; i < this.lives; i++) {
      this.heartsGroup.add(
        this.add.text(14 + i * 22, 14, '♥', { fontSize: '18px', color: COL_DANGER }).setDepth(10)
      );
    }
  }

  _redrawDots() {
    this.dotGroup.clear(true, true);
    for (let i = 0; i < TOTAL_ROUNDS; i++) {
      const col = i < this.round ? COL_ACCENT : (i === this.round ? COL_PRIMARY : '#555555');
      this.dotGroup.add(
        this.add.circle(this.W / 2 - 40 + i * 20, this.H - 16, 5, hexToNum(col)).setDepth(10)
      );
    }
  }

  startRound() {
    this.currentScale = 0;
    this.answers = [0, 0, 0];
    if (this.scaleGroup) this.scaleGroup.clear(true, true);
    this.scaleGroup = this.add.group();
    const data = getRound(this.round);
    this.targetValues = data.items.length >= 3 ? data.items.slice(0, 3) : [data.target, data.target, data.target];
    this._drawScales();
    this._drawInput();
    this._redrawDots();
  }

  _drawScales() {
    const W = this.W, H = this.H;
    const positions = [W * 0.2, W * 0.5, W * 0.8];
    const y = H * 0.4;
    this.scaleLbls = [];
    this.ansLbls = [];
    positions.forEach((x, i) => {
      const active = i === this.currentScale;
      const col = i < this.currentScale ? COL_ACCENT : (active ? COL_PRIMARY : COL_SECONDARY);
      // Triangle
      this.scaleGroup.add(this.add.triangle(x, y + 20, 0, 20, 10, 0, 20, 20, hexToNum(col), 0.6).setDepth(5));
      // Beam
      this.scaleGroup.add(this.add.rectangle(x, y, 80, 4, hexToNum(col), 0.8).setDepth(5));
      // Target
      const lbl = this.add.text(x - 25, y - 25, String(this.targetValues[i]), {
        fontSize: '20px', color: COL_ACCENT, fontFamily: "'Space Grotesk', sans-serif", fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(6);
      this.scaleLbls.push(lbl);
      this.scaleGroup.add(lbl);
      // Answer
      const aLbl = this.add.text(x + 25, y - 25, i < this.currentScale ? String(this.answers[i]) : '?', {
        fontSize: '20px', color: i < this.currentScale ? COL_ACCENT : COL_TEXT,
        fontFamily: "'Space Grotesk', sans-serif", fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(6);
      this.ansLbls.push(aLbl);
      this.scaleGroup.add(aLbl);
      // Arrow to next
      if (i < 2) {
        this.scaleGroup.add(
          this.add.text(x + 55, y, '→', { fontSize: '20px', color: '#555', fontFamily: 'sans-serif' }).setOrigin(0.5).setDepth(5)
        );
      }
    });
  }

  _drawInput() {
    if (this.inputGroup) this.inputGroup.clear(true, true);
    this.inputGroup = this.add.group();
    this.inputText = '';
    const H = this.H, W = this.W, centerX = W / 2;
    this.inputLbl = this.add.text(centerX, H * 0.6, 'Scale ' + (this.currentScale + 1) + ': type your answer', {
      fontSize: '16px', color: COL_TEXT, fontFamily: "'Lexend', system-ui"
    }).setOrigin(0.5).setDepth(10);
    this.inputGroup.add(this.inputLbl);
    this.answerLbl = this.add.text(centerX, H * 0.67, '_', {
      fontSize: '32px', color: COL_PRIMARY, fontFamily: "'Space Grotesk', sans-serif", fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(10);
    this.inputGroup.add(this.answerLbl);
    // Number pad
    for (let i = 0; i <= 9; i++) {
      const col = i < 5 ? i : i - 5;
      const row = i < 5 ? 0 : 1;
      const x = centerX - 100 + col * 50;
      const y = H * 0.78 + row * 44;
      const btn = this.add.rectangle(x, y, 40, 36, hexToNum(COL_SECONDARY), 0.4)
        .setInteractive({ useHandCursor: true }).setDepth(10);
      const t = this.add.text(x, y, String(i), {
        fontSize: '18px', color: COL_TEXT, fontFamily: "'Space Grotesk', sans-serif", fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(11);
      btn.on('pointerdown', () => {
        if (this.inputText.length < 3) {
          this.inputText += String(i);
          this.answerLbl.setText(this.inputText);
        }
      });
      this.inputGroup.add(btn);
      this.inputGroup.add(t);
    }
    // Submit
    const subBtn = this.add.rectangle(centerX, H * 0.78 + 100, 120, 38, hexToNum(COL_PRIMARY), 1)
      .setInteractive({ useHandCursor: true }).setDepth(10);
    const subT = this.add.text(centerX, H * 0.78 + 100, 'Check', {
      fontSize: '14px', color: '#fff', fontFamily: "'Lexend', system-ui", fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(11);
    subBtn.on('pointerdown', () => this.checkScale());
    this.inputGroup.add(subBtn);
    this.inputGroup.add(subT);
  }

  checkScale() {
    const answer = parseInt(this.inputText);
    if (answer === this.targetValues[this.currentScale]) {
      this.answers[this.currentScale] = answer;
      this.ansLbls[this.currentScale].setText(String(answer));
      this.ansLbls[this.currentScale].setColor(COL_ACCENT);
      this.cameras.main.flash(150, 34, 197, 94); heroCheer(this, this.hero);
      this.currentScale++;
      if (this.currentScale >= 3) {
        // All 3 balanced!
        gameScore += 10 * (this.round + 1);
        this.scoreLbl.setText('Score: ' + gameScore);
        this.round++;
        if (this.round >= TOTAL_ROUNDS) {
          this.time.delayedCall(600, () => this.scene.start('VictoryScene', { score: gameScore }));
        } else {
          this.time.delayedCall(800, () => this.startRound());
        }
      } else {
        this._drawInput();
      }
    } else {
      this.lives--;
      this._redrawHearts();
      this.cameras.main.shake(200, 0.01); heroShake(this, this.hero);
      this.inputText = '';
      this.answerLbl.setText('_');
      if (this.lives <= 0) {
        this.time.delayedCall(500, () => this.scene.start('LoseScene', { score: gameScore }));
      }
    }
  }
}
`
