import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const css = await readFile(new URL('../assets/style.css', import.meta.url), 'utf8');
const normalized = html.replace(/\s+/g, ' ');

test('the profile introduces Brandon before navigation and the About-first main content', () => {
  const masthead = html.match(/<header\b[^>]*id="top"[^>]*>([\s\S]*?)<\/header>/)?.[1];
  assert.ok(masthead, 'the opening header must be the profile masthead');
  assert.match(masthead, /<h1\b[^>]*>Brandon De La Rosa<\/h1>/);
  assert.match(masthead, /src="assets\/faces-of-nps-brandon-delarosa\.webp"/);
  assert.match(masthead, /U\.S\. Army officer/);
  assert.match(masthead, /operations research graduate student/i);
  assert.match(masthead, /Naval Postgraduate School/);
  assert.match(masthead, /href="https:\/\/github\.com\/14Spartan117"/);
  assert.match(masthead, /href="mailto:18airbornecorps@gmail\.com"/);
  const sectionIds = [...html.matchAll(/<section\b[^>]*id="(about|work|contact)"/g)].map((match) => match[1]);
  assert.deepEqual(sectionIds, ['about', 'work', 'contact']);
  assert.ok(html.indexOf('</header>') < html.indexOf('id="primary-nav"'));
  assert.match(html, /class="skip-link" href="#main-content"/);
});

test('primary navigation follows the reading order and keeps working anchor targets', () => {
  const navigation = html.match(/<nav\b[^>]*id="primary-nav"[^>]*>([\s\S]*?)<\/nav>/)?.[1];
  assert.ok(navigation);
  const links = [...navigation.matchAll(/<a href="#([^"]+)">([^<]+)<\/a>/g)];
  assert.deepEqual(links.map((match) => [match[1], match[2]]), [
    ['about', 'About'], ['work', 'Selected work'], ['contact', 'Contact'],
  ]);
  for (const [, target] of links) assert.ok(html.includes(`id="${target}"`));
});

test('the introduction defaults to light while honoring saved preferences and unavailable storage', () => {
  const defaultTheme = html.match(/<html\b[^>]*data-theme="([^"]+)"/)?.[1];
  const bootScript = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
  assert.ok(bootScript);
  for (const [savedTheme, expected] of [[null, 'light'], ['light', 'light'], ['dark', 'dark'], ['invalid', 'light']]) {
    const root = { dataset: { theme: defaultTheme }, classList: { add() {} } };
    vm.runInNewContext(bootScript, {
      document: { documentElement: root },
      localStorage: { getItem: () => savedTheme },
    });
    assert.equal(root.dataset.theme, expected);
  }
  const root = { dataset: { theme: defaultTheme }, classList: { add() {} } };
  vm.runInNewContext(bootScript, {
    document: { documentElement: root },
    localStorage: { getItem() { throw new Error('Storage unavailable'); } },
  });
  assert.equal(root.dataset.theme, 'light');
});

test('the authentic biography and full project sequence remain available', () => {
  assert.match(normalized, /my wife and I have a son named Andre/);
  assert.match(normalized, /United States Merchant Marine Academy with a B\.S\. in Marine Engineering Systems/);
  assert.match(normalized, /Operation Spartan Shield and Operation Inherent Resolve/);
  assert.match(html, /src="assets\/couple-avatar\.jpg"/);
  const projects = [...html.matchAll(/<article\b[^>]*aria-labelledby="([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(projects, [
    'starfall-title', 'jrtc-title', 'drone-delivery-title', 'global-logistics-title',
    'montford-title', 'retirement-title',
  ]);
  assert.ok(html.indexOf('Jensen Huang and me') < html.indexOf('id="faces-profile-title"'));
  assert.ok(html.indexOf('id="faces-profile-title"') < html.indexOf('id="montford-title"'));
  for (const link of [
    'https://blogs.nvidia.com/blog/naval-postgraduate-school-dgx-ai-supercomputer/',
    'https://www.npsfoundation.org/faces-of-nps/maj-brandon-delarosa',
    'https://vantage.army.mil/shares/links/ydxgip2dm4wja',
  ]) assert.ok(html.includes(`href="${link}"`));
});

test('the GLDS project owns its globe capture and the interactive media still loads on demand', () => {
  const glds = html.match(/<article\b[^>]*aria-labelledby="global-logistics-title"[^>]*>([\s\S]*?)<\/article>/)?.[1];
  assert.match(glds, /src="assets\/glds-visionpro-global-globe\.jpg"/);
  assert.match(glds, /src="assets\/drone-simulator\.jpg"/);
  assert.match(glds, /src="assets\/glds-converge-nps-event\.jpg"/);
  const video = html.match(/<video\b[\s\S]*?<\/video>/)?.[0];
  assert.ok(video);
  assert.match(video, /preload="none"/);
  assert.match(video, /data-src="assets\/montford-point\/montford-point-full-cycle-1080p\.mp4"/);
  assert.doesNotMatch(video, /\ssrc="/);
  assert.match(html, /data-montford-model-load/);
  assert.match(html, /data-montford-animation-load/);
  assert.match(html, /data-montford-fallback hidden/);
  assert.match(html, /id="avp-gallery"/);
  assert.match(html, /data-gallery-open/);
});

test('reverse project layouts cannot reorder media nested inside the GLDS showcase', () => {
  assert.doesNotMatch(css, /\.project--reverse\s+\.(?:project-media|project-showcase)\b/,
    'reverse ordering must target direct article children, including responsive resets');
  assert.match(css, /\.project--reverse\s*>\s*\.project-media\s*\{\s*order:\s*-1;/);
  assert.match(css, /\.project--reverse\s*>\s*\.project-showcase\s*\{\s*order:\s*-1;/);
});
