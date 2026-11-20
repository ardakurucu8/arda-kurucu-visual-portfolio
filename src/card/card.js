import QRCode from 'qrcode';


const contact = {
  name: 'Arda Kurucu',
  given: 'Arda',
  family: 'Kurucu',
  title: 'Visual Creative',
  org: 'Kurucuvisuals',
  phone: '+905321710401',
  email: 'ardakurucu8@gmail.com',
  instagram: 'https://www.instagram.com/kurucuvisuals/',
  city: 'Istanbul',
};

// Background reel: short moments from two films, alternating and crossfading.
// Times avoid title cards; reduced-motion visitors get the still poster only.
const SHOTS = [
  ['/media/portfolio/video/tanabay-him-and-i.mp4', 62], ['/media/portfolio/video/vasiyet-trailer.mp4', 9],
  ['/media/portfolio/video/tanabay-him-and-i.mp4', 98], ['/media/portfolio/video/vasiyet-trailer.mp4', 15],
  ['/media/portfolio/video/tanabay-him-and-i.mp4', 119], ['/media/portfolio/video/vasiyet-trailer.mp4', 27],
  ['/media/portfolio/video/tanabay-him-and-i.mp4', 35], ['/media/portfolio/video/vasiyet-trailer.mp4', 48],
];
const SHOT_MS = 4500;

function startReel() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const players = [...document.querySelectorAll('.reel video')];
  let index = 0;
  let front = 0;
  const load = (player, [src, time]) => new Promise((resolve) => {
    const seek = () => {
      player.addEventListener('seeked', () => { player.play().catch(() => {}); resolve(); }, {once: true});
      player.currentTime = time;
    };
    if (player.getAttribute('src') === src && player.readyState > 0) seek();
    else { player.src = src; player.addEventListener('loadedmetadata', seek, {once: true}); }
  });
  load(players[0], SHOTS[0]).then(() => {
    const next = async () => {
      if (document.hidden) return;
      index = (index + 1) % SHOTS.length;
      const back = 1 - front;
      await load(players[back], SHOTS[index]);
      players[back].classList.add('is-on');
      players[front].classList.remove('is-on');
      const old = players[front];
      setTimeout(() => old.pause(), 1300);
      front = back;
    };
    setInterval(next, SHOT_MS);
  });
}

// "Save contact" hands the phone a vCard; the site address is taken from wherever the card is hosted.
function saveContact() {
  const esc = (value) => value.replace(/[,;\\]/g, (char) => `\\${char}`);
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${esc(contact.family)};${esc(contact.given)};;;`,
    `FN:${esc(contact.name)}`,
    `ORG:${esc(contact.org)}`,
    `TITLE:${esc(contact.title)}`,
    `TEL;TYPE=CELL:${contact.phone}`,
    `EMAIL;TYPE=INTERNET:${contact.email}`,
    `URL:${window.location.origin}/`,
    `X-SOCIALPROFILE;TYPE=instagram:${contact.instagram}`,
    `ADR;TYPE=WORK:;;;${esc(contact.city)};;;Türkiye`,
    'END:VCARD',
  ];
  const blob = new Blob([lines.join('\r\n')], {type: 'text/vcard;charset=utf-8'});
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'Arda-Kurucu.vcf';
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 4000);
}

function setupQr() {
  const panel = document.getElementById('qr');
  const canvas = document.getElementById('qr-canvas');
  const openButton = document.getElementById('qr-open');
  const closeButton = document.getElementById('qr-close');
  const url = `${window.location.origin}/card/`;
  QRCode.toCanvas(canvas, url, {width: 560, margin: 1, color: {dark: '#0b0b0a', light: '#f3f1ea'}});
  const open = () => { panel.hidden = false; closeButton.focus(); };
  const close = () => { panel.hidden = true; openButton.focus(); };
  openButton.addEventListener('click', open);
  closeButton.addEventListener('click', close);
  panel.addEventListener('click', (event) => { if (event.target === panel) close(); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !panel.hidden) close(); });
}

document.getElementById('save').addEventListener('click', saveContact);
setupQr();
startReel();
