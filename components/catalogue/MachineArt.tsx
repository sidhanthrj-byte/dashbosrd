// Technical line illustrations of each machine, spec-drawing style.
// Monochrome strokes; sized to sit at the base of the effect stage.

const S = '#8a8378'; // stroke
const F = '#141412'; // fill
const D = '#57524a'; // detail stroke

function Base({ w = 84, x = 58 }: { w?: number; x?: number }) {
  // ground shadow line
  return <line x1={x - 10} y1={132} x2={x + w + 10} y2={132} stroke={D} strokeWidth={1} />;
}

/* Floor-standing cold spark unit: rectangular chassis, top nozzle, side vents */
function SparkUnit({ x = 70 }: { x?: number }) {
  return (
    <g>
      <rect x={x} y={92} width={60} height={38} rx={3} fill={F} stroke={S} strokeWidth={1.5} />
      <rect x={x + 22} y={84} width={16} height={8} fill={F} stroke={S} strokeWidth={1.5} />
      <line x1={x + 8} y1={102} x2={x + 8} y2={120} stroke={D} strokeWidth={1} />
      <line x1={x + 14} y1={102} x2={x + 14} y2={120} stroke={D} strokeWidth={1} />
      <line x1={x + 46} y1={102} x2={x + 46} y2={120} stroke={D} strokeWidth={1} />
      <line x1={x + 52} y1={102} x2={x + 52} y2={120} stroke={D} strokeWidth={1} />
      <circle cx={x + 30} cy={111} r={5} fill="none" stroke={D} strokeWidth={1} />
      <rect x={x - 2} y={130} width={64} height={2.5} fill={F} stroke={S} strokeWidth={1} />
    </g>
  );
}

function SpinUnit() {
  return (
    <g>
      <rect x={78} y={104} width={44} height={26} rx={3} fill={F} stroke={S} strokeWidth={1.5} />
      <line x1={100} y1={104} x2={100} y2={92} stroke={S} strokeWidth={1.5} />
      {/* rotor bar */}
      <line x1={72} y1={88} x2={128} y2={88} stroke={S} strokeWidth={2} />
      <rect x={68} y={84} width={10} height={8} rx={1.5} fill={F} stroke={S} strokeWidth={1.5} />
      <rect x={122} y={84} width={10} height={8} rx={1.5} fill={F} stroke={S} strokeWidth={1.5} />
      <circle cx={100} cy={88} r={3.5} fill={F} stroke={S} strokeWidth={1.5} />
      <line x1={86} y1={112} x2={86} y2={124} stroke={D} strokeWidth={1} />
      <line x1={114} y1={112} x2={114} y2={124} stroke={D} strokeWidth={1} />
    </g>
  );
}

/* Angled CO2 jet on base plate with hose */
function JetUnit({ tank = true }: { tank?: boolean }) {
  return (
    <g>
      <rect x={78} y={122} width={48} height={8} rx={2} fill={F} stroke={S} strokeWidth={1.5} />
      {/* near-vertical barrel */}
      <g transform="rotate(-10 101 120)">
        <rect x={90} y={92} width={22} height={30} rx={3} fill={F} stroke={S} strokeWidth={1.5} />
        <path d="M 93 92 L 95 84 L 107 84 L 109 92 Z" fill={F} stroke={S} strokeWidth={1.5} />
        <line x1={94} y1={102} x2={108} y2={102} stroke={D} strokeWidth={1} />
        <line x1={94} y1={109} x2={108} y2={109} stroke={D} strokeWidth={1} />
        <circle cx={101} cy={116} r={2.4} fill="none" stroke={D} strokeWidth={1} />
      </g>
      {tank ? (
        <g>
          <rect x={132} y={94} width={16} height={36} rx={5} fill={F} stroke={S} strokeWidth={1.5} />
          <rect x={137} y={88} width={6} height={6} fill={F} stroke={S} strokeWidth={1.2} />
          <path d="M 132 112 C 120 116 116 120 112 122" fill="none" stroke={D} strokeWidth={1.2} />
        </g>
      ) : (
        <path d="M 124 126 C 136 126 140 122 146 122" fill="none" stroke={D} strokeWidth={1.2} strokeDasharray="3 3" />
      )}
    </g>
  );
}

/* Handheld gun held at angle on display stand */
function GunUnit({ long = false }: { long?: boolean }) {
  const len = long ? 44 : 34;
  return (
    <g>
      <g transform="rotate(-32 100 108)">
        <rect x={100 - len / 2} y={100} width={len} height={10} rx={3} fill={F} stroke={S} strokeWidth={1.5} />
        <rect x={100 - len / 2 - 6} y={101.5} width={7} height={7} fill={F} stroke={S} strokeWidth={1.2} />
        <rect x={96} y={110} width={9} height={14} rx={2} fill={F} stroke={S} strokeWidth={1.5} />
        <line x1={100 + len / 2 - 6} y1={103} x2={100 + len / 2 - 6} y2={107} stroke={D} strokeWidth={1} />
      </g>
      {/* stand */}
      <line x1={100} y1={118} x2={100} y2={130} stroke={D} strokeWidth={1.2} />
      <line x1={90} y1={130} x2={110} y2={130} stroke={S} strokeWidth={1.5} />
    </g>
  );
}

