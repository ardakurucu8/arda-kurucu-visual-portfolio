import React, {Suspense, lazy, useEffect, useRef, useState} from 'react';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {projects} from './data/projects.js';

gsap.registerPlugin(ScrollTrigger);
const Ambient = lazy(() => import('./Ambient.jsx'));
const WorkJourney = lazy(() => import('./WorkJourney.jsx'));
const filters = ['All', 'Video', 'Photography', 'AI / Generative'];
const copy = {
  descriptor: 'Visual Creative',
  services: 'Videography / Photography / Design',
  email: 'ardakurucu8@gmail.com',
  instagram: 'https://www.instagram.com/kurucuvisuals/',
};

function Arrow({direction = 'ne'}) {
  return <span aria-hidden="true">{direction === 'down' ? '↓' : direction === 'left' ? '←' : direction === 'right' ? '→' : '↗'}</span>;
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

function ProjectDialog({project, index, onClose, onNavigate}) {
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
        <div className="dialog-visual">
          <img src={project.cover} alt={project.alt} />
          <span className="media-flag">{project.label}</span>
        </div>
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
        {project.gallery?.length > 1 && <div className="dialog-gallery" aria-label={`${project.title} image selection`}>
          {project.gallery.map((image, galleryIndex) => <img key={image} src={image} loading={galleryIndex > 1 ? 'lazy' : 'eager'} alt={galleryIndex === 0 ? project.alt : `${project.title} selected image ${galleryIndex + 1}`} />)}
        </div>}
        <footer className="dialog-footer">
          <button className="dialog-nav" onClick={() => onNavigate(-1)}><Arrow direction="left" /> PREVIOUS</button>
          <a className="pill pill-dark" href={`mailto:${copy.email}?subject=Project%20inquiry`}>DISCUSS A PROJECT <Arrow /></a>
          <button className="dialog-nav" onClick={() => onNavigate(1)}>NEXT <Arrow direction="right" /></button>
        </footer>
      </article>
    </div>
  );
}

// Kurucuvisuals "akv" mark, redrawn as vector from the supplied 1200×1200 artwork.
function StudioMark() {
  return (
    <svg className="studio-mark" viewBox="300 290 610 433" role="img" aria-label="Kurucuvisuals">
      <path fill="currentColor" d="M301 719L408 499L509 705V374H554V597L646 499H731L792 624L851 499H899L791 721L691 516L610 602L707 719H649L554 603V719H468L408 597L349 719Z" />
      <circle cx="869" cy="331" r="39" fill="#6e0000" />
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
      <nav className="site-nav" id="site-navigation" aria-label="Main navigation">
        <a href="#work" onClick={closeMenu}>WORK</a>
        <a href="#approach" onClick={closeMenu}>APPROACH</a>
        <a href="#services" onClick={closeMenu}>SERVICES</a>
        <a href="#about" onClick={closeMenu}>ABOUT</a>
        <a href="#contact" onClick={closeMenu}>CONTACT</a>
      </nav>
      <span className="header-meta">{copy.descriptor} / Istanbul</span>
    </header>
  );
}

