"use client"

// Pre-built game mechanic SVG animations.
// Each one demonstrates a core game loop that uses a specific math domain.
// The stick figure ITSELF moves (arms, legs, body) — not just the props.
//
// !!! KEEP THESE IN SYNC WITH scripts/gen-mechanic-map.js !!!
// The desktop HTML mechanic map uses copies of the same SVG strings.

import { dangerousSvg } from "./svg-helper"

export interface MechanicAnimation {
  id: string
  title: string
  description: string
  mathDomain: string
  // Words that, if found in a standard's description, suggest this
  // mechanic. Matched with word boundaries (so "part" won't match
  // "particular"). Use base forms — "add" will catch "addition", "adds",
  // "adding" via the loose suffix rule.
  descKeywords: string[]
  // Common-Core domain code prefixes (e.g. "NF", "G-SRT"). Matched with
  // a startsWith check on the standard's domain code so "G" doesn't
  // accidentally match every code containing the letter g.
  domainCodes: string[]
  svg: React.ReactNode
}

// Each mechanic's SVG body. The stick figure has its own animation in
// every one — never sitting still. Inline <style> blocks use scoped
// class names to avoid leaking across mechanics.

const SVG_RESOURCE_MGMT = `<svg viewBox="0 0 180 120" xmlns="http://www.w3.org/2000/svg">
<style>
@keyframes col_walk { 0%,100%{transform:translateX(0)}50%{transform:translateX(20px)} }
@keyframes col_legA { 0%,100%{transform:rotate(0deg)}50%{transform:rotate(20deg)} }
@keyframes col_armA { 0%,100%{transform:rotate(0deg)}50%{transform:rotate(-15deg)} }
@keyframes col_pop  { 0%,30%{opacity:0;transform:scale(0)}40%,100%{opacity:1;transform:scale(1)} }
.col_g  { animation: col_walk 2s ease-in-out infinite; transform-origin: 35px 75px; }
.col_legR { animation: col_legA 0.6s ease-in-out infinite; transform-origin: 35px 75px; }
.col_legL { animation: col_legA 0.6s ease-in-out 0.3s infinite; transform-origin: 35px 75px; }
.col_armR { animation: col_armA 0.6s ease-in-out infinite; transform-origin: 35px 62px; }
.col_i1 { animation: col_pop 2s ease-in-out infinite; }
.col_i2 { animation: col_pop 2s ease-in-out 0.4s infinite; opacity: 0; }
.col_i3 { animation: col_pop 2s ease-in-out 0.8s infinite; opacity: 0; }
</style>
<rect width="180" height="120" fill="#18181b"/>
<g class="col_g">
  <circle cx="35" cy="50" r="6" fill="none" stroke="#e4e4e7" stroke-width="2"/>
  <line x1="35" y1="56" x2="35" y2="75" stroke="#e4e4e7" stroke-width="2"/>
  <line class="col_armR" x1="35" y1="62" x2="48" y2="58" stroke="#e4e4e7" stroke-width="2"/>
  <line x1="35" y1="62" x2="22" y2="68" stroke="#e4e4e7" stroke-width="2"/>
  <line class="col_legR" x1="35" y1="75" x2="42" y2="89" stroke="#e4e4e7" stroke-width="2"/>
  <line class="col_legL" x1="35" y1="75" x2="28" y2="89" stroke="#e4e4e7" stroke-width="2"/>
</g>
<circle class="col_i1" cx="70" cy="70" r="4" fill="#f59e0b"/>
<circle class="col_i2" cx="90" cy="65" r="4" fill="#f59e0b"/>
<circle class="col_i3" cx="110" cy="70" r="4" fill="#f59e0b"/>
<rect x="120" y="30" width="50" height="22" rx="4" fill="none" stroke="#60a5fa" stroke-width="1.5"/>
<text x="145" y="45" font-size="10" fill="#60a5fa" text-anchor="middle" font-family="monospace">3 + 2</text>
<text x="90" y="110" font-size="7" fill="#71717a" text-anchor="middle">collect to add up</text>
</svg>`

// Partitioning — 10-second multi-stage animation showing a circle being
// progressively cut into halves, then quarters, then eighths. Each
// cut appears at a fixed time-step so the kid sees the verb (cut a
// whole into equal parts) play out end-to-end.
//
// Stages (10s loop):
//   0.0-2.0s  whole circle, label "1"
//   2.0-4.0s  first cut → halves, label "1/2"
//   4.0-6.0s  second cut → quarters, label "1/4"
//   6.0-8.0s  third cut → eighths, label "1/8"
//   8.0-10s   all 8 wedges glow briefly (the "done" beat)
//
// Figure uses the unified faceless / angled-leg baseline (no knees).
// Arm stays raised the whole time to emphasize "I'm doing this".
const SVG_PARTITIONING = `<svg viewBox="0 0 180 120" xmlns="http://www.w3.org/2000/svg">
<style>
  /* Three chops total. Cut 1 (vertical) at 25%, cut 2 (horizontal)
     at 50%, cuts 3+4 (both diagonals) at 75% so the circle goes
     1 → 2 halves → 4 quarters → 8 eighths in three clean steps.
     Arm sits at -50deg (raised) most of the time, snaps to 0deg
     (chop down) at each cut moment, then snaps back up. */
  @keyframes pa_arm_chop {
    0%,20%   { transform: rotate(-50deg) }
    25%      { transform: rotate(0deg)   }
    30%,45%  { transform: rotate(-50deg) }
    50%      { transform: rotate(0deg)   }
    55%,70%  { transform: rotate(-50deg) }
    75%      { transform: rotate(0deg)   }
    80%,100% { transform: rotate(-50deg) }
  }
  /* Step aside after the last cut so the result circle is fully visible */
  @keyframes pa_step_aside { 0%,80%{transform:translateX(0)} 86%,100%{transform:translateX(-18px)} }
  @keyframes pa_lean     { 0%,100%{transform:rotate(0deg)} 28%,53%,78%{transform:rotate(3deg)} }
  /* Cuts: cut1 at 25%, cut2 at 50%, cut3 + cut4 at 75% (both at once) */
  @keyframes pa_step1    { 0%,24%{opacity:0} 25%,100%{opacity:1} }
  @keyframes pa_step2    { 0%,49%{opacity:0} 50%,100%{opacity:1} }
  @keyframes pa_step3    { 0%,74%{opacity:0} 75%,100%{opacity:1} }
  @keyframes pa_step4    { 0%,74%{opacity:0} 75%,100%{opacity:1} }
  /* Final green glow + holds during the "1 whole" label reappearance */
  @keyframes pa_glow     { 0%,84%{opacity:0} 87%,100%{opacity:0.3} }
  /* Labels:
       lab1 "1 whole" — visible at the start AND at the very end
       lab2 "2 × 1/2" — after cut 1
       lab3 "4 × 1/4" — after cut 2
       lab4 "8 × 1/8" — after cuts 3+4 (the eighths beat) */
  @keyframes pa_label1   { 0%,24%{opacity:1} 25%,84%{opacity:0} 87%,100%{opacity:1} }
  @keyframes pa_label2   { 0%,24%{opacity:0} 25%,49%{opacity:1} 50%,100%{opacity:0} }
  @keyframes pa_label3   { 0%,49%{opacity:0} 50%,74%{opacity:1} 75%,100%{opacity:0} }
  @keyframes pa_label4   { 0%,74%{opacity:0} 75%,84%{opacity:1} 87%,100%{opacity:0} }

  .pa_outer { animation: pa_step_aside 10s ease-in-out infinite; }
  .pa_g     { animation: pa_lean 10s ease-in-out infinite; transform-origin: 30px 65px; }
  .pa_arm   { animation: pa_arm_chop 10s linear infinite; transform-origin: 30px 52px; }
  .pa_cut1  { animation: pa_step1 10s step-end infinite; }
  .pa_cut2  { animation: pa_step2 10s step-end infinite; }
  .pa_cut3  { animation: pa_step3 10s step-end infinite; }
  .pa_cut4  { animation: pa_step4 10s step-end infinite; }
  .pa_glow  { animation: pa_glow 10s ease-in-out infinite; }
  .pa_lab1  { animation: pa_label1 10s step-end infinite; }
  .pa_lab2  { animation: pa_label2 10s step-end infinite; }
  .pa_lab3  { animation: pa_label3 10s step-end infinite; }
  .pa_lab4  { animation: pa_label4 10s step-end infinite; }
</style>
<rect width="180" height="120" fill="#18181b"/>

<!-- Figure on the left, faceless, single-segment angled legs.
     Outer wrapper steps aside at the end so the cut circle is unobstructed. -->
<g class="pa_outer">
  <g class="pa_g">
    <circle cx="30" cy="40" r="6" fill="none" stroke="#e4e4e7" stroke-width="2"/>
    <line x1="30" y1="46" x2="30" y2="65" stroke="#e4e4e7" stroke-width="2"/>
    <g class="pa_arm">
      <!-- Shorter arm: ends at (45, 45) instead of (55, 40) -->
      <line x1="30" y1="52" x2="45" y2="45" stroke="#e4e4e7" stroke-width="2"/>
      <!-- Knife held in the raised hand -->
      <line x1="45" y1="45" x2="51" y2="41" stroke="#60a5fa" stroke-width="2"/>
    </g>
    <line x1="30" y1="52" x2="15" y2="55" stroke="#e4e4e7" stroke-width="2"/>
    <line x1="23" y1="79" x2="30" y2="65" stroke="#e4e4e7" stroke-width="2"/>
    <line x1="30" y1="65" x2="37" y2="79" stroke="#e4e4e7" stroke-width="2"/>
  </g>
</g>

<!-- Whole circle (always visible) and progressive cuts -->
<g transform="translate(110,58)">
  <circle cx="0" cy="0" r="28" fill="none" stroke="#f59e0b" stroke-width="2"/>
  <!-- Cut 1: vertical line → halves -->
  <line class="pa_cut1" x1="0" y1="-28" x2="0" y2="28" stroke="#60a5fa" stroke-width="1.5"/>
  <!-- Cut 2: horizontal line → quarters -->
  <line class="pa_cut2" x1="-28" y1="0" x2="28" y2="0" stroke="#60a5fa" stroke-width="1.5"/>
  <!-- Cut 3: diagonal up-right → eighths (one diagonal) -->
  <line class="pa_cut3" x1="-20" y1="-20" x2="20" y2="20" stroke="#60a5fa" stroke-width="1.5"/>
  <!-- Cut 4: diagonal up-left → eighths (second diagonal) -->
  <line class="pa_cut4" x1="-20" y1="20" x2="20" y2="-20" stroke="#60a5fa" stroke-width="1.5"/>
  <!-- Final glow over the whole circle -->
  <circle class="pa_glow" cx="0" cy="0" r="28" fill="#22c55e" opacity="0.25"/>
</g>

<!-- Label transitions: "1" → "1/2" → "1/4" → "1/8" -->
<text class="pa_lab1" x="110" y="106" font-size="10" fill="#fbbf24" text-anchor="middle" font-family="monospace">1 whole</text>
<text class="pa_lab2" x="110" y="106" font-size="10" fill="#fbbf24" text-anchor="middle" font-family="monospace">2 × 1/2</text>
<text class="pa_lab3" x="110" y="106" font-size="10" fill="#fbbf24" text-anchor="middle" font-family="monospace">4 × 1/4</text>
<text class="pa_lab4" x="110" y="106" font-size="10" fill="#fbbf24" text-anchor="middle" font-family="monospace">8 × 1/8</text>

<text x="90" y="118" font-size="6" fill="#71717a" text-anchor="middle">cut a whole into equal parts</text>
</svg>`

