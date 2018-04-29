export class Viewport {
  constructor(height, pages, scrollTop = 0) {
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
    debugger;
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

    // Initialize initial heightmap until viewport is full.
    for (let i = 0; i < this.pages.length && offset <= this.viewport.height; i++) {
      const page = this.pages[i];

      // Set page properties to keep track of index and percolate events.
      page.index = i;
      page.pageSet = this;

      this.heightMap[i] = page.height;
      offset += page.height;
      this.observed.add(i); // add page to observed
    }

    this.updateHeights();
  }

  pageUpdated(page) {}
}

export class Page {
  constructor(height) {
    this.height = height;
    this.index = null;
    this.pageSet = null;
  }

  updateHeight(height) {
    this.height = height;
    this.pageSet.updatePageHeight(page);
  }
}