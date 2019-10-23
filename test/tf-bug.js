/*
 * $Id: tf-bug.js 44380 2018-03-06 19:53:08Z robertj $
 */

$(function () {
  //
  // 'canvas1'
  //
  var f1 = new shapes.Factory(document.getElementById("canvas1"), true, 800);

  f1.createTextfield({
    width: 100,
    x: 50,
    y: 50,
    text: "textarea",
    dragAlpha: 0.6,
    dragColor: "#bababa",
    textColor: "#ff0000",
    backgroundColor: 'lightgreen',
    backgroundAlpha: 0.5,
    deletable: true,
    resizable: true,
    fitFont: false
  });

  f1.createTextfield({
    width: 100,
    x: 200,
    y: 200,
    text: "input",
    dragAlpha: 0.6,
    dragColor: "#bababa",
    textColor: "black",
    backgroundColor: 'white',
    backgroundAlpha: 0.5,
    deletable: true,
    resizable: true,
    fitFont: true
  });

  f1.createArrowNote({
    length: 100,
    arrowWidth: 25,
    x: 350,
    y: 350,
    color: "red",
    strokeWidth: 7,
    strokeStyle: 0
  }, {
    width: 100,
    x: 300,
    y: 300,
    text: "input",
    dragAlpha: 0.6,
    dragColor: "#bababa",
    textColor: "#000000"
  });

  f1.done();
});
