import { useState, useCallback } from 'react';
import type { JewelryConfig, ViewMode, MetalColor, StoneCut, StoneType } from '../../types/jewelry';

// ─── Metal gradients per color ──────────────────────────────────
const METAL_GRADIENTS: Record<MetalColor, [string, string, string]> = {
  YG: ['#F0D870', '#C5A848', '#9A7A28'],
  WG: ['#EFEFEF', '#C8C8C8', '#909090'],
  RG: ['#F0A870', '#C57848', '#9A4820'],
  PT: ['#E0E0F0', '#B0B0D0', '#808098'],
};

// ─── Stone colors per type ──────────────────────────────────────
const STONE_COLORS: Record<StoneType, [string, string]> = {
  WLD: ['#F8F8FF', 'rgba(200,220,255,0.7)'],
  NTD: ['#FFFFF8', 'rgba(255,240,200,0.5)'],
  SAP: ['#3A6DBF', 'rgba(100,160,255,0.8)'],
  EMR: ['#2D8A5A', 'rgba(80,180,120,0.8)'],
  RBY: ['#CC2244', 'rgba(255,80,100,0.8)'],
  AQM: ['#6AC8E8', 'rgba(150,220,240,0.7)'],
  MRG: ['#E890B0', 'rgba(240,180,210,0.7)'],
  OPA: ['#E8D0F8', 'rgba(220,200,255,0.6)'],
};

// ─── SVG stone shapes per cut ──────────────────────────────────
function StoneCutPath({
  cut,
  cx,
  cy,
  size,
  fillId,
  sparkle,
}: {
  cut: StoneCut;
  cx: number;
  cy: number;
  size: number;
  fillId: string;
  sparkle: boolean;
}) {
  const s = size;
  const sparkleStyle = sparkle ? { animation: 'sparkle-pulse 2.5s ease-in-out infinite' } : {};

  switch (cut) {
    case 'RND':
      return (
        <g style={sparkleStyle}>
          <circle cx={cx} cy={cy} r={s} fill={`url(#${fillId})`} />
          {/* Facet lines */}
          {[0, 45, 90, 135].map((angle) => {
            const rad = (angle * Math.PI) / 180;
            return (
              <line
                key={angle}
                x1={cx - Math.cos(rad) * s * 0.8}
                y1={cy - Math.sin(rad) * s * 0.8}
                x2={cx + Math.cos(rad) * s * 0.8}
                y2={cy + Math.sin(rad) * s * 0.8}
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="0.5"
              />
            );
          })}
          <circle cx={cx} cy={cy} r={s * 0.35} fill="rgba(255,255,255,0.25)" />
        </g>
      );
    case 'OV':
      return (
        <g style={sparkleStyle}>
          <ellipse cx={cx} cy={cy} rx={s} ry={s * 0.7} fill={`url(#${fillId})`} />
          <line x1={cx - s * 0.7} y1={cy} x2={cx + s * 0.7} y2={cy} stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
          <line x1={cx} y1={cy - s * 0.5} x2={cx} y2={cy + s * 0.5} stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
          <ellipse cx={cx - s * 0.15} cy={cy - s * 0.12} rx={s * 0.2} ry={s * 0.12} fill="rgba(255,255,255,0.25)" />
        </g>
      );
    case 'EMC':
      return (
        <g style={sparkleStyle}>
          <rect x={cx - s} y={cy - s * 0.6} width={s * 2} height={s * 1.2} rx="3" fill={`url(#${fillId})`} />
          {[-0.3, 0, 0.3].map((offset) => (
            <line key={offset} x1={cx - s + 4} y1={cy + offset * s * 0.5} x2={cx + s - 4} y2={cy + offset * s * 0.5}
              stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
          ))}
          <rect x={cx - s * 0.4} y={cy - s * 0.2} width={s * 0.8} height={s * 0.4} rx="1" fill="rgba(255,255,255,0.2)" />
        </g>
      );
    case 'PR':
      return (
        <g style={sparkleStyle}>
          <polygon
            points={`${cx},${cy - s} ${cx - s * 0.85},${cy + s * 0.5} ${cx + s * 0.85},${cy + s * 0.5}`}
            fill={`url(#${fillId})`}
          />
          <line x1={cx} y1={cy - s * 0.7} x2={cx} y2={cy + s * 0.3} stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
          <polygon points={`${cx},${cy - s * 0.5} ${cx - s * 0.3},${cy + s * 0.1} ${cx + s * 0.3},${cy + s * 0.1}`}
            fill="rgba(255,255,255,0.2)" />
        </g>
      );
    case 'HT':
      return (
        <g style={sparkleStyle}>
          <path
            d={`M${cx},${cy + s * 0.8} C${cx - s * 1.5},${cy - s * 0.5} ${cx - s * 1.5},${cy - s} ${cx},${cy - s * 0.4} C${cx + s * 1.5},${cy - s} ${cx + s * 1.5},${cy - s * 0.5} ${cx},${cy + s * 0.8}Z`}
            fill={`url(#${fillId})`}
          />
          <line x1={cx} y1={cy - s * 0.2} x2={cx} y2={cy + s * 0.5} stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
        </g>
      );
    case 'MQ':
      return (
        <g style={sparkleStyle}>
          <ellipse cx={cx} cy={cy} rx={s} ry={s * 0.45} fill={`url(#${fillId})`} transform={`rotate(-10,${cx},${cy})`} />
          <line x1={cx - s * 0.8} y1={cy} x2={cx + s * 0.8} y2={cy} stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" transform={`rotate(-10,${cx},${cy})`} />
        </g>
      );
    case 'CU':
      return (
        <g style={sparkleStyle}>
          <rect x={cx - s * 0.8} y={cy - s * 0.8} width={s * 1.6} height={s * 1.6} rx="4" fill={`url(#${fillId})`} />
          {[-0.3, 0, 0.3].map((offset) => (
            <line key={offset} x1={cx - s * 0.7} y1={cy + offset * s * 0.6} x2={cx + s * 0.7} y2={cy + offset * s * 0.6}
              stroke="rgba(255,255,255,0.25)" strokeWidth="0.5" />
          ))}
          <rect x={cx - s * 0.3} y={cy - s * 0.3} width={s * 0.6} height={s * 0.6} rx="2" fill="rgba(255,255,255,0.2)" />
        </g>
      );
    case 'AS':
      return (
        <g style={sparkleStyle}>
          <rect x={cx - s * 0.75} y={cy - s * 0.75} width={s * 1.5} height={s * 1.5} rx="2" fill={`url(#${fillId})`} />
          {[1, 2, 3].map((r) => (
            <rect key={r} x={cx - s * 0.75 + r * s * 0.18} y={cy - s * 0.75 + r * s * 0.18}
              width={s * 1.5 - r * s * 0.36} height={s * 1.5 - r * s * 0.36}
              rx="1" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
          ))}
        </g>
      );
    default:
      return <circle cx={cx} cy={cy} r={s} fill={`url(#${fillId})`} />;
  }
}

