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
  
  var button = document.querySelector('button');
  var playing = false;
  var waveTypes = ['sine', 'square', 'triangle', 'sawtooth'];
  var waveIndex = 0;

  button.addEventListener('click', nextWave);
  requestAnimationFrame(animate);
  setWave(0);
  oscillator.start();

  function nextWave() {
    setWave((++waveIndex) % waveTypes.length);
  }

  function setWave(index) {
    var waveType = waveTypes[index];
    oscillator.type = waveType;
    button.innerHTML = waveType;
  }

  function animate() {
    requestAnimationFrame(animate);

    analyser.getFloatTimeDomainData(analyserTimeData);
    drawTimeDomainSample(analyserCanvas, analyserTimeData);
  }


});
