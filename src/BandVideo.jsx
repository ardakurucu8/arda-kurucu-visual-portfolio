import React, {useEffect, useRef, useState} from 'react';
import {BAND} from './media.js';
import {useLang} from './i18n.js';

// Project video with its own controls. The file carries the black akv download band
// underneath the picture; the frame crops it away, so the native controls (which would
// sit on the hidden band and offer "Download") are replaced by this small control bar.
const format = (seconds) => {
  if (!Number.isFinite(seconds)) return '0:00';
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

export default function BandVideo({src, poster, label}) {
  const {t} = useLang();
  const stage = useRef(null);
  const video = useRef(null);
  const [ratio, setRatio] = useState(16 / 9);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [full, setFull] = useState(false);

  useEffect(() => {
    const onChange = () => setFull(document.fullscreenElement === stage.current);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggle = () => {
    const element = video.current;
    if (element.paused) element.play().catch(() => {}); else element.pause();
  };
  const fullscreen = () => {
    const element = stage.current;
    if (document.fullscreenElement) document.exitFullscreen?.();
    else if (element.requestFullscreen) element.requestFullscreen().catch(() => {});
    else video.current.webkitEnterFullscreen?.(); // iPhone: only the system player can go full screen
  };

  return (
    <div className={`video-stage${full ? ' is-full' : ''}`} ref={stage}>
      <div className="band band-contain video-box" style={{'--r': ratio}}>
        <video
          ref={video}
          src={src}
          poster={poster}
          playsInline
          preload="metadata"
          disablePictureInPicture
          aria-label={label}
          onClick={toggle}
          onContextMenu={(event) => event.preventDefault()}
          onLoadedMetadata={(event) => {
            const {videoWidth: w, videoHeight: h, duration: d} = event.currentTarget;
            if (w && h) setRatio(w / (h / BAND));
            setDuration(d);
          }}
          onTimeUpdate={(event) => setTime(event.currentTarget.currentTime)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onVolumeChange={(event) => setMuted(event.currentTarget.muted)}
        />
        {!playing && (
          <button type="button" className="video-big-play" onClick={toggle} aria-label={`${t.video.play}: ${label}`}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" /></svg>
          </button>
        )}
        <div className="video-controls">
          <button type="button" onClick={toggle} aria-label={playing ? t.video.pause : t.video.play}>
            <svg viewBox="0 0 24 24" aria-hidden="true">{playing ? <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" /> : <path d="M8 5.5v13l11-6.5z" />}</svg>
          </button>
          <span className="video-time">{format(time)} / {format(duration)}</span>
          <input
            type="range" min="0" max={duration || 0} step="0.1" value={time} aria-label={t.video.seek}
            onChange={(event) => { video.current.currentTime = Number(event.target.value); setTime(Number(event.target.value)); }}
            style={{'--p': duration ? `${(time / duration) * 100}%` : '0%'}}
          />
          <button type="button" onClick={() => { video.current.muted = !video.current.muted; }} aria-label={muted ? t.video.unmute : t.video.mute}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 9h4l5-4v14l-5-4H4z" />
              {muted ? <path d="M16 9l5 6M21 9l-5 6" className="stroke" /> : <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" className="stroke" />}
            </svg>
          </button>
          <button type="button" onClick={fullscreen} aria-label={full ? t.video.exitFull : t.video.full}>
            <svg viewBox="0 0 24 24" aria-hidden="true" className="stroke"><path d={full ? 'M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5' : 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5'} /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
