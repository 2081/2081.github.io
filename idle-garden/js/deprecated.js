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