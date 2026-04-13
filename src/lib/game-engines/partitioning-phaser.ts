// Split & Share — Phaser engine with 3 game options.
// Math: Fractions — partition, equivalent fractions, fair sharing.
// Options: cut-the-bar, pour-the-liquid, share-the-pizza

import type { ThemeConfig, MathParams, GameOption } from "./engine-types"
import { phaserGame } from "./base-phaser-template"
import { getOptionDef } from "./game-option-registry"

export function partitioningPhaserEngine(
  config: ThemeConfig,
  math: MathParams,
  option: GameOption = "cut-the-bar"
): string {
  const validOptions = ["cut-the-bar", "pour-the-liquid", "share-the-pizza"]
  const activeOption = validOptions.includes(option) ? option : "cut-the-bar"

  const optDef = getOptionDef(activeOption)

  const sceneMap: Record<string, string> = {
    "cut-the-bar": "CutTheBarScene",
    "pour-the-liquid": "PourTheLiquidScene",
    "share-the-pizza": "ShareThePizzaScene",
  }

  return phaserGame({
    config,
    math,
    option: activeOption,
    sceneName: sceneMap[activeOption],
    introText: optDef?.introText || "Split it up!",
    helpText: optDef?.helpText || "Divide things into equal parts.",
    gameSceneCode: GAME_SCENES,
  })
}

