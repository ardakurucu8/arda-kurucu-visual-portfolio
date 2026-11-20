import {defineConfig} from 'vite';

// Three pages: the portfolio (index.html), the digital card (/card/) and the project form (/project/).
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        card: 'card/index.html',
        project: 'project/index.html',
      },
    },
  },
});
