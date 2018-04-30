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

test('page at position', t => {
  const pages = [
    new Page(200),
    new Page(200),
    new Page(200),
    new Page(1000),
  ];
  const viewport = new Viewport(500, pages);
  const pageSet = viewport.pageSet;

  const testCases = [
    {
      position: 0,
      index: 0,
    },
    {
      position: 100.5,
      index: 0,
    },
    {
      position: 199,
      index: 0,
    },
    {
      position: 200,
      index: 1,
    },
    {
      position: 599,
      index: 2,
    },
    {
      position: 600,
      index: 3,
    },
    // TODO: handle out of bounds by pushing in bounds
    // {
    //   position: 1600,
    //   index: 3,
    // },
  ];
  testCases.forEach(({position, index}) => t.is(pageSet.pageAtPosition(position).index, index));

  const errorCases = [-5, -0.01, 1600.1, 3492309];
  errorCases.forEach((position) => t.throws(() => pageSet.pageAtPosition(position)));
});

test('visible', t => {
  const pages = [
    new Page(200),
    new Page(200),
    new Page(200),
    new Page(1000),
  ];
  const viewport = new Viewport(500, pages);
  const pageSet = viewport.pageSet;

  t.deepEqual(pageSet.visible(), pages.slice(0, 3));

  viewport.scrollTop = 50;
  t.deepEqual(pageSet.visible(), pages.slice(0, 3));
  
  viewport.scrollTop = 199;
  t.deepEqual(pageSet.visible(), pages.slice(0, 4));
  
  viewport.scrollTop = 200;
  t.deepEqual(pageSet.visible(), pages.slice(1, 4));
  
  viewport.scrollTop = 299;
  t.deepEqual(pageSet.visible(), pages.slice(1, 4));
});