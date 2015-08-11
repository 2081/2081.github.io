

(function(){




})();


// Select data by aspect name
// Each aspect correspond to a data set and a behavior



DA.D("a b c");

Lib.Aspect("vector2")
	.properties({
		x: 0,
		y: 0
	})
	.

Lib.Aspect("circle")
	.requires("vector2").as("center")
	.properties({
		r: 1
	})
	.behavior({
		area: function(){ return Math.PI*this.r*this.r }
	});