const GAME_SCENES = `
// ─── Shared ──────────────────────────────────────────────────────────────────
function generateFractionRound(round) {
  if (AI_ROUNDS && AI_ROUNDS[round]) {
    const r = AI_ROUNDS[round];
    return { prompt: r.prompt, numerator: r.target, denominator: r.items[0] || 4, hint: r.hint };
  }
  const denoms = round < 2 ? [2, 3, 4] : round < 4 ? [3, 4, 5, 6] : [4, 5, 6, 8];
  const denom = denoms[Math.floor(Math.random() * denoms.length)];
  const numer = Math.floor(Math.random() * (denom - 1)) + 1;
  return { prompt: 'Show ' + numer + '/' + denom, numerator: numer, denominator: denom, hint: null };
}

function generatePourRound(round) {
  const denoms = round < 2 ? [2, 4] : round < 4 ? [3, 4, 5] : [4, 5, 6, 8];
  const denom = denoms[Math.floor(Math.random() * denoms.length)];
  const numer = Math.floor(Math.random() * (denom - 1)) + 1;
  return { numerator: numer, denominator: denom };
}

function generatePizzaRound(round) {
  const people = round < 2 ? 2 : round < 4 ? 3 : 4;
  const totalSlices = people * (Math.floor(Math.random() * 2) + 2);
  const perPerson = totalSlices / people;
  return { totalSlices, people, perPerson };
}

// ═══════════════════════════════════════════════════════════════════════════════
// OPTION A: Cut the Bar — cut a bar into equal parts and shade the fraction
// ═══════════════════════════════════════════════════════════════════════════════
class CutTheBarScene extends Phaser.Scene {
  constructor() { super('CutTheBarScene'); }

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
      fontSize: '16px', color: COL_ACCENT, fontFamily: "'Space Grotesk', sans-serif", fontStyle: 'bold',
      align: 'center'
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
    if (this.barGroup) this.barGroup.clear(true, true);
    this.barGroup = this.add.group();
    const data = getRound(this.round);
    this.targetNumer = data.target;
    this.targetDenom = data.items[0] || 4;
    this.shadedCount = 0;
    this.promptLbl.setText(data.prompt);
    this._redrawDots();
    this._drawBar();
  }

  _drawBar() {
    const W = this.W, H = this.H;
    const barW = W * 0.7, barH = 60;
    const barX = (W - barW) / 2, barY = H * 0.4;
    const partW = barW / this.targetDenom;
    this.parts = [];
    for (let i = 0; i < this.targetDenom; i++) {
      const x = barX + i * partW;
      const rect = this.add.rectangle(x + partW / 2, barY + barH / 2, partW - 2, barH - 2, hexToNum(COL_SECONDARY), 0.2)
        .setStrokeStyle(2, hexToNum(COL_TEXT), 0.4)
        .setInteractive({ useHandCursor: true }).setDepth(6);
      let shaded = false;
      rect.on('pointerdown', () => {
        if (!shaded) {
          shaded = true;
          rect.setFillStyle(hexToNum(COL_PRIMARY), 0.7);
          this.shadedCount++;
        } else {
          shaded = false;
          rect.setFillStyle(hexToNum(COL_SECONDARY), 0.2);
          this.shadedCount--;
        }
        this.fractionLbl.setText(this.shadedCount + '/' + this.targetDenom);
      });
      this.parts.push(rect);
      this.barGroup.add(rect);
    }
    // Current fraction label
    this.fractionLbl = this.add.text(W / 2, barY + barH + 20, '0/' + this.targetDenom, {
      fontSize: '22px', color: COL_PRIMARY, fontFamily: "'Space Grotesk', sans-serif", fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(6);
    this.barGroup.add(this.fractionLbl);
    // Check button
    const btn = this.add.rectangle(W / 2, H * 0.75, 140, 42, hexToNum(COL_PRIMARY), 1)
      .setInteractive({ useHandCursor: true }).setDepth(10);
    this.add.text(W / 2, H * 0.75, 'Check', {
      fontSize: '15px', color: '#fff', fontFamily: "'Lexend', system-ui", fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(11);
    btn.on('pointerdown', () => this._check());
    this.barGroup.add(btn);
  }

  _check() {
    if (this.shadedCount === this.targetNumer) {
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
// OPTION B: Pour the Liquid — drag slider to pour the right fraction
// ═══════════════════════════════════════════════════════════════════════════════
class PourTheLiquidScene extends Phaser.Scene {
  constructor() { super('PourTheLiquidScene'); }

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
    if (this.pourGroup) this.pourGroup.clear(true, true);
    this.pourGroup = this.add.group();
    const data = getRound(this.round);
    this.targetNumer = data.target;
    this.targetDenom = data.items[0] || 4;
    this.targetFrac = this.targetNumer / this.targetDenom;
    this.currentFrac = 0;
    this._redrawDots();
    this._drawGlass();
  }

  _drawGlass() {
    const W = this.W, H = this.H;
    const glassX = W / 2, glassY = H * 0.35, glassW = 80, glassH = 200;
    // Glass outline
    this.pourGroup.add(this.add.rectangle(glassX, glassY, glassW, glassH, 0x000000, 0).setStrokeStyle(3, hexToNum(COL_TEXT), 0.5).setDepth(5));
    // Target line
    const targetY = glassY + glassH / 2 - (this.targetFrac * glassH);
    this.pourGroup.add(this.add.rectangle(glassX, targetY, glassW + 20, 2, hexToNum(COL_DANGER), 0.8).setDepth(6));
    this.pourGroup.add(this.add.text(glassX + glassW / 2 + 15, targetY, this.targetNumer + '/' + this.targetDenom, {
      fontSize: '14px', color: COL_DANGER, fontFamily: "'Space Grotesk', sans-serif", fontStyle: 'bold'
    }).setOrigin(0, 0.5).setDepth(6));
    // Liquid fill (dynamic)
    this.liquidRect = this.add.rectangle(glassX, glassY + glassH / 2, glassW - 4, 0, hexToNum(COL_PRIMARY), 0.5).setOrigin(0.5, 1).setDepth(4);
    this.pourGroup.add(this.liquidRect);
    // Fraction label
    this.fracLbl = this.add.text(glassX, glassY + glassH / 2 + 30, '0/' + this.targetDenom, {
      fontSize: '20px', color: COL_PRIMARY, fontFamily: "'Space Grotesk', sans-serif", fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(6);
    this.pourGroup.add(this.fracLbl);
    // Slider
    const sliderY = H * 0.75;
    const sliderW = W * 0.6;
    const sliderLeft = (W - sliderW) / 2;
    this.pourGroup.add(this.add.rectangle(W / 2, sliderY, sliderW, 4, hexToNum(COL_SECONDARY), 0.5).setDepth(6));
    // Tick marks for each fraction step
    for (let i = 0; i <= this.targetDenom; i++) {
      const x = sliderLeft + (i / this.targetDenom) * sliderW;
      this.pourGroup.add(this.add.rectangle(x, sliderY, 2, 10, hexToNum(COL_TEXT), 0.3).setDepth(6));
    }
    // Draggable handle
    const handle = this.add.circle(sliderLeft, sliderY, 14, hexToNum(COL_ACCENT))
      .setInteractive({ draggable: true, useHandCursor: true }).setDepth(8);
    handle.on('drag', (pointer, dragX) => {
      const x = Math.max(sliderLeft, Math.min(sliderLeft + sliderW, dragX));
      handle.x = x;
      const frac = (x - sliderLeft) / sliderW;
      // Snap to nearest fraction step
      const steps = Math.round(frac * this.targetDenom);
      this.currentFrac = steps / this.targetDenom;
      const snappedX = sliderLeft + (steps / this.targetDenom) * sliderW;
      handle.x = snappedX;
      // Update liquid
      this.liquidRect.height = this.currentFrac * (glassH - 4);
      this.fracLbl.setText(steps + '/' + this.targetDenom);
    });
    this.pourGroup.add(handle);
    // Pour button
    const btn = this.add.rectangle(W / 2, H * 0.88, 140, 42, hexToNum(COL_PRIMARY), 1)
      .setInteractive({ useHandCursor: true }).setDepth(10);
    this.add.text(W / 2, H * 0.88, 'Pour!', {
      fontSize: '15px', color: '#fff', fontFamily: "'Lexend', system-ui", fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(11);
    btn.on('pointerdown', () => this._checkPour());
    this.pourGroup.add(btn);
  }

  _checkPour() {
    if (Math.abs(this.currentFrac - this.targetFrac) < 0.01) {
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
// OPTION C: Share the Pizza — give each plate equal pieces
// ═══════════════════════════════════════════════════════════════════════════════
class ShareThePizzaScene extends Phaser.Scene {
  constructor() { super('ShareThePizzaScene'); }

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
    if (this.pizzaGroup) this.pizzaGroup.clear(true, true);
    this.pizzaGroup = this.add.group();
    const data = getRound(this.round);
    this.totalSlices = data.target;
    this.numPeople = data.items[0] || 2;
    this.perPerson = Math.floor(data.target / (data.items[0] || 2));
    this.plateCounts = new Array(this.numPeople).fill(0);
    this.remainingSlices = data.totalSlices;
    this._redrawDots();
    this._draw();
  }

  _draw() {
    if (this.drawGroup) this.drawGroup.clear(true, true);
    this.drawGroup = this.add.group();
    const W = this.W, H = this.H;
    // Prompt
    this.drawGroup.add(this.add.text(W / 2, 40, this.totalSlices + ' slices for ' + this.numPeople + ' people', {
      fontSize: '16px', color: COL_ACCENT, fontFamily: "'Space Grotesk', sans-serif", fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(6));
    this.drawGroup.add(this.add.text(W / 2, 60, 'Give each person equal slices!', {
      fontSize: '12px', color: COL_TEXT, fontFamily: "'Lexend', system-ui", alpha: 0.6
    }).setOrigin(0.5).setDepth(6));
    // Remaining slices
    this.remainLbl = this.add.text(W / 2, H * 0.2, 'Remaining: ' + this.remainingSlices, {
      fontSize: '18px', color: COL_TEXT, fontFamily: "'Lexend', system-ui"
    }).setOrigin(0.5).setDepth(6);
    this.drawGroup.add(this.remainLbl);
    // Plates
    const plateGap = Math.min(120, (W * 0.8) / this.numPeople);
    const startX = W / 2 - ((this.numPeople - 1) * plateGap) / 2;
    const plateY = H * 0.45;
    this.plateLbls = [];
    for (let i = 0; i < this.numPeople; i++) {
      const x = startX + i * plateGap;
      // Plate circle
      this.drawGroup.add(this.add.circle(x, plateY, 40, hexToNum(COL_SECONDARY), 0.15).setStrokeStyle(2, hexToNum(COL_PRIMARY), 0.4).setDepth(5));
      this.drawGroup.add(this.add.text(x, plateY - 50, 'Person ' + (i + 1), {
        fontSize: '11px', color: COL_TEXT, fontFamily: "'Lexend', system-ui", alpha: 0.5
      }).setOrigin(0.5).setDepth(6));
      // Count
      const lbl = this.add.text(x, plateY, String(this.plateCounts[i]), {
        fontSize: '24px', color: COL_PRIMARY, fontFamily: "'Space Grotesk', sans-serif", fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(7);
      this.plateLbls.push(lbl);
      this.drawGroup.add(lbl);
      // + button
      const plus = this.add.rectangle(x, plateY + 55, 36, 28, hexToNum(COL_ACCENT), 0.4)
        .setInteractive({ useHandCursor: true }).setDepth(7);
      this.drawGroup.add(plus);
      this.drawGroup.add(this.add.text(x, plateY + 55, '+1', {
        fontSize: '13px', color: COL_ACCENT, fontFamily: "'Lexend', system-ui", fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(8));
      plus.on('pointerdown', () => {
        if (this.remainingSlices > 0) {
          this.plateCounts[i]++;
          this.remainingSlices--;
          lbl.setText(String(this.plateCounts[i]));
          this.remainLbl.setText('Remaining: ' + this.remainingSlices);
        }
      });
      // - button
      const minus = this.add.rectangle(x, plateY + 85, 36, 28, hexToNum(COL_DANGER), 0.3)
        .setInteractive({ useHandCursor: true }).setDepth(7);
      this.drawGroup.add(minus);
      this.drawGroup.add(this.add.text(x, plateY + 85, '−1', {
        fontSize: '13px', color: COL_DANGER, fontFamily: "'Lexend', system-ui"
      }).setOrigin(0.5).setDepth(8));
      minus.on('pointerdown', () => {
        if (this.plateCounts[i] > 0) {
          this.plateCounts[i]--;
          this.remainingSlices++;
          lbl.setText(String(this.plateCounts[i]));
          this.remainLbl.setText('Remaining: ' + this.remainingSlices);
        }
      });
    }
    // Check button
    const btn = this.add.rectangle(W / 2, H * 0.85, 140, 42, hexToNum(COL_PRIMARY), 1)
      .setInteractive({ useHandCursor: true }).setDepth(10);
    this.add.text(W / 2, H * 0.85, 'Share!', {
      fontSize: '15px', color: '#fff', fontFamily: "'Lexend', system-ui", fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(11);
    btn.on('pointerdown', () => this._checkShare());
    this.drawGroup.add(btn);
  }

  _checkShare() {
    const allEqual = this.plateCounts.every(c => c === this.perPerson) && this.remainingSlices === 0;
    if (allEqual) {
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
`