// Balance & Equalize — 10-second animation showing the verb "balance
// the equation by adding tokens to the lighter side". Scale starts
// heavy on the left (4 blocks vs 1). Figure walks over and adds one
// block at a time to the right pan until both sides match (4 vs 4).
// The beam tilts back toward level as each block is added, finally
// settling flat with a green glow.
//
// Stages:
//   0-1.5s   start state: left has 4, right has 1, beam tilts hard left
//   1.5-3.5s figure walks to right pan, drops block #2, beam evens out a bit
//   3.5-5.5s drops block #3, almost level
//   5.5-7.5s drops block #4, beam now flat — balanced
//   7.5-10s  hold the balanced state, "= 4" pulses green
const SVG_BALANCE = `<svg viewBox="0 0 180 120" xmlns="http://www.w3.org/2000/svg">
<style>
  /* Beam tilt: starts hard left (-12deg), evens out as blocks are added */
  @keyframes bs_beam   { 0%,15%{transform:rotate(-12deg)} 25%,35%{transform:rotate(-8deg)} 45%,55%{transform:rotate(-4deg)} 65%,100%{transform:rotate(0deg)} }
  /* Figure walks from origin (x=10) right to drop at the right pan */
  @keyframes bs_walk   { 0%,15%{transform:translateX(0)} 25%,35%{transform:translateX(105px)} 40%,45%{transform:translateX(0)} 50%,60%{transform:translateX(105px)} 65%,70%{transform:translateX(0)} 75%,82%{transform:translateX(105px)} 88%,100%{transform:translateX(140px)} }
  @keyframes bs_legA   { 0%,100%{transform:rotate(-22deg)} 50%{transform:rotate(22deg)} }
  @keyframes bs_legB   { 0%,100%{transform:rotate(22deg)} 50%{transform:rotate(-22deg)} }
  @keyframes bs_bob    { 0%,100%{transform:translateY(-1.5px)} 50%{transform:translateY(1.5px)} }
  /* Right-pan blocks: each appears at the moment the figure drops it */
  @keyframes bs_b2     { 0%,25%{opacity:0} 30%,100%{opacity:1} }
  @keyframes bs_b3     { 0%,50%{opacity:0} 55%,100%{opacity:1} }
  @keyframes bs_b4     { 0%,70%{opacity:0} 75%,100%{opacity:1} }
  /* Final equality glow */
  @keyframes bs_glow   { 0%,75%{opacity:0;fill:#71717a} 80%,100%{opacity:1;fill:#22c55e} }

  .bs_g    { animation: bs_walk 11s ease-in-out infinite; }
  .bs_bob  { animation: bs_bob 1s ease-in-out infinite; }
  .bs_legA { animation: bs_legA 1s ease-in-out infinite; transform-origin: 0 22px; }
  .bs_legB { animation: bs_legB 1s ease-in-out infinite; transform-origin: 0 22px; }
  .bs_beam { animation: bs_beam 11s ease-in-out infinite; transform-origin: 100px 55px; }
  .bs_b2   { animation: bs_b2 11s step-end infinite; }
  .bs_b3   { animation: bs_b3 11s step-end infinite; }
  .bs_b4   { animation: bs_b4 11s step-end infinite; }
  .bs_glow { animation: bs_glow 11s step-end infinite; }
</style>
<rect width="180" height="120" fill="#18181b"/>

<!-- Fulcrum + base -->
<polygon points="100,75 88,95 112,95" fill="none" stroke="#e4e4e7" stroke-width="1.5"/>
<line x1="80" y1="95" x2="120" y2="95" stroke="#e4e4e7" stroke-width="1.5"/>

<!-- Beam (rotates) with fixed pans + blocks -->
<g class="bs_beam">
  <line x1="50" y1="55" x2="150" y2="55" stroke="#e4e4e7" stroke-width="2"/>
  <!-- Left pan: 4 blocks (always visible) -->
  <line x1="65" y1="55" x2="65" y2="62" stroke="#71717a" stroke-width="1"/>
  <line x1="50" y1="62" x2="80" y2="62" stroke="#71717a" stroke-width="1.5"/>
  <rect x="55" y="48" width="9" height="9" fill="#60a5fa" opacity="0.7"/>
  <rect x="66" y="48" width="9" height="9" fill="#60a5fa" opacity="0.7"/>
  <rect x="55" y="38" width="9" height="9" fill="#60a5fa" opacity="0.7"/>
  <rect x="66" y="38" width="9" height="9" fill="#60a5fa" opacity="0.7"/>
  <!-- Right pan: starts with 1 block; 3 more get dropped over time -->
  <line x1="135" y1="55" x2="135" y2="62" stroke="#71717a" stroke-width="1"/>
  <line x1="120" y1="62" x2="150" y2="62" stroke="#71717a" stroke-width="1.5"/>
  <rect x="130" y="48" width="9" height="9" fill="#fbbf24" opacity="0.7"/>
  <rect class="bs_b2" x="130" y="38" width="9" height="9" fill="#fbbf24" opacity="0.7"/>
  <rect class="bs_b3" x="130" y="28" width="9" height="9" fill="#fbbf24" opacity="0.7"/>
  <rect class="bs_b4" x="130" y="18" width="9" height="9" fill="#fbbf24" opacity="0.7"/>
</g>

<!-- Equation label at the top: "4 = ?" → "4 = 4" turns green at the end -->
<text x="65" y="22" font-size="9" fill="#60a5fa" text-anchor="middle" font-family="monospace">4</text>
<text x="90" y="22" font-size="9" fill="#e4e4e7" text-anchor="middle" font-family="monospace">=</text>
<text class="bs_glow" x="115" y="22" font-size="9" text-anchor="middle" font-family="monospace">4</text>

<!-- Figure walks from x=10 toward the right pan -->
<g class="bs_g">
  <g class="bs_bob">
    <circle cx="10" cy="78" r="6" fill="none" stroke="#e4e4e7" stroke-width="2"/>
    <line x1="10" y1="84" x2="10" y2="98" stroke="#e4e4e7" stroke-width="2"/>
    <line x1="10" y1="88" x2="17" y2="95" stroke="#e4e4e7" stroke-width="2"/>
    <line x1="10" y1="88" x2="3" y2="95" stroke="#e4e4e7" stroke-width="2"/>
    <g class="bs_legA" style="transform-origin: 10px 98px;">
      <line x1="10" y1="98" x2="10" y2="108" stroke="#e4e4e7" stroke-width="2"/>
    </g>
    <g class="bs_legB" style="transform-origin: 10px 98px;">
      <line x1="10" y1="98" x2="10" y2="108" stroke="#e4e4e7" stroke-width="2"/>
    </g>
  </g>
</g>

<text x="90" y="118" font-size="6" fill="#71717a" text-anchor="middle">add tokens until both sides match</text>
</svg>`

const SVG_SPATIAL = `<svg viewBox="0 0 180 120" xmlns="http://www.w3.org/2000/svg">
<style>
@keyframes sp_spin  { 0%{transform:rotate(0)} 100%{transform:rotate(360deg)} }
@keyframes sp_slide { 0%,30%{transform:translate(20px,-10px);opacity:0.3} 60%,100%{transform:translate(0,0);opacity:1} }
@keyframes sp_point { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(20deg)} }
@keyframes sp_lean  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-1.5px)} }
.sp_g    { animation: sp_lean 1s ease-in-out infinite; transform-origin: 30px 65px; }
.sp_arm  { animation: sp_point 1.5s ease-in-out infinite; transform-origin: 30px 52px; }
.sp_rot  { animation: sp_spin 4s linear infinite; transform-origin: 130px 55px; }
.sp_slide{ animation: sp_slide 3s ease-in-out infinite; }
</style>
<rect width="180" height="120" fill="#18181b"/>
<g class="sp_g">
  <circle cx="30" cy="40" r="6" fill="none" stroke="#e4e4e7" stroke-width="2"/>
  <line x1="30" y1="46" x2="30" y2="65" stroke="#e4e4e7" stroke-width="2"/>
  <line class="sp_arm" x1="30" y1="52" x2="50" y2="45" stroke="#e4e4e7" stroke-width="2"/>
  <line x1="30" y1="52" x2="18" y2="58" stroke="#e4e4e7" stroke-width="2"/>
  <line x1="23" y1="79" x2="30" y2="65" stroke="#e4e4e7" stroke-width="2"/>
  <line x1="30" y1="65" x2="37" y2="79" stroke="#e4e4e7" stroke-width="2"/>
</g>
<rect x="60" y="35" width="40" height="40" rx="2" fill="none" stroke="#60a5fa" stroke-width="1" stroke-dasharray="3,2"/>
<g class="sp_slide">
  <polygon points="60,55 80,35 80,55" fill="#60a5fa" opacity="0.3" stroke="#60a5fa" stroke-width="1.5"/>
</g>
<g class="sp_rot">
  <polygon points="130,40 145,55 130,70 115,55" fill="none" stroke="#f59e0b" stroke-width="1.5"/>
</g>
<text x="100" y="110" font-size="7" fill="#71717a" text-anchor="middle">rotate to fit</text>
</svg>`

const SVG_PROBABILITY = `<svg viewBox="0 0 180 120" xmlns="http://www.w3.org/2000/svg">
<style>
@keyframes pr_shake { 0%,100%{transform:translateX(-3px)} 50%{transform:translateX(3px)} }
@keyframes pr_roll  { 0%,20%{transform:rotate(0) translateY(0)} 40%{transform:rotate(180deg) translateY(-15px)} 60%,100%{transform:rotate(360deg) translateY(0)} }
@keyframes pr_arm   { 0%,100%{transform:rotate(-25deg)} 50%{transform:rotate(25deg)} }
.pr_g   { animation: pr_shake 0.4s ease-in-out infinite; transform-origin: 25px 55px; }
.pr_arm { animation: pr_arm 0.4s ease-in-out infinite; transform-origin: 25px 52px; }
.pr_die { animation: pr_roll 2s ease-in-out infinite; transform-origin: 100px 55px; }
</style>
<rect width="180" height="120" fill="#18181b"/>
<g class="pr_g">
  <circle cx="25" cy="40" r="6" fill="none" stroke="#e4e4e7" stroke-width="2"/>
  <line x1="25" y1="46" x2="25" y2="65" stroke="#e4e4e7" stroke-width="2"/>
  <line class="pr_arm" x1="25" y1="52" x2="40" y2="40" stroke="#e4e4e7" stroke-width="2"/>
  <line x1="25" y1="52" x2="14" y2="55" stroke="#e4e4e7" stroke-width="2"/>
  <line x1="19" y1="79" x2="25" y2="65" stroke="#e4e4e7" stroke-width="2"/>
  <line x1="25" y1="65" x2="31" y2="79" stroke="#e4e4e7" stroke-width="2"/>
</g>
<g class="pr_die">
  <rect x="88" y="43" width="24" height="24" rx="3" fill="none" stroke="#e4e4e7" stroke-width="2"/>
  <circle cx="96" cy="51" r="2" fill="#e4e4e7"/>
  <circle cx="104" cy="59" r="2" fill="#e4e4e7"/>
  <circle cx="100" cy="55" r="2" fill="#e4e4e7"/>
</g>
<line x1="125" y1="85" x2="170" y2="85" stroke="#71717a" stroke-width="1"/>
<rect x="128" y="70" width="10" height="15" fill="#60a5fa" opacity="0.6" rx="1"/>
<rect x="142" y="55" width="10" height="30" fill="#60a5fa" opacity="0.8" rx="1"/>
<rect x="156" y="62" width="10" height="23" fill="#60a5fa" opacity="0.7" rx="1"/>
<text x="90" y="110" font-size="7" fill="#71717a" text-anchor="middle">roll and track results</text>
</svg>`

