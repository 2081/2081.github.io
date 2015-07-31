console = console || {};
console.log = console.log || function(){};
console.warn = console.warn || function(){};
console.assert = console.assert || function(){};

Big = Decimal; // Late library change

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

var GLOSS = {};
GLOSS.DEFAULT = "default";

var TESTING		= true;
var assert = function(assertion){
	/*if( TESTING && !assertion ){
		arguments[0] = "ASSERTION FAILED";
		console.warn.apply(console,arguments);
	}*/
	if( TESTING ){
		arguments[0] = assertion;
		console.assert.apply(console,arguments);
	}
}

function isHash( str ){
	return /^-?[0-9]+_-?[0-9]+_-?[0-9]+$/.test(str);
}

var GUID;
(function GUIDScope(){
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

var DataHandler = new Class({
	initialize: function( data ){
		this.data = data;
	},

	attr: function( name, value ){
		if( typeof value === 'undefined' ) return this.data[name];
		this.data[name] = value;
		return this;
	},

	attrKeyValue: function( name, key, value ){
		if( typeof value === 'undefined' ) return this.data[name][key];
		this.data[name][key] = value;
		return this;
	},

	id: function(){ return this.data.id }
});

var DataSelectionHandler = new Class({
	initialize: function( selection){
		this.selection = selection || [];
		this.length = this.selection.length;
	},

	attr: function( name, value ){
		if( typeof value === 'undefined' ) return this.selection.map(function(o){ return o[name] });
		for( var i in this.selection ){
			this.selection[i][name] = value;
		}
		return this;
	},

	_handlerClass: DataHandler,

	array: function(){
		var handler = this._handlerClass;
		return this.selection.map( function( data ){ return new handler(data) });
	}
});



var Init;

(function InitScope(){

	var inits = [];


	Init = function(f){
		if( f ){
			inits.push(f);
		} else {
			inits.each(function(o){o()});
		}
	}

})();