import React, {Suspense, lazy, useEffect, useMemo, useRef, useState} from 'react';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {projects} from './data/projects.js';
import {layoutGallery} from './galleryLayout.js';
import {thumb, ratioOf} from './media.js';
import BandVideo from './BandVideo.jsx';
import Title from './Title.jsx';
import {createPortal} from 'react-dom';
import {LOGO_DOT, LOGO_PATH, LOGO_VIEWBOX} from './brand.js';
import {LANGS, LangContext, initialLang, localizeProjects, saveLang, ui, useLang} from './i18n.js';

gsap.registerPlugin(ScrollTrigger);
const Ambient = lazy(() => import('./Ambient.jsx'));
const WorkJourney = lazy(() => import('./WorkJourney.jsx'));
const ServiceStory = lazy(() => import('./ServiceStory.jsx'));
const services = ['videography', 'photography', 'illustration'];
const filters = ['All', 'Video', 'Photography', 'AI / Generative'];
const copy = {
  descriptor: 'Visual Creative',
  services: 'Videography / Photography / Design',
  email: 'ardakurucu8@gmail.com',
  instagram: 'https://www.instagram.com/kurucuvisuals/',
};

// Drawn as SVG so phones never swap the arrow characters for colour emoji.
const ARROW_PATHS = {
  down: 'M12 3v18M5 14l7 7 7-7',
  up: 'M12 21V3M5 10l7-7 7 7',
  left: 'M21 12H3M10 5l-7 7 7 7',
  right: 'M3 12h18M14 5l7 7-7 7',
  ne: 'M6 18 18 6M8 6h10v10',
};

// "#top" points at the header, which is sticky on phones — the browser sees it as already in
// view and does not scroll. Scroll the page itself instead.
function scrollToTop(event) {
  event.preventDefault();
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({top: 0, behavior: reduce ? 'auto' : 'smooth'});
  if (window.location.hash) history.replaceState(null, '', window.location.pathname + window.location.search);
}

function Arrow({direction = 'ne'}) {
  return (
    <span className="arrow" aria-hidden="true">
      <svg viewBox="0 0 24 24"><path d={ARROW_PATHS[direction] || ARROW_PATHS.ne} /></svg>
    </span>
  );
}

// Hero showreel: a silent 22-second loop cut from the films (scripts/band/reel.swift).
// The poster shows at once; the film starts after the page has loaded, on screens that allow
// motion and without data saver, and pauses while the hero is out of view.
const HERO_REEL = {
  poster: '/media/portfolio/video/hero-reel.jpg',
  large: '/media/portfolio/video/hero-reel.mp4',
  small: '/media/portfolio/video/hero-reel-sm.mp4',
};

function HeroReel() {
  const {t} = useLang();
  const video = useRef(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const element = video.current;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!element || reduce || navigator.connection?.saveData) return undefined;
    let visible = true;
    let timer = 0;
    const start = () => {
      timer = window.setTimeout(() => {
        element.src = window.matchMedia('(max-width: 760px)').matches ? HERO_REEL.small : HERO_REEL.large;
        if (visible) element.play().catch(() => {});
      }, 400);
    };
    if (document.readyState === 'complete') start(); else window.addEventListener('load', start, {once: true});
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (!element.src) return;
      if (visible) element.play().catch(() => {}); else element.pause();
    });
    observer.observe(element);
    return () => { window.removeEventListener('load', start); window.clearTimeout(timer); observer.disconnect(); };
  }, []);

  return (
    <span className="band-box hero-photo">
      <span className="band band-cover" style={{'--r': 16 / 9}}>
        <img src={HERO_REEL.poster} alt={t.hero.reelAlt} fetchPriority="high" />
        <video
          ref={video}
          className={`hero-reel${playing ? ' is-on' : ''}`}
          muted
          loop
          playsInline
          preload="none"
          disablePictureInPicture
          aria-hidden="true"
          tabIndex={-1}
          onPlaying={() => setPlaying(true)}
          onContextMenu={(event) => event.preventDefault()}
        />
      </span>
    </span>
  );
}

