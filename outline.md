# Berlin Web Audio Hack Day 2014

## Why are we here?

Because we want to make noise on the web!

## I'm in! How?

Without using any plug-in! Just pure web technologies!

## Oh, I know, with <audio>, eh?

We *could* use the *not-so-new* HTML5 `<audio>` element. It is easy to use, right?

```javascript
<audio src="awesomesong.ogg" controls preload></audio>
```

That will:

- initiate a network request to load the file
- deal with decoding, streaming, buffering and outputting the result to the audio device
- render some basic audio controls
- display a progress indicator, time, etc, while playing

And `<audio>` elements can in addition:

- trigger a few events you can listen to: TODO
- has a few methods that you can use: TODO

but they have a few shortcomings:

- hard to accurately schedule sounds
- triggering multiple instances of the same sound simultaneously requires a bit of hack... and it's really hard to accurately schedule them (setTimeout... urgh)
- associated to a DOM element... so there's a certain overhead
- the output goes straight to the sound card output so we can't do fancy things with the decoded audio data
- in some systems (iOS I'm looking at you) when you trigger `play` on an `<audio>` element, the OS will display a fullscreen player overlay--so that *might possibly* ruin your UI design TODO confirm this

## Is it all over then? Do we just give up and start writing native apps already? :_(

No!

## Oh maybe we could use Flash...?

Get out of here. The exit is at the end of the room. Have a nice day!

## Web Audio to the rescue

- provides a set of modular units you can connect together to get as complex as you need
- it's also interoperable with other JS/Web APIs
- not attached to the DOM-so no rendering overhead
- runs in a separate thread-not blocking your UI
- 2014: supported in many browsers / platforms: Firefox, Firefox OS, Firefox for Android, Chrome, Chrome for Android, Chrome OS, Opera, Safari? - future: IE!? TODO confirm
- iOS doesn't go bonkers with Web Audio content TODO-confirm

## So how does it work?

Let me tell you a story...

### In the beginning there was the nothingness...

And we created an audio context

```javascript
var audioContext = new AudioContext();
```

An audio context is "where everything happens"--imagine it being a little self contained universe where sounds are generated and processed. It is also equivalent to a canvas' context: once we get a reference to it, we can call some methods on it to get "tools" and other useful stuff for setting up and controlling the audio graph.

### Wait, the audio graph? I thought this was about audio, not graphics O_O

And it is, we're not rendering anything on the screen. But we are instantiating and connecting things together, and that ends up generating a sort of flow chart also known as the audio graph.

### Show, don't tell

For example, let's start making some noise. We'll create an instance of `OscillatorNode`, which is one of the basic components for additive synthesis:

```javascript
var oscillator = audioContext.createOscillator();
```

We can't hear anything yet--because this thing we created is not connected anywhere. It's basically floating in the "audio context ether". So let's connect it:

```javascript
oscillator.connect(audioContext.destination);
```

And still we can't hear anything! We need to actually tell the oscillator to start doing its thing!

```javascript
oscillator.start(0);
```

`0` in this context means *hey context, do this now*. But we can schedule this action to happen sometime in the future, using the `currentTime` property of the context. For example, to start this three seconds from now:

```javascript
oscillator.start(audioContext.currentTime + 3);
```

Basically, any time you pass a value which is less than `currentTime`, it will be run immediately, or as immediately as the buffering allows--I'll speak more about buffers later.

Likewise, we can stop the oscillator either 'now' or some time from now:

```javascript
oscillator.stop(0); // now
oscillator.stop(audioContext.currentTime + 3); // three seconds from now
```

And now, suppose you'd want to start the oscillator again. The obvious would be to call `start` again, right?

```javascript
oscillator.start(0);
```

But nothing happens.

Why?

## Welcome to your first Web Audio GOTCHA

So the answer to "why" is "for performance reasons".

Some types of nodes are meant to be short lived and one-use only. Once you call `stop` on them, they will be disposed of by the garbage collector at some point (as long as you free all other references to them in your code--watch out for memory leaks otherwise!).

One solution is to create some kind of wrapping class that invisibly takes care of this for you. You could get more sophisticated, but imagine something like this:

```javascript
function Oscillator(context) {
	var node = null;
	var nodeNeedsNulling = false;

	function ensureNodeIsLive() {
		if(nodeNeedsNulling || node === null) {
			node = context.createOscillator();
		}
		nodeNeedsNulling = false;
	}

	this.start = function(when) {
		ensureNodeIsLive();
		node.start(when);
	};

	this.stop = function(when) {
		if(node === null) {
			return;
		}
		nodeNeedsNulling = true;
		node.stop(when);
	};
}
```

then you can use it as:

```javascript
var ctx = new AudioContext();
var osc = new Oscillator(ctx);

function restart() {
	osc.stop(0);
	osc.start(0);
}

osc.start(0);

setTimeout(restart, 1000);

```

TODO: review this for PROPERNESS--because how do you set the frequency values and etc if you can't access the node? and remapping all the node methods can be tedious, which we don't want.

### Can we play some other thing other than that beep?

Of course we can! Every node has different properties that we can change programmatically. For example, we could change the type of wave the oscillator will generate, using the `type` property:

```javascript
osc.type = 'square';
```
Possible types:

- `sine` (the default)
- `square`
- `sawtooth`
- `triangle`
- and `custom` (but I won't enter into that now)

Now suppose we want to change the frequency the oscillator is playing at, which would make it play a different note. Our first instinct would be to do this, right?

```javascript
osc.frequency = 123;
```

But that doesn't have any effect. That's because `frequency` is an special sort of property: its type is [AudioParam](http://webaudio.github.io/web-audio-api/#the-audioparam-interface), and what that means is that you access the `value` like this:

```javascript
osc.frequency.value = 123;
```

## More about AudioParams

You are probably wondering: "what is the point of having AudioParams instead of just simple attributes?" Well, you can access some powerful features that would not be available otherwise (or wouldn't perform as nicely).

### Scheduling changes with accurate timing

The first most interesting feature is that you can very precisely schedule changes to AudioParams.

For example, imagine we wanted to change an oscillator's frequency from 440 to 880 in 10 seconds. A naive approach would be to set an interval and continuously change the value until we reach the final one. But this is probably going to sound like "stepped", because the maximum precision that you can reach with `setInterval` or `setTimeout` is [limited](http://www.adequatelygood.com/Minimum-Timer-Intervals-in-JavaScript.html), so that means you can change the frequency only every `x` seconds instead of continuously. Or even worse: browsers usually throttle code running in background tabs, so it might be executed only once a second. Our ears are very good at detecting non continuous subtle pitch changes, so that "stepped" sound would sound very different to what you actually intended. Specially if you just can update audio frequencies once a second!

Example: stepped_sounds.

So how do we solve this with Web Audio? Well, AudioParams have a set of very useful methods we can use for this purpose, called *automation methods*:

- setValueAtTime() - SetValue
- linearRampToValueAtTime() - LinearRampToValue
- exponentialRampToValueAtTime() - ExponentialRampToValue
- setTargetAtTime() - SetTarget
- setValueCurveAtTime() - SetValueCurve

Internally the API keeps a list of timed events per AudioParam, and uses it to determine what should be the value for that parameter at any given moment. So for going linearly from 440 to 880, we should do this:

```javascript
osc.frequency.setValueAtTime(440, audioContext.currentTime);
osc.frequency.linearRampToValueAtTime(880, audioContext.currentTime + 3);
```

And the engine will make sure that the value changes continuously without "hiccups" or unexpected steps.

*Gotcha 1:* parameter automation requires you to specify the starting value using `setValueAtTime` with a value of `currentTime` for the time instead of just using `value`, because the engine interpolates between values in the event list, and setting `value` values doesn't add events into the list!

*Gotcha 2:* make sure you use `audioContext.currentTime` instead of `0` for the initial values. Setting them to `0` will work only once (I'm guessing it's some implementation detail, because the list is ordered).

#### Envelopes

You can use these functions to build more complex value changes--in music terms these are popularly called *envelopes*. A popular type of envelope that is used often in substractive synthesis is the [ADSR envelope](http://en.wikipedia.org/wiki/Synthesizer#ADSR_envelope).

(TODO picture)

It is quite typically used to describe the volume of notes, as it is relatively easy to configure and compute.

To implement it with Web Audio you would first create an instance of a new type of node: `GainNode`. This will let us control the output volume of whatever has been connected to its input:

```javascript
var ctx = new AudioContext();
var osc = ctx.createOscillator();
var gain = ctx.createGain(); // *** NEW

osc.connect(gain); // *** NEW
gain.connect(ctx.destination); // *** NEW
```

As you can see we connected the oscillator to the gain node and the gain node to the destination--and now we can either mute or super amplify the oscillator by changing the gain's `gain` value. The first stage is to describe the "attack-decay-sustain" phase, which will be started when a note is "on" (typically when you press a keyboard key, or when you strum a string):

```javascript
// Attack/decay/sustain
gain.gain.setValueAtTime(0, audioContext.currentTime);
gain.gain.linearRampToValueAtTime(1, audioContext.currentTime + attackLength);
gain.gain.linearRampToValueAtTime(sustainValue, audioContext.currentTime + decayLength);
```

and hold it there in the `sustainValue` until the envelope is *released* (when the user releases the key, or the piano pedal-in a guitar you can't really sustain the note for long). Then the second stage is implementing the "release" phase, which is just a fade out:

```javascript
gain.gain.linearRampToValueAtTime(0, audioContext.currentTime + releaseLength);
```

Don't do like me and [implement this](https://github.com/sole/sorollet.js/blob/master/src/core/ADSR.js) by calculating the values manually in JS and using `setInterval` and `setTimeout`--you will miss events and things will sound weird, and get worse the more events and the faster they are supposed to happen!

Each instrument has its own typical volume envelope, and you can get many interesting effects by playing with these values.

Example: envelopes example. Using both scheduling and clearing scheduled values.

### Cancelling scheduled events

Suppose we decide to totally stop whatever we are playing, but we've scheduled events in the future already. We can clear the list of events with [`cancelScheduledValues(startTime)`](http://webaudio.github.io/web-audio-api/#widl-AudioParam-cancelScheduledValues-void-double-startTime). For example:

```javascript
osc.frequency.cancelScheduledValues(audioContext.currentTime);
```

cancels all events scheduled after `currentTime`.

I already used this function in the previous example!

### Modulating properties

We can also connect the output of one node to another node's property--so you can build complex sounds by composing them in this manner! This is probably the best example of why Web Audio being modular is so cool. For example, let's suppose we want to build another common component of substractive synthesis: an LFO.

#### LFOs

TODO picture

LFOs stand for *Low Frequency Oscillators*, and they are often used for modulating other parameters' values. They are, in essence, just another oscillator, but instead of running at frequencies that humans can hear (roughly: above 20Hz), they run at lower frequencies. We can't hear them--but they can alter sound that is running in a frequency we can hear, and so those subtle changes we can definitely hear, as we saw in the stepped sounds example before!

Let's make some spooky sounds out of a 50's horror movie!

We first create a context and an oscillator, and connect the oscillator to the context's destination, as usual-nothing different so far.

```javascript
var context = new AudioContext();
var osc = context.createOscillator();
```

But now we'll set up some more nodes to simulate the circuitry of an LFO component. First we create the low frequency oscillator.

```javascript
var lfOsc = context.createOscillator();
```

It's just like the other oscillator! No surprises here.

Oscillators only output values between -1 and 1. But modulating a frequency by only these values is maybe too small to be appreciated, so we need to find a way to multiply these values. We can use a GainNode! Remember when I said it also was a multiplier? If we connect the output of the low frequency oscillator to a gain node where the values are bigger than 1 we'll be able to widen the output range of this oscillator:

```javascript
var gain = context.createGain();
lfOsc.connect(gain); // the output from gain is the [-1, 1] range
gain.gain.value = 100; // now the output from gain is in the [-100, 100] range!
```

The difference here is that we won't connect this output to the `destination`--but to the `frequency` parameter of the first oscillator:

```javascript
gain.connect(osc.frequency);
```

And before we get the thing started, we'll make sure the oscillators are configured with the proper frequencies to generate the right effect:

```javascript
osc.frequency.value = 440;
lfOsc.frequency.value = 1; // oscillation frequency is 1Hz = once per second
osc.start();
lfOsc.start();
```

Example: spooky lfos.

## Intermission: the audio thread vs the UI thread: two parallel lives

// ...
TODO: why did I want to explain this here?

## Playing existing samples

While it's great to synthesise things from scratch, sometimes it's just easier to load an existing sample. There are two approaches to this with Web Audio, depending on how long the sample is. If it's a short sample, you should use `AudioBufferSourceNode`s as they keep the entire decoded data in memory, ready to be played. For example: bullet sounds in games. For longer samples you should use the `MediaElementAudioSourceNode`, which allows you to stream the contents of the sample as they are needed for playing.

### AudioBuffer + AudioBufferSourceNode

Suppose we want to build a *pewpewmatic*. It just fires a *pew* sample each time we press space! 

Let's start by creating an audio context as usual, but this time, instead of creating an `OscillatorNode` we'll create an `AudioBufferSourceNode`:

```javascript
var context = new AudioContext();
var pewSource = context.createBufferSource();
```

Now we need to get the sample data from somewhere--we need to load a file that the browser can decode (OGG, MP3, WAV). Web Audio doesn't get any esoteric here; you just use a normal XMLHttpRequest to load the file:

```javascript
var request = new XMLHttpRequest();
request.open('GET', samplePath, true);
```

... but with some 'peculiarities'. We want to get access to the binary data, 'as is', so we'll be asking for the response in an ArrayBuffer:

```javascript
request.responseType = 'arraybuffer'; // we want binary data 'as is'
```

And once it is loaded and we have the binary data, there's still one more step left: decoding it!

```javascript
request.onload = function() {
	context.decodeAudioData(request.response, loadedCallback, errorCallback);
};
```

The success callback will get the already decoded `BufferSource`, ready to use. The error callback gets a `DOMException`, but for this particular example we'll just ignore it:

```javascript
function loadedCallback(bufferSource) {
	buffer = bufferSource;
}

function errorCallback() {
	alert('No PEW PEW for you');
}
```

Assuming we loaded the file and decoded the buffer, we can create the `AudioBufferSourceNode` now and assign it the newly decoded buffer:

```javascript
var abs = context.createBufferSource();
abs.buffer = buffer;

```

We're ready to play this! And good news, the interface for starting and stopping buffer sources is exactly the same as with oscillators:

```javascript
abs.start(when);
abs.stop(when);
```

so you can schedule buffer sources with precision too.

But the similarities don't stop here--once a buffer source has played through the entirety of the buffer, or once you stop it, you can't call start on it again. Or well, you can, but it doesn't have any effect. You have to create another instance of buffer source, but the good news is that you don't need to reload the buffer data gain, since it's already loaded and decoded: you just need to assign it as the `buffer` property of the new `AudioBufferSourceNode`.

Taking this into account, here's the pewpewmatic:

example: pewpewmatic

We can also generate the buffer programmatically by writing float values to an `ArrayBuffer`. For example you could generate noise samples instead of downloading them--so you save on bandwidth and storage. You can ask me about this if you're interested, but [here's an example](https://github.com/sole/supergear/blob/master/src/NoiseGenerator.js) anyway.

### MediaElementAudioSourceNode

For longer sounds (e.g. longer than a minute) it is recommended to use the `MediaElementAudioSourceNode`. Those take an `<audio>` or `<video>` element and incorporate their output into the audio graph, so you can manipulate them as if they were any other sort of module!

```javascript
var video = document.querySelector('video');
var audioSourceNode = context.createMediaElementAudioSource(video);
audioSourceNode.connect(context.destination);
```

Example: mediaelement

Scheduling with these is a little bit less predictable as they have to be streamed, buffered, decoded, etc... but in return you don't use all your memory to hold a decoded mp3 ready to be played, so that's a good trade-off!

Tip: you can also use `getUserMedia` to get live microphone input! Here's [an example](https://github.com/sole/lxjs2014/blob/master/src/examples/03_realtimevis/main.js#L93-L102) - basically you use the returned stream from `getUserMedia` and use it in place of any video or audio element when creating an instance of MediaElementSource..

## Analysing the sound

Web Audio also provides with functionality to help you analyse what is going on. The node type for this is called, not very surprisingly, AnalyserNode. It mostly works like other nodes, in which we create an instance and connect something to it--but it doesn't generate or transform sound. It simply... analyses it. The results of this analysis will be dumped into an array buffer, and then we can do whatever we want with them.

For example, let's suppose we want to analyse the output of the video in the previous example. We create the analyser and configure it:

```javascript
var analyser = context.createAnalyser();
analyser.fftSize = 2048;
var analyserData = new Float32Array(analyser.frequencyBinCount);
```

`analyserData` is the `ArrayBuffer` where results will be dumped into each time we ask the analyser node for fresh data. This is done in the `animate` function, each time we need to update the screen:

```javascript
analyser.getFloatTimeDomainData(analyserData);
drawSample(canvas, analyserData);
```

We also need to *connect* some input to the analyser node, so that it has *something* to analyse:

```javascript
gain.connect(analyser);
```

You don't need to connect the analyser to anything if you don't want to. It will just return the same input signal, which is useful if you're chaining several things together.

I'll spare you the details of how to draw the sample--it's just canvas drawing methods that I abstracted into a function.

### Byte or Float?

gotchas: what was actually returned? depending on if you use getFloatFrequencyData or getByteFrequencyData


## Altering the sound: 3D and FX time!

There are still more nodes that come with built-in functionality for us: delay, filter, panning, reverb... They are very useful for games because you can just USE those instead of writing the DSP code yourself! Plus they are native code which means they should be more efficient. Using these will allow you to give your audio code a more realistic touch. And also, they make experimenting with 3D sound really easy!


Quick examples -> gain, delay, filter, panning, reverb is a little bit more involved because it requires to load an impulse response file which describes how a given environment shapes the sound, so you can apply that "response" to any input

And of course the parameters for these nodes can be modulated using the output from other nodes.


## Gotchas

- Older implementations use prefixed constructor, older node names and constants we don't use anymore. But we have Chris Wilson's monkey patch library (TODO) and this article on how to write audio code that works in every browser
- trying to use buffers before they're actually loaded
- In Chrome you can't new too many AudioContexts. ScriptNodes can be starved by holding up event loop for too long. https://twitter.com/ntt/status/505357514645311489
- The mapping from simpler LR pan (like on a mixer) parameter to the PannerNode x,y,z is kinda messy. http://stackoverflow.com/questions/14378305/how-to-create-very-basic-left-right-equal-power-panning-with-createpanner/14412601#14412601 https://twitter.com/ntt/status/505358246773665792
- you can only have one audio context so why the need for a constructor? https://twitter.com/JoshMock/status/505370597187395585 - NOT REALLY http://lists.w3.org/Archives/Public/public-audio/2014JulSep/0153.html

## Being mobile friendly

Detect if you're on mobile, probably reduce the number of nodes you're using or the processing type. For example:
- in a game you would want to play less sounds simultaneously
- or if using `PannerNode`, the `HRTF` panning model is more accurate but also more computationally expensive. You can probably get away with just using `equalpower`
- shorten release times if you can afford it - so the node ends playing a little bit earlier. Less atmospheric but might be marginally more efficient?
- use smaller audio assets (e.g. instead of 44KHz OGG files use just 22KHz) so they're faster to decode. Most people in mobile are just using crappy earphones and probably won't notice if the sound is a little bit worse, but the experience will be faster and smoother.
- detect when your app goes to the background and stop processing further events


## Advanced Web Audio techniques

Topics for Web Audio Hackday 202 or just to get you excited in case you weren't not excited enough already

- Web Audio workers (still during specification process / development / not implemented)
	- replacing the ScriptProcessors because UI thread blocking === bad
- OfflineAudioContext - same "online" tools but offline so you can render as fast as possible without overhead

## More info

Let me know if I'm missing any links!

- Web Audio
	- [API specification](http://webaudio.github.io/web-audio-api/)
	- [Mailing list](http://lists.w3.org/Archives/Public/public-audio/)
	- [Developers mailing list](http://lists.w3.org/Archives/Public/public-audio-dev/)
- The [Web Audio API book](http://chimera.labs.oreilly.com/books/1234000001552/index.html) by Boris Smus
- Talks:
	- Chris Wilson: [Turning the web up to 11](https://www.youtube.com/watch?v=hFsCG7v9Y4c) @ Google I/O 2012 - [deck](http://webaudio-io2012.appspot.com/) - many method names have changed since then, a lot happens in two years!
	- Chris Wilson: [Making the web rock](https://www.youtube.com/watch?v=wZrNI-86zYI) @ HTMLDevConf 2013 - [deck](http://webaudiodemos.appspot.com/slides/)
	- Stuart Memo: [Javascript is the new punk rock](http://www.youtube.com/watch?v=PN8Eg1K9xjE) @ JSConf.EU 2012
	- Paul Adenot: [Web Audio API at FOSDEM 2014](http://ftp.osuosl.org/pub/fosdem//2014/UD2218A/Saturday/Web_Audio_API.webm)
	- Jordan Santell: [Signal Processing with the Web Audio API](http://www.youtube.com/watch?v=YBQ5pzvgbOE) @ JSConf.us 2014 - [deck code](https://github.com/jsantell/dsp-with-web-audio-presentation) [online deck](http://jsantell.github.io/dsp-with-web-audio-presentation/)
	- Soledad Penades: [Audio for the masses](http://www.youtube.com/watch?v=Bqj9LDszlDY) @ LXJS 2014 - [deck](http://soledadpenades.com/files/t/lxjs2014/) [write up](http://soledadpenades.com/2014/08/15/audio-for-the-masses/)
	- Soledad Penades: [Web Audio + Web Components = Audio tags](http://www.youtube.com/watch?v=SCBbd5N4fho) @ Cascadia JS 2013 - [deck](http://soledadpenades.com/files/t/cascadiajs-audio-tags/) [writeup](http://soledadpenades.com/2013/11/24/audio-tags-web-components-web-audio-love-the-video/)
	- Soledad Penades: [Four to the floor JavaScript](http://soledadpenades.com/2013/10/23/four-to-the-floor-javascript-the-video/) @ JSConf.EU 2013 - [deck](https://github.com/sole/4x4JS/)
- Articles and newsletters
	- Chris Wilson: [A tale of two clocks - Scheduling Web Audio with precision](http://www.html5rocks.com/en/tutorials/audio/scheduling/) - how to accurately schedule events in Web Audio
	- Chris Lowis' [Web Audio Weekly](http://blog.chrislowis.co.uk/waw.html) newsletter
