console = console || {log:function(){},warn:function(){}};
Big = Decimal;

var NORTH 		= "N" ;
var NORTH_EAST 	= "NE";
var EAST 		=  "E";
var SOUTH_EAST 	= "SE";
var SOUTH 		= "S" ;
var SOUTH_WEST 	= "SW";
var WEST 		=  "W";
var NORTH_WEST 	= "NW";

KEYCODES = {
	LEFT: 37,
	UP: 38,
	RIGHT: 39,
	DOWN: 40
};

var TESTING		= true;
var assert = function(assertion){
	if( TESTING && !assertion ){
		arguments[0] = "ASSERTION FAILED";
		console.warn.apply(console,arguments);
	}
}

var GUID;
(function(){
	// No need to save any value
	// Though keys wont have the same length
	var d = new Date().getTime().toString(35);
	var i = 0;
	
	GUID = function(){
		return d+"z"+(i++).toString(35);
	}

	// for rfc4122 compliance on GUID, see
	// http://stackoverflow.com/a/2117523
	// Generates xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx ids
})();

////
var Lang = {
	all: ["en"],

	get: function( id ){
		return this.words[id][this.all[0]];
	},

	words: {
		"item-0" : {
						en: "Octoplant",
						fr: "Pieuvrenlit"
					},
		"item-1" : {
						en: "MegaPlant",
						fr: "MegaFleur"
					}
	}
};
////
/*
|--item
	|-- price {Number} - formula ? wtf dude what price formula ? 
	|-- experience - formula ? (gain selon clics, ressources produites depuis création/début, production d'autres items)
	|-- expPattern {ExpPattern}
	|-- level
	|-- sprite {Sprite}
	|-- behaviours []
	|-- resourcesGenerated
	|-- timesClicked
	|-- tempResources
	|-- perSecondBase
	|-- flatBonus
	|-- scaleBonus

|-- ExpPattern
		
|-- Behaviour
	|-- buff
		|-- effect
		|-- buffMap
	|-- clickable {boolean}
		|-- delay {Number}
	|-- periodic
		|-- timer
	|-- instant

*/

var Data = {
	items: [
		{
			name: Lang.get("item-0")
		}
	]
};

function Leveling(start, every){

	function _Leveling(start, every){
		this.start = start || 0;
		this.start = new Big(this.start);
		this.every = every || 1;
		this.every = new Big(this.every);

		this.valueFunction = null;

		var that = this;

		this.getValue = function(level){
			var a = level.minus(start).dividedBy(every).floor();
			console.log("Value for level "+level.toNumber()+" = "+this.valueFunction(a)+"("+a.toNumber()+")");
			return level.lt(that.start) ? 0 : this.valueFunction(level.minus(start).dividedBy(every).floor());
		};

		return function( fct ){
			that.valueFunction = fct;
			return that;
		}
	}
	
	return new _Leveling(start,every);
	
};
Leveling.LEVEL_SUFIX = "_l";
Leveling.aritSeries 	= function(n0, a){return function(n){return new Big(n0).plus(n.times(a));};};
Leveling.geomSeries 	= function(n0, a){return function(n){return new Big(n0).times(Big.pow(a,n));};};
//Leveling.aritGeomSeries = function(a,b, n0){return function(n){return n*a+b;};};

////
var Config = {
	svg: {
		vbx: -50,
		vby: -60,
		vbw: 100,
		vbh: 100,
		width: 0.8,
		currentVbx: -50,
		currentVby: -60
	},
	files: {
		sprites:{
			path: "sprites/"
		}
	},
	playground : {
		zCoef: 0.65,
		layout : {
			zBound: 3,
			radius: 25
		}
	},

	colors : {
		tiles : {
			blank: "#917663",
			blank_over: "#A18572",
			blank_border : "#574030",
			green: "#587820",
			green_over: "#658729",
			green_border: "#415917"
		}
	},

	slot: {
		bg: 'sprites/grass.png',
		bg_ghost: 'sprites/grass_ghost.png',
		bgFactor : 1.4,
		bgRatio: 440/380
	},

	items: [
		{
			id: 'item-0',
			name: Lang.get("item-0"),
			tile: "green",
			expFirstLevel: 10,
			growth: 1.15,
			price: 50,
			img : {
				sprite: "sprites/octoplant/octoplant_?.png",
				chromas: ["corail","purple"],
				tbn: "sprites/octoplant/octoplant_tbn.jpg",
				tbn_bw: "sprites/octoplant/octoplant_tbn_bw.jpg"
			}
		},

		{
			id: 'item-1',
			name: Lang.get("item-1"),
			price: 450,
			img : {
				sprite: "sprites/item1/item1_?.png",
				chromas: ["blue","orange"],
				tbn: "sprites/item1/item1_tbn.jpg",
				tbn_bw: "sprites/item1/item1_tbn_bw.jpg"
			}
		}
	],

	geom: {
		hexaGrid: {
			MAX_SIZE: 37,
			coordinates: []
		}
	},

	figures: ["M.","B.","Tr.","Quad.","Quin.","Sex.","Sept.","Oct.","Non.","Dec."]
};

Config.geom.hexaGrid.coordinates = (function(){
	//var res = [Geom.Vector3(0,0,0)];

})();


////
var Utils = {};
{

	Utils.getSet = function( obj, args ){
		switch(args.length){
			case 2:
				return obj[args[0]];
			case 3:
				obj[args[0]] = args[1];
				break;
		}
		return obj;
	},

	Utils.assumeConfig = function(obj, config){
		for( var item in config ){
			obj[item] = config[item];
		}
	};

	/**
	 *	checkConfig(config,"x");
	 *	checkConfig(config,["x","y","z"]);
	 */
	Utils.checkConfig = function( config, params ){
		if(typeof params === 'string') params = [params];
		for( var i in params ){
			if( !Utils.defined(config[params[i]]) ) return false;
		}
		return true;
	};

	Utils.defined = function( o ) {
		if( typeof o === 'undefined' ) return false;
		return true;
	};

	Utils.svgNS = "http://www/w3.org/2000/svg";

	Utils.createSvgElement = function(elt){
		return document.createElementNS(Utils.svgNS,elt);
	};

	Utils.Svg = new Class({
		initialize: function(){
			this.svgNS = "http://www/w3.org/2000/svg";
			//this.svg = document.createElementNS(Utils.svgNS,"svg");
			this.svg = document.getElementById("playground-svg");
			//this.svg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
			//console.log("SVG", this.svg);
		},

		append: function( elt ){
			//console.log("appendChild",this.svg,elt);
			this.svg.appendChild(elt);
		}
	});

	Utils.Svg.Circle = function(config){
		var obj = document.createElementNS(Utils.svgNS,"circle");
		for( var property in config ){
			obj.setAttributeNS(Utils.svgNS,property,config[property]);
		}
		return obj;
	};

	Utils.slice = function( array, begin, end ){
		if(Utils.defined(begin)){
			if( ! Utils.defined(end) ) end = array.length;

			var result = [];
			for(var i = begin; i < end; ++i){
				result[result.length] = array[i];
			}
			return result;
		}
		return array;
	}

	Utils.removeValueFromArray = function( array, value ){
		for(var i = array.length-1; i >= 0; --i){
			if( array[i] === value ) array.splice(i,1);
		}
	}
}
////

