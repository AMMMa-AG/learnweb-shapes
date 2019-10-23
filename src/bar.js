import { createjs } from 'EaselJS';
import Shape from './shape';
import MovableMixin from './movablemixin';



export default class Bar extends Shape {
  get shapeClassName() { return "Bar"; }

  constructor(desktop, width, height, maxheight, xval, yval, color, alpha) {
    super(desktop);
    this.width = width;
    this.height = this.load("h", height);
    this.maxheight = maxheight;
    this.xval = xval;
    this.yval = yval;
    this.color = color;
    this.alpha = alpha;
    this.init();
  }

  get layer() {
    return Shape.BackgroundLayer;
  }

  create() {
    const container = this.container;

    let background = this.background = new createjs.Shape();
    let height = this.load("height", this.height);
    background.graphics.beginFill(this.color).drawRect(0, 0, this.width, -height);
    container.addChild(background);

    container.x = this.xval;
    container.y = this.yval;

    MovableMixin.attach(background);
    background.on("beginmove", () => this.focus());
    background.on("moving", (e) => this.resizeBar(background, e.y));

  }


  resizeBar(background, y) {
    this.height = this.height - y;

    if (this.height <= this.maxheight) {
      background = this.background;
      background.graphics.clear();
      background.graphics.beginFill(this.color).drawRect(0, 0, this.width, -this.height);
    }

    this.desktop.update();
  }

  focus() {
    // noop
  }

  blur() {
    // noop
  }

  persist() {
    super.persist();
    this.store("h", this.height);
  }
}