/* Confetti blower: barrel + fan housing on tripod */
function BlowerUnit() {
  return (
    <g>
      <g transform="rotate(-24 100 100)">
        <rect x={84} y={92} width={40} height={18} rx={8} fill={F} stroke={S} strokeWidth={1.5} />
        <ellipse cx={124} cy={101} rx={4} ry={9} fill={F} stroke={S} strokeWidth={1.5} />
        <circle cx={92} cy={101} r={6} fill="none" stroke={D} strokeWidth={1} />
        <line x1={89} y1={98} x2={95} y2={104} stroke={D} strokeWidth={1} />
        <line x1={95} y1={98} x2={89} y2={104} stroke={D} strokeWidth={1} />
      </g>
      {/* hopper */}
      <path d="M 94 84 L 106 84 L 103 94 L 97 94 Z" fill={F} stroke={S} strokeWidth={1.2} />
      {/* tripod */}
      <line x1={100} y1={112} x2={100} y2={120} stroke={D} strokeWidth={1.2} />
      <line x1={100} y1={120} x2={88} y2={131} stroke={S} strokeWidth={1.3} />
      <line x1={100} y1={120} x2={112} y2={131} stroke={S} strokeWidth={1.3} />
      <line x1={100} y1={120} x2={100} y2={131} stroke={S} strokeWidth={1.3} />
    </g>
  );
}

/* Aero launcher: three angled tubes on base */
function LauncherUnit() {
  return (
    <g>
      <rect x={74} y={122} width={52} height={8} rx={2} fill={F} stroke={S} strokeWidth={1.5} />
      <g transform="rotate(-8 88 122)">
        <rect x={82} y={86} width={12} height={38} rx={2} fill={F} stroke={S} strokeWidth={1.5} />
      </g>
      <rect x={94} y={80} width={12} height={44} rx={2} fill={F} stroke={S} strokeWidth={1.5} />
      <g transform="rotate(8 112 122)">
        <rect x={106} y={86} width={12} height={38} rx={2} fill={F} stroke={S} strokeWidth={1.5} />
      </g>
      <line x1={97} y1={86} x2={103} y2={86} stroke={D} strokeWidth={1} />
    </g>
  );
}

/* Flame projector: squat armored box, wide top burner */
function FlameUnit() {
  return (
    <g>
      <rect x={76} y={98} width={48} height={32} rx={3} fill={F} stroke={S} strokeWidth={1.5} />
      <rect x={86} y={90} width={28} height={9} rx={2} fill={F} stroke={S} strokeWidth={1.5} />
      <line x1={92} y1={90} x2={92} y2={99} stroke={D} strokeWidth={1} />
      <line x1={100} y1={90} x2={100} y2={99} stroke={D} strokeWidth={1} />
      <line x1={108} y1={90} x2={108} y2={99} stroke={D} strokeWidth={1} />
      <circle cx={116} cy={122} r={3.5} fill="none" stroke={D} strokeWidth={1.2} />
      <rect x={82} y={106} width={22} height={10} rx={1.5} fill="none" stroke={D} strokeWidth={1} />
    </g>
  );
}

/* Cold fire row: three small linked units */
function ColdFireRow() {
  return (
    <g>
      {[52, 88, 124].map((x) => (
        <g key={x}>
          <rect x={x} y={106} width={26} height={24} rx={2.5} fill={F} stroke={S} strokeWidth={1.4} />
          <rect x={x + 8} y={100} width={10} height={6} fill={F} stroke={S} strokeWidth={1.2} />
        </g>
      ))}
      <line x1={78} y1={122} x2={88} y2={122} stroke={D} strokeWidth={1.2} strokeDasharray="2.5 2.5" />
      <line x1={114} y1={122} x2={124} y2={122} stroke={D} strokeWidth={1.2} strokeDasharray="2.5 2.5" />
    </g>
  );
}

/* Bubble machine: box with circular fan grille and wand bar */
function BubbleUnit({ smoke = false }: { smoke?: boolean }) {
  return (
    <g>
      <rect x={76} y={96} width={48} height={34} rx={4} fill={F} stroke={S} strokeWidth={1.5} />
      <circle cx={100} cy={113} r={11} fill="none" stroke={S} strokeWidth={1.3} />
      <circle cx={100} cy={113} r={6.5} fill="none" stroke={D} strokeWidth={1} />
      <circle cx={100} cy={113} r={2} fill="none" stroke={D} strokeWidth={1} />
      {/* wand ring bar above grille */}
      <line x1={84} y1={96} x2={84} y2={88} stroke={D} strokeWidth={1.2} />
      <line x1={116} y1={96} x2={116} y2={88} stroke={D} strokeWidth={1.2} />
      <line x1={84} y1={88} x2={116} y2={88} stroke={S} strokeWidth={1.3} />
      {smoke && (
        <g>
          <rect x={128} y={104} width={12} height={26} rx={2} fill={F} stroke={S} strokeWidth={1.3} />
          <path d="M 128 116 C 122 116 121 112 124 110" fill="none" stroke={D} strokeWidth={1} />
        </g>
      )}
    </g>
  );
}

export function MachineArt({ id }: { id: string }) {
  let art: React.ReactNode;
  switch (id) {
    case 'sparkler-machine': art = <SparkUnit />; break;
    case 'spin-sparkler':
    case 'spin-pyro': art = <SpinUnit />; break;
    case 'co2-jet': art = <JetUnit tank />; break;
    case 'eco2-jet': art = <JetUnit tank={false} />; break;
    case 'co2-gun': art = <GunUnit long />; break;
    case 'pyro-gun': art = <GunUnit />; break;
    case 'dmx-confetti-blower':
    case 'confetti-blower': art = <BlowerUnit />; break;
    case 'aero-confetti': art = <LauncherUnit />; break;
    case 'flame-thrower': art = <FlameUnit />; break;
    case 'cold-fire-125': art = <ColdFireRow />; break;
    case 'bubble-machine': art = <BubbleUnit />; break;
    case 'smoke-bubble-machine': art = <BubbleUnit smoke />; break;
    default: art = <SparkUnit />;
  }
  return (
    <svg viewBox="0 0 200 140" width="100%" height="100%" aria-hidden="true">
      {art}
      <Base />
    </svg>
  );
}
