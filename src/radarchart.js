import { createjs } from 'EaselJS';
import Shape from './shape';

export default class RadarChart extends Shape {
  get shapeClassName() { return "RadarChart"; }

  constructor(desktop, width, xval, yval, knotCount, lineColor, backgroundColor, range, labels) {
    super(desktop);
    this.width = width;
    this.xval = this.load('x', xval);
    this.yval = this.load('y', yval);
    this.knotCount = knotCount;
    this.lineColor = lineColor;
    this.backgroundColor = backgroundColor;
    this.range = range;
    this.labels = labels;

    this.init();
  }

  get layer() {
    return Shape.ToolLayer;
  }

  create() {
    const container = this.container;

    const angle = 2 * Math.PI / this.knotCount;
    const radius = this.width/2;

    let offset = 0;
    let netpoints = [];

    let px;
    let py;

    if (this.knotCount % 2 == 1){offset = -angle/4;}

    let line = new createjs.Shape();
    container.addChild(line)

    line.graphics
        .setStrokeStyle(1)
        .beginStroke(this.lineColor)
        .beginFill(this.backgroundColor)

    for(let i = 0; i<this.knotCount; i++){
        px = Math.cos(i*angle+offset)*radius+radius;
        py = Math.sin(i*angle+offset)*radius+radius;

        line.graphics.lineTo(px, py);

        let circle = new createjs.Shape();
        circle.graphics.beginFill(this.lineColor)
        .drawCircle(px, py, 4)
        .endFill();

        container.addChild(circle)

        netpoints.push({x:px, y:py});
        this.netpoints = netpoints;
    }

    this.drawRange(this.range, netpoints);
    this.makeLabels(netpoints);

    line.graphics.lineTo(netpoints[0].x, netpoints[0].y);
    line.graphics.endStroke();

    container.x =  this.xval;
    container.y =  this.yval;
}

drawRange(range, netpoints){
    let xStepLength;
    let yStepLength;

    for (let j = 0; j < netpoints.length; j++){
    let line = new createjs.Shape();
    this.container.addChild(line)

    line.graphics
        .setStrokeStyle(1)
        .beginStroke(this.lineColor)
        .moveTo(this.width/2,this.width/2)
        .lineTo(netpoints[j].x, netpoints[j].y)
        .endStroke();

    if(range > 0)
    {
      xStepLength = (netpoints[j].x - this.width/2)/range;
      yStepLength = (netpoints[j].y - this.width/2)/range;

      for (let k = 0; k <= range; k++)
      {
        let circleStep = new createjs.Shape();
         circleStep.graphics.beginFill(this.lineColor)
        .drawCircle(0, 0, 4)
        .endFill();

        circleStep.x = netpoints[j].x - (k * xStepLength);
        circleStep.y = netpoints[j].y - (k * yStepLength);
        this.container.addChild(circleStep);
      }
    }
  }
}


makeLabels(netpoints){
    let offset = 0;
    const radius = this.width/2;
    const angle = 2 * Math.PI / this.knotCount;

    if (this.knotCount % 2 == 1)
        offset = -angle/4;

    for (let j = 0; j < netpoints.length; j++){
        let fontSize = '13px';
        let label = new createjs.Text(this.labels[j], `${fontSize} sans-serif`);
        label.lineHeight = parseInt(fontSize) *1.2 ;

        let metrics = label.getTextMetrics();
        const lwidth = metrics.width;
        const lheight = metrics.height;

        let px = Math.cos(j*angle+offset)*(radius+lwidth/2+15)+radius;
        let py = Math.sin(j*angle+offset)*(radius+lheight/2+15)+radius;

        label.regX = lwidth/2;
        label.regY = lheight/2;
        label.x = px;
        label.y = py;

        this.container.addChild(label)
    }
}

persist() {
    super.persist();
    this.store("x", this.container.x);
    this.store("y", this.container.y);
    }
}
