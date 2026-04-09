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

const SVG_PARTITIONING = `<svg viewBox="0 0 180 120" xmlns="http://www.w3.org/2000/svg">
<style>
@keyframes pa_slice { 0%,40%{transform:translateY(-3px)} 50%,90%{transform:translateY(3px)} }
@keyframes pa_chop  { 0%,40%{transform:rotate(-30deg)} 50%,90%{transform:rotate(0deg)} }
@keyframes pa_lean  { 0%,100%{transform:rotate(0deg)}50%{transform:rotate(2deg)} }
.pa_g    { animation: pa_lean 1s ease-in-out infinite; transform-origin: 30px 65px; }
.pa_arm  { animation: pa_chop 1s ease-in-out infinite; transform-origin: 30px 52px; }
.pa_knife{ animation: pa_slice 1s ease-in-out infinite; }
</style>
<rect width="180" height="120" fill="#18181b"/>
<g class="pa_g">
  <circle cx="30" cy="40" r="6" fill="none" stroke="#e4e4e7" stroke-width="2"/>
  <line x1="30" y1="46" x2="30" y2="65" stroke="#e4e4e7" stroke-width="2"/>
  <line class="pa_arm" x1="30" y1="52" x2="55" y2="40" stroke="#e4e4e7" stroke-width="2"/>
  <line x1="30" y1="52" x2="15" y2="55" stroke="#e4e4e7" stroke-width="2"/>
  <line x1="23" y1="79" x2="30" y2="65" stroke="#e4e4e7" stroke-width="2"/>
  <line x1="30" y1="65" x2="37" y2="79" stroke="#e4e4e7" stroke-width="2"/>
</g>
<g transform="translate(100,55)">
  <circle cx="0" cy="0" r="22" fill="none" stroke="#f59e0b" stroke-width="2"/>
  <line class="pa_knife" x1="0" y1="-22" x2="0" y2="22" stroke="#60a5fa" stroke-width="2"/>
  <text x="-12" y="5" font-size="9" fill="#e4e4e7" font-family="monospace">1/2</text>
  <text x="6" y="5" font-size="9" fill="#e4e4e7" font-family="monospace">1/2</text>
</g>
<text x="90" y="110" font-size="7" fill="#71717a" text-anchor="middle">split into equal parts</text>
</svg>`

