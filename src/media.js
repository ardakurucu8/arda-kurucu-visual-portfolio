import mediaSizes from './data/mediaSizes.json';

// Every published photo and video has a black band with the akv mark underneath
// (scripts/band.sh), so downloads carry the mark. The site always crops it away:
// CSS .band (src/styles.css) shows only the top 1 / BAND of each file.
export const BAND = 1.07;

// Lighter copy (longest side 1200 px, scripts/make-thumbs.sh) of a portfolio photo.
// Cards, the Work valley and album grids use it; the full-screen viewer uses the original.
export const thumb = (src) => (typeof src === 'string' && /^\/media\/portfolio\/[^/]+\.jpg$/.test(src) ? src.replace('/media/portfolio/', '/media/portfolio/thumbs/') : src);

// Width / height of the visible picture (band excluded).
export const ratioOf = (src) => {
  const key = typeof src === 'string' ? src.replace('/media/portfolio/thumbs/', '/media/portfolio/') : src;
  const size = mediaSizes[key];
  return size ? size[0] / size[1] : 1.5;
};