const SVG_PATH_OPT = `<svg viewBox="0 0 180 120" xmlns="http://www.w3.org/2000/svg">
<style>
@keyframes po_walk { 0%{offset-distance:0%} 100%{offset-distance:100%} }
@keyframes po_glow { 0%,100%{stroke:#60a5fa} 50%{stroke:#22c55e} }
@keyframes po_legA { 0%,100%{transform:rotate(-15deg)} 50%{transform:rotate(15deg)} }
@keyframes po_legB { 0%,100%{transform:rotate(15deg)} 50%{transform:rotate(-15deg)} }
.po_path { animation: po_glow 2s ease-in-out infinite; }
.po_walker { animation: po_walk 4s linear infinite; offset-path: path("M 30 80 L 70 40 L 120 60 L 155 30"); }
.po_legA { animation: po_legA 0.4s linear infinite; transform-origin: center; transform-box: fill-box; }
.po_legB { animation: po_legB 0.4s linear infinite; transform-origin: center; transform-box: fill-box; }
</style>
<rect width="180" height="120" fill="#18181b"/>
<circle cx="30" cy="80" r="5" fill="#60a5fa" opacity="0.5"/>
<circle cx="70" cy="40" r="5" fill="#60a5fa" opacity="0.5"/>
<circle cx="120" cy="60" r="5" fill="#60a5fa" opacity="0.5"/>
<circle cx="155" cy="30" r="5" fill="#22c55e" opacity="0.7"/>
<line x1="30" y1="80" x2="70" y2="40" stroke="#71717a" stroke-width="1" stroke-dasharray="3,2"/>
<line x1="70" y1="40" x2="120" y2="60" stroke="#71717a" stroke-width="1" stroke-dasharray="3,2"/>
<line x1="120" y1="60" x2="155" y2="30" stroke="#71717a" stroke-width="1" stroke-dasharray="3,2"/>
<path class="po_path" d="M 30 80 L 70 40 L 120 60 L 155 30" fill="none" stroke="#60a5fa" stroke-width="2"/>
<text x="45" y="55" font-size="7" fill="#f59e0b" font-family="monospace">5</text>
<text x="90" y="45" font-size="7" fill="#f59e0b" font-family="monospace">7</text>
<text x="140" y="40" font-size="7" fill="#f59e0b" font-family="monospace">4</text>
<g class="po_walker">
  <circle cx="0" cy="-5" r="3" fill="none" stroke="#e4e4e7" stroke-width="1.5"/>
  <line x1="0" y1="-2" x2="0" y2="5" stroke="#e4e4e7" stroke-width="1.5"/>
  <line x1="0" y1="0" x2="-4" y2="3" stroke="#e4e4e7" stroke-width="1.5"/>
  <line x1="0" y1="0" x2="4" y2="3" stroke="#e4e4e7" stroke-width="1.5"/>
  <line class="po_legA" x1="0" y1="5" x2="-3" y2="11" stroke="#e4e4e7" stroke-width="1.5"/>
  <line class="po_legB" x1="0" y1="5" x2="3" y2="11" stroke="#e4e4e7" stroke-width="1.5"/>
</g>
<text x="90" y="110" font-size="7" fill="#71717a" text-anchor="middle">find the best path</text>
</svg>`

const SVG_CONSTRUCTION = `<svg viewBox="0 0 180 120" xmlns="http://www.w3.org/2000/svg">
<style>
@keyframes cs_lift { 0%,30%{transform:translateY(0)} 50%{transform:translateY(-12px)} 70%,100%{transform:translateY(0)} }
@keyframes cs_arm  { 0%,30%{transform:rotate(0deg)} 50%{transform:rotate(-30deg)} 70%,100%{transform:rotate(0deg)} }
@keyframes cs_stack{ 0%,30%{transform:translateY(0);opacity:1} 50%{transform:translateY(-22px);opacity:0.6} 70%,100%{transform:translateY(-22px);opacity:1} }
.cs_g    { animation: cs_lift 3s ease-in-out infinite; transform-origin: 30px 60px; }
.cs_arm  { animation: cs_arm 3s ease-in-out infinite; transform-origin: 30px 48px; }
.cs_b3   { animation: cs_stack 3s ease-in-out infinite; }
</style>
<rect width="180" height="120" fill="#18181b"/>
<g class="cs_g">
  <circle cx="30" cy="35" r="6" fill="none" stroke="#e4e4e7" stroke-width="2"/>
  <line x1="30" y1="41" x2="30" y2="60" stroke="#e4e4e7" stroke-width="2"/>
  <line class="cs_arm" x1="30" y1="48" x2="48" y2="42" stroke="#e4e4e7" stroke-width="2"/>
  <line x1="30" y1="48" x2="18" y2="52" stroke="#e4e4e7" stroke-width="2"/>
  <line x1="23" y1="74" x2="30" y2="60" stroke="#e4e4e7" stroke-width="2"/>
  <line x1="30" y1="60" x2="37" y2="74" stroke="#e4e4e7" stroke-width="2"/>
</g>
<rect x="65" y="65" width="20" height="20" fill="#60a5fa" opacity="0.3" stroke="#60a5fa" stroke-width="1"/>
<rect x="85" y="65" width="20" height="20" fill="#60a5fa" opacity="0.3" stroke="#60a5fa" stroke-width="1"/>
<rect x="65" y="45" width="20" height="20" fill="#60a5fa" opacity="0.3" stroke="#60a5fa" stroke-width="1"/>
<rect x="85" y="45" width="20" height="20" fill="#60a5fa" opacity="0.3" stroke="#60a5fa" stroke-width="1"/>
<rect class="cs_b3" x="105" y="65" width="20" height="20" fill="#f59e0b" opacity="0.5" stroke="#f59e0b" stroke-width="1"/>
<line x1="63" y1="90" x2="107" y2="90" stroke="#f59e0b" stroke-width="1"/>
<text x="85" y="100" font-size="7" fill="#f59e0b" text-anchor="middle" font-family="monospace">2 x 3</text>
<text x="140" y="75" font-size="7" fill="#f59e0b" text-anchor="middle">area = 6</text>
</svg>`

const SVG_MOTION = `<svg viewBox="0 0 180 120" xmlns="http://www.w3.org/2000/svg">
<style>
@keyframes mo_run    { 0%{transform:translateX(0)} 100%{transform:translateX(110px)} }
@keyframes mo_legA   { 0%,100%{transform:rotate(-30deg)} 50%{transform:rotate(30deg)} }
@keyframes mo_legB   { 0%,100%{transform:rotate(30deg)}  50%{transform:rotate(-30deg)} }
@keyframes mo_armA   { 0%,100%{transform:rotate(30deg)}  50%{transform:rotate(-30deg)} }
@keyframes mo_armB   { 0%,100%{transform:rotate(-30deg)} 50%{transform:rotate(30deg)} }
.mo_g    { animation: mo_run 3s linear infinite; }
.mo_legA { animation: mo_legA 0.3s linear infinite; transform-origin: 15px 75px; }
.mo_legB { animation: mo_legB 0.3s linear infinite; transform-origin: 15px 75px; }
.mo_armA { animation: mo_armA 0.3s linear infinite; transform-origin: 15px 65px; }
.mo_armB { animation: mo_armB 0.3s linear infinite; transform-origin: 15px 65px; }
</style>
<rect width="180" height="120" fill="#18181b"/>
<line x1="15" y1="80" x2="165" y2="80" stroke="#71717a" stroke-width="1"/>
<line x1="15" y1="78" x2="15" y2="82" stroke="#71717a" stroke-width="1"/>
<line x1="65" y1="78" x2="65" y2="82" stroke="#71717a" stroke-width="1"/>
<line x1="115" y1="78" x2="115" y2="82" stroke="#71717a" stroke-width="1"/>
<line x1="165" y1="78" x2="165" y2="82" stroke="#71717a" stroke-width="1"/>
<text x="15" y="92" font-size="6" fill="#71717a" text-anchor="middle">0</text>
<text x="65" y="92" font-size="6" fill="#71717a" text-anchor="middle">10</text>
<text x="115" y="92" font-size="6" fill="#71717a" text-anchor="middle">20</text>
<text x="165" y="92" font-size="6" fill="#71717a" text-anchor="middle">30m</text>
<g class="mo_g">
  <circle cx="15" cy="55" r="6" fill="none" stroke="#e4e4e7" stroke-width="2"/>
  <line x1="15" y1="61" x2="15" y2="75" stroke="#e4e4e7" stroke-width="2"/>
  <line class="mo_armA" x1="15" y1="65" x2="22" y2="72" stroke="#e4e4e7" stroke-width="2"/>
  <line class="mo_armB" x1="15" y1="65" x2="8" y2="72" stroke="#e4e4e7" stroke-width="2"/>
  <line class="mo_legA" x1="15" y1="75" x2="22" y2="80" stroke="#e4e4e7" stroke-width="2"/>
  <line class="mo_legB" x1="15" y1="75" x2="8" y2="80" stroke="#e4e4e7" stroke-width="2"/>
</g>
<rect x="55" y="20" width="70" height="20" rx="4" fill="none" stroke="#60a5fa" stroke-width="1"/>
<text x="90" y="33" font-size="8" fill="#60a5fa" text-anchor="middle" font-family="monospace">10 m/sec</text>
<text x="90" y="110" font-size="7" fill="#71717a" text-anchor="middle">speed = distance / time</text>
</svg>`

const SVG_CONSTRAINT = `<svg viewBox="0 0 180 120" xmlns="http://www.w3.org/2000/svg">
<style>
@keyframes cn_nod   { 0%,100%{transform:rotate(-3deg)} 50%{transform:rotate(3deg)} }
@keyframes cn_scratch { 0%,100%{transform:rotate(-15deg)} 50%{transform:rotate(15deg)} }
@keyframes cn_cross { 0%,60%{opacity:0} 70%,100%{opacity:1} }
@keyframes cn_hilite{ 0%,70%{stroke:#60a5fa} 80%,100%{stroke:#22c55e;fill:rgba(34,197,94,0.15)} }
.cn_g     { animation: cn_nod 2s ease-in-out infinite; transform-origin: 25px 60px; }
.cn_arm   { animation: cn_scratch 1s ease-in-out infinite; transform-origin: 25px 52px; }
.cn_cross { animation: cn_cross 3s ease-in-out infinite; }
.cn_ans   { animation: cn_hilite 3s ease-in-out infinite; }
</style>
<rect width="180" height="120" fill="#18181b"/>
<g class="cn_g">
  <circle cx="25" cy="40" r="6" fill="none" stroke="#e4e4e7" stroke-width="2"/>
  <line x1="25" y1="46" x2="25" y2="62" stroke="#e4e4e7" stroke-width="2"/>
  <line class="cn_arm" x1="25" y1="52" x2="32" y2="40" stroke="#e4e4e7" stroke-width="2"/>
  <line x1="25" y1="52" x2="14" y2="55" stroke="#e4e4e7" stroke-width="2"/>
  <line x1="19" y1="76" x2="25" y2="62" stroke="#e4e4e7" stroke-width="2"/>
  <line x1="25" y1="62" x2="31" y2="76" stroke="#e4e4e7" stroke-width="2"/>
</g>
<rect x="55" y="30" width="30" height="22" rx="3" fill="none" stroke="#60a5fa" stroke-width="1.5"/>
<text x="70" y="45" font-size="10" fill="#60a5fa" text-anchor="middle" font-family="monospace">A</text>
<rect x="95" y="30" width="30" height="22" rx="3" fill="none" stroke="#60a5fa" stroke-width="1.5"/>
<text x="110" y="45" font-size="10" fill="#60a5fa" text-anchor="middle" font-family="monospace">B</text>
<rect class="cn_ans" x="135" y="30" width="30" height="22" rx="3" fill="none" stroke-width="1.5"/>
<text x="150" y="45" font-size="10" fill="#60a5fa" text-anchor="middle" font-family="monospace">C</text>
<line class="cn_cross" x1="55" y1="30" x2="85" y2="52" stroke="#fb7185" stroke-width="2"/>
<line class="cn_cross" x1="85" y1="30" x2="55" y2="52" stroke="#fb7185" stroke-width="2"/>
<line class="cn_cross" x1="95" y1="30" x2="125" y2="52" stroke="#fb7185" stroke-width="2" style="animation-delay:0.3s"/>
<line class="cn_cross" x1="125" y1="30" x2="95" y2="52" stroke="#fb7185" stroke-width="2" style="animation-delay:0.3s"/>
<text x="110" y="75" font-size="7" fill="#71717a" text-anchor="middle">rule: must be &gt; 5</text>
<text x="90" y="110" font-size="7" fill="#71717a" text-anchor="middle">eliminate wrong answers</text>
</svg>`

