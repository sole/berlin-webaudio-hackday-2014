window.addEventListener('load', function() {
  
  var input = document.querySelector('input');
  var video = document.querySelector('video');
  var context = new AudioContext();
  var gain = context.createGain();
  var lfOsc = context.createOscillator();
  var lfGain = context.createGain();
  var mediaElement = context.createMediaElementSource(video);
  var analyser = context.createAnalyser();
  analyser.fftSize = 256;
  var analyserTimeData = new Float32Array(analyser.frequencyBinCount);
  var analyserFreqData = new Float32Array(analyser.frequencyBinCount);

  gain.gain.value = 0.5;
  mediaElement.connect(gain);
  gain.connect(context.destination);
  gain.connect(analyser);

  lfOsc.connect(lfGain);
  lfGain.gain.value = 0.5;
  lfGain.connect(gain.gain);
  lfOsc.frequency.value = 0;
  lfOsc.type = 'sine';
  lfOsc.start();

  input.addEventListener('input', function() {
    lfOsc.frequency.value = input.value * 1.0;
  });
  input.value = lfOsc.frequency.value;

  var canvasTime = document.getElementById('canvasTime');
  var canvasFrequency = document.getElementById('canvasFreq');
  animate();

  function animate(t) {

    requestAnimationFrame(animate);

    analyser.getFloatTimeDomainData(analyserTimeData);
    drawTimeDomainSample(canvasTime, analyserTimeData);

    analyser.getFloatFrequencyData(analyserFreqData);
    drawFrequencySample(canvasFrequency, analyserFreqData, context.sampleRate);

  }

});
