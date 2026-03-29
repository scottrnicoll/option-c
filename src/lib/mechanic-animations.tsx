"use client"

// Pre-built game mechanic SVG animations
// Each one demonstrates a core game loop that uses a specific math domain

export interface MechanicAnimation {
  id: string
  title: string
  mathDomain: string
  keywords: string[] // for matching to standards
  svg: React.ReactNode
}

// Shared stick figure parts
const HEAD = (cx: number, cy: number) => (
  <circle cx={cx} cy={cy} r={6} fill="none" stroke="#e4e4e7" strokeWidth={2} />
)
const BODY = (x: number, y1: number, y2: number) => (
  <line x1={x} y1={y1} x2={x} y2={y2} stroke="#e4e4e7" strokeWidth={2} />
)
const ARMS = (x: number, y: number, spread: number) => (
  <>
    <line x1={x - spread} y1={y + 4} x2={x} y2={y} stroke="#e4e4e7" strokeWidth={2} />
    <line x1={x} y1={y} x2={x + spread} y2={y + 4} stroke="#e4e4e7" strokeWidth={2} />
  </>
)
const LEGS = (x: number, y: number, spread: number) => (
  <>
    <line x1={x - spread} y1={y + 14} x2={x} y2={y} stroke="#e4e4e7" strokeWidth={2} />
    <line x1={x} y1={y} x2={x + spread} y2={y + 14} stroke="#e4e4e7" strokeWidth={2} />
  </>
)
const LABEL = (x: number, y: number, text: string) => (
  <text x={x} y={y} fontSize={7} fill="#71717a" textAnchor="middle" fontFamily="sans-serif">{text}</text>
)

const BG = <rect width={180} height={120} fill="#18181b" />

