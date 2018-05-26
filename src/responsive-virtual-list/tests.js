import {Page, PageSet, Viewport} from './responsive-virtual-list.js';

import test from 'ava';

test('basic init', t => {
  const pages = [
    new Page(200),
    new Page(200),
    new Page(200),
    new Page(1000),
  ];
  const viewport = new Viewport(500, pages);
  const pageSet = viewport.pageSet;
  viewport.init();

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
  viewport.init();

  // Observe the last page
  pages[3].load();
  t.is(pageSet.estimatedPageHeight(), 400);
  t.is(pageSet.heightMap[3], 1000);
  t.is(pageSet.totalHeight, 1600);
});

test('page position', t => {
  const pages = [
    new Page(200),
    new Page(200),
    new Page(200),
    new Page(1000),
  ];
  const viewport = new Viewport(500, pages);
  const pageSet = viewport.pageSet;
  viewport.init();

  [0, 200, 400, 600].forEach((x, i) => t.is(pageSet.positionOfPageTop(i), x));
});

test('page position starting near end', t => {
  const pages = [
    new Page(200),
    new Page(200),
    new Page(200),
    new Page(1000),
  ];
  const viewport = new Viewport(500, pages, 3);
  const pageSet = viewport.pageSet;
  viewport.init();
  [0, 1000, 2000, 3000].forEach((x, i) => t.is(pageSet.positionOfPageTop(i), x));
});

test('visible pages, only one in view', t => {
  const pages = [
    new Page(700),
    new Page(200),
    new Page(200),
    new Page(1000),
  ];
  const viewport = new Viewport(500, pages);
  const pageSet = viewport.pageSet;
  viewport.init();

  t.deepEqual(pageSet.visibleIndices(), [0, 0]);

  // Still only 1 page visible after 100px scroll.
  viewport.scrollDelta(100);
  t.deepEqual(pageSet.visibleIndices(), [0, 0]);
});

// test('visible', t => {
//   const pages = [
//     new Page(200),
//     new Page(200),
//     new Page(200),
//     new Page(1000),
//   ];
//   const viewport = new Viewport(500, pages);
//   const pageSet = viewport.pageSet;

//   t.deepEqual(pageSet.visible(), pages.slice(0, 3));

//   viewport.scrollToPosition(50);
//   t.deepEqual(pageSet.visible(), pages.slice(0, 3));

//   viewport.scrollToPosition(199);
//   t.deepEqual(pageSet.visible(), pages.slice(0, 4));

//   viewport.scrollToPosition(200);
//   t.deepEqual(pageSet.visible(), pages.slice(1, 4));

//   viewport.scrollToPosition(299);
//   t.deepEqual(pageSet.visible(), pages.slice(1, 4));
// });

test('page scroll', t => {
  const pages = [
    new Page(200),
    new Page(200),
    new Page(200),
    new Page(1000),
  ];
  const viewport = new Viewport(500, pages);
  const pageSet = viewport.pageSet;
  viewport.init();

  t.is(pageSet.heightMap[3], 200);

  // Did not scroll enough
  viewport.scrollDelta(100);
  t.is(pageSet.heightMap[3], 200);

  // Now scrolled enough.
  viewport.scrollDelta(100);
  t.is(pageSet.heightMap[3], 1000);
});

test('page jump', t => {
  const pages = [
    new Page(200),
    new Page(200),
    new Page(200),
    new Page(1000),
  ];
  const viewport = new Viewport(500, pages);
  const pageSet = viewport.pageSet;
  viewport.init();
  viewport.scrollDelta(200);
  // Now all heightmaps should be updated and scroll should be at start of
  // second page.
  t.deepEqual(pageSet.heightMap, [200, 200, 200, 1000]);
  t.is(viewport.top(), 200);
  t.deepEqual(pageSet.visible(), pages.slice(1));

  // Now, update the height of the first page.
  pages[0].updateHeight(500);

  // Now everything should be shifted down.
  t.deepEqual(pageSet.heightMap, [500, 200, 200, 1000]);
  t.is(viewport.top(), 500);
  t.deepEqual(pageSet.visible(), pages.slice(1));
});

// test('jump page position', t => {
//   const pages = [
//     new Page(200),
//     new Page(200),
//     new Page(200),
//     new Page(1000),
//   ];
//   const viewport = new Viewport(500, pages);
//   const pageSet = viewport.pageSet;

//   viewport.scrollToTopOfPage(3);
//   t.is(viewport.scrollTop, pageSet.positionOfPageTop(3));
// });

// test('page at position', t => {
//   const pages = [
//     new Page(200),
//     new Page(200),
//     new Page(200),
//     new Page(200),
//   ];
//   const viewport = new Viewport(500, pages);
//   const pageSet = viewport.pageSet;

//   const testCases = [
//     {
//       position: 0,
//       index: 0,
//     },
//     {
//       position: 100.5,
//       index: 0,
//     },
//     {
//       position: 199,
//       index: 0,
//     },
//     {
//       position: 200,
//       index: 1,
//     },
//     {
//       position: 599,
//       index: 2,
//     },
//     {
//       position: 600,
//       index: 3,
//     },
//     // TODO: handle out of bounds by pushing in bounds
//     // {
//     //   position: 1600,
//     //   index: 3,
//     // },
//   ];
//   testCases.forEach(({position, index}) => t.is(pageSet.pageAtPosition(position).index, index));

//   const errorCases = [-5, -0.01, 1600.1, 3492309];
//   errorCases.forEach((position) => t.throws(() => pageSet.pageAtPosition(position)));
// });

// test('visible', t => {
//   const pages = [
//     new Page(200),
//     new Page(200),
//     new Page(200),
//     new Page(1000),
//   ];
//   const viewport = new Viewport(500, pages);
//   const pageSet = viewport.pageSet;

//   t.deepEqual(pageSet.visible(), pages.slice(0, 3));

//   viewport.scrollToPosition(50);
//   t.deepEqual(pageSet.visible(), pages.slice(0, 3));

//   viewport.scrollToPosition(199);
//   t.deepEqual(pageSet.visible(), pages.slice(0, 4));

//   viewport.scrollToPosition(200);
//   t.deepEqual(pageSet.visible(), pages.slice(1, 4));

//   viewport.scrollToPosition(299);
//   t.deepEqual(pageSet.visible(), pages.slice(1, 4));
// });

// // test('not jumpy going from bottom up', t => {
// //   const pages = [
// //     new Page(200),
// //     new Page(300),
// //     new Page(400),
// //     new Page(500),
// //   ];
// //   const viewport = new Viewport(500, pages);
// //   const pageSet = viewport.pageSet;

// //   t.is(pages[3].height, 250); // the page should be the average height of the observed
// //   t.is(pageSet.totalHeight, 1000); // expect the page to be 4 x 250 tall.

// //   viewport.scrollToPercent(1); // scroll to the bottom of the page
// //   t.is(pages[3].height, 500); // the page should now be 500 tall.
// //   t.is(viewport.scrollPercent(), 1); // the scroll bar is still at the bottom

// //   pages[4].updateHeight(1000); // update the page to be taller.
// //   t.is(viewport.scrollPercent(), 1); // the scroll bar stays at the bottom.
// //   t.is(pageSet.totalHeight, 1500);
// // });
