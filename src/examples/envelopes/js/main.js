window.addEventListener('load', function() {

  var context = new AudioContext();
  var voice = new Voice(context);
  voice.output.connect(context.destination);

  var playing = false;

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  function onKeyDown(ev) {

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

});
