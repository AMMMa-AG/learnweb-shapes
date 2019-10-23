/*
 * $Id: counter.js 46445 2018-09-20 10:13:25Z robertj $
 */

import { createjs } from 'EaselJS';
import Shape from './shape';
import MovableMixin from './movablemixin';

export default class Counter extends Shape {
  get shapeClassName() { return "Counter"; }

  constructor(desktop, width, xval, yval, deletable, fixed) {
    super(desktop);
    this.width = this.load('w', width);
    this.rotatable = false;
    this.resizable = false;
    this.regPoint = 0;
    this.value = 0;
    this.xval = this.load('x', xval);
    this.yval = this.load('y', yval);
    this.deletable = deletable;
    this.fixed = fixed;
    this.init();
  }

  get layer() {
    return Shape.ToolLayer;
  }

  create() {
   const container = this.container;

   let rectInner = new createjs.Shape();
    rectInner.graphics
      .beginFill('#e3e3e3')
      .drawRect(0, 0, this.width, this.width);
    rectInner.alpha = 0.8;

   let rectReset = new createjs.Shape();
    rectReset.graphics
      .beginFill('#ffffff')
      .drawRect(this.width*0.1, this.width*0.7, this.width*0.8, this.width*0.2);

   let rectNumber = new createjs.Shape();
    rectNumber.graphics
      .beginFill('#ffffff')
      .drawRect(this.width*0.1, this.width*0.1, this.width*0.8, this.width*0.5);

   let newSize = this.width*0.4 +  'px';
   let text = new createjs.Text("", newSize + " Arial", "#333333");
   text.mouseEnabled  = false;
   text.text = this.value.toString();

   let b = text.getBounds()
   text.y = this.width *0.12;
   text.x = this.width/2-b.width/2;


   let rSize = this.width*0.15 +  'px';
   let reset = new createjs.Text("", rSize + " Arial", "#333333");
   reset.mouseEnabled  = false;
   reset.text = "Reset";

   let br = reset.getBounds()
   reset.y = this.width *0.72;
   reset.x = this.width/2-br.width/2;

   container.textfield = text;
   container.x = this.xval;
   container.y = this.yval;
   container.value = this.value;
   container.width = this.width

   container.addChild(rectInner);
   container.addChild(rectNumber);
   container.addChild(text);
   container.addChild(rectReset);
   container.addChild(reset);

   if(this.fixed == false){
     MovableMixin.attach(container);
     container.on("beginmove", () => this.focus())
     container.on("moving", (e) => this.moveBy(e.x, e.y));
  }

   rectNumber.on("mousedown", (e) => this.setCounter(container, container.value + 1));
   rectReset.on("mousedown", (e) => this.setCounter(container, 0));

  }

  setCounter(container, value){
    container.value = value;

    let text = container.textfield;
    text.text = value.toString();

    let b =   text.getBounds()
    text.x = container.width/2-b.width/2;
  }

  persist() {
    super.persist();
    this.store("x", this.container.x);
    this.store("y", this.container.y);
    this.store("w", this.container.width);
  }

}
