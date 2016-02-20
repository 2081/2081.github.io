var Lolipop = {};
console.assert = console.assert || function(){};

(function(){

	var Loliprivate = {};

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
	
	/*var GameData = {

		Monsters: {
			Poro: {
				b_initialPrice: new BigNumber(15),
				quantity: 0
			}
		}
	};*/

	/// DATAS AND ACCESS
	/// DATA MANAGEMENT

	// Data.xxxx  --> handlers / operations
	// Data.Stone --> frozen data / constants
	// Data.Game  --> all the game variables, accessible via unique (not random) ID
	// Data.Pedia --> Interface oriented data
	//------------------------------

	var Data = {};

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
		v.updateFunc = updateFunc ? function(){	if( updateFunc.apply(v, arguments) ) {	Data.updateVarUses(id);	return true; } } : function(){console.log(v.id,updateFunc,"CALLED_INEXISTANT_UPDATE_FUNCTION")};

		if( id == 'statistics.upgrade.discovered') console.log(id,value,invalidators,updateFunc,v.updateFunc, requires);

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
		return Data.registerVar( id, null, invalidators, function( inv ){ this.value = inv.value; if(debug){console.log('relay', id, inv.id, inv.value.toString())} return true;}, null);
	}

	Data.registerFloorRelayVar = function( id, invalidators ){
		return Data.registerVar( id, null, invalidators, function( inv ){ var n = inv.value.floor(); if( !this.value.eq(n) ){ this.value = n;return true;} return false;}, null);
	}

	//
	Data.registerConditionalRelayVar = function(id, invalidators, inputs, condition){
		return Data.registerVar( id, null, invalidators, function( i ){ var that = this; if( condition.apply(this,inputs.map(function(o){ return that[o].value}))){ this.value = i.value; return true;} }, inputs);
	}
	//
	Data.registerConditionalRootVar = function(id, inputs, condition){
		return Data.registerVar( id, null, null, function( ){ var that = this; return condition.apply(this,inputs.map(function(o){ return that[o].value}))}, inputs);
	}

	// value is true if A < B
	Data.registerLTVar = function(id, A, B){
		return Data.registerVar(id, false, [A,B], function(){ var bool = this[A].value.lt(this[B].value); if( (this.value && !bool) || (!this.value && bool) ){ this.value = bool; return true;} return false;}, [A,B]);
	}

	// value is true if A >= B
	Data.registerGTEVar = function(id, A, B){
		return Data.registerVar(id, false, [A,B], function(){ var bool = this[A].value.gte(this[B].value); if( (this.value && !bool) || (!this.value && bool) ){ this.value = bool; return true;} return false;}, [A,B]);
	}

	// a constant is a root variable whose update function never changes the value
	Data.registerConstant = function( id, value ){
		return Data.registerVar( id, value, null, function(){ return false;}, null);
	};

	Data.registerSumVar = function( id, invalidators ){
		return Data.registerVar( id, null, invalidators, function(){ this.value = new BN(0); for( var i in this.invalidators ){ this.value = this.value.plus(this[this.invalidators[i]].value)} return true;}, invalidators);
	};

	Data.registerProductVar = function( id, invalidators, requirements ){
		requirements = requirements ? requirements.concat(invalidators) : invalidators;
		return Data.registerVar( id, null, invalidators, function(){ this.value = new BN(1); for( var i in this.requires ){ this.value = this.value.times(this[this.requires[i]].value)} return true;}, requirements);
	};

	Data.registerAddVar = function( id, invalidator, number ){
		return Data.registerVar( id, null, [invalidator], function( i ){ this.value = i.value.plus(number); return true }, null);
	};

	// Sets off once all the inputs are true
	Data.registerFlipFlopTrigger = function( id, inputs, triggerFunc ){
		return Data.registerVar( id, null, inputs, function( i ){ var bool = true; for( var i in inputs ){ bool = bool || this[inputs[i]].value;} if( bool ){ triggerFunc.apply(this); return true;}}, inputs);
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
		return Data.registerVar( id, new BN(0), invalidators, function(){ console.log("UPDATING",id); this.value = this.value.plus(1); return true;});
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
			if( (v.isRoot && v.updateFunc(value)) || !v.isRoot && ( !v.updateFunc || !invalidator || (invalidator && v.updateFunc( invalidator ))) ){
				if( debug ) console.log( "UPDATED", v.id, v, v.invalidates);
				var invalidates = v.invalidates.slice(); // Some variables end up being deleted after an update
				for( var i in invalidates ){
					Data.updateVar(invalidates[i], undefined, v, debug); // updates dependent variables
				}
			}
		}
	};

	Data.varUses = {};
	Data.newVarUse = function( id, callback ){
		var tab = Data.varUses[id] || ( Data.varUses[id] = []);
		tab.push(callback);
	};

	Data.newOneTimeUse = function( id, callback ){

		var f;
		f = function( v ){
			callback(v);
			Data.varUses[id] = Data.varUses[id].filter(function(o){ return o != f});
		};

		Data.newVarUse(id, f);
	};

	//TODO: remove var use

	// Update all the DOM objects containing the variable matching id
	// Those dom object have the class 'gamedata' and the attribute 'data-id' equal to id
	// in case of failure, fills with intelligible data
	Data.updateVarUses = function( id ){
		var v = Data.Variables.Index[id] || {};
		//console.log('updating uses for',id )
		var tab = Data.varUses[id] || [];
		tab.map( function( f ){ f(v); });

		//$(".gamedata[data-id='"+id+"']").text( (v.format ? v.format() : null) || id || "ERR_INVALID_DATA");
		$(".gamedata[data-id='"+id+"']").each( function(){
			var formatFunc = Data.Formatting.Functions[$(this).attr('data-format-function')] || Data.Formatting.Functions.default;
			//console.log("updating use :", formatFunc(v.value) );
			$(this).html( formatFunc(v.value) );
		});

		$(".conditional-format[data-condition='"+id+"']").each( function(){
			$(this).toggleClass($(this).attr('data-format-class'), v.value );
		});//(v.format ? v.format() : null) || id || "ERR_INVALID_DATA");
	};

	/// FORMATTING

	BigNumber.config({ DECIMAL_PLACES: 3 });

	Data.Formatting = {};
	Data.Formatting.Functions = {};

	Data.Formatting.Functions.raw = function( o ){ return o; };

	Data.Formatting.Functions.toString = function(a){ return a? a.toString() : "ERR_TOSTRING"; };

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

	Data.Formatting.UAPowers = ['','k','M','T','Qa','Qi','Sx','Sp','Oc','No','De'];
	Data.Formatting.Functions.ultraAbbreviated = function( bn ){
		var exp = Math.floor(bn.e/3);
		return bn.dividedBy("1e"+(6+exp*3)).toFixed(3).toString()+Data.Formatting.UAPowers[exp] || "e"+(exp*3);
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
		for( var id in loader ){
			//console.log('Loading',id, loader[id].toString ? loader[id].toString() : loader[id]);
			Data.updateVar( id, loader[id] );
			if( Data.Variables.Index[id] ) assert(Data.Variables.Index[id].value === loader[id], "Failed to load",id);
		}
	};


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

								console.log('Milestone reached !',mileId,Data.Variables.Index[mileId]); // debug
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

	// UPGRADES

	var Upgrade = {};

	Upgrade.upgradedVars = {};

	// [xxx] --> [var:var.id] -->[yyy]
	// [xxx] --> [product:var.id] --> [sum:var.id_flat] --> [var:var.id_raw] --> [yyy]

	Upgrade.makeUpgraded = function( targetVar, bool ){
		console.log("Making Upgrade", targetVar);
		var uv = Upgrade.upgradedVars[targetVar] = {};

		uv.raw = Data.Variables.Index[targetVar];
		uv.raw.id = targetVar+'_raw';
		Data.Variables.Index[uv.raw.id] = uv.raw;

		var invalidatesTab = uv.raw.invalidates.slice(),
			requiredBy = uv.raw.requiredBy.slice();
		invalidatesTab.map(function( v ){ Data.Variables.removeInvalidator(v, targetVar); });
		requiredBy.map(function( v ){ Data.Variables.removeRequirement(v, targetVar); });



		delete Data.Variables.Index[targetVar];

		uv.flat = Data.registerSumVar( targetVar+'_flat', [uv.raw.id], bool);

		uv.mult = Data.registerProductVar( targetVar, [uv.flat.id]);

		invalidatesTab.map(function( v ){ Data.Variables.addInvalidator(v, targetVar); });
		requiredBy.map(function( v ){ Data.Variables.addRequirement(v, targetVar); });

		Data.updateVar( uv.flat.id, undefined, uv.raw.id );

		return uv;
	}

	Upgrade.getUpgraded = function( targetVar, bool ){
		return Upgrade.upgradedVars[targetVar] || Upgrade.makeUpgraded(targetVar, bool);
	}

	Upgrade.list = {};

	// UPGRADES:
	// 	Specifier:
	// 		- targets : ['id1','id2']	<: Variables to modify
	// 		- flatFixed : BigNumber		<: Fixed in time flat bonus
	// 		- multFixed : BigNumber		<: Fixed in time mult bonus
	// 		- flatVar	: 'id'			<: id of the variable containing the value
	// 		- multVar	: 'id'			<: cf above

	Upgrade.Pedia = {};

	Upgrade.setUpUnlockFunc = function(){ console.log('Unlock.this',this); Upgrade.setUpBuy(this.uID)};

	Upgrade.setUpUnlock = function( uID ){
		console.log("SETUP unlock",uID);
		var uEntry = Upgrade.Pedia[uID],
			unlocksLeft = [];

		if( false && unlocksLeft.length == 0 ){
			console.log("SKIP UNLOCK PROCESS",uID);
			Upgrade.setUpBuy(uID);
		} else {
			/// The Milestone sets off in between...
			Data.registerFlipFlopTrigger( 'upgrade.'+uID+'.unlock', uEntry.unlockedBy, Upgrade.setUpUnlockFunc ).uID = uID;
			console.log("UPGRADE REGISTERED",uID,Data.Variables.Index[uEntry.unlockedBy],unlocksLeft);
		}
		console.log("SETUP END", uID, Data.Variables.Index[uEntry.unlockedBy]);
		for( var i in uEntry.unlockedBy ){ // Looking for the milestones still at false
			var id = uEntry.unlockedBy[i];
			//console.log(uID,id,Data.value(id));
			if( Data.value(id) !== true ) unlocksLeft.push( Data.value(id) );
		}
		console.log(unlocksLeft); // :(:(:(:(:(:(:(
	}

	Upgrade.setUpBuyFunc = function(){ console.log('Buy.this',this); Upgrade.setUpValue(this.uID)};

	Upgrade.setUpBuy = function( uID ){

		console.log("SETUP buy",uID);

		Data.updateVar('statistics.upgrade.discovered',undefined," ");
	
		Data.unregisterVar( 'upgrade.'+uID+'.unlock');

		var uEntry = Upgrade.Pedia[uID];

		Data.registerConstant('upgrade.'+uID+'.basePrice', uEntry.shop.price );

		Data.registerProductVar('upgrade.'+uID+'.price',['upgrade.'+uID+'.basePrice']); // todo: global/special upgrade price modifier

		Data.registerConditionalRootVar('action.upgrade.buy.'+uID, ['upgrade.'+uID+'.price','game.gold.bank'], function(price,bank){ if(bank.gte(price)){ this.value = price; return true;} });
	
		Data.Variables.addInvalidator(Data.Variables.Index['action.buy.upgrade'],'action.upgrade.buy.'+uID);

		Data.registerFlipFlopTrigger( 'upgrade.'+uID+'.buy', ['action.upgrade.buy.'+uID ], Upgrade.setUpBuyFunc ).uID = uID;

		Data.registerGTEVar('upgrade.'+uID+'.affordable','game.gold.bank','upgrade.'+uID+'.price');

		Data.updateVar('upgrade.'+uID+'.price',undefined,'upgrade.'+uID+'.basePrice');

		Upgrade.dispatchUnlocked( uID, uEntry );
	}

	Upgrade.setUpValue = function( uID ){

		Data.updateVar('statistics.upgrade.bought',undefined," ");

		Data.unregisterVar( 'upgrade.'+uID+'.basePrice');
		Data.unregisterVar( 'upgrade.'+uID+'.price');
		Data.unregisterVar( 'action.upgrade.buy.'+uID);
		Data.unregisterVar( 'upgrade.'+uID+'.buy');
		Data.unregisterVar( 'upgrade.'+uID+'.affordable');

		var uEntry = Upgrade.Pedia[uID];

		var uvs = uEntry.targets.map( function(t){
			var uv = Upgrade.getUpgraded(t, true);
			console.log('getupgrade',uEntry.op);
			switch( uEntry.op ){
				case '+': return uv.flat;
				case '*': return uv.mult;
			}
		});

		var valueID = typeof uEntry.value == 'string' ?
			uEntry.value
			: Data.registerConstant('upgrade.'+uID+'.value', uEntry.value ).id;

		console.log("uvs",uvs);
		for( var i in uvs ){
			var uv = uvs[i];
			Data.Variables.addInvalidator(uv, valueID);
			console.log("uv", uv, valueID);
			Data.Variables.addRequirement(uv, valueID);

			Data.updateVar(uv, undefined, valueID);
		}

		Upgrade.dispatchBought( uID, uEntry );
	}

	Upgrade.unlockedCallbacks = [];
	Upgrade.boughtCallbacks = [];

	Upgrade.dispatchUnlocked = function( id, uEntry ){ Upgrade.unlockedCallbacks.map( function( f ){ f.call(null,id,uEntry)}) };
	Upgrade.dispatchBought = function( id, uEntry){ Upgrade.boughtCallbacks.map( function( f ){ f.call(null,id,uEntry)}) };

	Upgrade.onUnlocked = function( f ){ Upgrade.unlockedCallbacks.push(f) };
	Upgrade.onBought = function( f ){ Upgrade.boughtCallbacks.push(f) };

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
		}

		Time.start = function(){
			timer =  setInterval(function(){ Data.updateVar("action.time.elapsed") }, interval);
			//timer =  setInterval(function(){ Data.updateVar("action.time.update", (new BN(Date.now())).div(new BN(1000)) ) }, interval);
		}
	})();

	//////////////////////////////////////////////////////////////////////////////////////////////
	//                                   LOLIPOP - LOLIPRIVATE
	//                    External/Internal access of game functionalities
	//////////////////////////////////////////////////////////////////////////////////////////////

	Loliprivate.clickOnMick = function(){
		console.log("clickOnMick");
		Data.updateVar('action.click.mick',new BN(1));
	}

	Loliprivate.action = function( actionCode ){
		console.log(actionCode)
		switch( actionCode ){
			default:
				Data.updateVar(actionCode); break;
		}
	}

	Loliprivate.updateVarUses = function( id ){
		if( id ){
			Data.updateVarUses(id);
		} else {
			Object.keys(Data.Variables.Index).map(Data.updateVarUses);
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
		'monster.poro.quantity': new BN(0),
		//'monster.wolf.price.1': new BN(15),
		'monster.wolf.quantity': new BN(0),
		//'monster.raptor.price.1': new BN(15),
		'monster.raptor.quantity': new BN(0),
		//'monster.krug.price.1': new BN(15),
		'monster.krug.quantity': new BN(0),
		//'monster.gromp.price.1': new BN(15),
		'monster.gromp.quantity': new BN(0),
		//'monster.blue.price.1': new BN(15),
		'monster.blue.quantity': new BN(0),
		//'monster.red.price.1': new BN(15),
		'monster.red.quantity': new BN(0),
		//'monster.dragon.price.1': new BN(15),
		'monster.dragon.quantity': new BN(0),
		//'monster.vilemaw.price.1': new BN(15),
		'monster.vilemaw.quantity': new BN(0),
		//'monster.nashor.price.1': new BN(100),
		'monster.nashor.quantity': new BN(0),
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
					description: 'Stories on these magical cratures are countless. Many of those include a golden treasure.',
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
		v.gps = 'monster.'+m+'.gps';
		v.baseGps = 'constant.monster.'+m+'.gps';
		v.unaffordable = 'monster.'+m+'.unaffordable';
		v.unaffordable10 = 'monster.'+m+'.unaffordable.10';
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
	Upgrade.Pedia = { 'click.x2' : { targets: ['game.gold.gpc'], op: '*', value: new BN('2'), unlockedBy: [Milestone('statistics.mick.clicksAllTime',new BN(25))], shop: { price: new BN(50), name: 'Smashing Click', description: 'The amount of gold earned by clicking the minion is <strong>doubled</strong>.', image: 'smash1' }},'click.x2.2' : { targets: ['game.gold.gpc'], op: '*', value: new BN('2'), unlockedBy: [Milestone('statistics.mick.clicksAllTime',new BN(100))], shop: { price: new BN(200), name: 'Lucrative Smash', description: 'The amount of gold earned by clicking the minion is <strong>doubled</strong>.', image: 'smash2' }},'click.x2.3' : { targets: ['game.gold.gpc'], op: '*', value: new BN('2'), unlockedBy: [Milestone('statistics.mick.clicksAllTime',new BN(300))], shop: { price: new BN(1500), name: 'Super Smash', description: 'The amount of gold earned by clicking the minion is <strong>doubled</strong>.', image: 'smash3' }},'poro.gps.+0.1' : { targets: ['constant.monster.poro.gps'], op: '+', value: new BN('0.1'), unlockedBy: [Milestone('monster.poro.quantity',new BN(5))], shop: { price: new BN(40), name: 'Fluffy Group', description: 'Being a group allow each poro to find <strong>+0.1</strong> gold per second.', image: 'poro1' }},'poro.gps.x2' : { targets: ['constant.monster.poro.gps'], op: '*', value: new BN('2'), unlockedBy: [Milestone('monster.poro.quantity',new BN(10))], shop: { price: new BN(300), name: 'Thick Furr', description: 'Poros can find gold <strong>twice</strong> as fast.', image: 'poro1' }},'poro.gps.x2.2' : { targets: ['constant.monster.poro.gps'], op: '*', value: new BN('2'), unlockedBy: [Milestone('monster.poro.quantity',new BN(30))], shop: { price: new BN(5000), name: 'Magma Furr', description: 'Poros can find gold <strong>twice</strong> as fast.', image: 'poro2' }},'poro.gps.x2.3' : { targets: ['constant.monster.poro.gps'], op: '*', value: new BN('2'), unlockedBy: [Milestone('monster.poro.quantity',new BN(75))], shop: { price: new BN(1000000), name: 'Fantom Furr', description: 'Poros can find gold <strong>twice</strong> as fast.', image: 'poro3' }},'wolf.gps.+0.5' : { targets: ['constant.monster.wolf.gps'], op: '+', value: new BN('0.5'), unlockedBy: [Milestone('monster.wolf.quantity',new BN(5))], shop: { price: new BN(400), name: 'Wild Nose', description: 'Wolves now have a better sense of smell and find gold <strong>twice</strong> as fast.', image: 'wolf2' }},'wolf.gps.x2' : { targets: ['constant.monster.wolf.gps'], op: '*', value: new BN('2'), unlockedBy: [Milestone('monster.wolf.quantity',new BN(10))], shop: { price: new BN(1500), name: 'Wild Nose', description: 'Wolves now have a better sense of smell and find gold <strong>twice</strong> as fast.', image: 'wolf1' }},'raptor.gps.+2' : { targets: ['constant.monster.raptor.gps'], op: '+', value: new BN('2'), unlockedBy: [Milestone('monster.raptor.quantity',new BN(5))], shop: { price: new BN(2000), name: 'Red Raptors', description: 'New species of raptors increase the chances of getting golden eggs. #Diversity', image: 'raptor1' }},'raptor.gps.x2' : { targets: ['constant.monster.raptor.gps'], op: '*', value: new BN('2'), unlockedBy: [Milestone('monster.raptor.quantity',new BN(10))], shop: { price: new BN(7000), name: 'Red Raptors', description: 'New species of raptors increase the chances of getting golden eggs. #Diversity', image: 'raptor1' }},'dev.cheat.gps' : { targets: ['game.gold.gps'], op: '*', value: new BN('100000'), unlockedBy: [Milestone('game.gold.bank',new BN(0))], shop: { price: new BN(0), name: 'CHEAT', description: 'CHEAAAAT GPS', image: 'poro8' }},'dev.cheat.gpc' : { targets: ['game.gold.gpc'], op: '*', value: new BN('100000'), unlockedBy: [Milestone('game.gold.bank',new BN(0))], shop: { price: new BN(0), name: 'CHEAT', description: 'CHEAAAAT GPC', image: 'poro7' }} };


	Upgrade.pediaEntries = Object.keys(Upgrade.Pedia);

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

	Data.registerConstant("constant.monster.poro.gps", 		new BN(0.2));
	Data.registerConstant("constant.monster.wolf.gps", 		new BN(1));
	Data.registerConstant("constant.monster.raptor.gps", 	new BN(5));
	Data.registerConstant("constant.monster.krug.gps", 		new BN(27));
	Data.registerConstant("constant.monster.gromp.gps", 	new BN(150));
	Data.registerConstant("constant.monster.blue.gps", 		new BN(750));
	Data.registerConstant("constant.monster.red.gps", 		new BN(4321));
	Data.registerConstant("constant.monster.dragon.gps", 	new BN(20000));
	Data.registerConstant("constant.monster.vilemaw.gps", 	new BN(123000));
	Data.registerConstant("constant.monster.nashor.gps", 	new BN(666666));

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
	Data.registerVar("action.click.mick", new BN(0), null, function( qty ){ this.value = qty || new BN(1); return true; });

	// Time elapsed, can be set at low frequency on slower machines to save performance
	//Data.registerVar("action.time.elapsed", new BN(0), null, function( t ){ this.value = t; return true; });
	Data.registerVar("action.time.elapsed", null, null,
		function( ){
			if( this.time == null ){ this.time = new BN(Date.now()).div(new BN(1000)); this.value = new BN(0);}
			else { var now = new BN(Date.now()).div(new BN(1000)); this.value = now.minus(this.time); this.time = now; return this.value.gt(0); } });

	//Data.registerVar("action.time.elapsed", new BN(0), ['action.time.update'], function(){});

	// Monster related Variables
	/// -- PORO -- 

	var monsterBuyActions = [];
	var monsterRefundActions = [];

	Data.Pedia.MonsterIDs.map(function( m ){ // For each monster m

		var actionBuy1 = 'action.buy.monster.'+m+'.1', actionBuy10 = 'action.buy.monster.'+m+'.10',
			actionRefund = 'action.refund.monster.'+m, actionRefundAll = 'action.refundAll.monster.'+m;

		Data.registerSpongeVar('monster.'+m+'.quantity',
		{
			[actionBuy1]: 1,
			[actionBuy10]: 10,
			[actionRefund]: -1,
			[actionRefundAll]: '-current'
		},
		Data.Formatting.abreviatedNumber);
		
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

		monsterBuyActions.push(actionBuy1);
		monsterBuyActions.push(actionBuy10);
		monsterRefundActions.push(actionRefund);
		monsterRefundActions.push(actionRefundAll);
	});


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

	Upgrade.pediaEntries.map( function( uID ){
		Upgrade.setUpUnlock(uID);
	});

	// BUY TREE

	Data.registerRelayVar('action.buy.monster',	monsterBuyActions);
	Data.registerRelayVar('action.buy.upgrade', []);
	Data.registerRelayVar('action.buy',	['action.buy.monster','action.buy.upgrade']);

	// Gold earned per click
	Data.registerVar("game.gold.gpc", new BN(0), ['game.gold.gps'], function(){ return false; });

	// Gold earned per second
	Data.registerRelayVar("game.gold.gps", ['monster.gps']);

	Data.registerProductVar("action.click.goldProduced",['action.click.mick'],['game.gold.gpc']);
	Data.registerProductVar("action.time.goldProduced",['action.time.elapsed','game.gold.gps']);

	Data.registerRelayVar('action.goldProduced',['action.click.goldProduced','action.time.goldProduced']);

	Data.registerSpongeVar('game.gold.bank.exact',{'action.goldProduced':'+value','action.buy':'-value','action.refund':'+value'});

	Data.registerFloorRelayVar('game.gold.bank',['game.gold.bank.exact']);

	//Upgrade.makeUpgraded('game.gold.bank');


	/// STATISTICS
	//> Used in stats view, statistics and prestige

	Data.registerSpongeVar('statistics.mick.clicksAllTime',{'action.click.mick':'+value'});
	Data.registerIncrementVar('statistics.upgrade.bought');
	Data.registerIncrementVar('statistics.upgrade.discovered');



	//////////////////////////////////////////////////////////////////////////////////////////////
	//                                   INITIALIZATION
	//                   		      Where all is set up
	//////////////////////////////////////////////////////////////////////////////////////////////

	(function INITIALIZATION(){

		BigNumber.config({ EXPONENTIAL_AT: 100 });


		// dom
		function elt(str){return document.createElement(str)};
		function div(){return elt("div")};

		// monsters
		function divActionMonster( monster ){
			return $("\n<div class='monster-action no-select conditional-format display-none' id='monster-menu-"+monster.code+"' data-condition='"+monster.vars.unaffordable+"' data-format-class='unaffordable'> \
						<div class='crop'>\
							<div class='image-holder lolipop-action' data-lolipop-action='"+monster.vars.actionBuy+"'> \
								<div class='sprite-ctn "+monster.code+" hover-glow'></div> \
							</div> \
							<div class='options-holder'>\
								<div class='opt lolipop-action' data-opt='1' data-lolipop-action='"+monster.vars.actionBuy10+"'>Summon 10</div>\
								<div class='opt lolipop-action' data-opt='2' data-lolipop-action='"+monster.vars.actionRefund+"'>Sell</div>\
								<div class='opt lolipop-action' data-opt='3' data-lolipop-action='"+monster.vars.actionRefundAll+"'>Sell all</div>\
								<div class='opt' data-opt='4'>Infos</div>\
							</div>\
							<div class='description-holder lolipop-action' data-lolipop-action='"+monster.vars.actionBuy+"'> \
								<p class='action-name'>"+monster.SummonMenu.name+"</p> \
								<p class='action-qty'><small>x</small><span class=' gamedata' data-id='"+monster.vars.quantity+"' data-format-function='wholeNumber'>ERR_QTY</span></p>\
								<p class='action-desc'>"+monster.SummonMenu.description+"</p> \
								<p class='action-buy'>Click to Summon</p>\
								<p class='opt-default action-price gamedata' data-format-function='abbreviatedNumber' data-id='"+ monster.vars.price +"'>NO_DATA</p> \
								<p class='opt action-price gamedata conditional-format' data-condition='"+monster.vars.unaffordable10+"' data-format-class='unaffordable' data-format-function='abbreviatedNumber' data-id='"+ monster.vars.price10 +"' data-opt='1'>NO_DATA SUM10</p>\
								<p class='opt action-price refund gamedata' data-format-function='abbreviatedNumber' data-id='"+ monster.vars.refund +"' data-opt='2'>NO_DATA SELL</p>\
								<p class='opt action-price refund gamedata' data-format-function='abbreviatedNumber' data-id='"+ monster.vars.refundAll +"' data-opt='3'>NO_DATA SELL_ALL</p>\
								<p class='opt action-price' data-opt='4'></p>\
							</div> \
						</div>\
						<div class='monster-overlay'>\
							<div class='title'>Statistics</div>\
							<p><span class='gold gamedata' data-id='"+monster.vars.baseGps+"' data-format-function='abbreviatedNumber'>ERR_DATA</span> gold per second per unit.</p>\
							<p><span class='gold gamedata' data-id='"+monster.vars.gps+"' data-format-function='abbreviatedNumber'>ERR_DATA</span> gold per second.</p>\
						<div>\
					</div>");
		};

		function divMonsterRecap( monster, i ){
			return $("<div class='recap-holder "+(i%2 != 0 ? 'odd':'even')+"'> \
						<div class='sprite-ctn "+monster.code+" hover-glow conditional-format' data-condition='"+monster.vars.unaffordable+"' data-format-class='unaffordable'>\
							<div class='recap-info-holder'> \
								<span class='gamedata recap-quantity' data-id='"+monster.vars.quantity+"' data-format-function='shortWhole'>345</span> \
								<p class='recap-gps'>/s <span class='gamedata recap-gold' data-id='"+monster.vars.gps+"'>345</span></p> \
							</div>\
						</div> \
					</div>");
		};

		var monsters = Data.Pedia.Monsters;
		var i = 0;
		for( var m in monsters ){
			var monster = monsters[m];
			$("#monsters-ctn").append(divActionMonster(monster));
			$("#monster-recap").append(divMonsterRecap(monster, i++));
		}



		// Monsters menu
		$(".monster-action .options-holder").on('mouseenter', function(){
			$(this).siblings('.description-holder').find('.opt-default').css('display','none');
		});
		$(".monster-action .options-holder > .opt").on('mouseenter', function(){
			var opt = $(this).attr("data-opt");
			$(this).closest('.monster-action').find(".description-holder .opt[data-opt='"+opt+"']").css("display","block");
		});
		$(".monster-action .options-holder > .opt").on('mouseleave', function(){
			var opt = $(this).attr("data-opt");
			$(this).closest('.monster-action').find(".description-holder .opt[data-opt='"+opt+"']").css("display","");
		});
		$(".monster-action .options-holder").on('mouseleave', function(){
			$(this).siblings('.description-holder').find('.opt-default').css('display','');
		});

		// Upgrades
		Sprite.loadSheet('upgrades','img/sprites/upgrade-sheet.png','img/sprites/upgrade-sheet.txt');

		function divUpgrade( id, uEntry ){
			var sheet = Sprite.Sheet['upgrades'],
				sprite = sheet.sprites[uEntry.shop.image];
			console.log("sprite",sprite, sheet);
			return $("<div class='enchant-holder locked lolipop-action conditional-format' data-upgrade-id='"+id+"' data-lolipop-action='action.upgrade.buy."+id+"' data-condition='upgrade."+id+".affordable' data-format-class='affordable' data-format-function='abbreviatedNumber''>\
						<div class='sprite-overlay'>\
							<div class='title'>"+uEntry.shop.name+"</div>\
							<div class='description'>"+uEntry.shop.description+"</div>\
							<div class='price gamedata' data-format-function='abbreviatedNumber' data-id='upgrade."+id+".price'>ERR_PRICE</div>\
							<div class='tip'>Click to buy</div>\
						</div>\
						<div class='oval'>\
							<div class='sprite-bg' style='background-image: url("+sheet.url+"); background-position: -"+sprite.x+"px -"+sprite.y+"px;'></div>\
						</div>\
					</div>\
					<!--line break-->");
		};

		var onUnlockedFunc = function( id, uEntry ){
			if( ! Sprite.Sheet['upgrades'].loaded ){
				console.log('Delaying Shop Entry',id);
				setTimeout(function(){ onUnlockedFunc(id,uEntry);}, 100);
				return;
			}
			console.log('UNLOCKED',id);

			$("#enchants-ctn").append(divUpgrade(id,uEntry));
			Lolipop.updateDOMActions();
			Lolipop.updateVarUses('upgrade.'+id+'.price');
			Lolipop.updateVarUses('upgrade.'+id+'.affordable');
		}

		Upgrade.onUnlocked( onUnlockedFunc );

		Upgrade.onBought( function( id, uEntry ){
			$div = $(".enchant-holder[data-upgrade-id='"+id+"']");
			console.log("BOUGHT",$div,$div.children('.oval'));
			$div.removeClass('locked');
			$div.find('.price, .tip').remove();
			//Lolipop.updateDOMActions();
			//Lolipop.updateVarUses('upgrade.'+id+'.price');
		});

		// REVEALS
		Data.newOneTimeUse(Milestone('game.gold.bank',5),function(){
			$('#monsters-section').removeClass('display-none');
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

		Data.Load(Data.NewGameLoader);
		//Data.updateVar('milestone.game.gold.bank.0');
		// TIME
		Time.setInterval(32);
		Time.start();

	})();

	// AESTHETIC - JQUERY
	$(document).ready(function(){

		//var particlesJS = particlesJS

		$('#main-button').on('touchstart',function( e ){
			$(this).click();
			$(this).addClass('active');
		}).on('touchend',function( e ){
			e.preventDefault();
			$(this).removeClass('active');
		});

		if( typeof(particlesJS) !== 'undefined' ) {
			particlesJS.load('particle3', 'assets/goldbar.json', function() {
			  console.log('callback - particles.js config loaded');
			});
		}

		// CTM
		var top = 'first';
		$('#main-inner').on('scroll',function( e ){
			var scroll = $(this).scrollTop();
			if( scroll > 122 && (!top || top == 'first') ){
				$('#ctm-button-top').css('visibility','visible');
				$('#ctm-button-middle').css('visibility','hidden');
				top = true;
				console.log('button updated');
			} else if( scroll <= 122 && (top || top == 'first') ){
				$('#ctm-button-top').css('visibility','hidden');
				$('#ctm-button-middle').css('visibility','visible');
				top = false;
				console.log('button updated');
			}
		});
	});


})();

$("#mick").on('click',function(){
	Lolipop.action('action.click.mick');
});

$(document).ready(function(){
	Lolipop.updateDOMActions();
	Lolipop.updateVarUses(); // useless !

	/* particlesJS.load(@dom-id, @path-json, @callback (optional)); */
	/*particlesJS.load('particle1', 'assets/fire.json', function() {
	  console.log('callback - particles.js config loaded');
	});
	particlesJS.load('particle2', 'assets/green-fire.json', function() {
	  console.log('callback - particles.js config loaded');
	});*/
});


/// --- TODO

// Put the formatting function in the html, not in the data