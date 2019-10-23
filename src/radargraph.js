import { createjs } from 'EaselJS';
import Shape from './shape';
import MovableMixin from './movablemixin';

export default class RadarGraph extends Shape {
  get shapeClassName() { return "RadarGraph"; }

  constructor(desktop, chart, color, value) {
    super(desktop);
    this.value = value;
    this.color = color;

    this.circlePoints = [];

    this.angle = 2 * Math.PI / chart.knotCount;
    this.chart = chart;

    this.init();
  }

  get layer() {
    return Shape.ToolLayer;
  }

  create() {
   const container = this.container;
   container.visible = this.load("v", false);

   const chart = this.chart;
   const netpoints = chart.netpoints;

   const cXList = this.load("px", []);
   const cYList = this.load("py", []);

   for (let i = 0; i < chart.knotCount; i++)
    {
      let xStepLength = (netpoints[i].x - chart.width/2)/chart.range
      let yStepLength = (netpoints[i].y - chart.width/2)/chart.range;

      const circle = new createjs.Shape();
         circle.graphics.beginFill(this.color)
        .drawCircle(0, 0, 6)
        .endFill();

        circle.x = netpoints[i].x - (xStepLength*(chart.range-this.value)) + chart.xval;
        circle.y = netpoints[i].y - (yStepLength*(chart.range-this.value)) + chart.yval;

        container.addChild(circle);
        this.circlePoints.push(circle)

        if (i < cXList.length) {
            circle.x = cXList[i];
            circle.y = cYList[i];
        }

        MovableMixin.attach(circle);
            circle.on("beginmove", () => this.focus())

        circle.on("moving", (evt) => {
            this.moveCircle(evt.target, evt.x, evt.y, i)
        });
    }

    const line = new createjs.Shape();
    container.addChild(line);
    this.line = line;

    this.drawLine();
}

  moveCircle(circle, x, y, index) {
    const chart = this.chart;
    const angle = this.angle;
    const radius = chart.width / 2;

    // convert mouse to chart coordinates.
    let pt = circle.localToLocal(x, y, chart.container);

    // compute mouse distance from center of the chart
    let distance = Math.sqrt(Math.pow((pt.x - radius), 2) + Math.pow((pt.y - radius), 2));

    if (distance < radius) {
      let offset = 0;
      if (chart.knotCount % 2 == 1)
        offset = -this.angle / 4;

      x = Math.cos(index * angle + offset) * distance + radius;
      y = Math.sin(index * angle + offset) * distance + radius;

      circle.x = x + chart.xval;
      circle.y = y + chart.yval;

      this.drawLine();
      this.desktop.update()
    }
  }

drawLine(){
    const line = this.line;
    const points = this.circlePoints;

    line.graphics.clear();
    line.graphics
        .setStrokeStyle(2)
        .beginStroke(this.color)
        .moveTo(points[0].x, points[0].y)

    for (let j = 0; j < points.length; j++){
        line.graphics.lineTo(points[j].x, points[j].y)
    }

    line.graphics.lineTo(points[0].x, points[0].y)
    line.graphics.endStroke();
}

hide() {
    let container = this.container;

    container.visible = !container.visible;
    this.desktop.update();
}

  persist() {
    super.persist();
    this.store("v", this.container.visible);
    this.store("px", this.circlePoints.map((circle) => circle.x));
    this.store("py", this.circlePoints.map((circle) => circle.y));
    }
}
