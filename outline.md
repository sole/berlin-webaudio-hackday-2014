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

Basically, any time you pass a value which is less than `currentTime`, it will be run immediately, or as immediately as the buffering allows *more on this later TODO.

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

One option is to create some kind of wrapping class that invisibly takes care of this for you. You could get more sophisticated, but imagine something like this:

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

TODO: change type first and frequency later so the audioparam is introduced

Of course we can! Every node has different properties that we can change programmatically. they are not just plain JavaScript object properties; they are [AudioParam](http://webaudio.github.io/web-audio-api/#the-audioparam-interface)s, which means that they are accessed slightly differently. For example suppose we want to change the frequency the oscillator is playing at. Instead of doing this:

```javascript
osc.frequency = 123;
```

you need to use the `.value` property of the `frequency` AudioParam:

```javascript
osc.frequency.value = 123;
```

We could also change the type of wave the oscillator will generate, with the `type` property:

```javascript
osc.type = 'square';
```

Note how `type` is not an AudioParam, but a simple attribute, so we simply change its value straight away. Possible types:

- `sine` (the default)
- `square`
- `sawtooth`
- `triangle`
- and `custom` (but I won't enter into that now)

## Gotchas

- Older implementations use prefixed constructor, older node names and constants we don't use anymore. But we have Chris Wilson's monkey patch library (TODO) and this article on how to write audio code that works in every browser
- For performance reasons (TODO investigate & look for the exact details) some Nodes are one use only-need to recreate them everytime you call `stop` on them
- setValue at time won't interpolate if you haven't set an initial value for the ramp using another set* function already
- trying to use buffers before they're actually loaded
- In Chrome you can't new too many AudioContexts. ScriptNodes can be starved by holding up event loop for too long. https://twitter.com/ntt/status/505357514645311489
- The mapping from simpler LR pan (like on a mixer) parameter to the PannerNode x,y,z is kinda messy. http://stackoverflow.com/questions/14378305/how-to-create-very-basic-left-right-equal-power-panning-with-createpanner/14412601#14412601 https://twitter.com/ntt/status/505358246773665792
- you can only have one audio context so why the need for a constructor? https://twitter.com/JoshMock/status/505370597187395585 - NOT REALLY http://lists.w3.org/Archives/Public/public-audio/2014JulSep/0153.html

## Advanced Web Audio techniques

Topics for Web Audio Hackday 202 or just to get you excited in case you weren't not excited enough already

- Web Audio workers (still during specification process / development / not implemented)
	- replacing the ScriptProcessors because UI thread blocking === bad
- OfflineAudioContext - same "online" tools but offline so you can render as fast as possible without overhead

## More info

TODO fill in missing links

- Web Audio
	- API specification
	- Mailing list
	- Users mailing list
- The [Web Audio API book](http://chimera.labs.oreilly.com/books/1234000001552/index.html) by Boris Smus
- Talks:
	- Chris Wilson: [Turning the web up to 11](https://www.youtube.com/watch?v=hFsCG7v9Y4c) @ Google I/O 2012 - [deck](http://webaudio-io2012.appspot.com/) - many method names have changed since then, a lot happens in two years!
	- Chris Wilson: [Making the web rock](https://www.youtube.com/watch?v=wZrNI-86zYI) @ HTMLDevConf 2013 - [deck](http://webaudiodemos.appspot.com/slides/)
	- Stuart Memo: [Javascript is the new punk rock]() @ JSConf.EU 2012 - [deck]()
	- Paul Adenot: @ BCN Hackday 2014 - [deck]()
	- Jordan Santell: @ JSConf.us 2014 - [deck]()
	- Soledad Penades: [Audio for the masses]() @ LXJS 2014 - [deck]()
	- Soledad Penades: [Web Audio + Web Components = Audio tags]() @ Cascadia JS 2013 - [deck]()
	- Soledad Penades: [Four to the floor JavaScript]() @ JSConf.EU 2013 - [deck]()
