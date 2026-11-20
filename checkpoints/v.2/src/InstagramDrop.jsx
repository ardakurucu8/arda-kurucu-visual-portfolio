import React, {useEffect, useRef} from 'react';

// A small Instagram object living in the viewport like a room: it rests on the
// floor, is carried up with the page when scrolling, then falls back after ~0.25s
// and lands with a tiny bounce. Drag to place it anywhere (it then floats there);
// one click opens Instagram, a double-click drops it.

const SIZE = 56;
const FLOOR_GAP = 22;
const GRAVITY = 2600;
const CARRY_DELAY = 250;
const DOUBLE_CLICK_WINDOW = 250;

export default function InstagramDrop({href, hidden}) {
  const ref = useRef(null);
  const state = useRef({x: 0, y: 0, vy: 0, squash: 0, mode: 'resting', frame: 0, timer: 0, last: 0, drag: null});
  const hinting = useRef(true);
  const reduced = useRef(window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  useEffect(() => {
    const element = ref.current;
    const s = state.current;
    if (reduced.current) return undefined;

    const floor = () => window.innerHeight - SIZE - FLOOR_GAP;
    const paint = () => {
      const squash = s.squash;
      element.style.transform = `translate3d(${s.x}px,${s.y}px,0) scale(${1 + squash},${1 - squash})`;
    };
    const step = (time) => {
      const dt = Math.min(0.032, (time - (s.last || time)) / 1000);
      s.last = time;
      if (s.mode === 'falling') {
        s.vy += GRAVITY * dt;
        s.y += s.vy * dt;
        if (s.y >= floor()) {
          s.y = floor();
          if (s.vy > 260) {
            s.squash = Math.min(0.14, s.vy / 9000);
            s.vy = -s.vy * 0.26;
          } else {
            s.vy = 0;
            s.mode = 'resting';
          }
        }
      }
      s.squash *= 0.82;
      if (s.squash < 0.002) s.squash = 0;
      paint();
      if (s.mode === 'falling' || s.squash) s.frame = requestAnimationFrame(step);
      else { s.frame = 0; s.last = 0; }
    };
    const run = () => { if (!s.frame) s.frame = requestAnimationFrame(step); };
    const drop = () => { s.mode = 'falling'; s.vy = 0; run(); };

    s.x = window.innerWidth / 2 - SIZE / 2;
    s.y = floor();
    paint();

    let lastScroll = window.scrollY;
    const onScroll = () => {
      const delta = window.scrollY - lastScroll;
      lastScroll = window.scrollY;
      if (s.mode === 'held' || s.mode === 'floating') return;
      // While the Work journey is pinned full-screen the page isn't visibly moving, so nothing is carried.
      const journey = document.querySelector('.journey');
      if (journey) {
        const rect = journey.getBoundingClientRect();
        if (rect.top <= 0 && rect.bottom >= window.innerHeight) return;
      }
      // Carried up with the page, pressed onto the floor when the page moves down.
      s.mode = 'carried';
      s.vy = 0;
      s.y = Math.max(8, Math.min(floor(), s.y - delta));
      paint();
      window.clearTimeout(s.timer);
      s.timer = window.setTimeout(drop, CARRY_DELAY);
    };
    const onResize = () => {
      s.x = Math.max(8, Math.min(window.innerWidth - SIZE - 8, s.x));
      s.y = Math.min(floor(), s.y);
      paint();
    };

    // Keep the hover hint inside the window: flip it below near the top, pin it to a side near the edges.
    const onPointerEnter = () => {
      element.dataset.tipY = s.y < 110 ? 'below' : 'above';
      element.dataset.tipX = s.x < 90 ? 'left' : s.x > window.innerWidth - SIZE - 90 ? 'right' : 'center';
    };

    const onPointerDown = (event) => {
      // Touch screens show the hint until the first touch on the logo.
      hinting.current = false;
      element.classList.remove('is-hinting');
      element.setPointerCapture(event.pointerId);
      window.clearTimeout(s.timer);
      cancelAnimationFrame(s.frame);
      s.frame = 0;
      s.drag = {dx: event.clientX - s.x, dy: event.clientY - s.y, startX: event.clientX, startY: event.clientY, moved: false, previous: s.mode};
      s.mode = 'held';
      element.classList.add('is-held');
    };
    const onPointerMove = (event) => {
      if (!s.drag) return;
      if (Math.hypot(event.clientX - s.drag.startX, event.clientY - s.drag.startY) > 4) s.drag.moved = true;
      s.x = Math.max(8, Math.min(window.innerWidth - SIZE - 8, event.clientX - s.drag.dx));
      s.y = Math.max(8, Math.min(floor(), event.clientY - s.drag.dy));
      paint();
    };
    const onPointerUp = () => {
      if (!s.drag) return;
      const {moved, previous} = s.drag;
      s.drag = null;
      element.classList.remove('is-held');
      if (moved) {
        s.mode = s.y >= floor() - 1 ? 'resting' : 'floating';
        return;
      }
      s.mode = previous === 'carried' ? 'resting' : previous;
      // One click opens Instagram; a second click within the window drops the logo instead.
      if (s.clickTimer) {
        window.clearTimeout(s.clickTimer);
        s.clickTimer = 0;
        if (s.y < floor() - 1) drop();
        return;
      }
      s.clickTimer = window.setTimeout(() => {
        s.clickTimer = 0;
        // A delayed open can be blocked as a pop-up; fall back to opening it in this tab.
        const opened = window.open(href, '_blank');
        if (opened) opened.opener = null;
        else window.location.href = href;
      }, DOUBLE_CLICK_WINDOW);
    };

    window.addEventListener('scroll', onScroll, {passive: true});
    window.addEventListener('resize', onResize);
    element.addEventListener('pointerenter', onPointerEnter);
    element.addEventListener('pointerdown', onPointerDown);
    element.addEventListener('pointermove', onPointerMove);
    element.addEventListener('pointerup', onPointerUp);
    element.addEventListener('pointercancel', onPointerUp);
    return () => {
      cancelAnimationFrame(s.frame);
      window.clearTimeout(s.timer);
      window.clearTimeout(s.clickTimer);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      element.removeEventListener('pointerenter', onPointerEnter);
      element.removeEventListener('pointerdown', onPointerDown);
      element.removeEventListener('pointermove', onPointerMove);
      element.removeEventListener('pointerup', onPointerUp);
      element.removeEventListener('pointercancel', onPointerUp);
    };
  }, []);

  return (
    <a
      ref={ref}
      className={`ig-drop${hinting.current ? ' is-hinting' : ''}${hidden ? ' is-hidden' : ''}${reduced.current ? ' is-static' : ''}`}
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label="Open Instagram"
      aria-hidden={hidden ? 'true' : undefined}
      tabIndex={hidden ? -1 : 0}
      draggable="false"
      // Pointer clicks are handled by the click/double-click logic above; keyboard and the static fallback navigate natively.
      onClick={(event) => { if (!reduced.current && event.detail !== 0) event.preventDefault(); }}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="5.2" />
        <circle cx="12" cy="12" r="4.2" />
        <circle cx="17.4" cy="6.6" r=".9" className="ig-dot" />
      </svg>
      {!reduced.current && (
        <span className="ig-tip" aria-hidden="true">
          <span>Drag to move</span>
          <span className="on-mouse">Click to open Instagram</span>
          <span className="on-mouse">Double-click to drop</span>
          <span className="on-touch">Tap to open Instagram</span>
          <span className="on-touch">Double-tap to drop</span>
        </span>
      )}
    </a>
  );
}
