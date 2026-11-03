import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {LOGO_DOT, LOGO_PATH} from './brand.js';
import './story.css';

// Full-screen, scroll-driven service stories. Scrolling moves the stages from
// right to left; each centred stage loops its own CSS animation like a GIF.
// Only the delivery letter between the last two stages is tied to scroll.

const INK = '#171817';
const RED = '#a3271a';
const AMBER = '#e2a84b';
const DARK = '#2f302c';
const PANTS = '#3a3f44';
const CREATOR = {hair: '#2b2622', skin: '#e2c4a6', shirt: '#5e7480'};
const CLIENT = {hair: '#7a5236', skin: '#c99a78', shirt: '#b65a3c'};
// Parts further from the viewer get a slightly darker tone to separate depth planes.
const SLEEVE_SHADE = (hex) => `#${hex.slice(1).match(/../g).map((part) => Math.round(parseInt(part, 16) * 0.86).toString(16).padStart(2, '0')).join('')}`;
const MODEL = {hair: '#7a5236', skin: '#c99a78', shirt: '#b65a3c'}; // the photographed woman, later viewing her photos

function star(cx, cy, r) {
  return `M${cx} ${cy - r}Q${cx} ${cy} ${cx + r} ${cy}Q${cx} ${cy} ${cx} ${cy + r}Q${cx} ${cy} ${cx - r} ${cy}Q${cx} ${cy} ${cx} ${cy - r}Z`;
}

function Sparkles({points}) {
  return (
    <g>
      {points.map(([x, y, r], index) => <path key={index} className="sparkle" style={{animationDelay: `${index * 0.37}s`}} d={star(x, y, r)} fill={AMBER} />)}
    </g>
  );
}

function Squiggle({x, y, segments}) {
  return <path className="ln thin" d={`M${x} ${y} q7 -5 14 0${' t14 0'.repeat(segments - 1)}`} />;
}

