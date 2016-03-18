var Game = {};

(function(){

	// Sloth, Envy, Pride, Lust, Wrath, Greed, Gluttony
	// Prudence, Justice, Temperance, Courage, Faith, Hope, Charity/Love

	/*
		Array of features with or without names, shown as a Diagram

			^
			|
			|
			|
			|
			|       I
			| I     I
			| I     I
			| I     I  I    I     I    I    I  I  I
			| I  I  I  I    I  I  I    I    I  I  I
			+------------------------------------------------------>

		Combat stats:
			
			Health : Unit dies when 0.
			???? : Health regeneration per 10 tile.
			Swiftness: Chance to avoid attacks and do critical strikes.
			Resistance: Resistance to attacks.
			Attack: Attack power (dice number).

			Stamina : Used to play moves.
			Breath : Stamina regeneration per tile.

		Body:
			Size, Weight, Strength
		Mind:
			Focus, Heart, Intellect

		Combat stats:
			Health: size + 2*weight + 0.5*strength
			Regen: 2*strength - size + focus
			Swiftness: 2*intellect + 0.5*strength + focus - size -weight
			Resistance: 2*weight + strength + 2*heart
			Attack: 3*strength +size -2*heart +focus
	*/

	// Modules Declarations
	var Map, Obstacle, Action, Unit;

	// GLOSSARY
	// C1 : Primary caracteristics --> used for evolution
	// C2 : Secondary caracteristics --> used for the adventure

	// OBJECTS

	// CLASSES DECLARATIONS
	var C1, C2, Terrain, Effect, Challenge, Dice, Unit, Tile, Map, PRNG, Pool;

	// Utils
	var Utils = {
		namesToAccessors: function( proto, names ){
			for( var i in names ) {
				(function(){
					var str = names[i];
					proto[str] = function( n ){
						if( typeof n === 'number' ){
							this['_'+str] = n;
							return this;
						} else {
							return this['_'+str];
						}
					};
				})();
			}
		},

		// returns y s.t. 1-d <= y <= 1+d
		// f(x) = 1 + d*(2x - 1)^(2*P + 1)
		// The higher P is, the more often d is close to 1
		deviation: function( x, d, P ){
			d = d || 0; P = P || 1;
			return 1 + d*Math.pow(2*x - 1, 2*P + 1);
		}
		,
		// x entropy, 0 <= x <= 1
		// mu max deviation from parents
		// u, v parents value
		evolutionMean: function( x, u, v, mu ){
			if( typeof mu !== 'number') mu = 0.1;
			var c = (1-mu)*u,
				b = (1-mu)*(v-u) + 4*mu*(u+v),
				a = -4*mu*(u+v);
			return a*x*x + b*x + c;
		}

	};

	(function(){

		// https://gist.github.com/blixt/f17b47c62508be59987b
		PRNG = function( seed ){
			this._seed = 777;
			this.seed(seed);
		};

		PRNG.prototype = {
			next: function(){
				return this._seed = this._seed * 16807 % 2147483647;
			},
			nextFloat: function(){
				return (this.next() -  1) / 2147483646;
			},
			seed: function( seed ){
				if( typeof seed === 'number' ){
					this._seed = Math.floor(seed) % 2147483647;
					if( this._seed <= 0 ) this._seed += 2147483646;
				} else {
					return this._seed;
				}
			}
		};

		PRNG.array = function( N, seed ){
			if( typeof seed !== 'number' ) throw 'Error: the seed must be a number. Current type:'+typeof seed;
			seed = Math.floor(seed) % 2147483647;
			if( seed <= 0 ) seed += 2147483646;
			var a = [];
			for( var i = 0; i < N; ++i){
				a[i] = seed = seed * 16807 % 2147483647;
			}
			return a;
		};

		PRNG.next = function( seed ){
			return seed * 16807 % 2147483647;
		};

		PRNG.toFloat = function( N ){
			return (N-1)/2147483646;
		};

	})();

	// DEFINITIONS

	// C1
	(function(){
		// CONSTANTS
		var _NAMES = ['size','weight','strength','focus','heart','intellect'];

		C1 = function C1( options ){
			options = options || {};
			for( var i in _NAMES ) this['_'+_NAMES[i]] = options[_NAMES[i]] || 0;
		}
		
		C1.prototype = {
			names: C1.names,
			toC2: function(){
				return new C2({
					health: 2*this.weight() + this.size() + 0.5*this.strength(),
					regen: 0.5*this.strength() + 0.25*this.focus() - 0.5*this.size(),
					swiftness: 2*this.intellect() + this.focus() + 0.5*this.strength() - this.size() - this.weight(),
					resistance: 0.75*this.weight() + 0.75*this.heart() + 0.25*this.strength(),
					attack: 2*this.strength() + 0.67*this.size() + 0.67*this.focus() - 1.33*this.heart()
				});
			}
		}

		C1.names = function(){return _NAMES.slice()};

		Utils.namesToAccessors(C1.prototype, _NAMES);

	})();

	// C2
	(function(){
		// CONSTANTS
		var _NAMES = ['health','regen','swiftness','resistance','attack'];

		C2 = function C2( options ){
			if( options instanceof C2 ){
				for( var key in options ) this[key] = options[key];
			} else {
				options = options || {};
				for( var i in _NAMES ) this['_'+_NAMES[i]] = Math.floor(100*options[_NAMES[i]])/100 || 0;
			}
		};

		C2.names = function(){return _NAMES.slice()};
		
		C2.prototype = {
			names: C2.names,
			add: function( c2 ){
				if( !(c2 instanceof C2)) throw 'Error: C2 expected';
				_NAMES.map(function( name ){
					this[name]( this[name]() + c2[name]());
				}.bind(this));
			}
		};
		
		Utils.namesToAccessors(C2.prototype, _NAMES);

	})();

	// Effect
	(function(){

		Effect = function Effect( options ){
			options = options || {};
			for( var key in options) this[key] = options[key];
		};

		Effect.prototype = {
			compute: function( c2 ){
				return new C2();
			},
			apply: function( c2 ){
				return  Effect.apply(c2, this);
			}
		};

		Effect.apply = function( c2, effect ){
			c2.add( effect.compute(c2) );
			
		};

		Effect.FlatEffect = function FlatEffect( options ){ Effect.call(this, options); };
		Effect.ScalEffect = function ScalEffect( options ){ Effect.call(this, options); };

		Effect.FlatEffect.prototype = Object.create(Effect.prototype, {
			compute: {value: function( irrelevent_c2 ){
				var res = new C2();
				C2.names().map(function( name ){ res[name]( this[name] || 0 ) }.bind(this));
				return res;
			}}
		});
		Effect.ScalEffect.prototype = {
			compute: function( c2 ){
				var res = new C2();
				C2.names().map(function( name ){ res[name]( ( this[name] || 0 )*c2[name]() ); }.bind(this));
				return res;
			}
		}

	})();

	(function(){

		// var DiceResult = function( n ){
		// 	Array.apply(this, arguments);
		// 	//this.length = n;
		// 	this[n-1] = false;
		// };
		// DiceResult.prototype = Object.create(Array.prototype, {
		// 	wins: {
		// 		value:function(){console.log('wins', this, this.length); return this.;
		// 	}}
		// });

		Dice = function Dice( faces ){
			this.faces = faces || 6;
			this._win = []; // last number by default
			this._win[faces-1] = true;
		};

		Dice.prototype = {
			win: function( arr ){
				if( !(arr instanceof Array) ){
					var a = []; for(var i = 0; i < arguments.length; ++i) a[i] = arguments[i];
					return this.win.call(this, a);
				}
				this._win = [];
				arr.map(function(n){ this._win[n-1] = true}.bind(this));
				return this;
			},
			roll: function( n ){
				if( typeof n === 'number' ){
					var dr = new Array(n).fill(false).map(this.roll.bind(this));
					dr.wins = function(){return dr.find(function(o, i){ return o.win }) ? true: false};
					return dr;
				} else {
					var f = Math.floor(Math.random()*this.faces);
					return { face: f+1, win: this._win[f] || false};
				}
			}
		};

	})();

	// console.log(new Dice(20).win(8,7).roll(1));

	// var d = new Dice(20).win(4,6);
	// var n = 0, N = 100000;

	// var begin = Date.now();
	// for( var i = 0; i < N; ++i ){
	// 	n += d.roll(1).wins() ? 1 : 0;
	// }
	// console.log('wins:',n/N,'('+(Date.now()-begin)+'ms)');


	// Challenge
	(function(){
		Challenge = function Challenge( options ){
			options = options || {};
			this.diceWeights = options.diceWeights || new C2();
			this.dice = options.dice || new Dice(6);
			this.effects = ( options.effects instanceof Array ? options.effects : [options.effects])  || []; // new Effect();
			this.minDiceNumber = options.minDiceNumber || 0;

			this.guardian = options.guardian || new C2();
		};
		Challenge.prototype = {
			setGuardian: function( guardian ){ this.guardian = guardian; },
			computeDiceNumber: function( challenger ){
				var diceNumber = this.minDiceNumber;
				C2.names().map(function(name){
					var delta = ( challenger[name]() - this.guardian[name]() )*this.diceWeights[name]();
					//console.log('delta > ', name, delta, challenger[name](), this.guardian[name](), this.diceWeights[name]());
					if( delta > 0 ) diceNumber += delta; 
				}.bind(this));
				//console.log('diceNumber > ', diceNumber,Math.floor(diceNumber), challenger, this.guardian);
				return Math.floor(diceNumber);
			},
			confront: function( challenger ){
				var dn = this.computeDiceNumber( challenger );
				var dr = this.dice.roll(dn);
				return { passed: dn == 0 ? false : dr.wins(), diceResults: dr, effects: this.effects };
			}
		};
	})();


	(function(){

		var _TYPES = ['Grass','Thorns'];

		Terrain = function Terrain( level, seed ){
			this._level = level || 0;
			this._seed = seed;
			this.challenge = null;
		};
		Terrain.prototype = {
			challenge: function( c ){ if(c){this.challenge = c; return this;}else{return this.challenge;}},
			update: function(){ return this;},
			level: function( l ){ if(l){this._level = l; this.update(); return this;}else{return this._level;}}
		};
		Terrain.types = function(){ return _TYPES.slice();};

		Terrain.Grass = function Grass(){ Terrain.apply(this, arguments)};
		Terrain.Thorns = function Thorns(){
			Terrain.apply(this, arguments);
			this.update();
		};

		Terrain.Thorns.prototype = Object.create(Terrain.prototype, {
			update: {value:function(){
				var rand = PRNG.toFloat(this._seed);
				this.challenge = new Challenge({
					diceWeights: new C2().swiftness(0.5),
					dice: new Dice(10).win(5,10),
					effects: new Effect.FlatEffect({health:-(this._level+1)}),
					guardian: new C2().swiftness( Math.round((8+2*this._level)*Utils.deviation(rand,0.2,1)))//Math.floor((10+2*this._level)*(1+(r1-0.5)/5)) )
				});
				return this;
			}}
		});


	})();

	// Tile
	(function(){

		function terrainClassFromSeed( seed ){
			if( seed % 2  == 0 ) return Terrain.Grass;
			return Terrain.Thorns;
		};

		Tile = function Tile( options ){
			options = options || {};
			this._level = options.level || 0;
			this._seed = options.seed;
			var T = terrainClassFromSeed( this._seed );
			this._terrain = new T(this._level, PRNG.next(this._seed+47) );//(typeof options.terrain === 'function' ? new options.terrain(this._level) : options.terrain) || new Terrain.Grass( this._level );
			this._unit = null;
		};
		Tile.prototype = {
			level: function( l ){
				if(l){this._level = l; this._terrain.level(l); return this }
				else{ return this._level;}
			}
			,
			terrain: function( t ){
				return this._terrain;
			}
		};

	})();

	// Map
	(function(){

		var LEVEL_LENGTH = 100;

		var Score = function Score( level, points, oldScore ){
			if( oldScore && level <= oldScore.level ){
				this.level = oldScore.level;
				this.mean = (points + oldScore.mean*oldScore.times)/(oldScore.times+1);
				this.times = oldScore.times +1;
			} else {
				this.level = level;
				this.mean = points;
				this.times = 1;
			}
		};

		Score.compare = function(a, b){
			if( a.level > b.level ) return 1;
			if( a.level < b.level ) return -1;
			if( a.mean > b.mean ) return 1;
			if( a.mean < b.mean ) return -1;
			return 0;
		};

		Score.prototype = {
			lt: function( b ){ return Score.compare(this,b) < 0},
			lte: function( b ){ return Score.compare(this,b) <= 0},
			gt: function( b ){ return Score.compare(this,b) > 0},
			gte: function( b ){ return Score.compare(this,b) >= 0},
			eq: function( b ){ return Score.compare(this,b) == 0}
		};
 
		var Level = function Level( n, seed ){
			this._number = n || 0;
			this._prn = PRNG.array(LEVEL_LENGTH, seed);
			this._tiles = [];

			for( var i = 0; i < LEVEL_LENGTH; ++i){
				this._tiles[i] = new Tile({
					seed: this._prn[i],
					level: this._number
				});
			}

		};
		Level.prototype = {
			getTiles: function(){ return this._tiles},
			getScore: function( i, score ){
				return new Score(this._number, i, score);
			}
		};

		Map = function Map( options ){
			//this._tiles = new Array(MAP_LENGTH);
			options = options || {};
			this._levels = [];
			this._seed = options.seed || Math.floor(Math.random()*2147483647);
		};
		Map.prototype = {
			generateLevel: function( n ){
				if( ! this._levels[n] ){
					this._levels[n] = new Level(n, PRNG.next(this._seed+n));
				}
				return this;
			},
			getLevel: function( n ){
				if( typeof n !== 'number' || Math.floor(n) !== n ) throw 'Error: level number must be an integer';
				this.generateLevel(n);
				return this._levels[n];
			}
		};

	})();

	(function(){

		Unit = function Unit(options){
			options = options || {};
			this.c1 = options.c1 || new C1({
				size: 5,
				weight: 5,
				strength: 5,
				focus: 5,
				heart: 5,
				intellect: 6
			});

			this.score = 0;

			this.levelCleared = 0;
			this.generation = options.generation || 0;

			this.c2 = this.c1.toC2();
		};

		Unit.prototype = {
			play: function( map ){
				var level = map.getLevel(this.levelCleared);
				var tiles = level.getTiles();
				var c2 = new C2(this.c2);
				for( var i = 0; i < tiles.length; i++){
					var t = tiles[i], tr = t.terrain();
					if( tr.challenge ){
						var res = tr.challenge.confront(c2);
						//console.log(res);
						if( !res.passed ){
							res.effects.map(function( effect ){
								effect.apply(c2);
							}.bind(this));
						}
						if( c2.health() <= 0 ){
							this.score = level.getScore( i, this.score );
							return i;
						}
					}
					//console.log(t.terrain());
				}

			}
		};

	})();

	(function(){

		Pool = function Pool( map ){

			var id = 0;

			this.nextKey = function(){
				return 'U'+id++;
			};

			this.map = map;
			this._size = 10;
			//this._units = [];
			this._units = {};
			for( var i = 0; i < this._size; ++i){
				//this._units.push(new Unit());
				this._units[this.nextKey()] = new Unit();
			}
		};

		Pool.prototype = {
			breed: function(){
				var keys = Object.keys(this._units), length = keys.length;
				if( length < this._size ){
					var iu = Math.floor(Math.random()*length);
					var iv = Math.floor(Math.random()*(length-1));
					if( iv >= iu ) iv = (iv+1)%length;

					var u = this._units[keys[iu]], v = this._units[keys[iv]];

					var wc1 = new C1();

					C1.names().map(function( name ){
						wc1[name]( Utils.evolutionMean(Math.random(),u.c1[name](),v.c1[name]() ) );
					}.bind(this));

					var w = new Unit({c1:wc1});

					w.play( this.map );

					this._units[this.nextKey()] = w;

					//console.log(u.c1,v.c1,w.c1);
					console.log(u.score,v.score,w.score, w);
				}
			},

			play: function(){
				console.log('----- PLAY -----');
				for( var key in this._units){
					var u = this._units[key];
					u.play( this.map );
					console.log(u.score, u);
				}
			},

			trim: function(){
				var keys = Object.keys(this._units);
				if( keys.length > 2 ){
					var min = this._units[keys[0]],
						keymin = keys[0];
					for( var key in this._units ){
						var u = this._units[key];
						if( u.score.lt(min.score) ){
							min = u;
							keymin = key;
						}
					}

					delete this._units[keymin];
				}
				
			},

			expulse: function( key ){
				var keys = Object.keys(this._units);
				if( keys.length > 2 ){
					delete this.units[key];
				}
			}
		};

	})();





	// var seed = 777, arrSize = 10;
	// var prng = new PRNG(seed);
	// var a1 = new Array(arrSize).fill(1).map(function(){return prng.next()});
	// var a2 = PRNG.array(arrSize, seed);
	// for( var i = 0; i < arrSize; ++i) console.log(a1[i], a2[i]);

	var m = new Map({seed:777});
	var u = new Unit(), v = new Unit();

	console.log(m, u);
	console.log( u.c2 );

	//for( var i = 0; i < 10; ++i) u.play(m);

	var p = new Pool(m);

	p.play();

	Game.breed = function(){
		p.breed();
	}

	Game.play = function(){
		p.play();
	}

	Game.trim = function(){
		p.trim();
	}


	// var c1 = new C1({size: 10, weight: 10, strength: 10, focus: 10, heart:10, intellect: 10 }),
	// 	toC2 = c1.toC2();

	// var e1 = new Effect.FlatEffect({health: -1}),
	// 	e2 = new Effect.ScalEffect({health: -0.5});

	// console.log( c1, toC2, e1.compute(toC2), e2.compute(toC2) );

	// function Action( arr ){
	// 	this.weights = arr.slice() || new Array(FEATURES_COUNT);
	// 	// Array defining the number of dice gained for each point difference.
	// 	// values can be negative.
	// 	// values can be non-integer, but the number of dice generated will be.
	// }
	// Action.prototype = {
	// 	weights: [],
	// 	resolve: function( unit_features, against ){
	// 		var length = Math.max(unit_features.length, against.length)
	// 			p = 0;

	// 		var dice = 1; // number of dice

	// 		for( var i = 0; i < length; ++i){
	// 			var diff = unit_features[i] - against[i],
	// 				w = this.weights[i];
	// 			if( diff * w > 0 ) { // same sign
	// 				dice += diff*w;
	// 			}
	// 		}

	// 		for( var i = 0; i < length; ++i){
	// 			//var p_ = (Math.max(-1,Math.min(1, (unit_features[i] - against[i])/against[i]))+1)/2;
	// 			var p_ = Math.min(1,Math.max(-0.5, (unit_features[i] - against[i])/against[i]));
	// 			p_ *= p_ < 0 ? 2 : 1 ;
	// 			p_ = 0.5+p_/2;
	// 			p += p_*this.weights[i];
	// 			//console.log(i,'p_',p_, 'weight', this.weights[i], unit_features[i], against[i]);
	// 		}
	// 		//console.log('p', p);
	// 		if( p >= Math.random() ) return true;
	// 		return false;
	// 	}
	// };

	// var A = {
	// 	attack: {
	// 		weights: _A().strength(1)()

	// 	},
	// 	avoid: {
	// 		weights: _A().swift(1).resist(-0.5)()
	// 	}
	// };

	// // Return the number of dice for A against B
	// // according to weights W.
	// // W,A,B arrays
	// function getDice( W, A, B ){
	// 	if( A.length < W.length || B.length < W.length ) throw 'Error: arrays A and B must be at least of W\'s length';
	// 	var dice = 0; // number of dice for each stat

	// 	for( var i = 0; i < W.length; ++i){
	// 		var diff = A[i] - B[i],
	// 			prod = diff*W[i];
	// 		if( prod > 0 ) { // W[i] same sign than diff
	// 			dice += prod;
	// 		}
	// 	}

	// 	return Math.floor(dice);
	// }

	// function battle( a, b ){

	// }

	// var unit = [10,1,5,1,3,1,1];

	// var action_avoid = new Action([0,0,0,0,1,-0.5,0]);

	// var monster = [10,1,5,1,2,5,1];

	// console.log(unit, action_avoid);

	// console.log('dice:', getDice(action_avoid.weights, unit, monster));

	// var c = 0;
	// for( var i = 0; i < 10000; ++i ){
	// 	//if( action_avoid.attempt(unit, monster) ) c++;
	// }
	// console.log('Avoid success %:', c/100+'% ('+c+')');

	// Modules Definitions

	// (function(){
	// 	Obstacle = function( challenge ){
	// 		this.challenge
	// 	};

	// 	Obstacle.prototype = {
	// 		level: 1,
	// 		 features: []
	// 		//,
	// 		// challenge: function( unit_features ){
	// 		// 	var sum = 0, max = Math.max(unit_features.length, this.features.length);
	// 		// 	for( var i = 0; i < max; ++i){
	// 		// 		sum += this.features[i]*unit_features[i];
	// 		// 	}
	// 		// 	return 
	// 		// }


	// 	};

	// })();

	// (function(){

	// 	var MAP_LENGTH = 500;


	// 	Map = function(){

	// 	};

	// })();




})();