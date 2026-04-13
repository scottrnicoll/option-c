// Measure & Compare — Phaser engine with 3 game options.
// Math: Measurement, units, length, weight, capacity, conversion.
// Options: size-picker, ruler-race, unit-converter

import type { ThemeConfig, MathParams, GameOption } from "./engine-types"
import { phaserGame } from "./base-phaser-template"
import { getOptionDef } from "./game-option-registry"

export function measurementChallengesPhaserEngine(
  config: ThemeConfig,
  math: MathParams,
  option: GameOption = "size-picker"
): string {
  const validOptions = ["size-picker", "ruler-race", "unit-converter"]
  const activeOption = validOptions.includes(option) ? option : "size-picker"

  const optDef = getOptionDef(activeOption)

  const sceneMap: Record<string, string> = {
    "size-picker": "SizePickerScene",
    "ruler-race": "RulerRaceScene",
    "unit-converter": "UnitConverterScene",
  }

  return phaserGame({
    config,
    math,
    option: activeOption,
    sceneName: sceneMap[activeOption],
    introText: optDef?.introText || "Compare the sizes!",
    helpText: optDef?.helpText || "Pick the bigger or smaller item.",
    gameSceneCode: GAME_SCENES,
  })
}

const GAME_SCENES = `
function generateSizeRound(round) {
  if (AI_ROUNDS && AI_ROUNDS[round]) {
    const r = AI_ROUNDS[round];
    return { prompt: r.prompt, valueA: r.items[0], valueB: r.items[1], unit: 'cm', bigger: r.items[0] > r.items[1] ? 'A' : 'B', hint: r.hint };
  }
  const units = ['cm', 'kg', 'L'];
  const unit = units[Math.floor(Math.random() * units.length)];
  let maxVal = round < 2 ? 20 : round < 4 ? 50 : 100;
  let a = Math.floor(Math.random() * maxVal) + 1;
  let b = Math.floor(Math.random() * maxVal) + 1;
  while (a === b) b = Math.floor(Math.random() * maxVal) + 1;
  const askBigger = Math.random() > 0.3;
  return { prompt: askBigger ? 'Which is bigger?' : 'Which is smaller?', valueA: a, valueB: b, unit, askBigger, bigger: a > b ? 'A' : 'B' };
}

function generateRulerRound(round) {
  let maxVal = round < 2 ? 10 : round < 4 ? 15 : 20;
  const length = Math.floor(Math.random() * maxVal) + 2;
  const unit = round < 3 ? 'cm' : 'mm';
  return { length, unit };
}

function generateConvertRound(round) {
  const conversions = round < 2
    ? [{ from: 'cm', to: 'm', factor: 100 }, { from: 'mm', to: 'cm', factor: 10 }]
    : round < 4
      ? [{ from: 'cm', to: 'm', factor: 100 }, { from: 'g', to: 'kg', factor: 1000 }, { from: 'mL', to: 'L', factor: 1000 }]
      : [{ from: 'm', to: 'km', factor: 1000 }, { from: 'g', to: 'kg', factor: 1000 }, { from: 'cm', to: 'm', factor: 100 }];
  const conv = conversions[Math.floor(Math.random() * conversions.length)];
  const value = (Math.floor(Math.random() * 9) + 1) * conv.factor;
  return { value, fromUnit: conv.from, toUnit: conv.to, factor: conv.factor, answer: value / conv.factor };
}

// ═══════════════════════════════════════════════════════════════════════════════
// OPTION A: Size Picker — compare two items, pick bigger/smaller
// ═══════════════════════════════════════════════════════════════════════════════
class SizePickerScene extends Phaser.Scene {
  constructor() { super('SizePickerScene'); }

  create() {
    this.W = this.scale.width; this.H = this.scale.height;
    this.round = 0; this.lives = MAX_LIVES;
    this._buildBackground(); this._buildUI(); this.hero = addCharacter(this, this.W * 0.85, this.H * 0.35, 0.4); this.startRound();
  }

  _buildBackground() {
    const bg = this.add.image(this.W / 2, this.H / 2, 'bg');
    bg.setScale(Math.max(this.W / bg.width, this.H / bg.height));
    this.add.rectangle(this.W / 2, this.H / 2, this.W, this.H, 0x000000, 0.65);
  }

  _buildUI() {
    const W = this.W, pad = 14;
    this.scoreLbl = this.add.text(W - pad, pad, 'Score: 0', { fontSize: '16px', color: COL_ACCENT, fontFamily: "'Lexend', system-ui", fontStyle: 'bold' }).setOrigin(1, 0).setDepth(10);
    this.heartsGroup = this.add.group(); this._redrawHearts();
    this.dotGroup = this.add.group(); this._redrawDots();
    this.promptLbl = this.add.text(W / 2, pad + 5, '', { fontSize: '16px', color: COL_ACCENT, fontFamily: "'Space Grotesk', sans-serif", fontStyle: 'bold' }).setOrigin(0.5, 0).setDepth(10);
  }

  _redrawHearts() { this.heartsGroup.clear(true, true); for (let i = 0; i < this.lives; i++) { this.heartsGroup.add(this.add.text(14 + i * 22, 14, '♥', { fontSize: '18px', color: COL_DANGER }).setDepth(10)); } }
  _redrawDots() { this.dotGroup.clear(true, true); for (let i = 0; i < TOTAL_ROUNDS; i++) { const col = i < this.round ? COL_ACCENT : (i === this.round ? COL_PRIMARY : '#555555'); this.dotGroup.add(this.add.circle(this.W / 2 - 40 + i * 20, this.H - 16, 5, hexToNum(col)).setDepth(10)); } }

  startRound() {
    if (this.roundGroup) this.roundGroup.clear(true, true);
    this.roundGroup = this.add.group();
    const data = getRound(this.round);
    data.valueA = data.items[0] || 10;
    data.valueB = data.items[1] || 5;
    data.unit = 'cm';
    data.bigger = data.valueA > data.valueB ? 'A' : 'B';
    this.correctAnswer = data.bigger;
    this.promptLbl.setText(data.prompt);
    this._redrawDots();
    const W = this.W, H = this.H;
    // Item A
    const cardA = this.add.rectangle(W * 0.28, H * 0.45, W * 0.35, H * 0.3, hexToNum(COL_SECONDARY), 0.15)
      .setStrokeStyle(2, hexToNum(COL_PRIMARY), 0.4).setInteractive({ useHandCursor: true }).setDepth(5);
    this.roundGroup.add(cardA);
    this.roundGroup.add(this.add.image(W * 0.28, H * 0.38, 'item').setScale(0.7).setDepth(6));
    this.roundGroup.add(this.add.text(W * 0.28, H * 0.55, data.valueA + ' ' + data.unit, {
      fontSize: '22px', color: COL_TEXT, fontFamily: "'Space Grotesk', sans-serif", fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(6));
    cardA.on('pointerdown', () => this._pick('A'));
    // Item B
    const cardB = this.add.rectangle(W * 0.72, H * 0.45, W * 0.35, H * 0.3, hexToNum(COL_SECONDARY), 0.15)
      .setStrokeStyle(2, hexToNum(COL_PRIMARY), 0.4).setInteractive({ useHandCursor: true }).setDepth(5);
    this.roundGroup.add(cardB);
    this.roundGroup.add(this.add.image(W * 0.72, H * 0.38, 'item').setScale(0.7).setDepth(6));
    this.roundGroup.add(this.add.text(W * 0.72, H * 0.55, data.valueB + ' ' + data.unit, {
      fontSize: '22px', color: COL_TEXT, fontFamily: "'Space Grotesk', sans-serif", fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(6));
    cardB.on('pointerdown', () => this._pick('B'));
    this.roundGroup.add(this.add.text(W / 2, H * 0.45, 'VS', { fontSize: '20px', color: '#555', fontFamily: "'Space Grotesk', sans-serif", fontStyle: 'bold' }).setOrigin(0.5).setDepth(7));
  }

  _pick(choice) {
    if (choice === this.correctAnswer) {
      gameScore += 10 * (this.round + 1); this.scoreLbl.setText('Score: ' + gameScore);
      this.cameras.main.flash(200, 34, 197, 94); heroCheer(this, this.hero);
      this.round++;
      if (this.round >= TOTAL_ROUNDS) { this.time.delayedCall(600, () => this.scene.start('VictoryScene', { score: gameScore })); }
      else { this.time.delayedCall(600, () => this.startRound()); }
    } else {
      this.lives--; this._redrawHearts(); this.cameras.main.shake(200, 0.01); heroShake(this, this.hero);
      if (this.lives <= 0) { this.time.delayedCall(500, () => this.scene.start('LoseScene', { score: gameScore })); }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// OPTION B: Ruler Race — measure objects and type the length
// ═══════════════════════════════════════════════════════════════════════════════
class RulerRaceScene extends Phaser.Scene {
  constructor() { super('RulerRaceScene'); }

  create() {
    this.W = this.scale.width; this.H = this.scale.height;
    this.round = 0; this.lives = MAX_LIVES;
    this._buildBackground(); this._buildUI(); this.hero = addCharacter(this, this.W * 0.85, this.H * 0.35, 0.4); this.startRound();
  }

  _buildBackground() { const bg = this.add.image(this.W / 2, this.H / 2, 'bg'); bg.setScale(Math.max(this.W / bg.width, this.H / bg.height)); this.add.rectangle(this.W / 2, this.H / 2, this.W, this.H, 0x000000, 0.65); }
  _buildUI() { const W = this.W, pad = 14; this.scoreLbl = this.add.text(W - pad, pad, 'Score: 0', { fontSize: '16px', color: COL_ACCENT, fontFamily: "'Lexend', system-ui", fontStyle: 'bold' }).setOrigin(1, 0).setDepth(10); this.heartsGroup = this.add.group(); this._redrawHearts(); this.dotGroup = this.add.group(); this._redrawDots(); }
  _redrawHearts() { this.heartsGroup.clear(true, true); for (let i = 0; i < this.lives; i++) { this.heartsGroup.add(this.add.text(14 + i * 22, 14, '♥', { fontSize: '18px', color: COL_DANGER }).setDepth(10)); } }
  _redrawDots() { this.dotGroup.clear(true, true); for (let i = 0; i < TOTAL_ROUNDS; i++) { const col = i < this.round ? COL_ACCENT : (i === this.round ? COL_PRIMARY : '#555555'); this.dotGroup.add(this.add.circle(this.W / 2 - 40 + i * 20, this.H - 16, 5, hexToNum(col)).setDepth(10)); } }

  startRound() {
    if (this.roundGroup) this.roundGroup.clear(true, true);
    this.roundGroup = this.add.group();
    const data = getRound(this.round);
    this.correctLength = data.target;
    data.length = data.target;
    data.unit = this.round < 3 ? 'cm' : 'mm';
    this._redrawDots();
    const W = this.W, H = this.H;
    // Object to measure
    const objW = data.length * 20;
    this.roundGroup.add(this.add.rectangle(W * 0.15, H * 0.3, objW, 30, hexToNum(COL_PRIMARY), 0.5).setOrigin(0, 0.5).setDepth(5));
    this.roundGroup.add(this.add.text(W * 0.15 + objW / 2, H * 0.3 - 25, 'Measure me!', { fontSize: '12px', color: COL_TEXT, fontFamily: "'Lexend', system-ui", alpha: 0.6 }).setOrigin(0.5).setDepth(6));
    // Ruler
    const rulerY = H * 0.42;
    const rulerLeft = W * 0.15;
    const tickSpacing = 20;
    this.roundGroup.add(this.add.rectangle(rulerLeft + 100, rulerY, 220, 3, hexToNum(COL_TEXT), 0.4).setDepth(5));
    for (let i = 0; i <= 12; i++) {
      const x = rulerLeft + i * tickSpacing;
      const h = i % 5 === 0 ? 14 : 8;
      this.roundGroup.add(this.add.rectangle(x, rulerY, 1, h, hexToNum(COL_TEXT), 0.6).setDepth(5));
      if (i % 5 === 0 || i <= 10) {
        this.roundGroup.add(this.add.text(x, rulerY + 12, String(i), { fontSize: '10px', color: COL_TEXT, fontFamily: "'Lexend', system-ui", alpha: 0.5 }).setOrigin(0.5, 0).setDepth(5));
      }
    }
    this.roundGroup.add(this.add.text(rulerLeft + 130, rulerY + 25, data.unit, { fontSize: '11px', color: COL_TEXT, fontFamily: "'Lexend', system-ui", alpha: 0.4 }).setOrigin(0.5).setDepth(5));
    // Input
    this.inputText = '';
    this.inputLbl = this.add.text(W / 2, H * 0.58, '_ ' + data.unit, { fontSize: '28px', color: COL_PRIMARY, fontFamily: "'Space Grotesk', sans-serif", fontStyle: 'bold' }).setOrigin(0.5).setDepth(10);
    this.roundGroup.add(this.inputLbl);
    for (let i = 0; i <= 9; i++) {
      const col = i < 5 ? i : i - 5; const row = i < 5 ? 0 : 1;
      const x = W / 2 - 100 + col * 50; const y = H * 0.68 + row * 44;
      const btn = this.add.rectangle(x, y, 40, 36, hexToNum(COL_SECONDARY), 0.4).setInteractive({ useHandCursor: true }).setDepth(10);
      this.add.text(x, y, String(i), { fontSize: '18px', color: COL_TEXT, fontFamily: "'Space Grotesk', sans-serif", fontStyle: 'bold' }).setOrigin(0.5).setDepth(11);
      btn.on('pointerdown', () => { if (this.inputText.length < 3) { this.inputText += String(i); this.inputLbl.setText(this.inputText + ' ' + data.unit); } });
      this.roundGroup.add(btn);
    }
    const sub = this.add.rectangle(W / 2, H * 0.68 + 100, 120, 38, hexToNum(COL_PRIMARY), 1).setInteractive({ useHandCursor: true }).setDepth(10);
    this.add.text(W / 2, H * 0.68 + 100, 'Measure!', { fontSize: '14px', color: '#fff', fontFamily: "'Lexend', system-ui", fontStyle: 'bold' }).setOrigin(0.5).setDepth(11);
    sub.on('pointerdown', () => this._check());
    this.roundGroup.add(sub);
  }

  _check() {
    if (parseInt(this.inputText) === this.correctLength) {
      gameScore += 10 * (this.round + 1); this.scoreLbl.setText('Score: ' + gameScore);
      this.cameras.main.flash(200, 34, 197, 94); heroCheer(this, this.hero); this.round++;
      if (this.round >= TOTAL_ROUNDS) { this.time.delayedCall(600, () => this.scene.start('VictoryScene', { score: gameScore })); }
      else { this.time.delayedCall(800, () => this.startRound()); }
    } else {
      this.lives--; this._redrawHearts(); this.cameras.main.shake(200, 0.01); heroShake(this, this.hero); this.inputText = ''; this.inputLbl.setText('_');
      if (this.lives <= 0) { this.time.delayedCall(500, () => this.scene.start('LoseScene', { score: gameScore })); }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// OPTION C: Unit Converter — convert units to compare
// ═══════════════════════════════════════════════════════════════════════════════
class UnitConverterScene extends Phaser.Scene {
  constructor() { super('UnitConverterScene'); }

  create() {
    this.W = this.scale.width; this.H = this.scale.height;
    this.round = 0; this.lives = MAX_LIVES;
    this._buildBackground(); this._buildUI(); this.hero = addCharacter(this, this.W * 0.85, this.H * 0.35, 0.4); this.startRound();
  }

  _buildBackground() { const bg = this.add.image(this.W / 2, this.H / 2, 'bg'); bg.setScale(Math.max(this.W / bg.width, this.H / bg.height)); this.add.rectangle(this.W / 2, this.H / 2, this.W, this.H, 0x000000, 0.65); }
  _buildUI() { const W = this.W, pad = 14; this.scoreLbl = this.add.text(W - pad, pad, 'Score: 0', { fontSize: '16px', color: COL_ACCENT, fontFamily: "'Lexend', system-ui", fontStyle: 'bold' }).setOrigin(1, 0).setDepth(10); this.heartsGroup = this.add.group(); this._redrawHearts(); this.dotGroup = this.add.group(); this._redrawDots(); }
  _redrawHearts() { this.heartsGroup.clear(true, true); for (let i = 0; i < this.lives; i++) { this.heartsGroup.add(this.add.text(14 + i * 22, 14, '♥', { fontSize: '18px', color: COL_DANGER }).setDepth(10)); } }
  _redrawDots() { this.dotGroup.clear(true, true); for (let i = 0; i < TOTAL_ROUNDS; i++) { const col = i < this.round ? COL_ACCENT : (i === this.round ? COL_PRIMARY : '#555555'); this.dotGroup.add(this.add.circle(this.W / 2 - 40 + i * 20, this.H - 16, 5, hexToNum(col)).setDepth(10)); } }

  startRound() {
    if (this.roundGroup) this.roundGroup.clear(true, true);
    this.roundGroup = this.add.group();
    const data = getRound(this.round);
    this.correctAnswer = data.target;
    data.value = data.items[0] || 100;
    data.fromUnit = data.items[1] || 'cm';
    data.toUnit = data.items[2] || 'm';
    data.factor = data.items[3] || 100;
    data.answer = data.target;
    this._redrawDots();
    const W = this.W, H = this.H;
    // Conversion display
    this.roundGroup.add(this.add.text(W / 2, H * 0.2, 'Convert:', { fontSize: '14px', color: COL_TEXT, fontFamily: "'Lexend', system-ui" }).setOrigin(0.5).setDepth(6));
    this.roundGroup.add(this.add.text(W / 2, H * 0.3, data.value + ' ' + data.fromUnit, {
      fontSize: '36px', color: COL_ACCENT, fontFamily: "'Space Grotesk', sans-serif", fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(6));
    this.roundGroup.add(this.add.text(W / 2, H * 0.4, '= ? ' + data.toUnit, {
      fontSize: '24px', color: COL_PRIMARY, fontFamily: "'Space Grotesk', sans-serif", fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(6));
    // Reference card
    this.roundGroup.add(this.add.text(W / 2, H * 0.5, '1 ' + data.toUnit + ' = ' + data.factor + ' ' + data.fromUnit, {
      fontSize: '13px', color: COL_TEXT, fontFamily: "'Lexend', system-ui", alpha: 0.5
    }).setOrigin(0.5).setDepth(6));
    // Input
    this.inputText = '';
    this.inputLbl = this.add.text(W / 2, H * 0.6, '_ ' + data.toUnit, { fontSize: '28px', color: COL_PRIMARY, fontFamily: "'Space Grotesk', sans-serif", fontStyle: 'bold' }).setOrigin(0.5).setDepth(10);
    this.roundGroup.add(this.inputLbl);
    for (let i = 0; i <= 9; i++) {
      const col = i < 5 ? i : i - 5; const row = i < 5 ? 0 : 1;
      const x = W / 2 - 100 + col * 50; const y = H * 0.72 + row * 44;
      const btn = this.add.rectangle(x, y, 40, 36, hexToNum(COL_SECONDARY), 0.4).setInteractive({ useHandCursor: true }).setDepth(10);
      this.add.text(x, y, String(i), { fontSize: '18px', color: COL_TEXT, fontFamily: "'Space Grotesk', sans-serif", fontStyle: 'bold' }).setOrigin(0.5).setDepth(11);
      btn.on('pointerdown', () => { if (this.inputText.length < 5) { this.inputText += String(i); this.inputLbl.setText(this.inputText + ' ' + data.toUnit); } });
      this.roundGroup.add(btn);
    }
    const sub = this.add.rectangle(W / 2, H * 0.72 + 100, 120, 38, hexToNum(COL_PRIMARY), 1).setInteractive({ useHandCursor: true }).setDepth(10);
    this.add.text(W / 2, H * 0.72 + 100, 'Convert!', { fontSize: '14px', color: '#fff', fontFamily: "'Lexend', system-ui", fontStyle: 'bold' }).setOrigin(0.5).setDepth(11);
    sub.on('pointerdown', () => this._check());
    this.roundGroup.add(sub);
  }

  _check() {
    if (parseInt(this.inputText) === this.correctAnswer) {
      gameScore += 10 * (this.round + 1); this.scoreLbl.setText('Score: ' + gameScore);
      this.cameras.main.flash(200, 34, 197, 94); heroCheer(this, this.hero); this.round++;
      if (this.round >= TOTAL_ROUNDS) { this.time.delayedCall(600, () => this.scene.start('VictoryScene', { score: gameScore })); }
      else { this.time.delayedCall(800, () => this.startRound()); }
    } else {
      this.lives--; this._redrawHearts(); this.cameras.main.shake(200, 0.01); heroShake(this, this.hero); this.inputText = ''; this.inputLbl.setText('_');
      if (this.lives <= 0) { this.time.delayedCall(500, () => this.scene.start('LoseScene', { score: gameScore })); }
    }
  }
}
`
