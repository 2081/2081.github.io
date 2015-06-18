////
var Config = {};
{
	Config.playground = {
		layout : {
			radius: 4
		}
	}
}
////
var Utils = {};
{
	Utils.assumeConfig = function(obj, config){
		for( item in config ){
			obj[item] = config[item];
		}
	}
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
var View = new Class({
	initialize: function(config){
		Utils.assumeConfig(this,config);
		this.notified = false;
		this.subscribe();
	},
	subscribe: function(){
		if(this.model) this.model.addObserver(this);
	},
	notify: function(){
		this.update();
	},
	update: function(){}
});
{

	View.Slot = (new Class(View)).extend({
		initialize: function (config) {
			//Utils.assumeConfig(this, config);
			this.parent(config);
		},

		update: function(){
			console.log("updating slot",this);
		}
	});

	View.Playground = new Class(View).extend({
		initialize: function(config){
			this.parent(config);
			console.log("vplayground",this,config);
			this.slots = [];
			var m_slots = this.model.getSlots();
			for( i in m_slots ){
				for( j in m_slots[i] ){
					for( k in m_slots[i][j]){
						this.slots.push(new View.Slot({model:m_slots[i][j][k]}));
					}
				}
			}
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
						this.slots[i][j][k] = new Model.Slot({
							x: i-this.layout.radius,
							y: j-this.layout.radius,
							z: k-this.layout.radius,
							playground: this
						});
					}
				}
			}
		},
		getSlot: function(x,y,z) {
			var r = this.layout.radius;
			return this.slots[x+r][y+r][z+r];
		},
		getSlots: function(){return this.slots}
	});
}

var mpg = new Model.Playground(Config.playground);
var vpg = new View.Playground({model:mpg});


//var v = new View.Slot({model:mpg.getSlot(0,0,0)});

console.log(mpg,vpg);
//console.log(v);
mpg.getSlot(0,0,0).notify();
mpg.notify();