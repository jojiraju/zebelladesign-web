/**
 * Vector illustration for the sign-in panel: a boutique clothing rail with four hanging outfits,
 * a shopping bag and sparkles. Pure inline SVG (no assets), drawn in the brand palette.
 */
const C = { ivory: "#FDF8F6", blush: "#F8E3E6", roseSoft: "#E3B5BF", rose: "#B96E7C", roseDeep: "#7E4452", wine: "#5A2E3A", gold: "#D9B27C", espresso: "#231A1D" };

function Hanger({ x }: { x: number }) {
  return (
    <g transform={`translate(${x},0)`} fill="none" stroke={C.ivory} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M0,196 V184 q0,-9 9,-9 q9,0 9,8" transform="translate(-9,0)" />
      <path d="M0,197 L-36,216 Q-40,219 -36,220 H36 Q40,219 36,216 Z" strokeWidth="2.5" />
    </g>
  );
}

/** A hanger + garment that drops in, then sways gently from the rail. */
function Outfit({ cx, i, children }: { cx: number; i: number; children: React.ReactNode }) {
  const d = { "--d": `${i * 0.18}s` } as React.CSSProperties;
  return (
    <g className="ai-in" style={d}>
      <g className="ai-sway" style={{ "--d": `${i * -1.1}s` } as React.CSSProperties}>
        <Hanger x={cx} />
        <g transform={`translate(${cx},0)`}>{children}</g>
      </g>
    </g>
  );
}

function Sparkle({ x, y, s = 1, d = 0 }: { x: number; y: number; s?: number; d?: number }) {
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <path className="ai-twinkle" style={{ "--d": `${d}s` } as React.CSSProperties} fill={C.ivory} d="M0,-14 C1,-5 5,-1 14,0 C5,1 1,5 0,14 C-1,5 -5,1 -14,0 C-5,-1 -1,-5 0,-14 Z" />
    </g>
  );
}

