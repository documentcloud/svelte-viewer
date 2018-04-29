export class Viewport {
  constructor(height, pages, initialPage = 0, scrollTop = 0) {
    this.height = height;
    this.scrollTop = scrollTop;
    this.pageSet = new PageSet(this, pages);
  }
}

export class PageSet {
  constructor(viewport, pages) {
    this.pages = pages;
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