import { createjs } from 'EaselJS';
import Shape from './shape';
import MovableMixin from './movablemixin';
import debounce from 'lodash/debounce';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

let GlobalZIndex = 100000;

//
// Quill Toolbar Options
//
const toolbarOptions = [
  [
    { 'header': [1, 2, 3, false] },
    'bold',
    'italic',
    { 'list': 'ordered' },
    { 'list': 'bullet' },
    { 'color': [] },
    { 'background': [] },
    'image'
  ]
];

export default class EditBox extends Shape {
  get shapeClassName() {
    return "EditBox";
  }

  get layer() {
    return Shape.ToolLayer;
  }

  get expanderPos() {
    let pos = super.expanderPos;
    pos.x += 12;
    pos.y += 12;
    return pos;
  }

  get deleterPos() {
    let pos = super.deleterPos;
    pos.x -= 12;
    pos.y -= 12;
    return pos;
  }

  constructor(desktop, options) {
    super(desktop);
    this.value = options.text;
    this.x = this.load("x", options.x);
    this.y = this.load("y", options.y);
    this.width = this.load("w", options.width);
    this.height = this.load("h", options.height);
    this.dragColor = options.dragColor;
    this.dragAlpha = options.dragAlpha;
    this.movable = options.movable;
    this.deletable = options.deletable;
    this.resizable = options.resizable;
    this.regPoint = 0;

    let quillElem = this.quillElem = $(`
    <div class="lw-editbox-container">
      <div class="lw-editbox-editor">
      </div>
    </div>
    `);

    $(this.stage.canvas).parent().append(quillElem);

    this.editorElem = $('.lw-editbox-editor', quillElem);

    this.quill = new Quill(this.editorElem[0], {
      modules: {
        toolbar: toolbarOptions
      },
      theme: 'snow'
    });

    $('.ql-editor', quillElem).click(() => this.focus());

    // store a reference to Quill's toolbar element for later
    this.toolbarElem = $('.ql-toolbar', quillElem);

    // initialize editor's content either from storage or from "options.text".
    let delta = this.load("t", undefined);
    if (delta) {
      this.quill.setContents(delta);
    } else {
      this.quill.setText(options.text);
    }

    // persist every 1/2 sec during changes
    this.quill.on('text-change', debounce(() => this.persist(), 500));

    this.init();
  }

  create() {
    const container = this.container;
    container.x = this.x;
    container.y = this.y;
    container.cwidth = this.width;
    container.cheight = this.height;

    MovableMixin.attach(container);
    container.on("beginmove", () => {
      this.desktop.focus(this);
      this.desktop.update();
    });

    container.on("moving", (e) => {
      if (this.movable)
        this.moveBy(e.x, e.y);
    });

    this.redraw();
  }

  redraw() {
    const HandleHeight = 24;
    const HandlePadding = 2;
    const container = this.container;
    container.removeAllChildren();

    let handle = new createjs.Shape();
    handle.graphics
      .setStrokeStyle(1)
      .beginStroke(this.dragColor)
      .beginFill(this.dragColor)
      .drawRect(0, 0, container.cwidth, HandleHeight);
    handle.alpha = this.dragAlpha;

    container.addChild(handle);

    let content = new createjs.DOMElement(this.quillElem[0]);
    content.x = 0;
    content.y = HandleHeight + HandlePadding;
    content.regX = 0;
    content.regY = 0;
    container.addChild(content);

    // compute the height of Quill's toolbar in HTML coordinates
    let toolbarHeight = this.toolbarElem[0].getBoundingClientRect().height /
      (this.desktop.stage.scaleY / this.desktop.pixelRatio);

    this.quillElem.width(container.cwidth);
    this.quillElem.height(container.cheight - content.y - toolbarHeight);

    this.desktop.update();
  }

  resizeBy(evt) {
    const container = this.container;
    container.cwidth += evt.x;
    container.cheight += evt.y;
    if (container.cwidth < 200) container.cwidth = 200;
    if (container.cheight < 200) container.cheight = 200;
    this.redraw();
  }

  moveBy(x, y) {
    const container = this.container;

    // constrain container inside the canvas' bounds
    if (container.x + x < 0) x = 0;
    else if (container.x + container.cwidth + x > this.desktop.width) {
      x = this.desktop.width - container.x - container.cwidth;
    }

    if (container.y + y < 0) y = 0;
    else if (container.y + container.cheight + y > this.desktop.height) {
      y = this.desktop.height - container.y - container.cheight;
    }

    super.moveBy(x, y);
  }

  remove() {
    if (this.quillElem)
      this.quillElem.remove();
    super.remove();
  }

  onFocus() {
    super.onFocus();
    this.toolbarElem.show();
    this.quillElem.css('z-index', GlobalZIndex++);
  }

  onBlur() {
    // don't blur on Android as a reaction to 'resize'
    if (this.desktop.isAndroid && this.desktop.blurDuringResize)
      return;

    super.onBlur();
    this.toolbarElem.hide();
    this.quill.blur();
  }

  get shapeToStorageMap() {
    return Object.assign({}, super.shapeToStorageMap, {
      "x": "x",
      "y": "y",
      "width": "w",
      "height": "h"
    });
  }

  persist() {
    super.persist();
    this.store("x", this.container.x);
    this.store("y", this.container.y);
    this.store("w", this.container.cwidth);
    this.store("h", this.container.cheight);
    this.store("t", this.quill.getContents());
  }
}