// ─── Ring SVG renderer ──────────────────────────────────────────
function RingRenderer({ config, viewMode }: { config: JewelryConfig; viewMode: ViewMode }) {
  const metalGrad = METAL_GRADIENTS[config.metalColor];
  const stoneCol = STONE_COLORS[config.stone];
  const isFront = viewMode === 'front' || viewMode === 'body';
  const isSide = viewMode === 'side';
  const isCAD = viewMode === 'cad';

  if (isCAD) {
    return (
      <svg viewBox="0 0 300 300" className="w-full h-full">
        <rect width="300" height="300" fill="#0A0F1A" />
        {/* CAD blueprint wireframe */}
        <g stroke="#4A9EFF" fill="none" strokeWidth="0.8" opacity="0.8">
          <ellipse cx="150" cy="150" rx="80" ry="30" />
          <ellipse cx="150" cy="150" rx="70" ry="22" />
          <ellipse cx="150" cy="155" rx="75" ry="26" />
          <circle cx="150" cy="124" r="18" stroke="#00FFCC" strokeWidth="1" strokeDasharray="3 2" />
          <line x1="50" y1="150" x2="250" y2="150" strokeDasharray="4 3" opacity="0.4" />
          <line x1="150" y1="80" x2="150" y2="220" strokeDasharray="4 3" opacity="0.4" />
          <rect x="132" y="106" width="36" height="36" rx="2" stroke="#00FFCC" strokeWidth="0.8" />
        </g>
        <text x="150" y="270" textAnchor="middle" fill="#4A9EFF" fontSize="9" fontFamily="JetBrains Mono" letterSpacing="2">
          3D CAD WIREFRAME
        </text>
        <text x="150" y="285" textAnchor="middle" fill="#00FFCC" fontSize="7" fontFamily="JetBrains Mono" opacity="0.7">
          HEIREST STUDIO · PRECISION RENDER
        </text>
      </svg>
    );
  }

  if (isSide) {
    return (
      <svg viewBox="0 0 300 300" className="w-full h-full">
        <defs>
          <linearGradient id="sv-metal" x1="0%" y1="0%" x2="100%" y2="100%">
            {metalGrad.map((c, i) => (
              <stop key={i} offset={`${i * 50}%`} stopColor={c} />
            ))}
          </linearGradient>
          <radialGradient id="sv-stone">
            <stop offset="0%" stopColor={stoneCol[0]} />
            <stop offset="100%" stopColor={stoneCol[1]} />
          </radialGradient>
        </defs>
        <rect width="300" height="300" fill="var(--color-ivory)" />
        {/* Band side profile */}
        <rect x="105" y="120" width="90" height="60" rx="6" fill="url(#sv-metal)" />
        <rect x="112" y="127" width="76" height="46" rx="4" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
        {/* Stone from side */}
        <ellipse cx="150" cy="108" rx="16" ry="10" fill="url(#sv-stone)" />
        <rect x="134" y="108" width="32" height="12" rx="2" fill="url(#sv-metal)" />
      </svg>
    );
  }

  // Front / Body view
  const stoneCount = Math.min(config.stoneCount, 7);
  const centerX = 150;
  const centerY = isFront ? 150 : 220;
  const ringRx = 85;
  const ringRy = isFront ? 30 : 40;
  const bandWidth = 28;

  return (
    <svg viewBox="0 0 300 300" className="w-full h-full">
      <defs>
        <radialGradient id="vp-metal-outer" cx="40%" cy="35%">
          {metalGrad.map((c, i) => (
            <stop key={i} offset={`${i * 50}%`} stopColor={c} />
          ))}
        </radialGradient>
        <radialGradient id="vp-metal-inner" cx="50%" cy="40%">
          <stop offset="0%" stopColor={metalGrad[2]} />
          <stop offset="100%" stopColor={metalGrad[0]} />
        </radialGradient>
        <radialGradient id="vp-stone">
          <stop offset="0%" stopColor={stoneCol[0]} />
          <stop offset="70%" stopColor={stoneCol[1]} />
        </radialGradient>

        {/* Drop shadow filter */}
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="rgba(0,0,0,0.18)" />
        </filter>
      </defs>

      {/* Background */}
      <rect width="300" height="300" fill="var(--color-ivory)" />

      {/* On-body context for body view */}
      {viewMode === 'body' && (
        <g opacity="0.15">
          <ellipse cx="150" cy="280" rx="60" ry="25" fill="var(--color-espresso)" />
          <rect x="80" y="220" width="140" height="60" rx="8" fill="var(--color-espresso)" />
        </g>
      )}

      {/* Ring band — outer */}
      <g filter="url(#shadow)">
        <ellipse cx={centerX} cy={centerY} rx={ringRx} ry={ringRy + bandWidth / 2} fill="url(#vp-metal-outer)" />
        {/* Ring band — inner cutout */}
        <ellipse cx={centerX} cy={centerY} rx={ringRx - bandWidth} ry={ringRy - bandWidth / 2 + 4} fill="var(--color-ivory)" />
      </g>

      {/* Highlight on band */}
      <ellipse
        cx={centerX}
        cy={centerY - ringRy - 4}
        rx={ringRx * 0.6}
        ry={4}
        fill="rgba(255,255,255,0.35)"
      />

      {/* Stones */}
      {Array.from({ length: stoneCount }, (_, i) => {
        const angle = ((i - (stoneCount - 1) / 2) * Math.PI) / (stoneCount + 1.5);
        const sx = centerX + (ringRx - bandWidth / 2) * Math.sin(angle);
        const sy = centerY - (ringRy) * Math.cos(angle) * 0.6 - 2;
        const stoneSize = 10 - stoneCount;

        return (
          <g key={i}>
            {/* Setting */}
            {config.setting === 'CLW' && (
              <>
                {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([dx, dy], pi) => (
                  <circle
                    key={pi}
                    cx={sx + dx * (stoneSize - 1)}
                    cy={sy + dy * (stoneSize - 1)}
                    r={1.5}
                    fill="url(#vp-metal-outer)"
                  />
                ))}
              </>
            )}
            {config.setting === 'BEZ' && (
              <circle
                cx={sx} cy={sy}
                r={stoneSize + 3}
                fill="url(#vp-metal-outer)"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="0.5"
              />
            )}
            <StoneCutPath
              cut={config.cut}
              cx={sx}
              cy={sy}
              size={stoneSize}
              fillId="vp-stone"
              sparkle={true}
            />
          </g>
        );
      })}
    </svg>
  );
}