var Geom = {};
{
	Geom.Vector2 = new Class({
		initialize: function(x,y) {
			if(typeof x !== 'number') throw "Geom.Vector2.initialize: x parameter expected (Number)";
			if(typeof y !== 'number') throw "Geom.Vector2.initialize: y parameter expected (Number)";
			this.x = x;
			this.y = y;
		},

		_plus: function( vector2 ){
			this.x+=vector2.x;
			this.y+=vector2.y;
		},

		plus: function(){
			var v = this.copy();
			for( var i in arguments){
				assert(typeof arguments[i] === "object", "Geom.Vector2.plus: one of the parameters is not an object.");
				v._plus(arguments[i]);
			}
			return v;
		},

		minus: function( vector2){
			return this.plus(vector2.neg());
		},

		neg: function(){
			return new Geom.Vector2(-this.x,
									-this.y);
		},

		scal: function( sc ){
			switch(typeof sc){
				case 'number':
					return new Geom.Vector2(this.x*sc,
											this.y*sc);
				default:
					return new Geom.Vector2(this.x*sc.x,
											this.y*sc.y);
			}
			
		},

		copy: function(){
			return new Geom.Vector2(this.x,this.y);
		},

		equals: function(vector2){
			return this.x == vector2.x && this.y == vector2.y;
		}
	});
	Geom.Vector3 = new Class({
		initialize: function(x,y,z) {
			if(typeof x !== 'number') throw "Geom.Vector3.initialize: x parameter expected (Number)";
			if(typeof y !== 'number') throw "Geom.Vector3.initialize: y parameter expected (Number)";
			if(typeof z !== 'number') throw "Geom.Vector3.initialize: z parameter expected (Number)";
			this.x = x;
			this.y = y;
			this.z = z;
		},

		_plus: function( vector3 ){
			this.x+=vector3.x;
			this.y+=vector3.y;
			this.z+=vector3.z;
		},

		plus: function(){
			var v = this.copy();
			for( var i in arguments){
				assert(typeof arguments[i] === "object", "Geom.Vector3.plus: one of the parameters is not an object.");
				v._plus(arguments[i]);
			}
			return v;
		},

		neg: function(){
			return new Geom.Vector3(-this.x,
									-this.y,
									-this.z);
		},

		scal: function( number ){
			return new Geom.Vector3(this.x*number,
									this.y*number,
									this.z*number);
		},

		copy: function(){
			return new Geom.Vector3(this.x,this.y,this.z);
		},

		equals: function(vector3){
			return this.x == vector3.x && this.y == vector3.y && this.z == vector3.z;
		}
	});

	Geom.dir = {};
	Geom.dir.C 		= Geom.dir.CENTER 			= new Geom.Vector3( 0, 0, 0);
	Geom.dir.N 		= Geom.dir.NORTH 			= new Geom.Vector3( 1, 1,-2);
	Geom.dir.NE 	= Geom.dir.NORTH_EAST 		= new Geom.Vector3( 1, 0,-1);
	Geom.dir.E 		= Geom.dir.EAST 			= new Geom.Vector3( 1,-1, 0);
	Geom.dir.SE 	= Geom.dir.SOUTH_EAST 		= new Geom.Vector3( 0,-1, 1);
	Geom.dir.S 		= Geom.dir.SOUTH 			= new Geom.Vector3(-1,-1, 2);
	Geom.dir.SW 	= Geom.dir.SOUTH_WEST 		= new Geom.Vector3(-1, 0, 1);
	Geom.dir.W 		= Geom.dir.WEST 			= new Geom.Vector3(-1, 1, 0);
	Geom.dir.NW 	= Geom.dir.NORTH_WEST 		= new Geom.Vector3( 0, 1,-1);
	Geom.dir.ENE 	= Geom.dir.EAST_NORTH_EAST 	= new Geom.Vector3( 2,-1,-1);
	Geom.dir.ESE 	= Geom.dir.EAST_SOUTH_EAST 	= new Geom.Vector3( 1,-2, 1);
	Geom.dir.WSW 	= Geom.dir.WEST_SOUTH_WEST 	= new Geom.Vector3(-2, 1, 1);
	Geom.dir.WNW 	= Geom.dir.WEST_NORTH_WEST 	= new Geom.Vector3(-1, 2,-1);
	Geom.dir.NNW 	= Geom.dir.NORTH_NORTH_WEST = new Geom.Vector3( 0, 2,-2);
	Geom.dir.NNE 	= Geom.dir.NORTH_NORTH_EAST = new Geom.Vector3( 2, 0,-2);
	Geom.dir.EE 	= Geom.dir.EAST_EAST 		= new Geom.Vector3( 2,-2, 0);
	Geom.dir.SSE 	= Geom.dir.SOUTH_SOUTH_EAST = new Geom.Vector3( 0,-2, 2);
	Geom.dir.SSW 	= Geom.dir.SOUTH_SOUTH_WEST = new Geom.Vector3(-2, 0,-2);
	Geom.dir.WW 	= Geom.dir.WEST_WEST 		= new Geom.Vector3(-2, 2, 0);

	if(TESTING){
		var v = new Geom.Vector3(0,0,0);
		assert(v.x == 0 && v.y == 0 && v.z == 0, "Geom.Vector3-0 failed");
		var v2 = v.plus(new Geom.Vector3(1,2,3));
		assert(v2.x == 1 && v2.y == 2 && v2.z == 3, "Geom.Vector3-1 failed");
		var v3 = v2.scal(-2);
		assert(v3.x == -2 && v3.y == -4 && v3.z == -6, "Geom.Vector3-3 failed");
		var v4 = v.plus(v2,v3);
		assert(v4.x == -1 && v4.y == -2 && v4.z == -3, "Geom.Vector3-4 failed");
		assert(v4.copy().equals(v4), "Geom.Vector3-5 Failed");
	}

	Geom.H_ANGLES = [-Math.PI/2, -Math.PI/6, Math.PI/6, Math.PI/2, 5*Math.PI/6, -5*Math.PI/6];
	Geom.Hexagon = new Class({
		/**
		 * x,y,z,radius
		 */
		initialize: function(vector3, radius, zCoef){
			//console.log(vector3,radius);
			if( !Utils.defined(vector3) || !Utils.defined(radius) ) throw "Geom.Hexagon.initialize: missing parameter";
			this.v3 = vector3;
			this.radius = radius;
			this.zCoef = zCoef;

			//assert(this.v3.x+this.v3.y+this.v3.z == 0,"Geom.Hexagon.initialize: The sum of an hexagon tile coordinates should be equal to 0.",this);
		},

		plus: function( directions ){
			return new Geom.Hexagon(this.v3.plus(directions),this.radius,this.zCoef);
		},

		plus2D: function( v2d ){
			var x = v2d.x/Math.cos(Math.PI/6);
			return this.plus(new Geom.Vector3(x,0,v2d.y+0.5*x));
		},

		equals: function( hexagon ){
			return this.v3.equals(hexagon.v3) && this.radius == hexagon.radius;
		},

		center2D: function(){
			return new Geom.Vector2(Math.cos(Math.PI/6)*(this.v3.x - this.v3.y),this.zCoef*(this.v3.z - 0.5*(this.v3.x + this.v3.y)));
		},

		getSummits2D: function( ){
			var sums = [];
			var v2d = this.center2D();
			for( var i = 0; i < Geom.H_ANGLES.length; ++i){
				sums[i] = [ v2d.x+this.radius*Math.cos(Geom.H_ANGLES[i]),
							v2d.y+this.zCoef*this.radius*Math.sin(Geom.H_ANGLES[i]) ];
			}
			return sums;
		},

		radius: function( set ){
			if( Utils.defined(set) ){
				this.radius = set;
				return this;
			} else {
				return this.radius;
			}
		},

		copy: function(){return new Hexagon(this.v3.copy(),this.radius,this.zCoef);}

	});
	
	if(TESTING) {
		var v = new Geom.Vector3(0,0,0);
		var h = new Geom.Hexagon(v,0);
		assert( h.v3 === v && h.radius === 0, "Geom.Hexagon-0 failed");
		var v2 = new Geom.Vector3(1,1,-2);
		var h2 = new Geom.Hexagon(v2,0);
		assert( h.plus(v2).equals(h2), "Geom.Hexagon-1 failed");
	}

	Geom.HGrid/*<E>*/ = new Class({
		initialize: function( E, constraints ){
			this.E = E;
			this.cells = {};

			this.constraints = function(){return true};
			if(constraints) this.setConstraints(constraints);

			var cellFunctions = {};
			for( var dir in Geom.dir ){
				(function(){
					var a = dir;
					cellFunctions[dir] = function(){
						return this.grid.get(this.gridPos.plus(Geom.dir[a]));
					}
				})();
			}

			this._extrema = {
				mx: 0,
				my: 0,
				mz: 0,
				MX: 0,
				MY: 0,
				MZ: 0,
				mx2d: 0,
				MX2d: 0
			};
			this._extrema.update = function(v3){
				var min = Math.min;
				var max = Math.max;
				this.mx = min(this.mx,v3.x);
				this.my = min(this.my,v3.y);
				this.mz = min(this.mz,v3.z);
				this.MX = max(this.MX,v3.x);
				this.MY = max(this.MY,v3.y);
				this.MZ = max(this.MZ,v3.z);

				this.mx2d = min(this.mx2d,v3.x/2 - v3.y/2);
				this.MX2d = max(this.MX2d,v3.x/2 - v3.y/2);
			};

			Geom.HGrid.NEIGHBOURHOOD = ["NE","E","SE","SW","W","NW"];

			this.HCell = new Class(E).extend({
				initialize: function( grid, v3 ){
					this.grid = grid;
					this.gridPos = v3;
					this.id = "cell"+grid.hash(v3);
					this.hash = grid.hash(v3);

					this.parent(); // do not forget to add initialize to the class

					for( var dir in Geom.dir ){
						this[dir] = cellFunctions[dir];
					}
					
				},

				select: function( selection ){
					var results = [];
					//cf tree spec
					for( var i in selection ){
						var si = selection[i];
						if( typeof si === 'string' ){
							if( this[si] ) {
								var cell = this[si]();
								if( cell ) results.push( cell );
							}
						} else if( typeof si === 'object'){
							if( si.length > 1 ){
								var next = this[si[0]];
								if( next ) results.push.apply(results, next.select( si.slice(1) ));
							}
						}
					}
					return results;
				},

				path: function( path ){
					if( path.length == 1 ){
						return this[path[0]]();
					} else if ( path.length > 1 ){
						return this[path[0]]().path(path.slice(1));
					} else {
						return null;
					}
				},

				callNeighbourhood: function( fct, args ){
					var cells = this.select(Geom.HGrid.NEIGHBOURHOOD);
					for( var i in cells){
						cells[i][fct](args);
					}
				}
			});

			this._origin = new Geom.Vector3(0,0,0);
		},

		extrema: function(){
			var obj = {};
			for( var i in this._extrema) obj[i] = this._extrema[i];
			return obj;
		},

		setConstraints: function( constraints ){
			this.constraints = constraints;
		},

		hash: function(v3){
			return v3.x+"_"+v3.y+"_"+v3.z;
		},

		hashReverse: function( str ){
			str = str.split('_').map(function(obj){return parseInt(obj,10)});
			return new Geom.Vector3(str[0],str[1],str[2]);
		},

		hasCell: function( v3 ){
			return Utils.defined(this.cells[this.hash(v3)]);
		},

		get: function( v3 ){
			if( typeof v3 === 'string') v3 = this.hashReverse(v3);
			console.log(v3);
			if( this.constraints(v3)){
				if(this.hasCell(v3)){
					return this.cells[this.hash(v3)];
				}
				this._extrema.update(v3);
				return this.cells[this.hash(v3)] = new this.HCell(this,v3);
			}
			return null;
		},

		origin: function(){
			return this.get(this._origin);
		}
	});
}

