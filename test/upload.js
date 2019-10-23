/*
 * $Id: upload.js 46025 2018-08-02 15:41:17Z robertj $
 */

$(function () {
  //
  // 'canvas1'
  //
  var f1 = new shapes.Factory(document.getElementById("canvas1"), true, 800);
  f1.done();

  f1.desktop.on('player:snapshot', function (e) {
    f1.createDraggable({
      persist: true,
      path: e.player.capture(),
      labelText: e.player.getCurrentTimeLabel(),
      width: 200
    });
  });

  $('#btnUpload').click(function (e) {
    e.preventDefault();
    $("#uploadModal").modal('show');
    var dropzone = f1.desktop.installUploadHandler('uploadArea', {}, function (dz, file, uri) {
      var mimeType = file.type.substring(0, file.type.indexOf('/'));
      switch (mimeType) {
        case "image":
          f1.createDraggable({
            persist: true,
            path: uri,
            width: 200
          });
          break;
        case "video":
          f1.createPlayer({
            persist: true,
            x: 50,
            y: 100,
            path: uri,
            width: 200
          });
          break;
        case "audio":
          f1.createAudioPlayer({
            persist: true,
            path: uri,
            width: 200
          });
          break;
      }
    });
    $("#uploadModal").on('hide.bs.modal', function () {
      dropzone.destroy();
    });
  });

});
