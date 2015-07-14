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

////
var Lang = {
	all: ["en"],

	get: function( id ){
		return this.words[id][this.all[0]];
	},

	words: {
		"item-0" : {
						en: "Dandelion",
						fr: "Pissenlit"
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
		currentVbx: -50
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
			id: 0,
			name: Lang.get("item-0"),
			tile: "green",
			expFirstLevel: 10,
			growth: 1.15,
			leveling: {
				"0": [
					{
						fpa: 1,
						_fpa: Leveling(1)(Leveling.aritSeries(1))
					}
				], 
				"1": [
					{
						fps: 1,
						_fps: Leveling(1)(Leveling.geomSeries(1.15))
					}
				]
			},
			effects: [
				{
					fpa_l: Leveling(0,1)(Leveling.geomSeries(1000,1.15))
				},
				{
					fps_l: Leveling(1,1)(Leveling.geomSeries(10,1.15))
				}
			]
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
			for( i in arguments){
				assert(typeof arguments[i] === "object", "Geom.Vector2.plus: one of the parameters is not an object.");
				v._plus(arguments[i]);
			}
			return v;
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
			for( i in arguments){
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

		hasCell: function( v3 ){
			return Utils.defined(this.cells[this.hash(v3)]);
		},

		get: function( v3 ){
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
				return   pos.plus(new Geom.Vector2(Config.svg.vbx - Config.svg.currentVbx, 0))
							.scal(new Geom.Vector2(Math.min(h/w,1),1))
							.plus(new Geom.Vector2(-Config.svg.vbx,-Config.svg.vby));
			},

			fdiv: function( pos ){
				var actPos = this.toScreenXY(pos);
				return d3.select("#playground")
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

		var HexagonMenu = new Class(FloatingUI).extend({
			initialize: function(pos){
				this.parent();
				this.pos = pos;
			}
		});

		//-------
		View.Desktop.UI.SlotToolTip = function(pos, slot){return new SlotTT(pos,slot);};
		View.Desktop.UI.SlotMenu = function(pos, slot){return new HexagonMenu(pos,slot);};
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
			this._imageUrl = "sprites/octoplant_"+chromas[Math.floor(rand*chromas.length)]+".png";
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
						console.log("mouseout");
						/*console.log(group.select("feColorMatrix"));
						group.select("feColorMatrix").remove();*/
					},
					mousedown: function(){
						if(event.button != 0 ){
							this.onSpecialClick();
						} else {
							this.onClick();
						}}.bind(this),
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
			this.model.activate();
			//console.log(this.hexagon.center2D());
			
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
	{
		var Menu = View.Desktop.Menu;
		var SlotMenu = new Class(Menu).extend({
			/**
			 * @param {Vector2} Center of the slot
			 * @param {} 
			 */
			initialize: function( center, list ){
				this.parent();
				this.game = game;
				this.slotView = slotView;
			}
		});

		//-----------------
		View.Desktop.Menu.Slot = {};
		View.Desktop.Menu.Slot.build = function(){

		};
	}

	View.Desktop.Playground = new Class(View.Desktop).extend({
		initialize: function(model){
			this.parent();
			this.model = model;
			this.dom = View.Desktop.Playground.DOM;
			this.domInit();

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
		},

		onKeyDown: function( code ){
			this._scrolling[code] = true;
		},

		onKeyUp: function( code ){
			this._scrolling[code] = false;
		},

		updateScroll: function(){
			var s = this._scrolling, scrollDelta = 3;
			if( s[KEYCODES.UP] || s[KEYCODES.RIGHT] || s[KEYCODES.DOWN] || s[KEYCODES.LEFT] ){
				
				
				this.viewBox.center.x = this.viewBox.center.x + (s[KEYCODES.RIGHT]? scrollDelta : 0) - (s[KEYCODES.LEFT]? scrollDelta : 0);
				this.viewBox.center.y = this.viewBox.center.y + (s[KEYCODES.DOWN]? scrollDelta : 0) - (s[KEYCODES.UP]? scrollDelta : 0);
				for( var i in {x:null,y:null}) this.viewBox.center[i] = Math.max( this.viewBox.min[i], Math.min( this.viewBox.max[i], this.viewBox.center[i] ));
			
				Config.svg.currentVbx = this.viewBox.center.x+Config.svg.vbx;
				Config.svg.currentVby = this.viewBox.center.y+Config.svg.vby;
			
				this.svg.transition().ease('quad-out').attr("viewBox",Config.svg.currentVbx+" "+Config.svg.currentVby+" "+[Config.svg.vbw,Config.svg.vbh].join(" "))
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
		for( i in this.topics[topic]){
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


	Model.ItemEffectPattern = {
		flatPerSecondBonus: 	'+',
		scalePerSecondBonus: 	'*',
		flatPerClickBonus: 		'+',
		scalePerClickBonus: 	'*',
		globalScale: 			'*'
	};
	Model.ItemEffectLexicon = {
		fpa: "flatPerClickBonus",
		spa: "scalePerClickBonus",
		fps: "flatPerSecondBonus",
		sps: "scalePerSecondBonus",
		sc:   "globalScale"
	};
	Model.ItemEffect = new Class(Model).extend({
		initialize: function(){
			this.parent();
			this.id = 0;
			for( params in Model.ItemEffectPattern ){
				this[params] = Model.Math.neutrals[Model.ItemEffectPattern[params]];
			}
		},

		add: function(itemEffect) {
			//console.log("add", itemEffect);
			for( params in Model.ItemEffectPattern ){
				this[params] = Model.Math.operations[Model.ItemEffectPattern[params]](this[params],itemEffect[params]);
			}
			return this;
		},

		set: function(param, value){
			//assert( Utils.defined(this[param]), "Model.ItemEffect.set: trying to set a unexistant parameter" );
			this[param] = value;
			return this;
		},

		copy: function(){
			return new Model.ItemEffect().add(this);
		}

	});
	Model.ItemEffect.LevelingIE = new Class(Model.ItemEffect).extend({
		initialize: function( effectDescriptor ){
			this.parent();
			this.effectDescriptor = effectDescriptor || {};
			this.level = new Big(0);
			this.initStats();
			this.setLevel( new Big(0));
		},

		initStats: function(){
			for( efx in Model.ItemEffectLexicon ){
				if( this.effectDescriptor[efx] ){
					this[Model.ItemEffectLexicon[efx]] = this.effectDescriptor[efx];
				}
			}
		},

		setLevel: function( level ){
			this.level = level;
			//console.log("Model.ItemEffect.LevelingIE.setLevel", level.toNumber());
			for( efx in Model.ItemEffectLexicon ){
				if( this.effectDescriptor[efx+Leveling.LEVEL_SUFIX] ){
					this[Model.ItemEffectLexicon[efx]] = this.effectDescriptor[efx+Leveling.LEVEL_SUFIX].getValue(level);
					//console.log(Model.ItemEffectLexicon[efx],this[Model.ItemEffectLexicon[efx]].toNumber());
				}
			}
		}
	});

	Model.EfxHolder = new Class(Model).extend({
		initialize: function(){
			this.parent();
			this.efx = [];
			this.m_sum = this.neutralEfx();
		},

		neutralEfx: function(){return null;},

		add: function( efx ){
			if( typeof efx[0] === 'undefined'){
				this.efx.push(efx);
			} else {
				this.efx.push.apply(this.efx,efx);
			}
			this.update();
			return this;
		},

		update: function(){
			this.m_sum = this.neutralEfx();
			for( var e in this.efx) this.m_sum.add(this.efx[e]);
			//console.log("EfxHolder updated :",this.m_sum,this.efx);
			return this;
		},

		sum: function(){
			return this.m_sum.copy();
		}

	});

	Model.IEfxHolder = new Class(Model.EfxHolder).extend({
		initialize: function(){
			this.parent();
			this.m_sum = new Model.ItemEffect();
		},
		neutralEfx: function(){
			return new Model.ItemEffect();
		},

		toProduction: function(opts){
			var sum = this.sum();
			var activations = opts["activations"] || new Big(0);
			var seconds = opts["seconds"] || new Big(0);
			var prod = seconds.times(sum.flatPerSecondBonus).plus(activations.times(sum.flatPerClickBonus));
			//console.log("Prod for "+seconds.toNumber()+"("+sum.flatPerSecondBonus+") seconds and "+activations.toNumber()+"("+sum.flatPerClickBonus+") = "+prod.toNumber());
			return prod;
		}
		
	});

	Model.LIEfxHolder = new Class(Model.IEfxHolder).extend({
		initialize: function(){
			this.parent();
			this.setLevel(new Big(0));
		},
		/*neutralEfx: function(){
			return new Model.ItemEffect.LevelingIE();
		},*/
		setLevel: function(level){
			if( typeof level === 'number') level = new Big(level);
			//console.log("Model.LIEfxHolder.setLevel",level.toNumber(),this.efx);
			for( var i in this.efx ){
				if( this.efx[i].setLevel ){
					this.efx[i].setLevel(level);
				}
			}
			this.update();
			//console.log(this);
		}
	});

	Model.Leveling = new Class(Model).extend({
		initialize: function(){
			this.parent();
			this.levels = [];
		},

		at: function( a, b ){
			switch(arguments.length){
				case 1:
					return this.levels[a];
				case 2:
					if( ! this.levels[a] ) this.levels[a] = [];
					this.levels[a].push(b);
					break;
			}
			return this;
		}
	});

	Model.ILevelHandler = new Class(Model).extend({
		initialize: function( item ){
			this.leveling = /*Config.items[item.type].leveling |*/ new Model.Leveling().at(1,new Model.ItemEffect().set("flatPerSecondBonus",1));
			this.item = item;
			this.level = new Big(0);
			this.experience = new Big(0);
			this.addEfx();
			this.item.efxHolder.setLevel(0);
		},
		addEfx: function( level ){
			/*if(this.leveling.at(level)) {
				var array = this.leveling.at(level);
				for( var effect in array) {
					this.item.efxHolder.add(array[effect]);
				} 
			}*/
			for( var e in Config.items[this.item.type].effects){
				this.item.efxHolder.add(new Model.ItemEffect.LevelingIE(Config.items[this.item.type].effects[e]));
			}
			return this;
		},
		addExp: function( exp ){
			assert(typeof exp !== 'number', "Model.ILevelHandler.addExp");
			if(exp.greaterThan(0)){
				this.experience = this.experience.plus(exp);
				var newLevel = this.levelFromExp(this.experience);
				for(var i = this.level.toNumber()+1; i <= newLevel.toNumber(); ++i){
					console.log("levelup");
					//this.addEfx(i);
					//this.dispatch('levelup');
					this.item.efxHolder.setLevel(i);
				}
				this.level = newLevel;
			}
			return this;

		},
		levelFromExp: function( exp ){
			var base = 10;
			var growth = new Big(1.15);
			return exp == 0 ? new Big(0) : Big.max(0,new Big(1).minus(exp.times(new Big(1).minus(growth)).dividedBy(base)).log(1.15)).floor();//Math.log(exp/10)/Math.log(1.15);
		},
		activation: function( big ){
			this.addExp(big);
		},
		production: function( big ){
			this.addExp(big);
		}
	});

	Model.Item = new Class(Model).extend({
		initialize: function( id, date ){
			this.parent();
			this.type = id;
			this.typeData = Config.items[id];

			this.harvestTime = date | new Date();

			this.efxHolder = new Model.LIEfxHolder();
			this.levelHandler = new Model.ILevelHandler(this);
			this.activations = new Big(0);
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
			this.activations = this.activations.plus(1);//var efc = this.efxHolder.sum();
			//this.levelHandler.activation(new Big(1));
		},

		production: function(seconds){
			var prod = this.efxHolder.toProduction({activations:this.activations,seconds:seconds});
			this.activations = new Big(0);
			this.levelHandler.production(prod);
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
			if(this.m_item)return this.m_item.production(seconds);
			return 0;
		},

		item: function(id, date){
			if( Utils.defined(id) ){
				this.m_item = new Model.Item(id,date);
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
			this.playground = new Model.Playground(Config.playground);
			this.prod = new Big(0);
			this.prodLeftover = new Big(0);
			this.last = new Date();
			return this;
		},

		// todo : duration instead, so we can pause the game
		updateProd: function(date){ 
			var prod = new Big(0).plus(this.prodLeftover);
			var seconds = new Big(date.getTime()).minus(new Big(this.last.getTime())).dividedBy(1000);
			var prods = this.playground.getAllSlots().map(function(slot){return slot.production(seconds);});
			for( i in prods ){
				prod = prod.plus(prods[i]);
			}
			this.prodLeftover = prod.minus(prod.floor());
			this.prod = this.prod.plus(prod.floor()); 
			this.last = date;
		},

		production: function(){
			return this.prod;
		},

		update: function(date){
			this.updateProd(date);
		}
	});
}

Control = new Class({
	initialize: function(){
		this.game = new Model.Game();
		this.game_view = new View.Game(this.game);
		this.game.build();
		this.timer = null;
	},

	startTimer: function(){
		var c = this;
		this.timer = setTimeout(function(){
			c.game.update(new Date());
			ViewManager.refresh();
			c.startTimer();
		}, 33);
	}
});

var C = new Control();
C.startTimer();

//var mpg = new Model.Playground(Config.playground);
//var vpg = new View.Desktop.Playground({model:mpg, dom: d3.select("#playground")});

//ViewManager.refresh();
//console.log("manager",ViewManager);
//vpg.die();
//ViewManager.refresh();
//console.log("manager",ViewManager);


//var v = new View.Slot({model:mpg.getSlot(0,0,0)});

//console.log(mpg,vpg);
//console.log(v);
//mpg.getSlot(0,0,0).notify();
//mpg.notify();


/*
var MyClass = new Class({
	initialize: function(a,b,c){console.log(a,b,c)},
	sayHello: function(){console.log("hello")}
});

var grid = new Geom.HGrid(MyClass, function( v3 ){
	return 	v3.x >= 0 && v3.y <= 0 && ( v3.z > -3 || v3.z < 3);
});
//grid.new(new Geom.Vector3(1,-5,2))(3,2,1);
//console.log(grid.get(new Geom.Vector3(1,-3,2)).EAST());
//console.log(grid);

console.log(grid.origin().select(["E","W","NE","WW","EE"]));*/




//? Create view before model, then notify ? Or create model, create view, init model