export function AuthIllustration({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 560 660" role="img" aria-label="Illustration of a boutique clothing rail with dresses and a shopping bag" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ai-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={C.roseSoft} stopOpacity=".55" /><stop offset="1" stopColor={C.rose} stopOpacity=".25" /></linearGradient>
        <linearGradient id="ai-rose" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#D58C9A" /><stop offset="1" stopColor={C.roseDeep} /></linearGradient>
        <linearGradient id="ai-wine" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8F4A5B" /><stop offset="1" stopColor={C.wine} /></linearGradient>
        <linearGradient id="ai-bag" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={C.ivory} /><stop offset="1" stopColor={C.blush} /></linearGradient>
        <linearGradient id="ai-gold" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#E8C79A" /><stop offset="1" stopColor={C.gold} /></linearGradient>
      </defs>

      {/* backdrop */}
      <circle cx="280" cy="330" r="250" fill="url(#ai-bg)" />
      <circle className="ai-spin" cx="280" cy="330" r="190" fill="none" stroke={C.ivory} strokeOpacity=".35" strokeWidth="2" strokeDasharray="3 9" strokeLinecap="round" />
      <ellipse cx="280" cy="624" rx="230" ry="16" fill={C.espresso} opacity=".16" />

      {/* rail: posts, feet, bar */}
      <g stroke={C.ivory} strokeLinecap="round">
        <path d="M70,176 V612 M490,176 V612" strokeWidth="6" opacity=".95" />
        <path d="M44,614 H96 M464,614 H516" strokeWidth="7" />
        <path d="M62,176 H498" strokeWidth="8" />
      </g>
      <circle cx="62" cy="176" r="7" fill={C.ivory} /><circle cx="498" cy="176" r="7" fill={C.ivory} />

      {/* 1 — A-line dress (rose) */}
      <Outfit cx={150} i={0}>
        <path d="M-22,222 Q0,238 22,222 L28,282 C44,352 74,430 92,520 Q0,544 -92,520 C-74,430 -44,352 -28,282 Z" fill="url(#ai-rose)" />
        <path d="M-28,282 Q0,294 28,282" fill="none" stroke={C.ivory} strokeOpacity=".7" strokeWidth="3" />
        <path d="M-22,222 Q0,246 22,222" fill="none" stroke={C.ivory} strokeOpacity=".6" strokeWidth="2.5" />
        <path d="M-84,500 Q0,522 84,500" fill="none" stroke="url(#ai-gold)" strokeWidth="4" strokeLinecap="round" />
        <g fill={C.ivory} fillOpacity=".55"><circle cx="-30" cy="380" r="3" /><circle cx="10" cy="400" r="3" /><circle cx="38" cy="360" r="3" /><circle cx="-8" cy="440" r="3" /><circle cx="46" cy="450" r="3" /><circle cx="-46" cy="460" r="3" /></g>
      </Outfit>

      {/* 2 — anarkali (blush with gold trim) */}
      <Outfit cx={255} i={1}>
        <path d="M-20,222 Q0,238 20,222 L24,274 C44,360 86,470 100,556 Q0,584 -100,556 C-86,470 -44,360 -24,274 Z" fill={C.blush} />
        <path d="M-24,274 Q0,286 24,274" fill="none" stroke={C.rose} strokeWidth="3" />
        <path d="M-20,222 Q0,244 20,222" fill="none" stroke={C.rose} strokeWidth="2.5" />
        <path d="M-96,534 Q0,562 96,534" fill="none" stroke="url(#ai-gold)" strokeWidth="5" strokeLinecap="round" />
        <path d="M-90,512 Q0,538 90,512" fill="none" stroke={C.roseSoft} strokeWidth="2" strokeDasharray="2 7" strokeLinecap="round" />
        <path d="M0,290 V540" stroke={C.roseSoft} strokeWidth="2" strokeDasharray="1 8" strokeLinecap="round" />
      </Outfit>

      {/* 3 — kurta with dupatta (wine) */}
      <Outfit cx={360} i={2}>
        <path d="M-24,222 Q0,238 24,222 L50,250 L42,284 L34,282 L32,452 Q0,462 -32,452 L-34,282 L-42,284 L-50,250 Z" fill="url(#ai-wine)" />
        <path d="M-24,222 Q0,246 24,222" fill="none" stroke={C.ivory} strokeOpacity=".7" strokeWidth="2.5" />
        <path d="M0,238 V300" stroke={C.gold} strokeWidth="2.5" strokeLinecap="round" />
        <path d="M-32,444 Q0,456 32,444" fill="none" stroke="url(#ai-gold)" strokeWidth="4" strokeLinecap="round" />
        <path d="M-40,232 C-70,300 -52,380 -62,470" fill="none" stroke={C.roseSoft} strokeWidth="9" strokeLinecap="round" opacity=".9" />
        <path d="M-62,470 l-6,18 M-62,470 l0,20 M-62,470 l6,18" stroke={C.roseSoft} strokeWidth="2" strokeLinecap="round" />
      </Outfit>

      {/* 4 — gown (ivory, rose florals) */}
      <Outfit cx={465} i={3}>
        <path d="M-20,222 Q0,238 20,222 L26,284 C40,352 66,430 84,508 Q0,532 -84,508 C-66,430 -40,352 -26,284 Z" fill={C.ivory} stroke={C.roseSoft} strokeWidth="2.5" />
        <path d="M-26,284 Q0,296 26,284" fill="none" stroke={C.rose} strokeWidth="3" />
        <g fill={C.rose} fillOpacity=".75">
          {[[-30, 360], [6, 342], [34, 392], [-8, 420], [-44, 440], [38, 462], [-18, 488], [10, 504]].map(([x, y], i) => (
            <g key={i} transform={`translate(${x},${y})`}><circle r="5" /><circle cx="0" cy="-8" r="3.5" fill={C.roseSoft} /><circle cx="7" cy="3" r="3.5" fill={C.roseSoft} /><circle cx="-7" cy="3" r="3.5" fill={C.roseSoft} /></g>
          ))}
        </g>
      </Outfit>

      {/* price tag hanging from dress 2 */}
      <g transform="translate(300,300)">
        <g className="ai-swing">
          <path d="M0,0 C8,-12 14,-26 4,-44" fill="none" stroke={C.ivory} strokeWidth="2" />
          <path d="M-2,0 h46 l10,10 l-10,10 h-46 z" fill={C.gold} />
          <circle cx="5" cy="10" r="2.5" fill={C.ivory} />
          <path d="M18,10 h26" stroke={C.ivory} strokeWidth="2.5" strokeLinecap="round" />
        </g>
      </g>

      {/* shopping bag (front, lower right) */}
      <g transform="translate(396,452)">
       <g className="ai-float">
        <path d="M30,0 C30,-44 106,-44 106,0" fill="none" stroke={C.roseDeep} strokeWidth="7" strokeLinecap="round" />
        <path d="M0,0 H136 L128,172 Q127,184 115,184 H21 Q9,184 8,172 Z" fill="url(#ai-bag)" stroke={C.rose} strokeWidth="3" strokeLinejoin="round" />
        <path d="M0,0 H136 L135,24 H1 Z" fill={C.rose} opacity=".18" />
        <circle cx="68" cy="88" r="30" fill="url(#ai-rose)" />
        <path d="M68,106 C46,92 52,72 62,72 C66,72 68,75 68,78 C68,75 70,72 74,72 C84,72 90,92 68,106 Z" fill={C.ivory} />
        <path d="M30,150 H106" stroke={C.roseSoft} strokeWidth="3" strokeLinecap="round" strokeDasharray="2 8" />
       </g>
      </g>

      {/* sparkles */}
      <Sparkle x={86} y={96} s={1.1} d={0.90} />
      <Sparkle x={470} y={84} s={0.8} d={0.45} />
      <Sparkle x={520} y={230} s={0.6} d={0.90} />
      <Sparkle x={36} y={300} s={0.55} d={0.45} />
      <Sparkle x={300} y={64} s={0.5} d={2.70} />
      <Sparkle x={514} y={430} s={0.45} d={1.35} />
    </svg>
  );
}
