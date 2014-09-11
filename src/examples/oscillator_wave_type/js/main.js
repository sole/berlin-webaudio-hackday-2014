window.addEventListener('load', function() {

  var context = new AudioContext();
  var oscillator = new Oscillator(context);
  var analyser = context.createAnalyser();
  analyser.fftSize = 512;
  var analyserCanvas = document.querySelector('canvas');
  var analyserTimeData = new Float32Array(analyser.frequencyBinCount);

  oscillator.frequency = 100;
  oscillator.output.connect(analyser);
  analyser.connect(context.destination);
  
  var btnWave = document.getElementById('btnWave');
  var btnPlay = document.getElementById('btnPlay');
  var playing = false;
  var waveTypes = ['sine', 'square', 'triangle', 'sawtooth'];
  var waveIndex = 0;

  btnPlay.addEventListener('click', togglePlay);

  btnWave.addEventListener('click', nextWave);
  requestAnimationFrame(animate);
  setWave(0);

  function togglePlay() {
    if(playing) {
      btnPlay.innerHTML = 'play';
      oscillator.stop();
    } else {
      btnPlay.innerHTML = 'stop';
      oscillator.start();
    }
    playing = !playing;
  }

  function nextWave() {
    setWave((++waveIndex) % waveTypes.length);
  }

  function setWave(index) {
    var waveType = waveTypes[index];
    oscillator.type = waveType;
    btnWave.innerHTML = waveType;
  }

  function animate() {
    requestAnimationFrame(animate);

    analyser.getFloatTimeDomainData(analyserTimeData);
    drawTimeDomainSample(analyserCanvas, analyserTimeData);
  }


});
