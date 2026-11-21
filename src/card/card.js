import QRCode from 'qrcode';
import {translatePage} from '../lang.js';

translatePage({
  en: {
    title: 'Arda Kurucu — Digital card', meta: 'Digital card', tagline: 'moving images.', role: 'Visual Creative — videography, photography & design.',
    options: 'Contact options', works: 'Selected works', start: 'Start a project', save: 'Save contact',
    qrOpen: 'Tap to show QR code', qrTitle: 'Scan to open this card', qrLabel: 'QR code for this card', qrClose: 'Close ×',
  },
  tr: {
    title: 'Arda Kurucu — Dijital kart', meta: 'Dijital kart', tagline: 'hareketli görüntüler.', role: 'Görsel Yaratıcı — video, fotoğraf ve tasarım.',
    options: 'İletişim seçenekleri', works: 'Seçkiler', start: 'Proje başlat', save: 'Kişiyi kaydet',
    qrOpen: 'QR kodu göstermek için dokun', qrTitle: 'Bu kartı açmak için tara', qrLabel: 'Bu kartın QR kodu', qrClose: 'Kapat ×',
  },
});


const contact = {
  name: 'Arda Kurucu',
  given: 'Arda',
  family: 'Kurucu',
  title: 'Visual Creative',
  org: 'Kurucuvisuals',
  phone: '+905321710401',
  email: 'ardakurucu8@gmail.com',
  instagram: 'https://www.instagram.com/kurucuvisuals/',
};

// Background reel: a single muted loop. Phones sometimes refuse autoplay (low-power mode,
// data saver); then the still poster stays, and the first touch anywhere starts it.
function startReel() {
  const video = document.querySelector('.reel video');
  if (!video) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { video.removeAttribute('autoplay'); video.pause(); return; }
  video.muted = true;
  const play = () => video.play().catch(() => {});
  play();
  document.addEventListener('touchstart', play, {once: true, passive: true});
  document.addEventListener('visibilitychange', () => { if (!document.hidden) play(); });
}

// Contact photo for the vCard: fetched once from /media/card-photo.jpg if it exists.
let photoBase64 = '';
fetch('/media/card-photo.jpg').then((response) => (response.ok ? response.blob() : null)).then((blob) => {
  if (!blob || !blob.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onload = () => { photoBase64 = String(reader.result).split(',')[1] || ''; };
  reader.readAsDataURL(blob);
}).catch(() => {});
const photoLines = () => (photoBase64 ? [`PHOTO;ENCODING=b;TYPE=JPEG:${photoBase64}`] : []);

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
    ...photoLines(),
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