export const MECHANIC_ANIMATIONS: MechanicAnimation[] = [
  // 1. Resource Management — arithmetic operations
  {
    id: "resource-management",
    title: "Collect & Manage",
    mathDomain: "arithmetic operations",
    keywords: ["add", "subtract", "operation", "sum", "difference", "plus", "minus", "OA", "NBT"],
    svg: (
      <svg viewBox="0 0 180 120" xmlns="http://www.w3.org/2000/svg">
        <style>{`
          @keyframes collect { 0%,100% { transform: translateX(0); } 50% { transform: translateX(8px); } }
          @keyframes countUp { 0% { opacity: 0; } 30% { opacity: 1; } 100% { opacity: 1; } }
          .collector { animation: collect 2s ease-in-out infinite; }
          .item1 { animation: countUp 2s ease-in-out infinite; }
          .item2 { animation: countUp 2s ease-in-out 0.4s infinite; opacity: 0; }
          .item3 { animation: countUp 2s ease-in-out 0.8s infinite; opacity: 0; }
        `}</style>
        {BG}
        <g className="collector">
          {HEAD(35, 50)}
          {BODY(35, 56, 75)}
          <line x1={35} y1={62} x2={50} y2={55} stroke="#e4e4e7" strokeWidth={2} />
          <line x1={35} y1={62} x2={20} y2={68} stroke="#e4e4e7" strokeWidth={2} />
          {LEGS(35, 75, 8)}
        </g>
        {/* Resources */}
        <circle className="item1" cx={70} cy={70} r={4} fill="#f59e0b" />
        <circle className="item2" cx={90} cy={65} r={4} fill="#f59e0b" />
        <circle className="item3" cx={110} cy={70} r={4} fill="#f59e0b" />
        {/* Score */}
        <rect x={120} y={30} width={50} height={22} rx={4} fill="none" stroke="#60a5fa" strokeWidth={1.5} />
        <text x={145} y={45} fontSize={10} fill="#60a5fa" textAnchor="middle" fontFamily="monospace">3 + 2</text>
        {LABEL(90, 110, "collect to add up")}
      </svg>
    ),
  },

  // 2. Partitioning — fractions and ratios
  {
    id: "partitioning",
    title: "Split & Share",
    mathDomain: "fractions and ratios",
    keywords: ["fraction", "ratio", "part", "whole", "half", "quarter", "third", "NF", "RP", "partition"],
    svg: (
      <svg viewBox="0 0 180 120" xmlns="http://www.w3.org/2000/svg">
        <style>{`
          @keyframes slice { 0%,40% { transform: translateY(0); } 50%,90% { transform: translateY(3px); } }
          @keyframes spread { 0%,40% { transform: translateX(0); } 60%,100% { transform: translateX(var(--dx)); } }
          .knife { animation: slice 2.5s ease-in-out infinite; }
          .pieceL { animation: spread 2.5s ease-in-out infinite; --dx: -6px; }
          .pieceR { animation: spread 2.5s ease-in-out infinite; --dx: 6px; }
        `}</style>
        {BG}
        {HEAD(30, 40)}
        {BODY(30, 46, 65)}
        <line x1={30} y1={52} x2={45} y2={48} stroke="#e4e4e7" strokeWidth={2} />
        <line x1={30} y1={52} x2={15} y2={55} stroke="#e4e4e7" strokeWidth={2} />
        {LEGS(30, 65, 7)}
        {/* Pizza/circle being split */}
        <g transform="translate(100, 55)">
          <circle cx={0} cy={0} r={22} fill="none" stroke="#f59e0b" strokeWidth={2} />
          <line className="knife" x1={0} y1={-22} x2={0} y2={22} stroke="#60a5fa" strokeWidth={2} />
          <text x={-12} y={5} fontSize={9} fill="#e4e4e7" fontFamily="monospace">1/2</text>
          <text x={6} y={5} fontSize={9} fill="#e4e4e7" fontFamily="monospace">1/2</text>
        </g>
        {LABEL(90, 110, "split into equal parts")}
      </svg>
    ),
  },

  // 3. Balance Systems — equations
  {
    id: "balance-systems",
    title: "Balance & Equalize",
    mathDomain: "equations",
    keywords: ["equal", "equation", "balance", "solve", "variable", "unknown", "EE", "A-REI", "A-CED"],
    svg: (
      <svg viewBox="0 0 180 120" xmlns="http://www.w3.org/2000/svg">
        <style>{`
          @keyframes tilt { 0%,100% { transform: rotate(-3deg); } 50% { transform: rotate(3deg); } }
          @keyframes drop { 0%,60% { transform: translateY(-10px); opacity: 0; } 70%,100% { transform: translateY(0); opacity: 1; } }
          .beam { animation: tilt 3s ease-in-out infinite; transform-origin: 90px 50px; }
          .newWeight { animation: drop 3s ease-in-out infinite; }
        `}</style>
        {BG}
        {/* Fulcrum */}
        <polygon points="90,70 80,85 100,85" fill="none" stroke="#e4e4e7" strokeWidth={1.5} />
        {/* Beam */}
        <g className="beam">
          <line x1={40} y1={50} x2={140} y2={50} stroke="#e4e4e7" strokeWidth={2} />
          {/* Left side weights */}
          <rect x={48} y={38} width={12} height={12} rx={2} fill="#60a5fa" opacity={0.6} />
          <rect x={63} y={38} width={12} height={12} rx={2} fill="#60a5fa" opacity={0.6} />
          {/* Right side */}
          <rect x={108} y={38} width={12} height={12} rx={2} fill="#f59e0b" opacity={0.6} />
          <rect className="newWeight" x={123} y={38} width={12} height={12} rx={2} fill="#f59e0b" opacity={0} />
        </g>
        {/* Labels */}
        <text x={60} y={32} fontSize={8} fill="#60a5fa" textAnchor="middle" fontFamily="monospace">2x</text>
        <text x={120} y={32} fontSize={8} fill="#f59e0b" textAnchor="middle" fontFamily="monospace">= ?</text>
        {LABEL(90, 110, "make both sides equal")}
      </svg>
    ),
  },

  // 4. Spatial Puzzles — geometry
  {
    id: "spatial-puzzles",
    title: "Fit & Rotate",
    mathDomain: "geometry",
    keywords: ["shape", "angle", "rotate", "symmetry", "transform", "congruent", "geometry", "G"],
    svg: (
      <svg viewBox="0 0 180 120" xmlns="http://www.w3.org/2000/svg">
        <style>{`
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          @keyframes slideIn { 0%,30% { transform: translate(20px, -10px); opacity: 0.3; } 60%,100% { transform: translate(0,0); opacity: 1; } }
          .rotating { animation: spin 4s linear infinite; transform-origin: 130px 55px; }
          .sliding { animation: slideIn 3s ease-in-out infinite; }
        `}</style>
        {BG}
        {HEAD(30, 40)}
        {BODY(30, 46, 65)}
        <line x1={30} y1={52} x2={45} y2={45} stroke="#e4e4e7" strokeWidth={2} />
        <line x1={30} y1={52} x2={18} y2={58} stroke="#e4e4e7" strokeWidth={2} />
        {LEGS(30, 65, 7)}
        {/* Puzzle grid */}
        <rect x={60} y={35} width={40} height={40} rx={2} fill="none" stroke="#60a5fa" strokeWidth={1} strokeDasharray="3,2" />
        {/* Piece sliding in */}
        <g className="sliding">
          <polygon points="60,55 80,35 80,55" fill="#60a5fa" opacity={0.3} stroke="#60a5fa" strokeWidth={1.5} />
        </g>
        {/* Rotating shape */}
        <g className="rotating">
          <polygon points="130,40 145,55 130,70 115,55" fill="none" stroke="#f59e0b" strokeWidth={1.5} />
        </g>
        {LABEL(90, 110, "rotate to fit")}
      </svg>
    ),
  },

  // 5. Probability Systems — statistics
  {
    id: "probability-systems",
    title: "Roll & Predict",
    mathDomain: "statistics and probability",
    keywords: ["probability", "chance", "data", "random", "likely", "predict", "statistics", "SP", "S-CP", "S-ID"],
    svg: (
      <svg viewBox="0 0 180 120" xmlns="http://www.w3.org/2000/svg">
        <style>{`
          @keyframes roll { 0%,20% { transform: rotate(0deg) translateY(0); } 40% { transform: rotate(180deg) translateY(-15px); } 60%,100% { transform: rotate(360deg) translateY(0); } }
          @keyframes barGrow { 0% { height: 0; y: 85; } 100% { height: var(--h); y: var(--y); } }
          .die { animation: roll 2s ease-in-out infinite; transform-origin: 45px 55px; }
          .bar1 { animation: barGrow 1.5s ease-out forwards; --h: 15px; --y: 70px; }
          .bar2 { animation: barGrow 1.5s ease-out 0.2s forwards; --h: 35px; --y: 50px; }
          .bar3 { animation: barGrow 1.5s ease-out 0.4s forwards; --h: 25px; --y: 60px; }
        `}</style>
        {BG}
        {/* Dice */}
        <g className="die">
          <rect x={33} y={43} width={24} height={24} rx={3} fill="none" stroke="#e4e4e7" strokeWidth={2} />
          <circle cx={41} cy={51} r={2} fill="#e4e4e7" />
          <circle cx={49} cy={59} r={2} fill="#e4e4e7" />
          <circle cx={45} cy={55} r={2} fill="#e4e4e7" />
        </g>
        {/* Bar chart */}
        <line x1={95} y1={85} x2={165} y2={85} stroke="#71717a" strokeWidth={1} />
        <rect className="bar1" x={100} y={85} width={14} height={0} fill="#60a5fa" opacity={0.6} rx={1} />
        <rect className="bar2" x={120} y={85} width={14} height={0} fill="#60a5fa" opacity={0.8} rx={1} />
        <rect className="bar3" x={140} y={85} width={14} height={0} fill="#60a5fa" opacity={0.7} rx={1} />
        {LABEL(45, 110, "roll")}
        {LABEL(130, 110, "track results")}
      </svg>
    ),
  },

  // 6. Path Optimization — graph reasoning
  {
    id: "path-optimization",
    title: "Navigate & Optimize",
    mathDomain: "graph reasoning",
    keywords: ["path", "graph", "shortest", "route", "network", "vertex", "edge", "distance"],
    svg: (
      <svg viewBox="0 0 180 120" xmlns="http://www.w3.org/2000/svg">
        <style>{`
          @keyframes walk { 0% { offset-distance: 0%; } 100% { offset-distance: 100%; } }
          @keyframes glow { 0%,100% { stroke: #60a5fa; } 50% { stroke: #22c55e; } }
          .pathGlow { animation: glow 2s ease-in-out infinite; }
          .walker { animation: walk 4s linear infinite; offset-path: path('M 30 80 L 70 40 L 120 60 L 155 30'); }
        `}</style>
        {BG}
        {/* Nodes */}
        <circle cx={30} cy={80} r={5} fill="#60a5fa" opacity={0.5} />
        <circle cx={70} cy={40} r={5} fill="#60a5fa" opacity={0.5} />
        <circle cx={120} cy={60} r={5} fill="#60a5fa" opacity={0.5} />
        <circle cx={155} cy={30} r={5} fill="#22c55e" opacity={0.7} />
        {/* Paths */}
        <line x1={30} y1={80} x2={70} y2={40} stroke="#71717a" strokeWidth={1} strokeDasharray="3,2" />
        <line x1={70} y1={40} x2={120} y2={60} stroke="#71717a" strokeWidth={1} strokeDasharray="3,2" />
        <line x1={120} y1={60} x2={155} y2={30} stroke="#71717a" strokeWidth={1} strokeDasharray="3,2" />
        {/* Alternate paths */}
        <line x1={30} y1={80} x2={120} y2={60} stroke="#71717a" strokeWidth={0.5} strokeDasharray="2,3" opacity={0.3} />
        <line x1={70} y1={40} x2={155} y2={30} stroke="#71717a" strokeWidth={0.5} strokeDasharray="2,3" opacity={0.3} />
        {/* Optimal path highlight */}
        <path className="pathGlow" d="M 30 80 L 70 40 L 120 60 L 155 30" fill="none" strokeWidth={2} />
        {/* Distance labels */}
        <text x={45} y={55} fontSize={7} fill="#f59e0b" fontFamily="monospace">5</text>
        <text x={90} y={45} fontSize={7} fill="#f59e0b" fontFamily="monospace">7</text>
        <text x={140} y={40} fontSize={7} fill="#f59e0b" fontFamily="monospace">4</text>
        {/* Walking dot */}
        <circle className="walker" r={4} fill="#f59e0b" />
        {LABEL(90, 110, "find the best path")}
      </svg>
    ),
  },

  // 7. Construction Systems — area and volume
  {
    id: "construction-systems",
    title: "Build & Measure",
    mathDomain: "area and volume",
    keywords: ["area", "volume", "perimeter", "length", "width", "height", "square", "cube", "MD", "G-GMD"],
    svg: (
      <svg viewBox="0 0 180 120" xmlns="http://www.w3.org/2000/svg">
        <style>{`
          @keyframes stack { 0%,30% { transform: translateY(0); opacity: 1; } 50% { transform: translateY(-20px); opacity: 0.5; } 70%,100% { transform: translateY(-20px); opacity: 1; } }
          .block3 { animation: stack 3s ease-in-out infinite; }
        `}</style>
        {BG}
        {HEAD(30, 35)}
        {BODY(30, 41, 60)}
        <line x1={30} y1={48} x2={45} y2={42} stroke="#e4e4e7" strokeWidth={2} />
        <line x1={30} y1={48} x2={18} y2={52} stroke="#e4e4e7" strokeWidth={2} />
        {LEGS(30, 60, 7)}
        {/* Grid blocks */}
        <rect x={65} y={65} width={20} height={20} fill="#60a5fa" opacity={0.3} stroke="#60a5fa" strokeWidth={1} />
        <rect x={85} y={65} width={20} height={20} fill="#60a5fa" opacity={0.3} stroke="#60a5fa" strokeWidth={1} />
        <rect x={65} y={45} width={20} height={20} fill="#60a5fa" opacity={0.3} stroke="#60a5fa" strokeWidth={1} />
        <rect x={85} y={45} width={20} height={20} fill="#60a5fa" opacity={0.3} stroke="#60a5fa" strokeWidth={1} />
        {/* New block being placed */}
        <rect className="block3" x={105} y={65} width={20} height={20} fill="#f59e0b" opacity={0.5} stroke="#f59e0b" strokeWidth={1} />
        {/* Measurements */}
        <line x1={63} y1={90} x2={107} y2={90} stroke="#f59e0b" strokeWidth={1} />
        <text x={85} y={100} fontSize={7} fill="#f59e0b" textAnchor="middle" fontFamily="monospace">2 x 3</text>
        {LABEL(130, 75, "area = 6")}
      </svg>
    ),
  },

  // 8. Motion Simulation — rates and slopes
  {
    id: "motion-simulation",
    title: "Race & Calculate",
    mathDomain: "rates and slopes",
    keywords: ["rate", "speed", "slope", "distance", "time", "per", "unit rate", "RP", "F-IF", "F-LE"],
    svg: (
      <svg viewBox="0 0 180 120" xmlns="http://www.w3.org/2000/svg">
        <style>{`
          @keyframes run { 0% { transform: translateX(0); } 100% { transform: translateX(100px); } }
          @keyframes legMove { 0%,100% { transform: rotate(-15deg); } 50% { transform: rotate(15deg); } }
          .runner { animation: run 3s linear infinite; }
        `}</style>
        {BG}
        {/* Track */}
        <line x1={15} y1={80} x2={165} y2={80} stroke="#71717a" strokeWidth={1} />
        {/* Distance markers */}
        <line x1={15} y1={78} x2={15} y2={82} stroke="#71717a" strokeWidth={1} />
        <line x1={65} y1={78} x2={65} y2={82} stroke="#71717a" strokeWidth={1} />
        <line x1={115} y1={78} x2={115} y2={82} stroke="#71717a" strokeWidth={1} />
        <line x1={165} y1={78} x2={165} y2={82} stroke="#71717a" strokeWidth={1} />
        <text x={15} y={92} fontSize={6} fill="#71717a" textAnchor="middle">0</text>
        <text x={65} y={92} fontSize={6} fill="#71717a" textAnchor="middle">10</text>
        <text x={115} y={92} fontSize={6} fill="#71717a" textAnchor="middle">20</text>
        <text x={165} y={92} fontSize={6} fill="#71717a" textAnchor="middle">30m</text>
        {/* Runner */}
        <g className="runner">
          {HEAD(15, 60)}
          {BODY(15, 66, 78)}
          <line x1={15} y1={70} x2={25} y2={67} stroke="#e4e4e7" strokeWidth={2} />
          <line x1={15} y1={70} x2={8} y2={73} stroke="#e4e4e7" strokeWidth={2} />
        </g>
        {/* Speed label */}
        <rect x={55} y={25} width={70} height={20} rx={4} fill="none" stroke="#60a5fa" strokeWidth={1} />
        <text x={90} y={38} fontSize={8} fill="#60a5fa" textAnchor="middle" fontFamily="monospace">10 m/sec</text>
        {LABEL(90, 110, "speed = distance / time")}
      </svg>
    ),
  },

  // 9. Constraint Puzzles — logical reasoning
  {
    id: "constraint-puzzles",
    title: "Solve & Eliminate",
    mathDomain: "logical reasoning",
    keywords: ["logic", "reason", "if", "then", "constraint", "rule", "deduce", "MP"],
    svg: (
      <svg viewBox="0 0 180 120" xmlns="http://www.w3.org/2000/svg">
        <style>{`
          @keyframes crossOut { 0%,60% { opacity: 0; } 70%,100% { opacity: 1; } }
          @keyframes highlight { 0%,70% { stroke: #60a5fa; } 80%,100% { stroke: #22c55e; fill: rgba(34,197,94,0.15); } }
          .cross { animation: crossOut 3s ease-in-out infinite; }
          .answer { animation: highlight 3s ease-in-out infinite; }
        `}</style>
        {BG}
        {HEAD(25, 40)}
        {BODY(25, 46, 62)}
        <line x1={25} y1={52} x2={38} y2={48} stroke="#e4e4e7" strokeWidth={2} />
        <line x1={25} y1={52} x2={14} y2={55} stroke="#e4e4e7" strokeWidth={2} />
        {LEGS(25, 62, 6)}
        {/* Options grid */}
        <rect x={55} y={30} width={30} height={22} rx={3} fill="none" stroke="#60a5fa" strokeWidth={1.5} />
        <text x={70} y={45} fontSize={10} fill="#60a5fa" textAnchor="middle" fontFamily="monospace">A</text>
        <rect x={95} y={30} width={30} height={22} rx={3} fill="none" stroke="#60a5fa" strokeWidth={1.5} />
        <text x={110} y={45} fontSize={10} fill="#60a5fa" textAnchor="middle" fontFamily="monospace">B</text>
        <rect className="answer" x={135} y={30} width={30} height={22} rx={3} fill="none" stroke="#60a5fa" strokeWidth={1.5} />
        <text x={150} y={45} fontSize={10} fill="#60a5fa" textAnchor="middle" fontFamily="monospace">C</text>
        {/* Cross out wrong answers */}
        <line className="cross" x1={55} y1={30} x2={85} y2={52} stroke="#fb7185" strokeWidth={2} />
        <line className="cross" x1={85} y1={30} x2={55} y2={52} stroke="#fb7185" strokeWidth={2} />
        <line className="cross" x1={95} y1={30} x2={125} y2={52} stroke="#fb7185" strokeWidth={2} style={{ animationDelay: "0.3s" }} />
        <line className="cross" x1={125} y1={30} x2={95} y2={52} stroke="#fb7185" strokeWidth={2} style={{ animationDelay: "0.3s" }} />
        {/* Rule */}
        <text x={110} y={75} fontSize={7} fill="#71717a" textAnchor="middle" fontFamily="sans-serif">rule: must be {'>'} 5</text>
        {LABEL(90, 110, "eliminate wrong answers")}
      </svg>
    ),
  },

  // 10. Strategy Economy — exponential growth
  {
    id: "strategy-economy",
    title: "Grow & Compound",
    mathDomain: "exponential growth",
    keywords: ["exponent", "growth", "double", "multiply", "compound", "power", "F-LE", "F-BF"],
    svg: (
      <svg viewBox="0 0 180 120" xmlns="http://www.w3.org/2000/svg">
        <style>{`
          @keyframes growCurve { 0% { stroke-dashoffset: 100; } 100% { stroke-dashoffset: 0; } }
          @keyframes pop1 { 0%,30% { r: 0; } 40%,100% { r: 3; } }
          @keyframes pop2 { 0%,50% { r: 0; } 60%,100% { r: 3; } }
          @keyframes pop3 { 0%,70% { r: 0; } 80%,100% { r: 3; } }
          .curve { stroke-dasharray: 100; animation: growCurve 3s ease-out infinite; }
          .dot1 { animation: pop1 3s ease-out infinite; }
          .dot2 { animation: pop2 3s ease-out infinite; }
          .dot3 { animation: pop3 3s ease-out infinite; }
        `}</style>
        {BG}
        {/* Axes */}
        <line x1={30} y1={90} x2={160} y2={90} stroke="#71717a" strokeWidth={1} />
        <line x1={30} y1={90} x2={30} y2={15} stroke="#71717a" strokeWidth={1} />
        {/* Exponential curve */}
        <path className="curve" d="M 30 85 Q 60 82 80 75 Q 100 65 120 45 Q 140 20 155 15" fill="none" stroke="#60a5fa" strokeWidth={2} />
        {/* Data points */}
        <circle className="dot1" cx={80} cy={75} fill="#f59e0b" />
        <circle className="dot2" cx={120} cy={45} fill="#f59e0b" />
        <circle className="dot3" cx={155} cy={15} fill="#f59e0b" />
        {/* Labels */}
        <text x={80} y={88} fontSize={6} fill="#71717a" textAnchor="middle">1x</text>
        <text x={120} y={88} fontSize={6} fill="#71717a" textAnchor="middle">2x</text>
        <text x={155} y={88} fontSize={6} fill="#71717a" textAnchor="middle">4x</text>
        {LABEL(90, 110, "growth doubles each turn")}
      </svg>
    ),
  },

  // 11. Measurement Challenges — units and geometry
  {
    id: "measurement-challenges",
    title: "Measure & Compare",
    mathDomain: "units and measurement",
    keywords: ["measure", "unit", "length", "weight", "capacity", "convert", "estimate", "MD"],
    svg: (
      <svg viewBox="0 0 180 120" xmlns="http://www.w3.org/2000/svg">
        <style>{`
          @keyframes grow { 0%,100% { width: 40px; } 50% { width: 70px; } }
          @keyframes measure { 0%,100% { transform: translateX(0); } 50% { transform: translateX(30px); } }
          .measuring { animation: measure 2.5s ease-in-out infinite; }
        `}</style>
        {BG}
        {HEAD(25, 45)}
        {BODY(25, 51, 68)}
        <line x1={25} y1={56} x2={40} y2={50} stroke="#e4e4e7" strokeWidth={2} />
        <line x1={25} y1={56} x2={14} y2={60} stroke="#e4e4e7" strokeWidth={2} />
        {LEGS(25, 68, 6)}
        {/* Ruler */}
        <g className="measuring">
          <rect x={50} y={52} width={80} height={8} rx={1} fill="none" stroke="#f59e0b" strokeWidth={1.5} />
          {[0,1,2,3,4,5,6,7,8].map(i => (
            <line key={i} x1={50 + i * 10} y1={52} x2={50 + i * 10} y2={i % 2 === 0 ? 56 : 54} stroke="#f59e0b" strokeWidth={1} />
          ))}
        </g>
        {/* Objects to measure */}
        <rect x={55} y={72} width={35} height={12} rx={3} fill="#60a5fa" opacity={0.4} stroke="#60a5fa" strokeWidth={1} />
        <rect x={100} y={72} width={55} height={12} rx={3} fill="#60a5fa" opacity={0.4} stroke="#60a5fa" strokeWidth={1} />
        <text x={72} y={98} fontSize={7} fill="#60a5fa" textAnchor="middle" fontFamily="monospace">3.5</text>
        <text x={127} y={98} fontSize={7} fill="#60a5fa" textAnchor="middle" fontFamily="monospace">5.5</text>
        {LABEL(90, 110, "measure and compare")}
      </svg>
    ),
  },

  // 12. Scoring & Ranking — ordering, comparison, number sense
  {
    id: "scoring-ranking",
    title: "Score & Rank",
    mathDomain: "ordering and comparison",
    keywords: ["order", "compare", "greater", "less", "rank", "sort", "number sense", "CC", "NBT"],
    svg: (
      <svg viewBox="0 0 180 120" xmlns="http://www.w3.org/2000/svg">
        <style>{`
          @keyframes slideUp { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
          .gold { animation: slideUp 2s ease-in-out infinite; }
        `}</style>
        {BG}
        {/* Podium */}
        <rect x={60} y={55} width={25} height={30} fill="#60a5fa" opacity={0.4} stroke="#60a5fa" strokeWidth={1} />
        <rect className="gold" x={85} y={40} width={25} height={45} fill="#f59e0b" opacity={0.4} stroke="#f59e0b" strokeWidth={1} />
        <rect x={110} y={65} width={25} height={20} fill="#60a5fa" opacity={0.3} stroke="#60a5fa" strokeWidth={1} />
        {/* Numbers */}
        <text x={72} y={75} fontSize={10} fill="#e4e4e7" textAnchor="middle" fontFamily="monospace">2nd</text>
        <text x={97} y={60} fontSize={10} fill="#f59e0b" textAnchor="middle" fontFamily="monospace">1st</text>
        <text x={122} y={78} fontSize={10} fill="#e4e4e7" textAnchor="middle" fontFamily="monospace">3rd</text>
        {/* Stick figures on podium */}
        {HEAD(72, 42)}
        {HEAD(97, 27)}
        {HEAD(122, 52)}
        {/* Scores */}
        <text x={72} y={100} fontSize={7} fill="#71717a" textAnchor="middle">85</text>
        <text x={97} y={100} fontSize={7} fill="#f59e0b" textAnchor="middle">97</text>
        <text x={122} y={100} fontSize={7} fill="#71717a" textAnchor="middle">72</text>
        {LABEL(90, 112, "rank by score")}
      </svg>
    ),
  },

  // 13. Timing & Rhythm — patterns and sequences
  {
    id: "timing-rhythm",
    title: "Pattern & Repeat",
    mathDomain: "patterns and sequences",
    keywords: ["pattern", "sequence", "repeat", "rule", "next", "term", "OA", "F-BF"],
    svg: (
      <svg viewBox="0 0 180 120" xmlns="http://www.w3.org/2000/svg">
        <style>{`
          @keyframes beat1 { 0%,100% { r: 5; opacity: 0.5; } 10%,20% { r: 8; opacity: 1; } }
          @keyframes beat2 { 0%,100% { r: 5; opacity: 0.5; } 30%,40% { r: 8; opacity: 1; } }
          @keyframes beat3 { 0%,100% { r: 5; opacity: 0.5; } 50%,60% { r: 8; opacity: 1; } }
          @keyframes beat4 { 0%,100% { r: 5; opacity: 0.5; } 70%,80% { r: 8; opacity: 1; } }
          .b1 { animation: beat1 2s linear infinite; }
          .b2 { animation: beat2 2s linear infinite; }
          .b3 { animation: beat3 2s linear infinite; }
          .b4 { animation: beat4 2s linear infinite; }
        `}</style>
        {BG}
        {/* Pattern sequence */}
        <circle className="b1" cx={30} cy={45} r={5} fill="#60a5fa" />
        <circle className="b2" cx={60} cy={45} r={5} fill="#f59e0b" />
        <circle className="b3" cx={90} cy={45} r={5} fill="#60a5fa" />
        <circle className="b4" cx={120} cy={45} r={5} fill="#f59e0b" />
        {/* Next in pattern — question */}
        <circle cx={150} cy={45} r={7} fill="none" stroke="#71717a" strokeWidth={1.5} strokeDasharray="3,2" />
        <text x={150} y={48} fontSize={10} fill="#71717a" textAnchor="middle">?</text>
        {/* Labels */}
        <text x={30} y={65} fontSize={7} fill="#60a5fa" textAnchor="middle">A</text>
        <text x={60} y={65} fontSize={7} fill="#f59e0b" textAnchor="middle">B</text>
        <text x={90} y={65} fontSize={7} fill="#60a5fa" textAnchor="middle">A</text>
        <text x={120} y={65} fontSize={7} fill="#f59e0b" textAnchor="middle">B</text>
        <text x={150} y={65} fontSize={7} fill="#71717a" textAnchor="middle">?</text>
        {LABEL(90, 110, "find the pattern")}
      </svg>
    ),
  },

  // 14. Scaling & Resizing — proportional reasoning
  {
    id: "scaling-resizing",
    title: "Scale & Transform",
    mathDomain: "proportional reasoning",
    keywords: ["proportion", "scale", "ratio", "similar", "enlarge", "shrink", "G-SRT", "RP"],
    svg: (
      <svg viewBox="0 0 180 120" xmlns="http://www.w3.org/2000/svg">
        <style>{`
          @keyframes scaleUp { 0%,100% { transform: scale(1); } 50% { transform: scale(1.4); } }
          .scaling { animation: scaleUp 2.5s ease-in-out infinite; transform-origin: 120px 55px; }
        `}</style>
        {BG}
        {/* Small shape */}
        <rect x={30} y={40} width={20} height={30} rx={2} fill="none" stroke="#60a5fa" strokeWidth={1.5} />
        <text x={40} y={80} fontSize={6} fill="#71717a" textAnchor="middle">1x</text>
        {/* Arrow */}
        <line x1={60} y1={55} x2={85} y2={55} stroke="#71717a" strokeWidth={1} />
        <polygon points="85,52 92,55 85,58" fill="#71717a" />
        <text x={75} y={48} fontSize={7} fill="#f59e0b" textAnchor="middle">x2</text>
        {/* Large shape (scaling) */}
        <g className="scaling">
          <rect x={100} y={30} width={40} height={50} rx={2} fill="none" stroke="#f59e0b" strokeWidth={1.5} />
        </g>
        <text x={120} y={95} fontSize={6} fill="#71717a" textAnchor="middle">2x</text>
        {LABEL(90, 110, "same shape, different size")}
      </svg>
    ),
  },

  // 15. Inventory & Crafting — addition, subtraction, grouping
  {
    id: "inventory-crafting",
    title: "Craft & Combine",
    mathDomain: "addition and grouping",
    keywords: ["add", "group", "combine", "total", "altogether", "OA", "NBT"],
    svg: (
      <svg viewBox="0 0 180 120" xmlns="http://www.w3.org/2000/svg">
        <style>{`
          @keyframes merge { 0%,40% { transform: translateX(0); } 60%,100% { transform: translateX(15px); } }
          @keyframes mergeR { 0%,40% { transform: translateX(0); } 60%,100% { transform: translateX(-15px); } }
          @keyframes appear { 0%,70% { opacity: 0; transform: scale(0.5); } 80%,100% { opacity: 1; transform: scale(1); } }
          .mergeL { animation: merge 3s ease-in-out infinite; }
          .mergeR { animation: mergeR 3s ease-in-out infinite; }
          .result { animation: appear 3s ease-in-out infinite; transform-origin: 130px 50px; }
        `}</style>
        {BG}
        {/* Ingredients */}
        <g className="mergeL">
          <rect x={30} y={40} width={18} height={18} rx={3} fill="#60a5fa" opacity={0.5} stroke="#60a5fa" strokeWidth={1} />
          <text x={39} y={52} fontSize={8} fill="#e4e4e7" textAnchor="middle">3</text>
        </g>
        <text x={65} y={52} fontSize={12} fill="#71717a" textAnchor="middle">+</text>
        <g className="mergeR">
          <rect x={75} y={40} width={18} height={18} rx={3} fill="#f59e0b" opacity={0.5} stroke="#f59e0b" strokeWidth={1} />
          <text x={84} y={52} fontSize={8} fill="#e4e4e7" textAnchor="middle">4</text>
        </g>
        {/* Arrow */}
        <text x={108} y={52} fontSize={10} fill="#71717a" textAnchor="middle">=</text>
        {/* Result */}
        <g className="result">
          <rect x={118} y={36} width={24} height={24} rx={4} fill="#22c55e" opacity={0.3} stroke="#22c55e" strokeWidth={1.5} />
          <text x={130} y={52} fontSize={10} fill="#22c55e" textAnchor="middle" fontWeight="bold">7</text>
        </g>
        {LABEL(90, 90, "combine ingredients")}
      </svg>
    ),
  },

  // 16. Terrain Generation — coordinate systems
  {
    id: "terrain-generation",
    title: "Plot & Explore",
    mathDomain: "coordinate systems",
    keywords: ["coordinate", "grid", "plot", "x", "y", "axis", "point", "ordered pair", "G-GPE"],
    svg: (
      <svg viewBox="0 0 180 120" xmlns="http://www.w3.org/2000/svg">
        <style>{`
          @keyframes blink { 0%,100% { opacity: 0.3; } 50% { opacity: 1; } }
          @keyframes moveDot { 0% { cx: 55; cy: 75; } 33% { cx: 95; cy: 45; } 66% { cx: 135; cy: 35; } 100% { cx: 55; cy: 75; } }
          .target { animation: blink 1.5s ease-in-out infinite; }
          .explorer { animation: moveDot 4s ease-in-out infinite; }
        `}</style>
        {BG}
        {/* Grid */}
        <line x1={35} y1={90} x2={165} y2={90} stroke="#71717a" strokeWidth={1} />
        <line x1={35} y1={90} x2={35} y2={20} stroke="#71717a" strokeWidth={1} />
        {/* Grid lines */}
        {[1,2,3,4].map(i => (
          <g key={i}>
            <line x1={35 + i * 30} y1={88} x2={35 + i * 30} y2={20} stroke="#71717a" strokeWidth={0.3} />
            <line x1={35} y1={90 - i * 15} x2={165} y2={90 - i * 15} stroke="#71717a" strokeWidth={0.3} />
          </g>
        ))}
        {/* Axis labels */}
        <text x={90} y={102} fontSize={7} fill="#71717a" textAnchor="middle">x</text>
        <text x={28} y={55} fontSize={7} fill="#71717a" textAnchor="middle">y</text>
        {/* Points */}
        <circle className="target" cx={95} cy={45} r={4} fill="#f59e0b" />
        <circle cx={135} cy={35} r={3} fill="#60a5fa" opacity={0.5} />
        {/* Explorer dot */}
        <circle className="explorer" cx={55} cy={75} r={5} fill="#22c55e" />
        {/* Coordinate label */}
        <text x={95} y={38} fontSize={7} fill="#f59e0b" textAnchor="middle" fontFamily="monospace">(2,3)</text>
        {LABEL(90, 112, "navigate the grid")}
      </svg>
    ),
  },

  // 17. Bidding & Auction — estimation, place value
  {
    id: "bidding-auction",
    title: "Bid & Estimate",
    mathDomain: "estimation and place value",
    keywords: ["estimate", "round", "approximate", "place value", "digit", "value", "NBT"],
    svg: (
      <svg viewBox="0 0 180 120" xmlns="http://www.w3.org/2000/svg">
        <style>{`
          @keyframes bidUp { 0%,100% { transform: translateY(0); } 30%,60% { transform: translateY(-8px); } }
          @keyframes counter { 0% { } 30% { } 60% { } }
          .bidder { animation: bidUp 2.5s ease-in-out infinite; }
        `}</style>
        {BG}
        {/* Bidder 1 */}
        <g className="bidder">
          {HEAD(35, 50)}
          {BODY(35, 56, 72)}
          <line x1={35} y1={60} x2={48} y2={50} stroke="#e4e4e7" strokeWidth={2} />
          <line x1={35} y1={60} x2={22} y2={65} stroke="#e4e4e7" strokeWidth={2} />
          {LEGS(35, 72, 6)}
        </g>
        {/* Bid sign */}
        <rect x={48} y={38} width={30} height={16} rx={3} fill="#60a5fa" opacity={0.3} stroke="#60a5fa" strokeWidth={1} />
        <text x={63} y={50} fontSize={8} fill="#60a5fa" textAnchor="middle" fontFamily="monospace">$25</text>
        {/* Bidder 2 */}
        {HEAD(140, 55)}
        {BODY(140, 61, 75)}
        <line x1={140} y1={65} x2={128} y2={55} stroke="#e4e4e7" strokeWidth={2} />
        <line x1={140} y1={65} x2={152} y2={68} stroke="#e4e4e7" strokeWidth={2} />
        {LEGS(140, 75, 6)}
        <rect x={103} y={43} width={30} height={16} rx={3} fill="#f59e0b" opacity={0.3} stroke="#f59e0b" strokeWidth={1} />
        <text x={118} y={55} fontSize={8} fill="#f59e0b" textAnchor="middle" fontFamily="monospace">$30</text>
        {/* Item */}
        <rect x={75} y={75} width={30} height={15} rx={3} fill="none" stroke="#71717a" strokeWidth={1.5} />
        <text x={90} y={86} fontSize={7} fill="#71717a" textAnchor="middle">?</text>
        {LABEL(90, 110, "guess the value")}
      </svg>
    ),
  },
]

// Match mechanics to a standard based on keywords
export function matchMechanics(description: string, domainCode: string): MechanicAnimation[] {
  const desc = description.toLowerCase()
  const scored = MECHANIC_ANIMATIONS.map(m => {
    let score = 0
    for (const kw of m.keywords) {
      if (desc.includes(kw.toLowerCase())) score += 2
      if (domainCode.includes(kw.toUpperCase())) score += 3
    }
    return { mechanic: m, score }
  })
  // Sort by score descending, take top 3
  scored.sort((a, b) => b.score - a.score)
  // Always return at least 3 — if not enough matches, fill with highest-scored
  return scored.slice(0, 3).map(s => s.mechanic)
}
