$(function () {
  //
  // 'canvas1'
  //
  var f1 = new shapes.Factory(document.getElementById("canvas1"), true, 800);

  f1.createCircle({
    width: 100,
    x: 150,
    y: 150,
    color: "#83CCDC",
    backgroundColor: "#83CCDC",
    backgroundAlpha: 0.01,
    strokeWidth: 6,
    deletable: true,
    resizable: true,
    proportional: false,
    rotatable: true,
    regPoint: 0,
    adjustable: true
  });


  $('#a1_freehand').click(function () {
    var freehand = f1.createFreehandDrawing();
    freehand.show("#3399CC", 2, true); //color, strokeWidth
  });

  f1.createArrowDraggable({
    length: 100,
    arrowWidth: 25,
    x: 150,
    y: 150,
    color: "blue",
    strokeWidth: 7,
    strokeStyle: 0,
    adjustable: true
  }, {
      path: "img/cam.svg",
      width: 40,
      x: 100,
      y: 100,
      deletable: false,
      resizable: true,
      rotatable: true,
      regPoint: 1,
      rotate: true,
      rotationOffset: 90
    });

    f1.createArrowNote({
      length: 100,
      arrowWidth: 25,
      x: 400,
      y: 400,
      color: "red",
      strokeWidth: 7,
      strokeStyle: 0,
      adjustable: true
    }, {
      width: 100,
      x: 400,
      y: 300,
      text: "input",
      dragAlpha: 0.6,
      dragColor: "#bababa",
        textColor: "#000000",
      adjustable: true
    });


  f1.createDraggable({
    path: "img/figur.png",
    width: 250,
    x: 150,
    y: 350,
    deletable: true,
    resizable: true,
    rotatable: false,
    regPoint: 0,
    pinable: false,
    adjustable:false
  });


  f1.createCircle({
    width: 100,
    x: 150,
    y: 150,
    color: "#fff",
    backgroundColor: "#fff",
    backgroundAlpha: 0.01,
    strokeWidth: 6,
    deletable: true,
    resizable: true,
    proportional: false,
    rotatable: true,
    regPoint: 1,
    adjustable: true
  });

f1.createRectangle({
    width: 100,
    x: 350,
    y: 150,
    color: "#83CCDC",
    backgroundColor: "#83CCDC",
    backgroundAlpha: 0.01,
    strokeWidth: 6,
    deletable: true,
    resizable: true,
    proportional: true,
    rotatable: true,
    regPoint: 0,
    adjustable: false

  });

f1.createArrow({
    heads: 2,
    length: 100,
    arrowWidth: 25,
    x: 400,
    y: 400,
    color: "red",
    strokeWidth: 7,
    deletable: true,
    strokeStyle: 0,
    adjustable: true
  });

  f1.createTextfield({
    width: 120,
    x: 400,
    y: 300,
    text: "textarea1",
    dragAlpha: 0.6,
    dragColor: "#bababa",
    textColor: "#000",
    backgroundColor: '#fff',
    backgroundAlpha: 0.9,
    deletable: true,
    resizable: true,
    fitFont: false,
    fontSize: 22,
    adjustable: true
  });

  f1.createTextfield({
    width: 120,
    x: 500,
    y: 300,
    text: "textarea2",
    dragAlpha: 0.6,
    dragColor: "#bababa",
    textColor: "#ff0000",
    backgroundColor: 'lightgreen',
    backgroundAlpha: 0.9,
    deletable: true,
    resizable: true,
    fitFont: true,
    fontSize: 22,
    adjustable: true
  });

  f1.createSpeechBubble({
    width: 150,
    x: 100,
    y: 100,
    text: "huhu",
    lockText: false,
    backgroundColor: "#fff",
    textColor: "#000",
    strokeColor: '#000',
    strokeWidth: 4,
    deletable: true,
    bubbleStyle: 1, //0: ThoughtBubble, 1: SpeechBubble,2:Panel
    font: "24px sans-serif",
    adjustable: true
  });


  f1.done();

 });
