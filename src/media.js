// Lighter copy (longest side 1200 px, scripts/make-thumbs.sh) of a portfolio photo.
// Cards, the Work valley and album grids use it; the full-screen viewer uses the original.
export const thumb = (src) => (typeof src === 'string' && /^\/media\/portfolio\/[^/]+\.jpg$/.test(src) ? src.replace('/media/portfolio/', '/media/portfolio/thumbs/') : src);