var Wallet;
(function(){
	Wallet = {};

	var savings = new Big(0);

	Wallet.affordable = function( big ){ return savings.gte(big) }

	Wallet.add = function( big ){ savings = savings.plus(big) }
	Wallet.withdraw = function( big ){
		if( Wallet.affordable(big) ) {
			savings = savings.minus(big);
			return true;
		}
		return false;
	}
	Wallet.get = function( big ){ return savings.plus(0) }

})();

var Click;
(function(){

	var clicks = {};

	Click = function( hashCell ){
		if( typeof clicks[hashCell] === 'undefined' ){
			clicks[hashCell] = 1;
		} else {
			clicks[hashCell]++;
		}
	}

	Click.get = function( hashCell ){
		return clicks[hashCell] || 0;
	}

	Click.flush = function(){
		clicks = {};
	}

})();

var DisplayFactory;
(function(){

	var displays = {};

	var voidFunc = function(){};

	var defaultDisplay = function( id ){
		return {
			id: id,
			initialize: voidFunc,
			refresh: voidFunc,
			destroy: voidFunc,
			location: View.Desktop.Slot.ORIGIN
		}
	}

	DisplayFactory = function( obj ){
		var display = defaultDisplay(GUID());
		assert(obj[location], "Every display should be linked to a location");
		for( var key in obj ) display[key] = obj[key];
		displays[display.id] = display;
		return display.id;
	}

	DisplayFactory.refresh = function(){
		for( var key in displays ) displays[key].refresh();
	}

})();

