import {defineConfig} from 'vite';

// Pages: 404.html is GitHub Pages' not-found page. Three main pages: the portfolio (index.html), the digital card (/card/) and the project form (/project/).
// In development, /work/<slug>/ (a shared project link) serves the portfolio page; the build
// writes a real page for each project (scripts/project-pages.mjs).
const projectLinks = {
  name: 'project-links',
  configureServer(server) {
    server.middlewares.use((req, _res, next) => {
      if (/^\/work\/[^/.]+\/?(\?.*)?$/.test(req.url)) req.url = '/index.html';
      next();
    });
  },
};

export default defineConfig({
  plugins: [projectLinks],
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        card: 'card/index.html',
        project: 'project/index.html',
        notFound: '404.html',
      },
    },
  },
});
