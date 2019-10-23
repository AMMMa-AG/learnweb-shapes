/*
 * $Id: persistence.js 47658 2019-04-10 15:35:04Z robertj $
 */

$(function () {
  //
  // 'canvas1'
  //
  var f1 = new shapes.Factory(document.getElementById("canvas1"), true, 800);
  var count = 0;
  f1.desktop.on("persisted", function () {
    console.log(++count);
  });

  f1.desktop.on("desktop:shapeschanged", function () {
    $("#count").text(f1.desktop.getShapes().length);
  });

  (function () {
    var pos = new shapes.PositionHelper(50, 50, 10);
    $("#btn1").click(function () {
      f1.createTextfield({
        adjustable: true,
        persist: true,
        width: 100,
        x: pos.getX(),
        y: pos.getY(),
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
    });
  })();

  (function () {
    var pos = new shapes.PositionHelper(200, 200, 10);
    $("#btn2").click(function () {
      f1.createTextfield({
        persist: true,
        width: 100,
        x: pos.getX(),
        y: pos.getY(),
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
    });
  })();

  (function () {
    var pos1 = new shapes.PositionHelper(350, 350, 10);
    var pos2 = new shapes.PositionHelper(300, 300, 10);
    $("#btn3").click(function () {
      f1.createArrowNote({
        persist: true,
        length: 100,
        arrowWidth: 25,
        x: pos1.getX(),
        y: pos2.getY(),
        color: "red",
        strokeWidth: 7,
        strokeStyle: 0,
        adjustable: true
      }, {
          width: 100,
          x: pos2.getX(),
          y: pos2.getY(),
          text: "input",
          dragAlpha: 0.6,
          dragColor: "#bababa",
          textColor: "#000000"
        });
    });
  })();

  (function () {
    var pos1 = new shapes.PositionHelper(350, 350, 10);
    var pos2 = new shapes.PositionHelper(300, 300, 10);
    $("#btn10").click(function () {
      f1.createPieNote({
        persist: true,
        length: 100,
        x: pos1.getX(),
        y: pos2.getY(),
        movable: false
      }, {
          width: 100,
          x: pos2.getX(),
          y: pos2.getY(),
          text: "input",
          dragAlpha: 0.6,
          dragColor: "#bababa",
          textColor: "#000000"
        });
    });
  })();

  (function () {
    var pos = new shapes.PositionHelper(150, 150, 10);
    $("#btn5").click(function () {
      f1.createCircle({
        persist: true,
        width: 100,
        x: pos.getX(),
        y: pos.getY(),
        color: "#83CCDC",
        backgroundColor: "#83CCDC",
        backgroundAlpha: 0.5,
        strokeWidth: 6,
        deletable: true,
        resizable: true,
        proportional: false,
        rotatable: true,
        regPoint: 1
      });
    });
  })();

  (function () {
    $("#btn4").click(function () {
      var data = f1.desktop.storage.exportStorage();
      var w = window.open('');
      w.document.write("<pre>");
      w.document.write(JSON.stringify(data, null, 2));
      w.document.write("</pre>");
      w.document.close();
    });
  })();

  (function () {
    $("#btn6").click(function () {
      location.reload(true);
    });
  })();

  (function () {
    $("#btn7").click(function () {
      var w = window.open('');
      w.document.write("<pre>");
      w.document.write(f1.getCode());
      w.document.write("</pre>");
      w.document.close();
    });
  })();

  (function () {
    $("#btn9").click(function () {
      f1.desktop.clear();
    });
  })();

  (function () {
    var pos = new shapes.PositionHelper(150, 150, 10);
    $("#btn8").click(function () {
      f1.createSpeechBubble({
        persist: true,
        width: 150,
        x: pos.getX(),
        y: pos.getY(),
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
    });
  })();


  //
  // multiple done-calls. this used to produce duplicates until r448924
  //
  f1.done();
  f1.done();

  //
  // 'canvas2'
  //
  var f2 = new shapes.Factory(document.getElementById("canvas2"), true, 800);

  //
  // multiple done-calls. this used to produce duplicates until r448924
  //
  f2.done();
  f2.done();

});
