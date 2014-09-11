function drawTimeDomainSample(canvas, bufferData) {
  var width = canvas.width;
  var height = canvas.height;
  var halfHeight = height * 0.5;
  var bufferLength = bufferData.length;
  var canvasContext = canvas.getContext('2d');
  canvasContext.fillStyle = 'rgb(0, 0, 0)';
  canvasContext.fillRect(0, 0, width, height);
  canvasContext.lineWidth = 3;
  canvasContext.strokeStyle = 'rgb(255, 0, 0)';
  canvasContext.beginPath();
  var sliceWidth = width * 1.0 / bufferLength;
  var x = 0;
  for(var i = 0; i < bufferLength; i++) {
    var v = bufferData[i];
    var y = ((v + 1) * halfHeight) ;
    // make the line be in the middle of the pixel for max sharpness
    var xr = Math.round(x) + 0.5;
    y = Math.round(y) + 0.5;
    if(i === 0) {
      canvasContext.moveTo(xr, y);
    } else {
      canvasContext.lineTo(xr, y);
    }
    x += sliceWidth;
  }
  canvasContext.lineTo(width, halfHeight);
  canvasContext.stroke();
}


function drawFrequencySample(canvas, bufferData, sampleRate) {
  var width = canvas.width;
  var height = canvas.height;
  var halfHeight = height * 0.5;
  var bufferLength = bufferData.length;
  var canvasContext = canvas.getContext('2d');
  var numBars = 8;
  var nyquist = sampleRate * 0.5;
  var minFrequency = 20;
  var maxFrequency = 11000;
  var frequency = minFrequency;
  var frequencySliceWidth = (maxFrequency - minFrequency) / numBars;
  
  canvasContext.fillStyle = 'rgb(0, 0, 0)';
  canvasContext.fillRect(0, 0, width, height);
  
  var sliceWidth = width * 1.0 / numBars;
  var x = 0;
  var barPos = 0;
  
  canvasContext.save();
  canvasContext.translate(0, height);
  canvasContext.scale(1, -1);

  canvasContext.fillStyle = 'yellow';
  
  for(var i = 0; i < numBars; i++) {
    var v = getFrequencyValue(frequency, nyquist, bufferData) * 0.01; // TODO what sort of scale is this?!

    canvasContext.beginPath();
    
    canvasContext.rect(x, 0, sliceWidth, -v * height); // x, y, width, height
    
    canvasContext.fill();

    x += sliceWidth;
    frequency += frequencySliceWidth;
  }

  canvasContext.restore();
}

function getFrequencyValue(frequency, nyquist, frequenciesBuffer) {
  var index = Math.round(frequency / nyquist * frequenciesBuffer.length);
  return frequenciesBuffer[index];
}

