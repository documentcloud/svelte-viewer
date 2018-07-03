const SCROLL_OUT_OF_BOUNDS = 'The scroll position is out of bounds';

/**
 * A class to route callbacks back to DOM.
 */
export class CallbackCenter {
  constructor(visibleCallback, scrollCallback, heightCallback, heightMapCallback) {
    this.visibleCallback = visibleCallback;
    this.scrollCallback = scrollCallback;
    this.heightCallback = heightCallback;
    this.heightMapCallback = heightMapCallback;
  }
}

export class Viewport {
  constructor(height, pages, initialPage = 0, scrollTop = 0, callbackCenter = null) {
    this.height = height;
    this.scrollTop = scrollTop;
    /** @type {!CallbackCenter} */
    this.callbackCenter = callbackCenter;
    /** @type {!PageSet} */
    this.pageSet = new PageSet(this, pages, initialPage);
  }

  init() {
    this.pageSet.init();
  }

  updateHeight(height) {
    this.height = height;
    this.updatePageSet();
  }

  updatePageSet() {
    if (this.callbackCenter != null) this.callbackCenter.visibleCallback();
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
    if (update) {
      this.updatePageSet();
    } else if (this.callbackCenter != null) {
      // If not updating, then the DOM needs to be updated to reflect changes.
      this.callbackCenter.scrollCallback(position);
    }
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
    this.initialPage = initialPage;
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

  visibleIndices() {
    const [top, bottom] = [this.viewport.top(), this.viewport.bottom()];
    return [this.pageAtPosition(top).index, this.pageAtPosition(bottom, true).index];
  }

  visible() {
    const [topPage, bottomPage] = this.visibleIndices();
    return this.range(topPage, bottomPage);
  }

  update() {
    const visiblePages = this.visible();
    visiblePages.forEach((page) => page.updateHeight());
  }

  range(index1, index2) {
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

  setHeightmap(index, amount, estimated = false) {
    this.heightMap[index] = amount;
    if (estimated && this.viewport.callbackCenter != null) this.viewport.callbackCenter.heightMapCallback(index, amount);
  }

  updateEstimatedHeights() {
    const estimate = this.estimatedPageHeight();
    let total = 0;
    for (let i = 0; i < this.pages.length; i++) {
      if (!this.observed.has(i)) {
        // Update the heightmap for unobserved pages with the estimate.
        this.setHeightmap(i, estimate, true);
        total += estimate;
      } else {
        total += this.pages[i].height;
      }
    }
    this.updateTotalHeight(total);
  }

  updateTotalHeight(height, delta=false) {
    this.totalHeight = delta ? this.totalHeight + height : height;
    if (this.viewport.callbackCenter != null) this.viewport.callbackCenter.heightCallback(height);
  }

  init(initialPage = null) {
    if (initialPage == null) initialPage = this.initialPage;
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
      this.setHeightmap(i, page.height, true);
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
    // Scroll the viewport appropriately, updating the page.
    this.viewport.scrollToPosition(this.positionOfPageTop(initialPage));
  }

  /**
   * Update the scroll position as a new page is being loaded. This should only
   * cause an effect if the page is before the scroll position.
   * @param {!Page} page The page that is being loaded that the scroll should be
   *     recalculated on.
   */
  updateScroll(page) {
    const vtop = this.viewport.top();
    const vbottom = this.viewport.maxScrollPosition() - this.viewport.bottom();
    const topPage = this.pageAtPosition(vtop);
    if (page.index <= topPage.index && vtop != 0 && vbottom != 0) {
      // Only if the page being loaded is before the first one displayed in the
      // viewport does the scroll need to be shifted.
      const delta = page.height - this.heightMap[page.index];
      this.viewport.scrollDelta(delta, false);
      if (delta != 0) console.log('scroll delta', delta);
    }
  }

  pageUpdated(page, delta = null) {
    if (delta != null) this.updateTotalHeight(delta, true);
    this.updateScroll(page);
    this.setHeightmap(page.index, page.height);
    this.observed.add(page.index);
    this.updateEstimatedHeights();
  }
}

export class Page {
  constructor(height, optData = null) {
    this.height = height;
    this.index = null;
    this.data = optData;
    /** @type {?PageSet} */
    this.pageSet = null;
  }

  load() {
    this.pageSet.pageUpdated(this);
  }

  updateHeight(height = null) {
    if (height != null) {
      console.log('update height', `page ${this.index}`, height, {
        visible: this.pageSet.visible().slice(),
        viewportTop: this.pageSet.viewport.scrollTop,
        heightmap: this.pageSet.heightMap.slice(),
      });
    }
    let delta = null;
    if (height != null) {
      delta = height - this.height;
      this.height = height;
    }
    this.pageSet.pageUpdated(this, delta);
  }
}