/*var DISPLAY = {};
DISPLAY.ITEM0 = DisplayFactory({
					initialize: function( parent ){

			View.Desktop.Slot.X_GAP = width/(2*Config.playground.layout.zBound-1);
			View.Desktop.Slot.RADIUS = View.Desktop.Slot.X_GAP/(2*Math.cos(Math.PI/6));
			View.Desktop.Slot.Z_GAP = 1.5*View.Desktop.Slot.RADIUS*Config.playground.zCoef;
			View.Desktop.Slot.ORIGIN 

						var chromas = ["corail","purple"];
						var flower = parent.append("image");
						var width = View.Desktop.Slot.RADIUS*2*Math.cos(Math.PI/6)*0.9;
						var height = View.Desktop.Slot.RADIUS*6/2;
						var c = this.location.center2D();
						var rand = Math.random();
						this._imageUrl = "sprites/octoplant/octoplant_"+chromas[Math.floor(rand*chromas.length)]+".png";
						flower.attr("x",c.x-width/2)
							.attr("y",c.y-height/1.7)
							.attr("width",width)
							.attr("height",height)
							.attr("overflow","visible")
							.attr("xlink:href",this._imageUrl)
							.classed("sprite",true);
							;
					}
				});

*/
////
var ViewManager = new function(){
	var views = [];
	this.add = function( view ){
		views.push(view);
	};

	this.refresh = function(){
		for (var i = views.length - 1; i >= 0; i--) {
			if( views[i].refresh ) {
				views[i].refresh();
			} else {
				views.slice(i,1);
			}
		}
	}
};
var View = new Class({
	initialize: function(config){
		Utils.assumeConfig(this,config);
		this.subscribe();
		ViewManager.add(this);
	},
	subscribe: function(){
		if(this.model) this.model.addObserver(this);
	},
	notify: function(){
		this.update();
	},
	update: function(){},
	refresh: function(){},
	die: function(){
		this.refresh = null;
	}
});
{
	View.Desktop = new Class(View).extend({
		initialize: function(config){this.parent(config);}
	});

	View.Desktop.UI = {};
	{
		var UI = View.Desktop.UI;

		var FloatingUI = new Class(View.Desktop).extend({
			initialize: function(){this.parent()},

			toScreenXY: function( pos ){
				var w = parseInt(d3.select("#playground").style("width"));
				var h = parseInt(d3.select("#playground").style("height"));
				return   pos.plus(new Geom.Vector2(Config.svg.vbx - Config.svg.currentVbx, Config.svg.vby - Config.svg.currentVby))
							.scal(new Geom.Vector2(Math.min(h/w,1),1))
							.plus(new Geom.Vector2(-Config.svg.vbx,-Config.svg.vby));
			},

			fdiv: function( pos, container ){
				var ctn = container || "#playground";
				var actPos = this.toScreenXY(pos);
				return d3.select(ctn)
							.append("div")
								.classed("fui-container",true)
								.style({
									"left": actPos.x+"%",
									"top" : actPos.y+"%",
									"opacity": 0
								});
			}
		});

		var Tooltip = new Class(FloatingUI).extend({
			initialize: function( pos ){
				this.parent();
				this.pos = pos;
			},

			_show: function(){

				this.div = this.fdiv(this.pos);

				this.body = this.div.append("div").classed("tooltip-body",true);

				var that = this;
				d3.select("#playground").on("mousewheel.tooltip",function(){that.hide();});
			},

			show: function(){
				if( ! this.div ) {
					this._show();

					if( !this.body.selectAll("*")[0] || this.body.selectAll("*")[0].length == 0 )
						this.body.append("div")
									.classed("tooltip-item",true)
									.text("No data available");

					this.div.transition().delay(150).style("opacity",1).duration(200);

				}
			},

			hide: function(){
				if( this.div ){
					if(this._hide)this._hide();
					this.body = null;
					this.div.transition().style("opacity",0).duration(200).remove();
					this.div = null;
				}
			},

			clear: function(){
				this.body.remove();
			},

			append: function( element ){
				return this.body.append(element);
			}
		});

		var SlotTT = new Class(Tooltip).extend({
			initialize: function( pos, slot ){
				this.parent(pos);
				this.slot = slot;
				this.refreshed = 0;
				this.divItem = null;
				this.divSlot = null;
			},

			_show: function(){
				this.parent();
				if( this.slot.item() ){
					this.divItem = this.addItem(this.slot.item().imageUrl());
				}
				this.divSlot = this.addItem(this.slot.backgroundUrl());
				this.divSlot.append("p").text("No bonus.");
				
			},

			_hide: function(){
				this.divItem = null;
				this.divSlot = null;
			},

			addItem: function( thumbnailUrl ){
				var item =  this.body.append("div").classed("tooltip-item",true);
				if(thumbnailUrl) {
					var tb = item.append("div").classed("thumbnail",true);
					tb.append("img")
					.classed("thumbnail", true)
					.attr({
						src: thumbnailUrl,
						alt: "item"
					});
				}
				return item;
			},

			refresh: function(){
				/*if( this.divSlot != null){
					console.log(this.divSlot.select("p").empty());
					this.divSlot.select("p").text(this.refreshed++);
				} */

			}
		});

		/*var HMenuTile = new Class({
			initialize: function(id, thumbnail, tooltip, activated ){

			}
		});*/

		var MenuItem = new Class({
			initialize: function(){}
		});

		var SlotMenu = new Class(FloatingUI).extend({
			initialize: function(pos){
				this.parent();
			},

			addCancel: function(){
				
				/*this.items.append("div").classed("item",true).classed("cancel",true)
						.append("p").text("Cancel");*/
			},

			addItems: function(){
				for( var i in Config.items ){
					var item = Config.items[i];

					var div = this.items.append("div").classed("item",true);
					div.append("img").attr("src",item.img.tbn);
				}
			},

			open: function( callback ){
				this._callback = callback;
				console.log("OPEN");
				d3.select("#slot-menu-container").style("pointer-events","all").transition().style("opacity",1);
				//setTimeout(this.close.bind(this), 5000);

				this.body = d3.select("#slot-menu-container").append("div").classed("slot-menu-body",true);
				this.items = this.body.append("div").classed("items-holder",true);

				this.addItems();

				this.body.append("div").classed("quit",true).text("\u2716").on("click",this.close.bind(this));
			},

			close: function(){
				console.log("CLOSE");
				d3.select("#slot-menu-container").transition().style("opacity",0).style("pointer-events","none");
				this._callback();

				this.body.remove();
			}
		});

		/*var SlotCM = new Class(HexagonMenu).extend({
			initialize: function( pos, slot ){
				this.parent( pos );
			}
		});*/

		//-------
		View.Desktop.UI.SlotToolTip = function(pos, slot){return new SlotTT(pos,slot);};
		View.Desktop.UI.SlotMenu = function(pos, slot){return new SlotMenu(pos,slot);};
	}

	View.Desktop.Item = new Class(View.Desktop).extend({
		initialize: function( item, dom, hexagon ){
			this.parent();
			this.hexagon = hexagon;
			this.dom = dom;
			this.item = item;
			this.domInit();
		},

		domInit: function(){
			//var chromas = ["yellow","green","crab","rose","lake","sea","lemon","diamond"];
			var chromas = ["corail","purple"];

			var flower = this.dom.append("image");
			var width = this.hexagon.radius*2*Math.cos(Math.PI/6)*0.9;
			var height = this.hexagon.radius*6/2;
			var c = this.hexagon.center2D();
			var rand = Math.random();
			//this._imageUrl = "sprites/croom_"+chromas[Math.floor(rand*chromas.length)]+".gif?time="+rand;
			this._imageUrl = "sprites/octoplant/octoplant_"+chromas[Math.floor(rand*chromas.length)]+".png";
			flower.attr("x",c.x-width/2)
				.attr("y",c.y-height/1.7)
				.attr("width",width)
				.attr("height",height)
				.attr("overflow","visible")
				.attr("xlink:href",this._imageUrl)
				//.attr("xlink:href","sprites/waura.gif?time="+rand)
				//.attr("xlink:href","sprites/flower0.gif?time="+rand)
				.classed("sprite",true);
				;
		},

		imageUrl: function(){
			return this._imageUrl;
		}
	});

	View.Desktop.Slot = new Class(View.Desktop).extend({
		initialize: function (model, svg, radius, origin) {
			this.parent();
			this.model 	= model;
			this.svg 	= View.Desktop.Slot.SVG;
			this.radius = View.Desktop.Slot.RADIUS;
			this.origin = View.Desktop.Slot.ORIGIN;
			this.hexagon = new Geom.Hexagon(this.model.gridPos.scal(this.radius),this.radius,Config.playground.zCoef).plus2D(this.origin);
			this.appearence = {};

			this.itemView = null;


			this.state = null;

			this.domInit();
		},

		domInit: function(){

			this.tileColor = "blank";
			var slot = this;
			/*this.dom = this.svg.append("polygon");
			var polygon = this.dom;
			this.dom.attr("points",this.hexagon.getSummits2D().join(" "))
					.attr({
						fill: Config.colors.tiles.blank,
						stroke: Config.colors.tiles[slot.tileColor+"_border"],
						"stroke-width": 0.5
					}).on({
						mouseover: function(){polygon.attr("fill",Config.colors.tiles[slot.tileColor+"_over"]);},
						mouseout : function(){polygon.attr("fill",Config.colors.tiles[slot.tileColor]);},
						mousedown: function(){
							if(event.button != 0 ){
								this.onSpecialClick();
							} else {
								this.onClick();
							}}.bind(this),
						contextmenu: function(){event.preventDefault()}
					});*/
			this.tooltip = View.Desktop.UI.SlotToolTip(this.hexagon.center2D(), this);
			this.slotMenu = View.Desktop.UI.SlotMenu(this.hexagon.center2D(), this.model); 

			this.dom = this.svg.append("g");
			var group = this.dom;
			var img = group.append("image");
			var that = this;
			var eventPolygon = group.append("polygon")
				.attr("points",this.hexagon.getSummits2D().join(" "))
				.classed("event-handler",true)
				.attr({
					fill: "transparent",
					stroke: "transparent",
					"stroke-width": 0
				}).on({
					mouseenter: function(){
						//eventPolygon.attr("fill","rgba(255, 255, 0, 0.2)");
						group.selectAll(".sprite"+(that.state == SLOT_STATE.SOLID ? " , image.bg":""))
								.style("filter","url(#hoverFilter)");
						group.select('.bg').style("opacity",that.appearence.hoverOpactity);

						//if( that.state == SLOT_STATE.SOLID) group.select("image.bg").style("filter")
						if( that.state != SLOT_STATE.VOID) that.tooltip.show();
					},
					mouseout : function(){
						//eventPolygon.attr("fill","transparent");
						group.selectAll("*").style("filter","none");
						group.select('.bg').style("opacity",that.appearence.opacity);
						that.tooltip.hide();
						//console.log("mouseout");
						/*console.log(group.select("feColorMatrix"));
						group.select("feColorMatrix").remove();*/
						that.cancelLongClickTimer();
					},
					mousedown: function(){
						if(event.button != 0 ){
							this.onSpecialClick();
						} else {
							this.setLongClickTimer();
						}}.bind(this),
					mouseup: function(){
						this.cancelLongClickTimer();
					}.bind(this),
					click: function(){ that.onClick();},
					contextmenu: function(){event.preventDefault()}
				})
				;

			this.eventHandler = eventPolygon;


			var width = Config.slot.bgFactor*this.hexagon.radius*2*Math.cos(Math.PI/6);
			var height = width*Config.slot.bgRatio;
			var c = this.hexagon.center2D();


			group.data([this.hexagon.v3.z + c.x/100]);
			img.attr("x",c.x-width/2)
				.attr("y",c.y-height/2)
				.attr("width",width)
				.attr("height",height)
				.attr("overflow","visible")
				.attr("xlink:href","")
				.classed("bg",true)
				;
		},

		backgroundUrl: function(){
			return this.appearence.bg;
		},

		item: function(){
			return this.itemView;
		},

		onClick: function(){
			if( ! this.menuOpened ) Click(this.model.hash);
			//this.model.activate();
			//console.log(this.hexagon.center2D());
			
		},

		backFromMenu: function(){
			this.menuOpened = false;
		},

		onLongClick: function(){
			delete this.mousedown_timer;
			this.menuOpened = true;
			this.eventHandler.on("mouseout")();
			this.slotMenu.open( this.backFromMenu.bind(this) );
		},
		setLongClickTimer: function(){
			if( ! this.menuOpened && this.state == SLOT_STATE.SOLID ) this.mousedown_timer = setTimeout(this.onLongClick.bind(this),500);
		},
		cancelLongClickTimer: function(){
			if( this.mousedown_timer ){
				clearTimeout(this.mousedown_timer);
				delete this.mousedown_timer;
			}
		},

		onSpecialClick: function(){
			if( this.state == SLOT_STATE.SOLID ){
				this.model.item(0);
				//this.tileColor = Config.items[0].tile;
				if( this.itemView == null) {
					this.itemView = new View.Desktop.Item(this.model.item(),this.dom,this.hexagon);
					this.eventHandler.on('mouseout')();
					this.eventHandler.on('mouseenter')();
				}
			}
			
		},

		update: function(){
			console.log("updating slot",this);
		},

		refresh: function(){
			if( this.state != this.model.state() ){
				this.state = this.model.state();
				var img = this.dom.select("image.bg");

				this.appearence.bg = "";
				this.appearence.opacity = 1;
				this.appearence.hoverOpactity = 1;

				switch(this.state ){
					case SLOT_STATE.GHOST:
						this.appearence.bg = Config.slot.bg_ghost;
						this.appearence.opacity = 0.3;
						break;
					case SLOT_STATE.SOLID:
						this.appearence.bg = Config.slot.bg;
						break;
					case SLOT_STATE.VOID:
						break;
				}
				img.attr("xlink:href",this.appearence.bg)
				   .style("opacity",this.appearence.opacity);
			}
		}
	});

	View.Desktop.Menu = new Class(View.Desktop).extend({
		initialize: function( container ){
			this.parent();
			this.container = container;
		},
		show: function(){
			this.container.classed("hidden",true);
		},
		hide: function(){
			this.container.classed("hidden",false);
		}
	});

	View.Desktop.Playground = new Class(View.Desktop).extend({
		initialize: function(model){
			this.parent();
			this.model = model;
			this.dom = View.Desktop.Playground.DOM;
			this.domInit();

			this.states = {};

			this.viewBox = {};
			this.viewBox.center = new Geom.Vector2(0,0);
			this.viewBox.min = new Geom.Vector2(-30,-30);
			this.viewBox.max = new Geom.Vector2(30,10);

			this._scrolling = {};
			var dirs = [KEYCODES.UP,KEYCODES.RIGHT,KEYCODES.DOWN,KEYCODES.LEFT];
			for( var i in dirs) this._scrolling[dirs[i]] = false;

			var width = Config.svg.width*100;
			var origin = new Geom.Vector2(0,0);

			this.slots = [];

			View.Desktop.Slot.SVG = this.svg;
			View.Desktop.Slot.X_GAP = width/(2*Config.playground.layout.zBound-1);
			View.Desktop.Slot.RADIUS = View.Desktop.Slot.X_GAP/(2*Math.cos(Math.PI/6));
			View.Desktop.Slot.Z_GAP = 1.5*View.Desktop.Slot.RADIUS*Config.playground.zCoef;
			View.Desktop.Slot.ORIGIN = origin;
		},

		domInit: function(){
			this.svg = this.dom.append("svg").attr("viewBox", [Config.svg.vbx,Config.svg.vby,Config.svg.vbw,Config.svg.vbh].join(" "))
											 .attr("width","100%")
											 .attr("height","100%");
			var defs = this.svg.append("defs");
			var f1 = defs.append("filter").attr("id","hoverFilter");
			f1.append("feColorMatrix").attr("values","1.3 0 0 0 0 \
													  0 1.3 0 0 0 \
													  0 0 1 0 0 \
													  0 0 0 1 0");
			var that = this;
			//d3.select("#playground").on("mousewheel",function(){that.onMouseWheel(event.wheelDelta)});
			d3.select("body").on("keydown",function(){that.onKeyDown(d3.event.keyCode)});
			d3.select("body").on("keyup",function(){that.onKeyUp(d3.event.keyCode)});
			/*d3.select("body").on("mousedown",function(){var p = d3.mouse(this);that.onMouseDown(new Geom.Vector2(p[0],p[1]))});
			d3.select("body").on("mouseup",function(){that.onMouseUp()});
			d3.select("body").on("mousemove",function(){var p = d3.mouse(this);that.onMouseMove(new Geom.Vector2(p[0],p[1]))});
			d3.select("body").on("mouseleave",function(){that.onMouseLeave()});*/
		},

		onMouseDown: function( pos ){
			console.log("MOUSEDOWN");
			this.states.mouseDown = true;
		},

		onMouseMove: function( pos ){
			if( this.states.dragging ){
				/*if( ! this.states.mouseDown ){
					this.onMouseUp();
				} else {*/
					this.states.dragging.to = pos;
				//}
			} else if ( this.states.mouseDown ){
				this.states.dragging = {};
				this.states.dragging.from = pos ;
				this.states.dragging.to = pos ;
			}
		},

		onMouseLeave: function(){
			this.onMouseUp();
		},

		onMouseUp: function(){
			console.log("MOUSEUP");
			if(this.states.dragging) this.states.dragging.end = true;
			this.states.mouseDown = false;
		},

		onKeyDown: function( code ){
			this._scrolling[code] = true;
		},

		onKeyUp: function( code ){
			this._scrolling[code] = false;
		},

		_updateScroll: function( ease, bound ){
			if(bound)for( var i in {x:null,y:null}) this.viewBox.center[i] = Math.max( this.viewBox.min[i], Math.min( this.viewBox.max[i], this.viewBox.center[i] ));
			Config.svg.currentVbx = this.viewBox.center.x+Config.svg.vbx;
			Config.svg.currentVby = this.viewBox.center.y+Config.svg.vby;
			var a = this.svg;
			if(ease) a = a.transition().ease('quad-out');
			a.attr("viewBox",Config.svg.currentVbx+" "+Config.svg.currentVby+" "+[Config.svg.vbw,Config.svg.vbh].join(" "));
		},

		updateScroll: function(){
			var s = this._scrolling, scrollDelta = 3;

			if( this.states.dragging ) {

				if( ! this.states.dragging.old ) {
					this.states.dragging.old = {};
					this.states.dragging.old.center = this.viewBox.center.copy();
					this.states.dragging.old.dx = 0;
					this.states.dragging.old.dy = 0;
				}

				var w = parseInt(d3.select("body").style("width"));
				var h = parseInt(d3.select("body").style("height"));

				var from = this.states.dragging.from, to = this.states.dragging.to;
				var dx = to.minus(from).x/w*100
					dy = to.minus(from).y/h*100;


				if( this.states.dragging.end ){

					this.viewBox.center.x = this.states.dragging.old.center.x - dx*1.7 -(dx-this.states.dragging.old.dx)*5;
					this.viewBox.center.y = this.states.dragging.old.center.y - dy -(dy-this.states.dragging.old.dy)*5;

					this._updateScroll(true,true);
					this.states.dragging = null;

				} else {

					this.states.dragging.old.dx = dx;
					this.states.dragging.old.dy = dy;
					

					this.viewBox.center.x = this.states.dragging.old.center.x - dx*1.7;
					this.viewBox.center.y = this.states.dragging.old.center.y - dy;

					this._updateScroll();
				}

				

			} else if( s[KEYCODES.UP] || s[KEYCODES.RIGHT] || s[KEYCODES.DOWN] || s[KEYCODES.LEFT] ){
				
				
				this.viewBox.center.x = this.viewBox.center.x + (s[KEYCODES.RIGHT]? scrollDelta : 0) - (s[KEYCODES.LEFT]? scrollDelta : 0);
				this.viewBox.center.y = this.viewBox.center.y + (s[KEYCODES.DOWN]? scrollDelta : 0) - (s[KEYCODES.UP]? scrollDelta : 0);
			
				this._updateScroll(true,true);
			}
			
		},

		onMouseWheel: function( direction ){
			/*if( direction < 0 ){
				this.xOffset = Math.min(this.xOsMax, this.xOffset+20);
			} else {
				this.xOffset = Math.max(this.xOsMin, this.xOffset-20);
			}
			Config.svg.currentVbx = this.xOffset+Config.svg.vbx;
			
			this.svg.transition().ease('quad-out').attr("viewBox",Config.svg.currentVbx+" "+[Config.svg.vby,Config.svg.vbw,Config.svg.vbh].join(" "))
			//d3.select("#playground").on("mousemove");*/
		},

		update: function(){
			console.log("updating playground",this);
		},

		refresh: function(){
			var ex = this.model.grid.extrema();
			this.viewBox.max.x = 30+(ex.MX2d-2)*View.Desktop.Slot.X_GAP;
			this.viewBox.min.x = -30+(ex.mx2d+2)*View.Desktop.Slot.X_GAP;
			this.viewBox.max.y = 30+(ex.MZ-2)*View.Desktop.Slot.Z_GAP;
			this.viewBox.min.y = -10+(ex.mz+2)*View.Desktop.Slot.Z_GAP;
			this.updateScroll();
			this.svg.selectAll('g').sort(function(a,b){return a - b;});
		}
	});

	View.Game = new Class(View).extend({
		initialize: function(model){
			this.parent();
			this.model = model;
			View.Desktop.Playground.DOM = d3.select("#playground");
		},
		refresh: function(){
			this.numberFormat(this.model.production());
			d3.select("#bank").text(this.numberFormat(this.model.production()));
		},
		numberFormat: function( big ){
			if( big.e < 6 ){
				return big.toString();
			} else {
				var exp = Math.floor((big.e-6)/3);
				return big.dividedBy("1e"+(6+exp*3)).toFixed(3).toString()+" "+ (Config.figures[exp] || "e"+(6+exp*3));
			}
		}
	});
}


