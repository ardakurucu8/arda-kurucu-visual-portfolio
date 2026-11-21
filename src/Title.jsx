import React from 'react';

// Project title with the right language for capitalisation: Turkish words get İ (İSTİKBAL),
// English words keep I. Uses `titleParts` when a title mixes both, otherwise `lang`.
export default function Title({project}) {
  if (!project) return null;
  if (project.titleParts) return project.titleParts.map(([text, lang]) => <span key={text} lang={lang}>{text}</span>);
  return project.lang ? <span lang={project.lang}>{project.title}</span> : project.title;
}