const SVG_STRATEGY = `<svg viewBox="0 0 180 120" xmlns="http://www.w3.org/2000/svg">
<style>
@keyframes st_grow  { 0%{stroke-dashoffset:100} 100%{stroke-dashoffset:0} }
@keyframes st_pop1  { 0%,30%{r:0} 40%,100%{r:3} }
@keyframes st_pop2  { 0%,50%{r:0} 60%,100%{r:3} }
@keyframes st_pop3  { 0%,70%{r:0} 80%,100%{r:3} }
@keyframes st_excite{ 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
@keyframes st_wave1 { 0%,100%{transform:rotate(-30deg)} 50%{transform:rotate(-60deg)} }
@keyframes st_wave2 { 0%,100%{transform:rotate(30deg)} 50%{transform:rotate(60deg)} }
.st_g     { animation: st_excite 0.6s ease-in-out infinite; transform-origin: 18px 95px; }
.st_armA  { animation: st_wave1 0.6s ease-in-out infinite; transform-origin: 18px 80px; }
.st_armB  { animation: st_wave2 0.6s ease-in-out infinite; transform-origin: 18px 80px; }
.st_curve { stroke-dasharray: 100; animation: st_grow 3s ease-out infinite; }
.st_d1    { animation: st_pop1 3s ease-out infinite; }
.st_d2    { animation: st_pop2 3s ease-out infinite; }
.st_d3    { animation: st_pop3 3s ease-out infinite; }
</style>
<rect width="180" height="120" fill="#18181b"/>
<line x1="35" y1="100" x2="170" y2="100" stroke="#71717a" stroke-width="1"/>
<line x1="35" y1="100" x2="35" y2="20" stroke="#71717a" stroke-width="1"/>
<path class="st_curve" d="M 35 95 Q 65 90 85 80 Q 105 65 125 45 Q 145 22 165 18" fill="none" stroke="#60a5fa" stroke-width="2"/>
<circle class="st_d1" cx="85" cy="80" r="0" fill="#f59e0b"/>
<circle class="st_d2" cx="125" cy="45" r="0" fill="#f59e0b"/>
<circle class="st_d3" cx="165" cy="18" r="0" fill="#f59e0b"/>
<text x="85" y="112" font-size="6" fill="#71717a" text-anchor="middle">1x</text>
<text x="125" y="112" font-size="6" fill="#71717a" text-anchor="middle">2x</text>
<text x="165" y="112" font-size="6" fill="#71717a" text-anchor="middle">4x</text>
<g class="st_g">
  <circle cx="18" cy="70" r="6" fill="none" stroke="#e4e4e7" stroke-width="2"/>
  <line x1="18" y1="76" x2="18" y2="92" stroke="#e4e4e7" stroke-width="2"/>
  <line class="st_armA" x1="18" y1="80" x2="32" y2="70" stroke="#e4e4e7" stroke-width="2"/>
  <line class="st_armB" x1="18" y1="80" x2="4" y2="70" stroke="#e4e4e7" stroke-width="2"/>
  <line x1="14" y1="106" x2="18" y2="92" stroke="#e4e4e7" stroke-width="2"/>
  <line x1="18" y1="92" x2="22" y2="106" stroke="#e4e4e7" stroke-width="2"/>
</g>
</svg>`

const SVG_MEASURE = `<svg viewBox="0 0 180 120" xmlns="http://www.w3.org/2000/svg">
<style>
@keyframes me_meas { 0%,100%{transform:translateX(0)} 50%{transform:translateX(35px)} }
@keyframes me_lean { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-1px)} }
@keyframes me_arm  { 0%,100%{transform:rotate(0)} 50%{transform:rotate(15deg)} }
.me_g    { animation: me_lean 1.2s ease-in-out infinite; transform-origin: 25px 65px; }
.me_arm  { animation: me_arm 2.5s ease-in-out infinite; transform-origin: 25px 56px; }
.me_ruler{ animation: me_meas 2.5s ease-in-out infinite; }
</style>
<rect width="180" height="120" fill="#18181b"/>
<g class="me_g">
  <circle cx="25" cy="45" r="6" fill="none" stroke="#e4e4e7" stroke-width="2"/>
  <line x1="25" y1="51" x2="25" y2="68" stroke="#e4e4e7" stroke-width="2"/>
  <line class="me_arm" x1="25" y1="56" x2="42" y2="48" stroke="#e4e4e7" stroke-width="2"/>
  <line x1="25" y1="56" x2="14" y2="60" stroke="#e4e4e7" stroke-width="2"/>
  <line x1="19" y1="82" x2="25" y2="68" stroke="#e4e4e7" stroke-width="2"/>
  <line x1="25" y1="68" x2="31" y2="82" stroke="#e4e4e7" stroke-width="2"/>
</g>
<g class="me_ruler">
  <rect x="50" y="52" width="80" height="8" rx="1" fill="none" stroke="#f59e0b" stroke-width="1.5"/>
  <line x1="50" y1="52" x2="50" y2="56" stroke="#f59e0b" stroke-width="1"/>
  <line x1="60" y1="52" x2="60" y2="54" stroke="#f59e0b" stroke-width="1"/>
  <line x1="70" y1="52" x2="70" y2="56" stroke="#f59e0b" stroke-width="1"/>
  <line x1="80" y1="52" x2="80" y2="54" stroke="#f59e0b" stroke-width="1"/>
  <line x1="90" y1="52" x2="90" y2="56" stroke="#f59e0b" stroke-width="1"/>
  <line x1="100" y1="52" x2="100" y2="54" stroke="#f59e0b" stroke-width="1"/>
  <line x1="110" y1="52" x2="110" y2="56" stroke="#f59e0b" stroke-width="1"/>
  <line x1="120" y1="52" x2="120" y2="54" stroke="#f59e0b" stroke-width="1"/>
  <line x1="130" y1="52" x2="130" y2="56" stroke="#f59e0b" stroke-width="1"/>
</g>
<rect x="55" y="72" width="35" height="12" rx="3" fill="#60a5fa" opacity="0.4" stroke="#60a5fa" stroke-width="1"/>
<rect x="100" y="72" width="55" height="12" rx="3" fill="#60a5fa" opacity="0.4" stroke="#60a5fa" stroke-width="1"/>
<text x="72" y="98" font-size="7" fill="#60a5fa" text-anchor="middle" font-family="monospace">3.5</text>
<text x="127" y="98" font-size="7" fill="#60a5fa" text-anchor="middle" font-family="monospace">5.5</text>
<text x="90" y="115" font-size="7" fill="#71717a" text-anchor="middle">measure and compare</text>
</svg>`

