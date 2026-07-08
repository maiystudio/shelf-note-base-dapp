import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import sharp from "sharp";

const root = resolve(new URL("..", import.meta.url).pathname);
const outDir = join(root, "base-submission");
const W = 1284;
const H = 2778;

const c = {
  bg: "#f4eee2",
  card: "#fffaf0",
  ink: "#26201b",
  rust: "#8b3f2f",
  tan: "#d7b98b",
  pale: "#f8ead4",
  line: "#e0b7a3",
};

function esc(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function wrap(text, maxChars) {
  const words = text.split(" ");
  const lines = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function frame(content) {
  return `
  <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${W}" height="${H}" fill="${c.bg}"/>
    <path d="M0 150H1284M0 300H1284M0 450H1284M0 600H1284M0 750H1284M0 900H1284M0 1050H1284M0 1200H1284M0 1350H1284M0 1500H1284M0 1650H1284M0 1800H1284M0 1950H1284M0 2100H1284M0 2250H1284M0 2400H1284M0 2550H1284M0 2700H1284" stroke="rgba(38,32,27,0.08)" stroke-width="3"/>
    ${content}
  </svg>`;
}

function heading(title, subtitle) {
  return `
    <text x="76" y="126" font-family="Courier New, monospace" font-size="31" font-weight="900" letter-spacing="7" fill="${c.rust}">SHELF NOTE</text>
    <text x="76" y="240" font-family="Arial, sans-serif" font-size="82" font-weight="900" fill="${c.ink}">${esc(title)}</text>
    <text x="80" y="305" font-family="Arial, sans-serif" font-size="33" font-weight="800" fill="${c.rust}">${esc(subtitle)}</text>
  `;
}

function noteCard(x, y, title, author, topic, note) {
  const lines = wrap(note, 36).slice(0, 6);
  return `
    <rect x="${x}" y="${y}" width="1080" height="1120" fill="${c.card}" stroke="${c.ink}" stroke-width="6"/>
    <rect x="${x + 58}" y="${y}" width="110" height="42" fill="${c.tan}" stroke="${c.ink}" stroke-width="5"/>
    <rect x="${x + 180}" y="${y}" width="110" height="42" fill="${c.pale}" stroke="${c.ink}" stroke-width="5"/>
    <rect x="${x + 302}" y="${y}" width="110" height="42" fill="${c.rust}" stroke="${c.ink}" stroke-width="5"/>
    <path d="M${x} ${y + 210}H${x + 1080}M${x} ${y + 320}H${x + 1080}M${x} ${y + 430}H${x + 1080}M${x} ${y + 540}H${x + 1080}M${x} ${y + 650}H${x + 1080}M${x} ${y + 760}H${x + 1080}M${x} ${y + 870}H${x + 1080}" stroke="${c.line}" stroke-width="4"/>
    <rect x="${x + 865}" y="${y + 78}" width="136" height="136" fill="${c.rust}" stroke="${c.ink}" stroke-width="5"/>
    <path d="M${x + 912} ${y + 106}h62v88l-31-20-31 20z" fill="${c.card}" stroke="${c.ink}" stroke-width="8" stroke-linejoin="round"/>
    <text x="${x + 70}" y="${y + 120}" font-family="Courier New, monospace" font-size="24" font-weight="900" letter-spacing="6" fill="${c.rust}">READING CARD</text>
    <text x="${x + 70}" y="${y + 285}" font-family="Arial, sans-serif" font-size="72" font-weight="900" fill="${c.ink}">${esc(title)}</text>
    <rect x="${x + 70}" y="${y + 380}" width="286" height="140" fill="${c.card}" stroke="${c.ink}" stroke-width="4"/>
    <text x="${x + 98}" y="${y + 435}" font-family="Courier New, monospace" font-size="21" font-weight="900" fill="${c.rust}">AUTHOR</text>
    <text x="${x + 98}" y="${y + 490}" font-family="Arial, sans-serif" font-size="31" font-weight="900" fill="${c.ink}">${esc(author)}</text>
    <rect x="${x + 396}" y="${y + 380}" width="286" height="140" fill="${c.tan}" stroke="${c.ink}" stroke-width="4"/>
    <text x="${x + 424}" y="${y + 435}" font-family="Courier New, monospace" font-size="21" font-weight="900" fill="${c.rust}">TOPIC</text>
    <text x="${x + 424}" y="${y + 490}" font-family="Arial, sans-serif" font-size="31" font-weight="900" fill="${c.ink}">${esc(topic)}</text>
    <rect x="${x + 722}" y="${y + 380}" width="286" height="140" fill="${c.card}" stroke="${c.ink}" stroke-width="4"/>
    <text x="${x + 750}" y="${y + 435}" font-family="Courier New, monospace" font-size="21" font-weight="900" fill="${c.rust}">CHAIN</text>
    <text x="${x + 750}" y="${y + 490}" font-family="Arial, sans-serif" font-size="31" font-weight="900" fill="${c.ink}">Base</text>
    <rect x="${x + 70}" y="${y + 610}" width="938" height="340" fill="${c.card}" stroke="${c.ink}" stroke-width="4"/>
    <text x="${x + 104}" y="${y + 675}" font-family="Courier New, monospace" font-size="23" font-weight="900" fill="${c.rust}">NOTE</text>
    ${lines.map((line, i) => `<text x="${x + 104}" y="${y + 740 + i * 42}" font-family="Arial, sans-serif" font-size="31" font-weight="800" fill="${c.ink}">${esc(line)}</text>`).join("")}
    <text x="${x + 70}" y="${y + 1044}" font-family="Courier New, monospace" font-size="24" font-weight="900" fill="${c.rust}">READER WALLET + TIMESTAMP SAVED ON BASE</text>
  `;
}

function feature(x, y, title, body, fill) {
  return `
    <rect x="${x}" y="${y}" width="540" height="230" fill="${fill}" stroke="${c.ink}" stroke-width="5"/>
    <text x="${x + 34}" y="${y + 82}" font-family="Arial, sans-serif" font-size="39" font-weight="900" fill="${c.ink}">${esc(title)}</text>
    ${wrap(body, 30).slice(0, 3).map((line, i) => `<text x="${x + 34}" y="${y + 138 + i * 34}" font-family="Arial, sans-serif" font-size="27" font-weight="800" fill="${c.rust}">${esc(line)}</text>`).join("")}
  `;
}

function screenshot1() {
  return frame(`
    ${heading("Save a reading note.", "Store title, author, topic, wallet, and timestamp on Base.")}
    ${noteCard(102, 440, "The Creative Act", "Rick Rubin", "attention", "Useful reminder: the work improves when attention gets quieter. Keep the daily ritual simple enough to repeat.")}
    ${feature(82, 1710, "Index card", "A compact card for one useful idea.", c.card)}
    ${feature(662, 1710, "Onchain shelf", "Reader wallet and timestamp are saved.", c.tan)}
  `);
}

function screenshot2() {
  return frame(`
    ${heading("Load notes.", "Open saved reading cards by note ID.")}
    ${feature(82, 394, "Note ID", "Reload public notes by number.", c.tan)}
    ${feature(662, 394, "Topic tag", "Keep the idea easy to scan.", c.card)}
    ${noteCard(102, 760, "Invisible Cities", "Italo Calvino", "memory", "Every city in the book feels like a way of reading desire. Good source for compact worldbuilding prompts.")}
  `);
}

function screenshot3() {
  return frame(`
    ${heading("Build a tiny shelf.", "Public reading notes for books, essays, and references.")}
    ${noteCard(102, 430, "Designing Interfaces", "Jenifer Tidwell", "patterns", "A pattern language for product screens. Revisit before building flows that need to be obvious on first glance.")}
    ${feature(82, 1710, "Book memory", "Save what you want to remember.", c.card)}
    ${feature(662, 1710, "Base record", "Share a readable public note.", c.tan)}
  `);
}

function iconSvg() {
  return `
  <svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
    <rect width="1024" height="1024" fill="${c.bg}"/>
    <rect x="140" y="170" width="744" height="684" fill="${c.card}" stroke="${c.ink}" stroke-width="28"/>
    <rect x="214" y="170" width="100" height="76" fill="${c.tan}" stroke="${c.ink}" stroke-width="18"/>
    <path d="M270 398H720M270 534H650M270 670H736" stroke="${c.ink}" stroke-width="42" stroke-linecap="square"/>
    <path d="M680 238h110v250l-55-38-55 38z" fill="${c.rust}" stroke="${c.ink}" stroke-width="22" stroke-linejoin="round"/>
  </svg>`;
}

function thumbnailSvg() {
  return `
  <svg width="1910" height="1000" viewBox="0 0 1910 1000" xmlns="http://www.w3.org/2000/svg">
    <rect width="1910" height="1000" fill="${c.bg}"/>
    <text x="92" y="150" font-family="Arial, sans-serif" font-size="116" font-weight="900" fill="${c.ink}">Shelf Note</text>
    <text x="100" y="252" font-family="Arial, sans-serif" font-size="43" font-weight="800" fill="${c.rust}">Save compact reading notes on Base.</text>
    ${feature(96, 380, "Book", "Capture one useful title.", c.card)}
    ${feature(96, 650, "Note", "Keep the takeaway visible.", c.tan)}
    ${noteCard(770, 90, "The Creative Act", "Rick Rubin", "attention", "Useful reminder: the work improves when attention gets quieter. Keep the daily ritual simple enough to repeat.")}
  </svg>`;
}

async function writePng(name, svg, width = W, height = H) {
  const file = join(outDir, name);
  await sharp(Buffer.from(svg)).resize(width, height).png({ compressionLevel: 9 }).toFile(file);
  return file;
}

async function writeJpg(name, svg, width, height) {
  const file = join(outDir, name);
  await sharp(Buffer.from(svg)).resize(width, height).jpeg({ quality: 88, mozjpeg: true }).toFile(file);
  return file;
}

await mkdir(outDir, { recursive: true });

const files = [
  await writeJpg("app-icon.jpg", iconSvg(), 1024, 1024),
  await writeJpg("app-thumbnail.jpg", thumbnailSvg(), 1910, 1000),
  await writePng("screenshot-1.png", screenshot1()),
  await writePng("screenshot-2.png", screenshot2()),
  await writePng("screenshot-3.png", screenshot3()),
];

await writeFile(join(outDir, "asset-manifest.json"), JSON.stringify({ generatedAt: new Date().toISOString(), files }, null, 2), "utf8");
await writeFile(
  join(outDir, "submission-copy.md"),
  [
    "# Shelf Note",
    "",
    "App Name: Shelf Note",
    "Tagline: Save reading notes",
    "Description: Save a compact reading note with title, author, topic, note, wallet, and timestamp on Base.",
    "",
    "Domain: https://shelf-note.vercel.app",
    "",
    "Assets:",
    "- app-icon.jpg",
    "- app-thumbnail.jpg",
    "- screenshot-1.png",
    "- screenshot-2.png",
    "- screenshot-3.png",
  ].join("\n"),
  "utf8",
);

for (const file of files) console.log(file);
