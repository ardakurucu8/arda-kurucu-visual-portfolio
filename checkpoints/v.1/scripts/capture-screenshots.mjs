import {chromium} from 'playwright-core';
import {mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';

const baseURL = process.argv[2] || process.env.PORTFOLIO_PREVIEW_URL || 'http://localhost:4173/';
const executablePath = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const output = resolve('output');
const viewports = [
  {name: 'desktop-1440x900', width: 1440, height: 900},
  {name: 'tablet-768x1024', width: 768, height: 1024},
  {name: 'mobile-390x844', width: 390, height: 844},
];

await mkdir(output, {recursive: true});
const browser = await chromium.launch({headless: true, executablePath});

try {
  {
    const context = await browser.newContext({viewport: {width: 1440, height: 900}, deviceScaleFactor: 1});
    const page = await context.newPage();
    const errors = [];
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(baseURL, {waitUntil: 'networkidle'});
    await page.locator('.site-loader').waitFor({state: 'hidden', timeout: 5000}).catch(() => {});
    await page.evaluate(() => {
      const journey = document.querySelector('.journey');
      const y = journey.offsetTop + (journey.offsetHeight - innerHeight) * 0.25;
      scrollTo({top: y});
    });
    await page.waitForTimeout(1400);
    await page.mouse.move(930, 470);
    await page.waitForTimeout(500);
    const measuredFps = await page.evaluate(() => new Promise((resolve) => {
      const samples = [];
      let previous = performance.now();
      const sample = (time) => {
        samples.push(time - previous);
        previous = time;
        if (samples.length < 90) requestAnimationFrame(sample);
        else {
          const stable = samples.slice(5);
          const average = stable.reduce((sum, value) => sum + value, 0) / stable.length;
          resolve(Math.round(1000 / average));
        }
      };
      requestAnimationFrame(sample);
    }));
    const journeyState = await page.evaluate(() => ({
      canvas: Boolean(document.querySelector('.journey canvas')),
      activeCards: [...document.querySelectorAll('.journey-card')].filter((card) => card.getAttribute('aria-hidden') === 'false').length,
      visibleCards: [...document.querySelectorAll('.journey-card')].filter((card) => getComputedStyle(card).visibility !== 'hidden' && Number(getComputedStyle(card).opacity) > 0.01).length,
      projectCount: document.querySelectorAll('.journey-card').length,
      removedProjectsAbsent: !document.body.textContent.includes('Dark Place') && !document.body.textContent.includes('Polo Binicilik'),
      quality: document.querySelector('.journey-quality')?.textContent,
      overflow: document.documentElement.scrollWidth > innerWidth,
    }));
    if (!journeyState.canvas || journeyState.activeCards !== 1 || journeyState.visibleCards > 3 || journeyState.projectCount !== 7 || !journeyState.removedProjectsAbsent || journeyState.overflow) {
      throw new Error(`journey validation failed: ${JSON.stringify(journeyState)}`);
    }
    await page.screenshot({path: resolve(output, 'portfolio-journey-1440x900.png')});
    await page.locator('.journey-caption button').click();
    await page.locator('.project-dialog').waitFor({state: 'visible'});
    await page.keyboard.press('Escape');
    await page.getByRole('button', {name: 'Photography', exact: true}).click();
    if (await page.locator('.journey-card').count() !== 4) throw new Error('WebGL Photography filter did not return four projects');
    await page.getByRole('button', {name: 'All', exact: true}).click();
    if (errors.length) throw new Error(`browser errors: ${errors.join(' | ')}`);
    console.log(`journey-desktop: canvas=${journeyState.canvas}, active-card=${journeyState.activeCards}, visible=${journeyState.visibleCards}, projects=${journeyState.projectCount}, ${journeyState.quality}, measured=${measuredFps}fps`);
    await context.close();
  }
  for (const viewport of viewports) {
    const context = await browser.newContext({
      viewport: {width: viewport.width, height: viewport.height},
      deviceScaleFactor: 1,
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    await page.goto(baseURL, {waitUntil: 'networkidle'});
    const metrics = await page.evaluate(() => ({
      width: innerWidth,
      height: innerHeight,
      scrollWidth: document.documentElement.scrollWidth,
      reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    }));
    if (metrics.width !== viewport.width || metrics.height !== viewport.height) {
      throw new Error(`${viewport.name}: viewport mismatch ${metrics.width}×${metrics.height}`);
    }
    if (metrics.scrollWidth > metrics.width) {
      throw new Error(`${viewport.name}: horizontal overflow ${metrics.scrollWidth}px > ${metrics.width}px`);
    }
    await page.screenshot({path: resolve(output, `portfolio-${viewport.name}.png`)});
    if (viewport.name === 'desktop-1440x900') {
      await page.locator('.project-card').last().scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      await page.locator('#work').scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await page.screenshot({path: resolve(output, 'portfolio-work-1440x900.png')});
    }
    if (viewport.name === 'desktop-1440x900' || viewport.name === 'mobile-390x844') {
      await page.getByRole('button', {name: 'AI / Generative', exact: true}).click();
      const aiCards = page.locator('.project-card');
      if (await aiCards.count() !== 1) throw new Error(`${viewport.name}: AI filter did not return exactly one project`);
      await aiCards.first().click();
      if (await page.locator('.dialog-gallery img').count() !== 6) throw new Error(`${viewport.name}: AI gallery did not contain six images`);
      const dialogMetrics = await page.evaluate(() => ({width: innerWidth, scrollWidth: document.documentElement.scrollWidth}));
      if (dialogMetrics.scrollWidth > dialogMetrics.width) {
        throw new Error(`${viewport.name}: AI dialog horizontal overflow ${dialogMetrics.scrollWidth}px > ${dialogMetrics.width}px`);
      }
      await page.screenshot({path: resolve(output, `portfolio-ai-${viewport.name}.png`)});
    }
    console.log(`${viewport.name}: ${metrics.width}×${metrics.height}, overflow=none, reduced-motion=${metrics.reducedMotion}`);
    await context.close();
  }
} finally {
  await browser.close();
}
