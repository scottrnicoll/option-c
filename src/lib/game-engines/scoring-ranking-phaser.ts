// Score & Rank — Phaser engine with 3 game options.
// Math: Order, compare, and rank numbers — counting and cardinality.
// Options: sorting-lane, number-line-drop, leaderboard-fix

import type { ThemeConfig, MathParams, GameOption } from "./engine-types"
import { phaserGame } from "./base-phaser-template"
import { getOptionDef } from "./game-option-registry"

export function scoringRankingPhaserEngine(
  config: ThemeConfig,
  math: MathParams,
  option: GameOption = "sorting-lane"
): string {
  const validOptions = ["sorting-lane", "number-line-drop", "leaderboard-fix"]
  const activeOption = validOptions.includes(option) ? option : "sorting-lane"

  const optDef = getOptionDef(activeOption)

  const sceneMap: Record<string, string> = {
    "sorting-lane": "SortingLaneScene",
    "number-line-drop": "NumberLineDropScene",
    "leaderboard-fix": "LeaderboardFixScene",
  }

  return phaserGame({
    config,
    math,
    option: activeOption,
    sceneName: sceneMap[activeOption],
    introText: optDef?.introText || "Sort the items!",
    helpText: optDef?.helpText || "Put items in order.",
    gameSceneCode: GAME_SCENES,
  })
}

