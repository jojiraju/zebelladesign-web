// Vector fashion-illustration primitives: a stylised woman wearing a garment (anarkali, frock, salwar set,
// cord set, gown). Everything is drawn in a 900x1200 local box centred on x=450. Pure SVG strings.

// ---------- colour helpers ----------
const hex2 = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
export const mix = (a, b, t) => {
  const A = hex2(a), B = hex2(b);
  return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join("");
};
export const lighten = (h, t) => mix(h, "#ffffff", t);
export const darken = (h, t) => mix(h, "#000000", t);

export const SKIN = { warm: "#E9B99B", tan: "#D49A78", deep: "#B97A57", fair: "#F2CDB4" };
export const GOLD = "#D9B27C";

// ---------- garments ----------
function scallops(x0, x1, y, n, r) {
  const w = (x1 - x0) / n;
  let d = `M${x0},${y}`;
  for (let i = 0; i < n; i++) d += ` q${w / 2},${r * 2} ${w},0`;
  return d;
}

function garment(sil, c, uid) {
  const c2 = darken(c, 0.08);
  const lower = []; // drawn before the arms
  const upper = []; // drawn after the arms (sleeves, bodice)
  const accent = [];
  const clip = []; // shapes that receive the print
  const over = []; // dupatta, drawn last
  const mirror = (d) => d; // placeholder for readability
  void mirror;

  if (sil === "anarkali") {
    const skirt = "M362,470 C330,640 250,880 190,1080 Q450,1135 710,1080 C650,880 570,640 538,470 Z";
    const bodice = "M372,262 Q450,310 528,262 L548,340 L538,472 L362,472 L352,340 Z";
    const sl = "M372,262 L300,402 L336,424 L360,330 Z", sr = "M528,262 L600,402 L564,424 L540,330 Z";
    lower.push({ d: skirt, f: c }); upper.push({ d: bodice, f: c }, { d: sl, f: c2 }, { d: sr, f: c2 });
    clip.push(skirt, bodice, sl, sr);
    accent.push(`<path d="M360,462 Q450,488 540,462 L538,484 Q450,510 362,484 Z" fill="${GOLD}"/>`);
    accent.push(`<path d="M196,1066 Q450,1124 704,1066" fill="none" stroke="${GOLD}" stroke-width="16" clip-path="url(#sk${uid})"/>`);
    accent.push(`<path d="M300,402 L336,424" stroke="${GOLD}" stroke-width="7"/><path d="M600,402 L564,424" stroke="${GOLD}" stroke-width="7"/>`);
    over.push(`<path d="M520,268 C590,430 470,640 520,930" fill="none" stroke="${lighten(c, 0.4)}" stroke-width="40" stroke-linecap="round" opacity=".92"/>`);
    return { lower, upper, accent, clip, over, neck: "M404,266 Q450,338 496,266 Z", legs: "hidden", hem: 1090 };
  }
  if (sil === "frock") {
    const skirt = "M372,420 C336,560 284,700 240,840 Q450,908 660,840 C616,700 564,560 528,420 Z";
    const bodice = "M385,268 Q450,306 515,268 L528,424 L372,424 Z";
    const puffs = ["M330,308 a38,36 0 1 0 76,0 a38,36 0 1 0 -76,0 Z", "M494,308 a38,36 0 1 0 76,0 a38,36 0 1 0 -76,0 Z"];
    lower.push({ d: skirt, f: c }); upper.push({ d: bodice, f: c }, { d: puffs[0], f: c2 }, { d: puffs[1], f: c2 });
    clip.push(skirt, bodice, ...puffs);
    accent.push(`<path d="${scallops(240, 660, 846, 10, 12)}" fill="none" stroke="${GOLD}" stroke-width="7" stroke-linecap="round"/>`);
    accent.push(`<path d="M450,428 L398,396 Q388,424 398,456 Z" fill="${lighten(c, 0.3)}"/><path d="M450,428 L502,396 Q512,424 502,456 Z" fill="${lighten(c, 0.3)}"/><rect x="438" y="412" width="24" height="32" rx="8" fill="${lighten(c, 0.12)}"/>`);
    accent.push(`<path d="M372,420 Q450,444 528,420" fill="none" stroke="${GOLD}" stroke-width="7"/>`);
    return { lower, upper, accent, clip, over, neck: "M412,272 Q450,318 488,272 Z", legs: "frock", hem: 850 };
  }
  if (sil === "salwar") {
    const body = "M376,270 Q450,324 524,270 L548,296 L546,716 Q450,744 354,716 L352,296 Z";
    const pants = "M364,700 L350,1088 L440,1088 L450,790 L460,1088 L550,1088 L536,700 Z";
    const sl = "M376,270 L318,468 L356,484 L376,340 Z", sr = "M524,270 L582,468 L544,484 L524,340 Z";
    lower.push({ d: pants, f: c2 }, { d: body, f: c }); upper.push({ d: sl, f: c }, { d: sr, f: c });
    clip.push(body, pants, sl, sr);
    accent.push(`<path d="M450,324 V600" stroke="${darken(c, 0.2)}" stroke-width="3"/>${[380, 440, 500].map((y) => `<circle cx="450" cy="${y}" r="5" fill="${GOLD}"/>`).join("")}`);
    accent.push(`<path d="M354,704 Q450,732 546,704" fill="none" stroke="${GOLD}" stroke-width="9"/>`);
    accent.push(`<path d="M352,1062 H440 M460,1062 H548" stroke="${GOLD}" stroke-width="9"/>`);
    over.push(`<path d="M514,274 C580,430 480,620 540,860" fill="none" stroke="${lighten(c, 0.45)}" stroke-width="44" stroke-linecap="round" opacity=".9"/>`);
    return { lower, upper, accent, clip, over, neck: "M412,274 Q450,346 488,274 Z", legs: "pants", hem: 1090 };
  }
  if (sil === "cordset") {
    const top = "M386,272 Q450,314 514,272 L552,312 L534,358 L526,344 L530,470 L370,470 L374,344 L366,358 L348,312 Z";
    const pants = "M366,548 L338,1090 L442,1090 L450,700 L458,1090 L562,1090 L534,548 Z";
    lower.push({ d: pants, f: c2 }); upper.push({ d: top, f: c });
    clip.push(top, pants);
    accent.push(`<path d="M366,540 Q450,560 534,540 L534,568 Q450,588 366,568 Z" fill="${lighten(c, 0.18)}"/>`);
    accent.push(`<path d="M372,462 Q450,482 528,462" fill="none" stroke="${GOLD}" stroke-width="6"/>`);
    return { lower, upper, accent, clip, over, neck: "M418,276 Q450,312 482,276 Z", legs: "pants", hem: 1090 };
  }
  // gown
  const skirt = "M376,486 C344,700 250,950 150,1110 Q450,1172 750,1110 C650,950 556,700 524,486 Z";
  const bodice = "M372,262 L396,262 L450,404 L504,262 L528,262 L534,330 C536,400 528,440 524,490 L376,490 C372,440 364,400 366,330 Z";
  lower.push({ d: skirt, f: c }); upper.push({ d: bodice, f: c });
  clip.push(skirt, bodice);
  accent.push(`<path d="M370,478 Q450,508 530,478 L528,508 Q450,538 372,508 Z" fill="${GOLD}"/>`);
  accent.push(`<path d="M154,1098 Q450,1160 746,1098" fill="none" stroke="${GOLD}" stroke-width="12" clip-path="url(#sk${uid})"/>`);
  accent.push(`<path d="M430,540 C400,760 340,960 290,1110 M470,540 C500,760 560,960 610,1110 M450,560 V1140" fill="none" stroke="#000" stroke-opacity=".1" stroke-width="3" clip-path="url(#sk${uid})"/>`);
  return { lower, upper, accent, clip, over, neck: null, legs: "hidden", hem: 1110 };
}

