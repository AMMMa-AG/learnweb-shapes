/*
 * $Id: layout.js 44380 2018-03-06 19:53:08Z robertj $
 */

$(function () {
  //
  // shortcuts
  //
  var Factory = shapes.Factory;
  var Layouts = Factory.Classes.Layouts;

  //
  // 'canvas1'
  //
  (function () {
    var f = new Factory(document.getElementById("canvas1"), true, 800);

    var target = f.createBgImage({
      src: "img/t1.png",
      width: 400,
      x: 100,
      y: 100
    });

    var s1 = f.createDraggable({
      path: "img/s1.png",
      width: 75,
      x: 50,
      y: 100,
      deletable: false,
      resizable: false,
      rotatable: false,
      movable: false,
      regPoint: 0
    });

    var s2 = f.createDraggable({
      path: "img/s2.png",
      width: 100,
      x: 200,
      y: 100,
      deletable: false,
      resizable: false,
      rotatable: false,
      movable: false,
      regPoint: 0
    });

    var layout = new Layouts.StackLayout(target, {
      alignment: "horizontal top right",
      padding: 10
    });

    layout.add(s1);
    layout.add(s2);
    layout.align();

    f.done();

    var dir = "horizontal";
    var valign = "top";
    var halign = "right";

    $(".valign, .halign, .dir").each(function () {
      var elem = $(this);
      var alignment = elem.data("align");
      elem.text(alignment);
      elem.click(function (e) {
        e.preventDefault();
        if (elem.hasClass("valign"))
          valign = alignment;
        else if (elem.hasClass("halign"))
          halign = alignment;
        else if (elem.hasClass("dir"))
          dir = alignment;
        layout.alignment = dir + " " + halign + " " + valign;
        layout.align();
      });
    });
  })();


  //
  // 'canvas2'
  //
  (function () {
    var f = new Factory(document.getElementById("canvas2"), true, 800);

    var target = f.createBgImage({
      src: "img/t1.png",
      width: 500,
      x: 100,
      y: 100
    });

    var layout = new Layouts.FlowLayout(target, {
      columns: 5,
      padding: 10
    });

    for (var i = 1; i <= 20; i++) {
      var s = f.createDraggable({
        path: "img/s" + (((i - 1) % 10) + 1) + ".png",
        x: 50,
        y: 100,
        deletable: false,
        resizable: false,
        rotatable: false,
        movable: false,
        regPoint: 0
      });
      layout.add(s);
    }
    layout.align();
    f.done();
  })();


});
