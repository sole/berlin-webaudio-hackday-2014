window.addEventListener('load', function() {

  var context = new AudioContext();
  var oscillator = new Oscillator(context);
  var analyser = context.createAnalyser();
  analyser.fftSize = 512;
  var analyserCanvas = document.querySelector('canvas');
  var analyserTimeData = new Float32Array(analyser.frequencyBinCount);

  oscillator.output.connect(analyser);
  analyser.connect(context.destination);
  
  var button = document.querySelector('button');
  var playing = false;
  var messagePlaying = 'stop';
  var messageStopped = 'beep';

  button.addEventListener('click', togglePlay);
  requestAnimationFrame(animate);

  function togglePlay() {
    console.log('toggle', playing);
    if(playing) {
      oscillator.stop();
      button.innerHTML = messageStopped;
    } else {
      oscillator.start();
      button.innerHTML = messagePlaying;
    }
    playing = !playing;
  }

  function animate() {
    requestAnimationFrame(animate);

    analyser.getFloatTimeDomainData(analyserTimeData);
    drawTimeDomainSample(analyserCanvas, analyserTimeData);
  }


});