function LoadingCurtain() {
  const {t} = useLang();
  const [state, setState] = useState({visible: false, progress: 0, done: false});

  useEffect(() => {
    let cancelled = false;
    // Phones only wait for the hero photo; larger screens also warm the first cover.
    const phone = window.matchMedia('(max-width: 760px)').matches;
    const critical = [HERO_REEL.poster, ...(phone ? [] : [thumb(projects[0].cover)])];
    const timer = window.setTimeout(() => !cancelled && setState((current) => ({...current, visible: true})), 120);
    let loaded = 0;
    const load = (src) => new Promise((resolve) => {
      const image = new Image();
      const finish = () => {
        loaded += 1;
        if (!cancelled) setState((current) => ({...current, progress: Math.round((loaded / critical.length) * 100)}));
        resolve();
      };
      image.onload = () => image.decode?.().catch(() => {}).finally(finish) || finish();
      image.onerror = finish;
      image.src = src;
    });
    Promise.race([
      Promise.all(critical.map(load)),
      new Promise((resolve) => window.setTimeout(resolve, 1200)),
    ]).then(() => {
      window.clearTimeout(timer);
      if (!cancelled) setState((current) => ({...current, progress: 100, done: true}));
    });
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, []);

  if (!state.visible) return null;
  return (
    <div className={`site-loader ${state.done ? 'is-done' : ''}`} aria-live="polite" aria-label={t.loader.label}>
      <div className="loader-brand"><strong>ARDA KURUCU</strong><span>{t.loader.role}</span></div>
      <div className="loader-status eyebrow"><span>{t.loader.status}</span><span>{String(state.progress).padStart(3, '0')}%</span></div>
      <i style={{transform: `scaleX(${state.progress / 100})`}} />
    </div>
  );
}

// Full-screen viewer for album photos. It sits above the project window and takes
// Escape / arrow keys first, so they never close or switch the project underneath.
function Lightbox({images, index, title, onChange, onClose}) {
  const {t} = useLang();
  const closeRef = useRef(null);
  const touch = useRef(null);
  const count = images.length;
  const go = (step) => onChange((current) => (current + step + count) % count);
  useEffect(() => {
    const opener = document.activeElement;
    closeRef.current?.focus();
    const onKey = (event) => {
      if (!['Escape', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(event.key)) return;
      event.stopImmediatePropagation();
      if (event.key === 'Tab') return;
      event.preventDefault();
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowLeft') go(-1);
      if (event.key === 'ArrowRight') go(1);
    };
    document.addEventListener('keydown', onKey, true);
    return () => { document.removeEventListener('keydown', onKey, true); opener?.focus?.(); };
  });
  return createPortal(
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={t.photos.photo(title, index + 1, count)}
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
      onTouchStart={(event) => { touch.current = event.touches[0].clientX; }}
      onTouchEnd={(event) => {
        if (touch.current === null) return;
        const dx = event.changedTouches[0].clientX - touch.current;
        touch.current = null;
        if (Math.abs(dx) > 45) go(dx < 0 ? 1 : -1);
      }}>
      <div className="lightbox-bar">
        <span className="eyebrow">{String(index + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}</span>
        <button type="button" className="eyebrow" ref={closeRef} onClick={onClose}>{t.dialog.close} <span aria-hidden="true">×</span></button>
      </div>
      <span className="band lightbox-photo" key={images[index]} style={{'--r': ratioOf(images[index])}}><img src={images[index]} alt={t.photos.photo(title, index + 1, count)} draggable="false" /></span>
      {count > 1 && <>
        <button type="button" className="lightbox-nav prev" aria-label={t.photos.previous} onClick={() => go(-1)}><Arrow direction="left" /></button>
        <button type="button" className="lightbox-nav next" aria-label={t.photos.next} onClick={() => go(1)}><Arrow direction="right" /></button>
      </>}
    </div>,
    document.body,
  );
}

// Album layout in the spirit of a VSCO profile: equal columns, every photo at its
// original ratio (never cropped), stacked organically. The sharpest ~40% of each
// album span two columns; soft video stills stay one column wide.
function JustifiedGallery({images, title, alt, large}) {
  const {t} = useLang();
  const ref = useRef(null);
  const [width, setWidth] = useState(0);
  const [open, setOpen] = useState(null);
  useEffect(() => {
    const element = ref.current;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const {placed, height} = useMemo(() => (width ? layoutGallery(images, width, large) : {placed: [], height: 0}), [images, width, large]);
  // Reading order for the full-screen viewer: top to bottom, then left to right.
  const order = [...placed].sort((a, b) => a.y - b.y || a.x - b.x).map((item) => item.src);
  return (
    <div className="dialog-gallery" ref={ref} aria-label={t.photos.selection(title)}>
      <div className="gallery-canvas" style={{height: `${height}px`}}>
        {placed.map((item) => {
          const position = order.indexOf(item.src);
          return (
            <button key={item.src} type="button" className="gallery-item" aria-label={t.photos.open(position + 1, order.length)}
              style={{transform: `translate(${item.x}px, ${item.y}px)`, width: `${item.w}px`, height: `${item.h}px`}} onClick={() => setOpen(position)}>
              <span className="band band-fill"><img src={thumb(item.src)} loading={item.y > 900 ? 'lazy' : 'eager'} decoding="async"
                alt={position === 0 ? alt : t.photos.image(title, position + 1)} /></span>
            </button>
          );
        })}
      </div>
      {open !== null && <Lightbox images={order} index={open} title={title} onChange={setOpen} onClose={() => setOpen(null)} />}
    </div>
  );
}

const projectPath = (project) => `/work/${project.slug}/`;
const indexFromPath = () => {
  const match = window.location.pathname.match(/^\/work\/([^/]+)\/?$/);
  const index = match ? projects.findIndex((project) => project.slug === decodeURIComponent(match[1])) : -1;
  return index >= 0 ? index : null;
};
const SITE_TITLE = document.title;

function ProjectDialog({project, index, onClose, onNavigate}) {
  const {t} = useLang();
  const [clipIndex, setClipIndex] = useState(0);
  useEffect(() => setClipIndex(0), [project]);
  const clips = project.videos || [];
  const clip = clips[clipIndex];
  const dialogRef = useRef(null);
  const closeRef = useRef(null);
  const previousFocus = useRef(null);
  const [copied, setCopied] = useState(false);
  useEffect(() => setCopied(false), [project]);
  // Every project has its own address (/work/<slug>/) with its own link preview.
  const share = async () => {
    const url = `${window.location.origin}${projectPath(project)}`;
    if (navigator.share && window.matchMedia('(pointer: coarse)').matches) {
      try { await navigator.share({title: t.dialog.shareTitle(project.title), url}); } catch { /* closed */ }
      return;
    }
    // Copy within the click itself (works everywhere); the Clipboard API is the fallback.
    const field = Object.assign(document.createElement('textarea'), {value: url, readOnly: true});
    field.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
    document.body.append(field);
    field.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { ok = false; }
    field.remove();
    closeRef.current?.previousElementSibling?.focus();
    if (!ok) navigator.clipboard?.writeText(url).catch(() => {});
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  useEffect(() => {
    previousFocus.current = document.activeElement;
    closeRef.current?.focus();
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowLeft') onNavigate(-1);
      if (event.key === 'ArrowRight') onNavigate(1);
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = [...dialogRef.current.querySelectorAll('button, a[href]')].filter((item) => !item.disabled);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = oldOverflow;
      document.removeEventListener('keydown', onKey);
      previousFocus.current?.focus?.();
    };
  }, [onClose, onNavigate]);

  return (
    <div className="dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <article className="project-dialog" role="dialog" aria-modal="true" aria-labelledby="project-title" ref={dialogRef}>
        <header className="dialog-bar">
          <p className="eyebrow">{t.dialog.project} {String(index + 1).padStart(2, '0')} / {String(projects.length).padStart(2, '0')}</p>
          <div className="dialog-actions">
            <button className="text-button" type="button" onClick={share} aria-live="polite">{copied ? t.dialog.copied : t.dialog.share} <svg className="share-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V3M7 8l5-5 5 5M5 13v7h14v-7" /></svg></button>
            <button className="text-button" ref={closeRef} onClick={onClose}>{t.dialog.close} <span aria-hidden="true">×</span></button>
          </div>
        </header>
        <div className={`dialog-visual${clip ? ' has-video' : ''}`}>
          {clip
            ? <BandVideo key={clip.src} src={clip.src} poster={clipIndex === 0 ? thumb(project.cover) : clip.poster} label={`${project.title} — ${clip.title}`} />
            : <span className="band dialog-photo" style={{'--r': ratioOf(project.cover)}}><img src={thumb(project.cover)} alt={project.alt} /></span>}
          <span className="media-flag">{project.label}</span>
        </div>
        {clips.length > 1 && <div className="dialog-clips" role="group" aria-label={`${project.title} videos`}>
          <p className="eyebrow">{t.dialog.videos(clips.length)}</p>
          <div>
            {clips.map((item, itemIndex) => (
              <button key={item.src} type="button" aria-pressed={itemIndex === clipIndex} onClick={() => setClipIndex(itemIndex)}>
                <span className="band-box clip-thumb"><span className="band band-cover" style={{'--r': itemIndex === 0 ? ratioOf(project.cover) : 16 / 9}}><img src={itemIndex === 0 ? thumb(project.cover) : item.poster} alt="" loading="lazy" /></span></span>
                <span><small>{String(itemIndex + 1).padStart(2, '0')}</small>{item.title}</span>
              </button>
            ))}
          </div>
        </div>}
        <div className="dialog-body">
          <div className="dialog-title-block">
            <p className="eyebrow">{project.typeLabel} / {project.genre}</p>
            <h2 id="project-title"><Title project={project} /></h2>
          </div>
          <dl className="project-facts">
            <div><dt>{t.dialog.role}</dt><dd>{project.role}</dd></div>
            <div><dt>{t.dialog.year}</dt><dd>{project.year}</dd></div>
            <div><dt>{t.dialog.status}</dt><dd>{project.status}</dd></div>
          </dl>
          <div className="dialog-copy">
            <p>{project.summary}</p>
          </div>
        </div>
        {project.gallery?.length > (clips.length ? 0 : 1) && <JustifiedGallery images={project.gallery} title={project.title} alt={project.alt} large={project.galleryLarge} />}
        <footer className="dialog-footer">
          <button className="dialog-nav" onClick={() => onNavigate(-1)}><Arrow direction="left" /> {t.dialog.previous}</button>
          <a className="pill pill-dark" href="/project/">{t.hero.discuss} <Arrow /></a>
          <button className="dialog-nav" onClick={() => onNavigate(1)}>{t.dialog.next} <Arrow direction="right" /></button>
        </footer>
      </article>
    </div>
  );
}

function StudioMark() {
  return (
    <svg className="studio-mark" viewBox={LOGO_VIEWBOX} role="img" aria-label="Kurucuvisuals">
      <path fill="currentColor" d={LOGO_PATH} />
      <circle {...LOGO_DOT} />
    </svg>
  );
}

function LangSwitch({className, lang, setLang, label}) {
  return (
    <span className={className} role="group" aria-label={label}>
      {LANGS.map((code, index) => (
        <React.Fragment key={code}>
          {index > 0 && <i aria-hidden="true">/</i>}
          <button type="button" lang={code} aria-pressed={lang === code} onClick={() => setLang(code)}>{code.toUpperCase()}</button>
        </React.Fragment>
      ))}
    </span>
  );
}

function Header({open, setOpen}) {
  const {t, lang, setLang} = useLang();
  const closeMenu = () => setOpen(false);
  return (
    <header className={`site-header ${open ? 'menu-open' : ''}`} id="top">
      <a className="wordmark" href="#top" onClick={(event) => { closeMenu(); scrollToTop(event); }}>
        <span>ARDA KURUCU</span>
        <i className="wordmark-divider" aria-hidden="true" />
        <StudioMark />
      </a>
      <button className="menu-toggle" type="button" aria-expanded={open} aria-controls="site-navigation" onClick={() => setOpen(!open)}>
        <span>{open ? t.nav.close : t.nav.menu}</span><i aria-hidden="true" />
      </button>
      <div className="header-center">
        <nav className="site-nav" id="site-navigation" aria-label="Main navigation">
          <a href="#work" onClick={closeMenu}>{t.nav.work}</a>
          <a href="#approach" onClick={closeMenu}>{t.nav.approach}</a>
          <a href="#about" onClick={closeMenu}>{t.nav.about}</a>
          <a href="#contact" onClick={closeMenu}>{t.nav.contact}</a>
          <LangSwitch className="lang-switch lang-switch-menu" lang={lang} setLang={setLang} label={t.nav.language} />
        </nav>
        <a className="header-ig" href={copy.instagram} target="_blank" rel="noreferrer" aria-label="Instagram">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="5.2" />
            <circle cx="12" cy="12" r="4.2" />
            <circle cx="17.4" cy="6.6" r=".9" className="ig-dot" />
          </svg>
        </a>
        <a className="header-card" href="/card/" aria-label={t.nav.cardLabel}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="2.5" y="5.5" width="19" height="13" rx="2.5" />
            <circle cx="8" cy="11" r="2" />
            <path d="M5.4 15.6c.6-1.4 1.5-2 2.6-2s2 .6 2.6 2M13.5 10h5M13.5 13.5h3.5" />
          </svg>
          <span>{t.nav.card}</span>
        </a>
        <LangSwitch className="lang-switch lang-switch-bar" lang={lang} setLang={setLang} label={t.nav.language} />
      </div>
      <span className="header-meta">{t.descriptor} / {t.city}</span>
    </header>
  );
}

// The journey's own scroll length (see WorkJourney.jsx); its placeholder takes the same room so
// nothing below jumps when the 3D view arrives.
const journeySpace = (count) => ({height: `${Math.max(6.8, count * 1.18 + 1.8) * 100}vh`});

let webglSupport;
const supportsWebgl = () => {
  if (webglSupport === undefined) {
    try {
      const canvas = document.createElement('canvas');
      webglSupport = Boolean(window.WebGL2RenderingContext && canvas.getContext('webgl2'));
    } catch { webglSupport = false; }
  }
  return webglSupport;
};
// 'desktop' = full 3D Work journey, 'mobile' = lighter journey for phones/tablets,
// null = plain photo grid (reduced motion, no WebGL2, very low memory).
function journeyModeNow() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !supportsWebgl()) return null;
  if (window.matchMedia('(min-width: 1120px)').matches) return 'desktop';
  return (navigator.deviceMemory ?? 4) > 2 ? 'mobile' : null;
}

export default function App() {
  const [lang, setLangState] = useState(initialLang);
  const setLang = (next) => { setLangState(next); saveLang(next); };
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  const t = ui[lang];
  const list = useMemo(() => localizeProjects(projects, lang), [lang]);
  const langValue = useMemo(() => ({lang, t, setLang}), [lang]);
  const [filter, setFilter] = useState('All');
  const [selectedIndex, setSelectedIndex] = useState(indexFromPath);
  // Keep the address bar in step with the open project: opening adds a history entry,
  // next/previous replaces it, closing goes back; the browser's back button closes it.
  const pushedProject = useRef(false);
  const previousIndex = useRef(selectedIndex);
  useEffect(() => {
    const previous = previousIndex.current;
    previousIndex.current = selectedIndex;
    document.title = selectedIndex === null ? SITE_TITLE : `${list[selectedIndex].title} — Arda Kurucu`;
    const target = selectedIndex === null ? '/' : projectPath(projects[selectedIndex]);
    if (window.location.pathname === target) return;
    if (selectedIndex !== null && previous === null) {
      history.pushState({project: true}, '', target);
      pushedProject.current = true;
    } else if (selectedIndex !== null) {
      history.replaceState(history.state, '', target);
    } else if (pushedProject.current) {
      pushedProject.current = false;
      history.back();
    } else {
      history.replaceState(null, '', '/');
    }
  }, [selectedIndex, list]);
  useEffect(() => {
    const onPop = () => {
      const index = indexFromPath();
      pushedProject.current = index !== null && Boolean(history.state?.project);
      setSelectedIndex(index);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  const [menuOpen, setMenuOpen] = useState(false);
  // The 3D Work valley (three.js) only loads once the visitor nears the Work section.
  const workSentinel = useRef(null);
  const [nearWork, setNearWork] = useState(() => window.location.hash === '#work');
  useEffect(() => {
    if (nearWork || !workSentinel.current) return undefined;
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setNearWork(true); }, {rootMargin: '300px 0px'});
    observer.observe(workSentinel.current);
    return () => observer.disconnect();
  }, [nearWork]);
  // Decided before the first paint, so the Work section is dark (with its gradient) from the
  // start instead of switching from light to dark when the 3D journey finishes loading.
  const [journeyMode, setJourneyMode] = useState(journeyModeNow);
  const useWebgl = journeyMode === 'desktop';
  const mobileJourney = journeyMode === 'mobile';
  const appRef = useRef(null);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const desktop = window.matchMedia('(min-width: 1120px)');
    const update = () => setJourneyMode(journeyModeNow());
    update();
    reduced.addEventListener('change', update);
    desktop.addEventListener('change', update);
    return () => { reduced.removeEventListener('change', update); desktop.removeEventListener('change', update); };
  }, []);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const ctx = gsap.context(() => {
      gsap.fromTo('[data-intro]', {autoAlpha: 0, y: 22}, {autoAlpha: 1, y: 0, duration: .85, stagger: .08, ease: 'power3.out'});
      gsap.utils.toArray('[data-reveal]').forEach((element) => {
        gsap.fromTo(element, {autoAlpha: 0, y: 20}, {autoAlpha: 1, y: 0, duration: .7, ease: 'power2.out', scrollTrigger: {trigger: element, start: 'top 92%', once: true}});
      });
    }, appRef);
    return () => ctx.revert();
  }, [filter]);

  useEffect(() => {
    const onResize = () => { if (window.innerWidth > 760) setMenuOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const visible = filter === 'All' ? list : list.filter((project) => project.type === filter);
  const navigateProject = (direction) => setSelectedIndex((current) => (current + direction + projects.length) % projects.length);
  const openProject = (project) => setSelectedIndex(list.indexOf(project));
  const [story, setStory] = useState(null);
  const openStory = (slug, trigger) => setStory({slug, trigger});

  return (
    <LangContext.Provider value={langValue}>
    <div ref={appRef}>
      <LoadingCurtain />
      <a className="skip-link" href="#main">{t.skip}</a>
      <Header open={menuOpen} setOpen={setMenuOpen} />
      <main id="main">
        <section className="hero" aria-labelledby="hero-title">
          {useWebgl && <Suspense fallback={null}><Ambient /></Suspense>}
          <div className="hero-index eyebrow" data-intro><span>{t.hero.index}</span></div>
          <h1 id="hero-title" data-intro><span>{t.hero.title[0]}</span><em>{t.hero.title[1]}</em></h1>
          <div className="hero-lower">
            <div className="hero-summary" data-intro>
              <p>{t.hero.summary[0]}<br />{t.hero.summary[1]}</p>
              <div className="hero-actions">
                <a className="pill pill-dark" href="#work">{t.hero.explore} <Arrow direction="down" /></a>
                <a className="pill" href="/project/">{t.hero.discuss} <Arrow /></a>
              </div>
            </div>
            <figure className="hero-frame" data-intro>
              <i className="print-tape print-tape-left" aria-hidden="true" />
              <i className="print-tape print-tape-right" aria-hidden="true" />
              <HeroReel />
              <figcaption><em>{t.hero.caption}<span className="print-dot" aria-hidden="true" /></em><span>SHOWREEL / 2026</span></figcaption>
            </figure>
          </div>
          <div className="hero-rule eyebrow"><span>{t.hero.rule[0]}</span><span>{t.hero.rule[1]}</span></div>
        </section>

        <section id="work" className={`section work-section${journeyMode ? ' is-journey' : ''}${mobileJourney ? ' is-journey-mobile' : ''}`} aria-labelledby="work-title">
          <div className="section-heading" data-reveal>
            <p className="eyebrow">{t.work.eyebrow}</p>
            <div className="section-title-row"><h2 id="work-title">{t.work.title[0]}{t.work.title[1] && <> <em>{t.work.title[1]}</em></>}</h2><p>{t.work.intro}</p></div>
          </div>
          <div className="work-toolbar" data-reveal>
            <p className="eyebrow">{t.work.viewing} <strong>{String(visible.length).padStart(2, '0')}</strong></p>
            <div className="filters" role="group" aria-label={t.work.filterLabel}>
              {filters.map((item) => <button key={item} type="button" aria-pressed={filter === item} onClick={() => setFilter(item)}>{t.work.filters[item]}</button>)}
            </div>
          </div>
          <span ref={workSentinel} aria-hidden="true" />
          {(useWebgl || mobileJourney) && !nearWork && <div className="journey-loading eyebrow" style={journeySpace(visible.length)} aria-hidden="true" />}
          {(useWebgl || mobileJourney) && nearWork && <Suspense fallback={<div className="journey-loading eyebrow" style={journeySpace(visible.length)}>{t.work.preparing}</div>}><WorkJourney key={useWebgl ? 'desktop' : 'mobile'} items={visible} onOpen={openProject} mobile={!useWebgl} /></Suspense>}
          <div className={`project-grid ${useWebgl || mobileJourney ? 'project-grid-fallback' : ''}${mobileJourney ? ' project-grid-hidden' : ''}`}>
            {visible.map((project, visibleIndex) => {
              const projectIndex = list.indexOf(project);
              return (
                <button className="project-card" data-reveal key={project.slug} type="button" onClick={() => setSelectedIndex(projectIndex)} aria-label={t.work.viewLabel(project.title, project.role)}>
                  <span className="project-image" style={{aspectRatio: project.aspect}}>
                    <span className="band band-contain" style={{'--r': project.ratio}}><img src={thumb(project.cover)} loading={visibleIndex > 1 ? 'lazy' : 'eager'} decoding="async" alt={project.alt} /></span>
                    <span className="media-flag">{project.label}</span>
                    <span className="view-project">{t.work.view} <Arrow /></span>
                  </span>
                  <span className="project-meta">
                    <span><strong><Title project={project} /></strong><small>{project.genre} / {project.role}</small></span>
                    <span className="project-count">{String(projectIndex + 1).padStart(2, '0')}</span>
                  </span>
                </button>
              );
            })}
          </div>
          <p className="content-disclaimer" data-reveal>{t.work.disclaimer}</p>
        </section>

        <section id="approach" className="section approach" aria-labelledby="approach-title">
          <p className="eyebrow" data-reveal>{t.approach.eyebrow}</p>
          <div className="approach-layout">
            <h2 id="approach-title" data-reveal>{t.approach.title[0]}<br /><em>{t.approach.title[1]}</em></h2>
            <div className="approach-copy" data-reveal>
              <p>{t.approach.body}</p>
            </div>
          </div>
          <div className="process-strip" data-reveal>
            {t.approach.steps.map((item, index) => <div key={index}><span>{String(index + 1).padStart(2, '0')}</span><strong>{item}</strong></div>)}
          </div>
          <div className="service-list">
            {services.map((slug, index) => { const [title, body] = t.approach.services[slug]; return (
              <button className="service-row" type="button" data-reveal key={slug} onClick={(event) => openStory(slug, event.currentTarget)} aria-haspopup="dialog">
                <span className="eyebrow">{String(index + 1).padStart(2, '0')}</span><h3>{title}</h3><p>{body}</p><Arrow />
              </button>
            ); })}
          </div>
        </section>

        <section id="about" className="section about" aria-labelledby="about-title">
          <p className="eyebrow" data-reveal>{t.about.eyebrow}</p>
          <div className="about-layout">
            <h2 id="about-title" data-reveal>{t.about.title[0]}<br /><em>{t.about.title[1]}</em></h2>
            <div className="about-copy" data-reveal>
              {t.about.body.map((text) => <p key={text}>{text}</p>)}
            </div>
          </div>
          <div className="about-facts eyebrow" data-reveal>{t.about.facts.map((fact) => <span key={fact}>{fact}</span>)}</div>
        </section>

        <section id="contact" className="section contact" aria-labelledby="contact-title">
          <p className="eyebrow" data-reveal>{t.contact.eyebrow}</p>
          <div className="contact-title-row">
            <h2 id="contact-title" data-reveal>{t.contact.title.map(([before, italic, after], line) => <React.Fragment key={line}>{line > 0 && <br />}{before}<em>{italic}</em>{after}</React.Fragment>)}</h2>
            <a className="contact-arrow" data-reveal href="/project/" aria-label={t.contact.start}><Arrow /></a>
          </div>
          <p className="contact-prompt" data-reveal>{t.contact.prompt}</p>
          <div className="email-row" data-reveal>
            <a className="email-link" href={`mailto:${copy.email}`}>{copy.email}</a>
            {/* Phones: the big round button moves down beside the address. */}
            <a className="contact-arrow contact-arrow-mobile" href="/project/" aria-label={t.contact.start}><Arrow /></a>
          </div>
          <a className="card-link" href="/card/" data-reveal>
            <span className="card-link-dot" aria-hidden="true" />
            <span><small className="eyebrow">{t.contact.save}</small>{t.contact.card}</span>
            <Arrow />
          </a>
          <footer className="site-footer eyebrow">
            <span>© {new Date().getFullYear()} ARDA KURUCU</span>
            <span>{t.contact.role}</span>
            <a href={copy.instagram} target="_blank" rel="noreferrer">INSTAGRAM <Arrow /></a>
            <a href="/card/">{t.contact.card} <Arrow /></a>
            <a href="#top" onClick={scrollToTop}>{t.contact.top} <Arrow direction="up" /></a>
          </footer>
        </section>
      </main>
      {story && <Suspense fallback={null}><ServiceStory slug={story.slug} trigger={story.trigger} title={t.approach.services[story.slug][0]} onClose={() => setStory(null)} /></Suspense>}
      {selectedIndex !== null && <ProjectDialog project={list[selectedIndex]} index={selectedIndex} onClose={() => setSelectedIndex(null)} onNavigate={navigateProject} />}
    </div>
    </LangContext.Provider>
  );
}
