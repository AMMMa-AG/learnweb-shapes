/*
 * $Id: fullscreenview.js 46591 2018-10-08 15:12:11Z robertj $
 */

import screenfull from 'screenfull';

const isiOS = /iPad;|iPhone;|iPod;/.test(navigator.userAgent);

/**
 * Represents the base class of full screen providers.
 */
class FullScreenBase {
  constructor(element, handler = function (value) { }) {
    this.element = element;
    this.$elem = $(element);
    this.handler = handler;
    this.isFullScreen = false;
  }

  onChanged(fullScreen) {
    this.isFullScreen = fullScreen;
    if (this.element) {
      if (fullScreen) {
        this.$elem.addClass('lw-fullscreen');
      } else {
        this.$elem.removeClass('lw-fullscreen');
      }
    }
    this.handler(fullScreen);
  }

  toggle() {
  }

  request() {
  }
}

/**
 * Full screen for WebKit's video element.
 */
class WebkitVideoFullScreen extends FullScreenBase {
  static supported(element) {
    return element && !!element.webkitEnterFullScreen;
  }

  constructor(element, handler) {
    super(element, handler);

    let enterHandler = () => {
      this.$elem.off('webkitenterfullscreen', enterHandler);
      this.onChanged(true);
    };

    let leaveHandler = () => {
      this.$elem.off('webkitendfullscreen', leaveHandler);
      this.onChanged(false);
    };

    this.$elem.on('webkitenterfullscreen', enterHandler);
    this.$elem.on('webkitendfullscreen', leaveHandler);
  }

  toggle() {
    if (this.element.webkitDisplayingFullscreen)
      this.element.webkitExitFullscreen();
    else
      this.element.webkitEnterFullScreen();
  }

  request() {
    this.element.webkitEnterFullScreen();
  }
}

/**
 * W3C Full Screen API (based on the 'screenfull' module).
 */
class W3cFullScreen extends FullScreenBase {
  static supported() {
    // FIXME: iOS 12 Fullscreen APIs are too buggy
    return !isiOS && !!screenfull.enabled;
  }

  constructor(element, handler) {
    super(element, handler);

    let changeHandler = () => {
      if (!screenfull.isFullscreen) {
        screenfull.off('change', changeHandler);
      }
      this.onChanged(screenfull.isFullscreen);
    };

    screenfull.on('change', changeHandler);
  }

  toggle() {
    screenfull.toggle(this.element);
  }

  request() {
    screenfull.request(this.element);
  }
}

/**
 *
 */
export default class FullScreenView {
  /**
   * Whether we have full (container) support for full screen.
   */
  static containerSupported() {
    return W3cFullScreen.supported();
  }

  /**
   * Whether we support video elements only.
   * @param {*} element
   */
  static videoSupported(element) {
    return !W3cFullScreen.supported() && WebkitVideoFullScreen.supported(element);
  }

  /**
   * Whether we support any kind of full screening for the specified element.
   * @param {*} element
   */
  static supported(element) {
    return W3cFullScreen.supported() || WebkitVideoFullScreen.supported(element);
  }

  /**
   * Creates a full screen view for the specified video or container.
   *
   * @param {HTMLVideoElement} video
   * @param {HTMLElement} container
   * @param {function(boolean)} handler
   */
  static forVideo(video, container, handler) {
    if (this.videoSupported(video)) {
      return new WebkitVideoFullScreen(video, handler);
    }
    return new W3cFullScreen(container || video, handler);
  }

  /**
   * Creates a full screen view for the specified video or container.
   * Wraps the container.
   *
   * @param {HTMLVideoElement} video
   * @param {HTMLElement} container
   * @param {function(boolean)} handler
   * @param {object} [options = {}]
   */
  static forVideoWrapper(video, container, handler, options = {}) {
    if (this.videoSupported(video)) {
      return new WebkitVideoFullScreen(video, handler);
    }
    return this.forWrapper(container, handler, options);
  }

  /**
   * Creates a full screen view for the specified container.
   *
   * @param {HTMLElement} container
   * @param {function(boolean)} handler
   */
  static forContainer(container, handler) {
    return new W3cFullScreen(container, handler);
  }

  /**
   * Creates a "wrapped" full screen view for the specified container.
   *
   * @param {HTMLElement} container
   * @param {function(boolean)} handler
   * @param {object} [options = {}]
   */
  static forWrapper(container, handler, options = {}) {
    let wrapperParent = $('body');
    if (options.wrapperParent)
      wrapperParent = $(options.wrapperParent);

    let elem = $(container);
    let wrapper = $('<div>').addClass('lw-fullscreen-wrapper');
    if (options.wrapperClass)
      wrapper.addClass(options.wrapperClass);
    wrapperParent.append(wrapper);

    let placeholder = $('<span>').addClass('lw-fullscreen-placeholder');
    placeholder.insertBefore(elem);
    wrapper.append(elem);

    return new W3cFullScreen(wrapper[0], fullscreen => {
      if (!fullscreen) {
        elem.insertBefore(placeholder);
        placeholder.remove();
        wrapper.remove();
        $(window).resize();
      }
      if (handler) handler(fullscreen);
    });
  }
}