var RESC = {
	DPS: "dps",
	DPC: "dpc"
};

var Ticks;
// Ticks
(function(){
	var timelapse = 0;

	Ticks = function( pdata ){
		switch( pdata.resource ){
		case RESC.DPS:
			return timelapse;
		case RESC.DPC:
			return Click.get(pdata.location);
		}
		return 0;
	}

	Ticks.setTimeLapse = function( tl ){ timelapse = tl }
})();

var ProductionFactory;
// ProductionFactory
(function(){

	var ProducerData = function(id){
		return {
			id 			: id,
			total 		: new Big(0),
			pending 	: new Big(0),

			perTick 	: new Big(0),

			resource 	: "",
			//location	: null,

			//userData	: null,

			priority 	: 100,
			tags 		: {}
		}
	};

	var ProducerHandler = new Class({
		initialize: function( pdata ){
			this.pdata = pdata;
		},

		id: function(){
			return this.pdata.id;
		},

		attr: function( attr, value ){
			if( arguments.length == 1 ) return this.pdata[attr];
			this.pdata[attr] = value;
			return this;
		},

		resource: function( resc ){
			if( arguments.length == 0 ) return this.pdata.resource;
			this.pdata.resource = resc;
			return this;
		},

		addTags: function( tags ){
			tags.split(" ").map(function(obj){this.pdata.tags[obj] = true}.bind(this));
			return this;
		},

		removeTags: function( tags ){
			tags.split(" ").map(function(obj){delete this.pdata.tags[obj]}.bind(this));
			return this;
		}
	});

	var pDatas = {};


	ProductionFactory = function( id ){
		var pdata;
		if( typeof id !== 'string' ){
			id = GUID();
			pdata = new ProducerData(id);
			pDatas[id] = pdata;
			console.log("created new pdata", pdata);
		} else {
			pdata = pDatas[id];
			if( pdata == null ) throw new Error("Cannot retrieve prod from id : "+id);
		}
		return new ProducerHandler(pdata);
	}

	ProductionFactory.getAll = function(){
		return Object.keys(pDatas)
					 .map(function(key){return pDatas[key];})
					 .sort(function(a,b){return b.priority - a.priority}); // DESC
	}

	ProductionFactory.getProduction = function(){
		var pdatas = ProductionFactory.getAll();
		var prod = new Big(0);
		for( var i in pdatas ){
			var pdata = pdatas[i];
			var ticks = Ticks(pdata);
			pdata.pending = pdata.pending.plus(pdata.perTick.times(ticks));
			var fl = pdata.pending.floor();
			prod = prod.plus(fl);
			pdata.pending = pdata.pending.minus(fl);
			pdata.total = pdata.total.plus(fl);
		}
		return prod;
	}

	ProductionFactory.save = function(){
		var str = "{";
		for( var item in pDatas ){
			var pdata = pDatas[item];
			str += '"'+item+"\":{";
			for( var att in pdata ){
				str += '"'+att+"\":";
				str += ( pdata[att] ? '"'+pdata[att].toString()+'"' : "null" );
				str += ",";
			}
			str = str.slice(0, -1)+"},";
		} 
		return str.slice(0, -1)+"}";
	}

	ProductionFactory.load = function( str ){
		pDatas = JSON.parse(str);
		for( var item in pDatas ){
			var pdata = pDatas[item];
			pdata.total = new Big(pdata.total);
			pdata.pending = new Big(pdata.pending);
			pdata.perTick = new Big(pdata.perTick);
			pdata.priority = parseInt(pdata.priority);
		} 
		console.log(pDatas);
	}

})();

