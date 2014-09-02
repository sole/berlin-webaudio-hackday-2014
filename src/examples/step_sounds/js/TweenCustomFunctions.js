var tenStepsEasing = getNStepsEasing(10);

function getNStepsEasing(n) {
	return function(k) {
		return (Math.floor(k * n) / n);
	}
}
