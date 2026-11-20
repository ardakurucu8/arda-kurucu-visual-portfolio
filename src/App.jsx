import React, {Suspense, lazy, useEffect, useMemo, useRef, useState} from 'react';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {projects} from './data/projects.js';
import {layoutGallery} from './galleryLayout.js';
import {createPortal} from 'react-dom';
import {LOGO_DOT, LOGO_PATH, LOGO_VIEWBOX} from './brand.js';

gsap.registerPlugin(ScrollTrigger);
const Ambient = lazy(() => import('./Ambient.jsx'));
const WorkJourney = lazy(() => import('./WorkJourney.jsx'));
const ServiceStory = lazy(() => import('./ServiceStory.jsx'));
const services = [
  ['videography', 'Videography', 'Concept-led moving images for artists and personal projects.'],
  ['photography', 'Photography', 'Portraits and visual stories shaped around mood, people and place.'],
  ['illustration', 'Illustration Design', 'Illustrated and designed visuals, from first idea to final artwork.'],
];
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
  left: 'M21 12H3M10 5l-7 7 7 7',
  right: 'M3 12h18M14 5l7 7-7 7',
  ne: 'M6 18 18 6M8 6h10v10',
};

function Arrow({direction = 'ne'}) {
  return (
    <span className="arrow" aria-hidden="true">
      <svg viewBox="0 0 24 24"><path d={ARROW_PATHS[direction] || ARROW_PATHS.ne} /></svg>
    </span>
  );
}

function LoadingCurtain() {
  const [state, setState] = useState({visible: false, progress: 0, done: false});

  useEffect(() => {
    let cancelled = false;
    const critical = ['/media/portfolio/hero-portrait.jpg', ...projects.slice(0, 3).map((project) => project.cover)];
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
      new Promise((resolve) => window.setTimeout(resolve, 1800)),
    ]).then(() => {
      window.clearTimeout(timer);
      if (!cancelled) setState((current) => ({...current, progress: 100, done: true}));
    });
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, []);

  if (!state.visible) return null;
  return (
    <div className={`site-loader ${state.done ? 'is-done' : ''}`} aria-live="polite" aria-label="Preparing the portfolio">
      <div className="loader-brand"><strong>ARDA KURUCU</strong><span>VISUAL CREATIVE</span></div>
      <div className="loader-status eyebrow"><span>PREPARING VISUAL JOURNEY</span><span>{String(state.progress).padStart(3, '0')}%</span></div>
      <i style={{transform: `scaleX(${state.progress / 100})`}} />
    </div>
  );
}

// Full-screen viewer for album photos. It sits above the project window and takes
// Escape / arrow keys first, so they never close or switch the project underneath.
function Lightbox({images, index, title, onChange, onClose}) {
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
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={`${title} — photo ${index + 1} of ${count}`}
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
        <button type="button" className="eyebrow" ref={closeRef} onClick={onClose}>CLOSE <span aria-hidden="true">×</span></button>
      </div>
      <img key={images[index]} src={images[index]} alt={`${title} — photo ${index + 1}`} />
      {count > 1 && <>
        <button type="button" className="lightbox-nav prev" aria-label="Previous photo" onClick={() => go(-1)}><Arrow direction="left" /></button>
        <button type="button" className="lightbox-nav next" aria-label="Next photo" onClick={() => go(1)}><Arrow direction="right" /></button>
      </>}
    </div>,
    document.body,
  );
}

// Album layout in the spirit of a VSCO profile: equal columns, every photo at its
// original ratio (never cropped), stacked organically. The sharpest ~40% of each
// album span two columns; soft video stills stay one column wide.
function JustifiedGallery({images, title, alt, large}) {
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
    <div className="dialog-gallery" ref={ref} aria-label={`${title} image selection`}>
      <div className="gallery-canvas" style={{height: `${height}px`}}>
        {placed.map((item) => {
          const position = order.indexOf(item.src);
          return (
            <button key={item.src} type="button" className="gallery-item" aria-label={`Open photo ${position + 1} of ${order.length}`}
              style={{transform: `translate(${item.x}px, ${item.y}px)`, width: `${item.w}px`, height: `${item.h}px`}} onClick={() => setOpen(position)}>
              <img src={item.src} loading={item.y > 900 ? 'lazy' : 'eager'} decoding="async"
                alt={position === 0 ? alt : `${title} selected image ${position + 1}`} />
            </button>
          );
        })}
      </div>
      {open !== null && <Lightbox images={order} index={open} title={title} onChange={setOpen} onClose={() => setOpen(null)} />}
    </div>
  );
}

