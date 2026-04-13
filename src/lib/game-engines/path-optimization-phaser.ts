// Path Optimization — Phaser engine with 3 game options.
// Math: Addition, comparison, optimization, graph traversal.
// Options: shortest-route, map-builder, delivery-run

import type { ThemeConfig, MathParams, GameOption } from "./engine-types"
import { phaserGame } from "./base-phaser-template"
import { getOptionDef } from "./game-option-registry"

export function pathOptimizationPhaserEngine(
  config: ThemeConfig,
  math: MathParams,
  option: GameOption = "shortest-route"
): string {
  const validOptions = ["shortest-route", "map-builder", "delivery-run"]
  const activeOption = validOptions.includes(option) ? option : "shortest-route"
  const optDef = getOptionDef(activeOption)
  const sceneMap: Record<string, string> = {
    "shortest-route": "ShortestRouteScene",
    "map-builder": "MapBuilderScene",
    "delivery-run": "DeliveryRunScene",
  }
  return phaserGame({
    config, math, option: activeOption,
    sceneName: sceneMap[activeOption],
    introText: optDef?.introText || "Find the best path!",
    helpText: optDef?.helpText || "Pick routes to minimize distance.",
    gameSceneCode: GAME_SCENES,
  })
}

const GAME_SCENES = `
function generateShortestRouteRound(round) {
  if (AI_ROUNDS && AI_ROUNDS[round]) { const r=AI_ROUNDS[round]; return { prompt: r.prompt, target: r.target, hint: r.hint }; }
  const numRoutes = 3;
  const segs = round < 2 ? 2 : round < 4 ? 3 : 4;
  const routes = [];
  for (let r = 0; r < numRoutes; r++) {
    const segments = [];
    for (let s = 0; s < segs; s++) segments.push(Math.floor(Math.random() * 15) + 3);
    routes.push(segments);
  }
  const totals = routes.map(function(r){ let s=0; for(let i=0;i<r.length;i++)s+=r[i]; return s; });
  let best = 0;
  for (let i = 1; i < totals.length; i++) if (totals[i] < totals[best]) best = i;
  return { routes, totals, best };
}

function generateMapBuilderRound(round) {
  const nodeCount = round < 2 ? 4 : round < 4 ? 5 : 6;
  const nodes = [];
  for (let i = 0; i < nodeCount; i++) {
    nodes.push({ x: 0.15 + Math.random() * 0.7, y: 0.2 + Math.random() * 0.4 });
  }
  const edges = [];
  for (let i = 0; i < nodeCount - 1; i++) {
    for (let j = i + 1; j < nodeCount; j++) {
      if (Math.random() < 0.6 || j === i + 1) {
        const cost = Math.floor(Math.random() * 12) + 2;
        edges.push({ from: i, to: j, cost });
      }
    }
  }
  // Find a reasonable budget (sum of cheapest spanning path + some slack)
  const sorted = edges.slice().sort(function(a,b){return a.cost-b.cost;});
  let budget = 0;
  for (let i = 0; i < Math.min(nodeCount - 1, sorted.length); i++) budget += sorted[i].cost;
  budget = Math.floor(budget * 1.3);
  return { nodes, edges, budget, startNode: 0, endNode: nodeCount - 1 };
}

function generateDeliveryRound(round) {
  const stops = round < 2 ? 3 : round < 4 ? 4 : 5;
  const positions = [];
  for (let i = 0; i < stops; i++) {
    positions.push({ x: 0.1 + Math.random() * 0.8, y: 0.15 + Math.random() * 0.5, label: String.fromCharCode(65 + i) });
  }
  return { positions, stops };
}

function dist2d(a, b) {
  const dx = a.x - b.x; const dy = a.y - b.y;
  return Math.round(Math.sqrt(dx*dx + dy*dy) * 100);
}

// ═══════════════════════════════════════════════════════════════════════════════
class ShortestRouteScene extends Phaser.Scene {
  constructor() { super('ShortestRouteScene'); }
  create() { this.W=this.scale.width;this.H=this.scale.height;this.round=0;this.lives=MAX_LIVES;this._bg();this._ui();this.startRound(); }
  _bg() { const bg=this.add.image(this.W/2,this.H/2,'bg');bg.setScale(Math.max(this.W/bg.width,this.H/bg.height));this.add.rectangle(this.W/2,this.H/2,this.W,this.H,0x000000,0.65); }
  _ui() { this.scoreLbl=this.add.text(this.W-14,14,'Score: 0',{fontSize:'16px',color:COL_ACCENT,fontFamily:"'Lexend', system-ui",fontStyle:'bold'}).setOrigin(1,0).setDepth(10);this.hg=this.add.group();this._rh();this.dg=this.add.group();this._rd(); }
  _rh() { this.hg.clear(true,true);for(let i=0;i<this.lives;i++)this.hg.add(this.add.text(14+i*22,14,'\\u2665',{fontSize:'18px',color:COL_DANGER}).setDepth(10)); }
  _rd() { this.dg.clear(true,true);for(let i=0;i<TOTAL_ROUNDS;i++){const c=i<this.round?COL_ACCENT:i===this.round?COL_PRIMARY:'#555555';this.dg.add(this.add.circle(this.W/2-40+i*20,this.H-16,5,hexToNum(c)).setDepth(10));} }

  startRound() {
    if(this.rg)this.rg.clear(true,true);this.rg=this.add.group();
    const data=getRound(this.round);
    // Build routes from getRound: fall back to generator for complex route data
    const fallback=generateShortestRouteRound(this.round);
    data.routes=fallback.routes;data.totals=fallback.totals;this.best=fallback.best;this._rd();
    const W=this.W,H=this.H;
    this.rg.add(this.add.text(W/2,H*0.06,'Pick the shortest route!',{fontSize:'16px',color:COL_ACCENT,fontFamily:"'Space Grotesk', sans-serif",fontStyle:'bold'}).setOrigin(0.5).setDepth(6));
    const routeNames = ['Route A', 'Route B', 'Route C'];
    data.routes.forEach((route, ri) => {
      const y = H * 0.2 + ri * (H * 0.22);
      // Draw route segments
      const segW = (W * 0.6) / route.length;
      const startX = W * 0.15;
      for (let s = 0; s < route.length; s++) {
        const x1 = startX + s * segW;
        const x2 = x1 + segW;
        const midX = (x1 + x2) / 2;
        this.rg.add(this.add.rectangle(midX, y, segW - 4, 3, hexToNum(COL_TEXT), 0.3).setDepth(5));
        this.rg.add(this.add.text(midX, y - 14, String(route[s]), {fontSize:'12px',color:COL_TEXT,fontFamily:"'Lexend', system-ui"}).setOrigin(0.5).setDepth(6));
        // Node dots
        this.rg.add(this.add.circle(x1, y, 5, hexToNum(COL_PRIMARY)).setDepth(6));
      }
      this.rg.add(this.add.circle(startX + route.length * segW, y, 5, hexToNum(COL_PRIMARY)).setDepth(6));
      // Total and button
      const totalX = W * 0.82;
      this.rg.add(this.add.text(totalX - 30, y, 'Total: ' + data.totals[ri], {fontSize:'11px',color:COL_TEXT,fontFamily:"'Lexend', system-ui",alpha:0.6}).setOrigin(0, 0.5).setDepth(6));
      const btn = this.add.rectangle(W * 0.12, y, 60, 30, hexToNum(COL_SECONDARY), 0.3).setInteractive({useHandCursor:true}).setDepth(7);
      this.rg.add(btn);
      this.rg.add(this.add.text(W * 0.12, y, routeNames[ri], {fontSize:'11px',color:COL_TEXT,fontFamily:"'Lexend', system-ui",fontStyle:'bold'}).setOrigin(0.5).setDepth(8));
      btn.on('pointerdown', () => this._pickRoute(ri));
    });
  }

  _pickRoute(ri) {
    if (ri === this.best) {
      gameScore += 10 * (this.round + 1); this.scoreLbl.setText('Score: ' + gameScore); this.cameras.main.flash(200, 34, 197, 94); heroCheer(this, this.hero);
      this.round++; if (this.round >= TOTAL_ROUNDS) this.time.delayedCall(600, () => this.scene.start('VictoryScene', {score: gameScore}));
      else this.time.delayedCall(800, () => this.startRound());
    } else {
      this.lives--; this._rh(); this.cameras.main.shake(200, 0.01); heroShake(this, this.hero);
      if (this.lives <= 0) this.time.delayedCall(500, () => this.scene.start('LoseScene', {score: gameScore}));
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
class MapBuilderScene extends Phaser.Scene {
  constructor() { super('MapBuilderScene'); }
  create() { this.W=this.scale.width;this.H=this.scale.height;this.round=0;this.lives=MAX_LIVES;this._bg();this._ui();this.startRound(); }
  _bg() { const bg=this.add.image(this.W/2,this.H/2,'bg');bg.setScale(Math.max(this.W/bg.width,this.H/bg.height));this.add.rectangle(this.W/2,this.H/2,this.W,this.H,0x000000,0.65); }
  _ui() { this.scoreLbl=this.add.text(this.W-14,14,'Score: 0',{fontSize:'16px',color:COL_ACCENT,fontFamily:"'Lexend', system-ui",fontStyle:'bold'}).setOrigin(1,0).setDepth(10);this.hg=this.add.group();this._rh();this.dg=this.add.group();this._rd(); }
  _rh() { this.hg.clear(true,true);for(let i=0;i<this.lives;i++)this.hg.add(this.add.text(14+i*22,14,'\\u2665',{fontSize:'18px',color:COL_DANGER}).setDepth(10)); }
  _rd() { this.dg.clear(true,true);for(let i=0;i<TOTAL_ROUNDS;i++){const c=i<this.round?COL_ACCENT:i===this.round?COL_PRIMARY:'#555555';this.dg.add(this.add.circle(this.W/2-40+i*20,this.H-16,5,hexToNum(c)).setDepth(10));} }

  startRound() {
    if(this.rg)this.rg.clear(true,true);this.rg=this.add.group();
    const data=getRound(this.round);
    // Build map data: fall back to generator for graph structure
    const fallback=generateMapBuilderRound(this.round);
    this.nodes=fallback.nodes;this.edges=fallback.edges;this.budget=data.target||fallback.budget;this.startNode=fallback.startNode;this.endNode=fallback.endNode;this.selectedEdges=[];this.totalCost=0;this._rd();
    const W=this.W,H=this.H;
    this.rg.add(this.add.text(W/2,H*0.04,'Build a path: Start to End. Budget: '+this.budget,{fontSize:'13px',color:COL_ACCENT,fontFamily:"'Lexend', system-ui"}).setOrigin(0.5).setDepth(6));
    this.costLbl=this.add.text(W/2,H*0.10,'Cost: 0 / '+this.budget,{fontSize:'13px',color:COL_TEXT,fontFamily:"'Lexend', system-ui"}).setOrigin(0.5).setDepth(6);
    this.rg.add(this.costLbl);
    // Draw nodes
    this.nodes.forEach((n, i) => {
      const x = n.x * W; const y = n.y * H;
      const col = i === this.startNode ? hexToNum(COL_ACCENT) : i === this.endNode ? hexToNum(COL_DANGER) : hexToNum(COL_PRIMARY);
      this.rg.add(this.add.circle(x, y, 12, col).setDepth(7));
      const label = i === this.startNode ? 'S' : i === this.endNode ? 'E' : String(i);
      this.rg.add(this.add.text(x, y, label, {fontSize:'11px',color:'#fff',fontFamily:"'Lexend', system-ui",fontStyle:'bold'}).setOrigin(0.5).setDepth(8));
    });
    // Draw edges as clickable
    this.edgeGfx = [];
    this.edges.forEach((e, idx) => {
      const a = this.nodes[e.from]; const b = this.nodes[e.to];
      const ax = a.x * W; const ay = a.y * H; const bx = b.x * W; const by = b.y * H;
      const mx = (ax + bx) / 2; const my = (ay + by) / 2;
      const len = Math.sqrt((bx-ax)*(bx-ax)+(by-ay)*(by-ay));
      const angle = Math.atan2(by - ay, bx - ax);
      const line = this.add.rectangle(mx, my, len, 4, hexToNum(COL_SECONDARY), 0.3).setDepth(5).setRotation(angle);
      line.setInteractive({useHandCursor: true});
      this.rg.add(line);
      const costLbl = this.add.text(mx, my - 10, String(e.cost), {fontSize:'11px',color:COL_TEXT,fontFamily:"'Lexend', system-ui"}).setOrigin(0.5).setDepth(6);
      this.rg.add(costLbl);
      this.edgeGfx.push({line, idx, selected: false});
      line.on('pointerdown', () => this._toggleEdge(idx));
    });
    // Check button
    const check = this.add.rectangle(W/2, H*0.88, 120, 36, hexToNum(COL_PRIMARY), 1).setInteractive({useHandCursor:true}).setDepth(10);
    this.rg.add(check);
    this.rg.add(this.add.text(W/2, H*0.88, 'Check path', {fontSize:'13px',color:'#fff',fontFamily:"'Lexend', system-ui",fontStyle:'bold'}).setOrigin(0.5).setDepth(11));
    check.on('pointerdown', () => this._checkPath());
  }

  _toggleEdge(idx) {
    const eg = this.edgeGfx.find(function(e){return e.idx===idx;});
    if (!eg) return;
    eg.selected = !eg.selected;
    eg.line.setFillStyle(hexToNum(eg.selected ? COL_ACCENT : COL_SECONDARY), eg.selected ? 0.7 : 0.3);
    this.totalCost = 0;
    this.selectedEdges = [];
    for (let i = 0; i < this.edgeGfx.length; i++) {
      if (this.edgeGfx[i].selected) { this.totalCost += this.edges[this.edgeGfx[i].idx].cost; this.selectedEdges.push(this.edgeGfx[i].idx); }
    }
    this.costLbl.setText('Cost: ' + this.totalCost + ' / ' + this.budget);
    this.costLbl.setColor(this.totalCost > this.budget ? COL_DANGER : COL_TEXT);
  }

  _checkPath() {
    // Simple connectivity check: can we reach endNode from startNode using selected edges?
    const adj = {};
    for (let i = 0; i < this.nodes.length; i++) adj[i] = [];
    for (let i = 0; i < this.selectedEdges.length; i++) {
      const e = this.edges[this.selectedEdges[i]];
      adj[e.from].push(e.to);
      adj[e.to].push(e.from);
    }
    const visited = {}; const queue = [this.startNode];
    visited[this.startNode] = true;
    while (queue.length) {
      const cur = queue.shift();
      if (cur === this.endNode) break;
      for (let i = 0; i < adj[cur].length; i++) {
        if (!visited[adj[cur][i]]) { visited[adj[cur][i]] = true; queue.push(adj[cur][i]); }
      }
    }
    if (visited[this.endNode] && this.totalCost <= this.budget) {
      gameScore += 10 * (this.round + 1); this.scoreLbl.setText('Score: ' + gameScore); this.cameras.main.flash(200, 34, 197, 94); heroCheer(this, this.hero);
      this.round++; if (this.round >= TOTAL_ROUNDS) this.time.delayedCall(600, () => this.scene.start('VictoryScene', {score: gameScore}));
      else this.time.delayedCall(800, () => this.startRound());
    } else {
      this.lives--; this._rh(); this.cameras.main.shake(200, 0.01); heroShake(this, this.hero);
      if (this.lives <= 0) this.time.delayedCall(500, () => this.scene.start('LoseScene', {score: gameScore}));
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
class DeliveryRunScene extends Phaser.Scene {
  constructor() { super('DeliveryRunScene'); }
  create() { this.W=this.scale.width;this.H=this.scale.height;this.round=0;this.lives=MAX_LIVES;this._bg();this._ui();this.startRound(); }
  _bg() { const bg=this.add.image(this.W/2,this.H/2,'bg');bg.setScale(Math.max(this.W/bg.width,this.H/bg.height));this.add.rectangle(this.W/2,this.H/2,this.W,this.H,0x000000,0.65); }
  _ui() { this.scoreLbl=this.add.text(this.W-14,14,'Score: 0',{fontSize:'16px',color:COL_ACCENT,fontFamily:"'Lexend', system-ui",fontStyle:'bold'}).setOrigin(1,0).setDepth(10);this.hg=this.add.group();this._rh();this.dg=this.add.group();this._rd(); }
  _rh() { this.hg.clear(true,true);for(let i=0;i<this.lives;i++)this.hg.add(this.add.text(14+i*22,14,'\\u2665',{fontSize:'18px',color:COL_DANGER}).setDepth(10)); }
  _rd() { this.dg.clear(true,true);for(let i=0;i<TOTAL_ROUNDS;i++){const c=i<this.round?COL_ACCENT:i===this.round?COL_PRIMARY:'#555555';this.dg.add(this.add.circle(this.W/2-40+i*20,this.H-16,5,hexToNum(c)).setDepth(10));} }

  startRound() {
    if(this.rg)this.rg.clear(true,true);this.rg=this.add.group();
    const data=getRound(this.round);
    // Build positions: fall back to generator for spatial data
    const fallback=generateDeliveryRound(this.round);
    this.positions=fallback.positions;this.visitOrder=[];this.totalDist=0;this._rd();
    const W=this.W,H=this.H;
    this.rg.add(this.add.text(W/2,H*0.04,'Visit all stops! Click in order.',{fontSize:'14px',color:COL_ACCENT,fontFamily:"'Space Grotesk', sans-serif",fontStyle:'bold'}).setOrigin(0.5).setDepth(6));
    this.distLbl=this.add.text(W/2,H*0.10,'Distance: 0',{fontSize:'13px',color:COL_TEXT,fontFamily:"'Lexend', system-ui"}).setOrigin(0.5).setDepth(6);
    this.rg.add(this.distLbl);
    this.orderLbl=this.add.text(W/2,H*0.86,'Order: -',{fontSize:'11px',color:COL_TEXT,fontFamily:"'Lexend', system-ui",alpha:0.5}).setOrigin(0.5).setDepth(6);
    this.rg.add(this.orderLbl);
    // Draw stops
    this.stopBtns = [];
    this.positions.forEach((p, i) => {
      const x = p.x * W; const y = p.y * H;
      const circle = this.add.circle(x, y, 18, hexToNum(COL_PRIMARY)).setInteractive({useHandCursor:true}).setDepth(7);
      const lbl = this.add.text(x, y, p.label, {fontSize:'14px',color:'#fff',fontFamily:"'Space Grotesk', sans-serif",fontStyle:'bold'}).setOrigin(0.5).setDepth(8);
      this.rg.add(circle); this.rg.add(lbl);
      this.stopBtns.push({circle, lbl, visited: false, idx: i});
      circle.on('pointerdown', () => this._visitStop(i));
    });
    // Reset button
    const rst = this.add.rectangle(W*0.15, H*0.10, 60, 28, hexToNum(COL_DANGER), 0.3).setInteractive({useHandCursor:true}).setDepth(9);
    this.rg.add(rst);
    this.rg.add(this.add.text(W*0.15, H*0.10, 'Reset', {fontSize:'11px',color:COL_DANGER,fontFamily:"'Lexend', system-ui",fontStyle:'bold'}).setOrigin(0.5).setDepth(10));
    rst.on('pointerdown', () => {
      this.visitOrder = []; this.totalDist = 0;
      this.distLbl.setText('Distance: 0');
      this.orderLbl.setText('Order: -');
      this.stopBtns.forEach(function(s){s.visited=false;s.circle.setFillStyle(hexToNum(COL_PRIMARY));});
      // Remove drawn lines
      if(this.lines){this.lines.forEach(function(l){l.destroy();});this.lines=[];}
    });
    this.lines = [];
  }

  _visitStop(idx) {
    const btn = this.stopBtns[idx];
    if (btn.visited) return;
    btn.visited = true;
    btn.circle.setFillStyle(hexToNum(COL_ACCENT));
    if (this.visitOrder.length > 0) {
      const prev = this.positions[this.visitOrder[this.visitOrder.length - 1]];
      const cur = this.positions[idx];
      const d = dist2d(prev, cur);
      this.totalDist += d;
      // Draw line
      const ax = prev.x * this.W; const ay = prev.y * this.H;
      const bx = cur.x * this.W; const by = cur.y * this.H;
      const mx = (ax+bx)/2; const my = (ay+by)/2;
      const len = Math.sqrt((bx-ax)*(bx-ax)+(by-ay)*(by-ay));
      const angle = Math.atan2(by-ay, bx-ax);
      const line = this.add.rectangle(mx, my, len, 2, hexToNum(COL_ACCENT), 0.6).setDepth(4).setRotation(angle);
      this.rg.add(line); this.lines.push(line);
    }
    this.visitOrder.push(idx);
    this.distLbl.setText('Distance: ' + this.totalDist);
    this.orderLbl.setText('Order: ' + this.visitOrder.map(function(i){return this.positions[i].label;}.bind(this)).join(' > '));
    // All visited?
    if (this.visitOrder.length >= this.positions.length) {
      // Compute optimal (brute force for small N)
      const optDist = this._bruteForceOptimal();
      if (this.totalDist <= optDist * 1.3) {
        gameScore += 10 * (this.round + 1); this.scoreLbl.setText('Score: ' + gameScore); this.cameras.main.flash(200, 34, 197, 94); heroCheer(this, this.hero);
        this.round++; if (this.round >= TOTAL_ROUNDS) this.time.delayedCall(600, () => this.scene.start('VictoryScene', {score: gameScore}));
        else this.time.delayedCall(800, () => this.startRound());
      } else {
        this.lives--; this._rh(); this.cameras.main.shake(200, 0.01); heroShake(this, this.hero);
        if (this.lives <= 0) this.time.delayedCall(500, () => this.scene.start('LoseScene', {score: gameScore}));
        else this.time.delayedCall(800, () => this.startRound());
      }
    }
  }

  _bruteForceOptimal() {
    const n = this.positions.length;
    const perms = [];
    const arr = [];
    for (let i = 0; i < n; i++) arr.push(i);
    const permute = function(a, l, r) {
      if (l === r) { perms.push(a.slice()); return; }
      for (let i = l; i <= r; i++) {
        const t = a[l]; a[l] = a[i]; a[i] = t;
        permute(a, l + 1, r);
        const t2 = a[l]; a[l] = a[i]; a[i] = t2;
      }
    };
    permute(arr, 0, n - 1);
    let best = Infinity;
    const pos = this.positions;
    for (let p = 0; p < perms.length; p++) {
      let d = 0;
      for (let i = 1; i < perms[p].length; i++) d += dist2d(pos[perms[p][i-1]], pos[perms[p][i]]);
      if (d < best) best = d;
    }
    return best;
  }
}
`
