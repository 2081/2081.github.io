////
var Config = {
	playground : {
		layout : {
			radius: 4
		}
	},

	colors : {
		tiles : {
			blank: "#917663",
			blank_over: "#A18572",
			blank_border : "#574030"
		}
	}
};
////
var Utils = {};
{
	Utils.assumeConfig = function(obj, config){
		for( item in config ){
			obj[item] = config[item];
		}
	};

	Utils.svgNS = "http://www/w3.org/2000/svg";

	Utils.createSvgElement = function(elt){
		return document.createElementNS(Utils.svgNS,elt);
	}

	Utils.Svg = new Class({
		initialize: function(){
			this.svgNS = "http://www/w3.org/2000/svg";
			//this.svg = document.createElementNS(Utils.svgNS,"svg");
			this.svg = document.getElementById("playground-svg");
			//this.svg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
			console.log("SVG", this.svg);
		},

		append: function( elt ){
			console.log("appendChild",this.svg,elt);
			this.svg.appendChild(elt);
		}
	});

	Utils.Svg.Circle = function(config){
		var obj = document.createElementNS(Utils.svgNS,"circle");
		for( property in config ){
			obj.setAttributeNS(Utils.svgNS,property,config[property]);
		}
		return obj;
	};
}
////
/*
var notifications = {
	observers : [],
	addObserver : function( obs ){
		this.observers.push(obs);
	},
	flush: function( functions ){
		for( var i = 0; i < this.observers.length; ++i){
			for( f in functions ){
				this.observers[i][f]();
			}
		} 
		this.observers = [];
	}
};*/
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

	View.Desktop.Slot = (new Class(View.Desktop)).extend({
		initialize: function (config) {
			this.parent(config);
			this.setRadius();
			this.setXYCenter();
			this.setXYSum();
			this.domInit();
		},

		domInit: function(){
			var xyCenter = this.xyCenter();
			console.log("xy",this.xyCenter());

			/*this.svg.append("circle").attr({
				cx:this.xyCenter().x,
				cy:this.xyCenter().y,
				r: 10,
				fill: "yellow"
			});*/
			this.svg.append("polygon")
					.attr("points",this.xySum().join(" "))
					.attr({
						fill: Config.colors.tiles.blank,
						stroke: Config.colors.tiles.blank_border
					}).on({
						mouseover: function(){d3.select(this).attr("fill",Config.colors.tiles.blank_over);},
						mouseout : function(){d3.select(this).attr("fill",Config.colors.tiles.blank);}
					});
		},

		update: function(){
			console.log("updating slot",this);
		},

		setRadius: function(){
			var side = Math.min(parseInt(this.container.style("width")),parseInt(this.container.style("height")));
			this.interRadius = side/((Config.playground.layout.radius*2-1)*2);
			this.radius = (this.interRadius)/Math.cos(Math.PI/6);
		},

		setXYCenter: function(){
			var x = (this.model.x - this.model.y)/2;
			var y = this.model.z;
			var w = parseInt(this.container.style("width"));
			var h = parseInt(this.container.style("height"));
			this._xyCenter = {x:w/2+x*2*this.interRadius,	y:h/2+y*2*this.interRadius*Math.cos(Math.PI/6)};
		},

		xyCenter: function() {
			return this._xyCenter;
		},

		setXYSum: function(){
			var x = this.xyCenter().x;
			var y = this.xyCenter().y;
			var angles = [Math.PI/2, Math.PI/6, -Math.PI/6, -Math.PI/2, -5*Math.PI/6, 5*Math.PI/6];
			var sums = [];
			for( var i = 0; i < angles.length; ++i){
				sums[i] = [ x+this.radius*Math.cos(angles[i]),
							y+this.radius*Math.sin(angles[i]) ];
			}
			this._xySum = sums;
		},
		xySum: function(){return this._xySum;}
	});

	View.Desktop.Playground = new Class(View.Desktop).extend({
		initialize: function(config){
			this.parent(config);
			this.domInit();

			console.log("vplayground",this,config);
			this.slots = [];
			var m_slots = this.model.getSlots();
			for( i in m_slots ){
				for( j in m_slots[i] ){
					for( k in m_slots[i][j]){

							this.slots.push(new View.Desktop.Slot({
								model:m_slots[i][j][k],
								svg: this.svg,
								container: this.dom
							}));
					}
				}
			}
		},

		domInit: function(){
			this.svg = this.dom.append("svg");
		},

		update: function(){
			console.log("updating playground",this);
		}
	});
}

////
var Model = new Class({
	initialize: function(config){
		Utils.assumeConfig(this, config);
		this.observers = [];
	},
	notify: function(){
		for( i in this.observers){
			this.observers[i].notify();
		}
	},
	addObserver: function( obs ){
		this.observers.push(obs);
	}
});
{
	Model.Slot = new Class(Model).extend({
		/*{
		x: 0,
		y: 0,
		z: 0,
		playground: null
		}*/
		initialize: function(config){
			this.parent(config);
		}
	});

	Model.Playground = new Class(Model).extend({
		initialize: function(config){
			this.parent(config);
			console.log("playground",this);
			this.slots = [];
			for( var i = 0; i < this.layout.radius*2-1; ++i) {
				this.slots[i] = [];
				for( var j = 0; j < this.layout.radius*2-1; ++j) {
					this.slots[i][j] = [];
					for( var k = 0; k < this.layout.radius*2-1; ++k) {
						if(i+j+k == 3*(this.layout.radius-1)){
							console.log("ok");
							this.slots[i][j][k] = new Model.Slot({
								x: i-this.layout.radius+1,
								y: j-this.layout.radius+1,
								z: k-this.layout.radius+1,
								playground: this
							});
						}
					}
				}
			}
		},
		getSlot: function(x,y,z) {
			var r = this.layout.radius;
			return this.slots[x+r-1][y+r-1][z+r-1];
		},
		getSlots: function(){return this.slots}
	});

	Model.Game = new Class(Model).extend({

	});
}

var mpg = new Model.Playground(Config.playground);
var vpg = new View.Desktop.Playground({model:mpg, dom: d3.select("#playground")});

ViewManager.refresh();
console.log("manager",ViewManager);
vpg.die();
ViewManager.refresh();
console.log("manager",ViewManager);


//var v = new View.Slot({model:mpg.getSlot(0,0,0)});

//console.log(mpg,vpg);
//console.log(v);
//mpg.getSlot(0,0,0).notify();
mpg.notify();