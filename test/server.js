/*
 * $Id: server.js 45045 2018-05-02 12:01:11Z robertj $
 */

$(function () {
  var sessionServer = shapes.Factory.createSessionServer();

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

  f1.done();

  $('#btnCrop').click(function (e) {
    e.preventDefault();
    var crop = f1.createCroppedImage();
    crop.show(1);
  });

  $("#btnSave").click(function (e) {
    e.preventDefault();
    sessionServer.save(shapes.Storage.exportAll()).then(function (res) {
      console.log(res);
      if (res.id) {
        $('#sid').val(res.id);
      }
    });
  });

  $("#btnLoad").click(function (e) {
    e.preventDefault();
    var value = $('#sid').val();
    if (value) {
      sessionServer.load(value).then(function (res) {
        if (res.data) {
          shapes.Storage.importAll(res.data);
          location.reload();
        }
      });
    }
  });

});