const SVG_BALANCE = `<svg viewBox="0 0 180 120" xmlns="http://www.w3.org/2000/svg">
<style>
@keyframes bs_tilt   { 0%,100%{transform:rotate(-3deg)} 50%{transform:rotate(3deg)} }
@keyframes bs_drop   { 0%,60%{transform:translateY(-15px);opacity:0} 70%,100%{transform:translateY(0);opacity:1} }
@keyframes bs_reach  { 0%,40%{transform:rotate(0deg)} 60%,100%{transform:rotate(-40deg)} }
@keyframes bs_think  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-2px)} }
.bs_g     { animation: bs_think 1.4s ease-in-out infinite; transform-origin: 25px 65px; }
.bs_arm   { animation: bs_reach 3s ease-in-out infinite; transform-origin: 25px 55px; }
.bs_beam  { animation: bs_tilt 3s ease-in-out infinite; transform-origin: 100px 50px; }
.bs_new   { animation: bs_drop 3s ease-in-out infinite; }
</style>
<rect width="180" height="120" fill="#18181b"/>
<g class="bs_g">
  <circle cx="25" cy="45" r="6" fill="none" stroke="#e4e4e7" stroke-width="2"/>
  <line x1="25" y1="51" x2="25" y2="68" stroke="#e4e4e7" stroke-width="2"/>
  <line class="bs_arm" x1="25" y1="55" x2="42" y2="48" stroke="#e4e4e7" stroke-width="2"/>
  <line x1="25" y1="55" x2="14" y2="60" stroke="#e4e4e7" stroke-width="2"/>
  <line x1="19" y1="82" x2="25" y2="68" stroke="#e4e4e7" stroke-width="2"/>
  <line x1="25" y1="68" x2="31" y2="82" stroke="#e4e4e7" stroke-width="2"/>
</g>
<polygon points="100,70 90,85 110,85" fill="none" stroke="#e4e4e7" stroke-width="1.5"/>
<g class="bs_beam">
  <line x1="50" y1="50" x2="150" y2="50" stroke="#e4e4e7" stroke-width="2"/>
  <rect x="58" y="38" width="12" height="12" rx="2" fill="#60a5fa" opacity="0.6"/>
  <rect x="73" y="38" width="12" height="12" rx="2" fill="#60a5fa" opacity="0.6"/>
  <rect x="118" y="38" width="12" height="12" rx="2" fill="#f59e0b" opacity="0.6"/>
  <rect class="bs_new" x="133" y="38" width="12" height="12" rx="2" fill="#f59e0b" opacity="0"/>
</g>
<text x="70" y="32" font-size="8" fill="#60a5fa" text-anchor="middle" font-family="monospace">2x</text>
<text x="130" y="32" font-size="8" fill="#f59e0b" text-anchor="middle" font-family="monospace">= ?</text>
<text x="100" y="110" font-size="7" fill="#71717a" text-anchor="middle">make both sides equal</text>
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

const SVG_SCORING = `<svg viewBox="0 0 180 120" xmlns="http://www.w3.org/2000/svg">
<style>
@keyframes sc_celeb { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
@keyframes sc_raise { 0%,100%{transform:rotate(-60deg)} 50%{transform:rotate(-90deg)} }
.sc_w   { animation: sc_celeb 1s ease-in-out infinite; transform-origin: 97px 60px; }
.sc_arm { animation: sc_raise 1s ease-in-out infinite; transform-origin: 97px 35px; }
</style>
<rect width="180" height="120" fill="#18181b"/>
<rect x="60" y="55" width="25" height="30" fill="#60a5fa" opacity="0.4" stroke="#60a5fa" stroke-width="1"/>
<rect x="85" y="40" width="25" height="45" fill="#f59e0b" opacity="0.4" stroke="#f59e0b" stroke-width="1"/>
<rect x="110" y="65" width="25" height="20" fill="#60a5fa" opacity="0.3" stroke="#60a5fa" stroke-width="1"/>
<text x="72" y="75" font-size="9" fill="#e4e4e7" text-anchor="middle" font-family="monospace">2nd</text>
<text x="97" y="60" font-size="9" fill="#f59e0b" text-anchor="middle" font-family="monospace">1st</text>
<text x="122" y="78" font-size="9" fill="#e4e4e7" text-anchor="middle" font-family="monospace">3rd</text>
<circle cx="72" cy="48" r="5" fill="none" stroke="#e4e4e7" stroke-width="1.5"/>
<line x1="72" y1="53" x2="72" y2="55" stroke="#e4e4e7" stroke-width="1.5"/>
<g class="sc_w">
  <circle cx="97" cy="32" r="6" fill="none" stroke="#f59e0b" stroke-width="2"/>
  <line x1="97" y1="38" x2="97" y2="40" stroke="#f59e0b" stroke-width="2"/>
  <line class="sc_arm" x1="97" y1="35" x2="105" y2="22" stroke="#f59e0b" stroke-width="2"/>
  <line x1="97" y1="35" x2="89" y2="22" stroke="#f59e0b" stroke-width="2"/>
</g>
<circle cx="122" cy="58" r="5" fill="none" stroke="#e4e4e7" stroke-width="1.5"/>
<text x="72" y="100" font-size="7" fill="#71717a" text-anchor="middle">85</text>
<text x="97" y="100" font-size="7" fill="#f59e0b" text-anchor="middle">97</text>
<text x="122" y="100" font-size="7" fill="#71717a" text-anchor="middle">72</text>
<text x="90" y="115" font-size="7" fill="#71717a" text-anchor="middle">rank by score</text>
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

const SVG_BIDDING = `<svg viewBox="0 0 180 120" xmlns="http://www.w3.org/2000/svg">
<style>
@keyframes bd_b1 { 0%,40%{transform:translateY(0)} 50%,90%{transform:translateY(-10px)} }
@keyframes bd_b2 { 0%,40%{transform:translateY(0)} 60%,100%{transform:translateY(-10px)} }
@keyframes bd_r1 { 0%,40%{transform:rotate(0deg)} 50%,90%{transform:rotate(-50deg)} }
@keyframes bd_r2 { 0%,40%{transform:rotate(0deg)} 60%,100%{transform:rotate(50deg)} }
.bd_g1   { animation: bd_b1 2.5s ease-in-out infinite; transform-origin: 35px 90px; }
.bd_a1   { animation: bd_r1 2.5s ease-in-out infinite; transform-origin: 35px 60px; }
.bd_g2   { animation: bd_b2 2.5s ease-in-out infinite; transform-origin: 145px 90px; }
.bd_a2   { animation: bd_r2 2.5s ease-in-out infinite; transform-origin: 145px 65px; }
</style>
<rect width="180" height="120" fill="#18181b"/>
<g class="bd_g1">
  <circle cx="35" cy="50" r="6" fill="none" stroke="#e4e4e7" stroke-width="2"/>
  <line x1="35" y1="56" x2="35" y2="72" stroke="#e4e4e7" stroke-width="2"/>
  <line class="bd_a1" x1="35" y1="60" x2="48" y2="50" stroke="#e4e4e7" stroke-width="2"/>
  <line x1="35" y1="60" x2="22" y2="65" stroke="#e4e4e7" stroke-width="2"/>
  <line x1="29" y1="86" x2="35" y2="72" stroke="#e4e4e7" stroke-width="2"/>
  <line x1="35" y1="72" x2="41" y2="86" stroke="#e4e4e7" stroke-width="2"/>
</g>
<rect x="48" y="32" width="30" height="14" rx="3" fill="#60a5fa" opacity="0.3" stroke="#60a5fa" stroke-width="1"/>
<text x="63" y="42" font-size="8" fill="#60a5fa" text-anchor="middle" font-family="monospace">$25</text>
<g class="bd_g2">
  <circle cx="145" cy="55" r="6" fill="none" stroke="#e4e4e7" stroke-width="2"/>
  <line x1="145" y1="61" x2="145" y2="75" stroke="#e4e4e7" stroke-width="2"/>
  <line class="bd_a2" x1="145" y1="65" x2="158" y2="55" stroke="#e4e4e7" stroke-width="2"/>
  <line x1="145" y1="65" x2="133" y2="58" stroke="#e4e4e7" stroke-width="2"/>
  <line x1="139" y1="89" x2="145" y2="75" stroke="#e4e4e7" stroke-width="2"/>
  <line x1="145" y1="75" x2="151" y2="89" stroke="#e4e4e7" stroke-width="2"/>
</g>
<rect x="103" y="38" width="30" height="14" rx="3" fill="#f59e0b" opacity="0.3" stroke="#f59e0b" stroke-width="1"/>
<text x="118" y="48" font-size="8" fill="#f59e0b" text-anchor="middle" font-family="monospace">$30</text>
<rect x="80" y="75" width="30" height="15" rx="3" fill="none" stroke="#71717a" stroke-width="1.5"/>
<text x="95" y="86" font-size="7" fill="#71717a" text-anchor="middle">?</text>
<text x="90" y="110" font-size="7" fill="#71717a" text-anchor="middle">estimate the value</text>
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

// Build-a-structure — 10-second multi-stage animation demonstrating
// the "snap together components to match a target shape" verb.
// Uses the unified faceless / no-knees / floating body style from
// SVG_MOTION. Stages:
//   0-2.5s:  target shape appears on the right (dashed outline)
//   2.5-5s:  figure floats left-to-right carrying a stick, places
//            it on the frame
//   5-7.5s:  figure returns, carries a second stick, places it
//   7.5-10s: final piece snaps into place, target outline solidifies,
//            a tiny "✓" pulses in celebration
//
// The figure is faceless (no eyes/mouth), legs are single straight
// lines swinging from the hip, body line stops below the head circle.
const SVG_BUILD_STRUCTURE = `<svg viewBox="0 0 180 120" xmlns="http://www.w3.org/2000/svg">
<style>
  /* Timing: one full 10-second cycle. All children share the same period
     via animation-delay so stages stay in sync. */
  @keyframes bs_walk_right { 0%,100%{transform:translateX(0)} 20%,30%{transform:translateX(80px)} 50%,60%{transform:translateX(0)} 80%,90%{transform:translateX(80px)} }
  @keyframes bs_leg_a      { 0%,100%{transform:rotate(-22deg)} 50%{transform:rotate(22deg)} }
  @keyframes bs_leg_b      { 0%,100%{transform:rotate(22deg)} 50%{transform:rotate(-22deg)} }
  @keyframes bs_bob        { 0%,100%{transform:translateY(-1.5px)} 50%{transform:translateY(1.5px)} }
  @keyframes bs_carry      { 0%,25%{opacity:1} 26%,49%{opacity:0} 50%,75%{opacity:1} 76%,100%{opacity:0} }
  @keyframes bs_carry2     { 0%,50%{opacity:0} 51%,75%{opacity:1} 76%,100%{opacity:0} }
  @keyframes bs_place1     { 0%,25%{opacity:0} 26%,100%{opacity:1} }
  @keyframes bs_place2     { 0%,50%{opacity:0} 51%,100%{opacity:1} }
  @keyframes bs_place3     { 0%,75%{opacity:0} 76%,100%{opacity:1} }
  @keyframes bs_place4     { 0%,90%{opacity:0} 91%,100%{opacity:1} }
  @keyframes bs_target_fade{ 0%,85%{stroke:#52525b;stroke-dasharray:3,2} 90%,100%{stroke:#22c55e;stroke-dasharray:0} }
  @keyframes bs_check      { 0%,88%{opacity:0;transform:scale(0)} 92%,100%{opacity:1;transform:scale(1)} }

  .bs_fig     { animation: bs_walk_right 10s ease-in-out infinite; }
  .bs_bob     { animation: bs_bob 1.2s ease-in-out infinite; }
  .bs_leg_a   { animation: bs_leg_a 1.2s ease-in-out infinite; transform-origin: 0 22px; }
  .bs_leg_b   { animation: bs_leg_b 1.2s ease-in-out infinite; transform-origin: 0 22px; }
  .bs_carry_1 { animation: bs_carry 10s ease-in-out infinite; }
  .bs_carry_2 { animation: bs_carry2 10s ease-in-out infinite; }
  .bs_piece1  { animation: bs_place1 10s step-end infinite; }
  .bs_piece2  { animation: bs_place2 10s step-end infinite; }
  .bs_piece3  { animation: bs_place3 10s step-end infinite; }
  .bs_piece4  { animation: bs_place4 10s step-end infinite; }
  .bs_target  { animation: bs_target_fade 10s step-end infinite; }
  .bs_check   { animation: bs_check 10s ease-out infinite; transform-origin: 150px 35px; }
</style>
<rect width="180" height="120" fill="#18181b"/>

<!-- Target shape outline on the right (dashed while building, solid at the end) -->
<g class="bs_target" fill="none" stroke="#52525b" stroke-width="2">
  <line class="bs_piece1" x1="115" y1="35" x2="155" y2="35"/>
  <line class="bs_piece2" x1="155" y1="35" x2="155" y2="75"/>
  <line class="bs_piece3" x1="155" y1="75" x2="115" y2="75"/>
  <line class="bs_piece4" x1="115" y1="75" x2="115" y2="35"/>
</g>

<!-- Pile of sticks the figure picks from, on the left -->
<line x1="10" y1="98" x2="30" y2="98" stroke="#a16207" stroke-width="2"/>
<line x1="12" y1="94" x2="28" y2="94" stroke="#a16207" stroke-width="2"/>
<line x1="14" y1="90" x2="26" y2="90" stroke="#a16207" stroke-width="2"/>

<!-- Celebration check when all 4 pieces are placed -->
<text class="bs_check" x="150" y="38" font-size="14" fill="#22c55e" text-anchor="middle">✓</text>

<!-- Figure — starts at x=15, walks right to place pieces. Uses the
     unified baseline: faceless circle, body stops below head, single
     straight legs swinging from the hip, no knees. -->
<g class="bs_fig">
  <g class="bs_bob">
    <!-- Head (faceless, r=7) -->
    <circle cx="15" cy="55" r="7" fill="none" stroke="#e4e4e7" stroke-width="2"/>
    <!-- Body (below head circle: y=63 → hip y=77) -->
    <line x1="15" y1="63" x2="15" y2="77" stroke="#e4e4e7" stroke-width="2"/>
    <!-- Arms (pivot at shoulder y=66) -->
    <line x1="15" y1="66" x2="24" y2="73" stroke="#e4e4e7" stroke-width="2"/>
    <line x1="15" y1="66" x2="6" y2="73" stroke="#e4e4e7" stroke-width="2"/>
    <!-- Stick being carried (visible while walking right with piece 1-2) -->
    <line class="bs_carry_1" x1="22" y1="70" x2="34" y2="64" stroke="#a16207" stroke-width="2"/>
    <!-- Second stick (vertical, visible on the second trip) -->
    <line class="bs_carry_2" x1="22" y1="70" x2="28" y2="58" stroke="#a16207" stroke-width="2"/>
    <!-- Legs — single straight lines, no knee. Pivot at hip (15, 77). -->
    <g class="bs_leg_a" style="transform-origin: 15px 77px;">
      <line x1="15" y1="77" x2="15" y2="97" stroke="#e4e4e7" stroke-width="2"/>
    </g>
    <g class="bs_leg_b" style="transform-origin: 15px 77px;">
      <line x1="15" y1="77" x2="15" y2="97" stroke="#e4e4e7" stroke-width="2"/>
    </g>
  </g>
</g>

<text x="90" y="113" font-size="7" fill="#71717a" text-anchor="middle">snap components to match the target</text>
</svg>`

export const MECHANIC_ANIMATIONS: MechanicAnimation[] = [
  { id: "resource-management", title: "Collect & Manage", mathDomain: "arithmetic operations",
    descKeywords: ["subtract", "subtraction", "difference", "minus", "take away", "operation"],
    domainCodes: ["OA"],
    svg: dangerousSvg(SVG_RESOURCE_MGMT) },
  { id: "partitioning", title: "Split & Share", mathDomain: "fractions and ratios",
    descKeywords: ["fraction", "partition", "equivalent", "equivalence", "half", "quarter", "third", "fourths", "eighths", "numerator", "denominator", "share equally"],
    domainCodes: ["NF"],
    svg: dangerousSvg(SVG_PARTITIONING) },
  { id: "balance-systems", title: "Balance & Equalize", mathDomain: "equations",
    descKeywords: ["equation", "balance", "solve", "variable", "unknown", "expression", "inequality",
      // polynomial algebra: factoring, zeros, remainder theorem, rational expressions
      "polynomial", "remainder theorem", "rational expression", "factor of", "zeros of"],
    domainCodes: ["EE", "A-REI", "A-CED", "A-SSE", "A-APR"],
    svg: dangerousSvg(SVG_BALANCE) },
  { id: "spatial-puzzles", title: "Fit & Rotate", mathDomain: "geometry",
    descKeywords: ["shape", "angle", "rotate", "rotation", "reflection", "translation", "symmetry", "transform", "congruent", "polygon", "triangle", "circle", "quadrilateral"],
    domainCodes: ["G", "G-CO", "G-SRT", "G-C"],
    svg: dangerousSvg(SVG_SPATIAL) },
  { id: "probability-systems", title: "Roll & Predict", mathDomain: "statistics and probability",
    descKeywords: ["probability", "chance", "random", "likely", "outcome", "event", "sample space", "data", "histogram", "bar graph", "line plot", "scatter", "distribution", "median", "mean", "mode",
      // statistical inference: sampling, surveys, observational studies
      "sample survey", "randomization", "observational study", "experiment"],
    domainCodes: ["SP", "S-CP", "S-ID", "S-MD", "S-IC"],
    svg: dangerousSvg(SVG_PROBABILITY) },
  { id: "path-optimization", title: "Navigate & Optimize", mathDomain: "graph reasoning",
    descKeywords: ["shortest path", "route", "network", "vertex", "edge", "graph theory"],
    domainCodes: [],
    svg: dangerousSvg(SVG_PATH_OPT) },
  { id: "construction-systems", title: "Build & Measure", mathDomain: "area and volume",
    descKeywords: ["area", "volume", "perimeter", "surface area", "rectangle", "rectangular array", "square unit", "cubic", "tile"],
    domainCodes: ["G-GMD", "G-MG"],
    svg: dangerousSvg(SVG_CONSTRUCTION) },
  { id: "motion-simulation", title: "Race & Calculate", mathDomain: "rates and slopes",
    descKeywords: ["rate", "speed", "slope", "per hour", "per second", "unit rate", "linear", "constant rate"],
    domainCodes: ["F-IF", "F-LE"],
    svg: dangerousSvg(SVG_MOTION) },
  { id: "constraint-puzzles", title: "Solve & Eliminate", mathDomain: "logical reasoning",
    descKeywords: ["logical", "reasoning", "constraint", "deduce", "argument", "proof"],
    domainCodes: ["MP"],
    svg: dangerousSvg(SVG_CONSTRAINT) },
  { id: "strategy-economy", title: "Grow & Compound", mathDomain: "exponential growth",
    descKeywords: ["exponent", "exponential", "growth", "double", "compound", "power",
      // rational/irrational exponents and radicals
      "rational exponent", "radical", "irrational", "square root", "cube root", "nth root"],
    domainCodes: ["F-BF", "N-RN"],
    svg: dangerousSvg(SVG_STRATEGY) },
  { id: "measurement-challenges", title: "Measure & Compare", mathDomain: "units and measurement",
    descKeywords: ["measure", "measurement", "unit", "length", "weight", "mass", "capacity", "convert", "inch", "foot", "centimeter", "meter", "liter", "gram", "ounce"],
    domainCodes: ["MD"],
    svg: dangerousSvg(SVG_MEASURE) },
  { id: "scoring-ranking", title: "Score & Rank", mathDomain: "ordering and comparison",
    descKeywords: ["order", "compare", "comparing", "greater", "less than", "ascending", "descending", "rank", "sort", "number line", "count to", "count forward", "count by", "skip count"],
    domainCodes: ["CC"],
    svg: dangerousSvg(SVG_SCORING) },
  { id: "timing-rhythm", title: "Pattern & Repeat", mathDomain: "patterns and sequences",
    descKeywords: ["pattern", "sequence", "repeating", "next term", "rule", "arithmetic sequence", "geometric sequence", "function rule",
      // trigonometric / periodic functions — they repeat
      "trigonometric", "periodic", "amplitude", "frequency", "midline", "sine", "cosine", "tangent"],
    domainCodes: ["F-BF", "F-LE", "F-TF"],
    svg: dangerousSvg(SVG_TIMING) },
  { id: "scaling-resizing", title: "Scale & Transform", mathDomain: "proportional reasoning",
    descKeywords: ["proportion", "proportional", "scale", "scaling", "ratio", "similar", "enlarge", "shrink", "percent", "percentage"],
    domainCodes: ["RP", "G-SRT"],
    svg: dangerousSvg(SVG_SCALING) },
  { id: "inventory-crafting", title: "Craft & Combine", mathDomain: "addition and grouping",
    descKeywords: ["add", "addition", "sum", "plus", "combine", "altogether", "in all", "group", "multiplication", "multiply", "product", "times", "array", "equal groups"],
    domainCodes: [],
    svg: dangerousSvg(SVG_INVENTORY) },
  { id: "terrain-generation", title: "Plot & Explore", mathDomain: "coordinate systems",
    descKeywords: ["coordinate", "ordered pair", "x-axis", "y-axis", "first quadrant", "plot", "graph the point",
      // complex plane = real on x, imaginary on y — same plotting verb
      "complex number", "complex plane", "imaginary",
      // vectors live on a coordinate grid (magnitude + direction)
      "vector", "magnitude and direction", "directed line segment", "scalar"],
    domainCodes: ["G-GPE", "N-CN", "N-VM"],
    svg: dangerousSvg(SVG_TERRAIN) },
  { id: "bidding-auction", title: "Bid & Estimate", mathDomain: "estimation and place value",
    descKeywords: ["estimate", "estimation", "round", "rounding", "approximate", "place value", "digit", "tens", "hundreds", "thousands", "ones place", "money", "coin", "dollar", "cent", "time", "clock", "hour", "minute"],
    domainCodes: ["NBT"],
    svg: dangerousSvg(SVG_BIDDING) },
  { id: "above-below-zero", title: "Rise & Fall", mathDomain: "signed numbers and absolute value",
    descKeywords: ["negative number", "absolute value", "integer", "opposite", "sea level", "above zero", "below zero", "elevation", "temperature", "credit", "debit"],
    // No domainCodes — "NS" would grab too much (fractions, GCF, irrationals).
    // Rely on the specific descKeywords above.
    domainCodes: [],
    svg: dangerousSvg(SVG_RISE_FALL) },
  { id: "build-structure", title: "Build a Structure", mathDomain: "modeling shapes with components",
    // Routes K kindergarten "build shapes from components" (K.G.B.5) and
    // any similar "snap pieces to form a target shape" standards. Has
    // a higher score than the generic Fit & Rotate mechanic when these
    // keywords appear, so it wins.
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
