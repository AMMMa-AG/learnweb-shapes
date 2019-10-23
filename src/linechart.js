import { createjs } from 'EaselJS';
import Shape from './shape';
import MovableMixin from './movablemixin';

export default class LineChart extends Shape {
  get shapeClassName() { return "LineChart"; }

  constructor(desktop, width, xval, yval, color, dotNumber, style, moveHorizontal) {
    super(desktop);
    this.width = width;
    this.xval = this.load('x', xval);
    this.yval = this.load('y', yval);
    this.color = color;
    this.dotNumber = dotNumber;
    this.style = style;
    this.dotList = [];
    this.moveHorizontal = moveHorizontal;
    this.init();
  }

  get layer() {
    return Shape.ToolLayer;
  }

  create() {
    const container = this.container;
    const distance = this.width / this.dotNumber;
    const line = new createjs.Shape();

    const dotYList = this.load("dy", []);
    const dotXList = this.load("dx", []);

    for (let i = 0; i < this.dotNumber; i++) {

      let dot = new createjs.Shape();
      dot.graphics
        .beginFill(this.color)
        .drawCircle(0, 0, 10);

      dot.x = i * distance;

      // restore a persisted y value
      if (i < dotYList.length) {
        dot.y = dotYList[i];
        dot.x = dotXList[i];
      }

      this.dotList.push(dot);
      container.addChild(dot);

      MovableMixin.attach(dot);
      dot.on("beginmove", () => this.focus());
      dot.on("moving", (e) => this.moveDot(dot, e.x, e.y));
    }

    container.cwidth = this.width;
    container.color = this.color;
    container.line = line;
    container.style = this.style;
    container.addChild(line)


    container.x = this.xval;
    container.y = this.yval;

    this.drawLine()
  }

  moveDot(dot, x, y) {
    dot.y += y;

    if (this.moveHorizontal == true) {
      dot.x += x;
    }

    this.drawLine();
    this.desktop.update()
  }


  drawLine() {
    const dotList = this.dotList;
    const container = this.container
    const line = container.line;

    line.graphics.clear();

    line.graphics
      .setStrokeStyle(5)
      .beginStroke(container.color)
      .moveTo(dotList[0].x, dotList[0].y)


    let style = container.style;

    if (style == 0) {

      for (let i = 0; i < dotList.length - 1; i++) {
        line.graphics.lineTo(dotList[i + 1].x, dotList[i + 1].y)
      }
    }

    if (style == 1) {

      for (let i = 0; i < dotList.length - 1; i++) {
        let x_mid = (dotList[i].x + dotList[i + 1].x) / 2;
        let y_mid = (dotList[i].y + dotList[i + 1].y) / 2;
        let cp_x1 = (x_mid + dotList[i].x) / 2;
        //let cp_y1 = (y_mid + dotList[i].y) / 2;
        let cp_x2 = (x_mid + dotList[i + 1].x) / 2;
        //let cp_y2 = (y_mid + dotList[i+1].y) / 2;
        line.graphics.quadraticCurveTo(cp_x1, dotList[i].y, x_mid, y_mid);
        line.graphics.quadraticCurveTo(cp_x2, dotList[i + 1].y, dotList[i + 1].x, dotList[i + 1].y);
      }
    }

    line.graphics.endStroke();
  }

  persist() {
    super.persist();
    this.store("x", this.container.x);
    this.store("y", this.container.y);
    // persist the y coordinate of the dots as an array.
    this.store("dy", this.dotList.map((dot) => dot.y));
    this.store("dx", this.dotList.map((dot) => dot.x));
  }

}
