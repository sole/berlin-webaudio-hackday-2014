window.addEventListener('load', function() {

  var context = new AudioContext();
  var voice = new Voice(context);
  voice.output.connect(context.destination);

  var playing = false;

  ['attack', 'decay', 'sustain', 'release'].forEach(setADSRListener);

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  function onKeyDown(ev) {

    ev.preventDefault();

    if(ev.keyCode !== 32 || playing) { // space
      // we don't care
      return;
    }

    noteOn();

  }

  function onKeyUp(ev) {
    if(ev.keyCode !== 32) {
      return;
    }
    
    noteOff();
  }

  function noteOn() {
    playing = true;
    console.log('note on');
    voice.noteOn(context.currentTime);
  }

  function noteOff() {
    playing = false;
    console.log('note off');
    voice.noteOff(context.currentTime);
  }

  function setADSRListener(parameter) {
    var input = document.getElementById(parameter);
    var valueLabel = document.createElement('span');
    input.parentNode.appendChild(valueLabel);
    
    input.step = 0.1;
    input.value = voice[parameter];
    valueLabel.innerHTML = voice[parameter];
    
    input.addEventListener('input', function() {
      voice[parameter] = this.value * 1.0;
      valueLabel.innerHTML = this.value;
    });

  }

});
