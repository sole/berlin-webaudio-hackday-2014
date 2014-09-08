window.addEventListener('load', function() {
  
  var samplePath = '../_data/pewpew.ogg';
  var button = document.querySelector('button');
  var context = new AudioContext();
  var buffer;

  var request = new XMLHttpRequest();
  request.open('GET', samplePath, true);
  request.responseType = 'arraybuffer';
  request.onload = function() {
    context.decodeAudioData(request.response, loadedCallback, errorCallback);
  };
  request.send();

  function loadedCallback(data) {
    buffer = data;
    addListeners();
  }

  function errorCallback() {
    alert('No PEW PEW for you');
  }

  function addListeners() {
    button.addEventListener('click', pewpew);
    window.addEventListener('keyup', function(ev) {
      if(ev.keyCode !== 32) {
        return;
      }
      pewpew();
    });
  }

  function pewpew() {
    var bs = context.createBufferSource();
    bs.buffer = buffer;
    bs.connect(context.destination);
    bs.start();
  }


});
