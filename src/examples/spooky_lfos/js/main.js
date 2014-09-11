window.addEventListener('load', function() {

  // Create context as usual
  var context = new AudioContext();

  // Then the oscillator that we'll be hearing
  var osc = context.createOscillator();

  // Nodes for the LFO itself
  var lfOsc = context.createOscillator();
  var gain = context.createGain();

  // Analyser
  var analyser = context.createAnalyser();

  // Connect the oscillator to the analyser so we can see what's up
  osc.connect(analyser);
  analyser.connect(context.destination);

  // Multiply the output of lfoOsc to make it go from [-1, 1] to [-gain, gain]
  // by connecting it to the gain node:
  lfOsc.connect(gain);

  // Now use the multiplied output to modulate the frequency of the first oscillator:
  gain.connect(osc.frequency);
  gain.gain.value = 0;

  osc.frequency.value = 440;
  lfOsc.frequency.value = 1;

  var canvas = document.querySelector('canvas');
    analyser.fftSize = 1024;
  var analyserTimeData = new Float32Array(analyser.frequencyBinCount);

  var playing = false;
  var playingMessage = 'No more SPOOKY';
  var stoppedMessage = 'Make it SPOOKY';

  var startButton = document.querySelector('button');
  startButton.addEventListener('click', toggle);
  startButton.removeAttribute('disabled');

  var rateSlider = document.getElementById('rate');
  rateSlider.addEventListener('input', onRateChange);
  rateSlider.value = lfOsc.frequency.value;

  var depthSlider = document.getElementById('depth');
  depthSlider.addEventListener('input', onDepthChange);
  depthSlider.value = gain.gain.value;

  requestAnimationFrame(animate);

  function toggle() {
    if(playing) {
      osc.stop();
      startButton.setAttribute('disabled', '');
      playing = false;
      startButton.innerHTML = 'SPOOKINESS is over';
    } else {
      osc.start();
      lfOsc.start();
      playing = true;
      startButton.innerHTML = playingMessage;
    }
  }

  function onRateChange(ev) {
    var value = rateSlider.value * 1.0;
    lfOsc.frequency.value = value;
  }

  function onDepthChange(ev) {
    var value = depthSlider.value * 1.0;
    // we don't want to send the oscillator to play on negative frequencies
    // so we'll just modulate using the current osc frequency as multiplier and not a hardcoded value
    gain.gain.value = value * osc.frequency.value;
  }

  function animate() {
    requestAnimationFrame(animate);

    analyser.getFloatTimeDomainData(analyserTimeData);
    drawTimeDomainSample(canvas, analyserTimeData);
  }

});