// Score & Rank — 12-second animation showing the verb "mark positions
// on a number line". The figure walks to each target in turn and
// PLANTS a flag from its raised arm. The flag visually emerges from
// the figure's hand position, not its trunk.
//
// Stages (12s total):
//   0.0-3.0s  start at 0, walk to position 4, plant flag from arm
//   3.0-6.0s  walk from 4 to position 7, plant flag from arm
//   6.0-9.0s  walk from 7 to position 2, plant flag from arm
//   9.0-12s   walk to a parking spot at position 0, stay in frame
//
// Figure starts at translateX(0) (body x=15, position 0). Target
// positions: 4=(60), 7=(105), 2=(30). Each arrival also raises the
// arm (sf_arm) which carries the flag.
const SVG_SCORING = `<svg viewBox="0 0 180 120" xmlns="http://www.w3.org/2000/svg">
<style>
  /* Walk: 4 segments, each 25% of the cycle. Smooth ease so the gait
     looks like a deliberate walk (not a flop). */
  @keyframes sf_walk {
    0%       { transform: translateX(0) }
    20%,25%  { transform: translateX(60px) }
    45%,50%  { transform: translateX(105px) }
    70%,75%  { transform: translateX(30px) }
    95%,100% { transform: translateX(0) }
  }
  /* Subtle leg swing; small angles so it doesn't look frantic. */
  @keyframes sf_leg_a { 0%,100%{transform:rotate(-15deg)} 50%{transform:rotate(15deg)} }
  @keyframes sf_leg_b { 0%,100%{transform:rotate(15deg)} 50%{transform:rotate(-15deg)} }
  /* Tiny bob; small range so it doesn't look like flopping. */
  @keyframes sf_bob   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-1px)} }

  /* Arm raises (holding flag) only while the figure is AT a target,
     i.e. the brief plateau in sf_walk. The rest of the time the arm
     hangs at the side. */
  @keyframes sf_arm {
    0%,18%   { transform: rotate(0deg) }
    21%,25%  { transform: rotate(-90deg) }
    27%,43%  { transform: rotate(0deg) }
    46%,50%  { transform: rotate(-90deg) }
    52%,68%  { transform: rotate(0deg) }
    71%,75%  { transform: rotate(-90deg) }
    77%,100% { transform: rotate(0deg) }
  }

  /* Carried flag — visible only when the arm is raised. Hidden when
     the arm hangs at the side (otherwise it'd float in the air). */
  @keyframes sf_carry_flag {
    0%,18%   { opacity: 0 }
    21%,25%  { opacity: 1 }
    27%,43%  { opacity: 0 }
    46%,50%  { opacity: 1 }
    52%,68%  { opacity: 0 }
    71%,75%  { opacity: 1 }
    77%,100% { opacity: 0 }
  }

  /* Each PLANTED flag stays after its drop moment. The flag appears
     just AFTER the figure raises its arm at the target — visually
     the flag transfers from the hand to the ground. */
  @keyframes sf_planted1 { 0%,25%{opacity:0} 26%,100%{opacity:1} }
  @keyframes sf_planted2 { 0%,50%{opacity:0} 51%,100%{opacity:1} }
  @keyframes sf_planted3 { 0%,75%{opacity:0} 76%,100%{opacity:1} }

  /* Target labels at the top — change as the figure moves between targets */
  @keyframes sf_t1 { 0%,25%{opacity:1} 26%,100%{opacity:0} }
  @keyframes sf_t2 { 0%,25%{opacity:0} 26%,50%{opacity:1} 51%,100%{opacity:0} }
  @keyframes sf_t3 { 0%,50%{opacity:0} 51%,75%{opacity:1} 76%,100%{opacity:0} }

  .sf_g       { animation: sf_walk 12s ease-in-out infinite; }
  .sf_bob     { animation: sf_bob 0.9s ease-in-out infinite; }
  .sf_leg_a   { animation: sf_leg_a 0.9s ease-in-out infinite; }
  .sf_leg_b   { animation: sf_leg_b 0.9s ease-in-out infinite; }
  .sf_arm     { animation: sf_arm 12s ease-in-out infinite; transform-origin: 15px 65px; }
  .sf_carry_flag { animation: sf_carry_flag 12s step-end infinite; }
  .sf_planted1 { animation: sf_planted1 12s step-end infinite; }
  .sf_planted2 { animation: sf_planted2 12s step-end infinite; }
  .sf_planted3 { animation: sf_planted3 12s step-end infinite; }
  .sf_t1      { animation: sf_t1 12s step-end infinite; }
  .sf_t2      { animation: sf_t2 12s step-end infinite; }
  .sf_t3      { animation: sf_t3 12s step-end infinite; }
</style>
<rect width="180" height="120" fill="#18181b"/>

<!-- Number line 0 to 10 -->
<line x1="15" y1="80" x2="165" y2="80" stroke="#71717a" stroke-width="1.5"/>
<g stroke="#71717a" stroke-width="1">
  <line x1="15" y1="76" x2="15" y2="84"/>
  <line x1="30" y1="78" x2="30" y2="82"/>
  <line x1="45" y1="76" x2="45" y2="84"/>
  <line x1="60" y1="78" x2="60" y2="82"/>
  <line x1="75" y1="76" x2="75" y2="84"/>
  <line x1="90" y1="78" x2="90" y2="82"/>
  <line x1="105" y1="76" x2="105" y2="84"/>
  <line x1="120" y1="78" x2="120" y2="82"/>
  <line x1="135" y1="76" x2="135" y2="84"/>
  <line x1="150" y1="78" x2="150" y2="82"/>
  <line x1="165" y1="76" x2="165" y2="84"/>
</g>
<g font-size="7" fill="#a1a1aa" text-anchor="middle" font-family="monospace">
  <text x="15" y="95">0</text>
  <text x="45" y="95">2</text>
  <text x="75" y="95">4</text>
  <text x="105" y="95">6</text>
  <text x="135" y="95">8</text>
  <text x="165" y="95">10</text>
</g>

<!-- Target callouts -->
<text class="sf_t1" x="90" y="22" font-size="11" fill="#fbbf24" text-anchor="middle" font-family="monospace">mark → 4</text>
<text class="sf_t2" x="90" y="22" font-size="11" fill="#fbbf24" text-anchor="middle" font-family="monospace">mark → 7</text>
<text class="sf_t3" x="90" y="22" font-size="11" fill="#fbbf24" text-anchor="middle" font-family="monospace">mark → 2</text>

<!-- PLANTED flags at each target. They appear after the figure plants
     them. Static positions on the number line. -->
<g class="sf_planted1">
  <line x1="75" y1="62" x2="75" y2="78" stroke="#22c55e" stroke-width="1.5"/>
  <polygon points="75,62 83,65 75,68" fill="#22c55e"/>
</g>
<g class="sf_planted2">
  <line x1="120" y1="62" x2="120" y2="78" stroke="#22c55e" stroke-width="1.5"/>
  <polygon points="120,62 128,65 120,68" fill="#22c55e"/>
</g>
<g class="sf_planted3">
  <line x1="45" y1="62" x2="45" y2="78" stroke="#22c55e" stroke-width="1.5"/>
  <polygon points="45,62 53,65 45,68" fill="#22c55e"/>
</g>

<!-- The figure walks to each target. When it raises its arm at a
     target, the carried flag is briefly visible in its hand —
     transferring to the planted flag at the same moment. -->
<g class="sf_g">
  <g class="sf_bob">
    <circle cx="15" cy="55" r="6" fill="none" stroke="#e4e4e7" stroke-width="2"/>
    <line x1="15" y1="61" x2="15" y2="75" stroke="#e4e4e7" stroke-width="2"/>
    <!-- Right arm: animated (raises to plant). The carried flag is a
         child of this group so it rotates WITH the arm. -->
    <g class="sf_arm">
      <line x1="15" y1="65" x2="22" y2="72" stroke="#e4e4e7" stroke-width="2"/>
      <!-- Carried flag: positioned at the hand (22, 72) when arm is
           horizontal, swings up to (22, 50ish) when arm is vertical. -->
      <g class="sf_carry_flag">
        <line x1="22" y1="62" x2="22" y2="74" stroke="#22c55e" stroke-width="1.5"/>
        <polygon points="22,62 30,65 22,68" fill="#22c55e"/>
      </g>
    </g>
    <!-- Left arm: static -->
    <line x1="15" y1="65" x2="8" y2="72" stroke="#e4e4e7" stroke-width="2"/>
    <g class="sf_leg_a" style="transform-origin: 15px 75px;">
      <line x1="15" y1="75" x2="15" y2="86" stroke="#e4e4e7" stroke-width="2"/>
    </g>
    <g class="sf_leg_b" style="transform-origin: 15px 75px;">
      <line x1="15" y1="75" x2="15" y2="86" stroke="#e4e4e7" stroke-width="2"/>
    </g>
  </g>
</g>

<text x="90" y="113" font-size="7" fill="#71717a" text-anchor="middle">mark positions on a number line</text>
</svg>`

const SVG_TIMING = `<svg viewBox="0 0 180 120" xmlns="http://www.w3.org/2000/svg">
<style>
@keyframes ti_b1  { 0%,100%{r:5;opacity:0.5} 10%,20%{r:8;opacity:1} }
@keyframes ti_b2  { 0%,100%{r:5;opacity:0.5} 30%,40%{r:8;opacity:1} }
@keyframes ti_b3  { 0%,100%{r:5;opacity:0.5} 50%,60%{r:8;opacity:1} }
@keyframes ti_b4  { 0%,100%{r:5;opacity:0.5} 70%,80%{r:8;opacity:1} }
@keyframes ti_nod { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-2px)} }
@keyframes ti_tap { 0%,10%{transform:rotate(-30deg)} 20%,30%{transform:rotate(0deg)} }
.ti_g   { animation: ti_nod 0.5s linear infinite; transform-origin: 25px 65px; }
.ti_arm { animation: ti_tap 2s linear infinite; transform-origin: 25px 52px; }
.ti_1   { animation: ti_b1 2s linear infinite; }
.ti_2   { animation: ti_b2 2s linear infinite; }
.ti_3   { animation: ti_b3 2s linear infinite; }
.ti_4   { animation: ti_b4 2s linear infinite; }
</style>
<rect width="180" height="120" fill="#18181b"/>
<g class="ti_g">
  <circle cx="25" cy="40" r="6" fill="none" stroke="#e4e4e7" stroke-width="2"/>
  <line x1="25" y1="46" x2="25" y2="65" stroke="#e4e4e7" stroke-width="2"/>
  <line class="ti_arm" x1="25" y1="52" x2="35" y2="40" stroke="#e4e4e7" stroke-width="2"/>
  <line x1="25" y1="52" x2="14" y2="55" stroke="#e4e4e7" stroke-width="2"/>
  <line x1="19" y1="79" x2="25" y2="65" stroke="#e4e4e7" stroke-width="2"/>
  <line x1="25" y1="65" x2="31" y2="79" stroke="#e4e4e7" stroke-width="2"/>
</g>
<circle class="ti_1" cx="55" cy="45" r="5" fill="#60a5fa"/>
<circle class="ti_2" cx="80" cy="45" r="5" fill="#f59e0b"/>
<circle class="ti_3" cx="105" cy="45" r="5" fill="#60a5fa"/>
<circle class="ti_4" cx="130" cy="45" r="5" fill="#f59e0b"/>
<circle cx="155" cy="45" r="7" fill="none" stroke="#71717a" stroke-width="1.5" stroke-dasharray="3,2"/>
<text x="155" y="48" font-size="10" fill="#71717a" text-anchor="middle">?</text>
<text x="55" y="65" font-size="7" fill="#60a5fa" text-anchor="middle">A</text>
<text x="80" y="65" font-size="7" fill="#f59e0b" text-anchor="middle">B</text>
<text x="105" y="65" font-size="7" fill="#60a5fa" text-anchor="middle">A</text>
<text x="130" y="65" font-size="7" fill="#f59e0b" text-anchor="middle">B</text>
<text x="155" y="65" font-size="7" fill="#71717a" text-anchor="middle">?</text>
<text x="90" y="110" font-size="7" fill="#71717a" text-anchor="middle">find the pattern</text>
</svg>`

const SVG_SCALING = `<svg viewBox="0 0 180 120" xmlns="http://www.w3.org/2000/svg">
<style>
@keyframes sg_scale { 0%,100%{transform:scale(1)} 50%{transform:scale(1.4)} }
@keyframes sg_shrink{ 0%,100%{transform:scale(0.8)} 50%{transform:scale(1.0)} }
@keyframes sg_arm   { 0%,100%{transform:rotate(0)} 50%{transform:rotate(20deg)} }
.sg_g    { animation: sg_shrink 2.5s ease-in-out infinite; transform-origin: 25px 78px; }
.sg_arm  { animation: sg_arm 2.5s ease-in-out infinite; transform-origin: 25px 60px; }
.sg_big  { animation: sg_scale 2.5s ease-in-out infinite; transform-origin: 120px 55px; }
</style>
<rect width="180" height="120" fill="#18181b"/>
<g class="sg_g">
  <circle cx="25" cy="48" r="6" fill="none" stroke="#e4e4e7" stroke-width="2"/>
  <line x1="25" y1="54" x2="25" y2="72" stroke="#e4e4e7" stroke-width="2"/>
  <line class="sg_arm" x1="25" y1="60" x2="42" y2="55" stroke="#e4e4e7" stroke-width="2"/>
  <line x1="25" y1="60" x2="14" y2="62" stroke="#e4e4e7" stroke-width="2"/>
  <line x1="19" y1="84" x2="25" y2="72" stroke="#e4e4e7" stroke-width="2"/>
  <line x1="25" y1="72" x2="31" y2="84" stroke="#e4e4e7" stroke-width="2"/>
</g>
<rect x="55" y="50" width="20" height="30" rx="2" fill="none" stroke="#60a5fa" stroke-width="1.5"/>
<text x="65" y="92" font-size="6" fill="#71717a" text-anchor="middle">1x</text>
<line x1="80" y1="65" x2="100" y2="65" stroke="#71717a" stroke-width="1"/>
<polygon points="100,62 107,65 100,68" fill="#71717a"/>
<text x="90" y="58" font-size="7" fill="#f59e0b" text-anchor="middle">x2</text>
<g class="sg_big">
  <rect x="110" y="35" width="30" height="40" rx="2" fill="none" stroke="#f59e0b" stroke-width="1.5"/>
</g>
<text x="125" y="92" font-size="6" fill="#71717a" text-anchor="middle">2x</text>
<text x="90" y="112" font-size="7" fill="#71717a" text-anchor="middle">same shape, different size</text>
</svg>`