var BonusFactory;
var Bonus;
// BonusFactory
// Bonus
(function(){

	/*
		Tags should cover every cases.
		Leveling bonus -> item tag + custom formula based on level
		Land to item -> location
		Global bonus -> tag all
		
		if linking a bonus to an item becomes neccessary (divine buf ?)
		targetID[] can be added
	*/

	var BonusData = new Class({
		initialize: function(id){
			this.id = id;
			this.stackGroup = 0; // mult coefs stack additively in a group then multiplicatively
			this.tags = {};
			this.resources = {};
			this.location = [];
		},

		formula: function(){return [0,0];}
	})

	var BonusHandler = new Class({
		initialize: function( bonusData ){
			this.bonusData = bonusData || new BonusData();
		},

		get: function( userData ){
			var res = this.bonusData.formula( userData );
			return {
				flat: new Big(res[0]),
				mult: new Big(res[0])
			};
		},

		_formula: function(){return [0,0];},

		formula: function( f ){
			if( arguments.length == 0){
				return this.bonusData.formula;
			}
			if( typeof f === 'function'){
				this.bonusData.formula = f;
			}
			return this;
		},

		fixed: function( flat, mult ){
			var f = flat || 0;
			var m = mult || 0;
			this.bonusData.formula = function(){ return [f,m]};
			return this;
		},

		stackGroup: function( sg ){
			if( arguments.length == 0){
				return this.bonusData.stackGroup;
			}
			this.bonusData.stackGroup = sg;
			return this;
		},

		addTags: function( tags ){
			tags.split(" ").map(function(obj){this.bonusData.tags[obj] = true}.bind(this));
			return this;
		},

		removeTags: function( tags ){
			tags.split(" ").map(function(obj){delete this.bonusData.tags[obj]}.bind(this));
			return this;
		},

		addResources: function( resc ){
			resc.split(" ").map(function(obj){this.bonusData.resources[obj] = true}.bind(this));
			return this;
		},

		removeResources: function( resc ){
			resc.split(" ").map(function(obj){delete this.bonusData.resources[obj]}.bind(this));
			return this;
		},

		location: function( loc ){
			if( arguments.length == 0){
				return this.bonusData.location;
			}
			this.bonusData.location = loc;
			return this;
		},

		data: function(){
			return this.bonusData;
		},

		build: function(){
			return this.bonusData.id;
		}

	});

	var bonuses = {};

	/*bonuses["all"] = {};
	for( var i in RESOURCES ) bonuses[i] = {};*/

	BonusFactory = function( id ){
		var bdata;
		if( typeof id !== 'string' ){
			id = GUID();
			bdata = new BonusData(id);
			bonuses[id] = bdata;
		} else {
			bdata = bonuses[id];
			if( bdata == null ) throw new Error("Cannot retrieve bonus from id : "+id);
		}
		return new BonusHandler(bdata);
	}

	function hasAll( obj, ref ){
		if( ref["all"] ) return true;
		for( var key in ref )if( ! obj[key] ) return false;
		return true;
	}

	function isOf( str, ref ){
		if( ref["all"] ) return true;
		return ref[str];
	}

	BonusFactory.getAll = function(){
		return Object.keys(bonuses)
					 .map(function(key){return bonuses[key];})
					 .sort(function(a,b){return a.stackGroup - b.stackGroup}); // DESC
	}

	BonusFactory.applyBonuses = function( ){
		var producers = ProductionFactory.getAll();
		var bonuses = BonusFactory.getAll();

		for( var i in producers ){
			var producer = producers[i];
			var filtered = bonuses.filter(function(obj){ return hasAll(producer.tags,obj.tags) && isOf(producer.resource, obj.resources);});
			var flat = new Big(0), mult = new Big(0);
			//console.log("list",bonuses,filtered);
			for( var j in filtered ){
				var p = filtered[j].formula(producer);
				//console.log("bonus", p);
				flat = flat.plus(p[0]);
				mult = mult.plus(p[1]);
			}
			producer.perTick = flat.times(mult.plus(1));
		}
	}

})();

