/*
 * $Id: tf.js 47574 2019-03-23 16:58:27Z robertj $
 */

$(function() {
  var f = new shapes.Factory(document.getElementById("canvas1"), true, 800);

  f.desktop.setFakePixelRatio(1.5);

  f.createTextfield({
    width: 120,
    x: 100,
    y: 100,
    text: "textarea",
    dragAlpha: 0.6,
    dragColor: "#bababa",
    textColor: "#ff0000",
    backgroundColor: 'lightgreen',
    backgroundAlpha: 0.5,
    deletable: true,
    resizable: true,
    fitFont: false,
    fontSize:22
  });

  f.createSpeechBubble({
    width: 150,
    x: 200,
    y: 200,
    text: "Gedanke...",
    lockText: false,
    backgroundColor: "#fff",
    textColor: "#000",
    strokeColor: '#000',
    strokeWidth: 4,
    deletable: true,
    bubbleStyle: 0, //0: ThoughtBubble, 2: SpeechBubble, 3:Panel
    font: '26px Short Stack',
    offsetY: -3
  });

  f.createSpeechBubble({
    width: 150,
    x: 500,
    y: 350,
    text: "Text...",
    lockText: false,
    backgroundColor: "#fff",
    textColor: "#000",
    strokeColor: '#000',
    strokeWidth: 4,
    deletable: true,
    bubbleStyle: 2,
    font: '26px Short Stack',
    offsetY: -3
  });

  f.createTextfield({
    width: 100,
    x: 100,
    y: 300,
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

  //
  // Styled
  //

  f.createTextfield({
    width: 150,
    x: 400,
    y: 100,
    text: "textarea",
    dragAlpha: 0.6,
    dragColor: "#bababa",
    textColor: "#ff0000",
    backgroundColor: 'lightgreen',
    backgroundAlpha: 0.5,
    deletable: true,
    resizable: true,
    fitFont: false,
    fontSize: 28,
    font: 'Short Stack'
  });

  f.createTextfield({
    width: 150,
    x: 400,
    y: 300,
    text: "input",
    dragAlpha: 0.6,
    dragColor: "#bababa",
    textColor: "black",
    backgroundColor: 'white',
    backgroundAlpha: 0.5,
    deletable: true,
    resizable: true,
    fitFont: true,
    fontSize: 36,
    font: 'Short Stack'
  });


  //
  // ArrowNote
  //
  f.createArrowNote({
    length: 100,
    arrowWidth: 25,
    x: 600,
    y: 300,
    color: "red",
    strokeWidth: 7,
    strokeStyle: 0
  }, {
    width: 100,
    x: 600,
    y: 100,
    text: "input",
    dragAlpha: 0.6,
    dragColor: "#bababa",
    textColor: "#000000"
    });

  f.createEditBox({
    x: 50,
    y: 50,
    text: "Edit box based on Quill",
    width: 400,
    height: 200,
    dragAlpha: 0.6,
    dragColor: "#bababa",
  });


  f.done();

  $("#btn1").click(function () {
    location.reload(true);
  });

});
