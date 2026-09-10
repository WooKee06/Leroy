const fs = require("fs");
const path = require("path");

const ROOT = "/Users/aliistarhanov/Documents/Wookee/Leroy/src";
const SKIP = new Set(["app/styles/global.scss", "app/styles/variables.scss"]);

function walk(dir) {
  let out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out = out.concat(walk(p));
    else if (e.name.endsWith(".scss")) out.push(p);
  }
  return out;
}

const files = walk(ROOT).filter((f) => !SKIP.has(path.relative(ROOT, f)));

const rules = [
  // text tertiary
  [/color:\s*(#aeaeb2|#c7c7cc|#dddddd|#cccccc|#6b6b70)\b/gi, "color: var(--text-tertiary)"],
  // text secondary
  [/color:\s*(#3c3c43|#6e6e73)\b/gi, "color: var(--text-secondary)"],
  [/color:\s*#8e8e93\b/gi, "color: var(--text-secondary)"],
  // primary text (NOT border-color)
  [/(?<![-\w])color:\s*(#111111|#1a1a1a)\b/gi, "color: var(--text-primary)"],
  [/(?<![-\w])color:\s*(#000|#000000)\b/gi, "color: var(--text-primary)"],
  // borders
  [/border(-top|-bottom|-left|-right)?:\s*1px\s+solid\s+(#e5e5ea|#e0e0e5|#e3e3e7)\b/gi, "border$1: 1px solid var(--color-border)"],
  [/color(-top|-bottom|-left|-right)?:\s*(#e5e5ea|#e0e0e5|#e3e3e7)\b/gi, "color$1: var(--color-border)"],
  // chip / secondary surfaces
  [/background(-color)?:\s*(#f2f2f4|#f2f2f3|#f5f5f7|#ececf1|#f4f4f6|#efeff1|#e3e3e7|#d8d8dc|#f7f8fb|#f7f9fd|#f4f4f5|#f2f3f8|#f2f2f7|#fafafa|#dddde3)\b/gi, "background$1: var(--bg-surface-secondary)"],
  // surfaces (white)
  [/background(-color)?:\s*(#ffffff|#fff)\b/gi, "background$1: var(--bg-surface)"],
  [/background(-color)?:\s*rgb\(\s*255\s*,\s*255\s*,\s*255\s*\)\b/gi, "background$1: var(--bg-surface)"],
  [/background(-color)?:\s*rgb\(\s*255\s+255\s+255\s*\)\b/gi, "background$1: var(--bg-surface)"],
  // backdrop translucent white (sheets' inner overlays)
  [/background:\s*rgb\(255\s+255\s+255\s+\/\s*[\d.]+%\)/gi, "background: var(--bg-overlay)"],
];

let total = 0;
for (const f of files) {
  let src = fs.readFileSync(f, "utf8");
  const before = src;
  for (const [re, rep] of rules) src = src.replace(re, rep);
  if (src !== before) {
    fs.writeFileSync(f, src);
    const n = (src.match(/var\(/g) || []).length - (before.match(/var\(/g) || []).length;
    total += n;
    console.log("changed", path.relative(ROOT, f), "+" + n + " vars");
  }
}
console.log("TOTAL vars added:", total);