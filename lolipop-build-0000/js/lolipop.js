var Lolipop = {};
console.assert = console.assert || function(){};

try {


(function(){

	var is_mobile = ((/Mobile|iPhone|iPod|BlackBerry|Windows Phone/i).test(navigator.userAgent || navigator.vendor || window.opera) ? true : false);

	var TEST = false;

	var Loliprivate = {};

	// declarations
	var B,BB;

	var BN = BigNumber;

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

	var assert = function(assertion){
		arguments[0] = assertion;
		console.assert.apply(console,arguments);
	}

	Lolipop.GUID = function(){ return GUID(); };

	// |||>>> UTILS <<<|||
	function isString( o ){ return typeof o === 'string'};
	function isFunction( o ){ return typeof o === 'function'};
	function isBN( o ){ return typeof o === 'object'
							&& typeof o.c === 'object'
							&& typeof o.e !== 'undefined'
							&& typeof o.s !== 'undefined'};
	function isArray( o ){ return typeof o === 'object'
								&& typeof o.length !== 'undefined' };


	// |||>>> EVENTS <<<|||

	var Events = {};

	(function(){

		var listeners = {};

		// > Methods

		// addListener( event_type [, event_target], callback_function [, data] )

		Events.addListener = function( event_type, b, c, d ){
			var callback = typeof c === 'function' ? c : b,
				target = typeof b === 'string' ? b : null,
				data = target ? d || null : c || null;

			// specs
			if( !isString(event_type)){
				throw new Error("Events.addListener: event type must be of type string.");
			} else if ( !isFunction(callback) ){
				throw new Error("Events.addListener: callback must be a function.");
			} else if ( target && !isString(target)){
				throw new Error("Events.addListener: target must be of type string.");
			}

			var l = {f:callback};
			if(target) l.target = target;
			if(data) l.data = data;

			var list = listeners[event_type] = listeners[event_type] || [];

			list.push(l);

			return l;
		};

		// For third party
		Events.addExternalListener = function( a, b, c ){
			var l = Events.addListener(a, b, c);
			if( l ) l.ext = true;
			return l;
		};

		// The same signature is needed to remove a Listener
		Events.removeListener = function( event_type, b, c ){
			var callback = c || b,	target = c ? b : null;
			// specs
			if( !isString(event_type)){
				throw new Error("Events.removeListener: event type must be of type string.");
			} else if ( !isFunction(callback) ){
				throw new Error("Events.removeListener: callback must be a function.");
			} else if ( target && !isString(target)){
				throw new Error("Events.removeListener: target must be of type string.");
			}
			var list = listeners[event_type];
			if( list ){
				list = list.filter( function(o){ return !(o.f === callback && ( (!target && !o.target) || target === o.target )); });
				if( list.length > 0 ){
					listeners[event_type] = list;
				} else {
					delete listeners[event_type];
				}
			}
		};

		Events.REMOVE_LISTENER = {};

		// There is a setTimeout 1, so every dispatch will be executed,
		// unordered, after the current function tree is over.
		// ext: allows external use, default is false
		Events.dispatch = function( event_type, target, data, ext ){
			ext = ext || false;

			if( !isString(event_type)){
				throw new Error("Events.dispatch: event type must be of type string.");
			} else if ( target && !isString(target) ){
				throw new Error("Events.dispatch: target should be a string or null.");
			}

			var list = listeners[event_type];
			if( list ){
				for( var i in list ){
					var o = list[i];
					if( (!o.target || (o.target === target)) && ( ext || (!ext && !o.ext) ) ){
						(function(){
							var e = { name: event_type, target: target, data: data || null, listenerData: o.data };
							var f = o.f;
							var originalTarget = o.target;
							setTimeout(function(){ if( f(e) === Events.REMOVE_LISTENER ){
								originalTarget ?
									Events.removeListener(event_type, originalTarget, f)
									: Events.removeListener(event_type, f);
							}}, 1);
						})();
					}
				}
			}
		};


		if(TEST){
			console.log('>>>> TESTS EVENTS - START <<<<');

			var f = function(a){};

			Events.addListener('type','target',f);
			assert(listeners['type']);
			assert(listeners['type'][0]);
			assert(listeners['type'][0].f === f);
			assert(listeners['type'][0].target === 'target');

			// deletion
			Events.removeListener('type',f);
			assert(listeners['type']);

			Events.removeListener('type','target',f);
			assert(!listeners['type']);


			Events.addListener('type2',f);
			assert(listeners['type2']);
			assert(listeners['type2'][0]);
			assert(listeners['type2'][0].f === f);
			assert( !listeners['type2'][0].target );

			Events.removeListener('type2','bblabla',f);
			assert(listeners['type2']);

			Events.removeListener('type2',f);
			assert(!listeners['type2']);

			console.log('>>>> TESTS EVENTS - END <<<<');
		}

	})();

	var Loader, Files; 

	(function(){
		Loader = {};

		Files = {
			lang: 'content/lang.json'
		}

		var _N = 0; // Loading
		var _M = 0; // Loaded
		var _endOfRegistration = false;

		var _packages = {};

		function _onAllLoaded(){
			Events.dispatch('filesLoaded');
		}

		function _updateMessage(){	
			$('#loading-screen .text').text('Loading ('+_M+'/'+_N+')');
		}

		var _onFileLoaded = function( path, file ){
			console.log('%cFile loaded',"color: pink;",path);
			if( file ){
				for( var key in Files ){
					if( Files[key] === path ) Files[key] = file;
				}
			}
			_M++;
			_updateMessage();
			if( _endOfRegistration && _N === _M ) _onAllLoaded();
		}

		var _fileCounter = 1;
		var _loadJSON = function( path ){
			$.getJSON(path, function(json){
				_onFileLoaded(path, json);
			}).error(function(a,b,c){
				console.log("%cError loading "+path+":","color: red; font-weight: bold;",b,c);
			});
		}

		var _loadIMG = function( path ){
			if( document.images ){
				var m = new Image();
				m.onload = function( o ){
					_onFileLoaded(path);
				}
				m.src = path;
			}
		}

		Loader.load = function( path ){
			_N++;
			var ext = ( path.match(/\.([0-9a-z]+)$/i)[1] || "").toLowerCase();
			var r;
			switch( ext ){
				case 'json':
					_loadJSON(path);
					break;
				case 'jpg': case 'png': case 'jpeg': case 'svg':
					_loadIMG(path);
					break;
			}
			return path;
		}

		Loader.end = function(){
			_endOfRegistration = true;
			if( _N === _M ) return _onAllLoaded();
		}

		Files.lang = Loader.load("content/lang.json");
		Files.mrtuto = Loader.load("img/mobile/mr-tuto.png");

		Files.img_poro = Loader.load("img/mobile/monster-poro.jpg");
		Files.img_wolf = Loader.load("img/mobile/monster-wolf.jpg");
		Files.img_raptor = Loader.load("img/mobile/monster-raptor.jpg");
		Files.img_krug = Loader.load("img/mobile/monster-krug.jpg");
		Files.img_red = Loader.load("img/mobile/monster-red.jpg");
		Files.img_blue = Loader.load("img/mobile/monster-blue.jpg");
		Files.img_gromp = Loader.load("img/mobile/monster-gromp.jpg");
		Files.img_dragon = Loader.load("img/mobile/monster-dragon.jpg");
		Files.img_nashor = Loader.load("img/mobile/monster-nashor.jpg");
		Files.img_vilemaw = Loader.load("img/mobile/monster-vilemaw.jpg");

		Files.img_menu_monsters = Loader.load("img/mobile/menu-monsters.png");
		Files.img_menu_about = Loader.load("img/mobile/menu-about.png");
		Files.img_menu_achievements = Loader.load("img/mobile/menu-achievements.png");
		Files.img_menu_champions = Loader.load("img/mobile/menu-champions.png");
		Files.img_menu_dev = Loader.load("img/mobile/menu-dev.png");
		Files.img_menu_enchants = Loader.load("img/mobile/menu-enchants.png");
		Files.img_menu_help = Loader.load("img/mobile/menu-help.png");
		Files.img_menu_options = Loader.load("img/mobile/menu-options.png");
		Files.img_menu_rank = Loader.load("img/mobile/menu-rank.png");
		Files.img_menu_save = Loader.load("img/mobile/menu-save.png");
		Files.img_menu_stats = Loader.load("img/mobile/menu-stats.png");
		Files.img_menu_surrend = Loader.load("img/mobile/menu-surrend.png");


		Files.img_button_red = Loader.load("img/mobile/button.svg");
		Files.img_button_blue = Loader.load("img/mobile/button_blue.svg");
		Files.img_bg = Loader.load("img/mobile/bg_repeat.svg");
		Files.img_star = Loader.load("img/mobile/star.svg");
		Files.img_minion = Loader.load("img/mobile/minion.svg");


		Files.img_enterFS = Loader.load("img/mobile/fs.png");
		Files.img_leaveFS = Loader.load("img/mobile/fs2.png");
		Files.img_back = Loader.load("img/mobile/back.png");

		Events.addListener('filesLoaded', function(){
			console.log('All files loaded', Files);
		})

	})();

	var Lang;

	(function(){
		Lang = {};
		var _json;
		var _locale = 'en';

		//console.log('LANG');
		$.getJSON("content/lang.json", function(json){
			_json = json;
			_json.vars = _json.vars || {};
			_json.lines = _json.lines || {};
			Lang.loaded = true;
			Events.dispatch('langLoaded');
			console.log('lang.json loaded');

		}).error(function(a,b,c){
			console.log("%cError loading lang.json:","color: red; font-weight: bold;",b,c);
		});

		function _applyVars(str){
			return str.replace(/%([a-zA-Z0-9_-]+)%/g,function(){
				var key = arguments[1];
				if( key ){
					return _json.vars[key] || "";
				}
				return "";
			});
		}

		Lang.get = function(){
			var res = _json;
			for(var i = 0; i < arguments.length; ++i ){
				if( typeof arguments[i] !== undefined && typeof res[arguments[i]] !== undefined ){
					res = res[arguments[i]];
				} else {
					console.log('%cWarning:',"color: #FF3D00;","Trying to access unknown lang entry.");
					break;
				}
			}
			return res;
		}

		Lang.line = function( id ){
			return Lang.get('lines', id, _locale).map(function(str){return _applyVars(str)});
		}

	})();


	var Features, F;

	(function(){

		Features = {};

		var _loaded = false; // prevent event dispatch on load

		var _S = Features.STATES = {
			UNLOCKED: 1,
			ENABLED: 2
		}

		Features.all = {}

		Features.unlocked = function( str ){
			return (( Features.all[str] || {}).state || 0) & _S.UNLOCKED;
		}

		Features.enabled = function( str ){
			return (( Features.all[str] || {}).state || 0) & _S.ENABLED;
		}

		Features.save = function(){
			var str = "";
			for( var key in Features.all ){
				var f = Features.all[key];
				if( f.state > 0 ) str += key+","+f.state+'|';
			}
			console.log('save', str.slice(0,-1));
			return str.slice(0,-1);
		}

		Features.load = function( str ){
			str.split('|').map(function( o ){
				var arr = o.split(',');
				var id = arr[0], n = arr[1] || 0;
				if( n & _S.UNLOCKED ) Features.unlock( id, true );
				if( n & _S.ENABLED ) Features.enable( id, true );
			});
			return true;
		}

		Events.addListener('gameLoad', function(){
			Features.loaded = _loaded = true;
			Events.dispatch('featuresLoaded'); // =_= use gameLoad (success/fail) instead
		});

		Features.unlock = function( str, loading ){
			var data = Features.all[str];
			if( data ){
				data.state = data.state | _S.UNLOCKED;
				Events.dispatch('featureUnlocked',str);
				if( !loading ) Events.dispatch('featureUnlockedFirstTime',str);
			}
			return true;
		}
		Features.enable = function( str ){
			var data = Features.all[str];
			if( data ){
				data.state = data.state | _S.ENABLED;
				Events.dispatch('featureEnabled',str);
			}
		}
		Features.disable = function( str ){
			var data = Features.all[str];
			if( data ){
				data.state = data.state & ~_S.ENABLED;
				Events.dispatch('featureDisabled',str);
			}
		};

		// init

		[
			// ~menu
			'monsters','spellbook','champions','surrender','rank','achievements',
			'statistics','options','help','about',

			'minion'

		].map(function( str ){ Features.all[str] = {state: 0}; });

	})();


	var Dialogue, D;

	(function(){

		Dialogue = {};

		var _all = Dialogue.all = {};

		Dialogue.start = function( str ){
			var d = Dialogue.all[str];
			if( d ){
				d.start();
				return true;
			}
			return false;
		};

		function _new_data( str ){
			var d = Dialogue.all[str] = {
				id: str,
				past: false,
				lines: []
			};
			d.start = d_start.bind(d);
			return d;
		}

		Dialogue.load = function( str ){
			str.split('|').map(function( id ){
				( Dialogue.all[id] || _new_data(id)).past = true;
				console.log('%cLOADED DIALOGUE', "background: black; color: lightblue;", id, Dialogue.all);
			});
			Events.dispatch('dialoguesLoaded');
			return true;
		};

		Dialogue.save = function(){
			var str = "";
			for( var key in Dialogue.all ){
				var d = Dialogue.all[key];
				if( d.past ) str += key+'|';
			}
			return str.slice(0, -1);;
		};

		// Constructor

		function d_end(){
			// this == dialogue data
			Events.dispatch('endOfDialogue', this.id);
			this.past = true;
		}

		function d_start(){
			//console.log('start this', this);
			// this == dialogue data
			if( !this.past ){ // Some dialogues are triggered externally
				for( var i = 0; i < this.lines.length; ++i){
					for( var j = 0; j < this.lines[i].length; ++j){
						if( i == this.lines.length-1 && j == this.lines[i].length-1 ) {
							Interface.dialogue(this.lines[i][j], d_end.bind(this));
						} else {
							Interface.dialogue(this.lines[i][j]);
						}
					}
				}
			}
		}

		function _c(str){
			var data;
			this.data = data = Dialogue.all[str] || _new_data(str);

			// When to call start
			this.init = function( f ){ this.data.init = f; return this; };

			this.lines = function( lines ){
				if( typeof lines === 'string' ) lines = [lines];
				this.data.lines = lines;
				console.log('set lines', lines);
				return this;
			};
		}

		D = function( str ){
			return new _c(str);
		}

		// init

		_init_dialogues = function(){
			for( var key in _all){
				var d = _all[key];

				d.lines = d.lines.map( function( str ){
					return Lang.line(str);
				});

				if( !d.past && d.init ) d.init();
			}
			Events.dispatch('dialoguesReady');
			console.log('%cStory ready','color: green');
		};

		if( Game && Game.loaded ){
			setTimeout(_init_dialogues, 0);
		} else {
			Events.addListener('gameLoad', function(){
				_init_dialogues();
				return Events.REMOVE_LISTENER;
			});
		}

	})();

	// Dialogues

	D('tuto000')
		.init(function(){
			this.start();
		})
		.lines('0000');

	D('tuto001') // Monsters
		.lines('0001');

	D('tuto002') // Spellbook
		.init(function(){
			var that = this;
			Events.addListener('spellGroupUnlocked', function(){
				that.start();
				return Events.REMOVE_LISTENER;
			})
		})
		.lines('0002');

	D('tuto003') // S K
		.init(function(){
			if( !is_mobile ){
				var that = this;
				Data.newMilestoneUse(Milestone('statistics.mick.clicksAllTime', 75), function(){
					that.start();
				});
			}
		})
		.lines('0003');


	/// DATAS AND ACCESS
	/// DATA MANAGEMENT

	// Data.xxxx  --> handlers / operations
	// Data.Stone --> frozen data / constants
	// Data.Game  --> all the game variables, accessible via unique (not random) ID
	// Data.Pedia --> Interface oriented data
	//------------------------------

	var Data = {};

	(function(){ // DATA

	// Declarations
	Data.Stone = {}, Data.Variables = {}, Data.Pedia = {};

	// Variables

	Data.Variables.Index = {}; // This is where variables are stored by id for hashed access.

	// This is where variables are stored by level.
	// Variables modified externally are level 0, their dependency are level 1, etc...
	// This is to make sure 
	Data.Variables.Levels = [];
	// :( why ? Better without, dissociate time and other actions will allow to reduce refreshing frequency on slow systems

	// structure of a variable :
	// "unique.id" : 	{
	// 					value			: obj,
	// 					(valid			: true | false,)
	// 					invalidates		: null | [ referenceA, referenceB ], // note: a descendent linking is more efficient but hard to maintain, so we need a constructor.
	// 					updateFunc 		: null | function( [ "invalidator.id", invalidator ] ){},
	// 				}

	// Sets the .requires tab on a variable, and direct access to variables
	// Clears the old setup in the process by default
	Data.Variables.setRequirements = function( varObj, requiresTab, merge ){
		if( varObj.requires && !merge ){
			for( var i in varObj.requires ) delete varObj[varObj.requires[i]];
			delete varObj.requires;
		}
		if( requiresTab ){
			varObj.requires = merge ? varObj.requires.concat(requiresTab) : requiresTab; // allow multiple occurrences
			for( var i in requiresTab ){
				var vreq = requiresTab[i];
				varObj[vreq] = varObj[vreq] || Data.Variables.Index[vreq] || Data.registerVar(vreq);
				varObj[vreq].requiredBy.push( varObj );
			}
		}
	};

	Data.Variables.addRequirement = function( varObj, r ){
		Data.Variables.setRequirements( varObj, [r], true);
	};

	Data.Variables.removeRequirement = function( varObj, r ){
		delete varObj[r];
		varObj.requires = varObj.requires.filter( function(req){ return req != r; });
		Data.Variables.Index[r].requiredBy.filter( function( v ){ return v != varObj; });
	};

	Data.Variables.addInvalidator = function( varObj, invalidatorID ){
		var v = Data.Variables.Index[invalidatorID];
		if( !v ) v = Data.registerVar(invalidatorID); // Creates empty variable
		v.invalidates.push( varObj );

		varObj.isRoot = false;

		varObj.invalidators.push(invalidatorID);
	};

	Data.Variables.removeInvalidator = function( varObj, invalidatorID ){
		var invalidator = Data.Variables.Index[invalidatorID];
		if( invalidator ){
			invalidator.invalidates = invalidator.invalidates.filter( function(inv){ return inv !== varObj; });
		}
		varObj.invalidators = varObj.invalidators.filter( function( inv ){ return inv != invalidatorID; });
	};

	// Variable registration

	function var_apply_buffs( v ){
		if( v.buffBox && v.rawValue ){
			var prev = v.value.plus(0);
			v.value = v.buffBox.compute(v.rawValue);
			v.hasChanged = v.hasChanged || !prev.eq(v.value);
		}
	};

	function var_link_buff( v_id, b ){
		var v = Data.Variables.Index[v_id];
		if( v ){
			var buff_box = v.buffBox || (v.buffBox = BBox());
			buff_box.add( b );
		}
	};
	Data.Variables.linkBuff = var_link_buff;

	function var_unlink_buff( v_id, b){
		var v = Data.Variables.Index[v_id];
		if( v ){
			var buff_box = v.buffBox || (v.buffBox = BBox());
			buff_box.remove( b );
		}
	};
	Data.Variables.unlinkBuff = var_unlink_buff;

	// registerVar( id : string, value : object, invalidators : [string], updateFunc(str,obj)/actionFunc() : function) : void;
	// register a variable in Data.Game
	// 		id : unique id, lowercase words separated by dots
	//		value : initial value of the variable
	//		invalidators : other variables whose modification invalidates the current value
	//		updateFun : function called when an invalidator has been modified.
	//					// has invalidators
	//					input : the invalidator name and object
	//					output : true if the value has actually changed, false otherwise.
	//					// isRoot
	//					input: new value
	//					output: same, returning false will prevent the action from going further
	//					 		--> used to check if the action is feasable in the current context
	//      
	Data.registerVar = function( id, value, invalidators, updateFunc, requires ){
		var v = Data.Variables.Index[id] || (Data.Variables.Index[id] = {});
		v.id = id;
		v.value = value || new BN(0);//|| v.value || new BN(0);
		//v.originalUpdateFunc = v.originalUpdateFunc || updateFunc;
		v.hasChanged = false;

		v.updateFunc = updateFunc ?
			function(){ if(updateFunc.apply(v, arguments) ){ v.hasChanged = true; v.rawValue = v.value; } var_apply_buffs(v); if( v.hasChanged ) {	Data.updateVarUses(id);	v.hasChanged = false; return true; } }
			: function(){console.log(v.id,updateFunc,"CALLED_INEXISTANT_UPDATE_FUNCTION")};

		if( !v.invalidates ) v.invalidates = [];
		if( !v.invalidators ) v.invalidators = []; // TODO
		if( !v.requiredBy ) v.requiredBy = [];

		v.isRoot = typeof v.isRoot == 'undefined' ? true : v.isRoot; // First time variable is registered
		if( invalidators && invalidators.length > 0 ) v.isRoot = false; // Root variables are where the input come from (cf Graph representation)

		// Registers this variable in the 'invalidates' array of its invalidators
		for( var i in invalidators ){ 
			/*var inv = invalidators[i];
			if(! Data.Variables.Index[inv] ) Data.registerVar(inv); // Creates empty variable
			Data.Variables.Index[inv].invalidates.push(v);*/
			Data.Variables.addInvalidator( v, invalidators[i] );
		}

		// Adds the variables asked to the scope for quicker access
		Data.Variables.setRequirements(v, requires);

		return  v;
	};

	// A relay var just takes the value of the invalidator. It is used to group actions.
	Data.registerRelayVar = function( id, invalidators, debug ){
		return Data.registerVar( id, null, invalidators, function( inv ){ if( !inv ){return false;} this.value = inv.value; if(debug){console.log('relay', id, inv.id, inv.value.toString())} return true;}, null);
	}

	Data.registerFloorRelayVar = function( id, invalidators ){
		return Data.registerVar( id, null, invalidators, function( inv ){ if( !inv ){return false;} var n = inv.value.floor(); if( !this.value.eq(n) ){ this.value = n;return true;} return false;}, null);
	}

	//
	Data.registerConditionalRelayVar = function(id, invalidators, inputs, condition){
		return Data.registerVar( id, null, invalidators, function( i ){ if( !i ){return false;} var that = this; if( condition.apply(this,inputs.map(function(o){ return that[o].value}))){ this.value = i.value; return true;} }, inputs);
	}
	//
	Data.registerConditionalRootVar = function(id, inputs, condition){
		return Data.registerVar( id, null, null, function( ){ var that = this; return condition.apply(this,inputs.map(function(o){ return that[o].value}))}, inputs);
	}

	// value is true if A < B
	Data.registerLTVar = function(id, A, B){
		if( typeof B === 'object' && typeof B.e !== 'undefined'){
			return Data.registerVar(id, false, [A], function(){ var bool = this[A].value.lt(B); if( (this.value && !bool) || (!this.value && bool) ){ this.value = bool; return true;} return false;}, [A]);
		}
		return Data.registerVar(id, false, [A,B], function(){ var bool = this[A].value.lt(this[B].value); if( (this.value && !bool) || (!this.value && bool) ){ this.value = bool; return true;} return false;}, [A,B]);
	}

	// value is true if A >= B
	Data.registerGTEVar = function(id, A, B){
		if( typeof B === 'object' && typeof B.e !== 'undefined'){
			return Data.registerVar(id, false, [A], function(){ var bool = this[A].value.gte(B); if( (this.value && !bool) || (!this.value && bool) ){ this.value = bool; return true;} return false;}, [A,B]);
		}
		return Data.registerVar(id, false, [A,B], function(){ var bool = this[A].value.gte(this[B].value); if( (this.value && !bool) || (!this.value && bool) ){ this.value = bool; return true;} return false;}, [A,B]);
	}

	// a constant is a root variable whose update function never changes the value
	Data.registerConstant = function( id, value ){
		return Data.registerVar( id, value, null, function(){ return false;}, null);
	};
	Data.registerBuffableConstant = function( id, value ){
		return Data.registerVar( id, value, null, function(){ if( !this.rawValue ){ return true; } return false;}, null);
	}

	Data.registerSumVar = function( id, invalidators ){
		return Data.registerVar( id, null, invalidators, function(){ this.value = new BN(0); for( var i in this.invalidators ){ this.value = this.value.plus(this[this.invalidators[i]].value)} return true;}, invalidators);
	};

	Data.registerProductVar = function( id, invalidators, requirements, debug ){
		requirements = requirements ? requirements.concat(invalidators) : invalidators;
		return Data.registerVar( id, null, invalidators, function(){ if(debug){console.log('UPDATE',id);} this.value = new BN(1); for( var i in this.requires ){ this.value = this.value.times(this[this.requires[i]].value)} return true;}, requirements);
	};

	Data.registerAddVar = function( id, invalidator, number ){
		return Data.registerVar( id, null, [invalidator], function( i ){ if( !i ){return false;} this.value = i.value.plus(number); return true }, null);
	};

	// Sets off once all the inputs are true
	Data.registerFlipFlopTrigger = function( id, inputs, triggerFunc ){
		return Data.registerVar( id, null, inputs, function(){ var bool = true; for( var i in inputs ){ bool = bool || this[inputs[i]].value;} if( bool ){ triggerFunc.apply(this); return true;}}, inputs);
	}

	// calls the function when input is updated
	Data.registerSimpleTrigger = function( id, input, triggerFunc){
		return Data.registerVar( id, null, [input], function(){ triggerFunc.apply(this); return true; }, [input]);
	}

	// Sponge variable. Each invalidator has a weight. Getting invalidate adds the weight to the value.
	// weights : {
	//		"id" : value (BigNumber | string)	
	// }
	// string values 	/[+-]+(value|current)/
	// 					current = current value
	//					value = value of the invalidator
	Data.registerSpongeVar = function( id, weights ){
		return Data.registerVar( id, new BN(0), Object.keys(weights),
			function( i ){
				if( !i ){ return false;}
				try{
					var increment = new BN(0);
					if( typeof weights[i.id] == 'string' ){
						var match = weights[i.id].match(/([+-]?)([a-z]+)/);
						if( match.length != 3 ) {
							assert(false,'Failed to update Sponge, bad selector',weights[i.id]);
							return false;
						}
						switch( match[2] ){
							case 'current': increment = this.value; break;
							case 'value': increment = i.value; break;
						}
						if( match[1] == '-' ) increment = increment.times(-1);
					} else {
						increment = new BN(0).plus(weights[i.id]); // JS numbers support
					}
					this.value = this.value.plus( increment );
					if( !increment.eq(0) ) {
						//console.log('updated',this.id,this.value.toString(),increment.toString());
						return true;
					}
				} catch( error) {
					console.log("Failed to update sponge var :",this.id, i, error);
				}
				return false; 
				}, null);
	}

	// Computes a*b^c, c is N
	// FLOORED
	Data.registerPriceComputerVar = function( id, a, b, c){
		var tab = [a,b,c];
		return Data.registerVar( id, null, tab, function(){ this.value = this[a].value.times(this[b].value.pow(this[c].value)).floor(); return true;}, tab);
	};

	// Computes price for 10 objects based on a initial quantity and inflation
	Data.registerPrice10ComputerVar = function( id, a, b, c){
		var tab = [a,b,c];
		return Data.registerVar( id, null, tab, function(){ this.value = new BN(0); for(var i = 0; i < 10; ++i) { this.value = this.value.plus(this[a].value.times(this[b].value.pow(this[c].value.plus(i))).floor()); } return true;}, tab);
	};

	// Computes refund price for 1 objects based on a initial quantity and inflation
	Data.registerRefundComputerVar = function( id, a, b, c){
		var tab = [a,b,c];
		return Data.registerVar( id, null, tab, function(){ if(this[c].value.eq(0)){this.value = new BN(0); return true;} this.value = this[a].value.times(this[b].value.pow(this[c].value.minus(1))).floor(); return true;}, tab);
	};

	// Computes refund price for all objects based on an initial price, quantity and inflation
	Data.registerRefundAllComputerVar = function( id, a, b, c){
		var tab = [a,b,c];
		return Data.registerVar( id, null, tab, function(){ var vc = this[c].value.toNumber(); this.value = new BN(0); if(this[c].value.eq(0)){return true;} for(var i = 0; i < vc; ++i) { this.value = this.value.plus(this[a].value.times(this[b].value.pow(i)).floor()); } return true;}, tab);
	};

	Data.registerIncrementVar = function( id, invalidators ){
		return Data.registerVar( id, new BN(0), invalidators, function(){ this.value = this.value.plus(1); return true;});
	}

	/// UNREGISTER

	Data.unregisterVar = function( v ){
		v = typeof v === 'string' ? Data.Variables.Index[v] : v;
		if( v ){
			var invalidates = v.invalidates.slice(); // copy
			invalidates.map( function( inv ){ Data.Variables.removeInvalidator(inv, v.id)} );

			var invalidators = v.invalidators.slice();
			invalidators.map( function( inv ){ Data.Variables.removeInvalidator(v, inv)});

			var required = v.requiredBy.slice();
			required.map( function( r ){ Data.Variables.removeRequirement(r, v.id)});

			delete Data.Variables.Index[v.id];
		}
	}

	//Data.registerThresholdVar = function( id, target, value ){}

	/// Milestone Var
	// Only one variable updated for the whole series to save some resources

	Data.registerMilestoneVar = function( targetVar, milestones_id_value ){

		
	}

	Data.Variables.changeId = function( oldId, newId, doNotUpdateInvalidators ){

	}


	Data.value = function( id ){
		return Data.Variables.Index[id] ? Data.Variables.Index[id].value : null;
	};

	// Variable update

	// change the value of the variable matching id. Updates dependency if updateFunc returns true or is null.
	// 
	// Data.updateVar = function( id:string OR variable:obj, value:object, invalidator:object )
	Data.updateVar = function( a, value, invalidator, debug ){

		// hack :S
		var action_data = null;
		if( value && typeof value.action_data !== 'undefined' ) {
			action_data = value.action_data;
			value = undefined;
		}

		// v is the variable to update
		var v = typeof a === 'object' ? a : Data.Variables.Index[a];

		if( debug ) console.log("updateVar:v", v, "invalidator",invalidator, v.updateFunc);
		if( v ){
			// if a value has been set for a non-root variable, we update the variable
			// Root variable change their value themselves through updateFunc
			if( !v.isRoot && value != undefined ) v.value = value;

			// Root variable and the update function works
			// Non-Root and : No update function
			// 				  OR no invalidator given ( updateFunc takes an invalidator )
			//						correspond to updateVar(non-root) and updateVar(non-root, value)
			//				  OR update function and invalidator, depends on what's returned
			if( (v.isRoot && v.updateFunc(value, action_data)) || !v.isRoot && ( !v.updateFunc || v.updateFunc( invalidator ) || !invalidator) ){
			//if( (v.isRoot && v.updateFunc(value)) || !v.isRoot && ( !v.updateFunc || !invalidator || (invalidator && v.updateFunc( invalidator ))) ){
				if( debug ) console.log( "UPDATED", v.id, v, v.invalidates);
				var invalidates = v.invalidates.slice(); // Some variables end up being deleted after an update
				for( var i in invalidates ){
					Data.updateVar(invalidates[i], undefined, v, debug); // updates dependent variables
				}
				return true;
			}
		}
	};

	Data.varUses = {};
	Data.newVarUse = function( id, callback ){
		var tab = Data.varUses[id] || ( Data.varUses[id] = []);
		tab.push(callback);
		return [id,callback];
	};

	Data.removeVarUse = function( a, b ){
		var id, callback;
		if( isArray(a) ){ id = a[0]; callback = a[1]} else { id = a; callback = b;}
		if( Data.varUses[id] ) Data.varUses[id] = Data.varUses[id].filter(function(o){ return o != callback});
	}

	// If the callback returns false, it'll be called again
	Data.newOneTimeUse = function( id, callback ){

		var f;
		f = function( v ){
			if( callback(v) !== false) Data.varUses[id] = Data.varUses[id].filter(function(o){ return o != f});
		};

		return Data.newVarUse(id, f);
	};

	Data.newMilestoneUse = function( id, callback ){
		var v = Data.Variables.Index[id], val = v? v.value : false;
		if( typeof val === 'boolean' && val ){
			callback(v);
		} else {
			var f = function( v ){
				if( v.value !== true ) return false;
				return callback(v);
			}
			return Data.newOneTimeUse(id, f);
		}
	};

	//TODO: remove var use

	// Update all the DOM objects containing the variable matching id
	// Those dom object have the class 'gamedata' and the attribute 'data-id' equal to id
	// in case of failure, fills with intelligible data
	Data.updateVarUses = function( id, debug ){
		var v = Data.Variables.Index[id] || {};
		//console.log('updating uses for',id )

		var tab = Data.varUses[id] || [];
		tab.map( function( f ){ f(v); });

		//$(".gamedata[data-id='"+id+"']").text( (v.format ? v.format() : null) || id || "ERR_INVALID_DATA");
		$(".gamedata[data-id='"+id+"']").each( function(){
			var formatFunc = Data.Formatting.Functions[$(this).attr('data-format-function')] || Data.Formatting.Functions.default;
			//if(debug) console.log("updating use :", id, debug,formatFunc, formatFunc(v.value) );
			$(this).html( formatFunc(v.value) );
		});

		$(".conditional-format[data-condition='"+id+"']").each( function(){
			$(this).toggleClass($(this).attr('data-format-class'), v.value );
		});//(v.format ? v.format() : null) || id || "ERR_INVALID_DATA");
	};

	})(); // DATA

	/// FORMATTING

	BigNumber.config({ DECIMAL_PLACES: 3 });

	Data.Formatting = {};
	Data.Formatting.Functions = {};

	Data.Formatting.Functions.raw = function( o ){ return o; };

	Data.Formatting.Functions.toString = function(a){ return a? a.toString() : "ERR_TOSTRING"; };

	Data.Formatting.Functions.plusOne = function( bn ){ return bn.plus(1).toString(); };

	Data.Formatting.Functions.wholeNumber = function( bn ){
		return bn.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	};

	Data.Formatting.Functions.shortWhole = function( bn ){
		return bn.toString();
	}

	Data.Formatting.Functions.wholeNumberSpan = function( bn ){
		return "<span class='e"+bn.e+"'>"+bn.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")+"</span>";
	};
		
	Data.Formatting.powers = ["M.","B.","Tr.","Quad.","Quin.","Sex.","Sept.","Oct.","Non.","Dec."]; 
	Data.Formatting.Functions.abbreviatedNumber = function( bn ){
		if( bn.e < 6 ){
			return Data.Formatting.Functions.wholeNumber(bn);
		} else {
			var exp = Math.floor((bn.e-6)/3);
			return bn.dividedBy("1e"+(6+exp*3)).toFixed(3).toString()+" "+ (Data.Formatting.powers[exp] || "e"+(6+exp*3));
		}
	};

	Data.Formatting.Functions.abbreviatedNumberPerSecond = function( bn ){
		return bn.eq(0) ? "" : Data.Formatting.Functions.abbreviatedNumber(bn)+'<small> /s</small>';
	}

	Data.Formatting.UAPowers = ['','k','M','B','T','Qa','Qi','Sx','Sp','Oc','No','De'];
	Data.Formatting.Functions.ultraAbbreviated = function( bn ){
		if( bn.gte(1) ){
			var exp = Math.floor(bn.e/3);
			var number = bn.dividedBy("1e"+(exp*3)).toFixed(3).toString();
			return number.substring(0,3).replace(/[.]0*$/,'')+Data.Formatting.UAPowers[exp] || "e"+(exp*3);
		} else {
			return bn.toFixed(2).replace(/[.]?0*$/,'');
		}
	}

	Data.Formatting.Functions.ultraAbbreviatedGT0 = function( bn ){
		return bn.gt(0) ? Data.Formatting.Functions.ultraAbbreviated(bn) : "";
	}

	Data.Formatting.powersLitterals = [' ',' ','Million','Billion','Trillion','Quadrillion','Sextillion','Septillion','Octillion','Nonillion','Decillion'];
	Data.Formatting.Functions.powerLitteral = function( bn ){
		var exp = Math.floor(bn.e/3);
		return Data.Formatting.powersLitterals[exp] || "e"+(exp*3);
	};

	Data.Formatting.Functions.default = Data.Formatting.Functions.raw;

	// Load data from a loader object
	// a loader is just a list of ids associated with a value
	Data.Load = function( loader ){
		//console.log('%cLoader:','color:purple;',loader);
		for( var id in loader ){
			//console.log('Loading',id, loader[id].toString ? loader[id].toString() : loader[id]);
			Data.updateVar( id, loader[id] );
			//if( Data.Variables.Index[id] && id !== 'action.time.elapsed' ) assert(Data.Variables.Index[id].value === loader[id], "Failed to load",id);
		}
	};

	//

	var Action;

	(function(){

		Action = {};

		Action.do = function( code, action_data ){

			var okay = true;

			if(code == 'action.click.mick' && !Features.enabled('minion')) okay = false;


			if( okay ) {
				if( typeof action_data !== 'undefined' ) {
					Data.updateVar(code, {action_data: action_data});
				} else {
					Data.updateVar(code);
				}
			}
		};

	})();

	//

	// Buff
	var B = {};
	function isBuff( obj ){
		return typeof obj === 'object'
			&& typeof obj.type !== 'undefined'
			&& typeof obj.level !== 'undefined'
			&& typeof obj.enabled !== 'undefined';
	};

	var BUFF_TYPE = {
		BLANK: 0,
		ADDITIVE: 1,
		MULTIPLICATIVE: 2,
		EXPONENTIAL: 3
	};

	// > Use a data/handler architecture to save memory
	// on unused data.
	(function(){

		function formupop( str, parenthesis, increment, variables ){

			var firstCall = !parenthesis;

			var p = parenthesis || {};
			variables = variables || {};

			increment = increment || "";
			var i = 'A'; 

			str = str.replace(/\(([^()]*)\)/g, function(x,s0){
				var token = '{'+increment+i+'}';
				p[token] = formupop(s0, p, increment+i, variables);
				i = String.fromCharCode(i.charCodeAt(0) + 1);
				return token;
			});

			
			str = str.replace(/([a-z]{2,}(?:\.[a-z]+)*)/g, function(x, capture) {
				variables[capture] = true;
				return 'Data.value("'+capture+'")';
			});

			str = str.replace('.FLOOR','.floor()');
			
			str = str.replace(/\*([^*+]+)/g,'.times($1)');
			str = str.replace(/\+([^+]+)/g,'.plus($1)');
			str = str.replace(/(\d+(?:\.\d+)?(?:e\d+)?)/g,'new BN("$1")');

			while( /\{[A-Z]+\}/.test(str) ){
				str = str.replace(/\{([A-Z]+)\}/g,function(x){ return p[x] || "ERROR"; });
			}

			return firstCall ? [str, Object.keys(variables)] : str;
		};

		var all_buff_datas = {};

		function blank_buff_data( id ){
			return {
				id: id || GUID(),
				type: BUFF_TYPE.BLANK,
				level: 0,
				enabled: true,
				targets: {},
				value: new BN(0)
			};
		};

		function get_buff_data( id ){
			if( !id ) id = GUID();
			var obj = 	all_buff_datas[id] || 
						( all_buff_datas[id] = blank_buff_data(id) );
			return obj;
		};

		function updateTargets( data ){
			for( var key in data.targets ) {
				Data.updateVar(key);
			}
		};

		function setupDependencies( data, tab ){
			clearDependencies(data);
			data.dependencies = tab;
			for( var i in tab ){
				var cb = function(){ updateTargets(data)};
				Data.newVarUse( tab[i], cb);
				tab[i] = [tab[i], cb];
			}

		};

		function clearDependencies( data ){
			if( data.dependencies ){
				data.dependencies.map(function(o){
					Data.removeVarUse(o[0],o[1]);
				});
				delete data.dependencies;
			}
		};

		function buff_handler( param ){

			// attributes
			this.data = isBuff(param) ? param : get_buff_data(param);

			// accessors
			this.targets = function( a ){
				return Object.keys(this.data.targets) || [];
			};

			this.addTargets = function( param ){
				if( isArray(param) ){
					for( var i in param ){
						this.data.targets[param[i]] = true;
						Data.Variables.linkBuff(param[i], this.data);
					}
					return this;
				} else {
					return this.addTargets(Array.prototype.slice.call(arguments));
				}
			};

			this.removeTargets = function( param ){
				if( typeof param === 'undefined' ){
					this.removeTargets(Object.keys(this.data.targets));
				} else if( isArray(param) ){
					for( var i in param ){
						delete this.data.targets[param[i]];
						Data.Variables.unlinkBuff(param[i], this.data);
					}
					return this;
				} else {
					return this.removeTargets(Array.prototype.slice.call(arguments));
				}
			};

			this.type = function( param ){
				if( param ){
					this.data.type = param;
					return this;
				}
				return this.data.type;
			};

			this.level = function( param ){
				if( typeof param === 'number' ){
					this.data.level = param;
					return this;
				} else {
					return this.data.level;
				}
			};

			this.value = function( param ){
				if( typeof param !== 'undefined' ){
					if( typeof param === 'number' ){ param = new BN(param) }
					else if (typeof param === 'string'){
						var res = formupop(param);
						param = res[0];
						setupDependencies(this.data, res[1]);
					}
					this.data.value = param;
					return this;
				}
				var val = this.data.value;
				if( typeof val === 'string' ){
					try{ val = eval(val) }
					catch(e) {
						console.log("Couldn't evaluate value.",val,e);
						console.log("%c[To future me]","color:blue;","Have you checked the names of the variables ?")
					}
				}
				return val;
			};

			this.updateTargets = function(){
				updateTargets(this.data);
				return this;
			};

			this.disable = function(){ this.data.enabled = false; updateTargets( this.data ); return this; };

			this.enable = function(){ this.data.enabled = true; updateTargets( this.data ); return this; };

			this.freeHandler = function(){
				// todo:
			}

			return this;
		};

		B = function(id){ return new buff_handler(id)};

		// $(document).ready(function(){
		// 	var str;
		// 	str = "game.gold.bank*2";
		// 	str = "monster.poro.quantity*0.05";
		// 	str = "monster.poro.quantity*0.05e45+3*45+1";
		// 	str = "((monster.poro.quantity+1)*0.05*(2+3))*2";
		// 	console.log(str, formupop(str));
		// });

	})();

	//console.log('>>> B', B().type(BUFF_TYPE.ADDITIVE).value(1).level(2).disable().data);

	var BBox;

	// Buff Box
	(function(){
		var all_buff_datas = {};

		function blank_data(){
			return {
				id: GUID(),
				buffs: {} // buffs[id] = {...}; 
			};
		};

		function isBBox( obj ){
			return typeof obj === 'object'
				&& typeof obj.buffs !== 'undefined'
		};

		function BBox_constructor( param ){
			this.data = isBBox(param) ? param : blank_data();

			this.compute = function( base ){
				if( !base ) throw new Error('BBox.compute: argument expected.');
				var adds = [], mults = [], buffs = this.data.buffs;
				for( var key in buffs ){
					var b = buffs[key];
					if( b.enabled ){
						var tab;
						switch( b.type ){
							case BUFF_TYPE.ADDITIVE:
								tab = adds;
								break;
							case BUFF_TYPE.MULTIPLICATIVE:
								tab = mults;
								break;
						}
						if( tab ){
							if( !tab[b.level] ) tab[b.level] = [];
							tab[b.level].push(b);
						}
					}
				}
				var res = base;
				var handler = B();
				for( var level = 0, m = Math.max(adds.length,mults.length); level < m; ++level){
					for( var i in adds[level] ){
						handler.data = adds[level][i];
						res = res.plus(handler.value());
					} 
					for( var i in mults[level] ){
						handler.data = mults[level][i];
						res = res.times(handler.value());
					} 
				} 
				return res;
			};

			this.empty = function(){this.data.buffs = {};};

			function buff_data_from_args( param ){
				if( isArray(param) ){
					var tab;
					if( isBuff(param[0]) ){ // buff data
						tab = param;
					} else if( param[0].data && isBuff(param[0].data) ) { // buff handler
						tab = param.map(function(o){ return o.data });
					} else if( isString(param[0]) ){
						tab = param.map(function(o){ return new B(o).data; });
					}
					return tab || null;
				} else {
					return buff_data_from_args(Array.prototype.slice.call(arguments));
				}
			};

			this.add = function( param ){
				var tab = buff_data_from_args.apply(null,arguments);
				if( tab ){
					for( var i in tab ){
						this.data.buffs[tab[i].id] = tab[i];
					}
				}
				return this;
			};

			this.remove = function( param ){
				var tab = buff_data_from_args.apply(null,arguments);
				if( tab ){
					for( var i in tab ){
						delete this.data.buffs[tab[i].id];
					}
				}
				return this;
			};

		}
		BBox = function( param ){ return new BBox_constructor(param);};
	})();

	// var b1 = B('A').targets('AA').value(2).type(BUFF_TYPE.ADDITIVE).level(1);
	// var b2 = B('B').targets('BB').value(3).type(BUFF_TYPE.ADDITIVE).level(3);
	// var b3 = B('C').targets('CC').value(4).type(BUFF_TYPE.MULTIPLICATIVE).level(0);

	// console.log('>>> BBox compute', BBox().add(b1,b2,b3).compute(new BN(0)).toString());

	// console.log('>>> BBox', BBox().add('AA','BB').data.buffs );
	// console.log('>>> BBox', BBox().add(['AA','BB']).data.buffs );
	// console.log('>>> BBox', BBox().add(b1,b2).data.buffs );
	// console.log('>>> BBox', BBox().add([b1,b2]).data.buffs );


	// MILESTONES

	// A mile stone is a variable that will only updates once, when the specified value is reached.
	// Too get the reference of a milestone, just use Milestone( name_of_the_target, value_BN )
	// This will return the variable id and add it to the Data.
	// Only one variable per target asks to be updated

	// [target] <-- [general_milestone] <<-- [m1] <<-- [m2] <<-- etc...

	var Milestone = new function(){
		list = {}; // List of the general milestones, the variable that recieves the update event from the target.

		return function Milestone( targetVar, value_BN ){
			var generalId = 'milestone.'+targetVar;
			var obj = list[targetVar];

			if ( !obj ) { //>> Creating the general milestone vriable
				obj = list[targetVar] = Data.registerVar( generalId, null, [targetVar],
					function( i ){
						var truefunc = function(){return true;};
						while( this.milestones && this.milestones.length > 0 ){
							var lastPair = this.milestones[this.milestones.length -1];
							if( i.value.gte(lastPair[1]) ){
								var mileId = generalId+'.'+lastPair[0]; // ex: milestone.[target].1000

								console.log('%cMilestone reached !','color: green;',mileId ); // debug
								Data.registerVar( mileId, true, null, truefunc); // Only registers the variable when the milestone sets off
								// note : mentioning the milestione id as an invalidator 'registers' the variable anyway. cf Data.register
								Data.updateVar(mileId);
								this.milestones.pop(); // The milestone is reached, its state won't change anymore. Bye bye.
								// note : We assume that a past milestone is not going to be registered again.
								// note2 : It would just update it again anyway.
								// note3 : But will never updates the descendants...
							} else {
								break;
							}
						}
					}
				);
				obj.milestones = [];
				obj.ids = {};
			}

			var specificId = value_BN.toString();
			if( ! obj.ids[specificId] ) { // Adding a new milestone to the series.
				obj.ids[specificId] = true;
				obj.milestones.push( [specificId, value_BN] );
				obj.milestones.sort( function(a,b){ return new BN(b[1]).comparedTo(a[1]);} );
			}

			return generalId + '.' + specificId; // ex: milestone.[target].1000
		}
	};


	// RANKS

	var Rank;

	(function(){

		Rank = {};

		_GOLD_RANK_1 = new BN('1000');

		_COEF = new BN(2.5);


		_names = Rank.names =[
			// 1-5
			'Fledgling', '', '', '', '',
			// 6-10
			'Apprentice', '', '', '', '',
			// 11-15
			'Confident', '', '', '', '',
			// 16-20
			'Enchanter', '', '', '', '',
			// 21-25
			'Wizard', '', '', '', '',
			// 26-30
			'Poro Tamer', '', '', '', '',
			// 31-35
			'Bronze', '', '', '', '',
			// 36-40
			'Silver', '', '', '', '',
			// 41-45
			'Gold', '', '', '', '',
			// 46-50
			'Platinum', '', '', '', '',
			// 51-55
			'Diamond', '', '', '', '',
			// 56-60
			'Master', 'Challenger'
		];

		_letters = ['V','IV','III','II','I'];
		for( var i = 0; i < 55; i = i+5){
			var name = _names[i];
			for( var j = 0; j < 5; j++) _names[i+j] = name+' '+_letters[j];
		}

		console.log('RANKS:', Rank.names);

		_MAX_RANK = _names.length -1;
		_rank_needs = [];
		// NB: Can't use ln(x) with the library or it would be larger
		// To save execution time later, we compute all the costs at the beginning.
		for( var i = 0; i < _names.length; ++i ){
			_rank_needs[i] = _GOLD_RANK_1.times( new BN(1).minus(_COEF.pow( new BN(i).plus(1) )) )
										 .dividedBy( new BN(1).minus(_COEF));
		}

		function rankToGold( rank ){
			return rank.eq(-1) ? new BN(0) : (_rank_needs[rank.toNumber() || 0] || null);
		};

		function goldToRank( gold ){
			var r = 0;
			while( gold.gte(rankToGold(new BN(r))) ) ++r;
			return new BN(r);
		};

		Events.addListener('gameLoad', function(){

			Data.Formatting.Functions.rankName = function(bn){
				try {
					return _names[bn.floor().toNumber()] || "Error";
				} catch( e ) {
					return 'Error';
				}
			};

			Data.registerConstant('rank.need.first', _GOLD_RANK_1);
			Data.registerConstant('rank.inflation', _COEF);

			Data.registerVar('rank.need.next', new BN(0), ['rank.potential'], function(){

				var val = rankToGold(this['rank.potential'].value)
						  || new BN(0); // max rank

				if( !val.eq(this.value) ){
					this.value = val;
					return true;
				}

			}, ['rank.potential', 'rank.need.first','rank.inflation']);

			var _goldAllTime = 'statistics.gold.earned.allTime';
			Data.registerVar('rank.potential', new BN(0), [_goldAllTime], function( i ){

				if( this[_goldAllTime].value.gte(this['rank.need.next'].value) ){
					this.value = goldToRank(this[_goldAllTime].value);
					return true;
				}

			}, [_goldAllTime, 'rank.need.next', 'rank.need.first', 'rank.inflation']);

			Data.registerVar('rank.percentage', new BN(0), [_goldAllTime], function( i ){

				var a = rankToGold(this['rank.potential'].value.minus(1)), b = this[_goldAllTime].value, c = rankToGold(this['rank.potential'].value);
				var p = b.minus(a).dividedBy(c.minus(a));

				//console.log('> rank.percentage', a.toString(), b.toString(), c.toString(), p.toString());

				if( p.minus(this.value).absoluteValue().gte(0.001) ){
					//console.log('new step', p.toString(), '-', a.toString(), b.toString(), c.toString());
					this.value = p;
					return true;
				}

			}, [_goldAllTime, 'rank.potential']);

			Data.registerVar('rank.current', new BN(0), ['action.surrender'], function( i ){
				var val = this['rank.potential'].value || new BN(0);
				if( !this.value.eq(val) ) {
					this.value = val;
					return true;
				}
			}, ['rank.potential']);

			$(document).ready(function(){
				Data.updateVarUses('rank.current', true);
			});

		});

	})();

	// UPGRADES

	// var Upgrade = {};

	// Upgrade.upgradedVars = {};

	// // [xxx] --> [var:var.id] -->[yyy]
	// // [xxx] --> [product:var.id] --> [sum:var.id_flat] --> [var:var.id_raw] --> [yyy]

	// Upgrade.makeUpgraded = function( targetVar, bool ){
	// 	console.log("Making Upgrade", targetVar);
	// 	var uv = Upgrade.upgradedVars[targetVar] = {};

	// 	uv.raw = Data.Variables.Index[targetVar];
	// 	uv.raw.id = targetVar+'_raw';
	// 	Data.Variables.Index[uv.raw.id] = uv.raw;

	// 	var invalidatesTab = uv.raw.invalidates.slice(),
	// 		requiredBy = uv.raw.requiredBy.slice();
	// 	invalidatesTab.map(function( v ){ Data.Variables.removeInvalidator(v, targetVar); });
	// 	requiredBy.map(function( v ){ Data.Variables.removeRequirement(v, targetVar); });



	// 	delete Data.Variables.Index[targetVar];

	// 	uv.flat = Data.registerSumVar( targetVar+'_flat', [uv.raw.id], bool);

	// 	uv.mult = Data.registerProductVar( targetVar, [uv.flat.id]);

	// 	invalidatesTab.map(function( v ){ Data.Variables.addInvalidator(v, targetVar); });
	// 	requiredBy.map(function( v ){ Data.Variables.addRequirement(v, targetVar); });

	// 	Data.updateVar( uv.flat.id, undefined, uv.raw.id );

	// 	return uv;
	// }

	// Upgrade.getUpgraded = function( targetVar, bool ){
	// 	return Upgrade.upgradedVars[targetVar] || Upgrade.makeUpgraded(targetVar, bool);
	// }

	// Upgrade.list = {};

	// // UPGRADES:
	// // 	Specifier:
	// // 		- targets : ['id1','id2']	<: Variables to modify
	// // 		- flatFixed : BigNumber		<: Fixed in time flat bonus
	// // 		- multFixed : BigNumber		<: Fixed in time mult bonus
	// // 		- flatVar	: 'id'			<: id of the variable containing the value
	// // 		- multVar	: 'id'			<: cf above

	// Upgrade.Pedia = {};

	// Upgrade.owned = {}, Upgrade.unlocked = {};

	// Upgrade.setUpUnlockFunc = function(){ Events.dispatch('upgrade.unlocked',this.uID, Upgrade.Pedia[this.uID]); console.log('Unlock.this',this); Upgrade.setUpBuy(this.uID)};

	// Upgrade.setUpUnlock = function( uID ){
	// 	if( Upgrade.owned[uID] ) return Upgrade.setUpValue(uID);

	// 	//console.log("SETUP unlock",uID);
	// 	var uEntry = Upgrade.Pedia[uID],
	// 		unlocksLeft = [];

	// 	if( false && unlocksLeft.length == 0 ){
	// 		//console.log("SKIP UNLOCK PROCESS",uID);
	// 		Upgrade.setUpBuy(uID);
	// 	} else {
	// 		/// The Milestone sets off in between...
	// 		/// newMilestoneUse
	// 		Data.registerFlipFlopTrigger( 'upgrade.'+uID+'.unlock', uEntry.unlockedBy, Upgrade.setUpUnlockFunc ).uID = uID;
	// 		//console.log("UPGRADE REGISTERED",uID,Data.Variables.Index[uEntry.unlockedBy],unlocksLeft);
	// 	}
	// 	//console.log("SETUP END", uID, Data.Variables.Index[uEntry.unlockedBy]);
	// 	for( var i in uEntry.unlockedBy ){ // Looking for the milestones still at false
	// 		var id = uEntry.unlockedBy[i];
	// 		//console.log(uID,id,Data.value(id));
	// 		if( Data.value(id) !== true ) unlocksLeft.push( Data.value(id) );
	// 	}
	// 	//console.log(unlocksLeft); // :(:(:(:(:(:(:(
	// }

	// Upgrade.setUpBuyFunc = function(){ Events.dispatch('upgrade.bought',this.uID, Upgrade.Pedia[this.uID]); console.log('Buy.this',this); Upgrade.setUpValue(this.uID)};

	// Upgrade.setUpBuy = function( uID ){

	// 	console.log("SETUP buy",uID);

	// 	Data.updateVar('statistics.upgrade.discovered',undefined," ");
	
	// 	Data.unregisterVar( 'upgrade.'+uID+'.unlock');

	// 	var uEntry = Upgrade.Pedia[uID];
	// 	Upgrade.unlocked[uID] = uEntry;

	// 	Data.registerConstant('upgrade.'+uID+'.basePrice', uEntry.shop.price );

	// 	Data.registerProductVar('upgrade.'+uID+'.price',['upgrade.'+uID+'.basePrice']); // todo: global/special upgrade price modifier

	// 	Data.registerConditionalRootVar('action.upgrade.buy.'+uID, ['upgrade.'+uID+'.price','game.gold.bank'], function(price,bank){ if(bank.gte(price)){ this.value = price; return true;} });
	
	// 	Data.Variables.addInvalidator(Data.Variables.Index['action.buy.upgrade'],'action.upgrade.buy.'+uID);

	// 	Data.registerFlipFlopTrigger( 'upgrade.'+uID+'.buy', ['action.upgrade.buy.'+uID ], Upgrade.setUpBuyFunc ).uID = uID;

	// 	Data.registerLTVar('upgrade.'+uID+'.unaffordable','game.gold.bank','upgrade.'+uID+'.price');

	// 	Data.updateVar('upgrade.'+uID+'.price',undefined,'upgrade.'+uID+'.basePrice');

	// 	Upgrade.dispatchUnlocked( uID, uEntry );
	// }

	// Upgrade.setUpValue = function( uID ){


	// 	Data.updateVar('statistics.upgrade.bought',undefined," ");

	// 	Data.unregisterVar( 'upgrade.'+uID+'.basePrice');
	// 	Data.unregisterVar( 'upgrade.'+uID+'.price');
	// 	Data.unregisterVar( 'action.upgrade.buy.'+uID);
	// 	Data.unregisterVar( 'upgrade.'+uID+'.buy');
	// 	Data.unregisterVar( 'upgrade.'+uID+'.unaffordable');

	// 	var uEntry = Upgrade.Pedia[uID];
	// 	Upgrade.owned[uID] = uEntry;
	// 	if(Upgrade.unlocked[uID]) delete Upgrade.unlocked[uID];

	// 	var uvs = uEntry.targets.map( function(t){
	// 		var uv = Upgrade.getUpgraded(t, true);
	// 		console.log('getupgrade',uEntry.op);
	// 		switch( uEntry.op ){
	// 			case '+': return uv.flat;
	// 			case '*': return uv.mult;
	// 		}
	// 	});

	// 	var valueID = typeof uEntry.value == 'string' ?
	// 		uEntry.value
	// 		: Data.registerConstant('upgrade.'+uID+'.value', uEntry.value ).id;

	// 	console.log("uvs",uvs);
	// 	for( var i in uvs ){
	// 		var uv = uvs[i];
	// 		Data.Variables.addInvalidator(uv, valueID);
	// 		console.log("uv", uv, valueID);
	// 		Data.Variables.addRequirement(uv, valueID);

	// 		Data.updateVar(uv, undefined, valueID);
	// 	}

	// 	Upgrade.dispatchBought( uID, uEntry );
	// }

	// Upgrade.unlockedCallbacks = [];
	// Upgrade.boughtCallbacks = [];

	// Upgrade.dispatchUnlocked = function( id, uEntry ){ Upgrade.unlockedCallbacks.map( function( f ){ f.call(null,id,uEntry)}) };
	// Upgrade.dispatchBought = function( id, uEntry){ Upgrade.boughtCallbacks.map( function( f ){ f.call(null,id,uEntry)}) };

	// Upgrade.onUnlocked = function( f ){ Upgrade.unlockedCallbacks.push(f) };
	// Upgrade.onBought = function( f ){ Upgrade.boughtCallbacks.push(f) };

	// Upgrade.register = function( id, specifier ){
	// 	var u = Upgrade.list[id] || (Upgrade.list[id] = {});


	// }

	// Time

	var Time = {};
	(function(){
		
		var timer = null;
		var interval = null;

		Time.setInterval = function( ms ){
			interval = ms;
		};

		Time.start = function(){
			timer =  setInterval(function(){ Data.updateVar("action.time.elapsed") }, interval);
			//timer =  setInterval(function(){ Data.updateVar("action.time.update", (new BN(Date.now())).div(new BN(1000)) ) }, interval);
		};

		Time.stop = function(){
			clearInterval(timer);
		};
	})();

	//////////////////////////////////////////////////////////////////////////////////////////////
	//                                   	SAVE SYSTEM
	//                   		     
	//////////////////////////////////////////////////////////////////////////////////////////////

	var Game = {};

	(function(){

		function saveVar( obj, varID ){
			var val = Data.value(varID);
			if( typeof val === 'object' && typeof val.e !== 'undefined') val = ['BN',val.toString()];
			obj[varID] = val;
		};

		function makeUpVar( obj, varID, value){
			obj[varID] = value;
		}


		Game.save = function(){
			var save = {};
			save.version = '0.1';

			var obj = {};
			saveVar(obj,'game.gold.bank.exact');
			saveVar(obj,'statistics.gold.earned.allTime');
			Data.Pedia.MonsterIDs.map( function(str){
				saveVar(obj,'monster.'+str+'.quantity.base')}
			);
			makeUpVar(obj,'action.time.elapsed', Date.now());

			save.vars = obj;
			save.spellbook = Spellbook.save();
			save.dialogue = Dialogue.save();
			save.features = Features.save();

			//console.log('SAVE',obj);
			var text = JSON.stringify(save);
			localStorage.setItem('game.save', text);
			console.log(btoa(text), btoa(text).length);
			Interface.notify('**Game saved**.');
		}

		Game.deleteSave = function(){
			localStorage.removeItem('game.save');
		}

		function load_vars( obj ){
			for( var key in obj ){
				var val = obj[key];
				if( val[0] && val[0] === 'BN') obj[key] = new BN(val[1]);
			}
			Data.Load(obj);
		}

		function convert_noversion_to_0_1( save ){
			for( var key in save ){
				var key2 = key.replace(/(monster\.[a-z]+\.quantity)/g,'$1.base');
				if( key != key2 ){
					save[key2] = save[key];
					delete save[key];
				}
			}
			return {vars: save};
		}

		Game.loaded = false;

		Game.load = function(){
			var save = JSON.parse(localStorage.getItem("game.save"));
			if( save ){
				console.log('%cSave Manager:','color:purple;font-weight:bold;',"Save found. Initiating retrieval.");
				//console.log(save);
				if( !save.version ) save = convert_noversion_to_0_1(save);

				if( !Spellbook.load(save.spellbook) )
					console.log('%cERROR:','color:red;font-weight:bold;',"Couldn't load Spellbook.");

				if( !Dialogue.load(save.dialogue) )
					console.log('%cERROR:','color:red;font-weight:bold;',"Couldn't load dialogues.");
				
				if( !Features.load(save.features) )
					console.log('%cERROR:','color:red;font-weight:bold;',"Couldn't load features.");

				load_vars(save.vars);
				console.log('%cSave Manager:','color:purple;font-weight:bold;',"Retrieval process completed.");
				
				Events.dispatch('gameLoad', 'success');
				Game.loaded = true;
				return true;
			} else {
				console.log('%cSave Manager:','color:purple;font-weight:bold;',"No save data available.");
			}
			Events.dispatch('gameLoad', 'fail');
			Game.loaded = true;
			return false;
		}
	})();


	//////////////////////////////////////////////////////////////////////////////////////////////
	//                                   LOLIPOP - LOLIPRIVATE
	//                    External/Internal access of game functionalities
	//////////////////////////////////////////////////////////////////////////////////////////////

	Loliprivate.clickOnMick = function(){
		console.log("clickOnMick");
		Action.do('action.click.mick');
	}

	var Interface = {};

	Loliprivate.interact = function( elt ){
		Interface.interact(elt);
	}

	Loliprivate.action = function( actionCode ){
		console.log(actionCode)
		switch( actionCode ){
			default:
				Data.updateVar(actionCode); break;
		}
	}

	Loliprivate.save = function(){
		return Game.save();
	}

	Loliprivate.load = function(){
		return Game.load();
	}

	Loliprivate.updateVarUses = function( id ){
		if( id ){
			Data.updateVarUses(id);
		} else {
			Object.keys(Data.Variables.Index).map(function(str){ Data.updateVarUses(str) });
		}
	}

	var updateDomActionsFunction = function(){
			Lolipop.action($(this).attr("data-lolipop-action"));
		};
	Loliprivate.updateDOMActions = function(){
		$(".lolipop-action").off('click', updateDomActionsFunction);
		$(".lolipop-action").on('click', updateDomActionsFunction);
	};

	Loliprivate.logData = function(){
		console.log(Data);
	}

	// Lolipublic
	// Offers the functions of Loliprivate, without the possibility to delete the functions
	for( var o in Loliprivate ) {
		if( typeof Loliprivate[o] === 'function' ) {
			Lolipop[o] = (function( a ){
				return function(){
					return Loliprivate[a].apply(this, arguments);
				};
			})(o);
		};
	}

	//////////////////////////////////////////////////////////////////////////////////////////////
	//                                   DATA ENTRIES
	//                   		 Filling all the data in
	//////////////////////////////////////////////////////////////////////////////////////////////

	// Loader for a new game
	Data.NewGameLoader = {
		//'monster.poro.price.1': new BN(15),
		'monster.poro.quantity.base': new BN(0),
		//'monster.wolf.price.1': new BN(15),
		'monster.wolf.quantity.base': new BN(0),
		//'monster.raptor.price.1': new BN(15),
		'monster.raptor.quantity.base': new BN(0),
		//'monster.krug.price.1': new BN(15),
		'monster.krug.quantity.base': new BN(0),
		//'monster.gromp.price.1': new BN(15),
		'monster.gromp.quantity.base': new BN(0),
		//'monster.blue.price.1': new BN(15),
		'monster.blue.quantity.base': new BN(0),
		//'monster.red.price.1': new BN(15),
		'monster.red.quantity.base': new BN(0),
		//'monster.dragon.price.1': new BN(15),
		'monster.dragon.quantity.base': new BN(0),
		//'monster.vilemaw.price.1': new BN(15),
		'monster.vilemaw.quantity.base': new BN(0),
		//'monster.nashor.price.1': new BN(100),
		'monster.nashor.quantity.base': new BN(0),
		//'game.gold.bank.exact': new BN('12345678901234234512345678'),
		'game.gold.bank.exact': new BN('0'),
		'game.gold.bank': new BN('0'),
		'game.gold.gpc': new BN(1)
	}

	// DATA.PEDIA : INTERFACE/NON-VARIABLE RELATED DATA
	Data.Pedia = {
		Monsters: {
			"poro": {
				code: "poro",

				Recap: {
					image: 'poro',
					quantity: 'monster.poro.quantity',
					gps: 'monster.poro.gps'
				},

				SummonMenu: {
					name: 'Poro',
					//description: 'A Poro can find gold in the freezing snow of the Freljord. When the wind stops. Sometimes.',
					description: 'This cutie dives in the thick snow of the Freljord to find you some gold. Surprisingly, it actually works. ',
					image: 'poro'
				}
			},
			"wolf": {
				code: "wolf",

				Recap: {
					image: 'blue',
					quantity: 'monster.blue.quantity',
					gps: 'monster.blue.gps'
				},

				SummonMenu: {
					name: 'Murk Wolf',
					description: 'The flair of a Murk Wolf is one of Runeterra\'s finests. Gold ores just can\'t hide.',
					image: 'monster-menu-wolf'
				}
			},
			"raptor": {
				code: "raptor",

				Recap: {
					image: 'blue',
					quantity: 'monster.blue.quantity',
					gps: 'monster.blue.gps'
				},

				SummonMenu: {
					name: 'Raptor',
					description: 'Once in a while, an awful yet lucrative dysfunction in raptors causes females to lay golden eggs.',
					image: 'monster-menu-blue'
				}
			},
			"krug": {
				code: "krug",

				Recap: {
					image: 'blue',
					quantity: 'monster.blue.quantity',
					gps: 'monster.blue.gps'
				},

				SummonMenu: {
					name: 'Krug',
					description: 'Being made out of rock sometimes comes with aesthetical downsides. Golden splinters for instance...',
					image: 'blueBIG'
				}
			},
			"gromp": {
				code: "gromp",

				Recap: {
					image: 'blue',
					quantity: 'monster.blue.quantity',
					gps: 'monster.blue.gps'
				},

				SummonMenu: {
					name: 'Gromp',
					description: 'No one actually knows how gromps can find gold. We only know that they love chewing some.',
					image: 'blueBIG'
				}
			},
			"blue": {
				code: "blue",

				Recap: {
					image: 'blue',
					quantity: 'monster.blue.quantity',
					gps: 'monster.blue.gps'
				},

				SummonMenu: {
					name: 'Blue Sentinel',
					description: 'Mana can be extracted from blue sentinels\' tears. But where does gold come from ? Ow... ',
					image: 'blueBIG'
				}
			},
			"red": {
				code: "red",

				Recap: {
					image: 'blue',
					quantity: 'monster.blue.quantity',
					gps: 'monster.blue.gps'
				},

				SummonMenu: {
					name: 'Red Brambleback',
					description: 'The back cavity of a brambleback is so hot, that it melts all the surrounding gold magic.',
					image: 'blueBIG'
				}
			},
			"dragon": {
				code: "dragon",

				Recap: {
					image: 'blue',
					quantity: 'monster.blue.quantity',
					gps: 'monster.blue.gps'
				},

				SummonMenu: {
					name: 'Dragon',
					description: 'Stories on these magical creatures are countless. Many of those include a golden treasure.',
					image: 'blueBIG'
				}
			},
			"vilemaw": {
				code: "vilemaw",

				Recap: {
					image: 'blue',
					quantity: 'monster.blue.quantity',
					gps: 'monster.blue.gps'
				},

				SummonMenu: {
					name: 'Shadow Isle\'s Spider',
					description: 'Being related to Vilemaw and the fake God industry is lucrative. Really.',
					image: 'blueBIG'
				}
			},
			"nashor": {
				code: "nashor",

				Recap: {
					image: 'blue',
					quantity: 'monster.blue.quantity',
					gps: 'monster.blue.gps'
				},

				SummonMenu: {
					name: 'Serpentine Worm',
					description: 'Being one of the fiercest creature has its perks. You want gold ? You take it.',
					image: 'blueBIG'
				}
			}
		}
	};

	Data.Pedia.MonsterIDs = Object.keys(Data.Pedia.Monsters);

	// Data.Pedia AUTOFILL
	// Monsters
	Data.Pedia.MonsterIDs.map( function( m ){
		var monster = Data.Pedia.Monsters[m];
		monster.vars = {};
		var v = monster.vars;
		v.price = 'monster.'+m+'.price.1';
		v.price10 = 'monster.'+m+'.price.10';
		v.refund = 'monster.'+m+'.refund';
		v.refundAll = 'monster.'+m+'.refundAll';
		v.actionBuy = 'action.buy.monster.'+m+'.1';
		v.actionBuy10 = 'action.buy.monster.'+m+'.10';
		v.actionRefund = 'action.refund.monster.'+m;
		v.actionRefundAll = 'action.refundAll.monster.'+m;
		v.quantity = 'monster.'+m+'.quantity';
		v.baseQuantity = 'monster.'+m+'.quantity.base';
		v.extraQuantity = 'monster.'+m+'.quantity.extra';
		v.gps = 'monster.'+m+'.gps';
		v.baseGps = 'constant.monster.'+m+'.gps';
		v.unaffordable = 'monster.'+m+'.unaffordable';
		v.unaffordable10 = 'monster.'+m+'.unaffordable.10';
		v.unsellable = 'monster.'+m+'.unsellable';
		v.unsellable10 = 'monster.'+m+'.unsellable10';
	});

	// Upgrade.Pedia = {
	// 	'poro.gps.x2' : {
	// 		targets: ['constant.monster.poro.gps'],
	// 		op: '*',
	// 		value: new BN(2),
	// 		unlockedBy: [Milestone('monster.poro.quantity', 5)],
	// 		price: 100,

	// 		shop: {
	// 			name: 'Thick Furr',
	// 			description: 'Poros can find gold twice as fast.'
	// 		}
	// 	}
	// };

	// auto generated on Spreadsheet
	//Upgrade.Pedia = { 'C20' : { targets: ['game.gold.gpc'], op: '*', value: new BN('2'), unlockedBy: [Milestone('statistics.mick.clicksAllTime',new BN(25))], shop: { price: new BN(50), name: 'Smashing Click', description: 'The amount of gold earned by [mick] is <strong>doubled</strong>.', story:'', image: 'smash1' }},'C21' : { targets: ['game.gold.gpc'], op: '*', value: new BN('2'), unlockedBy: [Milestone('statistics.mick.clicksAllTime',new BN(100))], shop: { price: new BN(200), name: 'Lucrative Smash', description: 'The amount of gold earned by clicking the minion is <strong>doubled</strong>.', story:'', image: 'smash2' }},'C22' : { targets: ['game.gold.gpc'], op: '*', value: new BN('2'), unlockedBy: [Milestone('statistics.mick.clicksAllTime',new BN(300))], shop: { price: new BN(1500), name: 'Super Smash', description: 'The amount of gold earned by clicking the minion is <strong>doubled</strong>.', story:'', image: 'smash3' }},'P00' : { targets: ['constant.monster.poro.gps'], op: '+', value: new BN('0.1'), unlockedBy: [Milestone('monster.poro.quantity',new BN(5))], shop: { price: new BN(40), name: 'Fluffy Tandem', description: 'Each [m=poro,Poros] gains <strong>+0.1</strong> gold per second.', story:'Poros start working in pairs. This is the first step towards the poro network.', image: 'poro1' }},'P01' : { targets: ['constant.monster.poro.gps'], op: '*', value: new BN('2'), unlockedBy: [Milestone('monster.poro.quantity',new BN(10))], shop: { price: new BN(300), name: 'Thick Furr', description: '[m=poro,Poros] can find gold <strong>twice</strong> as fast.', story:'Awesome story.', image: 'poro1' }},'P02' : { targets: ['constant.monster.poro.gps'], op: '*', value: new BN('2'), unlockedBy: [Milestone('monster.poro.quantity',new BN(30))], shop: { price: new BN(5000), name: 'Magma Furr', description: '[m=poro,Poros] can find gold <strong>twice</strong> as fast.', story:'Awesome story.', image: 'poro2' }},'P03' : { targets: ['constant.monster.poro.gps'], op: '*', value: new BN('2'), unlockedBy: [Milestone('monster.poro.quantity',new BN(75))], shop: { price: new BN(1000000), name: 'Fantom Furr', description: '[m=poro,Poros] can find gold <strong>twice</strong> as fast.', story:'Awesome story.', image: 'poro3' }},'W00' : { targets: ['constant.monster.wolf.gps'], op: '+', value: new BN('0.5'), unlockedBy: [Milestone('monster.wolf.quantity',new BN(5))], shop: { price: new BN(400), name: 'Wild Nose', description: '[m=wolf,Wolves] now have a better sense of smell and find gold <strong>twice</strong> as fast.', story:'Awesome story.', image: 'wolf2' }},'W01' : { targets: ['constant.monster.wolf.gps'], op: '*', value: new BN('2'), unlockedBy: [Milestone('monster.wolf.quantity',new BN(10))], shop: { price: new BN(1500), name: 'Wild Nose', description: '[m=wolf,Wolves] now have a better sense of smell and find gold <strong>twice</strong> as fast.', story:'Awesome story.', image: 'wolf1' }},'R00' : { targets: ['constant.monster.raptor.gps'], op: '+', value: new BN('2'), unlockedBy: [Milestone('monster.raptor.quantity',new BN(5))], shop: { price: new BN(2000), name: 'Red Raptors', description: 'New species of [m=raptor,Raptors] increase the chances of getting golden eggs. #Diversity', story:'Awesome story.', image: 'raptor1' }},'R01' : { targets: ['constant.monster.raptor.gps'], op: '*', value: new BN('2'), unlockedBy: [Milestone('monster.raptor.quantity',new BN(10))], shop: { price: new BN(7000), name: 'Red Raptors', description: 'New species of [m=raptor,Raptors] increase the chances of getting golden eggs. #Diversity', story:'Awesome story.', image: 'raptor1' }},'XX0' : { targets: ['game.gold.gps'], op: '*', value: new BN('100000'), unlockedBy: [Milestone('game.gold.bank',new BN(0))], shop: { price: new BN(0), name: 'CHEAT', description: 'CHEAAAAT GPS', story:'', image: 'poro8' }},'XX1' : { targets: ['game.gold.gpc'], op: '*', value: new BN('100000'), unlockedBy: [Milestone('game.gold.bank',new BN(0))], shop: { price: new BN(0), name: 'CHEAT', description: 'CHEAAAAT GPC', story:'', image: 'poro7' }} };


	//Upgrade.pediaEntries = Object.keys(Upgrade.Pedia);

	//////////////////////////////////////////////////////////////////////////////////////////////
	//                                   		Sprites
	//                      Where sprite sheets are taken care of
	//////////////////////////////////////////////////////////////////////////////////////////////

	var Sprite = {};

	Sprite.Utils = {};

	Sprite.Sheet = {};

	Sprite.Utils.txtMapToJSON = function( id, txt ){

		var entry = Sprite.Sheet[id].sprites = {};
		txt.split('\n').map( function( line ){
			var m = line.match(/(\w+) = (\d+) (\d+) (\d+) (\d+)/);
			if( m ){
				var data = entry[m[1]] = {};

				data.x = m[2];
				data.y = m[3];
				data.w = m[4];
				data.h = m[5];
			}
		});
	}

	Sprite.loadSheet = function( id, sheetUrl, mapUrl ){
		var sheet = Sprite.Sheet[id] = {};

		sheet.url = sheetUrl;

		sheet.loaded = false;

		$.ajax({
            url: mapUrl,
            async: true,
            success: function (data){
            	Sprite.Utils.txtMapToJSON(id, data);
                console.log("JSON",Sprite.Sheet);
                sheet.loaded = true;
            }
        });
	}

	//////////////////////////////////////////////////////////////////////////////////////////////
	//                                   VARIABLES DECLARATIONS
	//                      Where variables and their behavior are defines
	//////////////////////////////////////////////////////////////////////////////////////////////

	// -- DATA --

	// === CONSTANTS ===

	Data.registerBuffableConstant("constant.monster.poro.gps", 		new BN(0.2));
	Data.registerBuffableConstant("constant.monster.wolf.gps", 		new BN(1));
	Data.registerBuffableConstant("constant.monster.raptor.gps", 	new BN(5));
	Data.registerBuffableConstant("constant.monster.krug.gps", 		new BN(27));
	Data.registerBuffableConstant("constant.monster.gromp.gps", 	new BN(150));
	Data.registerBuffableConstant("constant.monster.blue.gps", 		new BN(750));
	Data.registerBuffableConstant("constant.monster.red.gps", 		new BN(4321));
	Data.registerBuffableConstant("constant.monster.dragon.gps", 	new BN(20000));
	Data.registerBuffableConstant("constant.monster.vilemaw.gps", 	new BN(123000));
	Data.registerBuffableConstant("constant.monster.nashor.gps", 	new BN(666666));

	Data.registerConstant("constant.monster.poro.price", 	new BN(20));
	Data.registerConstant("constant.monster.wolf.price", 	new BN(115));
	Data.registerConstant("constant.monster.raptor.price", 	new BN(800));
	Data.registerConstant("constant.monster.krug.price", 	new BN(5200));
	Data.registerConstant("constant.monster.gromp.price", 	new BN(38500));
	Data.registerConstant("constant.monster.blue.price", 	new BN(290000));
	Data.registerConstant("constant.monster.red.price", 	new BN(2800000));
	Data.registerConstant("constant.monster.dragon.price", 	new BN(23500000));
	Data.registerConstant("constant.monster.vilemaw.price", new BN(275000000));
	Data.registerConstant("constant.monster.nashor.price", 	new BN(2900000000));

	Data.registerConstant("constant.monster.inflation", 	new BN(1.15));

	// Variables
	//Data.registerVar("data.monster.poro.quantity", new BN(0), ["action.monster.poro.buy"], function( invalidator ){ console.log("updating", this.id ,"from", invalidator.id); return true });
	//Data.registerVar("data.monster.poro.price", new BN(15), ["data.monster.poro.quantity"], function( invalidator ){ console.log("updating", this.id ,"from", invalidator.id); return true; });
	//Data.registerVar("action.monster.poro.buy", new BN(0), null, function( qty ){ console.log("updating", this.id,"with value", qty); return true; }, ['requirement']);

	// Action of clicking on Mick
	Data.registerVar("action.click.mick", new BN(0), null, function( qty, action_data ){ this.value = qty || new BN(1); Events.dispatch('minionSmashed', null, action_data); return true; });
	var SURRENDER_MS = 20*60*1000;
	Data.registerVar("action.surrender", new BN(0), null, function( qty, action_data ){ var now = Date.now(); if( Features.unlocked('surrender') && Features.enabled('surrender') && (!this.lastSurrender || (now - this.lastSurrender) > SURRENDER_MS ) ){ this.lastSurrender = now; Events.dispatch('surrender', null, action_data); return true; }});

	// Time elapsed, can be set at low frequency on slower machines to save performance
	//Data.registerVar("action.time.elapsed", new BN(0), null, function( t ){ this.value = t; return true; });
	Data.registerVar("action.time.elapsed", null, null,
		function( timestamp ){
			if( this.time == null || timestamp ){ this.time = new BN( timestamp || Date.now()).div(new BN(1000)); this.value = new BN(0);}
			else { var now = new BN(Date.now()).div(new BN(1000)); this.value = now.minus(this.time); this.time = now; return this.value.gt(0); } });

	//Data.registerVar("action.time.elapsed", new BN(0), ['action.time.update'], function(){});

	// Monster related Variables
	/// -- PORO -- 

	var monsterBuyActions = [];
	var monsterRefundActions = [];

	Data.Pedia.MonsterIDs.map(function( m ){ // For each monster m

		var actionBuy1 = 'action.buy.monster.'+m+'.1', actionBuy10 = 'action.buy.monster.'+m+'.10',
			actionRefund = 'action.refund.monster.'+m, actionRefundAll = 'action.refundAll.monster.'+m;

		var sponge_obj = {};
		sponge_obj[actionBuy1] = 1;
		sponge_obj[actionBuy10] = 10;
		sponge_obj[actionRefund] = -1;
		sponge_obj[actionRefundAll] = '-current';

		Data.registerSpongeVar('monster.'+m+'.quantity.base', sponge_obj,Data.Formatting.abreviatedNumber);
		Data.registerBuffableConstant('monster.'+m+'.quantity.extra', new BN(0));
		
		Data.registerSumVar('monster.'+m+'.quantity',['monster.'+m+'.quantity.base','monster.'+m+'.quantity.extra']);
		//Data.registerRelayVar('monster.'+m+'.baseGps', ['constant.monster.'+m+'.gps']);
		//Data.registerProductVar('monster.'+m+'.gps', ['monster.'+m+'.quantity','monster.'+m+'.baseGps']);
		// --> Combine because relay on constant can't work
		Data.registerProductVar('monster.'+m+'.gps', ['monster.'+m+'.quantity','constant.monster.'+m+'.gps'], Data.Formatting.abreviatedNumber);

		// Registering the variable computing the costs/benefits of buying/selling minions
		Data.registerPriceComputerVar('monster.'+m+'.price.1', 'constant.monster.'+m+'.price', 'constant.monster.inflation', 'monster.'+m+'.quantity', Data.Formatting.abreviatedNumber);
		Data.registerPrice10ComputerVar('monster.'+m+'.price.10', 'constant.monster.'+m+'.price', 'constant.monster.inflation', 'monster.'+m+'.quantity', Data.Formatting.abreviatedNumber);
		Data.registerRefundComputerVar('monster.'+m+'.refund', 'constant.monster.'+m+'.price', 'constant.monster.inflation', 'monster.'+m+'.quantity', Data.Formatting.abreviatedNumber);
		Data.registerRefundAllComputerVar('monster.'+m+'.refundAll', 'constant.monster.'+m+'.price', 'constant.monster.inflation', 'monster.'+m+'.quantity', Data.Formatting.abreviatedNumber);

		// Registering the user actions related to the above variables
		Data.registerConditionalRootVar(actionBuy1, ['monster.'+m+'.price.1','game.gold.bank'], function(price,bank){ if(bank.gte(price)){ this.value = price; return true;} });
		Data.registerConditionalRootVar(actionBuy10, ['monster.'+m+'.price.10','game.gold.bank'], function(price,bank){ if(bank.gte(price)){ this.value = price; return true;} });
		Data.registerConditionalRootVar(actionRefund, ['monster.'+m+'.refund','monster.'+m+'.quantity'], function(refund, quantity){ if( quantity.gt(0) ){ this.value = refund; return true;}});
		Data.registerConditionalRootVar(actionRefundAll, ['monster.'+m+'.refundAll','monster.'+m+'.quantity'], function(refund, quantity){ if( quantity.gt(0) ){ this.value = refund; return true;}});


		Data.registerLTVar('monster.'+m+'.unaffordable','game.gold.bank','monster.'+m+'.price.1');
		Data.registerLTVar('monster.'+m+'.unaffordable.10','game.gold.bank','monster.'+m+'.price.10');
		Data.registerLTVar('monster.'+m+'.unsellable','monster.'+m+'.quantity',new BN(1));
		Data.registerLTVar('monster.'+m+'.unsellable10','monster.'+m+'.quantity',new BN(10));



		monsterBuyActions.push(actionBuy1);
		monsterBuyActions.push(actionBuy10);
		monsterRefundActions.push(actionRefund);
		monsterRefundActions.push(actionRefundAll);
	});
	
	Data.registerSumVar('monster.quantity', Data.Pedia.MonsterIDs.map(function( m ){ return 'monster.'+m+'.quantity';}));
	Data.registerSumVar('monster.gps', Data.Pedia.MonsterIDs.map(function( m ){ return 'monster.'+m+'.gps';}));

	// Monster refund tree
	Data.registerRelayVar('action.refund.monster',monsterRefundActions);
	Data.registerRelayVar('action.refund', ['action.refund.monster']);

	///  MILESTONES
	//> Used to set off updrages, achievements and game mechanics

	// TODO: Milestone( var, BN ):string that can be used to register var in other vars, adds to list, then automatically registered :D
	// DONE 

	/*Milestone('game.gold.bank',new BN(1));
	Milestone('game.gold.bank',new BN(100));


	Milestone('statistics.mick.clicksAllTime',new BN(1));
	Milestone('statistics.mick.clicksAllTime',new BN(2));
	Milestone('statistics.mick.clicksAllTime',new BN(5));*/


	// Upgrades

	// Upgrade.pediaEntries.map( function( uID ){
	// 	Upgrade.setUpUnlock(uID);
	// });

	// BUY TREE

	Data.registerRelayVar('action.buy.monster',	monsterBuyActions);
	Data.registerRelayVar('action.buy.upgrade', []);
	Data.registerRelayVar('action.buy',	['action.buy.monster','action.buy.upgrade']);

	// Gold earned per click
	//Data.registerVar("game.gold.gpc", new BN(0), ['game.gold.gps'], function(){ return false; });
	Data.registerBuffableConstant("game.gold.gpc", new BN(1));

	// Gold earned per second
	Data.registerRelayVar("game.gold.gps", ['monster.gps']);

	Data.registerProductVar("action.click.goldProduced",['action.click.mick'],['game.gold.gpc']);
	Data.registerProductVar("action.time.goldProduced",['action.time.elapsed','game.gold.gps']);

	Data.registerRelayVar('action.goldProduced',['action.click.goldProduced','action.time.goldProduced']);

	Data.registerSpongeVar('game.gold.bank.exact',{'action.goldProduced':'+value','action.buy':'-value','action.refund':'+value'});

	Data.registerSpongeVar('statistics.gold.earned.allTime',{'action.goldProduced':'+value'});

	Data.registerFloorRelayVar('game.gold.bank',['game.gold.bank.exact']);

	//Upgrade.makeUpgraded('game.gold.bank');


	/// STATISTICS
	//> Used in stats view, statistics and prestige



	Data.registerSpongeVar('statistics.mick.clicksAllTime',{'action.click.mick':'+value'});
	Data.registerSpongeVar('statistics.mick.clicksThisGame',{'action.click.mick':'+value'});
	Data.registerIncrementVar('statistics.spell.discovered');

	//////////////////////////////////////////////////////////////////////////////////////////////
	//                                   INTERFACE
	//                   		     
	//////////////////////////////////////////////////////////////////////////////////////////////


	function bbpop( str ) {
		str = str.replace(/\[m=([a-z]+),?([a-zA-Z ]*)\]/g, '<span class="symbol outlined" title="$2" style="background-image: url(\'img/mobile/monster-$1.jpg\');"></span>');
		str = str.replace(/:(poro|wolf|raptor|krug|gromp|blue|red|dragon|vilemaw|nashor),?([a-zA-Z ]*):/g, '<span class="symbol outlined" title="$2" style="background-image: url(\'img/mobile/monster-$1.jpg\');"></span>');
		str = str.replace(/\[(person|term),([^\]]+)\]/g,'<strong class="gamevoc $1">$2</strong>');
		str = str.replace(/\[mick\]/g, '<span class="symbol" title="Smashing the minion" style="background-image: url(\'img/mobile/mick48.png\');"></span>');
		str = str.replace(/:minion:/g, '<span class="symbol" title="Minions" style="background-image: url(\'img/mobile/mick48.png\');"></span>');
		str = str.replace(/\*\*([^*]*)\*\*/g,'<strong class="double">$1</strong>');
		str = str.replace(/\*([^*]*)\*/g,'<strong>$1</strong>');
		str = str.replace(/___([^*]*)___/g,'<span class="info">$1</span>');
		str = str.replace(/\n/g,'<br/>');
		return str;
	};

	function bbpop_light( str ){
		str = str.replace(/\[m=([a-z]+),?([a-zA-Z ]*)\]/g, '$2');
		str = str.replace(/:(poro|wolf|raptor|krug|gromp|blue|red|dragon|vilemaw|nashor),?([a-zA-Z ]*):/g, '$2');
		str = str.replace(/\[mick\]/g, 'Smashing');
		str = str.replace(/:minion:/g, 'The Minion');
		str = str.replace(/\*\*([^*]*)\*\*/g,'$1');
		str = str.replace(/\*([^*]*)\*/g,'$1');
		str = str.replace(/___([^*]*)___/g,'$1');
		return str;
	}

	var Interface = {};

	Interface.actions = {};

	Interface.popup = function(){
		var $container = $('#main-container');

		var $popup = $("<div class='popup acenter hidden'><div class='scroll' style='-webkit-overflow-scrolling: touch;'><div class='window text-section'></div></div></div>");

		var $insert = $popup.find('.window');
		$insert.lolipopClose = function(){
			$insert.lolipopHide();
			setTimeout( function(){
				$popup.remove();
			}, 1000);
		}
		$insert.lolipopHide = function(){
			$popup.addClass('hidden');
		}
		$insert.$popup = $popup;

		$container.append($popup);

		setTimeout(function(){ $popup.removeClass('hidden')}, 50);

		return $insert;
	};

	(function(){

		var _dials = [], _callbacks = [];
		var $insert, $dial_ghost;
		var _current_callback = null;

		var _skip_func = function(){};

		$(window).keyup(function(e){ if(e.keyCode === 32){_skip_func(e);} });

		Interface.dialogue = function( dial, callback ){

			if( dial == '0') throw "ERROR";

			if( dial ) {
				dial = dial.split('\n').map(function(str){ return '<p>'+bbpop(str)+'</p>'}).join('');
				_dials.push(dial);
				_callbacks.push(callback || function(){});
			}

			if( !$insert ){
				$insert = Interface.popup();
				$insert.$popup.addClass('dialogue');

				$insert.append($('<div class="mr-tuto"></div>'));

				$insert.append($('<div class="content outer"><div class="content inner aleft"></div><div class="skip">&#8669;</div><div class="name">Aezekior</div></div>'));

				$dial_ctn = $insert.find('.content.inner').not('.ghost');
				$dial_ghost = $insert.find('.content.inner.ghost');

				function _skip(){
					_dials.shift();
					setTimeout(_callbacks.shift()(),0);

					if( _dials.length > 0 ) {
						Interface.dialogue();
					} else {
						$insert.lolipopClose();
						$insert = null;
						_skip_func = function(){};
					}
				}

				$insert.find('.skip').click(function(){
					_skip();
				});
				_skip_func = _skip;

			}

			if( _dials.length > 0 ) {
				$dial_ctn.empty();
				$dial_ctn.html(_dials[0]);
			}
		}

		


	})();

	// Events.addListener('filesLoaded', function(){
	// 	setTimeout(function(){
	// 		var lines = Lang.line('0000') || [];
	// 		lines.map(function( str ){ Interface.dialogue(str)});
	// 		//Interface.dialogue("LOL");
	// 	}, 1000);
	// });




	// >>> VIEW 
	Interface.View = {};

	Interface.View.list = {};

	Interface.View.change = function( id ){
		if( id == 'back') {
			Interface.View.back();
			return true;
		}
		if( Interface.View.list[id] ){
			if(Interface.View.current) Interface.View.current.close.apply(Interface.View.current);
			Interface.View.current = Interface.View.list[id];
			Interface.View.current.open.apply(Interface.View.current);

			window.location = '#nav-'+id;

			return true;
		}
		return false;
	};

	Interface.View.back = function(){
		window.history.back();
	};

	// >>> Notification
	(function(){

		var pending = [];

		var processing = false;

		function process( chain ){
			if( !processing && pending.length > 0 ){
				processing = true;
				var $div = pending.pop();
				$('#notif-bar .relative-layer').append( $div );
				var delay = chain ? 1000 : 0;
				setTimeout( function(){ $div.removeClass('unborn'); }, delay+100);
				setTimeout( function(){ $div.addClass('dying'); processing = false; process( true ); }, delay+2000);
				setTimeout( function(){ $div.remove(); }, delay+3000);
			}
		};

		// methods
		Interface.notify = function( htmlText ){
			pending.push($('<div class="notification unborn fancy-bg dark-red"><p>'+bbpop(htmlText)+'</p></div>'));
			process();
		};

		$(document).ready(function(){
			// $('#main-button').on('click', function(){
			// 	Interface.notify('Minion clicked');
			// 	console.log('User notified');
			// });
			//$('#notif-bar .relative-layer').append( $(bbpop('<div class="notification fancy-bg dark-red"><p>This [m=poro,Poro] is a *notification* **test**.</p></div>')) );
		});

	})();

	Interface.goFullscreen = function(){
		console.log('goFullscreen');
		var elem = document.documentElement;
		if (elem.requestFullscreen) {
		  elem.requestFullscreen();
		} else if (elem.msRequestFullscreen) {
		  elem.msRequestFullscreen();
		} else if (elem.mozRequestFullScreen) {
		  elem.mozRequestFullScreen();
		} else if (elem.webkitRequestFullscreen) {
		  elem.webkitRequestFullscreen();
		}	
	}

	Interface.exitFullscreen = function(){
		if( document.mozCancelFullScreen ) document.mozCancelFullScreen();
		if( document.webkitExitFullscreen ) document.webkitExitFullscreen();
		if( document.msExitFullscreen ) document.msExitFullscreen();
	}

	$(document).ready(function(){

		function f(){
			if (document.webkitIsFullScreen || document.mozFullScreen || document.msFullscreenElement ) {
		        $('#go-fs-button').addClass('display-none');
				$('#exit-fs-button').removeClass('display-none');
		    } else {
				$('#exit-fs-button').addClass('display-none');
				$('#go-fs-button').removeClass('display-none');
		    }
		}
		if (document.addEventListener)
		{
		    document.addEventListener('webkitfullscreenchange', f, false);
		    document.addEventListener('mozfullscreenchange', f, false);
		    document.addEventListener('fullscreenchange', f, false);
		    document.addEventListener('MSFullscreenChange', f, false);
		}
	});


	Interface.interact = function( elt ){
		elt = elt || {};
		try {
			var codes = elt.getAttribute('data-lolipop') || "";
			Interface.internInteraction( codes );
		} catch ( e ){
			console.log( '%c[ACCESS DENIED]', 'color: red; font-size: 150%;','Third parties can only interact with Lolipop through the DOM.');
			console.log( 'debug', elt, e );
		}		
	};

	Interface.internInteraction = function( str, data ){

		str = str || "";

		//console.log('%cUser interaction:', 'color:orange;', str);

		codes = str.split(',');
		codes = codes.map(function( code ){ var tab = code.match(/([a-z-]+)(?::(.*))?/); if(tab && tab[1]) var obj = {cat:tab[1]}; if(tab[2]){ obj.val = tab[2];} return obj; }).filter(function(o){return o?true:false});

		for( var i in codes ){
			var interaction = codes[i];

			switch(interaction.cat){
				case 'view': if(interaction.val) Interface.View.change(interaction.val); break;
				case 'action': 
					if( interaction.val ) Action.do(interaction.val, data); break;
				case 'select-spell':
					if(interaction.val) Spellbook.selectSpell(interaction.val);
					break;
				case 'dev':
					if( interaction.val ){
						var d = Interface.dev[interaction.val];
						if( d ){
							d.f();
						}
					}
					break;
				case 'go-fullscreen':
					Interface.goFullscreen();
					break;
				case 'exit-fullscreen':
					Interface.exitFullscreen();
					break;
			}
		}
	};

	Interface.dev = {
		'delete-save': {
			name: "Delete save",
			f: function(){
				Game.deleteSave();
			}
		},
		'reset-spell-save': {
			name: "Remove spells and reload",
			f: function(){
				Spellbook.unlocked = [];
				Game.save();
				location.reload();
			}
		},
		'sink-bank': {
			name: 'Reset bank',
			f: function(){
				Data.updateVar('game.gold.bank.exact',new BN(0));
			}
		},
		'bank-one-million': {
			name: '+1 Million',
			f: function(){
				Data.updateVar('game.gold.bank.exact', Data.value('game.gold.bank.exact').plus(1000000));
			}
		}
	};

	$(document).ready(function(){

		// http://stackoverflow.com/questions/18211984/how-to-control-back-button-event-in-jquery-mobile
		$(window).on('hashchange', function(event) {
			//console.log('hash changed', event);
			if( '#nav-'+Interface.View.current.id != window.location.hash ){
				//Interface.View.change()
				Interface.View.change(window.location.hash.substring(5));
			}
		});

		Events.addListener('upgrade.unlocked', function(e){
			console.log('>>> EVENT:UNLOCK', e.target);
		});

		Events.addListener('upgrade.bought', function(e){
			console.log('>>> EVENT:UNLOCK', e.target);
		});

	});


	// >> Interface initialization


	Interface.View.list['main-menu'] = {
		removeTimeout: null,
		open: function(){
			clearTimeout(this.removeTimeout);
			$('#main-menu').removeClass('display-none');
			setTimeout( function(){ $('#main-menu').removeClass('hide-left') }, 50);
			$('#global-back-button').addClass('display-none');
		},
		close: function(){
			//console.log('Closing main-menu');
			$('#main-menu').addClass('hide-left');
			$('#global-back-button').removeClass('display-none');
			this.removeTimeout = setTimeout( function(){ $('#main-menu').addClass('display-none')},500);
		}
	};

	Interface.View.list['monster-list'] = {
		$container: $(''),
		open: function(){
			clearTimeout(this.removeTimeout);
			this.removeDiv();
			//console.log('Opening monster-list', this);
			$('#windows-insertion').append($("\
				<div class='scroll horizontal-hide hide-right' style='-webkit-overflow-scrolling: touch;'>\
					<div id='monster-list' class='text-section flex aleft'></div>\
				</div>\
			"));

			var monsters = Data.Pedia.Monsters, $container = this.$container = $('#monster-list');

			$container.append($("<div class='title acenter'>Monsters</div>"))

			var left = true;
			function addMonsterSection(m){
				var monster = monsters[m];

				var $img = $("\
					<div class='w25 acenter section-img round' style='background-image:url(\"img/mobile/monster-"+monster.code+".jpg\");'>\
					</div>");

				
				var $text = $("<div class='w75 vtop "+(left?'aleft':'aright')+"'>\
						<p class='subtitle'>"+monster.SummonMenu.name+"</p>\
						<p class='story'>"+monster.SummonMenu.description+"</p>\
						<p class='info number' style='visibility:hidden;'>_"+bbpop(':poro,Poro:')+"</p>\
					</div>");

				var $qty = $('<span class="quantity gamedata" data-format-function="ultraAbbreviated" data-id="'+monster.vars.baseQuantity+'">'+'ERR'+'</span><span class="extra gamedata" data-format-function="ultraAbbreviatedGT0" data-id="'+monster.vars.extraQuantity+'">'+'ERR'+'</span>');
				var $subtitle = $text.children('.subtitle');
				left ? $subtitle.append($qty) : $subtitle.prepend($qty);

				Data.newMilestoneUse(  Milestone('monster.'+m+'.quantity', new BN(1)), function(){
					$text.find('.info.number').remove();
					$text.append($(bbpop("<p class='info number'>\
							<span class='gamedata' data-format-function='abbreviatedNumber' data-id='"+ monster.vars.baseGps +"' >ERR</span>/s x \
							<span class='gamedata qty' data-format-function='abbreviatedNumber' data-id='"+ monster.vars.quantity +"' >ERR</span> [m="+m+","+monster.SummonMenu.name+"] = \
							<span class='gamedata' data-format-function='abbreviatedNumber' data-id='"+ monster.vars.gps +"' >ERR</span>/s\
						</p>")));

					Lolipop.updateVarUses(monster.vars.quantity);
					Lolipop.updateVarUses(monster.vars.baseGps);
					Lolipop.updateVarUses(monster.vars.gps);
				});
				// metal-border fancy-bg blue-radial
				// metal-border fancy-bg red-radial
				var $buttons = $("\
					<div class='w20 button buy conditional-format' data-condition='"+monster.vars.unaffordable+"' data-format-class='deactivated' onClick='Lolipop.interact(this);' data-lolipop='action:"+monster.vars.actionBuy+"'>\
						<span class='legend'>1</span><span class='gold gamedata' data-format-function='ultraAbbreviated' data-id='"+ monster.vars.price +"'></span>\
					</div>\
					<div class='w20 button buy conditional-format' data-condition='"+monster.vars.unaffordable10+"' data-format-class='deactivated' onClick='Lolipop.interact(this);' data-lolipop='action:"+monster.vars.actionBuy10+"'>\
						<span class='legend'>10</span><span class='gold gamedata' data-format-function='ultraAbbreviated' data-id='"+ monster.vars.price10 +"'></span>\
					</div>\
					<div class='w20 button sell  conditional-format' data-condition='"+monster.vars.unsellable+"' data-format-class='deactivated' onClick='Lolipop.interact(this);' data-lolipop='action:"+monster.vars.actionRefund+"'>\
						<span class='legend'>1</span><span class='gold gamedata' data-format-function='ultraAbbreviated' data-id='"+ monster.vars.refund +"'></span>\
					</div>\
					<div class='w20 button sell  conditional-format' data-condition='"+monster.vars.unsellable+"' data-format-class='deactivated' onClick='Lolipop.interact(this);' data-lolipop='action:"+monster.vars.actionRefundAll+"'>\
						<span class='legend'><small>all</small></span><span class='gold gamedata' data-format-function='ultraAbbreviated' data-id='"+ monster.vars.refundAll +"'></span>\
					</div>\
					");

				var $section = $('<div class="section underlined acenter"></div>');

				if( left ){
					$section.append($img).append($text);
				} else {
					$section.append($text).append($img);
				}

				$section.append($buttons);

				$container.append($section);


				Lolipop.updateVarUses(monster.vars.price);
				Lolipop.updateVarUses(monster.vars.price10);
				Lolipop.updateVarUses(monster.vars.unaffordable);
				Lolipop.updateVarUses(monster.vars.unaffordable10);
				Lolipop.updateVarUses(monster.vars.unsellable);
				Lolipop.updateVarUses(monster.vars.unsellable10);
				Lolipop.updateVarUses(monster.vars.quantity);
				Lolipop.updateVarUses(monster.vars.baseQuantity);
				Lolipop.updateVarUses(monster.vars.extraQuantity);
				Lolipop.updateVarUses(monster.vars.refund);
				Lolipop.updateVarUses(monster.vars.refundAll);
				Lolipop.updateVarUses(monster.vars.baseGps);
				Lolipop.updateVarUses(monster.vars.gps);

				left = !left;

				setTimeout(function(){ $container.parent().removeClass('hide-right')}, 50);
			
			}

			var m0 = null;
			for( var m1 in monsters ){
				if( m0 ){
					(function(){
						var m = m1+'';
						Data.newMilestoneUse(  Milestone('monster.'+m0+'.quantity',1), function(){ addMonsterSection(m)});
					})();
				} else {
					addMonsterSection(m1);
				}
				m0 = m1;
			}
		},
		removeTimeout: null,
		removeDiv: function(){ this.$container.parent().remove(); },
		close: function(){
			this.$container.parent().addClass('hide-right');
			this.removeTimeout = setTimeout( this.removeDiv.bind(this), 700);
		},

		back: 'main-menu'
	};

	String.prototype.hexEncode = function(){
	    var hex, i;

	    var result = "";
	    for (i=0; i<this.length; i++) {
	        hex = this.charCodeAt(i).toString(16);
	        result += ("000"+hex).slice(-4);
	    }

	    return result;
	}

	Interface.View.list['spellbook'] = {
		code: 'spellbook',
		$container: $(''),
		onNewUpgrade: function(){
			$('#reload-fixed').removeClass('display-none');
		},
		onUpgradeBought: function(e){
			console.log('Event:Bought',e.target);
			$('#U'+e.target).addClass('bought').find('.button .gold').text('Used');
		},
		onSpellSelected: function(e){
			var group = e.data;
			$('#SG'+group.id+' .spell-block').removeClass('selected');
			$('#S'+group.id+'\\|'+group.selectedSpell).addClass('selected');
		},
		open: function(){
			clearTimeout(this.removeTimeout);
			this.removeDiv();

			$('#windows-insertion').append($("\
				<div  class='scroll horizontal-hide hide-right' style='-webkit-overflow-scrolling: touch;'>\
				<div id='"+this.code+"' class='text-section window flex'></div>\
				</div>\
			"));
			var $container = this.$container = $('#'+this.code);

			// Interface.Scroll.reset();
			// Interface.Scroll.turnOn(container.parent());

			$container.append($('<div class="title">SPELLBOOK <small>('+Spellbook.unlocked.length+'/'+Spellbook.Pedia.length+')</small></div>'));

			Spellbook.unlocked.map(function( group ){
				var $section = $('\
					<div id="SG'+group.id+'" class="section underlined">\
						<div class="subtitle '+(group.selectedSpell == null ? 'new':'')+'">'+group.name+'</div>\
					</div>');
				group.spells.map(function( spell, i ){
					var token = group.id+'|'+i;
					var $spellblock = $('<div id="S'+token+'" class="'+(group.selectedSpell == i ? 'selected':'')+' aleft no-select spell-block metal-border fancy-bg grey-brown-radial radial-center"\
							data-lolipop="select-spell:'+token+'" onClick="Lolipop.interact(this);">\
							<p class="acenter left0 w90 description">'+bbpop(spell.description)+'</p>\
						</div>');
					$section.append($spellblock);



				});


				$container.append($section);
			});

			$container.append($('\
				<div class="section">\
					<p class="story">Spells yet to be discovered:<br/><strong>'+(Spellbook.Pedia.length - Spellbook.unlocked.length)+'</strong></p>\
				</div>'));

			Events.addListener('spellSelected',this.onSpellSelected);
			
			setTimeout(function(){ $container.parent().removeClass('hide-right')}, 50);

		},
		removeTimeout: null,
		removeDiv: function(){ this.$container.parent().remove(); },
		close: function(){
			Events.removeListener('upgrade.unlocked',this.onNewUpgrade);
			Events.removeListener('upgrade.unlocked',this.onSpellSelected);
			this.$container.parent().addClass('hide-right');
			this.removeTimeout = setTimeout( this.removeDiv.bind(this), 700);
		},

		back: 'main-menu'
	};

	Interface.View.list['dev'] = {
		code: 'dev',
		$container: $(''),
		open: function(){
			clearTimeout(this.removeTimeout);
			this.removeDiv();

			$('#windows-insertion').append($("\
				<div  class='scroll horizontal-hide hide-right' style='-webkit-overflow-scrolling: touch;'>\
				<div id='"+this.code+"' class='text-section window'></div>\
				</div>\
			"));
			var $container = this.$container = $('#'+this.code);

			$container.append($('<div class="title">DEV COMMANDS</div>'));

			var $section = $('<div class="section"></div>');

			for( var key in Interface.dev ){
				$section.append($("<div class='w80 button no-legend sell metal-border fancy-bg red-radial' onClick='Lolipop.interact(this);' data-lolipop='dev:"+key+"'>\
						<span class='gold'>"+Interface.dev[key].name+"</span>\
					</div>"))
			}
			

			$container.append($section);
			
			setTimeout(function(){ $container.parent().removeClass('hide-right')}, 50);

		},
		removeTimeout: null,
		removeDiv: function(){ this.$container.parent().remove(); },
		close: function(){
			this.$container.parent().addClass('hide-right');
			this.removeTimeout = setTimeout( this.removeDiv.bind(this), 700);
		},

		back: 'main-menu'
	};

	(function(){

		function onSpellSelected(e){
			var group = e.data;
			$('#POPUP-SG'+group.id+' .spell-block').removeClass('selected');
			$('#POPUP-S'+group.id+'\\|'+group.selectedSpell).addClass('selected');
			$('#POPUP-SGOK'+group.id+' span').text('OK');
		}
		function launchPopup(e){
			var $popup = Interface.popup();

			var group = e.data;

			$popup.append($('<br/><div class="title">[ NEW SPELL DISCOVERED ]</div><br/>'));

			var $section = $('\
				<div id="POPUP-SG'+group.id+'" class="section underlined">\
					<div class="subtitle '+(group.selectedSpell == null ? 'new':'')+'">'+group.name+'</div>\
				</div>');

			group.spells.map(function( spell, i ){
				var token = group.id+'|'+i;
				var $spellblock = $('<div id="POPUP-S'+token+'" class="'+(group.selectedSpell == i ? 'selected':'')+' aleft no-select spell-block metal-border fancy-bg grey-brown-radial radial-center"\
						data-lolipop="select-spell:'+token+'" onClick="Lolipop.interact(this);">\
						<p class="acenter left0 w90 description">'+bbpop(spell.description)+'</p>\
					</div>');
				$section.append($spellblock);
			});


			$popup.append($section);

			$popup.append($('<div class="section">\
					<div id="POPUP-SGOK'+group.id+'" class="w30 button large no-legend"><span class"gold">Dismiss</span></div>\
				</div>'))

			Events.addListener('spellSelected',onSpellSelected);

			$('#POPUP-SGOK'+group.id).click(function(){
				Events.removeListener('spellSelected', onSpellSelected);
				$popup.lolipopHide();
				$popup.lolipopClose();

				queue.shift();
				if( queue.length > 0 ) launchPopup( queue[0] );
			});
		}
		var queue = [];
		Events.addListener('spellGroupUnlocked', function( e ){
			if( queue.length > 0 ){
				queue.push(e);
			} else {
				queue.push(e);
				launchPopup(e);
			}
		});

	})();

	for( var str in Interface.View.list ) Interface.View.list[str].id = str;

	Interface.View.change('main-menu');

	//////////////////////////////////////////////////////////////////////////////////////////////
	//                                    SPELLBOOK
	//                   		      Upgrades and Magick
	//////////////////////////////////////////////////////////////////////////////////////////////

	var Spellbook = {};

	(function(){

		var all_groups = {}, all_spells = {}, all_buffs = {};
		var groupsById = {};
		
		Spellbook.Pedia = [
			// Fierce & Fluffy
			{
				id: 'AAA',
				order: 100,
				name: 'Fierce & Fluffy',
				unlockedBy: {
					'monster.poro.quantity': new BN(10),
					'monster.wolf.quantity': new BN(5)
				},
				spells: [
					{
						description: ":poro,Poros: gain *+8%* production for each :poro,Poro: and :wolf,Wolf: you own.",
						buffs: [
							{
								type: BUFF_TYPE.MULTIPLICATIVE,
								value: "1+(monster.wolf.quantity+monster.poro.quantity)*0.08",
								targets: ['constant.monster.poro.gps']
								// level: 0
							}
						]
					},
					{
						description: ":wolf,Wolfes: gain *+3%* production for each :wolf,Wolf: and :poro,Poro: you own.",
						buffs: [
							{
								type: BUFF_TYPE.MULTIPLICATIVE,
								value: "1+(monster.poro.quantity+monster.wolf.quantity)*0.03",
								targets: ['constant.monster.wolf.gps']
							}
						]
					}
				]
			},
			// Consistent Farming 
			{
				id: 'AAB',
				order: 10,
				name: 'Consistent Farming',
				unlockedBy: {
					'statistics.mick.clicksThisGame': new BN(50)
				},
				spells: [
					{
						description: "Smashing :minion: raises your smashing power by *1* for *5s*.\n___This effect stacks up to *60%* of the number of monsters you own.___",
						buffs: [
							{
								type: BUFF_TYPE.ADDITIVE,
								value: 0,
								targets: ['game.gold.gpc'],
								// level: 0
								timeout: null,
								onMinionSmashed: function( e ){
									var buff = e.listenerData;
									var b = B(buff.jsObject);
									b.value(BN.min( b.value().plus(1), Data.value('monster.quantity').times(0.6).floor())).updateTargets().freeHandler();
									clearTimeout(buff.t);
									buff.t = setTimeout(function(){
										b.value( new BN(0) ).updateTargets().freeHandler();
									},5000);
								},
								set: function(){
									Events.addListener('minionSmashed', this.onMinionSmashed, this);
								},
								unset: function(){
									Events.removeListener('minionSmashed', this.onMinionSmashed);
									clearTimeout(this.timeout);
									B(this.jsObject).value(0).updateTargets().freeHandler();
								}
							}
						]
					},
					{
						description: "Your smashing power is increased by *25%* of the amount of monsters you own.",
						buffs: [
							{
								type: BUFF_TYPE.ADDITIVE,
								value: "((monster.quantity)*0.25).FLOOR",
								targets: ['game.gold.gpc']
							}
						]
					}
				]
			},
			// Porocrastinators
			{
				id: 'AAC',
				order: 200,
				name: 'Porocrastinators',
				unlockedBy: {
					'monster.poro.quantity.base': new BN(25)
				},
				spells: [
					{
						description: "You gain *+30%* extra :poro,Poros:.",
						buffs: [
							{
								type: BUFF_TYPE.ADDITIVE,
								value: "((monster.poro.quantity.base)*0.3).FLOOR",
								targets: ['monster.poro.quantity.extra']
								// level: 0
							}
						]
					},
					{
						description: ":poro,Poros: production is *doubled*.",
						buffs: [
							{
								type: BUFF_TYPE.MULTIPLICATIVE,
								value: 2,
								targets: ['constant.monster.poro.gps']
							}
						]
					}
				]
			},
			// Porodigies
			{
				id: 'AAD',
				order: 205,
				name: 'Porodigies',
				unlockedBy: {
					'monster.poro.quantity.base': new BN(50)
				},
				spells: [
					{
						description: "You gain *+40%* extra :poro,Poros:.",
						buffs: [
							{
								type: BUFF_TYPE.ADDITIVE,
								value: "((monster.poro.quantity.base)*0.4).FLOOR",
								targets: ['monster.poro.quantity.extra']
								// level: 0
							}
						]
					},
					{
						description: ":poro,Poros: production is *doubled*.",
						buffs: [
							{
								type: BUFF_TYPE.MULTIPLICATIVE,
								value: 2,
								targets: ['constant.monster.poro.gps']
							}
						]
					}
				]
			}
		];

		Spellbook.Pedia.map(function( g ){
			g.unlocked = false; g.unlockedDate = null; g.selectedSpell = null;
			groupsById[g.id] = g;
		});


		Spellbook.unlocked = [];

		Spellbook.unselectedGroup = 0;

		function sortUnlocked(){
			Spellbook.unlocked.sort(function(a,b){ return a.order - b.order; });
		};

		function unlockSpellGroup( group, isLoad ){

			group.unlockedDate = Date.now();
			group.unlocked = true;
			Spellbook.unlocked.push(group);
			sortUnlocked();

			Spellbook.unselectedGroup++;

			if( !isLoad ){
				console.log('%cNew spellbook entry !','color:#F319FF;',group.name);
				Events.dispatch('spellGroupUnlocked',group.id, group);
				// Interface.notify('New spell: *'+group.name+'*');
				// Interface.popup
			} else {
				group.unlockCallbacks.map(function( c ){ Data.removeVarUse(c); });
				delete group.unlockCallbacks;
				delete group.unlockCallback;

				console.log('%cSpellbook entry loaded !','color:#F319FF;',group.name);

			}
			
		};

		function Initialize_spells(){
			Spellbook.Pedia.map(function( group ){

				if( !group.unlocked ){
					group.milestonesLeftToReach = Object.keys(group.unlockedBy).length;

					group.unlockCallback =  function( v ){
						var l = --group.milestonesLeftToReach;
						if( l == 0 ){
							unlockSpellGroup(group);
							delete group.unlockCallbacks;
							delete group.unlockCallback;
						}
					};

					group.unlockCallbacks = [];

					for( var key in group.unlockedBy ){
						var res = Data.newMilestoneUse( Milestone(key, group.unlockedBy[key]), group.unlockCallback);
						if( res ) group.unlockCallbacks.push(res);
					}
				}

				

				group.spells.map( function( spell ){
					spell.buffs.map( function( buff ){
						var b = B();
						if( buff.type ) b.type(buff.type);
						if( buff.level ) b.level(buff.level);
						if( buff.value ) b.value(buff.value);
						if( buff.targets ) b.addTargets(buff.targets);
						b.disable();
						buff.jsObject = b.data;

						if( buff.init ) buff.init.apply(buff);
					});
				});
			});
		}

		function selectSpell(group, spell_index){
			if( group && typeof spell_index === 'number' && spell_index < group.spells.length && group.unlocked ){
				if( group.selectedSpell == null ) {
					Spellbook.unselectedGroup = Math.max( Spellbook.unselectedGroup-1, 0);
				} else {
					group.spells[group.selectedSpell].buffs.map(function( buff ){ if(buff.unset){buff.unset();} B(buff.jsObject).disable().updateTargets().freeHandler();})
				}
				group.selectedSpell = spell_index;

				group.spells[group.selectedSpell].buffs.map(function( buff ){ if(buff.set){buff.set();} B(buff.jsObject).enable().updateTargets().freeHandler();})

				Events.dispatch('spellSelected',group.id,group);
				console.log('%cSpell selected !','color: #2B9CE8;',bbpop_light(group.spells[spell_index].description));
			}
		};

		Spellbook.selectSpell = function( str ){
			var res = str.match(/(\w+)\|(\d+)/);
			var group = groupsById[res[1]] || null, spell_index = parseInt(res[2]);
			selectSpell(group, spell_index);
		}

		Spellbook.save = function(){
			var save = {};

			save = Spellbook.unlocked.map(function(g){
				return g.id + ( typeof g.selectedSpell === 'number' ? g.selectedSpell : '');
			}).join('|');

			console.log('%cSPELLBOOK','color:yellow; background:grey;',save);
			return save;
		};

		Spellbook.load = function( str ){

			var ok = true;

			if( str ){
				str.split('|').map(function( o ){
					var res = o.match(/([A-Z]{3})(\d*)/);
					var id = res[1] + "", spell = res[2] + '' || null;
					if( id ){
						var g = groupsById[id];
						if( g ){
							unlockSpellGroup(g, true);
							if( spell ){
								spell = parseInt(spell) || 0;
								selectSpell(g,spell);
							}
						} else {
							console.log('%cERROR','color:red;',"Spell ID doesn't exist");
							ok = false;
						}
					} else {
						console.log('%cERROR','color:red;','Spell -> Wrong save format',o);
						ok = false;
					}
				});
			}
			return ok;
		};

		Initialize_spells();

	})();

	//////////////////////////////////////////////////////////////////////////////////////////////
	//                                   INITIALIZATION
	//                   		      Where all is set up
	//////////////////////////////////////////////////////////////////////////////////////////////

	// START:: UTILS DECLARATIONS

	var ifOnDialogue = function( str, f ){
		if( Dialogue.all[str] && Dialogue.all[str].past ){
			setTimeout(f,0);
		} else {
			Events.addListener('endOfDialogue', str, f);
		}
	}

	var ifOnEnabledFeature = function( str, f ){
		if( Features.enabled(str) ){
			setTimeout(f,0);
		} else {
			Events.addListener('featureEnabled', str, f);
		}
	};

	var ifOnFeaturesLoaded = function( f ){
		console.log('registering event listeners');
		if( Features.loaded ){
			f();
		} else {
			Events.addListener('featuresLoaded', f);
		}
	};

	var addInteractOnclick = function( $elt ){
		$elt.attr('onClick','Lolipop.interact(this);');
	};

	// END:: UTILS DECLARATIONS

	////////////////////////>>>

	// START:: LOCKS / UNLOCKS

	Events.addListener('dialoguesReady', function(){
		if(!Features.unlocked('minion') ) ifOnDialogue('tuto000', function(){
			Features.unlock('minion');
			Features.enable('minion');
			return Events.REMOVE_LISTENER; // Don't needed for resets
		});

		if(!Features.unlocked('spellbook') ) ifOnDialogue('tuto002', function(){
			Features.unlock('spellbook');
			Features.enable('spellbook');
			return Events.REMOVE_LISTENER; // Don't needed for resets
		});

		if(!Features.unlocked('monsters') ) Data.newMilestoneUse( Milestone('statistics.gold.earned.allTime', 10), function(){
			Features.unlock('monsters');
			Features.enable('monsters');
			Dialogue.start('tuto001');
		});

		return Events.REMOVE_LISTENER;
	});

	if( !Features.unlocked('champions') ) Events.addListener('surrender', function(){
		Features.unlock('champions');
		Features.enable('champions');
		Features.unlock('rank');
		Features.enable('rank');
		return Events.REMOVE_LISTENER;
	});

	if( !Features.unlocked('surrender') ) Data.newMilestoneUse(Milestone('rank.potential',1), function( v ){
		Features.unlock('surrender');
		Features.enable('surrender');
	});

	// END:: LOCKS / UNLOCKS

	////////////////////////>>>

	(function INITIALIZATION(){

		BigNumber.config({ EXPONENTIAL_AT: 100 });

		// REVEALS
		Data.newOneTimeUse(Milestone('game.gold.bank',5),function(){
			$('#main-menu > div[data-cat="monsters"]').removeClass('display-none');
		});
		Data.newOneTimeUse(Milestone('game.gold.bank',10),function(){
			$('#monster-menu-poro').removeClass('display-none');
		});

		Data.newOneTimeUse(Milestone('statistics.upgrade.discovered',1), function(){

			console.log('REACHED');
			$('#enchants-section').removeClass('display-none');
		});

		Data.Pedia.MonsterIDs.map(function( m, i, t){
			if( i != t.length ){
				Data.newOneTimeUse( Milestone('monster.'+m+'.quantity',1), function(){
					$('#monster-menu-'+t[i+1]).removeClass('display-none');
				});
			}
		});

		

	})();


	// AESTHETIC - JQUERY

	//ifOnFeaturesLoaded( function(){
		['monsters','spellbook','champions','surrender','rank','achievements','statistics','options','help','about'].map(function( str ){

			ifOnEnabledFeature(str, function(){
				var $div = $('#main-menu-'+str);
				$div.removeClass('disabled');
				$div.attr('data-lolipop', $div.attr('data-lolipop-manual'));
				addInteractOnclick($div);

				return Events.REMOVE_LISTENER;
			});

			if( !Features.unlocked(str) ) Events.addListener('featureUnlockedFirstTime', str, function(){
				console.log('first time');
				var $div = $('#main-menu-'+str);
				$div.addClass('new');
				var f = function(){
					$div.removeClass('new');
					$div.off('click', f);
				}
				$div.on('click', f);
				return Events.REMOVE_LISTENER;
			});

		});	
	// 	return Events.REMOVE_LISTENER;
	// });
	//console.log('Features', Features.all);

	function _msToMinutes( ms ){
		var m = Math.floor(ms/60000),
			s = Math.floor((ms%60000)/1000);

		return (m<10?'0':'')+m+':'+(s<10?'0':'')+s;
	}

	Events.addListener('surrender', function(){
		$('#main-menu-surrender').addClass('disabled');

		$div = $('#main-menu-surrender .overlay.timer');
		$div.removeClass('display-none');

		$span = $div.children('span');

		var target = Date.now()+SURRENDER_MS;

		function _refresh(){
			var d = target-Date.now();
			if( d > 0 ){
				var str = _msToMinutes(d);
				if( $span.text() !== str) $span.text(str);
				setTimeout(_refresh, 200);
			} else {
				$div.addClass('display-none');
				$('#main-menu-surrender').removeClass('disabled');
			}
		}

		_refresh();

	});

	Events.addListener('featureEnabled', function( e ){
		switch( e.target ){
			case 'minion':
				$('.minion-holder').removeClass('disabled');
				break;
		}

	});


	$(document).ready(function(){

		function _displayRankPercentage( value ){
			var p = (value  || new BN(0)).times(100).toNumber();

			//console.log('new %', p);

			$('#new-exp').css('width', p+'%');
		}
		Data.newVarUse('rank.percentage', function( o ){ _displayRankPercentage(o.value) });
		_displayRankPercentage(Data.value('rank.percentage'));

		function _displayPotentialRank(){
			var d = (Data.value('rank.potential') || new BN(0)).minus(Data.value('rank.current') || new BN(0));
			if( d.gt(0) ){
				$('#potential-bonus-rank').removeClass('display-none')
										  .text('+'+d.toNumber());
			} else {
				$('#potential-bonus-rank').addClass('display-none');
			}
			//console.log('%cPIWIT',"background: black; color: yellow;", d.toString());
		}
		Data.newVarUse('rank.current', _displayPotentialRank);
		Data.newVarUse('rank.potential', _displayPotentialRank);

		Events.addListener('filesLoaded', function(){
			$('#main-menu .bg').each(function(){
				$(this).attr('style',$(this).attr('data-style'));
			});
			return Events.REMOVE_LISTENER;
		});


		$('[data-lolipop][data-lolipop!=""]').each(function(){
			addInteractOnclick($(this));
		});
		$('[data-lolipop][data-lolipop!=""]').arrive(function(){
			addInteractOnclick($(this));
		});

		// >> Feedback

		function _addExpParticles(){
			for( var i = 0; i < 30; ++i){
				var x = Math.random()*100, y = Math.random()*100;
				var dur = 2*Math.random()+3.5;
				$('#new-exp').append($('<div class="particle" style="left:'+x+'%; top:'+y+'%; animation-duration:'+dur+'s;"></div>'));
			}
		}

		function _removeExpParticles(){
			$('#new-exp .particle').remove();
		}
		
		// for( var i = 0; i < 10; ++i){
		// 	var left = 11*(i-1);
		// 	console.log(i);
		// 	$('#new-exp').append($('<div class="star bottom" style="left: '+(left+4.5)+'vmin;"></div>'));
		// 	$('#new-exp').append($('<div class="star top" style="left: '+left+'vmin;"></div>'));
		// }
		

		function raiseVisualMoney( x, y, w2 ){
			// todo: some of the numbers don't appear when using S/K

			var str = Data.Formatting.Functions.abbreviatedNumber(Data.value('game.gold.gpc'));
			var w = w2 ? w2 : parseInt($('body').css('width')), deviation = (Math.random() - 0.5)/4;

			//console.log('deviation',deviation, w, w*deviation, x + w*deviation);

			var $div = $('<div class="fixed fading gold">+'+str+'</div>')
					.css({ left: x + w*deviation, top: y});


			$('#efx').append($div);


			setTimeout(function(){
				$div.addClass('up');
				$div.css('opacity',0);
			}, 50);
			// NB: sometimes numbers didn't appear.
			// It's the animation directly going to last frame.
			// Was kinda prevented by increasing the timeout delay

			setTimeout(function(){
				$div.remove();
			}, 1000);

		};

		Events.addListener('minionSmashed', function( e ){
			//console.log('smatched', e);
			raiseVisualMoney( e.data.x, e.data.y, e.data.w2 );
		});

		var rotate = true;
		$('#save-item').click(function(){
			$(this).children('.rotation').css('transform', 'rotateY('+(rotate? 180 : 0)+'deg)');
			rotate = !rotate;
		});

		// >> Feedback : notifications

		Events.addListener('upgrade.unlocked', function( e ){
			try {
				Interface.notify('Spell discovered: *'+e.data.shop.name+'*');
			} catch( e ){
				Interface.notify('Spell discovered');
			}
		});

		// >> Click on Mick

		$('#main-button, #left-main-button, #right-main-button').on('touchstart', function( e ){
			//$(this).trigger('click',{pageX:touches.pageX, pageY: touches.pageY});
			$(this).addClass('active');

			var touches = e.originalEvent.touches[e.originalEvent.touches.length -1];

			Interface.internInteraction('action:action.click.mick', {x:touches.pageX, y:touches.pageY});
			// if( Action.do('action.click.mick', {x:touches.pageX, y:touches.pageY}) ){
			// 	//raiseVisualMoney(touches.pageX, touches.pageY);
			// }

		}).on('touchend',function( e ){
			e.preventDefault();
			$(this).removeClass('active');
		});
		
		$('#main-button, #left-main-button, #right-main-button').on('click', function(e){
			Interface.internInteraction('action:action.click.mick', {x:e.pageX, y:e.pageY});
		});

		$(window).keyup(function(e){
			if( e.keyCode === 83 || e.keyCode === 75 ){
				var w = parseInt($(window).width()),
					h = parseInt($(window).height());
				var x,y,w2;
				if( w >= h ){
					if( e.keyCode === 83 ){
						// left
						x = w*0.1; y = h/2.1; w2 = w*0.2;
					} else {
						x = w*0.9; y = h/2.1; w2 = w*0.2;
					}
				} else {
					x = w*0.5; y = h - 0.25*w;
				}
				Interface.internInteraction('action:action.click.mick', {x:x, y:y, w2:w2});
			}
		});

		// Scrollbar
		//var is_mobile = ((/Mobile|iPhone|iPod|BlackBerry|Windows Phone/i).test(navigator.userAgent || navigator.vendor || window.opera) ? true : false);

		if ( !is_mobile ) {
			var ps_opt = { suppressScrollX: true };
			$('#main-menu').parent().perfectScrollbar(ps_opt);
			$('#main-container').arrive('.scroll', function( e ){
				$(this).perfectScrollbar(ps_opt);
			});

			$('body').addClass('desktop');

			_addExpParticles();
			
			Time.setInterval(32);

		} else {

			$('.star1, .star2').addClass('no-animation');

			$('body').addClass('mobile');
			// var s = document.createElement("script");
			// s.type = "text/javascript";
			// s.src = "http://jsconsole.com/remote.js?09F15DA4-3199-49A0-916D-BF802FDAB1BB";
			// document.head.appendChild(s);

			Time.setInterval(500);

		}

		Time.start();

	});

	
	Events.addListener('filesLoaded', function(){
		$('#loading-screen').remove();
		return Events.REMOVE_LISTENER;
	});

	Loader.end();

	if( ! Loliprivate.load() ) Data.Load(Data.NewGameLoader);
	//Data.updateVar('milestone.game.gold.bank.0');
	// TIME

})();

$("#mick").on('click',function(){
	Lolipop.action('action.click.mick');
});

$(document).ready(function(){
	//$(document).click(function(e){console.log(e.target.toString())});
	Lolipop.updateDOMActions();
	Lolipop.updateVarUses(); // useless ! but buggy as hell !!!
});


/// --- TODO

/// --- IDEAS
/*
	
	001)
	
	Use a long touch on Mick to access a Summary and/or Quick Buy window.
	To allow one hand manipulation:
	hold --> open window --> navigate --> tap mick --> back to view.

	views: /s, buyables...

	002)

	On upgrade unlocked, the first time it's buyable, prompt a message asking if player wants to buy it ?

*/


} catch (e){
	alert(e+'   '+(new Error).lineNumber);
}