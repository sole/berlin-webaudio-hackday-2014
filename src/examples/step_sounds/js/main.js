(function() {
	var graphs_list = [
		[
			[ 'Linear', TWEEN.Easing.Linear.None ], 
			[ '10 steps', tenStepsEasing ],
			[ '20 steps', getNStepsEasing(20) ]
		]
	],
	graphs = [],
	graphsToInit = [],
	container;

	function animate() {

		requestAnimationFrame(animate);
		TWEEN.update();

	}

	function initNextGraph() {

		if(graphsToInit.length == 0) {
			return;
		}

		var nextGraph = graphsToInit.shift();

		nextGraph.addEventListener('sampleBuilt', function(event) {
			setTimeout(initNextGraph, 300);
		});

		nextGraph.buildSample();
	}


	function init() {

		container = document.getElementById('container');

		graphs_list.forEach(function(row) {

			row.forEach(function(data) {

				var title = data[0];
				var tweenEasing = data[1];
				var graph = new Graph(title, tweenEasing);

				graphs.push( graph );
				graphsToInit.push( graph );
				container.appendChild( graph.domElement );

			});

			container.appendChild( document.createElement( 'br' ) );

		});


		animate();

		// Wait a little bit before building sample data
		// (allows the browser to DRAW something)
		setTimeout(initNextGraph, 100);

}

	window.onload = init;	

}).call(this);
