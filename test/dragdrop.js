/*
 * $Id: dragdrop.js 44380 2018-03-06 19:53:08Z robertj $
 */

$(function() {
  shapes.Factory.configure({
    debug: true
  });

  //
  // commons
  //
  var createCheckHandler = function (buttonId, exercise) {
    $("#" + buttonId).click(function () {
      var btn = $(this);
      var successDiv = btn.parent().find('.alert-success');
      var failDiv = btn.parent().find('.alert-danger');

      exercise.check().then(function (result) {
        console.log("check", buttonId, result);
        if (result.valid && result.completed) {
          successDiv.slideDown();
          failDiv.hide();
          shapes.Utils.delay(2000, function () {
            successDiv.slideUp();
          });
        } else {
          if (result.maxCount) {
            failDiv.text(
              "Das ist nicht ganz richtig (%a von %b)"
                .replace("%a", result.count)
                .replace('%b', result.maxCount)
            );
          }
          failDiv.slideDown();
          successDiv.hide();
          shapes.Utils.delay(2000, function () {
            failDiv.slideUp();
          });
        }
      });
    });
  };

  //
  // 'canvas1'
  //
  (function () {
    var f = new shapes.Factory(document.getElementById("canvas1"), true, 800);

    var ex = f.createDragDropExercise({
      debug: true,
      cols: 5,
      padding: 10,
      zonePadding: 10,
      sources: {
        pattern: "img/s%d.png",
        start: 1,
        end: 10
      },
      targets: {
        pattern: "img/t%d.png",
        start: 1,
        end: 10
      },
    });

    createCheckHandler("check1", ex);
    f.done();
  })();

  //
  // 'canvas2'
  //
  (function () {
    var f = new shapes.Factory(document.getElementById("canvas2"), true, 800);

    var ex = f.createDragDropExercise({
      debug: true,
      cols: 3,
      sourceCols: 6,
      padding: 10,
      zonePadding: 10,
      dropPos: "bottomleft",
      dropPadding: 10,
      sourceWidth: 60,
      sources: {
        pattern: "img/a1_t%d.png",
        start: 1,
        end: 6
      },
      targets: {
        pattern: "img/a1_s%d.png",
        start: 1,
        end: 6
      },
    });

    createCheckHandler("check2", ex);
    f.done();
  })();

  //
  // DragDropModel unit tests
  //
  (function () {
    var model, d;

    //
    // basic
    //
    model = {
      sources: 2,
      targets: 2,
      expect: {
        0: 0,
        1: 1
      }
    };

    d = new shapes.Factory.Classes.DragDropModel(model);
    console.assert(d.drop(0, 0) == true, model);
    console.assert(d.check() == false, model);

    console.assert(d.drop(1, 1) == true, model);
    console.assert(d.check() == true, model);

    //
    // less expectations than targets
    //
    model = {
      sources: 2,
      targets: 3,
      expect: {
        0: 0,
        1: 1
      }
    };

    d = new shapes.Factory.Classes.DragDropModel(model);
    console.assert(d.drop(0, 0) == true, model);
    console.assert(d.check() == false, model);

    console.assert(d.drop(1, 1) == true, model);
    console.assert(d.check() == true, model);

    //
    // more sources than targets
    //
    model = {
      sources: 3,
      targets: 2,
      expect: {
        0: 0,
        1: 2
      }
    };

    d = new shapes.Factory.Classes.DragDropModel(model);
    console.assert(d.drop(0, 0) == true, model);
    console.assert(d.check() == false, model);

    console.assert(d.drop(2, 1) == true, model);
    console.assert(d.check() == true, model);

    //
    // more sources & targets than expectations
    //
    model = {
      sources: 3,
      targets: 3,
      expect: {
        0: 0,
        1: 1
      }
    };

    d = new shapes.Factory.Classes.DragDropModel(model);
    console.assert(d.drop(0, 0) == true, model);
    console.assert(d.check() == false, model);

    console.assert(d.drop(1, 1) == true, model);
    console.assert(d.check() == true, model);

    //
    //
    //
    model = {
      sources: 3,
      targets: 3,
      expect: {
        0: 0,
        1: 1,
        2: 2
      }
    };

    d = new shapes.Factory.Classes.DragDropModel(model);
    console.assert(d.drop(0, 0) == true, model);
    console.assert(d.check() == false, model);

    console.assert(d.drop(1, 1) == true, model);
    console.assert(d.check() == false, model);

    console.assert(d.drop(2, 2) == true, model);
    console.assert(d.check() == true, model);

    //
    // multiple sources per target
    //
    model = {
      sources: 2,
      targets: 2,
      expect: {
        0: [0, 1]
      }
    };

    d = new shapes.Factory.Classes.DragDropModel(model);
    console.assert(d.canDrop(0, 0) == true, model);
    console.assert(d.drop(0, 0) == true, model);
    console.assert(d.canDrop(0, 0) == false, model);
    console.assert(d.check() == false, model);

    console.assert(d.checkSource(1) == false, model);
    console.assert(d.checkTarget(0) == false, model);

    console.assert(d.canDrop(1, 0) == true, model);
    console.assert(d.drop(1, 0) == true, model);
    console.assert(d.canDrop(1, 0) == false, model);
    console.assert(d.check() == true, model);

    console.assert(d.targetOf(0) == 0, model);
    console.assert(d.targetOf(1) == 0, model);

    console.assert(d.sourcesOf(0).join(",") == "0,1", model);
    console.assert(d.sourcesOf(1).join(",") == "", model);

    console.assert(d.checkSource(0) == true, model);
    console.assert(d.checkTarget(0) == true, model);

    var r = shapes.Utils.deepClone(d.result);
    d.set(r);
    console.assert(shapes.Utils.deepEquals(r, d.result), { clone: r, model: model.result });

    //
    // conditions
    //
    model = {
      sources: 2,
      targets: 2,
      expect: {
        0: [0, 1]
      },
      conditions: {
        0: 'any'
      }
    };

    d = new shapes.Factory.Classes.DragDropModel(model);
    console.assert(d.canDrop(0, 0) == true, model);
    console.assert(d.drop(0, 0) == true, model);
    console.assert(d.canDrop(0, 0) == false, model);
    console.assert(d.check() == true, model);

    console.assert(d.checkSource(1) == false, model);
    console.assert(d.checkTarget(0) == true, model);

    console.assert(d.canDrop(1, 0) == false, model);

    d.undrop(0, 0);
    console.assert(d.canDrop(1, 0) == true, model);
    console.assert(d.drop(1, 0) == true, model);

    console.assert(d.canDrop(0, 0) == false, model);
    console.assert(d.canDrop(1, 0) == false, model);

    console.assert(d.drop(0, 0) == true, model);
    console.assert(d.checkTarget(0) == false, model);
    console.assert(d.check() == false, model);

    //
    // unit test for a check(). see related commit.
    //
    model = {
      sources: 2,
      targets: 2,
      expect: {
        0: [0],
        // "1" has no expect entry
      }
    };

    d = new shapes.Factory.Classes.DragDropModel(model);
    console.assert(d.check() == false, model);
    d.drop(0, 0);
    console.assert(d.check() == true, model);
    d.drop(1, 1);
    console.assert(d.check() == false, model);

  })();

  //
  // 'canvas3'
  //
  (function () {
    var f = new shapes.Factory(document.getElementById("canvas3"), true, 800);

    var ex = f.createComplexDragDropExecise({
      debug: true,
      multiDrop: true,
      sourceLabelColor: 'red',

      model: {
        sources: 6,
        targets: 6,
        expect: {
          0: 0,
          1: 1,
          2: 2,
          3: [3, 4],
          4: [5]
        },
        conditions: {
          3: 'any'
        }

      },

      sourceLayout: 'GridLayout',
      sourceLayoutOptions: {
        columns: 6,
        padding: 10
      },
      sourceLayoutShapeOptions: {
        x: 10,
        y: 350,
        width: 400,
        height: 80,
        color: 'rgba(0,255,0,0.3)'
      },
      sourceImages: {
        pattern: "img/a1_t%d.png",
        start: 1,
        end: 6
      },

      targetLayout: 'FlowLayout',
      targetLayoutOptions: {
        columns: 3,
        padding: 10
      },
      targetLayoutShapeOptions: {
        x: 10,
        y: 10,
        width: 600,
        height: 320,
        color: 'rgba(255,0,0,0.3)'
      },
      // targetImages: {
      //   pattern: "img/a1_s%d.png",
      //   start: 1,
      //   end: 6
      // },

      // like above, but with intermixed explode() calls
      targetImages: [
        "img/a1_s1.png",
        shapes.Utils.explode("img/a1_s%d.png", 2, 5),
        "img/a1_s6.png",
      ],

      targetInnerLayout: 'StackLayout',
      targetInnerLayoutOptions: {
        alignment: 'h bottom left',
        padding: 2
      }

    });

    createCheckHandler("check3", ex);
    f.done();
  })();

  //
  // 'canvas4'
  //
  (function () {
    var f = new shapes.Factory(document.getElementById("canvas4"), true, 800);

    var ex = f.createComplexDragDropExecise({
      debug: true,

      model: {
        sources: 2,
        targets: 2,
        expect: "identity"
      },

      sourceLayout: 'NullLayout',
      sourceLayoutOptions: {
      },
      sourceLayoutShapeOptions: {
        x: 10,
        y: 350,
        width: 400,
        height: 80,
        color: 'rgba(0,255,0,0.3)'
      },
      sourceImages: {
        pattern: "img/s%d.png",
        start: 1,
        end: 2
      },

      targetLayout: 'NullLayout',
      targetLayoutOptions: {
        columns: 2,
        padding: 20
      },
      targetLayoutShapeOptions: {
        x: 10,
        y: 10,
        width: 600,
        height: 320,
        color: 'rgba(255,0,0,0.2)'
      },
      targetImages: {
        pattern: "img/t%d.png",
        start: 1,
        end: 2
      },

      targetInnerLayout: 'StackLayout',
      targetInnerLayoutOptions: {
        alignment: 'h bottom left',
        padding: 2
      }

    });

    createCheckHandler("check4", ex);
    f.done();
  })();

});
