import test from 'ava';
import {Viewport, PageSet, Page} from './responsive-virtual-list.js';

test('basic init', t => {
  const pages = [
    new Page(200),
    new Page(200),
    new Page(200),
    new Page(1000),
  ];
  const viewport = new Viewport(500, pages);
  const pageSet = viewport.pageSet;
  
  // Viewport should observe first 3 pages
  [0, 1, 2].forEach((x) => t.true(pageSet.observed.has(x)));
  t.false(pageSet.observed.has(3));

  t.is(pageSet.estimatedPageHeight(), 200);
  
  // The heightmap should calculate last page as average of first 3: 200.
  t.is(pageSet.heightMap[3], 200);
  t.is(pageSet.totalHeight, 800);
});

test('invalidating estimate when observing page height', t => {
  const pages = [
    new Page(200),
    new Page(200),
    new Page(200),
    new Page(1000),
  ];
  const viewport = new Viewport(500, pages);
  const pageSet = viewport.pageSet;

  // Observe the last page
  pages[3].load();
  t.is(pageSet.estimatedPageHeight(), 400);
  t.is(pageSet.heightMap[3], 1000);
  t.is(pageSet.totalHeight, 1600);
});

test.skip('load from anchor', t => {
  const pages = [
    new Page(200),
    new Page(200),
    new Page(200),
    new Page(1000),
  ];
  const viewport = new Viewport(500, pages, 3);
  const pageSet = viewport.pageSet;
});

test('page position', t => {
  const pages = [
    new Page(200),
    new Page(200),
    new Page(200),
    new Page(1000),
  ];
  const viewport = new Viewport(500, pages, 3);
  const pageSet = viewport.pageSet;

  [0, 200, 400, 600].forEach((x, i) => t.is(pageSet.positionOf(i), x));
});

test('jump page position', t => {
  const pages = [
    new Page(200),
    new Page(200),
    new Page(200),
    new Page(1000),
  ];
  const viewport = new Viewport(500, pages);
  const pageSet = viewport.pageSet;

  viewport.jumpIndex(3);
  t.is(viewport.scrollTop, pageSet.positionOf(3));
});