// ─── Pendant SVG renderer ────────────────────────────────────────
function PendantRenderer({ config, viewMode }: { config: JewelryConfig; viewMode: ViewMode }) {
  const metalGrad = METAL_GRADIENTS[config.metalColor];
  const stoneCol = STONE_COLORS[config.stone];
  const isCAD = viewMode === 'cad';
  const isEW = config.orientation === 'EW';

  if (isCAD) {
    return (
      <svg viewBox="0 0 300 300" className="w-full h-full">
        <rect width="300" height="300" fill="#0A0F1A" />
        <g stroke="#4A9EFF" fill="none" strokeWidth="0.8">
          <line x1="150" y1="40" x2="150" y2="100" stroke="#4A9EFF" strokeWidth="1" />
          <circle cx="150" cy="120" r="30" stroke="#00FFCC" strokeWidth="1" strokeDasharray="4 2" />
          <circle cx="150" cy="120" r="20" strokeDasharray="3 2" opacity="0.6" />
        </g>
        <text x="150" y="275" textAnchor="middle" fill="#4A9EFF" fontSize="9" fontFamily="JetBrains Mono" letterSpacing="2">3D CAD WIREFRAME</text>
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 300 300" className="w-full h-full">
      <defs>
        <linearGradient id="pd-metal" x1="0%" y1="0%" x2="100%" y2="100%">
          {metalGrad.map((c, i) => (<stop key={i} offset={`${i * 50}%`} stopColor={c} />))}
        </linearGradient>
        <radialGradient id="pd-stone" cx="35%" cy="35%">
          <stop offset="0%" stopColor={stoneCol[0]} />
          <stop offset="100%" stopColor={stoneCol[1]} />
        </radialGradient>
        <filter id="pd-shadow">
          <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="rgba(0,0,0,0.15)" />
        </filter>
      </defs>
      <rect width="300" height="300" fill="var(--color-ivory)" />

      {/* Chain */}
      <path d="M150 30 Q148 70 150 100" stroke="url(#pd-metal)" strokeWidth="2" fill="none" />
      {[60, 72, 84, 96].map((y) => (
        <ellipse key={y} cx="150" cy={y} rx="3" ry="2" fill="url(#pd-metal)" />
      ))}

      {/* Pendant body */}
      <g filter="url(#pd-shadow)" transform={isEW ? `rotate(90,150,165)` : ''}>
        {config.setting === 'BEZ' ? (
          <circle cx="150" cy="165" r="32" fill="url(#pd-metal)" />
        ) : (
          /* COL / CLW */
          <polygon points="150,133 178,198 122,198" fill="url(#pd-metal)" opacity="0.9" />
        )}
        <StoneCutPath
          cut={config.cut}
          cx={150}
          cy={165}
          size={22}
          fillId="pd-stone"
          sparkle={true}
        />
      </g>
    </svg>
  );
}

// ─── Earrings SVG renderer ───────────────────────────────────────
function EarringsRenderer({ config }: { config: JewelryConfig }) {
  const metalGrad = METAL_GRADIENTS[config.metalColor];
  const stoneCol = STONE_COLORS[config.stone];
  return (
    <svg viewBox="0 0 300 300" className="w-full h-full">
      <defs>
        <radialGradient id="er-metal" cx="35%" cy="30%">
          {metalGrad.map((c, i) => (<stop key={i} offset={`${i * 50}%`} stopColor={c} />))}
        </radialGradient>
        <radialGradient id="er-stone">
          <stop offset="0%" stopColor={stoneCol[0]} />
          <stop offset="100%" stopColor={stoneCol[1]} />
        </radialGradient>
        <filter id="er-shadow"><feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="rgba(0,0,0,0.12)" /></filter>
      </defs>
      <rect width="300" height="300" fill="var(--color-ivory)" />
      {[95, 205].map((cx) => (
        <g key={cx} filter="url(#er-shadow)">
          {config.setting === 'BEZ'
            ? <circle cx={cx} cy="160" r="30" fill="url(#er-metal)" />
            : [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([dx, dy], i) => (
              <circle key={i} cx={cx + dx * 22} cy={160 + dy * 22} r={2.5} fill="url(#er-metal)" />
            ))
          }
          <StoneCutPath cut={config.cut} cx={cx} cy={160} size={20} fillId="er-stone" sparkle={true} />
          <line x1={cx} y1={100} x2={cx} y2={130} stroke="url(#er-metal)" strokeWidth="1.5" />
          <circle cx={cx} cy={98} r={5} fill="url(#er-metal)" />
        </g>
      ))}
    </svg>
  );
}

// ─── Bracelet SVG renderer ───────────────────────────────────────
function BraceletRenderer({ config }: { config: JewelryConfig }) {
  const metalGrad = METAL_GRADIENTS[config.metalColor];
  const stoneCol = STONE_COLORS[config.stone];
  const stoneCount = Math.min(config.stoneCount, 14);
  return (
    <svg viewBox="0 0 300 300" className="w-full h-full">
      <defs>
        <linearGradient id="br-metal" x1="0%" y1="0%" x2="0%" y2="100%">
          {metalGrad.map((c, i) => (<stop key={i} offset={`${i * 50}%`} stopColor={c} />))}
        </linearGradient>
        <radialGradient id="br-stone">
          <stop offset="0%" stopColor={stoneCol[0]} />
          <stop offset="100%" stopColor={stoneCol[1]} />
        </radialGradient>
        <filter id="br-shadow"><feDropShadow dx="0" dy="5" stdDeviation="10" floodColor="rgba(0,0,0,0.14)" /></filter>
      </defs>
      <rect width="300" height="300" fill="var(--color-ivory)" />
      <g filter="url(#br-shadow)">
        <rect x="30" y="135" width="240" height="30" rx="8" fill="url(#br-metal)" />
        {Array.from({ length: stoneCount }, (_, i) => {
          const sx = 42 + i * (216 / (stoneCount - 1));
          return <StoneCutPath key={i} cut={config.cut} cx={sx} cy={150} size={9} fillId="br-stone" sparkle={i % 3 === 0} />;
        })}
      </g>
    </svg>
  );
}

// ─── Main Viewport Component ─────────────────────────────────────
interface Props {
  config: JewelryConfig;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

const VIEW_MODES: { id: ViewMode; label: string }[] = [
  { id: 'front', label: 'Studio Front' },
  { id: 'side', label: 'Side Profile' },
  { id: 'body', label: 'On-Body Scale' },
  { id: 'cad', label: '3D CAD Blueprint' },
];

export default function JewelryViewport({ config, viewMode, onViewModeChange }: Props) {
  const [isSparkleActive] = useState(true);

  const renderJewelry = useCallback(() => {
    switch (config.category) {
      case 'RG': return <RingRenderer config={config} viewMode={viewMode} />;
      case 'PD': return <PendantRenderer config={config} viewMode={viewMode} />;
      case 'ER': return <EarringsRenderer config={config} />;
      case 'BR': return <BraceletRenderer config={config} />;
      default:   return <RingRenderer config={config} viewMode={viewMode} />;
    }
  }, [config, viewMode]);

  return (
    <div className="flex flex-col gap-4">
      {/* Main viewport */}
      <div
        className="relative aspect-square w-full overflow-hidden"
        style={{
          backgroundColor: viewMode === 'cad' ? '#0A0F1A' : 'var(--color-ivory)',
          border: '1px solid var(--color-hairline)',
        }}
      >
        {/* Spec badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {['D–F Colour', 'VS2+ Clarity', 'Hand-Set'].map((badge) => (
            <span key={badge} className="sku-badge">{badge}</span>
          ))}
        </div>

        {/* Jewelry render */}
        <div className="w-full h-full flex items-center justify-center">
          {renderJewelry()}
        </div>

        {/* Sparkle indicator */}
        {isSparkleActive && viewMode !== 'cad' && (
          <div className="absolute bottom-3 right-3">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: 'var(--color-champagne)', animation: 'sparkle-pulse 2s ease-in-out infinite' }}
            />
          </div>
        )}
      </div>

      {/* View mode switcher */}
      <div className="grid grid-cols-4 gap-1">
        {VIEW_MODES.map((mode) => (
          <button
            key={mode.id}
            onClick={() => onViewModeChange(mode.id)}
            className="py-2 px-1 text-center transition-all"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.6rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              backgroundColor: viewMode === mode.id ? 'var(--color-espresso)' : 'var(--color-ivory)',
              color: viewMode === mode.id ? 'var(--color-ivory)' : 'var(--color-stone)',
              border: `1px solid ${viewMode === mode.id ? 'var(--color-espresso)' : 'var(--color-hairline)'}`,
            }}
          >
            {mode.label}
          </button>
        ))}
      </div>
    </div>
  );
}
