import test from 'ava';
import {Viewport, PageSet, Page} from './responsive-virtual-list.js';

test('basic init', t => {
  const pages = [
    new Page(200),
    new Page(200),
    new Page(200),
    new Page(500),
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