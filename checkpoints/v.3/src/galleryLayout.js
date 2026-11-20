import mediaSizes from './data/mediaSizes.json' with {type: 'json'};
import mediaSharpness from './data/mediaSharpness.json' with {type: 'json'};

export const GALLERY_GAP = 14;
const ratioOf = (src) => { const size = mediaSizes[src]; return size ? size[0] / size[1] : 1.5; };

// `largeOverride` (a list of image paths) replaces the automatic sharpness pick for one album.
export function layoutGallery(images, width, largeOverride) {
  const columns = width < 600 ? 2 : width < 900 ? 3 : 4;
  const colW = (width - GALLERY_GAP * (columns - 1)) / columns;
  const ranked = [...images].sort((a, b) => (mediaSharpness[b] ?? 300) - (mediaSharpness[a] ?? 300));
  const large = new Set(largeOverride || (images.length < 3 ? [] : ranked.slice(0, Math.max(1, Math.round(images.length * 0.4)))));
  const heights = Array(columns).fill(0);
  const placed = [];
  const tolerance = GALLERY_GAP * 2.5;
  const put = (src, col, span) => {
    const w = colW * span + GALLERY_GAP * (span - 1);
    const h = w / ratioOf(src);
    const top = Math.max(...heights.slice(col, col + span));
    placed.push({src, x: col * (colW + GALLERY_GAP), y: top, w, h});
    for (let c = col; c < col + span; c += 1) heights[c] = top + h + GALLERY_GAP;
  };
  const smallH = (src) => colW / ratioOf(src) + GALLERY_GAP;
  const bigs = images.filter((src) => large.has(src));
  const smalls = images.filter((src) => !large.has(src));
  let sinceBig = 1;
  while (bigs.length || smalls.length) {
    const lowest = Math.min(...heights);
    // Big photos alternate with small ones so the album breathes instead of stacking giants.
    if (bigs.length && columns > 1 && (sinceBig >= 1 || !smalls.length)) {
      // A big photo goes wherever two neighbouring columns are level and near the top edge.
      let pair = -1;
      for (let c = 0; c < columns - 1; c += 1) {
        const top = Math.max(heights[c], heights[c + 1]);
        if (Math.abs(heights[c] - heights[c + 1]) > tolerance || top - lowest > colW * 1.5) continue;
        if (pair < 0 || top < Math.max(heights[pair], heights[pair + 1])) pair = c;
      }
      if (pair >= 0) { put(bigs.shift(), pair, 2); sinceBig = 0; continue; }
      if (!smalls.length) { put(bigs.shift(), heights.indexOf(lowest), 1); continue; }
      // Otherwise level the lowest column against a neighbour with the best-fitting small photo.
      const col = heights.indexOf(lowest);
      const steps = [col - 1, col + 1].filter((n) => n >= 0 && n < columns).map((n) => heights[n] - lowest);
      let pick = 0;
      let miss = Infinity;
      smalls.slice(0, 14).forEach((src, index) => {
        for (const step of steps) {
          const value = Math.abs(step - smallH(src));
          if (value < miss) { miss = value; pick = index; }
        }
      });
      put(smalls.splice(pick, 1)[0], col, 1);
      sinceBig += 1;
      continue;
    }
    if (smalls.length) { put(smalls.shift(), heights.indexOf(lowest), 1); sinceBig += 1; }
    else put(bigs.shift(), heights.indexOf(lowest), 1);
  }
  return {placed, height: Math.max(0, Math.max(...heights) - GALLERY_GAP)};
}
