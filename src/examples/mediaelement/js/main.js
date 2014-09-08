window.addEventListener('load', function() {
  
  var input = document.querySelector('input');
  var video = document.querySelector('video');
  var context = new AudioContext();
  var gain = context.createGain();
  var lfOsc = context.createOscillator();
  var lfGain = context.createGain();
  var mediaElement = context.createMediaElementSource(video);

  mediaElement.connect(gain);
  gain.connect(context.destination);

  lfOsc.connect(lfGain);
  lfGain.gain.value = 0.65;
  lfGain.connect(gain.gain);
  lfOsc.frequency.value = 0;
  lfOsc.type = 'sine';
  lfOsc.start();

  input.addEventListener('input', function() {
    lfOsc.frequency.value = input.value * 1.0;
  });
  input.value = lfOsc.frequency.value;

});