const SVG_INVENTORY = `<svg viewBox="0 0 180 120" xmlns="http://www.w3.org/2000/svg">
<style>
@keyframes iv_mL    { 0%,40%{transform:translateX(0)} 60%,100%{transform:translateX(15px)} }
@keyframes iv_mR    { 0%,40%{transform:translateX(0)} 60%,100%{transform:translateX(-15px)} }
@keyframes iv_app   { 0%,70%{opacity:0;transform:scale(0.5)} 80%,100%{opacity:1;transform:scale(1)} }
@keyframes iv_craft { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-2px)} }
@keyframes iv_arm   { 0%,30%{transform:rotate(0deg)} 50%,80%{transform:rotate(-25deg)} }
.iv_g    { animation: iv_craft 1.5s ease-in-out infinite; transform-origin: 25px 90px; }
.iv_arm  { animation: iv_arm 1.5s ease-in-out infinite; transform-origin: 25px 80px; }
.iv_mL   { animation: iv_mL 3s ease-in-out infinite; }
.iv_mR   { animation: iv_mR 3s ease-in-out infinite; }
.iv_res  { animation: iv_app 3s ease-in-out infinite; transform-origin: 140px 50px; }
</style>
<rect width="180" height="120" fill="#18181b"/>
<g class="iv_g">
  <circle cx="25" cy="68" r="5" fill="none" stroke="#e4e4e7" stroke-width="2"/>
  <line x1="25" y1="73" x2="25" y2="88" stroke="#e4e4e7" stroke-width="2"/>
  <line class="iv_arm" x1="25" y1="78" x2="38" y2="65" stroke="#e4e4e7" stroke-width="2"/>
  <line x1="25" y1="78" x2="15" y2="83" stroke="#e4e4e7" stroke-width="2"/>
  <line x1="20" y1="100" x2="25" y2="88" stroke="#e4e4e7" stroke-width="2"/>
  <line x1="25" y1="88" x2="30" y2="100" stroke="#e4e4e7" stroke-width="2"/>
</g>
<g class="iv_mL">
  <rect x="50" y="40" width="18" height="18" rx="3" fill="#60a5fa" opacity="0.5" stroke="#60a5fa" stroke-width="1"/>
  <text x="59" y="52" font-size="8" fill="#e4e4e7" text-anchor="middle">3</text>
</g>
<text x="80" y="52" font-size="12" fill="#71717a" text-anchor="middle">+</text>
<g class="iv_mR">
  <rect x="90" y="40" width="18" height="18" rx="3" fill="#f59e0b" opacity="0.5" stroke="#f59e0b" stroke-width="1"/>
  <text x="99" y="52" font-size="8" fill="#e4e4e7" text-anchor="middle">4</text>
</g>
<text x="118" y="52" font-size="10" fill="#71717a" text-anchor="middle">=</text>
<g class="iv_res">
  <rect x="128" y="36" width="24" height="24" rx="4" fill="#22c55e" opacity="0.3" stroke="#22c55e" stroke-width="1.5"/>
  <text x="140" y="52" font-size="10" fill="#22c55e" text-anchor="middle" font-weight="bold">7</text>
</g>
<text x="100" y="115" font-size="7" fill="#71717a" text-anchor="middle">combine ingredients</text>
</svg>`

const SVG_TERRAIN = `<svg viewBox="0 0 180 120" xmlns="http://www.w3.org/2000/svg">
<style>
@keyframes te_blink { 0%,100%{opacity:0.3} 50%{opacity:1} }
@keyframes te_walk  { 0%{offset-distance:0%} 100%{offset-distance:100%} }
@keyframes te_legA  { 0%,100%{transform:rotate(-20deg)} 50%{transform:rotate(20deg)} }
@keyframes te_legB  { 0%,100%{transform:rotate(20deg)} 50%{transform:rotate(-20deg)} }
.te_t   { animation: te_blink 1.5s ease-in-out infinite; }
.te_w   { animation: te_walk 4s linear infinite; offset-path: path("M 50 80 L 80 65 L 110 50 L 140 35"); }
.te_lA  { animation: te_legA 0.4s linear infinite; transform-origin: center; transform-box: fill-box; }
.te_lB  { animation: te_legB 0.4s linear infinite; transform-origin: center; transform-box: fill-box; }
</style>
<rect width="180" height="120" fill="#18181b"/>
<line x1="35" y1="90" x2="170" y2="90" stroke="#71717a" stroke-width="1"/>
<line x1="35" y1="90" x2="35" y2="20" stroke="#71717a" stroke-width="1"/>
<line x1="65" y1="88" x2="65" y2="20" stroke="#71717a" stroke-width="0.3"/>
<line x1="95" y1="88" x2="95" y2="20" stroke="#71717a" stroke-width="0.3"/>
<line x1="125" y1="88" x2="125" y2="20" stroke="#71717a" stroke-width="0.3"/>
<line x1="155" y1="88" x2="155" y2="20" stroke="#71717a" stroke-width="0.3"/>
<line x1="35" y1="75" x2="170" y2="75" stroke="#71717a" stroke-width="0.3"/>
<line x1="35" y1="60" x2="170" y2="60" stroke="#71717a" stroke-width="0.3"/>
<line x1="35" y1="45" x2="170" y2="45" stroke="#71717a" stroke-width="0.3"/>
<line x1="35" y1="30" x2="170" y2="30" stroke="#71717a" stroke-width="0.3"/>
<text x="100" y="102" font-size="7" fill="#71717a" text-anchor="middle">x</text>
<text x="28" y="55" font-size="7" fill="#71717a" text-anchor="middle">y</text>
<circle class="te_t" cx="140" cy="35" r="4" fill="#f59e0b"/>
<text x="140" y="28" font-size="7" fill="#f59e0b" text-anchor="middle" font-family="monospace">(3,4)</text>
<g class="te_w">
  <circle cx="0" cy="-7" r="3.5" fill="none" stroke="#22c55e" stroke-width="1.5"/>
  <line x1="0" y1="-3.5" x2="0" y2="5" stroke="#22c55e" stroke-width="1.5"/>
  <line x1="0" y1="0" x2="-4" y2="3" stroke="#22c55e" stroke-width="1.5"/>
  <line x1="0" y1="0" x2="4" y2="3" stroke="#22c55e" stroke-width="1.5"/>
  <line class="te_lA" x1="0" y1="5" x2="-3" y2="11" stroke="#22c55e" stroke-width="1.5"/>
  <line class="te_lB" x1="0" y1="5" x2="3" y2="11" stroke="#22c55e" stroke-width="1.5"/>
</g>
<text x="100" y="115" font-size="7" fill="#71717a" text-anchor="middle">navigate the grid</text>
</svg>`

// Bid & Estimate — 10-second animation showing the place-value verb:
// stack blocks into hundreds / tens / ones bins to build a target
// number. Figure on the left walks back and forth (floating gait),
// dropping blocks into each bin until the target number is built.
//
// Stages (target = 234):
//   0-2.5s    drop 2 hundred-blocks into the hundreds bin
//   2.5-5.5s  drop 3 ten-blocks into the tens bin
//   5.5-8.5s  drop 4 one-blocks into the ones bin
//   8.5-10s   the result number "234" lights up green
const SVG_BIDDING = `<svg viewBox="0 0 180 120" xmlns="http://www.w3.org/2000/svg">
<style>
  @keyframes bi_walk { 0%{transform:translateX(0)} 25%,33%{transform:translateX(40px)} 58%,66%{transform:translateX(75px)} 83%,86%{transform:translateX(110px)} 92%,100%{transform:translateX(140px)} }
  @keyframes bi_arm  { 0%,15%{transform:rotate(-50deg)} 22%,30%{transform:rotate(0deg)} 32%,47%{transform:rotate(-50deg)} 54%,62%{transform:rotate(0deg)} 64%,79%{transform:rotate(-50deg)} 86%,100%{transform:rotate(0deg)} }
  @keyframes bi_legA { 0%,100%{transform:rotate(-22deg)} 50%{transform:rotate(22deg)} }
  @keyframes bi_legB { 0%,100%{transform:rotate(22deg)} 50%{transform:rotate(-22deg)} }
  @keyframes bi_bob  { 0%,100%{transform:translateY(-1.5px)} 50%{transform:translateY(1.5px)} }
  /* Block placements — each block fades in at its drop time */
  @keyframes bi_h1 { 0%,5%{opacity:0} 8%,100%{opacity:1} }
  @keyframes bi_h2 { 0%,15%{opacity:0} 18%,100%{opacity:1} }
  @keyframes bi_t1 { 0%,30%{opacity:0} 33%,100%{opacity:1} }
  @keyframes bi_t2 { 0%,40%{opacity:0} 43%,100%{opacity:1} }
  @keyframes bi_t3 { 0%,50%{opacity:0} 53%,100%{opacity:1} }
  @keyframes bi_o1 { 0%,60%{opacity:0} 63%,100%{opacity:1} }
  @keyframes bi_o2 { 0%,67%{opacity:0} 70%,100%{opacity:1} }
  @keyframes bi_o3 { 0%,74%{opacity:0} 77%,100%{opacity:1} }
  @keyframes bi_o4 { 0%,82%{opacity:0} 85%,100%{opacity:1} }
  @keyframes bi_total { 0%,85%{opacity:0;fill:#71717a} 88%,100%{opacity:1;fill:#22c55e} }

  .bi_g    { animation: bi_walk 13s ease-in-out infinite; }
  .bi_bob  { animation: bi_bob 1s ease-in-out infinite; }
  .bi_arm  { animation: bi_arm 13s ease-in-out infinite; transform-origin: 0 -10px; }
  .bi_legA { animation: bi_legA 1s ease-in-out infinite; transform-origin: 0 22px; }
  .bi_legB { animation: bi_legB 1s ease-in-out infinite; transform-origin: 0 22px; }
  .bi_h1   { animation: bi_h1 13s step-end infinite; }
  .bi_h2   { animation: bi_h2 13s step-end infinite; }
  .bi_t1   { animation: bi_t1 13s step-end infinite; }
  .bi_t2   { animation: bi_t2 13s step-end infinite; }
  .bi_t3   { animation: bi_t3 13s step-end infinite; }
  .bi_o1   { animation: bi_o1 13s step-end infinite; }
  .bi_o2   { animation: bi_o2 13s step-end infinite; }
  .bi_o3   { animation: bi_o3 13s step-end infinite; }
  .bi_o4   { animation: bi_o4 13s step-end infinite; }
  .bi_total{ animation: bi_total 13s step-end infinite; }
</style>
<rect width="180" height="120" fill="#18181b"/>

<!-- Three place-value bins: hundreds, tens, ones -->
<rect x="55" y="55" width="22" height="40" rx="2" fill="none" stroke="#71717a" stroke-width="1"/>
<rect x="85" y="55" width="22" height="40" rx="2" fill="none" stroke="#71717a" stroke-width="1"/>
<rect x="115" y="55" width="22" height="40" rx="2" fill="none" stroke="#71717a" stroke-width="1"/>
<text x="66" y="105" font-size="6" fill="#71717a" text-anchor="middle">100s</text>
<text x="96" y="105" font-size="6" fill="#71717a" text-anchor="middle">10s</text>
<text x="126" y="105" font-size="6" fill="#71717a" text-anchor="middle">1s</text>

<!-- Hundred blocks (large squares) -->
<rect class="bi_h1" x="58" y="80" width="16" height="14" fill="#60a5fa" opacity="0.6"/>
<rect class="bi_h2" x="58" y="64" width="16" height="14" fill="#60a5fa" opacity="0.6"/>

<!-- Ten blocks (tall thin) -->
<rect class="bi_t1" x="88" y="78" width="4" height="16" fill="#fbbf24" opacity="0.7"/>
<rect class="bi_t2" x="94" y="78" width="4" height="16" fill="#fbbf24" opacity="0.7"/>
<rect class="bi_t3" x="100" y="78" width="4" height="16" fill="#fbbf24" opacity="0.7"/>

<!-- One blocks (small squares) -->
<rect class="bi_o1" x="118" y="89" width="4" height="4" fill="#22c55e" opacity="0.8"/>
<rect class="bi_o2" x="124" y="89" width="4" height="4" fill="#22c55e" opacity="0.8"/>
<rect class="bi_o3" x="130" y="89" width="4" height="4" fill="#22c55e" opacity="0.8"/>
<rect class="bi_o4" x="118" y="83" width="4" height="4" fill="#22c55e" opacity="0.8"/>

<!-- Target / final number -->
<text x="90" y="35" font-size="13" fill="#71717a" text-anchor="middle" font-family="monospace">build → 234</text>
<text class="bi_total" x="90" y="50" font-size="11" text-anchor="middle" font-family="monospace">2 hundreds + 3 tens + 4 ones</text>

<!-- Figure starts at x=15, walks right to drop each block in turn -->
<g class="bi_g">
  <g class="bi_bob">
    <circle cx="15" cy="55" r="6" fill="none" stroke="#e4e4e7" stroke-width="2"/>
    <line x1="15" y1="61" x2="15" y2="75" stroke="#e4e4e7" stroke-width="2"/>
    <g class="bi_arm" style="transform-origin: 15px 65px;">
      <line x1="15" y1="65" x2="22" y2="72" stroke="#e4e4e7" stroke-width="2"/>
    </g>
    <line x1="15" y1="65" x2="8" y2="72" stroke="#e4e4e7" stroke-width="2"/>
    <g class="bi_legA" style="transform-origin: 15px 75px;">
      <line x1="15" y1="75" x2="15" y2="86" stroke="#e4e4e7" stroke-width="2"/>
    </g>
    <g class="bi_legB" style="transform-origin: 15px 75px;">
      <line x1="15" y1="75" x2="15" y2="86" stroke="#e4e4e7" stroke-width="2"/>
    </g>
  </g>
</g>

<text x="90" y="118" font-size="6" fill="#71717a" text-anchor="middle">stack into place-value bins</text>
</svg>`

