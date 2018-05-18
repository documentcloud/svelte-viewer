const SCROLL_OUT_OF_BOUNDS = 'The scroll position is out of bounds';

export class Viewport {
  constructor(height, pages, initialPage = 0, scrollTop = 0) {
    this.height = height;
    this.scrollTop = scrollTop;
    /** @type {!PageSet} */
    this.pageSet = new PageSet(this, pages, initialPage);
  }

  updateHeight(height) {
    this.height = height;
    this.pageSet.update();
  }

  /**
   * Scroll to the top of the specified page, or the bottom of the entire page
   * set if needed.
   * @param {number} pageIndex
   * @param {boolean} update Whether to update the page set after scrolling.
   */
  scrollToTopOfPage(pageIndex, update = true) {
    this.scrollToPosition(Math.min(
        this.pageSet.positionOfPageTop(pageIndex),
        this.maxScrollPosition()), update);
  }

  /**
   * Scroll to the bottom of the specified page, or the bottom of the entire
   * page set if needed.
   * @param {number} pageIndex
   * @param {boolean} update Whether to update the page set after scrolling.
   */
  scrollToBottomOfPage(pageIndex, update = true) {
    this.scrollToPosition(Math.min(
      this.pageSet.positionOfPageBottom(pageIndex),
      this.maxScrollPosition()), update);
  }

  /**
   * Scroll by the specified offset relative to the current scroll position.
   * @param {number} delta The delta to scroll by.
   * @param {boolean} update Whether to update the page set after scrolling.
   */
  scrollDelta(delta, update = true) {
    this.scrollToPosition(this.scrollTop + delta, update);
  }

  /**
   * Scroll to the specified percentage.
   * @param {number} percentage
   * @param {boolean} update Whether to update the page set after scrolling.
   */
  scrollToPercentage(percentage, update) {
    this.scrollToPosition(percentage * this.maxScrollPosition(), update);
  }

  /**
   * Scroll to the specified position.
   * @param {number} position
   * @param {boolean} update Whether to update the page set after scrolling.
   * @throws {Error} The scroll position is out of bounds.
   */
  scrollToPosition(position, update = true) {
    // Instead of throwing an error, just clamp the scroll so that it is "safe".
    if (position < 0) position = 0;
    const maxScrollPosition = this.maxScrollPosition();
    if (position > maxScrollPosition) position = maxScrollPosition;

    // if (position < 0 || position > this.maxScrollPosition()) {
    //   throw new Error(SCROLL_OUT_OF_BOUNDS);
    // }
    this.scrollTop = position;
    if (update) this.pageSet.update();
  }

  /**
   * Return the maximum possible position for the scroll bar.
   * @return {number}
   */
  maxScrollPosition() {
    return this.pageSet.totalHeight - this.height;
  }

  /**
   * Return the percentage of the scroll bar, where 0 is at the top and 1.0 is
   * at the bottom.
   * @return {number}
   */
  scrollPercentage() {
    return this.scrollTop / this.maxScrollPosition();
  }

  /**
   * Return the absolute position of the top of the viewport in the page set.
   * @return {number}
   */
  top() {
    return this.scrollTop;
  }

  /**
   * Return the absolute position of the bottom of the viewport in the page set.
   * @return {number}
   */
  bottom() {
    return this.scrollTop + this.height;
  }
}

export class PageSet {
  /**
   * @param {!Viewport} viewport
   * @param {!Array<Page>} pages
   * @param {number} initialPage The initial page visible.
   */
  constructor(viewport, pages, initialPage) {
    /** @type {!Array<Page>} */
    this.pages = pages;
    /** @type {!Viewport} */
    this.viewport = viewport;
    this.heightMap = [];
    this.totalHeight = 0;
    this.observed = new Set(); // which pages have been observed
    this.init(initialPage);
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
    return this.range(this.pageAtPosition(top), this.pageAtPosition(bottom, true));
  }

  update() {
    const visiblePages = this.visible();
    visiblePages.forEach((page) => page.updateHeight());
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

  positionOfPageTop(index) {
    let accumulatedHeight = 0;
    for (let i = 0; i < index; i++) {
      accumulatedHeight += this.heightMap[i];
    }
    return accumulatedHeight;
  }

  positionOfPageBottom(index) {
    let accumulatedHeight = 0;
    for (let i = 0; i <= index; i++) {
      accumulatedHeight += this.heightMap[i];
    }
    return accumulatedHeight;
  }

  /**
   * @param {number} position
   * @param {boolean} backwards Whether to search from a bottom position.
   * @return {!Page}
   */
  pageAtPosition(position, backwards = false) {
    let offset = 0;
    for (let i = 0; i < this.pages.length; i++) {
      let pageBottom = offset + this.heightMap[i];
      if (!backwards) {
        if (position >= offset && position < pageBottom) {
          return this.pages[i];
        }
      } else {
        if (position > offset && position <= pageBottom) {
          return this.pages[i];
        }
      }

      offset = pageBottom;
    }
    throw new Error('Position outside of doc');
  }

  updateEstimatedHeights() {
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

  init(initialPage = 0) {
    let offset = 0;
    let i;

    // Initialize pages before initial page
    for (i = 0; i < initialPage; i++) {
      const page = this.pages[i];
      page.index = i;
      page.pageSet = this;
    }

    // Initialize initial heightmap until viewport is full.
    for (i = initialPage; i < this.pages.length && offset <= this.viewport.height; i++) {
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

    this.updateEstimatedHeights();
  }

  /**
   * Update the scroll position as a new page is being loaded. This should only
   * cause an effect if the page is before the scroll position.
   * @param {!Page} page The page that is being loaded that the scroll should be
   *     recalculated on.
   */
  updateScroll(page) {
    const topPage = this.pageAtPosition(this.viewport.top());
    if (page.index < topPage.index) {
      // Only if the page being loaded is before the first one displayed in the
      // viewport does the scroll need to be shifted.
      const delta = page.height - this.heightMap[page.index];
      this.viewport.scrollDelta(delta, false);
    }
  }

  pageUpdated(page) {
    this.updateScroll(page);
    this.heightMap[page.index] = page.height;
    this.observed.add(page.index);
    this.updateEstimatedHeights();
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

  updateHeight(height = null) {
    if (height != null) this.height = height;
    this.pageSet.pageUpdated(this);
  }
}
