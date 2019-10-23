/*
 * $Id: eb.js 47599 2019-03-28 12:31:58Z robertj $
 */

$(function() {
  var f = new shapes.Factory(document.getElementById("canvas1"), true, 800);

  f.desktop.setFakePixelRatio(1.5);

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


  var x = 50;
  var y = 50;

  $("#btn1").click(function () {
    f.createEditBox({
      persist: true,
      x: x,
      y: y,
      width: 400,
      height: 200,
      dragAlpha: 0.6,
      dragColor: "#bababa",
    });

    x += 20;
    y += 20;
  });

  $("#btn2").click(function () {
    f.desktop.stage.canvas.height += 10;
  });

});