// Rise & Fall — vertical number line with 0 marked as sea level. The
// stick figure climbs and dives between +3 and -3, in sync with a
// thermometer's mercury rising and falling. The verb is "move above
// and below zero" — covers signed numbers, integers, and absolute value.
const SVG_RISE_FALL = `<svg viewBox="0 0 180 120" xmlns="http://www.w3.org/2000/svg">
<style>
@keyframes rf_climb { 0%,100%{transform:translateY(-25px)} 50%{transform:translateY(25px)} }
@keyframes rf_armA  { 0%,100%{transform:rotate(140deg)} 50%{transform:rotate(40deg)} }
@keyframes rf_armB  { 0%,100%{transform:rotate(40deg)} 50%{transform:rotate(140deg)} }
@keyframes rf_legA  { 0%,100%{transform:rotate(-15deg)} 50%{transform:rotate(15deg)} }
@keyframes rf_legB  { 0%,100%{transform:rotate(15deg)} 50%{transform:rotate(-15deg)} }
.rf_g    { animation: rf_climb 4s ease-in-out infinite; transform-origin: 100px 60px; }
.rf_aA   { animation: rf_armA 4s ease-in-out infinite; transform-origin: 100px 58px; }
.rf_aB   { animation: rf_armB 4s ease-in-out infinite; transform-origin: 100px 58px; }
.rf_lA   { animation: rf_legA 0.8s ease-in-out infinite; transform-origin: 100px 78px; }
.rf_lB   { animation: rf_legB 0.8s ease-in-out infinite; transform-origin: 100px 78px; }
</style>
<rect width="180" height="120" fill="#18181b"/>

<!-- Vertical number line on the right -->
<line x1="140" y1="15" x2="140" y2="105" stroke="#52525b" stroke-width="1.5"/>
<line x1="135" y1="20" x2="145" y2="20" stroke="#52525b" stroke-width="1"/>
<line x1="135" y1="35" x2="145" y2="35" stroke="#52525b" stroke-width="1"/>
<line x1="135" y1="50" x2="145" y2="50" stroke="#52525b" stroke-width="1"/>
<line x1="128" y1="60" x2="152" y2="60" stroke="#60a5fa" stroke-width="2"/>
<line x1="135" y1="70" x2="145" y2="70" stroke="#52525b" stroke-width="1"/>
<line x1="135" y1="85" x2="145" y2="85" stroke="#52525b" stroke-width="1"/>
<line x1="135" y1="100" x2="145" y2="100" stroke="#52525b" stroke-width="1"/>
<text x="148" y="23" font-size="6" fill="#a1a1aa" font-family="monospace">+3</text>
<text x="148" y="38" font-size="6" fill="#a1a1aa" font-family="monospace">+2</text>
<text x="148" y="53" font-size="6" fill="#a1a1aa" font-family="monospace">+1</text>
<text x="148" y="63" font-size="7" fill="#60a5fa" font-family="monospace" font-weight="bold">0</text>
<text x="148" y="73" font-size="6" fill="#a1a1aa" font-family="monospace">-1</text>
<text x="148" y="88" font-size="6" fill="#a1a1aa" font-family="monospace">-2</text>
<text x="148" y="103" font-size="6" fill="#a1a1aa" font-family="monospace">-3</text>

<!-- Thermometer on the left. Mercury rises and falls in sync with the
     climbing figure (4s cycle). Bulb is fixed at the bottom; the
     mercury column animates its y and height attributes via SMIL. -->
<rect x="20" y="15" width="14" height="80" rx="6" fill="none" stroke="#71717a" stroke-width="1.5"/>
<line x1="36" y1="25" x2="40" y2="25" stroke="#71717a" stroke-width="1"/>
<line x1="36" y1="40" x2="40" y2="40" stroke="#71717a" stroke-width="1"/>
<line x1="36" y1="55" x2="40" y2="55" stroke="#71717a" stroke-width="1"/>
<line x1="34" y1="70" x2="42" y2="70" stroke="#60a5fa" stroke-width="1.5"/>
<line x1="36" y1="85" x2="40" y2="85" stroke="#71717a" stroke-width="1"/>
<circle cx="27" cy="100" r="9" fill="#dc2626"/>
<rect x="23" width="8" rx="3" fill="#dc2626">
  <animate attributeName="y" values="75;20;75" dur="4s" repeatCount="indefinite"/>
  <animate attributeName="height" values="25;80;25" dur="4s" repeatCount="indefinite"/>
</rect>

<!-- Stick figure climbing the number line, vertically translated by rf_climb -->
<g class="rf_g">
  <circle cx="100" cy="50" r="6" fill="none" stroke="#e4e4e7" stroke-width="2"/>
  <line x1="100" y1="56" x2="100" y2="78" stroke="#e4e4e7" stroke-width="2"/>
  <g class="rf_aA"><line x1="100" y1="58" x2="100" y2="48" stroke="#e4e4e7" stroke-width="2"/></g>
  <g class="rf_aB"><line x1="100" y1="58" x2="100" y2="48" stroke="#e4e4e7" stroke-width="2"/></g>
  <g class="rf_lA"><line x1="100" y1="78" x2="100" y2="92" stroke="#e4e4e7" stroke-width="2"/></g>
  <g class="rf_lB"><line x1="100" y1="78" x2="100" y2="92" stroke="#e4e4e7" stroke-width="2"/></g>
</g>

<text x="90" y="116" font-size="6" fill="#71717a" text-anchor="middle">above and below zero</text>
</svg>`

// Build-a-structure — 10-second animation. The figure carries ONE
// stick at a time, four trips total, building a square one edge per
// trip. Each trip is 2.5s (10s ÷ 4): pick up at the pile (left), walk
// right while carrying, drop it on the next edge of the frame, walk
// empty back to the pile. After the 4th trip the square is complete.
//
// Trip schedule:
//   Trip 1   0.0-2.5s   place top edge
//   Trip 2   2.5-5.0s   place right edge
//   Trip 3   5.0-7.5s   place bottom edge
//   Trip 4   7.5-10.0s  place left edge → square complete, glow green
//
// Figure carries a horizontal stick while walking right, no stick
// while walking back. Each frame edge appears at the moment the
// figure arrives at the right side.
const SVG_BUILD_STRUCTURE = `<svg viewBox="0 0 180 120" xmlns="http://www.w3.org/2000/svg">
<style>
  /* NOTE: classes/keyframes are prefixed bk_ (for "build") to avoid
     colliding with the bs_ prefix used by Balance and Equalize. SVG
     style blocks are global, not scoped, so prefixes matter. */

  /* Walk: 4 round trips. Each trip = 25% of the cycle. */
  @keyframes bk_walk {
    0%,100% { transform: translateX(0) }
    12% { transform: translateX(85px) }
    25% { transform: translateX(0) }
    37% { transform: translateX(85px) }
    50% { transform: translateX(0) }
    62% { transform: translateX(85px) }
    75% { transform: translateX(0) }
    87% { transform: translateX(85px) }
  }
  @keyframes bk_leg_a { 0%,100%{transform:rotate(-22deg)} 50%{transform:rotate(22deg)} }
  @keyframes bk_leg_b { 0%,100%{transform:rotate(22deg)} 50%{transform:rotate(-22deg)} }
  @keyframes bk_bob   { 0%,100%{transform:translateY(-1px)} 50%{transform:translateY(1px)} }

  /* Carried stick: visible on the way right, hidden on the way back. */
  @keyframes bk_carry {
    0%,12%   { opacity: 1 }
    13%,24%  { opacity: 0 }
    25%,37%  { opacity: 1 }
    38%,49%  { opacity: 0 }
    50%,62%  { opacity: 1 }
    63%,74%  { opacity: 0 }
    75%,87%  { opacity: 1 }
    88%,100% { opacity: 0 }
  }

  /* Each frame edge appears at the END of its trip. */
  @keyframes bk_edge1 { 0%,12%  { opacity: 0 } 13%,100% { opacity: 1 } }
  @keyframes bk_edge2 { 0%,37%  { opacity: 0 } 38%,100% { opacity: 1 } }
  @keyframes bk_edge3 { 0%,62%  { opacity: 0 } 63%,100% { opacity: 1 } }
  @keyframes bk_edge4 { 0%,87%  { opacity: 0 } 88%,100% { opacity: 1 } }

  /* When all 4 edges are placed, the whole frame turns green. */
  @keyframes bk_glow  { 0%,87%  { stroke: #a16207 } 92%,100% { stroke: #22c55e } }

  .bk_fig    { animation: bk_walk 9s ease-in-out infinite; }
  .bk_bob    { animation: bk_bob 0.7s ease-in-out infinite; }
  .bk_leg_a  { animation: bk_leg_a 0.7s ease-in-out infinite; }
  .bk_leg_b  { animation: bk_leg_b 0.7s ease-in-out infinite; }
  .bk_carry  { animation: bk_carry 9s step-end infinite; }
  .bk_edge1  { animation: bk_edge1 9s step-end infinite, bk_glow 9s step-end infinite; }
  .bk_edge2  { animation: bk_edge2 9s step-end infinite, bk_glow 9s step-end infinite; }
  .bk_edge3  { animation: bk_edge3 9s step-end infinite, bk_glow 9s step-end infinite; }
  .bk_edge4  { animation: bk_edge4 9s step-end infinite, bk_glow 9s step-end infinite; }
</style>
<rect width="180" height="120" fill="#18181b"/>

<!-- Target shape outline (dashed grey "ghost" — always visible as a
     guide so the kid sees what's being built BEFORE the first edge
     drops in) -->
<g fill="none" stroke="#3f3f46" stroke-width="1.5" stroke-dasharray="2,2">
  <rect x="115" y="40" width="40" height="40"/>
</g>

<!-- The 4 placed edges. Each appears in turn as the figure drops a stick. -->
<line class="bk_edge1" x1="115" y1="40" x2="155" y2="40" stroke="#a16207" stroke-width="2.5" stroke-linecap="round"/>
<line class="bk_edge2" x1="155" y1="40" x2="155" y2="80" stroke="#a16207" stroke-width="2.5" stroke-linecap="round"/>
<line class="bk_edge3" x1="155" y1="80" x2="115" y2="80" stroke="#a16207" stroke-width="2.5" stroke-linecap="round"/>
<line class="bk_edge4" x1="115" y1="80" x2="115" y2="40" stroke="#a16207" stroke-width="2.5" stroke-linecap="round"/>

<!-- Pile of sticks on the left (always visible — the source) -->
<line x1="10" y1="95" x2="30" y2="95" stroke="#a16207" stroke-width="2"/>
<line x1="12" y1="91" x2="28" y2="91" stroke="#a16207" stroke-width="2"/>
<line x1="14" y1="87" x2="26" y2="87" stroke="#a16207" stroke-width="2"/>

<!-- Figure walks back and forth, carrying one stick per outbound trip.
     Ends back at the pile (left side) so the completed square is
     unobstructed. -->
<g class="bk_fig">
  <g class="bk_bob">
    <circle cx="15" cy="55" r="6" fill="none" stroke="#e4e4e7" stroke-width="2"/>
    <line x1="15" y1="61" x2="15" y2="75" stroke="#e4e4e7" stroke-width="2"/>
    <line x1="15" y1="65" x2="22" y2="71" stroke="#e4e4e7" stroke-width="2"/>
    <line x1="15" y1="65" x2="8" y2="71" stroke="#e4e4e7" stroke-width="2"/>
    <!-- The single stick being carried, held in front of the body. -->
    <line class="bk_carry" x1="20" y1="70" x2="32" y2="70" stroke="#a16207" stroke-width="2.5" stroke-linecap="round"/>
    <g class="bk_leg_a" style="transform-origin: 15px 75px;">
      <line x1="15" y1="75" x2="15" y2="86" stroke="#e4e4e7" stroke-width="2"/>
    </g>
    <g class="bk_leg_b" style="transform-origin: 15px 75px;">
      <line x1="15" y1="75" x2="15" y2="86" stroke="#e4e4e7" stroke-width="2"/>
    </g>
  </g>
</g>

<text x="90" y="113" font-size="6" fill="#71717a" text-anchor="middle">build the shape one piece at a time</text>
</svg>`