const GAME_SCENES = `
// ─── Shared: Round Generation ────────────────────────────────────────────────
function generateSortRound(round) {
  if (AI_ROUNDS && AI_ROUNDS[round]) {
    const r = AI_ROUNDS[round];
    return { prompt: r.prompt || "Sort these!", values: r.items.slice(), hint: r.hint || null };
  }
  let count, maxVal;
  if (round < 2)      { count = 4; maxVal = 20; }
  else if (round < 4) { count = 5; maxVal = 50; }
  else                { count = 6; maxVal = 100; }
  const values = [];
  const used = new Set();
  while (values.length < count) {
    const v = Math.floor(Math.random() * maxVal) + 1;
    if (!used.has(v)) { used.add(v); values.push(v); }
  }
  return { prompt: "Sort from smallest to largest", values, hint: null };
}

function generateNumberLineRound(round) {
  let min, max, count;
  if (round < 2)      { min = 0; max = 20; count = 3; }
  else if (round < 4) { min = 0; max = 50; count = 4; }
  else                { min = -10; max = 30; count = 4; }
  const values = [];
  const used = new Set();
  while (values.length < count) {
    const v = Math.floor(Math.random() * (max - min)) + min;
    if (!used.has(v)) { used.add(v); values.push(v); }
  }
  return { min, max, values };
}

function generateLeaderboardRound(round) {
  let count;
  if (round < 2)      { count = 4; }
  else if (round < 4) { count = 5; }
  else                { count = 6; }
  const scores = [];
  for (let i = 0; i < count; i++) {
    scores.push(Math.floor(Math.random() * 90) + 10);
  }
  // Create a sorted version then swap 1-2 to make errors
  const sorted = [...scores].sort((a, b) => b - a);
  const errorCount = round < 2 ? 1 : 2;
  const errors = new Set();
  while (errors.size < errorCount && errors.size < count - 1) {
    const idx = Math.floor(Math.random() * (count - 1));
    errors.add(idx);
  }
  const display = [...sorted];
  for (const idx of errors) {
    [display[idx], display[idx + 1]] = [display[idx + 1], display[idx]];
  }
  return { display, correct: sorted, errorPositions: errors };
}

// ═══════════════════════════════════════════════════════════════════════════════
// OPTION A: Sorting Lane — drag items into ascending order
// ═══════════════════════════════════════════════════════════════════════════════
class SortingLaneScene extends Phaser.Scene {
  constructor() { super('SortingLaneScene'); }

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
    if (this.slotGroup) this.slotGroup.clear(true, true);
    this.slotGroup = this.add.group();
    const data = getRound(this.round);
    this.promptLbl.setText(data.prompt);
    this.correctOrder = [...data.items].sort((a, b) => a - b);
    this.userOrder = [];
    this.remaining = [...data.items];
    this._redrawDots();
    this._drawItems();
    this._drawSlots();
  }

  _drawItems() {
    if (this.itemGroup) this.itemGroup.clear(true, true);
    this.itemGroup = this.add.group();
    const W = this.W, y = this.H * 0.35;
    const gap = Math.min(80, (W * 0.8) / this.remaining.length);
    const startX = W / 2 - ((this.remaining.length - 1) * gap) / 2;
    this.remaining.forEach((val, i) => {
      const x = startX + i * gap;
      const bg = this.add.rectangle(x, y, 60, 44, hexToNum(COL_SECONDARY), 0.4)
        .setInteractive({ useHandCursor: true }).setDepth(7);
      const lbl = this.add.text(x, y, String(val), {
        fontSize: '20px', color: COL_TEXT, fontFamily: "'Space Grotesk', sans-serif", fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(8);
      bg.on('pointerdown', () => this._placeItem(val));
      this.itemGroup.add(bg);
      this.itemGroup.add(lbl);
    });
  }

  _drawSlots() {
    const W = this.W, y = this.H * 0.6;
    const total = this.correctOrder.length;
    const gap = Math.min(80, (W * 0.8) / total);
    const startX = W / 2 - ((total - 1) * gap) / 2;
    // Lane label
    this.slotGroup.add(
      this.add.text(W / 2, y - 35, 'smallest → largest', {
        fontSize: '12px', color: COL_TEXT, fontFamily: "'Lexend', system-ui", alpha: 0.5
      }).setOrigin(0.5).setDepth(6)
    );
    this.slotLbls = [];
    for (let i = 0; i < total; i++) {
      const x = startX + i * gap;
      this.slotGroup.add(
        this.add.rectangle(x, y, 60, 44, hexToNum(COL_PRIMARY), 0.15).setStrokeStyle(2, hexToNum(COL_PRIMARY), 0.4).setDepth(6)
      );
      const lbl = this.add.text(x, y, i < this.userOrder.length ? String(this.userOrder[i]) : '', {
        fontSize: '20px', color: COL_PRIMARY, fontFamily: "'Space Grotesk', sans-serif", fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(7);
      this.slotLbls.push(lbl);
      this.slotGroup.add(lbl);
      // Arrow
      if (i < total - 1) {
        this.slotGroup.add(
          this.add.text(x + gap / 2, y, '→', { fontSize: '14px', color: '#555' }).setOrigin(0.5).setDepth(6)
        );
      }
    }
  }

  _placeItem(val) {
    this.userOrder.push(val);
    this.remaining = this.remaining.filter((v, i) => {
      if (v === val) { return false; }
      return true;
    });
    // Update slot display
    if (this.slotLbls[this.userOrder.length - 1]) {
      this.slotLbls[this.userOrder.length - 1].setText(String(val));
    }
    this._drawItems();
    // Check if all placed
    if (this.userOrder.length === this.correctOrder.length) {
      this._checkOrder();
    }
  }

  _checkOrder() {
    const isCorrect = this.userOrder.every((v, i) => v === this.correctOrder[i]);
    if (isCorrect) {
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
      // Reset user order
      this.remaining = [...this.correctOrder];
      // Shuffle remaining
      for (let i = this.remaining.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this.remaining[i], this.remaining[j]] = [this.remaining[j], this.remaining[i]];
      }
      this.userOrder = [];
      this._drawItems();
      this._drawSlots();
      if (this.lives <= 0) {
        this.time.delayedCall(500, () => this.scene.start('LoseScene', { score: gameScore }));
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// OPTION B: Number Line Drop — drop numbers onto correct position
// ═══════════════════════════════════════════════════════════════════════════════
class NumberLineDropScene extends Phaser.Scene {
  constructor() { super('NumberLineDropScene'); }

  create() {
    this.W = this.scale.width;
    this.H = this.scale.height;
    this.round = 0;
    this.lives = MAX_LIVES;
    this.placedCount = 0;

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
    this.add.text(W / 2, pad, 'Drop each number on the number line', {
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
    if (this.lineGroup) this.lineGroup.clear(true, true);
    this.lineGroup = this.add.group();
    this.placedCount = 0;
    const data = getRound(this.round);
    this.nlMin = data.items.length >= 2 ? Math.min(...data.items) - 2 : 0;
    this.nlMax = data.items.length >= 2 ? Math.max(...data.items) + 2 : 20;
    this.nlValues = data.items;
    this.currentIdx = 0;
    this._redrawDots();
    this._drawNumberLine();
    this._showCurrentValue();
  }

  _drawNumberLine() {
    const W = this.W, H = this.H;
    const lineY = H * 0.55;
    const lineLeft = W * 0.1, lineRight = W * 0.9;
    // Main line
    this.lineGroup.add(
      this.add.rectangle((lineLeft + lineRight) / 2, lineY, lineRight - lineLeft, 3, hexToNum(COL_TEXT), 0.6).setDepth(5)
    );
    // Ticks and labels
    const range = this.nlMax - this.nlMin;
    const tickCount = Math.min(range + 1, 11);
    const step = range / (tickCount - 1);
    for (let i = 0; i < tickCount; i++) {
      const val = Math.round(this.nlMin + i * step);
      const x = lineLeft + (i / (tickCount - 1)) * (lineRight - lineLeft);
      this.lineGroup.add(
        this.add.rectangle(x, lineY, 2, 12, hexToNum(COL_TEXT), 0.4).setDepth(5)
      );
      this.lineGroup.add(
        this.add.text(x, lineY + 14, String(val), {
          fontSize: '11px', color: COL_TEXT, fontFamily: "'Lexend', system-ui", alpha: 0.6
        }).setOrigin(0.5, 0).setDepth(5)
      );
    }
    // Drop zones — make the whole line clickable
    const dropZone = this.add.rectangle((lineLeft + lineRight) / 2, lineY, lineRight - lineLeft, 50, 0x000000, 0)
      .setInteractive({ useHandCursor: true }).setDepth(8);
    dropZone.on('pointerdown', (pointer) => {
      const clickX = pointer.x;
      const frac = (clickX - lineLeft) / (lineRight - lineLeft);
      const clickedValue = Math.round(this.nlMin + frac * (this.nlMax - this.nlMin));
      this._checkDrop(clickedValue, clickX, lineY);
    });
    this.lineGroup.add(dropZone);
    this.lineLeft = lineLeft;
    this.lineRight = lineRight;
    this.lineY = lineY;
  }

  _showCurrentValue() {
    if (this.valueLbl) this.valueLbl.destroy();
    if (this.currentIdx >= this.nlValues.length) return;
    this.valueLbl = this.add.text(this.W / 2, this.H * 0.3, String(this.nlValues[this.currentIdx]), {
      fontSize: '42px', color: COL_PRIMARY, fontFamily: "'Space Grotesk', sans-serif", fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(10);
  }

  _checkDrop(clickedValue, clickX, lineY) {
    const target = this.nlValues[this.currentIdx];
    const tolerance = Math.max(1, Math.ceil((this.nlMax - this.nlMin) * 0.08));
    if (Math.abs(clickedValue - target) <= tolerance) {
      // Correct placement
      this.lineGroup.add(
        this.add.circle(clickX, lineY, 8, hexToNum(COL_ACCENT)).setDepth(9)
      );
      this.lineGroup.add(
        this.add.text(clickX, lineY - 18, String(target), {
          fontSize: '13px', color: COL_ACCENT, fontFamily: "'Space Grotesk', sans-serif", fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(9)
      );
      this.currentIdx++;
      this.placedCount++;
      if (this.currentIdx >= this.nlValues.length) {
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
        this._showCurrentValue();
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
// OPTION C: Leaderboard Fix — find and fix errors in a scoreboard
// ═══════════════════════════════════════════════════════════════════════════════
class LeaderboardFixScene extends Phaser.Scene {
  constructor() { super('LeaderboardFixScene'); }

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
    this.add.text(W / 2, pad, 'Find the scores in the wrong position!', {
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
    if (this.boardGroup) this.boardGroup.clear(true, true);
    this.boardGroup = this.add.group();
    const data = getRound(this.round);
    // Build leaderboard data from getRound: items are the display order, target is the count of errors
    const display = data.items.slice();
    const correct = [...display].sort((a, b) => b - a);
    const errorPositions = new Set();
    for (let i = 0; i < display.length; i++) { if (display[i] !== correct[i]) errorPositions.add(i); }
    this.boardData = { display, correct, errorPositions };
    this.foundErrors = new Set();
    this.totalErrors = errorPositions.size;
    this._redrawDots();
    this._drawBoard();
  }

  _drawBoard() {
    const W = this.W, H = this.H;
    const startY = H * 0.2;
    const rowH = 44;
    // Header
    this.boardGroup.add(
      this.add.text(W / 2, startY - 20, 'LEADERBOARD (highest first)', {
        fontSize: '13px', color: COL_ACCENT, fontFamily: "'Space Grotesk', sans-serif", fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(6)
    );
    this.boardData.display.forEach((score, i) => {
      const y = startY + i * rowH + 20;
      const isError = this.boardData.errorPositions.has(i) || this.boardData.errorPositions.has(i - 1);
      const isFound = this.foundErrors.has(i);
      const bgCol = isFound ? hexToNum(COL_ACCENT) : hexToNum(COL_SECONDARY);
      const row = this.add.rectangle(W / 2, y, W * 0.6, rowH - 4, bgCol, isFound ? 0.3 : 0.15)
        .setStrokeStyle(2, bgCol, 0.3).setDepth(6);
      if (!isFound) {
        row.setInteractive({ useHandCursor: true });
        row.on('pointerdown', () => this._clickRow(i));
      }
      this.boardGroup.add(row);
      // Rank
      this.boardGroup.add(
        this.add.text(W * 0.25, y, '#' + (i + 1), {
          fontSize: '14px', color: isFound ? COL_ACCENT : COL_TEXT, fontFamily: "'Lexend', system-ui"
        }).setOrigin(0, 0.5).setDepth(7)
      );
      // Score
      this.boardGroup.add(
        this.add.text(W * 0.65, y, String(score), {
          fontSize: '18px', color: isFound ? COL_ACCENT : COL_TEXT,
          fontFamily: "'Space Grotesk', sans-serif", fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(7)
      );
    });
  }

  _clickRow(idx) {
    // Check if this row is part of an error pair
    const isWrong = this.boardData.errorPositions.has(idx) ||
      (idx > 0 && this.boardData.errorPositions.has(idx - 1) && !this.foundErrors.has(idx - 1));
    // More precisely: check if display[idx] != correct[idx]
    const isOutOfPlace = this.boardData.display[idx] !== this.boardData.correct[idx];
    if (isOutOfPlace) {
      this.foundErrors.add(idx);
      this.cameras.main.flash(100, 34, 197, 94); heroCheer(this, this.hero);
      // Redraw
      this._drawBoard();
      // Check if all errors found
      const allFixed = this.boardData.display.every((v, i) =>
        v === this.boardData.correct[i] || this.foundErrors.has(i)
      );
      if (allFixed) {
        gameScore += 10 * (this.round + 1);
        this.scoreLbl.setText('Score: ' + gameScore);
        this.round++;
        if (this.round >= TOTAL_ROUNDS) {
          this.time.delayedCall(600, () => this.scene.start('VictoryScene', { score: gameScore }));
        } else {
          this.time.delayedCall(800, () => this.startRound());
        }
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
`
