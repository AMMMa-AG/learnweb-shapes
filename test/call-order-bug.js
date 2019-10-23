/*
 * $Id: call-order-bug.js 44380 2018-03-06 19:53:08Z robertj $
 */

$(function () {
  // colors
  var btnColorBlue = "#83CCDC";
  var btnColorRed = "#DC8383";
  var btnColorOrange = "#EDA432";
  var btnColorGreen = "#53BC48";
  var btnColorFont = "#000";

  //
  // 'canvas1'
  //
  var f = new shapes.Factory(document.getElementById("canvas1"), true, 800);

  $('#btnRect').click(function (e) {
    e.preventDefault();
    f.createRectangle({
      persist: true,
      width: 40,
      x: 40,
      y: 40,
      color: btnColorRed,
      backgroundColor: btnColorRed,
      backgroundAlpha: 0.01,
      strokeWidth: 6,
      deletable: true,
      resizable: true,
      proportional: true,
      rotatable: true,
      regPoint: 1
    });
  });

  $("#btnPick").click(function () {
    var picker = f.createColorPicker();
    picker.show();
  });

  $('#btnCrop').click(function () {
    var crop = f.createCroppedImage();
    crop.show(1); //0 = freehand, 1 = rectangle
  });

  $('#btnFreehand').click(function () {
    var freehand = f.createFreehandDrawing();
    freehand.show("#3399CC", 2); //color, strokeWidth
  });

  $("#btnGetCode").click(function () {
    console.log(shapes.Storage.exportAll());
  });

  f.done();
});