export const MECHANIC_ANIMATIONS: MechanicAnimation[] = [
  { id: "resource-management", title: "Collect & Manage", description: "Gather items, track totals, and hit exact targets", mathDomain: "arithmetic operations",
    descKeywords: ["subtract", "subtraction", "difference", "minus", "take away", "operation"],
    domainCodes: ["OA"],
    svg: dangerousSvg(SVG_RESOURCE_MGMT) },
  { id: "partitioning", title: "Split & Share", description: "Cut, slice, or pour things into equal parts", mathDomain: "fractions and ratios",
    descKeywords: ["fraction", "partition", "equivalent", "equivalence", "half", "quarter", "third", "fourths", "eighths", "numerator", "denominator", "share equally"],
    domainCodes: ["NF"],
    svg: dangerousSvg(SVG_PARTITIONING) },
  { id: "balance-systems", title: "Balance & Equalize", description: "Add and remove to make both sides match", mathDomain: "equations",
    descKeywords: ["equation", "balance", "solve", "variable", "unknown", "expression", "inequality",
      "polynomial", "remainder theorem", "rational expression", "factor of", "zeros of"],
    domainCodes: ["EE", "A-REI", "A-CED", "A-SSE", "A-APR"],
    svg: dangerousSvg(SVG_BALANCE) },
  { id: "spatial-puzzles", title: "Fit & Rotate", description: "Rotate, flip, and fit shapes into place", mathDomain: "geometry",
    descKeywords: ["shape", "angle", "rotate", "rotation", "reflection", "translation", "symmetry", "transform", "congruent", "polygon", "triangle", "circle", "quadrilateral"],
    domainCodes: ["G", "G-CO", "G-SRT", "G-C"],
    svg: dangerousSvg(SVG_SPATIAL) },
  { id: "probability-systems", title: "Roll & Predict", description: "Bet on outcomes and weigh your chances", mathDomain: "statistics and probability",
    descKeywords: ["probability", "chance", "random", "likely", "outcome", "event", "sample space", "data", "histogram", "bar graph", "line plot", "scatter", "distribution", "median", "mean", "mode",
      "sample survey", "randomization", "observational study", "experiment"],
    domainCodes: ["SP", "S-CP", "S-ID", "S-MD", "S-IC"],
    svg: dangerousSvg(SVG_PROBABILITY) },
  { id: "path-optimization", title: "Navigate & Optimize", description: "Find the shortest or best path through a network", mathDomain: "graph reasoning",
    descKeywords: ["shortest path", "route", "network", "vertex", "edge", "graph theory"],
    domainCodes: [],
    svg: dangerousSvg(SVG_PATH_OPT) },
  { id: "construction-systems", title: "Build & Measure", description: "Stack and build to hit exact dimensions", mathDomain: "area and volume",
    descKeywords: ["area", "volume", "perimeter", "surface area", "rectangle", "rectangular array", "square unit", "cubic", "tile"],
    domainCodes: ["G-GMD", "G-MG"],
    svg: dangerousSvg(SVG_CONSTRUCTION) },
  { id: "motion-simulation", title: "Race & Calculate", description: "Control speed, distance, and timing", mathDomain: "rates and slopes",
    descKeywords: ["rate", "speed", "slope", "per hour", "per second", "unit rate", "linear", "constant rate"],
    domainCodes: ["F-IF", "F-LE"],
    svg: dangerousSvg(SVG_MOTION) },
  { id: "constraint-puzzles", title: "Solve & Eliminate", description: "Use clues to narrow down and deduce the answer", mathDomain: "logical reasoning",
    descKeywords: ["logical", "reasoning", "constraint", "deduce", "argument", "proof"],
    domainCodes: ["MP"],
    svg: dangerousSvg(SVG_CONSTRAINT) },
  { id: "strategy-economy", title: "Grow & Compound", description: "Invest and reinvest to grow as fast as possible", mathDomain: "exponential growth",
    descKeywords: ["exponent", "exponential", "growth", "double", "compound", "power",
      "rational exponent", "radical", "irrational", "square root", "cube root", "nth root"],
    domainCodes: ["F-BF", "N-RN"],
    svg: dangerousSvg(SVG_STRATEGY) },
  { id: "measurement-challenges", title: "Measure & Compare", description: "Measure, convert, and compare sizes", mathDomain: "units and measurement",
    descKeywords: ["measure", "measurement", "unit", "length", "weight", "mass", "capacity", "convert", "inch", "foot", "centimeter", "meter", "liter", "gram", "ounce"],
    domainCodes: ["MD"],
    svg: dangerousSvg(SVG_MEASURE) },
  { id: "scoring-ranking", title: "Score & Rank", description: "Sort, order, and rank things by value", mathDomain: "ordering and comparison",
    descKeywords: ["order", "compare", "comparing", "greater", "less than", "ascending", "descending", "rank", "sort", "number line", "count to", "count forward", "count by", "skip count"],
    domainCodes: ["CC"],
    svg: dangerousSvg(SVG_SCORING) },
  { id: "timing-rhythm", title: "Pattern & Repeat", description: "Spot the pattern and predict what comes next", mathDomain: "patterns and sequences",
    descKeywords: ["pattern", "sequence", "repeating", "next term", "rule", "arithmetic sequence", "geometric sequence", "function rule",
      "trigonometric", "periodic", "amplitude", "frequency", "midline", "sine", "cosine", "tangent"],
    domainCodes: ["F-BF", "F-LE", "F-TF"],
    svg: dangerousSvg(SVG_TIMING) },
  { id: "scaling-resizing", title: "Scale & Transform", description: "Resize, zoom, and keep proportions right", mathDomain: "proportional reasoning",
    descKeywords: ["proportion", "proportional", "scale", "scaling", "ratio", "similar", "enlarge", "shrink", "percent", "percentage"],
    domainCodes: ["RP", "G-SRT"],
    svg: dangerousSvg(SVG_SCALING) },
  { id: "inventory-crafting", title: "Craft & Combine", description: "Mix ingredients in the right amounts", mathDomain: "addition and grouping",
    descKeywords: ["add", "addition", "sum", "plus", "combine", "altogether", "in all", "group", "multiplication", "multiply", "product", "times", "array", "equal groups"],
    domainCodes: [],
    svg: dangerousSvg(SVG_INVENTORY) },
  { id: "terrain-generation", title: "Plot & Explore", description: "Navigate by coordinates to find targets", mathDomain: "coordinate systems",
    descKeywords: ["coordinate", "ordered pair", "x-axis", "y-axis", "first quadrant", "plot", "graph the point",
      "complex number", "complex plane", "imaginary",
      "vector", "magnitude and direction", "directed line segment", "scalar"],
    domainCodes: ["G-GPE", "N-CN", "N-VM"],
    svg: dangerousSvg(SVG_TERRAIN) },
  { id: "bidding-auction", title: "Bid & Estimate", description: "Guess values, round, and bid smart", mathDomain: "estimation and place value",
    descKeywords: ["estimate", "estimation", "round", "rounding", "approximate", "place value", "digit", "tens", "hundreds", "thousands", "ones place", "money", "coin", "dollar", "cent", "time", "clock", "hour", "minute"],
    domainCodes: ["NBT"],
    svg: dangerousSvg(SVG_BIDDING) },
  { id: "above-below-zero", title: "Rise & Fall", description: "Move above and below zero on a number line", mathDomain: "signed numbers and absolute value",
    descKeywords: ["negative number", "absolute value", "integer", "opposite", "sea level", "above zero", "below zero", "elevation", "temperature", "credit", "debit"],
    domainCodes: [],
    svg: dangerousSvg(SVG_RISE_FALL) },
  { id: "build-structure", title: "Build a Structure", description: "Snap shapes together to match a blueprint", mathDomain: "modeling shapes with components",
    descKeywords: ["build shapes", "model shapes", "compose shapes", "components", "sticks and clay", "snap together", "build a shape"],
    domainCodes: [],
    svg: dangerousSvg(SVG_BUILD_STRUCTURE) },
]

// Match mechanics to a standard. Returns the top 3, ordered by score.
//
// Scoring rules:
//   +5 per descKeyword found in the description
//   +4 if the standard's domainCode matches any of the mechanic's
//      domainCodes (exact, or with a "-"/"." suffix)
//
// Keyword matching is "prefix at a word boundary" for keywords ≥ 5 chars
// and "exact word boundary on both sides" for shorter keywords. The
// length rule lets long keywords like "fraction" match "fractions"/
// "fractional" while keeping short ones like "add" from matching
// "additional". Multi-word keywords (e.g. "complex plane") are matched
// as substrings since they already disambiguate themselves.
export function matchMechanics(description: string, domainCode: string): MechanicAnimation[] {
  const desc = description.toLowerCase()
  const code = domainCode.toUpperCase()
  const scored = MECHANIC_ANIMATIONS.map((m) => {
    let score = 0
    for (const kw of m.descKeywords) {
      if (descMatches(desc, kw.toLowerCase())) score += 5
    }
    for (const dc of m.domainCodes) {
      if (code === dc || code.startsWith(`${dc}-`) || code.startsWith(`${dc}.`)) {
        score += 4
      }
    }
    return { mechanic: m, score }
  })
  scored.sort((a, b) => b.score - a.score)
  // Drop zero-scoring mechanics so we don't return random fallbacks.
  return scored.filter((s) => s.score > 0).slice(0, 3).map((s) => s.mechanic)
}

function descMatches(desc: string, kw: string): boolean {
  if (kw.includes(" ")) {
    // Multi-word keywords are already specific enough — substring match.
    return desc.includes(kw)
  }
  if (kw.length >= 5) {
    // Long keywords: prefix at word boundary, suffixes free (catches
    // plurals like "fractions", "exponents"; derivatives like
    // "exponential", "fractional"; tenses like "subtracted").
    return new RegExp(`(^|[^a-z])${escapeRegex(kw)}`).test(desc)
  }
  // Short keywords (≤4 chars): exact word boundary on both sides so
  // "add" doesn't match "additional" and "sum" doesn't match "summary".
  return new RegExp(`(^|[^a-z])${escapeRegex(kw)}([^a-z]|$)`).test(desc)
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
