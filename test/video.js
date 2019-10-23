$(function () {
  var fsw;
  var container = $('.lw-fullscreen-container');
  var video = $('video');

  console.log("videoSupported", shapes.Factory.Classes.FullScreenView.videoSupported(video[0]));
  console.log("containerSupported", shapes.Factory.Classes.FullScreenView.containerSupported(container[0]));
  console.log("supported(container)", shapes.Factory.Classes.FullScreenView.supported(container[0]));
  console.log("supported(video)", shapes.Factory.Classes.FullScreenView.supported(video[0]));

  video.on('canplaythrough', function () {
    video[0].pause();
  });

  $("#btnFullScreen").click(function (e) {
    e.preventDefault();

    if (fsw && fsw.isFullScreen) {
      fsw.toggle();
      fsw = null;
      return;
    }

    var options = {
      wrapperClass: 'lw-video-test'
    };

    fsw = shapes.Factory.Classes.FullScreenView.forVideoWrapper(
      video[0],
      container[0],
      function (res) { },
      options
    );
    fsw.toggle();
  });

  $("#btnPlay").click(function (e) {
    e.preventDefault();
    video[0].play();
  });

  $("#btnPause").click(function (e) {
    e.preventDefault();
    video[0].pause();
  });
});