function printDefs(uid, pattern, c) {
  const p = lighten(c, 0.42);
  if (pattern === "dots") return `<pattern id="pt${uid}" width="38" height="38" patternUnits="userSpaceOnUse"><circle cx="9" cy="9" r="3.4" fill="${p}" opacity=".75"/><circle cx="28" cy="28" r="3.4" fill="${p}" opacity=".75"/></pattern>`;
  if (pattern === "floral") return `<pattern id="pt${uid}" width="76" height="76" patternUnits="userSpaceOnUse"><g fill="${p}" opacity=".8"><circle cx="20" cy="20" r="4.5"/><circle cx="20" cy="12" r="3.4"/><circle cx="28" cy="22" r="3.4"/><circle cx="12" cy="22" r="3.4"/><circle cx="20" cy="28" r="3.4"/><circle cx="58" cy="58" r="4.5"/><circle cx="58" cy="50" r="3.4"/><circle cx="66" cy="60" r="3.4"/><circle cx="50" cy="60" r="3.4"/><circle cx="58" cy="66" r="3.4"/></g></pattern>`;
  if (pattern === "stripes") return `<pattern id="pt${uid}" width="30" height="30" patternUnits="userSpaceOnUse"><rect width="7" height="30" fill="${p}" opacity=".55"/></pattern>`;
  return "";
}

// ---------- the model ----------
/**
 * @param {object} o  { uid, sil, color, pattern, skin, hairColor, hair: "long"|"bun", pose: "hang"|"hip", model: boolean }
 * @returns {{defs: string, body: string}}
 */
