import { writeFileSync } from 'fs';

// A simple 5x5 definition for letters, we'll scale it up smoothly.
const letters = {
  B: [
    "11110",
    "10001",
    "11110",
    "10001",
    "11110"
  ],
  L: [
    "10000",
    "10000",
    "10000",
    "10000",
    "11111"
  ],
  "0": [
    "01110",
    "10001",
    "10001",
    "10001",
    "01110"
  ],
  C: [
    "01111",
    "10000",
    "10000",
    "10000",
    "01111"
  ],
  K: [
    "10001",
    "10110",
    "11000",
    "10110",
    "10001"
  ],
  S: [
    "01111",
    "10000",
    "01110",
    "00001",
    "11110"
  ]
};

// Target grid size
const targetW = 60;
const targetH = 10;
const letterW = 5;
const letterH = 5;
function getVal(char, u, v) {
  const c = letters[char];
  if (!c) return 0;
  // smooth interpolation across letter
  const x = Math.min(Math.max(0, u * letterW), letterW - 1);
  const y = Math.min(Math.max(0, v * letterH), letterH - 1);
  const ix = Math.floor(x);
  const fx = x - ix;
  const iy = Math.floor(y);
  const fy = y - iy;
  
  const v00 = parseInt(c[iy][ix] || '0');
  const v10 = parseInt(c[iy][ix+1] || '0');
  const v01 = c[iy+1] ? parseInt(c[iy+1][ix] || '0') : 0;
  const v11 = c[iy+1] ? parseInt(c[iy+1][ix+1] || '0') : 0;
  
  const v0 = v00 * (1-fx) + v10 * fx;
  const v1 = v01 * (1-fx) + v11 * fx;
  return v0 * (1-fy) + v1 * fy;
}

const word = "BL0CKS";
const grid = Array(targetH).fill(0).map(() => Array(targetW).fill(0));
const totalWordW = word.length * 1.2;

for (let y = 0; y < targetH; y++) {
  for (let x = 0; x < targetW; x++) {
    // mapped coords for the whole word
    const uWord = x / targetW;
    const vWord = y / targetH;
    
    // figure out which letter we're inside
    const letterIdx = Math.floor(uWord * word.length * 1.05); // slight squish
    if (letterIdx >= 0 && letterIdx < word.length) {
       const letterU = (uWord * word.length * 1.05) - letterIdx;
       if (letterU >= 0 && letterU <= 0.8) {
         // inside letter bounding box
         const uLoc = letterU / 0.8;
         grid[y][x] = getVal(word[letterIdx], uLoc, vWord);
       }
    }
  }
}

// 2D noise approximation (Simplex-lite) to perturb brightness
function noise(x, y) {
   return (Math.sin(x*3) + Math.cos(y*2.5) + Math.sin(x*1.5 + y*1.5)) / 3;
}

const palette = " .:-=+*#%@";

const asciiLogo = [];
for (let y = 0; y < targetH; y++) {
  let line = "";
  for (let x = 0; x < targetW; x++) {
    let mask = grid[y][x];
    if (mask > 0.4) {
      // It's part of the letter block, map noise to density.
      // Noise oscillates between -1 and 1
      let n = noise(x / targetW * Math.PI, y / targetH * Math.PI - 1);
      // To simulate the 'variable typographic' feel, we use noise to index into our palette
      let pIdx = Math.floor(((n + 1) / 2) * (palette.length - 1));
      line += palette[pIdx];
    } else {
      line += " ";
    }
  }
  asciiLogo.push(`'${line.trimEnd()}'`);
}

writeFileSync('logo_temp.json', JSON.stringify(asciiLogo, null, 2));
