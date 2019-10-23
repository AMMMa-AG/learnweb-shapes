/*
 * $Id: player.js 49007 2019-10-23 08:55:46Z robertj $
 */

$(function () {
  //
  // 'canvas1'
  //
  var f1 = new shapes.Factory(document.getElementById("canvas1"), true, 800);

  f1.desktop.on('player:snapshot', function (e) {
    f1.createDraggable({
      persist: true,
      path: e.player.capture(),
      labelText: e.player.getCurrentTimeLabel(),
      width: 200
    });
  });

  f1.createPlayer({
    path: "img/test.mp4",
    width: 300,
    x: 50,
    y: 100,
    deletable: true,
    resizable: true,
    rotatable: true,
    regPoint: 0,
    pinable: false
  });

  f1.createPlayer({
    path: "img/test.mp4",
    width: 300,
    x: 400,
    y: 100,
    deletable: true,
    resizable: true,
    rotatable: true,
    regPoint: 0,
    pinable: false
  });

  f1.createPlayer({
    path: "img/test.mp4",
    width: 300,
    x: 400,
    y: 300,
    deletable: true,
    resizable: true,
    rotatable: true,
    regPoint: 0,
    pinable: false
  });

  f1.createAudioPlayer({
    path: "img/soundtest.mp3",
    width: 300,
    x: 200,
    y: 50,
    deletable: true,
    resizable: true,
    rotatable: true,
    regPoint: 1,
    pinable: false
  });

  f1.done();

});