export function drawModel(o) {
  const { uid = "m", sil, color, pattern = "plain", skin = SKIN.warm, hairColor = "#2A1A17", hair = "long", pose = "hang", model = true } = o;
  const g = garment(sil, color, uid);
  const skinD = darken(skin, 0.1);
  const clipId = `cp${uid}`, skId = `sk${uid}`;

  const defs = [
    `<clipPath id="${clipId}">${g.clip.map((d) => `<path d="${d}"/>`).join("")}</clipPath>`,
    `<clipPath id="${skId}">${g.lower.map((l) => `<path d="${l.d}"/>`).join("")}</clipPath>`,
    `<linearGradient id="sh${uid}" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></linearGradient>`,
    printDefs(uid, pattern, color),
  ].join("");

  const paint = (layers) => layers.map((l) => `<path d="${l.d}" fill="${l.f}"/>`).join("");
  const overlays = `<g clip-path="url(#${clipId})">${pattern !== "plain" ? `<rect width="900" height="1200" fill="url(#pt${uid})"/>` : ""}<rect width="900" height="1200" fill="url(#sh${uid})"/>
    <path d="M440,500 C420,700 360,900 300,1100 M470,500 C490,700 540,900 600,1100 M400,520 C370,720 300,920 240,1090 M500,520 C530,720 600,920 660,1090" fill="none" stroke="#000" stroke-opacity=".09" stroke-width="4"/></g>`;

  if (!model) {
    // garment only (used for placeholders) — hanger on top
    const body = `<g><path d="M450,236 V210 q0,-24 22,-24 q18,0 18,16" fill="none" stroke="#8B6F76" stroke-width="5" stroke-linecap="round"/><path d="M450,238 L330,288 Q316,296 332,300 H568 Q584,296 570,288 Z" fill="none" stroke="#8B6F76" stroke-width="5" stroke-linejoin="round"/></g>` +
      paint(g.lower) + paint(g.upper) + overlays + g.accent.join("") + g.over.join("");
    return { defs, body };
  }

  // legs / feet
  let legs = "";
  const shoe = (x, y) => `<ellipse cx="${x}" cy="${y}" rx="34" ry="12" fill="${darken(color, 0.35)}"/>`;
  if (g.legs === "frock") {
    legs = `<path d="M414,840 L408,1070 M486,840 L492,1070" stroke="${skin}" stroke-width="46" stroke-linecap="round" fill="none"/>${shoe(402, 1092)}${shoe(498, 1092)}`;
  } else if (g.legs === "pants") legs = shoe(395, g.hem + 8) + shoe(505, g.hem + 8);
  else legs = shoe(405, g.hem + 4) + shoe(495, g.hem + 4);

  // hair
  const back = hair === "long"
    ? `<path d="M398,112 C376,40 524,40 502,112 C548,200 540,330 506,392 L394,392 C360,330 352,200 398,112 Z" fill="${hairColor}"/>`
    : `<circle cx="450" cy="86" r="32" fill="${hairColor}"/>`;
  const front = `<path d="M400,162 C394,92 506,92 500,162 C490,128 470,114 450,112 C430,116 410,130 400,162 Z" fill="${hairColor}"/><path d="M404,150 C420,118 470,106 496,150" fill="none" stroke="${lighten(hairColor, 0.25)}" stroke-width="3" opacity=".6"/>`;

  // arms
  const hip = pose === "hip";
  const armL = hip ? "M378,288 L306,424 L384,544" : "M378,288 L322,416 L346,556";
  const armR = "M522,288 L578,416 L554,556";
  const arms = `<g fill="none" stroke="${skin}" stroke-width="30" stroke-linecap="round" stroke-linejoin="round"><path d="${armL}"/><path d="${armR}"/></g>`;
  const hands = (hip ? `<circle cx="384" cy="548" r="15" fill="${skin}"/>` : `<circle cx="346" cy="562" r="15" fill="${skin}"/>`) + `<circle cx="554" cy="562" r="15" fill="${skin}"/>`;

  const torso = `<path d="M372,262 Q450,288 528,262 L520,380 Q514,470 526,524 L496,568 L404,568 L374,524 Q386,470 380,380 Z" fill="${skin}"/>`;
  const neck = `<path d="M436,214 L436,264 Q450,276 464,264 L464,214 Z" fill="${skin}"/><ellipse cx="450" cy="226" rx="16" ry="7" fill="${skinD}" opacity=".5"/>`;
  const neckHole = g.neck ? `<path d="${g.neck}" fill="${skin}"/>` : "";
  const head = `<ellipse cx="450" cy="164" rx="47" ry="58" fill="${skin}"/><ellipse cx="450" cy="150" rx="0" ry="0"/>`;
  const face = `<path d="M427,166 q9,6 18,0 M455,166 q9,6 18,0" fill="none" stroke="${darken(hairColor, 0.1)}" stroke-width="3" stroke-linecap="round"/>
    <path d="M435,150 q10,-6 20,-2 M463,148 q10,-4 20,2" fill="none" stroke="${hairColor}" stroke-width="3.2" stroke-linecap="round" opacity=".85"/>
    <path d="M437,200 Q450,212 463,200 Q450,205 437,200 Z" fill="#B24A5C"/>
    <circle cx="418" cy="190" r="9" fill="#E98C92" opacity=".35"/><circle cx="482" cy="190" r="9" fill="#E98C92" opacity=".35"/>
    <circle cx="403" cy="176" r="4" fill="${GOLD}"/><circle cx="497" cy="176" r="4" fill="${GOLD}"/>`;

  const body = back + legs + torso + neck + paint(g.lower) + arms + paint(g.upper) + neckHole + overlays + g.accent.join("") + hands + head + face + front + g.over.join("");
  return { defs, body };
}