// An outlined tube for arms and legs: ink underlay plus a coloured core.
function Limb({d, color, width}) {
  return (
    <g>
      <path d={d} fill="none" stroke={INK} strokeWidth={width + 5.3} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
}

// Outline of a limb that tapers along its points: [[x, y, width], …].
function taperPath(points) {
  const count = points.length;
  const left = [];
  const right = [];
  points.forEach(([x, y, width], index) => {
    const [px, py] = points[Math.max(0, index - 1)];
    const [nx, ny] = points[Math.min(count - 1, index + 1)];
    const length = Math.hypot(nx - px, ny - py) || 1;
    const dx = (nx - px) / length;
    const dy = (ny - py) / length;
    left.push([x - (dy * width) / 2, y + (dx * width) / 2]);
    right.push([x + (dy * width) / 2, y - (dx * width) / 2]);
  });
  const f = ([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`;
  const smooth = (line) => {
    let d = '';
    for (let index = 1; index < line.length; index += 1) {
      const mid = [(line[index - 1][0] + line[index][0]) / 2, (line[index - 1][1] + line[index][1]) / 2];
      d += index === 1 ? `L${f(mid)}` : `Q${f(line[index - 1])} ${f(mid)}`;
    }
    return `${d}L${f(line[line.length - 1])}`;
  };
  const endRadius = points[count - 1][2] / 2;
  const startRadius = points[0][2] / 2;
  return `M${f(left[0])}${smooth(left)}A${endRadius} ${endRadius} 0 0 0 ${f(right[count - 1])}${smooth([...right].reverse())}A${startRadius} ${startRadius} 0 0 0 ${f(left[0])}Z`;
}

function Taper({points, color}) {
  return <path className="ink-edge" fill={color} d={taperPath(points)} />;
}

function Hand({x, y, rotate = 0, color}) {
  return (
    <g transform={`rotate(${rotate} ${x} ${y})`}>
      <path className="ink-edge" fill={color} d={`M${x - 11} ${y + 4}C${x - 12} ${y - 8} ${x - 4} ${y - 12} ${x + 6} ${y - 11}C${x + 14} ${y - 10} ${x + 16} ${y - 2} ${x + 13} ${y + 6}C${x + 10} ${y + 12} ${x - 8} ${y + 12} ${x - 11} ${y + 4}Z`} />
      <path className="ln thin" d={`M${x + 2} ${y - 10}v8M${x + 8} ${y - 9}v7`} />
    </g>
  );
}

// Back of a seated person seen over the right shoulder; shoulders ≈2.5 head widths.
function BackFigure({palette, longHair = false, narrow = false}) {
  const scale = narrow ? 0.9 : 1;
  return (
    <g>
      <g transform={`translate(300 0) scale(${scale} 1) translate(-300 0)`}>
        <path className="ink-edge" fill={palette.shirt} d="M178 450C180 404 192 374 222 358C242 348 264 342 284 336H316C336 342 358 348 378 358C408 374 420 404 422 450Z" />
        <path className="ln thin muted" d="M300 362Q297 408 300 450M236 380q8 30 4 70M364 380q-8 30 -4 70" />
      </g>
      <path className="ink-edge" fill={palette.skin} d="M285 296L287 340H313L315 296Z" />
      <path className="ln" d="M282 337Q300 349 318 337" />
      <ellipse className="ink-edge" fill={palette.skin} cx="252" cy="258" rx="6" ry="12" />
      <ellipse className="ink-edge" fill={palette.skin} cx="348" cy="258" rx="6" ry="12" />
      {longHair ? (
        <>
          <path className="ink-edge" fill={palette.hair} d="M252 246C250 198 276 188 300 188C326 188 350 200 348 246C352 300 362 352 354 396C330 404 270 404 246 396C238 352 248 300 252 246Z" />
          <path d="M282 232Q276 320 272 392M300 222Q300 320 300 398M318 232Q326 320 330 392" fill="none" stroke="#5b3d27" strokeWidth="1.6" strokeLinecap="round" />
        </>
      ) : (
        <path className="ink-edge" fill={palette.hair} d="M253 250C252 202 276 194 300 194C326 194 350 206 348 250C347 276 338 294 326 300C318 296 308 294 300 294C292 294 282 296 274 300C262 292 254 274 253 250Z" />
      )}
    </g>
  );
}

// Desk and monitor seen over the sitter's right shoulder. `screen` is drawn in local 252×142 space.
function OverShoulder({screen, screenRole, palette = CREATOR, typing = false, children}) {
  return (
    <g>
      <path className="ink-edge" fill="#e6e0d3" d="M190 318H770L800 400V450H110Z" />
      <rect x="328" y="86" width="310" height="196" rx="10" fill={INK} />
      <svg x="340" y="98" width="286" height="161" viewBox="0 0 252 142" preserveAspectRatio="none" data-letter={screenRole}>{screen}</svg>
      <rect x="468" y="282" width="30" height="28" fill={DARK} />
      <ellipse cx="483" cy="313" rx="58" ry="7" fill={DARK} />
      <path className="ink-edge" fill="#faf8f3" d="M398 342H608L624 372H384Z" />
      <path className="ln thin muted" d="M404 352H604M400 362H610" />
      <ellipse className="ink-edge" fill="#faf8f3" cx="672" cy="360" rx="15" ry="10" />
      {children}
      {/* Seen from behind, the arm is in front of the body (further from us), so it sits behind the torso. */}
      <BackFigure palette={palette} />
      {/* Depth: upper arm beside the back (nearest), elbow out at the side, forearm and hand reaching away to the keys. */}
      <g className={typing ? 'typing' : undefined}>
        <Taper points={[[444, 418, 26], [470, 388, 20], [494, 360, 15]]} color={SLEEVE_SHADE(palette.shirt)} />
        <Taper points={[[492, 362, 11], [500, 354, 9]]} color={palette.skin} />
        <Hand x={507} y={347} rotate={-48} color={palette.skin} />
      </g>
      <Taper points={[[392, 364, 38], [420, 392, 33], [444, 420, 29]]} color={palette.shirt} />
    </g>
  );
}

function CallScreen() {
  return (
    <>
      <rect width="252" height="142" fill="#d6d1c5" />
      <path d="M0 96H252" stroke="#c5bfb2" strokeWidth="2" />
      <path d="M70 142C76 104 176 104 182 142Z" fill="#7f6a8c" stroke={INK} strokeWidth="2" />
      <ellipse cx="126" cy="66" rx="22" ry="26" fill={CLIENT.skin} stroke={INK} strokeWidth="2" />
      <path d="M104 62C102 40 116 36 128 36C142 36 150 46 148 62C142 52 132 50 126 50C116 50 108 54 104 62Z" fill={CLIENT.hair} />
      <path className="a talk-remote" d="M118 80q8 5 16 0" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" />
      <rect x="198" y="100" width="44" height="32" rx="3" fill="#b9b3a6" />
      <ellipse cx="220" cy="112" rx="6" ry="7" fill={CREATOR.hair} />
      <path d="M208 132c2-12 22-12 24 0" fill={CREATOR.shirt} />
      <circle cx="108" cy="130" r="4" fill="#9a9c94" /><circle cx="126" cy="130" r="4" fill={RED} /><circle cx="144" cy="130" r="4" fill="#9a9c94" />
    </>
  );
}

const boardCards = [
  [205, 80, 120, 86, -4, 'landscape'],
  [352, 70, 96, 120, 3, 'portrait'],
  [478, 86, 124, 84, -2, 'swatch'],
  [214, 196, 104, 118, 2, 'text'],
  [352, 214, 130, 96, -3, 'photo'],
  [506, 200, 96, 112, 4, 'circle'],
];

function CardGlyph({w, h, kind}) {
  if (kind === 'landscape') return <><rect x="6" y="14" width={w - 12} height={h - 20} fill="#cfc7b6" /><path d={`M6 ${h - 6}L${w * 0.35} ${h * 0.45}L${w * 0.55} ${h * 0.7}L${w * 0.72} ${h * 0.5}L${w - 6} ${h - 6}Z`} fill="#8f8a7d" /><circle cx={w * 0.75} cy={h * 0.32} r="7" fill={AMBER} /></>;
  if (kind === 'portrait') return <><rect x="6" y="14" width={w - 12} height={h - 20} fill="#d8cfc2" /><circle cx={w / 2} cy={h * 0.45} r="15" fill="#6d6458" /><path d={`M${w * 0.2} ${h - 6}C${w * 0.25} ${h * 0.62} ${w * 0.75} ${h * 0.62} ${w * 0.8} ${h - 6}Z`} fill="#6d6458" /></>;
  if (kind === 'swatch') return <>{['#6e0000', AMBER, '#3d4a4f', '#c9c2b2'].map((color, index) => <rect key={color} x={8 + index * ((w - 16) / 4)} y="18" width={(w - 16) / 4 - 4} height={h - 28} fill={color} />)}</>;
  if (kind === 'text') return <>{[22, 34, 46, 58, 70, 82].map((y, index) => <path key={y} className="ln thin muted" d={`M12 ${y}H${index % 3 === 2 ? w * 0.55 : w - 12}`} />)}</>;
  if (kind === 'photo') return <><rect x="6" y="14" width={w - 12} height={h - 20} fill="#bcc5b9" /><path className="ln thin" d={`M${w * 0.5} ${h - 6}C${w * 0.48} ${h * 0.6} ${w * 0.52} ${h * 0.45} ${w * 0.55} ${h * 0.35}M${w * 0.55} ${h * 0.35}q-18 -4 -26 8M${w * 0.55} ${h * 0.35}q18 -6 26 6M${w * 0.55} ${h * 0.35}q-6 -14 -18 -16M${w * 0.55} ${h * 0.35}q8 -14 20 -14`} /></>;
  return <><rect x="6" y="14" width={w - 12} height={h - 20} fill="#e6dccb" /><circle cx={w / 2} cy={h / 2 + 4} r={w * 0.3} fill={RED} opacity=".85" /><circle cx={w / 2 + 8} cy={h / 2 - 2} r={w * 0.14} fill={AMBER} /></>;
}

function IdeaScene() {
  return (
    <svg className="scene" viewBox="0 0 800 450" aria-hidden="true">
      <g className="a idea-meeting">
        <OverShoulder screen={<CallScreen />} />
        <g className="a bubble-a">
          <rect className="fl" x="132" y="42" width="160" height="60" rx="14" />
          <path className="fl" d="M230 101l18 30 4-30" />
          <path className="paper-mask" d="M232 100h18" />
          <Squiggle x={148} y={65} segments={9} />
          <Squiggle x={148} y={83} segments={6} />
        </g>
        <g className="a bubble-b">
          <rect className="fl" x="566" y="18" width="186" height="60" rx="14" />
          <path className="fl" d="M592 77l-14 26 30-26" />
          <path className="paper-mask" d="M584 76h22" />
          <Squiggle x={582} y={41} segments={10} />
          <Squiggle x={582} y={59} segments={6} />
        </g>
      </g>
      <g className="a idea-board alt">
        <path className="ln" d="M220 348L196 392M580 348L604 392" />
        <rect className="ink-edge" x="170" y="48" width="460" height="300" rx="6" fill="#e3d8c3" />
        {boardCards.map(([x, y, w, h, rotate, kind], index) => (
          <g className="a board-card" key={kind} style={{animationDelay: `${index * 0.1}s`}}>
            <g transform={`rotate(${rotate} ${x + w / 2} ${y + h / 2})`}>
              <g transform={`translate(${x} ${y})`}>
                <rect className="fl" width={w} height={h} />
                <CardGlyph w={w} h={h} kind={kind} />
                <circle cx={w / 2} cy="8" r="5" fill={RED} />
              </g>
            </g>
          </g>
        ))}
        <path className="a thread" d="M265 88L400 78L540 94M265 88L266 204L417 222L554 208L540 94" />
      </g>
    </svg>
  );
}

// Backdrop, softbox, microphone and the seated speaker: shared by the wide shot and the viewfinder.
function SetSubject() {
  return (
    <g>
      <path className="ln" d="M468 96V395M712 96V395M458 98H722" />
      <path d="M476 104H704V352Q704 386 670 388H510Q476 386 476 352Z" fill="#ddd6c8" />
      <path className="ln" d="M476 104V352Q476 386 510 388M704 104V352Q704 386 670 388" />
      <g filter="url(#story-depth)">
        <path className="ln" d="M406 196V382M406 382l-16 3M406 382l16 3" />
        <path className="ink-edge" fill={DARK} d="M386 142L418 108V212L386 178Z" />
        <path className="ink-edge" fill="#fbf8ee" d="M418 108L452 128V196L418 212Z" />
      </g>
      <path d="M452 130L452 196L618 330L606 150Z" fill="url(#story-beam)" />
      <path className="ln" d="M636 300L644 226M572 300H642M576 308L570 392M638 308L644 392" />
      <Taper points={[[612, 296, 28], [586, 299, 24], [562, 302, 20]]} color={PANTS} />
      <Taper points={[[562, 300, 19], [561, 345, 15], [560, 386, 13]]} color={PANTS} />
      <ellipse cx="552" cy="390" rx="15" ry="6" fill={INK} />
      <path className="ink-edge" fill="#7f6a8c" d="M584 210C576 240 582 272 590 298H636C640 266 636 236 624 210Z" />
      <Taper points={[[618, 226, 16], [610, 256, 14], [604, 280, 12], [588, 288, 11], [578, 290, 10]]} color="#7f6a8c" />
      <path className="ink-edge" fill={CLIENT.skin} d="M594 190L596 214H612L614 190Z" />
      <ellipse className="ink-edge" fill={CLIENT.skin} cx="600" cy="176" rx="22" ry="26" />
      <path d="M582 168C580 148 596 142 608 143C624 146 628 162 623 188C620 176 612 167 601 166C592 166 586 166 582 168Z" fill={CLIENT.hair} />
      <path className="ln" d="M579 172l-6 7 6 2" />
      <ellipse className="mouth" cx="584" cy="192" rx="3.5" ry="2.5" fill={INK} />
      <ellipse cx="588" cy="176" rx="12" ry="20" fill="#fff6dd" opacity=".35" />
      <Taper points={[[596, 222, 16], [585, 242, 14], [574, 262, 12]]} color="#7f6a8c" />
      <g className="gesture"><Taper points={[[574, 262, 10], [562, 254, 9], [552, 247, 8]]} color={CLIENT.skin} /><circle className="ink-edge" fill={CLIENT.skin} cx="548" cy="245" r="5" /></g>
      <Limb d="M530 330L512 394M530 330V394M530 330L548 394" color={DARK} width={3} />
      <Limb d="M530 330V240L556 222" color={DARK} width={4} />
      <Limb d="M555 222L568 212" color={DARK} width={9} />
      <g className="speech"><path className="ln thin" d="M560 160q-6 8 0 16M550 154q-10 14 0 28" /></g>
    </g>
  );
}

function SetDefs() {
  return (
    <defs>
      <filter id="story-depth" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.3" /></filter>
      <linearGradient id="story-beam" x1="0" y1="0" x2="1" y2=".4"><stop offset="0" stopColor="#fff6dd" stopOpacity=".75" /><stop offset="1" stopColor="#fff6dd" stopOpacity="0" /></linearGradient>
      <linearGradient id="story-vf-light" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#fff6dd" stopOpacity=".55" /><stop offset=".6" stopColor="#fff6dd" stopOpacity="0" /></linearGradient>
      <clipPath id="story-viewfinder"><rect x="70" y="40" width="660" height="370" rx="6" /></clipPath>
    </defs>
  );
}

function VideoSetScene() {
  return (
    <svg className="scene" viewBox="0 0 800 450" aria-hidden="true">
      <SetDefs />
      <g className="a set-wide">
        <path className="ln muted" d="M30 395H770" />
        <SetSubject />
        <Limb d="M300 282L264 394M300 282V394M300 282L336 394" color={DARK} width={4} />
        <rect className="ink-edge" fill={DARK} x="262" y="236" width="80" height="46" rx="5" />
        <rect className="ink-edge" fill={DARK} x="342" y="244" width="30" height="30" rx="3" />
        <ellipse cx="372" cy="259" rx="4" ry="13" fill="#5e7480" />
        <path className="ln" d="M274 236v-12h46v12" />
        <rect className="ink-edge" fill="#5e7480" x="244" y="240" width="16" height="26" rx="2" />
        <circle className="rec-dot" cx="330" cy="230" r="4.5" fill={RED} />
        <Taper points={[[214, 300, 22], [209, 345, 18], [204, 388, 14]]} color={PANTS} />
        <Taper points={[[226, 300, 22], [232, 345, 18], [238, 388, 14]]} color={PANTS} />
        <ellipse cx="198" cy="393" rx="13" ry="5" fill={INK} /><ellipse cx="246" cy="393" rx="13" ry="5" fill={INK} />
        <path className="ink-edge" fill="#4a5560" d="M196 206C188 240 192 276 200 304H240C246 274 244 238 236 206Z" />
        <path className="ink-edge" fill={CREATOR.skin} d="M212 184L212 208H230L230 184Z" />
        <ellipse className="ink-edge" fill={CREATOR.skin} cx="221" cy="170" rx="20" ry="24" />
        <path d="M202 168C200 146 214 140 226 141C238 142 242 150 240 158C228 154 214 160 207 178Z" fill={CREATOR.hair} />
        <path className="ln" d="M241 168l6 7-6 2" />
        <Taper points={[[230, 216, 15], [241, 236, 13], [250, 252, 12], [258, 251, 10]]} color="#4a5560" />
        <circle className="ink-edge" fill={CREATOR.skin} cx="264" cy="250" r="5.5" />
      </g>
      <g className="a set-viewfinder alt">
        <g clipPath="url(#story-viewfinder)">
          <rect x="70" y="40" width="660" height="370" fill="#ddd6c8" />
          <rect x="70" y="40" width="660" height="370" fill="url(#story-vf-light)" />
          <path className="ink-edge" fill="#7f6a8c" d="M290 412C292 332 330 302 372 294H428C470 302 508 332 510 412Z" />
          <path className="ln thin muted" d="M372 294Q400 318 428 294M326 340q10 30 6 72M474 340q-10 30 -6 72" />
          <path className="ink-edge" fill={CLIENT.skin} d="M385 252L387 298H413L415 252Z" />
          <ellipse className="ink-edge" fill={CLIENT.skin} cx="357" cy="216" rx="7" ry="13" />
          <ellipse className="ink-edge" fill={CLIENT.skin} cx="443" cy="216" rx="7" ry="13" />
          <ellipse className="ink-edge" fill={CLIENT.skin} cx="400" cy="210" rx="42" ry="50" />
          <ellipse cx="380" cy="214" rx="20" ry="38" fill="#fff6dd" opacity=".3" />
          <path d="M358 206C356 166 380 156 402 156C428 156 446 172 442 208C432 186 420 180 400 180C380 180 366 190 358 206Z" fill={CLIENT.hair} className="ink-edge" />
          <path className="ln" d="M380 200h12M408 200h12M400 214v14l-5 2" />
          <circle cx="386" cy="211" r="3.5" fill={INK} /><circle cx="414" cy="211" r="3.5" fill={INK} />
          <ellipse className="mouth" cx="400" cy="242" rx="7" ry="3.5" fill={INK} />
          <Taper points={[[620, 412, 8], [620, 330, 7]]} color={DARK} />
          <Taper points={[[620, 334, 7], [530, 300, 6], [452, 278, 5]]} color={DARK} />
          <Taper points={[[456, 279, 14], [436, 274, 13]]} color={DARK} />
        </g>
        <rect x="70" y="40" width="660" height="370" rx="6" fill="none" stroke={INK} strokeWidth="2.64" />
        <path className="vf-line" d="M150 92h40M150 92v30M650 92h-40M650 92v30M150 358h40M150 358v-30M650 358h-40M650 358v-30M392 225h16M400 217v16" />
        <circle className="rec-dot" cx="618" cy="70" r="7" fill="#d23b2d" />
        <text x="632" y="76" className="vf-text" fill="#d23b2d">REC</text>
        <text x="96" y="76" className="vf-text">00:00:12:04</text>
        <path className="vf-line" d="M96 386h60M640 386h44v-14h-44Z" />
      </g>
    </svg>
  );
}

function PremiereScreen() {
  return (
    <>
      <rect width="252" height="142" fill="#232421" />
      <rect x="6" y="6" width="74" height="56" fill="#33352f" />
      <path className="ui-line" d="M12 70h60M12 78h44M12 86h52" />
      <rect x="88" y="6" width="158" height="78" fill="#3b3e37" />
      <path d="M96 78L140 36L168 62L190 44L238 78Z" fill="#6c6a5f" />
      <rect x="6" y="94" width="240" height="44" fill="#2b2c28" />
      <rect x="40" y="99" width="90" height="7" fill="#b65a3c" /><rect x="134" y="99" width="66" height="7" fill="#c98a3e" />
      <rect x="22" y="110" width="72" height="7" fill="#5e7480" /><rect x="98" y="110" width="110" height="7" fill="#5e7480" />
      <path d="M20 128l4 -5 4 8 4 -10 4 9 4 -6 4 7 4 -9 4 8 4 -4 4 6 4 -8 4 7 4 -5 4 6 4 -7 4 5 4 -3 4 6 4 -6 4 5 4 -8 4 7 4 -4 4 5 4 -6 4 6 4 -5 4 7 4 -6 4 4 4 -5 4 6 4 -4 4 5 4 -6 4 5 4 -3 4 4 4 -5 4 4 4 -3 4 4 4 -5" fill="none" stroke="#7fa08a" strokeWidth="1.2" />
      <path className="playhead" d="M30 92V140" stroke="#e5483a" strokeWidth="1.5" />
      <path className="ui-line" d="M88 90h158" />
    </>
  );
}

function LightroomScreen() {
  const thumbs = [];
  for (let row = 0; row < 3; row += 1) for (let col = 0; col < 3; col += 1) thumbs.push([8 + col * 46, 12 + row * 42, row * 3 + col]);
  const shades = ['#8d8473', '#b7ab93', '#6f6a5e', '#a39b8a', '#c9b48a', '#7c8578', '#9d8f7a', '#b9b1a1', '#857b6c'];
  return (
    <>
      <rect width="252" height="142" fill="#2a2a28" />
      <path className="ui-line" d="M6 6h40M54 6h18M200 6h46" />
      <g className="a lr-grid alt">
        {thumbs.map(([x, y, index]) => <rect key={index} x={x} y={y} width="40" height="34" fill={shades[index]} />)}
        <rect className="a lr-pick" x="52" y="52" width="42" height="36" fill="none" stroke="#f1eee8" strokeWidth="2" />
      </g>
      <g className="a lr-develop">
        <rect x="8" y="12" width="136" height="122" fill="#c9b48a" />
        <path d="M8 134L52 76L84 110L108 88L144 134Z" fill="#8d7a58" />
        <circle cx="112" cy="40" r="10" fill="#f0d79a" />
      </g>
      <rect x="152" y="12" width="94" height="122" fill="#333331" />
      {[26, 42, 58, 74, 90, 106, 122].map((y, index) => (
        <g key={y}>
          <path className="ui-line" d={`M160 ${y}H238`} />
          <circle className="a lr-knob" style={{animationDelay: `${index * 0.12}s`}} cx={176 + ((index * 23) % 50)} cy={y} r="3" fill="#d9d6ce" />
        </g>
      ))}
    </>
  );
}

function EditScene({mode}) {
  return (
    <svg className="scene" viewBox="0 0 800 450" aria-hidden="true">
      <OverShoulder typing screenRole="from" screen={mode === 'photo' ? <LightroomScreen /> : <PremiereScreen />} />
    </svg>
  );
}

// Palm tree with a tapered, ringed trunk and pinnate fronds.
function palmPaths(x, height, lean) {
  const base = {x, y: 395};
  const top = {x: x + lean * 26, y: 395 - height};
  const control = {x: x - lean * 16, y: 395 - height * 0.5};
  const at = (t) => ({
    x: (1 - t) ** 2 * base.x + 2 * (1 - t) * t * control.x + t * t * top.x,
    y: (1 - t) ** 2 * base.y + 2 * (1 - t) * t * control.y + t * t * top.y,
  });
  const half = (t) => 12 - t * 6;
  const steps = [0, 0.2, 0.4, 0.6, 0.8, 1].map((t) => [at(t), half(t)]);
  const trunk = `M${steps.map(([p, w]) => `${(p.x - w).toFixed(1)} ${p.y.toFixed(1)}`).join('L')}L${steps.reverse().map(([p, w]) => `${(p.x + w).toFixed(1)} ${p.y.toFixed(1)}`).join('L')}Z`;
  let rings = '';
  for (let t = 0.06; t < 0.96; t += 0.075) {
    const p = at(t);
    const w = half(t);
    rings += `M${(p.x - w + 1).toFixed(1)} ${p.y.toFixed(1)}q${w} 4 ${(w * 2 - 2).toFixed(1)} 0`;
  }
  let fronds = '';
  [[-168, 82], [-140, 74], [-112, 60], [-68, 60], [-40, 76], [-12, 84], [150, 62], [28, 64]].forEach(([angle, length]) => {
    const r = (angle * Math.PI) / 180;
    const c = {x: top.x + Math.cos(r) * length * 0.55, y: top.y + Math.sin(r) * length * 0.55};
    const tip = {x: top.x + Math.cos(r) * length, y: top.y + Math.sin(r) * length + length * 0.38};
    fronds += `M${top.x.toFixed(1)} ${top.y.toFixed(1)}Q${c.x.toFixed(1)} ${c.y.toFixed(1)} ${tip.x.toFixed(1)} ${tip.y.toFixed(1)}`;
    for (let t = 0.14; t < 0.97; t += 0.07) {
      const px = (1 - t) ** 2 * top.x + 2 * (1 - t) * t * c.x + t * t * tip.x;
      const py = (1 - t) ** 2 * top.y + 2 * (1 - t) * t * c.y + t * t * tip.y;
      const tx = 2 * (1 - t) * (c.x - top.x) + 2 * t * (tip.x - c.x);
      const ty = 2 * (1 - t) * (c.y - top.y) + 2 * t * (tip.y - c.y);
      const n = Math.hypot(tx, ty) || 1;
      const len = 17 * (1 - t * 0.55);
      [1, -1].forEach((side) => {
        fronds += `M${px.toFixed(1)} ${py.toFixed(1)}l${((-ty / n) * len * side + (tx / n) * len * 0.35).toFixed(1)} ${((tx / n) * len * side + len * 0.55).toFixed(1)}`;
      });
    }
  });
  return {trunk, rings, fronds, top};
}

const PALMS = [palmPaths(520, 196, -1), palmPaths(724, 228, 1)];

function PhotoShootScene() {
  return (
    <svg className="scene" viewBox="0 0 800 450" aria-hidden="true">
      <defs>
        <radialGradient id="story-flash"><stop offset="0" stopColor="#fffbe8" stopOpacity="1" /><stop offset="1" stopColor="#fffbe8" stopOpacity="0" /></radialGradient>
      </defs>
      <path className="ln muted" d="M30 395H770" />
      {PALMS.map((palm, index) => (
        <g className="palm" key={index}>
          <path className="ink-edge" fill="#8a6d4f" d={palm.trunk} />
          <path d={palm.rings} fill="none" stroke="#5c4632" strokeWidth="1.6" strokeLinecap="round" />
          <path d={palm.fronds} fill="none" stroke="#5f7a4f" strokeWidth="2.6" strokeLinecap="round" />
          <circle cx={palm.top.x - 5} cy={palm.top.y + 6} r="6" fill="#6b5137" /><circle cx={palm.top.x + 6} cy={palm.top.y + 8} r="6" fill="#6b5137" />
        </g>
      ))}
      <g>
        <Taper points={[[604, 298, 15], [602, 345, 11], [600, 388, 8]]} color={CLIENT.skin} />
        <Taper points={[[626, 298, 15], [629, 345, 11], [632, 388, 8]]} color={CLIENT.skin} />
        <path className="ink-edge" fill="#b65a3c" d="M596 174H632L650 302H578Z" />
        <path className="ink-edge" fill={CLIENT.skin} d="M606 156L607 176H621L622 156Z" />
        <ellipse className="ink-edge" fill={CLIENT.skin} cx="614" cy="146" rx="18" ry="21" />
        <path d="M596 146C592 120 610 118 618 120C636 124 638 150 636 186C630 168 628 150 616 140C608 136 600 140 596 146Z" fill={CLIENT.hair} />
        <g className="a pose-a"><Taper points={[[628, 182, 11], [650, 210, 9], [634, 236, 7]]} color={CLIENT.skin} /><Taper points={[[600, 182, 11], [582, 156, 9], [602, 132, 7]]} color={CLIENT.skin} /></g>
        <g className="a pose-b alt"><Taper points={[[628, 182, 11], [660, 194, 9], [680, 172, 7]]} color={CLIENT.skin} /><Taper points={[[600, 182, 11], [588, 220, 9], [594, 254, 7]]} color={CLIENT.skin} /></g>
      </g>
      <Taper points={[[214, 320, 30], [205, 353, 24], [196, 384, 20], [172, 388, 16], [150, 390, 13]]} color={PANTS} />
      <Taper points={[[216, 320, 30], [240, 317, 25], [264, 314, 20], [267, 352, 17], [270, 388, 14]]} color={PANTS} />
      <ellipse cx="282" cy="392" rx="15" ry="5" fill={INK} />
      <Taper points={[[214, 318, 44], [230, 284, 46], [250, 248, 40]]} color="#4a5560" />
      <path className="ink-edge" fill={CREATOR.skin} d="M256 222L254 240H268L270 222Z" />
      <ellipse className="ink-edge" fill={CREATOR.skin} cx="268" cy="212" rx="20" ry="23" />
      <path d="M249 210C246 190 262 186 272 188C276 190 268 196 264 204C258 210 254 214 250 222Z" fill={CREATOR.hair} />
      <rect className="ink-edge" fill={DARK} x="280" y="198" width="42" height="30" rx="4" />
      <rect className="ink-edge" fill={DARK} x="322" y="203" width="22" height="20" rx="3" />
      <ellipse cx="344" cy="213" rx="3" ry="9" fill="#5e7480" />
      <rect className="ink-edge" fill={DARK} x="294" y="184" width="16" height="13" rx="2" />
      <Taper points={[[252, 252, 15], [282, 262, 12], [298, 232, 10]]} color="#4a5560" />
      <Taper points={[[246, 246, 14], [300, 246, 11], [330, 230, 9]]} color="#4a5560" />
      <circle className="ink-edge" fill={CREATOR.skin} cx="334" cy="228" r="5.5" />
      <circle className="a flash" cx="302" cy="186" r="70" fill="url(#story-flash)" />
    </svg>
  );
}

function IllustratorScene() {
  const tools = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const toolClass = {2: 'a tool-pen', 5: 'a tool-rect', 6: 'a tool-ellipse'};
  return (
    <svg className="scene" viewBox="0 0 800 450" aria-hidden="true">
      <rect x="20" y="14" width="760" height="422" rx="10" fill="#1f1f1f" />
      <circle cx="40" cy="30" r="5" fill="#e5483a" /><circle cx="56" cy="30" r="5" fill={AMBER} /><circle cx="72" cy="30" r="5" fill="#7fa08a" />
      <path className="ui-line" d="M100 30h28M140 30h22M174 30h30M216 30h24M252 30h20M284 30h34" />
      <rect x="20" y="46" width="760" height="24" fill="#2b2b2b" />
      <path className="ui-line" d="M86 58h40M140 58h24M178 58h50M242 58h30M560 58h60M632 58h40" />
      <rect x="30" y="80" width="40" height="346" rx="4" fill="#2b2b2b" />
      {tools.map((index) => <rect key={index} className={toolClass[index]} x="38" y={90 + index * 26} width="24" height="20" rx="3" fill="#3a3a3a" />)}
      <path d="M45 96l10 10-5 1 3 6-2 1-3-6-3 3Z M44 122l12 12M48 148c4-6 10-6 12 2-6 2-8 6-10 6Z" fill="none" stroke="#d6d3cb" strokeWidth="1.2" />
      <rect x="43" y="223" width="14" height="10" fill="none" stroke="#d6d3cb" strokeWidth="1.2" />
      <ellipse cx="50" cy="254" rx="7" ry="6" fill="none" stroke="#d6d3cb" strokeWidth="1.2" />
      <path d="M44 280l12 -6M44 304q6 -10 12 0M46 322h8v10h-8Z" fill="none" stroke="#d6d3cb" strokeWidth="1.2" />
      <rect x="80" y="80" width="540" height="18" fill="#2b2b2b" />
      <rect x="84" y="82" width="110" height="16" fill="#3a3a3a" />
      <path className="ui-line" d="M92 90h70" />
      <rect x="80" y="98" width="540" height="12" fill="#262626" />
      <path d="M80 104h540" stroke="#555" strokeDasharray="1 9" strokeWidth="6" />
      <rect x="80" y="110" width="12" height="316" fill="#262626" />
      <rect x="92" y="110" width="528" height="316" fill="#3b3b3b" />
      <rect x="130" y="128" width="452" height="280" fill="#fbfaf7" data-letter="from" />
      <rect x="630" y="80" width="140" height="346" rx="4" fill="#2b2b2b" />
      <path className="ui-line" d="M642 96h50M642 120h116M642 136h90M642 152h104M642 186h50M642 210h116M642 226h116" />
      {['#e5483a', AMBER, '#7fa08a', '#5e7480', '#171817', '#fbfaf7'].map((color, index) => <rect key={color} x={642 + index * 19} y="252" width="15" height="15" fill={color} />)}
      <path className="ui-line" d="M642 290h50M642 312h12M662 312h80M642 330h12M662 330h70M642 348h12M662 348h90" />
      <rect className="a ill-frame" x="256" y="168" width="200" height="200" fill="none" stroke="#3d8ee8" strokeWidth="1.2" />
      <g transform="translate(271 208) scale(.279) translate(-300 -290)">
        <path className="a logo-fill" d={LOGO_PATH} fill={INK} />
        <path className="a logo-stroke" d={LOGO_PATH} fill="none" stroke="#3d8ee8" strokeWidth="6" pathLength="1" />
        <circle className="a logo-dot" {...LOGO_DOT} />
      </g>
      <g className="a ill-handles">
        {[[256, 168], [356, 168], [456, 168], [256, 268], [456, 268], [256, 368], [356, 368], [456, 368]].map(([x, y]) => <rect key={`${x}-${y}`} x={x - 4} y={y - 4} width="8" height="8" fill="#fbfaf7" stroke="#3d8ee8" strokeWidth="1.2" />)}
      </g>
      <g className="a ill-guides alt">
        <path d="M130 268H582M356 128V408" stroke="#e0338f" strokeWidth="1" />
        <rect x="362" y="248" width="36" height="12" rx="2" fill="#e0338f" />
        <path d="M366 254h28" stroke="#fbfaf7" strokeWidth="1.5" />
      </g>
      <g className="a ill-cursor alt">
        <path d="M0 0L0 18L5 13L9 22L12 21L8 12L15 12Z" fill="#fbfaf7" stroke={INK} strokeWidth="1.2" />
        <g className="a ill-tip"><rect x="16" y="18" width="54" height="22" rx="3" fill={INK} /><path d="M22 26h40M22 33h26" stroke="#d6d3cb" strokeWidth="1.5" /></g>
      </g>
    </svg>
  );
}

function VideoPlayback() {
  return (
    <>
      <rect width="252" height="142" fill="#232421" />
      <g className="arrive">
        <path d="M0 142L90 62L140 106L180 78L252 142Z" fill="#6c6a5f" />
        <circle cx="194" cy="40" r="13" fill={AMBER} />
        <path d="M116 56v28l24 -14Z" fill="#f1eee8" />
        <path d="M12 132h228" stroke="#555" strokeWidth="3" /><path className="progress" d="M12 132h228" stroke="#e5483a" strokeWidth="3" />
      </g>
    </>
  );
}

function VideoFeelingScene() {
  return (
    <svg className="scene" viewBox="0 0 800 450" aria-hidden="true">
      <defs><radialGradient id="story-screen-light" cx="1" cy=".5" r="1"><stop offset="0" stopColor="#cfe0f0" stopOpacity=".55" /><stop offset="1" stopColor="#cfe0f0" stopOpacity="0" /></radialGradient></defs>
      <g className="a feel-over">
        <OverShoulder palette={CLIENT} screenRole="to" screen={<VideoPlayback />} />
      </g>
      <g className="a feel-face alt">
        <path className="ink-edge" fill={CLIENT.shirt} d="M212 400C216 352 246 326 286 318L314 312H366L392 318C432 326 462 352 466 400Z" />
        <path className="ln thin muted" d="M314 312Q340 334 366 312" />
        <path className="ink-edge" fill={CLIENT.skin} d="M326 266L328 316H354L356 266Z" />
        <ellipse className="ink-edge" fill={CLIENT.skin} cx="292" cy="222" rx="8" ry="14" />
        <ellipse className="ink-edge" fill={CLIENT.skin} cx="340" cy="214" rx="50" ry="60" />
        <ellipse cx="366" cy="218" rx="26" ry="50" fill="url(#story-screen-light)" />
        <path className="ink-edge" fill={CLIENT.hair} d="M290 214C286 166 314 152 342 152C372 152 392 170 390 200C380 184 366 178 346 180C326 182 310 194 302 222C298 220 294 218 290 214Z" />
        <path className="ln" d="M338 210q8 -8 16 0M366 210q7 -7 14 0M386 216l7 10-6 3" />
        <circle cx="336" cy="236" r="8" fill="#e39a83" opacity=".45" /><circle cx="378" cy="236" r="7" fill="#e39a83" opacity=".45" />
        <path className="a smile" d="M348 244q16 16 32 0" fill="none" stroke={INK} strokeWidth="2.64" strokeLinecap="round" pathLength="1" />
        <path className="ink-edge" fill="#e6e0d3" d="M0 352H800V460H0Z" />
        <path className="ln thin muted" d="M0 372H800" />
        <rect className="ink-edge" fill="#3a3a37" x="532" y="118" width="300" height="196" rx="10" />
        <path className="ln thin" d="M560 140h240M560 290h240" stroke="#55554f" />
        <rect className="ink-edge" fill="#3a3a37" x="650" y="314" width="36" height="40" />
        <ellipse className="ink-edge" fill="#3a3a37" cx="668" cy="356" rx="62" ry="8" />
        <Sparkles points={[[222, 150, 14], [428, 128, 11], [452, 250, 9], [214, 270, 9], [390, 92, 8], [270, 100, 10]]} />
      </g>
    </svg>
  );
}

function PhoneFeelingScene() {
  const colors = ['#c9b48a', '#8d8473', '#c9b48a', '#8d8473'];
  return (
    <svg className="scene" viewBox="0 0 800 450" aria-hidden="true">
      <rect className="ink-edge" fill="#d3cab8" x="90" y="300" width="640" height="170" rx="26" />
      <BackFigure palette={MODEL} longHair narrow />
      <Taper points={[[434, 418, 21], [466, 380, 17], [492, 340, 14]]} color={SLEEVE_SHADE(MODEL.skin)} />
      <Taper points={[[386, 364, 34], [412, 392, 29], [434, 420, 25]]} color={MODEL.shirt} />
      <rect x="470" y="168" width="76" height="146" rx="12" fill={INK} />
      <svg x="477" y="180" width="62" height="124" viewBox="0 0 152 304" data-letter="to">
        <rect width="152" height="304" fill="#faf8f3" />
        <g className="arrive">
          <g className="a feed">
            {colors.map((color, index) => (
              <g key={index} transform={`translate(0 ${30 + index * 150})`}>
                <circle cx="14" cy="8" r="7" fill="#c9c2b2" /><path className="ln thin" d="M28 8h46" />
                <rect y="20" width="152" height="96" fill={color} />
                <path d={`M0 116L${50 + index * 8} ${60 + index * 4}L96 92L118 74L152 116Z`} fill="#6f6a5e" opacity=".55" />
                <path d="M10 130c-4-6 4-10 6-4 2-6 10-2 6 4l-6 6Z" fill={index % 2 ? RED : 'none'} stroke={INK} strokeWidth="1.2" />
                <path className="ln thin muted" d="M34 128h10M52 128h10M10 140h80" />
              </g>
            ))}
          </g>
          <rect width="152" height="24" fill="#faf8f3" />
          <path className="ln thin" d="M10 12h40M120 12h8M136 12h8" />
        </g>
      </svg>
      <path className="ink-edge" fill={MODEL.skin} d="M486 344C478 330 480 312 492 304L532 300C544 304 548 318 542 332C534 344 500 350 486 344Z" />
      {[256, 274, 292].map((y) => <rect key={y} className="ink-edge" fill={MODEL.skin} x="540" y={y} width="13" height="15" rx="7" />)}
      <path className="ink-edge" fill={MODEL.skin} d="M474 316C466 306 468 288 478 286C484 290 484 306 482 318Z" />
      <Sparkles points={[[620, 110, 12], [400, 120, 8], [640, 260, 9], [600, 190, 7], [440, 210, 7]]} />
    </svg>
  );
}

function DeskFeelingScene() {
  return (
    <svg className="scene" viewBox="0 0 800 450" aria-hidden="true">
      <OverShoulder palette={CLIENT} screenRole="to" screen={(
        <>
          <rect width="252" height="142" fill="#fbfaf7" />
          <g className="arrive">
            <svg x="66" y="20" width="120" height="102" viewBox="300 290 610 433">
              <path d={LOGO_PATH} fill={INK} />
              <circle {...LOGO_DOT} />
            </svg>
          </g>
        </>
      )} />
      <Sparkles points={[[250, 140, 12], [200, 230, 9], [700, 90, 10], [720, 220, 8], [300, 80, 8], [150, 300, 7]]} />
    </svg>
  );
}

const stories = {
  videography: [
    ['Idea', 'Brief & moodboard', IdeaScene],
    ['Image', 'On set, rolling', VideoSetScene],
    ['Edit', 'Cut, rhythm & colour', () => <EditScene mode="video" />],
    ['Feeling', 'Delivered to the screen', VideoFeelingScene],
  ],
  photography: [
    ['Idea', 'Brief & moodboard', IdeaScene],
    ['Image', 'The shoot', PhotoShootScene],
    ['Edit', 'Select & develop', () => <EditScene mode="photo" />],
    ['Feeling', 'Shared and seen', PhoneFeelingScene],
  ],
  illustration: [
    ['Idea', 'Brief & moodboard', IdeaScene],
    ['Generation', 'Shaped on screen', IllustratorScene],
    ['Feeling', 'Delivered to the client', DeskFeelingScene],
  ],
};

const SEGMENT = 1.25; // viewport heights of scroll per stage
const EXIT = 0.8; // extra scroll after the last stage that returns to the page
const ease = (value) => value * value * (3 - 2 * value);

function Letter() {
  return (
    <svg viewBox="0 0 80 56" width="80" height="56" aria-hidden="true">
      <rect x="2" y="2" width="76" height="52" rx="3" fill="#faf8f3" stroke={INK} strokeWidth="2.4" />
      <path d="M3 4L40 32L77 4" fill="none" stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />
      <circle cx="40" cy="32" r="7" fill="#6e0000" />
    </svg>
  );
}

export default function ServiceStory({slug, title, trigger, onClose}) {
  const stages = stories[slug];
  const last = stages.length - 1;
  const rootRef = useRef(null);
  const scrollRef = useRef(null);
  const trackRef = useRef(null);
  const letterRef = useRef(null);
  const closeRef = useRef(null);
  const pointsRef = useRef(null);
  const closingRef = useRef(false);
  const reduced = useRef(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [phase, setPhase] = useState('opening');
  const [band, setBand] = useState(() => {
    const rect = trigger?.getBoundingClientRect();
    return rect ? {top: rect.top, bottom: rect.bottom} : {top: window.innerHeight / 2, bottom: window.innerHeight / 2};
  });
  const [active, setActive] = useState(0);
  const [arrived, setArrived] = useState(false);
  const [ending, setEnding] = useState(false);
  const [cycle, setCycle] = useState(0);

  const close = () => {
    if (closingRef.current) return;
    closingRef.current = true;
    const rect = trigger?.getBoundingClientRect();
    const visible = rect && rect.bottom > 0 && rect.top < window.innerHeight;
    setBand(visible ? {top: rect.top, bottom: rect.bottom} : {top: window.innerHeight / 2, bottom: window.innerHeight / 2});
    setPhase('closing');
    window.setTimeout(() => {
      onClose();
      trigger?.focus({preventScroll: true});
    }, reduced.current ? 0 : 720);
  };

  useLayoutEffect(() => {
    const frame = requestAnimationFrame(() => requestAnimationFrame(() => setPhase('open')));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusTimer = window.setTimeout(() => closeRef.current?.focus({preventScroll: true}), 60);
    const onKey = (event) => {
      if (event.key === 'Escape') close();
      if (event.key !== 'Tab') return;
      const focusable = [...rootRef.current.querySelectorAll('button')];
      const first = focusable[0];
      const lastItem = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); lastItem.focus(); }
      else if (!event.shiftKey && document.activeElement === lastItem) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  useEffect(() => {
    const scroller = scrollRef.current;
    const track = trackRef.current;
    const letter = letterRef.current;
    let frame = 0;
    let activeIndex = 0;
    let wasArrived = false;
    let wasEnding = false;

    const measure = () => {
      const trackRect = track.getBoundingClientRect();
      const centre = (element) => {
        const rect = element.getBoundingClientRect();
        return {x: rect.left - trackRect.left + rect.width / 2, y: rect.top - trackRect.top + rect.height / 2};
      };
      const from = track.querySelector(`[data-stage="${last - 1}"] [data-letter="from"]`);
      const to = track.querySelector(`[data-stage="${last}"] [data-letter="to"]`);
      pointsRef.current = from && to ? {from: centre(from), to: centre(to)} : null;
    };

    const update = () => {
      frame = 0;
      const height = scroller.clientHeight;
      const width = scroller.clientWidth;
      const segment = SEGMENT * height;
      const raw = scroller.scrollTop / segment;
      const index = Math.min(last, Math.floor(raw));
      const position = index >= last ? last : index + ease(Math.min(1, Math.max(0, (raw - index - 0.2) / 0.6)));
      track.style.transform = `translate3d(${-position * width}px,0,0)`;

      const nextActive = Math.round(position);
      if (nextActive !== activeIndex && Math.abs(position - nextActive) < 0.12) {
        activeIndex = nextActive;
        setActive(nextActive);
        setCycle((value) => value + 1);
      }

      const flight = Math.min(1, Math.max(0, position - (last - 1)));
      const points = pointsRef.current;
      if (points) {
        const x = points.from.x + (points.to.x - points.from.x) * flight;
        const y = points.from.y + (points.to.y - points.from.y) * flight - Math.sin(Math.PI * flight) * height * 0.2;
        const scale = 0.45 + Math.sin(Math.PI * flight) * 0.75;
        letter.style.transform = `translate3d(${x - 40}px,${y - 28}px,0) rotate(${(flight - 0.5) * 18}deg) scale(${scale})`;
        letter.style.opacity = flight > 0.02 && flight < 0.97 ? '1' : '0';
      }
      track.style.setProperty('--sent', String(Math.min(1, flight * 3)));
      const isArrived = flight >= 0.97;
      if (isArrived !== wasArrived) { wasArrived = isArrived; setArrived(isArrived); }

      const after = scroller.scrollTop - last * segment;
      const isEnding = after > height * 0.1;
      if (isEnding !== wasEnding) { wasEnding = isEnding; setEnding(isEnding); }
      if (after > EXIT * height * 0.9) close();
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    const onResize = () => { measure(); update(); };

    measure();
    update();
    scroller.addEventListener('scroll', onScroll, {passive: true});
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(frame);
      scroller.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, [slug]);

  const goTo = (index) => {
    const scroller = scrollRef.current;
    scroller.scrollTo({top: index * SEGMENT * scroller.clientHeight, behavior: reduced.current ? 'auto' : 'smooth'});
  };

  const clip = phase === 'open' ? 'inset(0px 0px 0px 0px)' : `inset(${band.top}px 0px ${Math.max(0, window.innerHeight - band.bottom)}px 0px)`;
  const lineY = phase === 'open' ? [0, window.innerHeight - 1] : [band.top, band.bottom - 1];
  const atLast = active === last;

  return (
    <div className={`story story-${phase}`} ref={rootRef} role="dialog" aria-modal="true" aria-labelledby="story-title">
      <div className="story-curtain" style={{clipPath: clip}}>
        <div className="story-scroll" ref={scrollRef}>
          <div style={{height: `${100 + (last * SEGMENT + EXIT) * 100}svh`}}>
            <div className="story-sticky">
              <header className="story-header">
                <div>
                  <p className="eyebrow">SERVICE STORY</p>
                  <h2 id="story-title">{title}</h2>
                </div>
                <nav className="story-stages" aria-label="Story stages">
                  {stages.map(([name], index) => (
                    <button key={name} type="button" className={index === active ? 'is-active' : undefined} aria-current={index === active ? 'step' : undefined} onClick={() => goTo(index)}>
                      <span>{String(index + 1).padStart(2, '0')}</span>{name}
                    </button>
                  ))}
                </nav>
                <button className="story-close eyebrow" type="button" ref={closeRef} onClick={close}>CLOSE <span aria-hidden="true">×</span></button>
              </header>
              <div className="story-track" ref={trackRef} style={{width: `${stages.length * 100}%`}}>
                {stages.map(([name, caption, Scene], index) => {
                  const playing = index === active && (index !== last || arrived);
                  return (
                    <section className={`story-panel${playing ? ' is-playing' : ''}${index === last && arrived ? ' is-arrived' : ''}`} data-stage={index} key={name} aria-label={`${String(index + 1).padStart(2, '0')} ${name}: ${caption}`}>
                      <div className="story-panel-copy">
                        <p className="eyebrow">{String(index + 1).padStart(2, '0')} / {name.toUpperCase()}</p>
                        <h3>{name}<em> — {caption}</em></h3>
                      </div>
                      <div className="story-scene" key={playing ? `play-${cycle}` : 'idle'}><Scene /></div>
                    </section>
                  );
                })}
                <div className="story-letter" ref={letterRef}><Letter /></div>
              </div>
              <div className={`story-next${atLast ? ' is-last' : ''}`} aria-hidden="true">
                {atLast
                  ? <svg viewBox="0 0 24 72"><path d="M12 2V68M2 56l10 12 10-12" /></svg>
                  : <svg viewBox="0 0 96 24"><path d="M2 12H92M80 2l12 10-12 10" /></svg>}
                <span className="eyebrow">{atLast ? (ending ? 'RETURN' : 'SCROLL TO RETURN') : 'SCROLL'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <i className="story-line" aria-hidden="true" style={{transform: `translateY(${lineY[0]}px)`}} />
      <i className="story-line" aria-hidden="true" style={{transform: `translateY(${lineY[1]}px)`}} />
    </div>
  );
}
