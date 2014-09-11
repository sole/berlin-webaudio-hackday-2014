function Oscillator(context) {
  var gainNode;
  var node = null;
  var nodeNeedsNulling = false;
  var waveType = 'sine';
  var frequency = 440;

  gainNode = context.createGain();

  function ensureNodeIsLive() {
    if(nodeNeedsNulling || node === null) {
      node = context.createOscillator();
      node.type = waveType;
      node.frequency.value = frequency;
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

  Object.defineProperties(this, {
    'type': {
      'set': function(v) {
        waveType = v;
        if(node !== null) {
          node.type = v;
        }
      }
    },
    'frequency': {
      'set': function(v) {
        console.log('set', v);
        frequency = v;
        if(node !== null) {
          node.frequency.value = v;
        }
      }
    },
  });

}
