import { createjs } from 'EaselJS';
import Shape from './shape';
import MovableMixin from './movablemixin';

export default class Pie extends Shape {
  get shapeClassName() { return "Pie"; }

  constructor(desktop, width, xval, yval, color, deletable, movable, parts, label) {
    super(desktop);
    this.width = width;
    this.xval = this.load('x', xval);
    this.yval = this.load('y', yval);
    this.color = color;
    this.parts = parts;
    this.label = label;
    this.deletable = deletable;
    this.movable = movable;
    this.init();
  }

  get layer() {
    return Shape.ToolLayer;
  }

  get deleterPos() {
    let point = {};
    point.x = this.container.x - this.container.cwidth/2;
    point.y = this.container.y - this.container.cwidth/2;
    return point;
  }


  create() {
    const container = this.container;

    let circleParts = new createjs.Shape();
    circleParts.rotation = -90;


    let circleInner = new createjs.Shape();
    circleInner.graphics
      .beginFill('#ffffff')
      .drawEllipse(0, 0, this.width, this.width);
    circleInner.alpha = 1;

    let circleOutline = new createjs.Shape();
    circleOutline.graphics
      .beginStroke(this.color)
      .setStrokeStyle(3)
      .drawEllipse(0, 0, this.width, this.width);

    // get the computed font size from the canvas' DOM element
    let fontSize = this.desktop.fontSize || '14px';
    let label = new createjs.Text(this.label, `${fontSize} sans-serif`);

    let metrics = label.getTextMetrics();
    const lwidth = metrics.width;
    const lheight = metrics.height;

    label.x = this.width+10;
    label.y = this.width/2- lheight / 2;

    let hit = new createjs.Shape();
    hit.graphics.beginFill("#fff").drawRect(0, 0, lwidth, lheight);
    label.hitArea = hit;

    if (this.label) {
      let background = new createjs.Shape();
      background.graphics.beginFill("#fff").drawRect(0, 0, lwidth + 10, lheight + 10);
      background.x = label.x - 5;
      background.y = this.width / 2 - (lheight + 10) / 2;
      container.addChild(background);
    }


    container.addChild(circleInner);
    container.addChild(circleOutline);
    container.addChild(circleParts);
    container.addChild(label);

    container.cwidth = this.width;
    container.cheight = this.width;

    container.start = this.load("s", 0);
    container.parts = this.parts;
    container.x = this.xval;
    container.y = this.yval;
    container.circleParts = circleParts;

    container.regX = this.width/2;
    container.regY = this.width/2;


    MovableMixin.attach(container);
    circleParts.on("mousedown", () => this.updatePie())
    circleInner.on("mousedown", () => this.updatePie())

    // handle focus
    container.on("beginmove", () => this.focus());

    // handle movable
    if (this.movable && this.label) {
      MovableMixin.attach(label);
      label.on("beginmove", () => this.focus());
      label.on("moving", (e) => this.moveBy(e.x, e.y));
    }

    // check if we must restore a persisted object and
    // simulate a updatePie call.
    if (container.start) {
      container.start--;
      this.updatePie();
    }
  }

updatePie(){

    const container = this.container;

    if(container.start < container.parts){
     container.start++;
    }else{
      container.start = 0;
    }

    const cP = container.circleParts;
    cP.graphics.clear();

    const color = this.color;
    let endAngle = (360/container.parts)*container.start*Math.PI/180;

    cP.graphics.moveTo(-container.cwidth/2,container.cwidth/2);
    cP.graphics.beginFill(color);
    cP.graphics.arc(-container.cwidth/2,container.cwidth/2,container.cwidth/2-4,0,endAngle);
    cP.graphics.lt(-container.cwidth/2,container.cwidth/2)
    cP.alpha = 0.5;
}

  get shapeToStorageMap() {
    return Object.assign({}, super.shapeToStorageMap, {
      "x": "x",
      "y": "y",
    });
  }

  persist() {
    super.persist();
    this.store("x", this.container.x);
    this.store("y", this.container.y);
    this.store("s", this.container.start);
  }

}