var ItemFactory;
// ItemFactory
(function(){

	var ItemData = function(id){
		return {
			id: id,
			productions: [],
			displays: {}
		}
	}

	var ItemHandler = new Class({
		initialize: function( idata ){
			this.idata = idata;
		},

		addProd: function( prodID ){
			this.idata.productions.push(prodID);
			return this;
		},

		removeProd: function( prodID ){
			Utils.removeValueFromArray(this.idata.productions, prodID);
			return this;
		},

		addDisplay: function( disp ){
			disp.split(" ").map(function(obj){this.idata.displays[obj] = true}.bind(this));
			return this;
		},

		removeDisplay: function( disp ){
			disp.split(" ").map(function(obj){delete this.idata.displays[obj]}.bind(this));
			return this;
		},

		attr: function( attr, value ){
			if( arguments.length == 1 ) return this.idata[attr];
			this.idata[attr] = value;
			return this;
		},

		id: function(){ return this.idata.id }

	});

	var items = {};

	ItemFactory = function( id ){
		var idata;
		if( typeof id !== 'string' ){
			id = GUID();
			idata = new ItemData(id);
			items[id] = idata;
		} else {
			idata = items[id];
			if( idata == null ) throw new Error("Cannot retrieve item from id : "+id);
		}
		return new ItemHandler(idata);
	}

})();

var Playground;
(function(){

	Playground = new Class(View).extend({
		initialize: function( dom){
			this.dom = dom;
			this.domInit();

			this.states = {};

			this.viewBox = {};
			this.viewBox.center = new Geom.Vector2(0,0);
			this.viewBox.min = new Geom.Vector2(-30,-30);
			this.viewBox.max = new Geom.Vector2(30,10);

			this._scrolling = {};
			var dirs = [KEYCODES.UP,KEYCODES.RIGHT,KEYCODES.DOWN,KEYCODES.LEFT];
			for( var i in dirs) this._scrolling[dirs[i]] = false;

			var width = Config.svg.width*100;
			var origin = new Geom.Vector2(0,0);

			this.slots = [];

			Playground.SVG = this.svg;
			Playground.X_GAP = width/(2*Config.playground.layout.zBound-1);
			Playground.RADIUS = Playground.X_GAP/(2*Math.cos(Math.PI/6));
			Playground.Z_GAP = 1.5*Playground.RADIUS*Config.playground.zCoef;
			Playground.ORIGIN = origin;

			this.displayID = DisplayFactory({ refresh: this.refresh.bind(this) });

		},

		domInit: function(){
			this.svg = this.dom.append("svg").attr("viewBox", [Config.svg.vbx,Config.svg.vby,Config.svg.vbw,Config.svg.vbh].join(" "))
											 .attr("width","100%")
											 .attr("height","100%");
			var defs = this.svg.append("defs");
			var f1 = defs.append("filter").attr("id","hoverFilter");
			f1.append("feColorMatrix").attr("values","1.3 0 0 0 0 \
													  0 1.3 0 0 0 \
													  0 0 1 0 0 \
													  0 0 0 1 0");
			var that = this;
			d3.select("body").on("keydown",function(){that.onKeyDown(d3.event.keyCode)});
			d3.select("body").on("keyup",function(){that.onKeyUp(d3.event.keyCode)});
		},

		onMouseDown: function( pos ){
			this.states.mouseDown = true;
		},

		onMouseMove: function( pos ){
			if( this.states.dragging ){
				this.states.dragging.to = pos;
			} else if ( this.states.mouseDown ){
				this.states.dragging = {};
				this.states.dragging.from = pos ;
				this.states.dragging.to = pos ;
			}
		},

		onMouseLeave: function(){
			this.onMouseUp();
		},

		onMouseUp: function(){
			console.log("MOUSEUP");
			if(this.states.dragging) this.states.dragging.end = true;
			this.states.mouseDown = false;
		},

		onKeyDown: function( code ){
			this._scrolling[code] = true;
		},

		onKeyUp: function( code ){
			this._scrolling[code] = false;
		},

		_updateScroll: function( ease, bound ){
			if(bound)for( var i in {x:null,y:null}) this.viewBox.center[i] = Math.max( this.viewBox.min[i], Math.min( this.viewBox.max[i], this.viewBox.center[i] ));
			Config.svg.currentVbx = this.viewBox.center.x+Config.svg.vbx;
			Config.svg.currentVby = this.viewBox.center.y+Config.svg.vby;
			var a = this.svg;
			if(ease) a = a.transition().ease('quad-out');
			a.attr("viewBox",Config.svg.currentVbx+" "+Config.svg.currentVby+" "+[Config.svg.vbw,Config.svg.vbh].join(" "));
		},

		updateScroll: function(){
			var s = this._scrolling, scrollDelta = 3;

			if( s[KEYCODES.UP] || s[KEYCODES.RIGHT] || s[KEYCODES.DOWN] || s[KEYCODES.LEFT] ){
				
				
				this.viewBox.center.x = this.viewBox.center.x + (s[KEYCODES.RIGHT]? scrollDelta : 0) - (s[KEYCODES.LEFT]? scrollDelta : 0);
				this.viewBox.center.y = this.viewBox.center.y + (s[KEYCODES.DOWN]? scrollDelta : 0) - (s[KEYCODES.UP]? scrollDelta : 0);
			
				this._updateScroll(true,true);
			}
			
		},

		onMouseWheel: function( direction ){
			/*if( direction < 0 ){
				this.xOffset = Math.min(this.xOsMax, this.xOffset+20);
			} else {
				this.xOffset = Math.max(this.xOsMin, this.xOffset-20);
			}
			Config.svg.currentVbx = this.xOffset+Config.svg.vbx;
			
			this.svg.transition().ease('quad-out').attr("viewBox",Config.svg.currentVbx+" "+[Config.svg.vby,Config.svg.vbw,Config.svg.vbh].join(" "))
			//d3.select("#playground").on("mousemove");*/
		},

		update: function(){
			console.log("updating playground",this);
		},

		refresh: function(){
			var ex = Grid.extrema();
			this.viewBox.max.x = 30+(ex.MX2d-2)*Playground.X_GAP;
			this.viewBox.min.x = -30+(ex.mx2d+2)*Playground.X_GAP;
			this.viewBox.max.y = 30+(ex.MZ-2)*Playground.Z_GAP;
			this.viewBox.min.y = -10+(ex.mz+2)*Playground.Z_GAP;
			this.updateScroll();
			this.svg.selectAll('g').sort(function(a,b){return a - b;});
		}
	});

})();

var Grid;
var Place;
(function(){

	var allowPropagation = true;

	var Cell = new Class({
		initialize: function(){

			this.listeners = {};

			var group = this.group = Playground.SVG.append("g").classed("gridpos", true);

			this.svg 	= Playground.SVG;
			this.radius = Playground.RADIUS;
			this.origin = Playground.ORIGIN;
			this.hexagon = new Geom.Hexagon(this.gridPos.scal(this.radius),this.radius,Config.playground.zCoef).plus2D(this.origin);

			var hash = this.hash;
			var cell = this;

			this.eventPolygon = group.append("polygon")
				.attr("points",this.hexagon.getSummits2D().join(" "))
				.classed("event-handler",true)
				.on({
					mouseenter: function(){cell.dispatch("mousenter",event)},
					mouseout : function(){cell.dispatch("mouseout",event)},
					mousedown: function(){cell.dispatch("mousedown",event)},
					mouseup: function(){cell.dispatch("mouseup",event)},
					click: function(){cell.dispatch("click",event)},
					contextmenu: function(){event.preventDefault()}
				})
				;
		},

		dispatch: function( name, eventObj ){
			if( allowPropagation ) {
				for( var key in this.listeners ){
					var f = this.listeners[key]["on"+name];
					if( f ) f( eventObj, this.hash );
				}
			}
		},

		addListener: function( obj ) {
			var id = GUID();
			this.listeners[id] = obj;
			return id;
		},

		removeListener: function( id ){
			if( this.listeners[id] ) delete this.listeners[id];
		}
	});

	var grid = new Geom.HGrid(Cell);

	var playground = new Playground( d3.select("#playground"));

	function hash( v3 ){ return v3.x+'_'+v3.y+'_'+v3.z; }

	Place = function( hash ){
		var cell = typeof hash === 'undefined' ? grid.origin() : grid.get(hash);
		return {
			bindEvents: function( obj ) {
				return cell.addListener( obj );
			},
			unbindEvents: function( id ) {
				cell.removeListener(id);
			}
		}
	}

	Grid = {};

	Grid.denyEvents = function(){ allowPropagation = false }
	Grid.allowEvents = function(){ allowPropagation = true }
	Grid.extrema = function(){return grid.extrema()}

	Place.hash = hash;

})();

var ORIGIN = "0_0_0";

Place(ORIGIN);
Place("0_1_-1");
Place("1_-1_0");

