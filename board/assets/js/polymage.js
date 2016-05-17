
var Polymage;

(function(){

function sortData( data ){
	for( var key in data.graphics){
		var arr = data.graphics[key].polygons;

		function bar( tab ){
			//console.log('bar', tab);
			var x = 0; y = 0;
			for( var i in tab ){
				x += tab[i][0]; y+= tab[i][1];
			}
			return [x/tab.length, y/tab.length];
		}
		//console.log(arr.map(function(o){return bar(o.v)[1]}));

		data.graphics[key].polygons = arr.sort(function(a, b){
			//console.log(a, b, bar(a.v), bar(b.v), bar(b.v)[1] - bar(a.v)[1]);
			//console.log('sorting');
			return bar(a.v)[1] - bar(b.v)[1];
		});

		//console.log(arr.map(function(o){return bar(o.v)[1]}));
	}
}

function toper( x ){
	return x*100+'%';
}

function _polymage_notify( polymage, str_event ){
	(polymage._listeners[str_event] || []).map(function( f ){
		if( f instanceof Function ) f(polymage);
	});
}

function tocss( rgb ){
	return 'rgb('+rgb[0]+', '+rgb[1]+', '+rgb[2]+')';
}

function colorFilter( rgb, filter ){
	return (filter instanceof Array ? rgb.map(function( val, i ){ return Math.floor(val*(filter[i] || 1) + (filter[i+3] || 0))}) : rgb);
}

Polymage = function( data, type ){
	this.data = null;
	this.loaded = null;
	this.pctn = null;
	this.$ = $('<div class="polymage"></div>');
	this.$polys = [];
	this.backgroundColor = '';

	this.filter = null;

	this.shiftx = this.shifty = 0;

	var polymage = this;

	function onDataLoaded( data ){
		this.data = data;
		sortData(this.data);
		//console.log(this.data);

		this.complexity = data.maxPolyCount;
		this.names = Object.keys(data.graphics);
		this.names.map(function(name, i){ this.data.graphics[name].index = i }.bind(this));

		this.current = -1;

		console.log('Creating Polymage with', data.maxPolyCount, 'polygons...');

		var P = this.data.maxPolyCount;
		for( var i = 0; i < P; ++i ){
			var ph = $('<div class="polygon-holder"></div>');
			var p = $('<div class="polygon"></div>');
			this.$.append(ph.append(p));
			this.$polys.push(p);

			m = P%2 == 0 ? 1 : 0;

			ph.css('transition-delay', 0.01*i+'s');
		}
		
		this.loaded = true;
		this.ready();
	}

	switch( type ){
		case 'obj':
			onDataLoaded(data);
			break;
		case 'url': default:
			$.get( data , onDataLoaded.bind(this), 'json')
			 .fail(function(){
			 	throw new Error('Polymage load failed. Cannot load json file.');
			 });
	}

	this._listeners = {};
}
Polymage.prototype = {
	next: function(){ return this.change(++this.current) },
	prev: function(){ return this.change(--this.current) },
	change: function( name ){
		if( !this.loaded ) return 0;
		var g;

		if( !name ){
			g = this.data.graphics[this.names[this.current]];
		} else {
			switch( typeof name ){
				case 'number':
					this.current = (name+this.names.length)%this.names.length || 0;
					g = this.data.graphics[this.names[this.current]];
					break;
				case 'string':
					g = this.data.graphics[name];
					this.current = g ? g.index : 0;
					//for( var i in this.names ) if( this.names[i] == name ) this.current = i; 
			}
		}

		if( !g && g !== 0 ) {
			console.log(this.current, this.loaded, g, g !== 0, name, typeof name);
			throw new Error("Can't change polymage to "+name+". Data not found.");
		}


		if( this.useBackground ) this.$.css('background-color', tocss( colorFilter(g.backgroundColor, this.filter)));
		this.backgroundColor = tocss( colorFilter(g.backgroundColor, this.filter) );
		// $('#game').css('background-color', g.backgroundColor);
		var P = this.data.maxPolyCount;
		for( var i = 0, j = 0, k = 0; j < P; ++j ){
			if( k++ >= Math.ceil((P-i)/g.polyCount) ) k=1, i++;

			data = g.polygons[i];
			var div = this.$polys[j];

			var vertices = data.v;

			var clip = 'polygon(';
			for( var v = 0; v < vertices.length; ++v ) clip += toper(vertices[v][0]+this.shiftx)+' '+ toper(vertices[v][1]+this.shifty)+(v < vertices.length-1 ? ',':'');

			div.css({
				'-webkit-clip-path': clip,
				'background-color': tocss( colorFilter(data.c, this.filter) ),
				'z-index': data.z
			});
		}
		_polymage_notify(this, 'change');
	},
	ready: function( f ){
		this._readyListeners = this._readyListeners || [];
		if( this.loaded ){
			if( this._readyListeners.length > 0 ){
				for( var i in this._readyListeners ) this._readyListeners[i](this);
			}
			if( f ) f(this);
		} else {
			this._readyListeners.push(f);
		}
		return this;
	},
	on: function( str, callback ){
		(this._listeners[str] || (this._listeners[str] = [])).push(callback);
		return this;
	},
	off: function( str, callback ){
		(this._listeners[str] || []).filter(function(c){ return c !== callback});
		return this;
	},
	background: function( bool ){
		this.useBackground = bool;
		this.$.css('background-color', this.useBackground? this.backgroundColor : '');
		return this;
	},

	// [ fr, fg, fb, dr, rg, db ]
	setFilter: function( f ){
		this.filter = f || null;
		return this;
	},

	refresh: function(){
		this.change(this.current);
		return this;
	},

	shift: function( x, y ){
		this.shiftx = x || 0;
		this.shifty = y || 0;
	}

}
})();