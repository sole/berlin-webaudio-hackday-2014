window.addEventListener('load', function() {

  var context = new AudioContext();
  var oscillator = new Oscillator(context);
  oscillator.output.connect(context.destination);
  
  var button = document.querySelector('button');
  var playing = false;
  var messagePlaying = 'stop';
  var messageStopped = 'beep';

  button.addEventListener('click', togglePlay);

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


});
