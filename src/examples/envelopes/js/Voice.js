function Voice(context) {
  var gainNode;
  var node = null;
  var nodeNeedsNulling = false;

  gainNode = context.createGain();

  function ensureNodeIsLive() {
    if(nodeNeedsNulling || node === null) {
      node = context.createOscillator();
      node.connect(gainNode);
    }
    nodeNeedsNulling = false;
  }

  this.attack = 0.5;
  this.decay = 0.5;
  this.sustain = 0.5;
  this.release = 1;

  this.noteOn = function(when) {

    ensureNodeIsLive();
    gainNode.gain.cancelScheduledValues(when);
    gainNode.gain.setValueAtTime(0, when);
    gainNode.gain.linearRampToValueAtTime(1, when + this.attack);
    gainNode.gain.linearRampToValueAtTime(this.sustain, when + this.attack + this.decay);

    node.start(when);

  };

  this.noteOff = function(when) {
    nodeNeedsNulling = true;
    gainNode.gain.linearRampToValueAtTime(0, when + this.decay);
    node.stop(when + this.decay);
  };

  this.output = gainNode;

}