var bindId;
var obj = {onclick: function(event, hash){console.log("click",hash); Place("0_0_0").unbindEvents( bindId ) }};
bindId = Place("0_0_0").bindEvents( obj )


////
var Model = new Class({
	initialize: function(config){
		//Utils.assumeConfig(this, config);
		this.observers = [];
		this.topics = {};
	},
	notify: function(){
		for( var i in this.observers){
			this.observers[i].notify.apply(this.observers[i],arguments);
		}
	},
	addObserver: function( obs ){
		this.observers.push(obs);
	},

	addListener: function( obj , topic){
		if( ! Utils.defined(this.topics[topic]) ) this.topics[topic] = [];
		this.topics[topic].push(obj);
		return this;
	},
	dispatch: function( topic,  e ){
		for( var i in this.topics[topic]){
			var listener = this.topics[topic][i];
			if( typeof listener['on'+topic] === 'function') listener['on'+topic](e);
		}
		return this;
	}
});
{
	Model.Math = {};
	Model.Math.neutrals = {
		'+': new Big(0),
		'*': new Big(1)
	};
	Model.Math.operations = {
		'+': function(a,b){return a.plus(b)},
		'*': function(a,b){return a.times(b)}
	};

	Model.Item = new Class(Model).extend({
		initialize: function( id, location ){
			this.parent();
			this.type = id;
			this.typeData = Config.items[id];

			this.prodID = ProductionFactory().addTags("octoplant")
											.resource(RESC.DPS)
											.attr("level",0)
											.attr("location",location);

			//this.harvestTime = date | new Date();

			//this.efxHolder = new Model.LIEfxHolder();
			//this.levelHandler = new Model.ILevelHandler(this);
			//this.activations = new Big(0);
		},
		attr: function( a, b ){
			if( Utils.defined(b) ){
				this.data[a] = b;
				return this;
			} else {
				return this.data[a];
			}
		},

		onLevelUp: function(){

		},

		activate: function(){
			//this.activations = this.activations.plus(1);//var efc = this.efxHolder.sum();
			//this.levelHandler.activation(new Big(1));
		},

		production: function(seconds){
			/*var prod = this.efxHolder.toProduction({activations:this.activations,seconds:seconds});
			this.activations = new Big(0);
			this.levelHandler.production(prod);*/
			return prod;
		}
	});

	var SLOT_STATE = Object.freeze({
		VOID	: 0,
		GHOST 	: 1,
		SOLID	: 2
	});

	Model.Slot = new Class(Model).extend({
		/*{
		x: 0,
		y: 0,
		z: 0,
		playground: null,
		
		}*/
		initialize: function(){
			this.parent();
			//this.v3 = vector3;
			this._state = SLOT_STATE.VOID;
			//this.playground = playground;
			this.m_item = null;
			this.m_view = new View.Desktop.Slot(this);
		},

		production: function(seconds){
			//if(this.m_item)return this.m_item.production(seconds);
			return 0;
		},

		item: function(id, date){
			if( Utils.defined(id) ){
				this.m_item = new Model.Item(id,this.hash);
				return this;
			}
			return this.m_item;
		},

		activate: function(){
			if(this._state == SLOT_STATE.GHOST) this.state(SLOT_STATE.SOLID);
			//if(this.m_item) this.m_item.activate();
		},

		state: function( state ){
			if( state && state != this._state){
				this._state = state;
				this.callNeighbourhood("updateState");
				return this;
			} else {
				return this._state;
			}
		},

		updateState: function(){
			if( this._state == SLOT_STATE.VOID ){
				var slots = this.select(Geom.HGrid.NEIGHBOURHOOD);
				for( var i in slots ){
					var slot = slots[i];
					if(slot._state == SLOT_STATE.SOLID){
						this.state(SLOT_STATE.GHOST);
						break;
					}
				}
			}
		}

	});

	Model.Playground = new Class(Model).extend({
		initialize: function(config){
			this.parent();
			Utils.assumeConfig(this,config);
			//console.log("playground",this);
			this.slots = [];
			this.shuffledSlots = [];

			this.m_view = new View.Desktop.Playground(this);

			this.grid = new Geom.HGrid(Model.Slot, function( v3 ){
				return 	true;//v3.x >= 0 && v3.y <= 0 && ( v3.z > -3 && v3.z < 3);
			});

			console.log("grid", this.grid);

			this.grid.origin().state(SLOT_STATE.SOLID);

		},
		getSlot: function(x,y,z) {
			var r = this.layout.radius;
			return this.slots[x+r-1][y+r-1][z+r-1];
		},
		getSlots: function(){return this.slots},
		getAllSlots: function(){
			var that = this;
			return Object.keys(this.grid.cells).map(function (key) {return that.grid.cells[key]});
		}
	});

	Model.Game = new Class(Model).extend({
		initialize: function(){
			this.parent();
		},

		build: function(){
			//this.playground = new Model.Playground(Config.playground);
			this.prod = new Big(0);
			//this.prodLeftover = new Big(0);
			this.last = new Date();
			return this;
		},

		production: function(){
			return this.prod;
		},

		update: function(date){
			BonusFactory.applyBonuses();
			this.prod = this.prod.plus(ProductionFactory.getProduction());
			Click.flush();
			//this.updateProd(date);
		}
	});
}

Control = new Class({
	initialize: function(){
		this.game = new Model.Game();
		this.game_view = new View.Game(this.game);
		this.game.build();
		this.timer = null;
		this.lastDate = new Date();
	},

	startTimer: function(){
		var c = this;
		this.timer = setTimeout(function(){
			var date = new Date();
			Ticks.setTimeLapse( new Big(date.getTime()).minus(c.lastDate.getTime()).dividedBy(1000));
			c.lastDate = date;
			c.game.update();
			ViewManager.refresh();
			DisplayFactory.refresh();
			c.startTimer();
		}, 33);
	}
});

BonusFactory().addTags("octoplant").addResources(RESC.DPC).fixed(2);
BonusFactory().addTags("octoplant").addResources(RESC.DPS).fixed(8.65);

var C = new Control();
C.startTimer();

// PRODUCTION ? 
/*

	Objectives: build a production system which can :
		easily support new kind of productions ( per click, per second, dependant, based on epxerience... )
		lead to an simple leveled bonus system

*/


//ProductionFactory().addTags("lala land").resource(RESC.DPS);
//ProductionFactory().addTags("lala flower").resource(RESC.DPC);
//ProductionFactory().addTags("flower").attr("level",25).resource(RESC.DPS);;
//ProductionFactory().addTags("flower").attr("level",50);
//BonusFactory().addTags("lala").fixed(5,-0.5).addResources(RESC.DPS);
//BonusFactory().addTags("all").fixed(0, 0.236).addResources("all");
//BonusFactory().addTags("lala flower").fixed(30).addResources(RESC.DPC);
//BonusFactory().addTags("flower").formula(function( flower ){ return [100,flower.level ? flower.level/100 : 0]}).addResources(RESC.DPS);

//BonusFactory.applyBonuses();
//Ticks.setTimeLapse(1);
//console.log( ProductionFactory.getProduction( ).toString() );


/* USE CASES

IdleD(this) // adds this._IdleD = "SIJDJnsysDJN"

var bonusID = BonusFactory(".land").on("perClick").add( new Bonus(10,50) )

var bonusID = BonusFactory( /id )
						  .resources("all dps dpc")
						  .tags("items grandma")
						  .location( [ HCells ] )
						  .fixed( flat, mult )
						  .formula( function( producer ){ return [ flat, mult ] })
						  .stackGroup( number )
						  .build();

var bonusID = BonusFactory().location( hcell.select( ["NE","E","SE","SW","W","NW"] ) )
							.type("all") // dps, dpc...
							.

							.resources("dps")
							.tags("octoplant")
							.formula( function( producer ){
								var flat = producer.getLevel();
								return [ flat, 1 ];
							})
							;
uniqueBonusId ?

var producer   = new Producer().tags("octoplant land");
var production = producer.getProduction( timelapse );


*/
/*
 var bonusID = BonusFactory()
 							.resources("dps dpc")
 							.tags("octoplant land", true)
 							.fixed(1,1.5)
 							.build();
 console.log( bonusID, BonusFactory(bonusID), BonusFactory(bonusID).formula()());
 
*/
 // plant that gain exp by moving around

 // How to handle clicks ? How to attribute them to the right producer.
 /*
	1) add attr "clicked"(number) when set resource to DPC

	2) ??

 */

 // Buy upgrades to grow the clicking area