function ProjectDialog({project, index, onClose, onNavigate}) {
  const [clipIndex, setClipIndex] = useState(0);
  useEffect(() => setClipIndex(0), [project]);
  const clips = project.videos || [];
  const clip = clips[clipIndex];
  const dialogRef = useRef(null);
  const closeRef = useRef(null);
  const previousFocus = useRef(null);

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
          <p className="eyebrow">PROJECT {String(index + 1).padStart(2, '0')} / {String(projects.length).padStart(2, '0')}</p>
          <button className="text-button" ref={closeRef} onClick={onClose}>CLOSE <span aria-hidden="true">×</span></button>
        </header>
        <div className={`dialog-visual${clip ? ' has-video' : ''}`}>
          {clip
            ? <video key={clip.src} src={clip.src} poster={clipIndex === 0 ? project.cover : clip.poster} controls playsInline preload="metadata" aria-label={`${project.title} — ${clip.title}`} />
            : <img src={project.cover} alt={project.alt} />}
          <span className="media-flag">{project.label}</span>
        </div>
        {clips.length > 1 && <div className="dialog-clips" role="group" aria-label={`${project.title} videos`}>
          <p className="eyebrow">{clips.length} VIDEOS</p>
          <div>
            {clips.map((item, itemIndex) => (
              <button key={item.src} type="button" aria-pressed={itemIndex === clipIndex} onClick={() => setClipIndex(itemIndex)}>
                <img src={itemIndex === 0 ? project.cover : item.poster} alt="" loading="lazy" />
                <span><small>{String(itemIndex + 1).padStart(2, '0')}</small>{item.title}</span>
              </button>
            ))}
          </div>
        </div>}
        <div className="dialog-body">
          <div className="dialog-title-block">
            <p className="eyebrow">{project.type} / {project.genre}</p>
            <h2 id="project-title">{project.title}</h2>
          </div>
          <dl className="project-facts">
            <div><dt>Role</dt><dd>{project.role}</dd></div>
            <div><dt>Year</dt><dd>{project.year}</dd></div>
            <div><dt>Status</dt><dd>{project.status}</dd></div>
          </dl>
          <div className="dialog-copy">
            <p>{project.summary}</p>
            <p className="replacement-note">RELEASE NOTE — {project.context}</p>
          </div>
        </div>
        {project.gallery?.length > (clips.length ? 0 : 1) && <JustifiedGallery images={project.gallery} title={project.title} alt={project.alt} large={project.galleryLarge} />}
        <footer className="dialog-footer">
          <button className="dialog-nav" onClick={() => onNavigate(-1)}><Arrow direction="left" /> PREVIOUS</button>
          <a className="pill pill-dark" href="/project/">DISCUSS A PROJECT <Arrow /></a>
          <button className="dialog-nav" onClick={() => onNavigate(1)}>NEXT <Arrow direction="right" /></button>
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

function Header({open, setOpen}) {
  const closeMenu = () => setOpen(false);
  return (
    <header className={`site-header ${open ? 'menu-open' : ''}`} id="top">
      <a className="wordmark" href="#top" onClick={closeMenu}>
        <span>ARDA KURUCU</span>
        <i className="wordmark-divider" aria-hidden="true" />
        <StudioMark />
      </a>
      <button className="menu-toggle" type="button" aria-expanded={open} aria-controls="site-navigation" onClick={() => setOpen(!open)}>
        <span>{open ? 'CLOSE' : 'MENU'}</span><i aria-hidden="true" />
      </button>
      <div className="header-center">
        <nav className="site-nav" id="site-navigation" aria-label="Main navigation">
          <a href="#work" onClick={closeMenu}>WORK</a>
          <a href="#approach" onClick={closeMenu}>APPROACH</a>
          <a href="#about" onClick={closeMenu}>ABOUT</a>
          <a href="#contact" onClick={closeMenu}>CONTACT</a>
        </nav>
        <a className="header-ig" href={copy.instagram} target="_blank" rel="noreferrer" aria-label="Instagram">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="5.2" />
            <circle cx="12" cy="12" r="4.2" />
            <circle cx="17.4" cy="6.6" r=".9" className="ig-dot" />
          </svg>
        </a>
        <a className="header-card" href="/card/" aria-label="Digital card">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="2.5" y="5.5" width="19" height="13" rx="2.5" />
            <circle cx="8" cy="11" r="2" />
            <path d="M5.4 15.6c.6-1.4 1.5-2 2.6-2s2 .6 2.6 2M13.5 10h5M13.5 13.5h3.5" />
          </svg>
          <span>CARD</span>
        </a>
      </div>
      <span className="header-meta">{copy.descriptor} / Istanbul</span>
    </header>
  );
}

export default function App() {
  const [filter, setFilter] = useState('All');
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [useWebgl, setUseWebgl] = useState(false);
  const [mobileJourney, setMobileJourney] = useState(false);
  const appRef = useRef(null);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const desktop = window.matchMedia('(min-width: 1120px)');
    const supportsWebgl = () => {
      try {
        const canvas = document.createElement('canvas');
        return Boolean(window.WebGL2RenderingContext && canvas.getContext('webgl2'));
      } catch { return false; }
    };
    const update = () => {
      const capable = !reduced.matches && supportsWebgl();
      setUseWebgl(capable && desktop.matches);
      // Lighter Work journey on phones/tablets; very low-memory devices keep the photo grid.
      setMobileJourney(capable && !desktop.matches && (navigator.deviceMemory ?? 4) > 2);
    };
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

  const visible = filter === 'All' ? projects : projects.filter((project) => project.type === filter);
  const navigateProject = (direction) => setSelectedIndex((current) => (current + direction + projects.length) % projects.length);
  const openProject = (project) => setSelectedIndex(projects.indexOf(project));
  const [story, setStory] = useState(null);
  const openStory = (slug, trigger) => setStory({slug, trigger});

  return (
    <div ref={appRef}>
      <LoadingCurtain />
      <a className="skip-link" href="#main">Skip to content</a>
      <Header open={menuOpen} setOpen={setMenuOpen} />
      <main id="main">
        <section className="hero" aria-labelledby="hero-title">
          {useWebgl && <Suspense fallback={null}><Ambient /></Suspense>}
          <div className="hero-index eyebrow" data-intro><span>INDEPENDENT {copy.descriptor}</span></div>
          <h1 id="hero-title" data-intro><span>VISUALS WITH</span><em>A STORY AND STYLE.</em></h1>
          <div className="hero-lower">
            <div className="hero-summary" data-intro>
              <p>Videography, photography and design.<br />Built around an idea, made to feel personal.</p>
              <div className="hero-actions">
                <a className="pill pill-dark" href="#work">EXPLORE WORK <Arrow direction="down" /></a>
                <a className="pill" href="/project/">DISCUSS A PROJECT <Arrow /></a>
              </div>
            </div>
            <figure className="hero-frame" data-intro>
              <img src="/media/portfolio/hero-portrait.jpg" alt="Editorial portrait of a woman reading at a softly lit restaurant table" fetchPriority="high" />
              <figcaption><span>ARDA KURUCU / SELECTED PORTRAIT</span><span>PUBLIC PORTFOLIO / 2026</span></figcaption>
            </figure>
          </div>
          <div className="hero-rule eyebrow"><span>SELECTED VISUAL WORKS</span><span>SCROLL / 01</span></div>
        </section>

        <section id="work" className="section work-section" aria-labelledby="work-title">
          <div className="section-heading" data-reveal>
            <p className="eyebrow">01 / THE WORK</p>
            <div className="section-title-row"><h2 id="work-title">SELECTED <em>WORK.</em></h2><p>A considered sequence of moving and still image projects—credit and contribution made visible.</p></div>
          </div>
          <div className="work-toolbar" data-reveal>
            <p className="eyebrow">VIEWING <strong>{String(visible.length).padStart(2, '0')}</strong></p>
            <div className="filters" role="group" aria-label="Filter selected work">
              {filters.map((item) => <button key={item} type="button" aria-pressed={filter === item} onClick={() => setFilter(item)}>{item}</button>)}
            </div>
          </div>
          {(useWebgl || mobileJourney) && <Suspense fallback={<div className="journey-loading eyebrow">PREPARING VISUAL JOURNEY…</div>}><WorkJourney key={useWebgl ? 'desktop' : 'mobile'} items={visible} onOpen={openProject} mobile={!useWebgl} /></Suspense>}
          <div className={`project-grid ${useWebgl || mobileJourney ? 'project-grid-fallback' : ''}${mobileJourney ? ' project-grid-hidden' : ''}`}>
            {visible.map((project, visibleIndex) => {
              const projectIndex = projects.indexOf(project);
              return (
                <button className="project-card" data-reveal key={project.slug} type="button" onClick={() => setSelectedIndex(projectIndex)} aria-label={`View ${project.title}. ${project.role}`}>
                  <span className="project-image" style={{aspectRatio: project.aspect}}>
                    <img src={project.cover} loading={visibleIndex > 1 ? 'lazy' : 'eager'} alt={project.alt} />
                    <span className="media-flag">{project.label}</span>
                    <span className="view-project">VIEW PROJECT <Arrow /></span>
                  </span>
                  <span className="project-meta">
                    <span><strong>{project.title}</strong><small>{project.genre} / {project.role}</small></span>
                    <span className="project-count">{String(projectIndex + 1).padStart(2, '0')}</span>
                  </span>
                </button>
              );
            })}
          </div>
          <p className="content-disclaimer" data-reveal>RELEASE STATUS — Public portfolio use of the supplied media was confirmed on 02 November 2026. Titles inferred from folder names and resume-verified roles are shown where available. Exact project roles, years and final credit wording still require confirmation. AI-generated work is kept separate from Photography and explicitly disclosed.</p>
        </section>

        <section id="approach" className="section approach" aria-labelledby="approach-title">
          <p className="eyebrow" data-reveal>02 / THE APPROACH</p>
          <div className="approach-layout">
            <h2 id="approach-title" data-reveal>CONCEPT FIRST.<br /><em>MEDIUM SECOND.</em></h2>
            <div className="approach-copy" data-reveal>
              <p>A strong visual starts before the camera turns on. The process moves from idea and mood to composition, light and rhythm—then chooses the medium that makes it feel right.</p>
            </div>
          </div>
          <div className="process-strip" data-reveal>
            {['Idea', 'Image', 'Edit', 'Feeling'].map((item, index) => <div key={item}><span>{String(index + 1).padStart(2, '0')}</span><strong>{item}</strong></div>)}
          </div>
          <div className="service-list">
            {services.map(([slug, title, body], index) => (
              <button className="service-row" type="button" data-reveal key={slug} onClick={(event) => openStory(slug, event.currentTarget)} aria-haspopup="dialog">
                <span className="eyebrow">{String(index + 1).padStart(2, '0')}</span><h3>{title}</h3><p>{body}</p><Arrow />
              </button>
            ))}
          </div>
          <p className="service-note" data-reveal>For individuals and artists. Bring a starting point—or just the feeling you want the work to leave behind.</p>
        </section>

        <section id="about" className="section about" aria-labelledby="about-title">
          <p className="eyebrow" data-reveal>03 / ABOUT</p>
          <div className="about-layout">
            <h2 id="about-title" data-reveal>ARDA KURUCU<br /><em>VISUAL CREATIVE.</em></h2>
            <div className="about-copy" data-reveal>
              <p>Arda is an Istanbul-based visual creative working across video, photography and editing. His practice is grounded in visual concept: finding the image, rhythm and point of view that makes each project feel specific.</p>
              <p>This portfolio is designed for collaboration with people making something personal—especially independent artists and individuals.</p>
            </div>
          </div>
          <div className="about-facts eyebrow" data-reveal><span>BASED / ISTANBUL</span><span>FOCUS / VISUAL CONCEPT</span><span>AVAILABLE / PROJECT-BASED</span></div>
        </section>

        <section id="contact" className="section contact" aria-labelledby="contact-title">
          <p className="eyebrow" data-reveal>04 / GET IN TOUCH</p>
          <div className="contact-title-row">
            <h2 id="contact-title" data-reveal>HAVE AN <em>IDEA?</em><br />LET'S MAKE IT <em>VISUAL.</em></h2>
            <a className="contact-arrow" data-reveal href="/project/" aria-label="Start a project with Arda"><Arrow /></a>
          </div>
          <p className="contact-prompt" data-reveal>Tell me the idea, the format, your location and when you’d like to make it.</p>
          <div className="email-row" data-reveal>
            <a className="email-link" href={`mailto:${copy.email}`}>{copy.email}</a>
            {/* Phones: the big round button moves down beside the address. */}
            <a className="contact-arrow contact-arrow-mobile" href="/project/" aria-label="Start a project with Arda"><Arrow /></a>
          </div>
          <a className="card-link" href="/card/" data-reveal>
            <span className="card-link-dot" aria-hidden="true" />
            <span><small className="eyebrow">Save my details</small>DIGITAL CARD</span>
            <Arrow />
          </a>
          <footer className="site-footer eyebrow">
            <span>© {new Date().getFullYear()} ARDA KURUCU</span>
            <span>VISUAL CREATIVE / ISTANBUL</span>
            <a href={copy.instagram} target="_blank" rel="noreferrer">INSTAGRAM <Arrow /></a>
            <a href="/card/">DIGITAL CARD <Arrow /></a>
            <a href="#top">BACK TO TOP ↑</a>
          </footer>
        </section>
      </main>
      {story && <Suspense fallback={null}><ServiceStory slug={story.slug} trigger={story.trigger} title={services.find(([slug]) => slug === story.slug)[1]} onClose={() => setStory(null)} /></Suspense>}
      {selectedIndex !== null && <ProjectDialog project={projects[selectedIndex]} index={selectedIndex} onClose={() => setSelectedIndex(null)} onNavigate={navigateProject} />}
    </div>
  );
}