export default function App() {
  const [filter, setFilter] = useState('All');
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [useWebgl, setUseWebgl] = useState(false);
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
    const update = () => setUseWebgl(!reduced.matches && desktop.matches && supportsWebgl());
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

  return (
    <div ref={appRef}>
      <LoadingCurtain />
      <a className="skip-link" href="#main">Skip to content</a>
      <Header open={menuOpen} setOpen={setMenuOpen} />
      <main id="main">
        <section className="hero" aria-labelledby="hero-title">
          {useWebgl && <Suspense fallback={null}><Ambient /></Suspense>}
          <div className="hero-index eyebrow" data-intro><span>INDEPENDENT {copy.descriptor}</span><span>{copy.services}</span></div>
          <h1 id="hero-title" data-intro><span>VISUALS WITH</span><em>A STORY AND STYLE.</em></h1>
          <div className="hero-lower">
            <div className="hero-summary" data-intro>
              <p>Videography, photography and design.<br />Built around an idea, made to feel personal.</p>
              <div className="hero-actions">
                <a className="pill pill-dark" href="#work">EXPLORE WORK <Arrow direction="down" /></a>
                <a className="pill" href={`mailto:${copy.email}?subject=Let's%20collaborate`}>DISCUSS A PROJECT <Arrow /></a>
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
          {useWebgl && <Suspense fallback={<div className="journey-loading eyebrow">PREPARING VISUAL JOURNEY…</div>}><WorkJourney items={visible} onOpen={openProject} /></Suspense>}
          <div className={`project-grid ${useWebgl ? 'project-grid-fallback' : ''}`}>
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
              <p className="eyebrow">IDEA → IMAGE → EDIT → FEELING</p>
            </div>
          </div>
          <div className="process-strip" data-reveal>
            {['Listen', 'Shape', 'Make', 'Refine'].map((item, index) => <div key={item}><span>{String(index + 1).padStart(2, '0')}</span><strong>{item}</strong></div>)}
          </div>
        </section>

        <section id="services" className="section services" aria-labelledby="services-title">
          <div className="section-heading" data-reveal><p className="eyebrow">03 / WHAT I CREATE</p><h2 id="services-title">THREE WAYS<br /><em>TO MAKE IT VISUAL.</em></h2></div>
          <div className="service-list">
            {[
              ['01', 'Video production', 'Concept-led moving images for artists, musicians and personal projects.'],
              ['02', 'Photography', 'Portraits and visual stories shaped around mood, people and place.'],
              ['03', 'Video editing', 'Purposeful pacing, structure and atmosphere from first assembly to final cut.'],
            ].map(([number, title, body]) => <article className="service-row" data-reveal key={number}><span className="eyebrow">{number}</span><h3>{title}</h3><p>{body}</p><Arrow /></article>)}
          </div>
          <p className="service-note" data-reveal>For individuals, artists and musicians. Bring a starting point—or just the feeling you want the work to leave behind.</p>
        </section>

        <section id="about" className="section about" aria-labelledby="about-title">
          <p className="eyebrow" data-reveal>04 / ABOUT</p>
          <div className="about-layout">
            <h2 id="about-title" data-reveal>ARDA KURUCU<br /><em>VISUAL CREATIVE.</em></h2>
            <div className="about-copy" data-reveal>
              <p>Arda is an Istanbul-based visual creative working across video, photography and editing. His practice is grounded in visual concept: finding the image, rhythm and point of view that makes each project feel specific.</p>
              <p>This portfolio is designed for collaboration with people making something personal—especially independent artists, musicians and individuals.</p>
            </div>
          </div>
          <div className="about-facts eyebrow" data-reveal><span>BASED / ISTANBUL</span><span>FOCUS / VISUAL CONCEPT</span><span>AVAILABLE / PROJECT-BASED</span></div>
        </section>

        <section id="contact" className="section contact" aria-labelledby="contact-title">
          <p className="eyebrow" data-reveal>05 / GET IN TOUCH</p>
          <div className="contact-title-row">
            <h2 id="contact-title" data-reveal>HAVE AN <em>IDEA?</em><br />LET'S MAKE IT <em>VISUAL.</em></h2>
            <a className="contact-arrow" data-reveal href={`mailto:${copy.email}?subject=Let's%20collaborate`} aria-label="Email Arda about a project"><Arrow /></a>
          </div>
          <p className="contact-prompt" data-reveal>Tell me the idea, the format, your location and when you’d like to make it.</p>
          <a className="email-link" data-reveal href={`mailto:${copy.email}`}>{copy.email}</a>
          <footer className="site-footer eyebrow">
            <span>© {new Date().getFullYear()} ARDA KURUCU</span>
            <span>VISUAL CREATIVE / ISTANBUL</span>
            <a href={copy.instagram} target="_blank" rel="noreferrer">INSTAGRAM <Arrow /></a>
            <a href="#top">BACK TO TOP ↑</a>
          </footer>
        </section>
      </main>
      {selectedIndex !== null && <ProjectDialog project={projects[selectedIndex]} index={selectedIndex} onClose={() => setSelectedIndex(null)} onNavigate={navigateProject} />}
    </div>
  );
}
