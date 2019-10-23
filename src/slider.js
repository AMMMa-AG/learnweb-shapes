import { createjs } from 'EaselJS';
import Shape from './shape';
import MovableMixin from './movablemixin';

export default class Slider extends Shape {
  get shapeClassName() { return "Slider"; }

  constructor(desktop, width, height, xval, yval, backcolor, slidercolor, linecolor, label1, label2) {
    super(desktop);
    this.width = width;
    this.height = height;
    this.xval = this.load('x', xval);
    this.yval = this.load('y', yval);
    this.backcolor = backcolor;
    this.slidercolor = slidercolor;
    this.linecolor = linecolor;
    this.label1 = label1;
    this.label2 = label2;
    this.slider = null;
    this.init();
  }

  get layer() {
    return Shape.ToolLayer;
  }


  create() {
   const container = this.container;

   let background = new createjs.Shape();
    background.graphics
      .beginFill(this.backcolor)
      .drawRect(0, -10, this.width, this.height)
      .endFill();

   let padding = 25;
    let line = new createjs.Shape();
    line.graphics
        .setStrokeStyle(2)
        .beginStroke(this.linecolor)
        .moveTo(padding, this.height/2)
        .lineTo(this.width-padding, this.height/2)

        .moveTo(padding, this.height/2-padding/3)
        .lineTo(padding, this.height/2+padding/3)

        .moveTo(this.width-padding, this.height/2-padding/3)
        .lineTo(this.width-padding, this.height/2+padding/3)

        .endStroke();

    let slider = this.slider = new createjs.Shape();
    slider.graphics.beginFill(this.slidercolor)
		.drawRoundRectComplex(0, 0, this.width/25, this.height*0.5, 5, 5, 5, 5)
		.endFill();

	slider.x = this.load("sx", this.width/2-this.width/50);
	slider.y = this.load("sy", this.height/2-this.height*0.25);

	let fontSize = this.desktop.fontSize || '14px';
    let label1 = new createjs.Text(this.label1, `${fontSize} sans-serif`, this.linecolor);
    let label2 = new createjs.Text(this.label2, `${fontSize} sans-serif`, this.linecolor);

    let metrics = label2.getTextMetrics();
    const lwidth = metrics.width;

    label1.x = 10;
    label1.y = -5;

    label2.x = this.width-lwidth-10;
    label2.y = -5;

	container.addChild(background)
	container.addChild(line);
	container.addChild(label1)
	container.addChild(label2)
	container.addChild(slider)

	container.x = this.xval;
	container.y = this.yval;

	MovableMixin.attach(slider);
    slider.on("beginmove", () => this.focus())
    slider.on("moving", (e) => this.moveSlider(e.x, e.y));
  }

moveSlider(x, y) {
  let slider = this.slider;
  let container = this.container;

	let h_pt = slider.localToStage(x, 0);

	let range1 = container.x + 25;
	let range2 = (container.x + this.width) - this.width/25 - 25;

    if (h_pt.x > range1 && h_pt.x < range2) {
		slider.x += x;
	}

    this.desktop.update()
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
    this.store("sx", this.slider.x);
    this.store("sy", this.slider.y);
  }
}
