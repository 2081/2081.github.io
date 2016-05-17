

var Obs = {};

(function(){

	var obsa = '_HjgoDKls_obsa';
	var obse = '_HjgoDKls_obse';

	var types = {};

	function ObsaManager( obsa ){
		this.observers = [];
		this.obsa = obsa;
	};

	ObsaManager.prototype = {
		notify: function( evt, params ){
			//console.log('notify', this);
			var f = 'on' + evt.charAt(0).toUpperCase() + evt.slice(1);
			for( var i in this.observers ){
				//console.log(this.observers[i][f]);
				if( this.observers[i][f] instanceof Function ){
					this.observers[i][f]( this.obsa, params );
				}
			}
		},
		add: function( obse ){
			this.observers.push(obse);
		},
		remove: function( obse ){
			this.observers = this.observers.filter(function( o ){ return o !== obse });
		}
	};


	Obs.observe = function( x, obse ){
		if( !x ) throw 'Error, nothing to observe !';
		if( x instanceof Function ){
			//console.log(x.name);
			var obj = types[x.name] || (types[x.name] = {f: x, obse: []})	;
			obj.obse.push( obse );
		} else if( x[obsa] ) {
			x[obsa].add(obse);
		}
		return obse;
	};

	Obs.stopObservation = function( x, obse ){
		if( !x ) throw 'Error, nothing to stop observing !';
		if( x instanceof Function ){
			var obj = types[x.name];
			if( obj ){
				obj.obse.filter( function(o){ return o !== obse });
				if( obj.obse.length == 0 ) delete types[x.name];
			}
			
		} else if( x[obsa] ) {
			x[obsa].remove(obse);
		}
	}

	Obs.observable = function( obj, bool ){
		if( bool ){
			obj[obsa] = obj[obsa] || new ObsaManager( obj );

			for( var key in types ){
				if( obj instanceof types[key].f ){
					types[key].obse.map( function( o ){ obj[obsa].add(o) });
				}
			}
			if( obj.notify ) console.warn('Overriding existing notify function.');
			obj.notify = obj[obsa].notify.bind(obj[obsa]);
			obj.notify('arrive');
		} else {
			if( obj.notify ) obj.notify('leave');
			delete obj[obsa];
			delete obj.notify;
		}
	};

})();

// function A(){
// 	Obs.observable(this, true);
// }

// A.prototype = {
// 	destroy: function(){
// 		Obs.observable(this, false);
// 	}
// }

// function B( a ){
// 	Obs.observe( A, {onArrive: this.newA, onLeave: function(a){console.log('dieded', a)}} );
// 	Obs.observe( a, this);
// }

// B.prototype = {
// 	newA: function( a, params ){
// 		console.log("new A !", a );
// 	},
// 	onFoo: function( a ){
// 		console.log('Foo', a);
// 	}
// }

// var a = new A();

// var b = new B( a );

// var a2 = new A();
// a2.destroy();	

// a.notify('foo');

// Obs.stopObservation( a, b );

// a.notify('foo');

// console.log(a);

// Obs.observe( Poly, {
// 	onArrive: function( poly ){

// 	},

// 	onLeave: function( poly ){

// 	},

// 	onXXX: function( poly ){

// 	}
// });

// Obs.observe( instance, {
// 	onXXX: function( poly ){

// 	},

// 	onYYY: function( poly ){

// 	}
// });