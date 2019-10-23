/*
 * $Id: test.js 45979 2018-07-26 11:47:27Z anna $
 */

$(function() {
  // defer test
  shapes.Utils.defer(function(a, b) {
    console.log(a, b);
    return a + b;
  }, 1, 2).then(function(res) {
    console.log("defer done", res);
  });

  console.log(shapes.Utils.toHHMMSS(3810.1));
  console.log(shapes.Utils.toHHMMSS(30));


  //
  // 'canvas1'
  //
  var f1 = new shapes.Factory(document.getElementById("canvas1"));
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
    mirror: true
  });


  f1.createCircle({
    width: 100,
    x: 150,
    y: 150,
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

  f1.createRectangle({
    width: 100,
    x: 350,
    y: 150,
    color: "#83CCDC",
    backgroundColor: "#83CCDC",
    backgroundAlpha: 0.5,
    strokeWidth: 6,
    deletable: true,
    resizable: true,
    proportional: true,
    rotatable: true,
    regPoint: 0
  });

  f1.createDraggableText({
    string: "Test text hdf ohfu",
    x: 20,
    y: 20,
    maxlength: 50,
    textcolor: "#83CCDC",
    backgroundColor: "#e3e3e3",
    backgroundAlpha: 1,
    deletable: true,
    font: "26px sans-serif"
  });


  f1.createCrescendo({
    width: 100,
    height: 40,
    x: 20,
    y: 20,
    color: '#ff44ee',
    backgroundColor: '#ff5533',
    strokeWidth: 5,
    deletable: true
  });

  f1.createPie({
    width: 50,
    x: 300,
    y: 40,
    color: '#43e221',
    deletable: true,
    movable: false,
    parts: 8,
    label: ""
  });

  f1.createTriangle({
    width: 100,
    x: 550,
    y: 150,
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

  f1.createDraggable({
    path: "img/test.jpg",
    width: 250,
    x: 150,
    y: 350,
    labelText: '0:20:24',
    deletable: true,
    resizable: true,
    rotatable: true,
    regPoint: 1
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
    strokeStyle: 0
  });


  f1.createTextfield({
    width: 120,
    x: 400,
    y: 300,
    text: "textarea",
    dragAlpha: 0.6,
    dragColor: "#bababa",
    textColor: "#ff0000",
    backgroundColor: 'lightgreen',
    backgroundAlpha: 0.5,
    deletable: true,
    resizable: true,
    fitFont: false,
    fontSize: 22
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
    bubbleStyle: 0, //0: ThoughtBubble, 2: SpeechBubble, 3:Panel
    font: "26px Caveat",
    offsetY: -3
  });


  f1.createTextfield({
    width: 100,
    x: 600,
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



  f1.createBgImage({
    src: 'img/background.svg',
    x: 150,
    y: 150,
    width: 0
  });

  $("#colorpicker1").click(function() {
    var picker = f1.createColorPicker();
    picker.show();
  });

  f1.createArrow({
    heads: 1,
    x: 600,
    y: 400,
    color: "yellow",
    rotation: 45
  })

  $('#a1_crop').click(function() {
    var crop = f1.createCroppedImage();
    crop.show(1); //0 = freehand, 1 = rectangle
  });

  $('#a1_freehand').click(function() {
    var freehand = f1.createFreehandDrawing();
    freehand.show("#3399CC", 2); //color, strokeWidth
  });

  $("#a1_screenshot").click(function(e) {
    var isMs = !!window.navigator.msSaveOrOpenBlob;

    f1.desktop.getScreenshotBlob().then(function(url) {
      console.log("blob url", url);

      var hide = function() {
        $("#screenShotModal").modal('hide');
      };
      $("#screenShotModalPreview").attr('src', url);

      // MS browsers cannot open the image directly
      if (isMs) {
        $("#screenShotModalOpen").hide();
      } else {
        $("#screenShotModalOpen").attr('href', url).click(hide);
      }

      $("#screenShotModalSave").attr('href', url).click(hide);
      $("#screenShotModal").modal('show');
    });
  });

  $("#a1_getcode").click(function() {
    var w = window.open('');
    w.document.write("<pre>");
    w.document.write(f1.getCode());
    w.document.write("</pre>");
    w.document.close();
  });

  $(".fullscreen-btn").click(function(e) {
    var btn = this;
    e.preventDefault();

    var fullScreenView = btn.__FullScreenView;

    if (fullScreenView && fullScreenView.isFullScreen) {
      fullScreenView.toggle();
      btn.__FullScreenView = null;
      return;
    }

    fullScreenView = shapes.Factory.Classes.FullScreenView.forWrapper(
      btn.parentElement,
      function(res) {
        $(btn).text(res ? "Exit Full Screen" : "Full Screen");
        // we must blur() potential focused text fields.
        // otherwise, their shadow input element remains visible
        // until the user interacts with the canvas.
        f1.desktop.blur();
      }
    );
    fullScreenView.toggle();
    btn.__FullScreenView = fullScreenView;
  });

  f1.done();

  //
  // Stage 'canvas2'
  //
  var f2 = new shapes.Factory(document.getElementById("canvas2"), true);
  f2.desktop.stage.scaleX = 0.75;
  f2.desktop.stage.scaleY = 0.75;

  var count = 1;

  $('#a2_test').click(function() {
    f2.createNumbering({
      persist: true,
      value: count,
      width: 25,
      x: 20,
      y: 20,
      backgroundColor: "#1E90FF",
      backgroundAlpha: 0.9,
      deletable: true,
      resizable: false,
      proportional: true,
      rotatable: false,
      regPoint: 0
    });
    count++;
  });

  $('#a2_crop').click(function() {
    var crop = f2.createCroppedImage();
    crop.show(0); //0 = freehand, 1 = rectangle
  });

  f2.createLineChart({
    width: 500,
    x: 20,
    y: 400,
    color: "#83CCDC",
    dotNumber: 10,
    style: 1 //0: straight lines, 1: curves
  });

  f2.createBar({
    width: 60,
    height: 150,
    maxheight: 450,
    x: 600,
    y: 480,
    color: "#83CCDC",
    alpha: 0.8
  });


  f2.createSection({
    length: 100,
    x: 40,
    y: 200,
    rangex1: 20,
    rangex2: 620,
    color: "red",
    strokeWidth: 7,
    deletable: true
  });

  f2.createTimeline({
    width: 600,
    height: 40,
    x: 20,
    y: 200,
    startSec: 10,
    sec: 120,
    timelineColor: '#000000',
    backgroundColor: '#e3e3e3'
  });


  f2.createCounter({
    width: 90,
    x: 40,
    y: 40,
    deletable: false,
    fixed: false
  });

  f2.createArrowNote({
    length: 100,
    arrowWidth: 25,
    x: 400,
    y: 400,
    color: "red",
    strokeWidth: 7,
    strokeStyle: 0
  }, {
    width: 100,
    x: 400,
    y: 300,
    text: "input",
    dragAlpha: 0.6,
    dragColor: "#bababa",
    textColor: "#000000"
  });

  f2.createArrowDraggable({
    length: 100,
    arrowWidth: 25,
    x: 150,
    y: 150,
    color: "blue",
    strokeWidth: 7,
    strokeStyle: 0
  }, {
    path: "img/cam.svg",
    width: 40,
    x: 100,
    y: 100,
    deletable: true,
    resizable: true,
    rotatable: true,
    regPoint: 1,
    rotate: true,
    rotationOffset: 90
  });


  f2.createPieDraggable({
    width: 30,
    x: 550,
    y: 40,
    color: '#565656',
    deletable: false,
    movable: false,
    parts: 8,
    label: ""
  }, {
    path: "img/cam.svg",
    width: 90,
    x: 100,
    y: 100,
    deletable: true,
    resizable: false,
    rotatable: false,
    regPoint: 1,
    rotate: false,
    rotationOffset: 0
  });


  f2.createPieNote({
    width: 30,
    x: 550,
    y: 40,
    color: '#565656',
    deletable: false,
    movable: false,
    parts: 8,
    label: ""
  }, {
    width: 100,
    x: 50,
    y: 50,
    text: "testtest",
    dragAlpha: 0.6,
    dragColor: "#bababa",
    textColor: "#000000"
  });

  $("#colorpicker2").click(function() {
    var picker = f2.createColorPicker();
    picker.show();
  });

  f2.done();


  // stage "canvas 3"

  var f3 = new shapes.Factory(document.getElementById("canvas3"), true);

  var rChart = f3.createRadarChart({
    width: 300,
    x: 200,
    y: 100,
    knotNumber: 6,
    lineColor: "grey",
    backgroundColor: "lightblue",
    interKnots: 5,
    labels: ["Verführung, das \npersonifizierte \nVerhängnis [1]",
      "heile Welt vs. \nbedrohliche Großstadt",
      "huhu2",
      "Mann zwischen zwei \nkontrastierenden Frauen / \nFrau zwischen zwei \nkontrastierenden Männern",
      "Naturstimmungen als \nSpiegel der Seele",
      "Naturstimmungen als \nSpiegel der Seele"
    ]
  });


  var green = f3.createRadarGraph({
    chart: rChart,
    color: "#6ADD26",
    value: 4
  });

  var red = f3.createRadarGraph({
    chart: rChart,
    color: "#E01B33",
    value: 2
  });


  $("#f3_red").click(function() {
    red.hide();
  });

  $("#f3_green").click(function() {
    green.hide();
  });

  f3.createSlider({
    width: 300,
    height: 60,
    x: 500,
    y: 100,
    backcolor: "grey",
    slidercolor: "#8b0000",
    linecolor: "white",
    label1: "realistisch",
    label2: "unrealistisch"
  });

  f3.createPlayer({
    path: "img/test.mp4",
    width: 500,
    x: 600,
    y: 100,
    deletable: true,
    resizable: true,
    rotatable: true,
    regPoint: 1,
    pinable: false
  });


  f3.createPlayer({
    path: "img/bigbuckbunny.mp4",
    width: 300,
    x: 100,
    y: 100,
    deletable: true,
    resizable: true,
    rotatable: true,
    regPoint: 0,
    pinable: false
  });



  f3.createAudioPlayer({
    path: "img/soundtest.mp3",
    width: 300,
    x: 100,
    y: 400,
    deletable: true,
    resizable: true,
    rotatable: true,
    regPoint: 0,
    pinable: false,
    layer: 0
  });

  f3.done();

});
