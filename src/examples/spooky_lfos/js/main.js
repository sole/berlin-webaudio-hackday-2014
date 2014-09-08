window.addEventListener('load', function() {

  // Create context as usual
  var context = new AudioContext();

  // Then the oscillator that we'll be hearing
  var osc = context.createOscillator();

  // Nodes for the LFO itself
  var lfoOsc = context.createOscillator();
  var gain = context.createGain();

  // Connect the oscillator to the context destination as usual
  osc.connect(context.destination);

  // Multiply the output of lfoOsc to make it go from [-1, 1] to [-gain, gain]
  // by connecting it to the gain node:
  lfoOsc.connect(gain);

  // Now use the multiplied output to modulate the frequency of the first oscillator:
  gain.connect(osc.frequency);
  gain.gain.value = 10;

  osc.frequency.value = 220;
  lfoOsc.frequency.value = 1;

  var playing = false;
  var playingMessage = 'No more SPOOKY';
  var stoppedMessage = 'Make it SPOOKY';

  var startButton = document.querySelector('button');
  startButton.addEventListener('click', toggle);
  startButton.removeAttribute('disabled');

  var slider = document.querySelector('input');
  slider.addEventListener('input', onSliderChange);

  function toggle() {
    if(playing) {
      osc.stop();
      startButton.setAttribute('disabled', '');
      playing = false;
      startButton.innerHTML = 'SPOOKINESS is over';
    } else {
      osc.start();
      lfoOsc.start();
      playing = true;
      startButton.innerHTML = playingMessage;
    }
  }

  function onSliderChange(ev) {
    var value = slider.value * 1.0;
    lfoOsc.frequency.value = value;
  }

});
