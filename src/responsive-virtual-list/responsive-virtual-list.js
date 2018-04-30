export class Viewport {
  constructor(height, pages, initialPage = 0, scrollTop = 0) {
    this.height = height;
    this.scrollTop = scrollTop;
    /** @type {!PageSet} */
    this.pageSet = new PageSet(this, pages);
  }

  jump(pageNum) {
    return this.jumpIndex(pageNum - 1);
  }

  jumpIndex(pageIndex) {
    this.scrollTo(this.pageSet.positionOf(pageIndex));
  }

  scrollTo(position) {
    this.scrollTop = position;
  }

  top() {
    return this.scrollTop;
  }

  bottom() {
    return this.scrollTop + this.height;
  }

  load() {

  }
}

export class PageSet {
  /**
   * @param {!Viewport} viewport 
   * @param {!Array<Page>} pages 
   */
  constructor(viewport, pages) {
    /** @type {!Array<Page>} */
    this.pages = pages;
    /** @type {!Viewport} */
    this.viewport = viewport;
    this.heightMap = [];
    this.totalHeight = 0;
    this.observed = new Set(); // which pages have been observed
    this.init();
  }

  estimatedPageHeight() {
    let total = 0;
    let count = 0;
    for (let i = 0; i < this.pages.length; i++) {
      if (this.observed.has(i)) {
        total += this.pages[i].height;
        count++;
      }
    }

    if (count == 0) {
      return 0;
    } else {
      return total / count;
    }
  }

  visible() {
    const [top, bottom] = [this.viewport.top(), this.viewport.bottom()];
    console.log([top, bottom]);
    return this.range(this.pageAtPosition(top), this.pageAtPosition(bottom));
  }

  range(page1, page2) {
    const [index1, index2] = [page1.index, page2.index];
    if (index1 > index2) throw new Error('Reverse list. This should not happen');
    const pages = [];
    for (let i = index1; i <= index2; i++) {
      pages.push(this.pages[i]);
    }
    return pages;
  }

  positionOf(index) {
    let accumulatedHeight = 0;
    for (let i = 0; i < index; i++) {
      accumulatedHeight += this.heightMap[i];
    }
    return accumulatedHeight;
  }

  /**
   * @param {number} position 
   * @return {!Page}
   */
  pageAtPosition(position) {
    let offset = 0;
    for (let i = 0; i < this.pages.length; i++) {
      let pageBottom = offset + this.heightMap[i];
      if (position >= offset && position < pageBottom) return this.pages[i];
      offset = pageBottom;
    }
    throw new Error('Position outside of doc');
  }

  updateHeights() {
    const estimate = this.estimatedPageHeight();
    let total = 0;
    for (let i = 0; i < this.pages.length; i++) {
      if (!this.observed.has(i)) {
        // Update the heightmap for unobserved pages with the estimate.
        this.heightMap[i] = estimate;
        total += estimate;
      } else {
        total += this.pages[i].height;
      }
    }
    this.totalHeight = total;
  }

  init() {
    let offset = 0;
    let i;

    // Initialize initial heightmap until viewport is full.
    for (i = 0; i < this.pages.length && offset <= this.viewport.height; i++) {
      const page = this.pages[i];

      // Set page properties to keep track of index and percolate events.
      page.index = i;
      page.pageSet = this;

      this.heightMap[i] = page.height;
      offset += page.height;
      this.observed.add(i); // add page to observed
    }

    // Finish initializing pages
    for (; i < this.pages.length; i++) {
      const page = this.pages[i];
      page.index = i;
      page.pageSet = this;
    }

    this.updateHeights();
  }

  pageUpdated(page) {
    this.heightMap[page.index] = page.height;
    this.observed.add(page.index);
    this.updateHeights();
  }
}

export class Page {
  constructor(height) {
    this.height = height;
    this.index = null;
    /** @type {?PageSet} */
    this.pageSet = null;
  }

  load() {
    this.pageSet.pageUpdated(this);
  }

  updateHeight(height) {
    this.height = height;
    this.pageSet.pageUpdated(this);
  }
}