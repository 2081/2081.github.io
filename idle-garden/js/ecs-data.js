

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

Engine
	.Aspect
		.define("located")
			.requires("hash")
			.delivers( function getHash(){
				return this.hash;
			});

Engine
	.Element
		.create()
			.using("located")( hash );


Engine
	.Routine
		.define("locatedManager")
			.select("located").as("locatedItems")
			.do( function(){
				console.log( this.locatedItems );
			});

Engine
	.Loop
		.define("mainLoop")

Engine
	.Element
		.select("located item")


var c = new Component("located")("0_0_0");