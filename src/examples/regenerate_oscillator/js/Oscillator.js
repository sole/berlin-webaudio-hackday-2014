function Oscillator(context) {
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

  this.start = function(when) {
    ensureNodeIsLive();

    if(when === undefined) {
      when = 0;
    }

    node.start(when);
    gainNode.gain.setValueAtTime(1, when);
  };

  this.stop = function(when) {
    if(node === null) {
      return;
    }

    if(when === undefined) {
      when = 0;
    }

    nodeNeedsNulling = true;
    node.stop(when);
    gainNode.gain.setValueAtTime(0, when);
  };

  this.output = gainNode;

}
