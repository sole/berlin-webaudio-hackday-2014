function Voice(context) {
  var gainNode;
  var node = null;
  var nodeNeedsNulling = false;

  gainNode = context.createGain();

  function ensureNodeIsLive() {
    if(nodeNeedsNulling || node === null) {
      node = context.createOscillator();
      node.type = 'triangle';
      node.connect(gainNode);
    }
    nodeNeedsNulling = false;
  }

  this.attack = 0.5;
  this.decay = 0.5;
  this.sustain = 0.5;
  this.release = 1;


  var self = this;
  function logValues() {

    var s = ['attack', 'decay', 'sustain', 'release']
      .map(function(v) {
        return v + ' ' + self[v] + ' ' + typeof(self[v]);
      }).join(' / ');

    console.log(s);

  }

  this.noteOn = function(when) {

    ensureNodeIsLive();
    // logValues();
    gainNode.gain.cancelScheduledValues(when);
    gainNode.gain.setValueAtTime(0, when);
    gainNode.gain.linearRampToValueAtTime(1, when + this.attack);
    gainNode.gain.linearRampToValueAtTime(this.sustain, when + this.attack + this.decay);

    node.start(when);

  };

  this.noteOff = function(when) {
    nodeNeedsNulling = true;
    gainNode.gain.linearRampToValueAtTime(0, when + this.release);
    node.stop(when + this.release);
  };

  this.output = gainNode;

}
