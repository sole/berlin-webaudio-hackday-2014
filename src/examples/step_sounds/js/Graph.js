function Graph(title, easing) {

  'use strict';

	var div,
		canvas, context,
		playDiv,
		position = { },
		position_old = { },
		tweenX, tweenY,
		audio, audioSource,
		sampleBuilt = false,
		sampleLength = 2000, // in milliseconds, used in the tweens too
		sampleFadeOutDivider = 8;

	EventTarget.call( this );

	div = document.createElement( 'div' );
	div.className = 'disabled graph';

	canvas = document.createElement( 'canvas' );
	canvas.width = 180;
	canvas.height = 100;

	context = canvas.getContext( '2d' );

	div.appendChild( document.createTextNode( title ) );
	div.appendChild( canvas );

	playDiv = document.createElement( 'div' );
  playDiv.innerHTML = '<div>▶</div>';
	playDiv.className = 'play';

	audio = document.createElement( 'audio' );

	resetCanvas();

	this.domElement = div;
	this.easing = easing;
	this.audio = audio;
	div.appendChild(audio);

	this.resetCanvas = resetCanvas;
	this.buildSample = buildSample;

	return this;

	//

	function resetCanvas() {

		context.fillStyle = 'rgb(250, 250, 250)';
		context.fillRect( 0, 0, 180, 100 );

		context.lineWidth = 0.5;
		context.strokeStyle = 'rgb(230, 230, 230)';

		context.beginPath();
		context.moveTo(0, 20);
		context.lineTo(180, 20);
		context.moveTo(0, 80);
		context.lineTo(180, 80);
		context.closePath();
		context.stroke();

		if(!sampleBuilt) {
			return;
		}

		context.lineWidth = 2;
		context.strokeStyle = 'rgb(255, 127, 127)';

		if(tweenX !== undefined) {
			tweenX.stop();
		}

		if(tweenY !== undefined) {
			tweenY.stop();
		}

		position = { x: 5, y: 80 },
				 position_old = { x: 5, y: 80 },
				 tweenX = new TWEEN.Tween( position );
		tweenY = new TWEEN.Tween( position )
			.easing( easing )
			.onUpdate(function() {

				context.beginPath();
				context.moveTo( position_old.x, position_old.y );
				context.lineTo( position.x, position.y );
				context.closePath();
				context.stroke();

				position_old.x = position.x;
				position_old.y = position.y;

			});

		var realSampleLength = Math.round( sampleLength - sampleLength/sampleFadeOutDivider );
		tweenX.to( { x: 175 }, realSampleLength ).start();
		tweenY.to( { y: 20 }, realSampleLength ).start();

	}

	// Function (mostly) taken from possan's jsmod
	// https://github.com/possan/jsmod/blob/master/streamer.js
	function getWaveData(data, sampleRate) {
		var n = data.length;
		var integer = 0, i = 0;
		var header = "RIFF<##>WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00<##><##>\x01\x00\x08\x00data<##>";
		function insertLong(value) {
			var bytes = "";
			for (i = 0; i < 4; i++) {
				bytes += String.fromCharCode(value % 256);
				value = value >> 8;
			}
			header = header.replace('<##>', bytes);
		}
		insertLong(36 + n);
		insertLong(sampleRate);
		insertLong(sampleRate);
		insertLong(n);
		for ( var i = 0; i < n; ++i) {
			header += String.fromCharCode(Math.round(Math.min(1, Math.max(-1,
								data[i])) * 126 + 128));
		}
		return 'data:audio/wav;base64,' + btoa(header);
	}

	function buildSample() {
		var buffer = [],
			length = sampleLength / 1000, // in seconds
			sampleRate = 44100,
			numSamples = length * sampleRate,
			k,
			t = 0;

		for(var i = 0; i < numSamples; i++) {
			k = i / numSamples;
			var pitch = 200 + 1800 * easing(k),
				cst = 2.0 * Math.PI * pitch * 1.0 / sampleRate;
			buffer.push( Math.sin( cst * t ) );
			t++;
		}

		var lastValue = buffer[ buffer.length - 1 ];

		var threshold = 0.15, extra = 0;
		var numExtra = buffer.length / sampleFadeOutDivider;
		for(var i = 0; i < numExtra; i++) {
			buffer[ buffer.length - 1 - i ] *= i / numExtra;
		}

		audioSource = document.createElement( 'source' );
		audioSource.type = 'audio/wav';
		audio.appendChild(audioSource);

		audioSource.src = getWaveData(buffer, sampleRate);

    audio.addEventListener('canplaythrough', function() {
      console.log('YA', audio);
    });

		sampleBuilt = true;

		div.classList.remove('disabled');
    div.classList.add('ready');
		div.appendChild(playDiv);

		resetCanvas();

		this.domElement.addEventListener('click', function() {
			audio.addEventListener('timeupdate', function updateFn(e) {
				resetCanvas();
				this.removeEventListener('timeupdate', updateFn);
			}, false);
			audio.pause();
			audio.currentTime = 0;
			audio.play();
		}, false);

		this.dispatchEvent( {type: 'sampleBuilt' })
	}

}

