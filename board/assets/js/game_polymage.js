
function toper( x ){
	return x*100+'%';
}

function Vertex( x, y ){
	this.x = 0; this.y = 0;

	if( x instanceof Vertex ){
		this.x = x.x; this.y = x.y;
	} else if ( typeof x === 'number' && typeof y === 'number' ){
		this.x = x; this.y = y;
	}
};

Vertex.prototype = {

	plus: function( v ){
		this.x += v.x; this.y += v.y;
		return this;
	},
	scale: function( s ){
		this.x *= s; this.y *= s;
		return this;
	}
};

/*

	Goal of the game, give shelter to all the species

	Species:
		Each species 

*/
var NIGHT_FILTER 	= [0.5, 0.5, 0.5, 20, 0, 30];
var TWILIGHT_FILTER = [0.75, 0.75, 0.75, 20, 10, 15];
var MORNING_FILTER 	= [0.74, 0.75, 0.75, 10, 0, 15];



function classicFormat( decimal ){
	return decimal.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",").replace(/\.\d{3,}/g,function( str ){ return str.substring(0,3)} );
};

function populationFormat( decimal ){
	var n = decimal.floor(), f = decimal.minus(n).times(10).floor();
	return classicFormat(n);//+'<span class="coma">.'+f+'</span>';
};



var TagsManager, TM;

(function(){

	var all_tags = {};

	function setTagValue( args, bool  ){
		if( typeof args === 'object' ){
			for( var i = 0; i < args.length; ++i) setTagValue(args[i], bool);
		} else if( typeof args === 'string' ){
			tags = args.split(' ');
			for( var i in tags ) all_tags[tags[i]] = bool;
		}
	}

	TM = TagsManager = {

		activate: function( tags ){
			setTagValue(arguments, true);
		},
		deactivate: function( tags ){
			setTagValue(arguments, false);
		},

		active: function( tag ){
			return all_tags[tag] || false;
		}
	}

	console.log(TM.active('perruche'));
	TM.activate('perruche');

	console.log(all_tags);
	console.log(TM.active('perruche'));

})();


function Environment( config ){
	this.config = config;
	Obs.observable(this, true);
}
Environment.prototype = {
	// Collect eco-points for the duration dt
	// dt in milliseconds
	collect: function( dt ){
		return 0;
	},
};


function SpeciesStats( growthFactor, maxPopulation ){ // ss, activationTag
	this.root = arguments[0] instanceof SpeciesStats ? false : true;
	if( arguments[0] instanceof SpeciesStats ){
		this.ancestor = arguments[0];
		this.activationTag = arguments[1];
	} else {
		this.__growthFactor = arguments[0] || 0.05;
		this.__maxPopulation = arguments[1] || 10;
	}
}

SpeciesStats.prototype = {
	growthFactor: function(){
		if( this.ancestor ){
			if( true && this._growthFactor && TM.active(this.activationTag) ){
				return this._growthFactor(this.ancestor.growthFactor())
			}
			return this.ancestor.growthFactor();
		} else {
			return this.__growthFactor;
		}
	},
	maxPopulation: function(){
		if( this.ancestor ){
			if( true && this._maxPopulation && TM.active(this.activationTag) ){
				return this._maxPopulation(this.ancestor.maxPopulation())
			}
			return this.ancestor.maxPopulation();
		} else {
			return this.__maxPopulation;
		}
	},
	_growthFactor: function(n){return n},
	_maxPopulation: function(n){return n}
};

function Species( config ){
	config = config || {};
	this.stats = new SpeciesStats( config.growthFactor, config.maxPopulation );
	this.population = new Decimal(config.population || 0);
	this.populationFloored = this.population.floor();
	this.minimumGrowth = config.minimumGrowth || 0;

	this.unseen = new Decimal(this.population);

	Obs.observable(this, true);
}

Species.prototype = {
	buff: function( activationTag, functions ){
		this.stats = new SpeciesStats(this.stats, activationTag);
		for( var key in functions ) {
			if( typeof functions[key] !== 'function' ) throw new Error('Only functions expected');
			this.stats['_'+key] = functions[key];
		}
		return this;
	},
	grow: function(){
		if( true || this.population >= 2 ){
			//var newPop = Math.min( Math.max( this.population + this.minimumGrowth, this.population * (1+this.stats.growthFactor())), this.stats.maxPopulation());
			
			var gf = new Decimal(this.stats.growthFactor()), mp = new Decimal(this.stats.maxPopulation());

			var max_ = mp.times(gf.plus(1)).dividedBy(gf);

			var grown_population = this.population.times(gf.plus(1)).times(max_.minus(this.population).dividedBy(max_));

			var population_delta = grown_population.floor().minus(this.populationFloored);
			var optimum_grown_population = this.population.times(gf.plus(1));
			var deaths = Decimal.max(0, optimum_grown_population.minus(grown_population).floor());
			var births = Decimal.max(0, population_delta.minus(deaths).floor());

			if( this.population.times(gf).lt(this.minimumGrowth) ){
				grown_population = Decimal.min(this.population.plus(this.minimumGrowth), this.stats.maxPopulation());
				optimum_grown_population = grown_population;
				deaths = births = new Decimal(0);
			}

			this.unseen = this.unseen.plus(births);

			this.population = grown_population;
			this.populationFloored = grown_population.floor();

			var growth_report = {
				population: this.populationFloored,
				delta: population_delta
			};

			this.notify('grew', {diff: population_delta, population: this.population, days: 1})
			this.notify('populationChanged', {diff: population_delta, population: this.population, days: 1, unseen: this.unseen})
		}
	}
};

// var s = new Species({growthFactor: 0.05, maxPopulation: 10});

// console.log(s.stats.maxPopulation());

// s.buff();

// console.log(s.stats.maxPopulation());

// s.buff('sardine', {maxPopulation: function( n ){ return n*2; }});

// console.log(s.stats.maxPopulation());

// TM.activate('sardine');

// console.log(s.stats.maxPopulation());

var V = {};

(function(){

	//V.Species

	V.Environment = function VEnvironment( config ){

		this.config = config;

		Obs.observe(config.environment, this);

		this.$pointers = config.species.map(function(s){

			var dir = s.pointer || 'bltotr';
			var tilt = s.tilt || 0;
			var $p = $('<div class="pointer '+dir+'" data-owner="planet"><span class="target" style="transform: rotateX('+tilt+'deg)"></span><div class="content nowrap tb-reveal">\
				<div class="thumbnail" style="background-image: url(assets/graphics/png/100px/'+s.graphic+'.png)">\
				<span class="caption"><span class="population">'+populationFormat(s.obj.population)+'</span><span class="info" data-info="new" ></span></span></div>\
				<div class="reveal-content"><h3><span class="info" data-info="new" >678,453</span></h3>\
				</div></div>');
			$p.find('.caption [data-info="new"]').html(s.obj.unseen.gt(0) ? '<i class="fa fa-level-up" aria-hidden="true"></i> '+classicFormat(s.obj.unseen) : '');
			$p.css({
				width: (s.pointerSize || 15)+'%',
				height: (s.pointerSize || 15)+'%',
				left: toper(s.position.x),
				top: toper(s.position.y)
			});

			Obs.observe(s.obj, {
				onPopulationChanged: function( sp, data ){
					$p.find('.caption .population').html(populationFormat(data.population));
					$p.find('.caption [data-info="new"]').html(data.unseen.gt(0) ? '<i class="fa fa-level-up" aria-hidden="true"></i> '+classicFormat(data.unseen) : '');
				}
			});

			this.config.$interface.append($p);

			$p.children('.content').click(function(){
				switch(s.graphic){
					case 'opossum':
						this.config.polymage.$.removeClass('right').addClass('left');
						break;
					case 'bird': case 'carp':
						this.config.polymage.$.removeClass('left').addClass('right');
						break;
				}
				this.config.polymage.change(s.graphic);
				this.config.$interface.children('.pointer[data-owner="planet"]').addClass('fadeout quickfade').removeClass('fadein longfade');//.css('display','none');//.addClass('no-tail caption-right');//.removeClass('tltobr trtobl brtotl bltotr')
				setTimeout(this.bring.bind(this), 5000);
			}.bind(this));

			return $p;
		}.bind(this));
	}
	V.Environment.prototype = {
		bring: function(){
			this.config.polymage.$.removeClass('left right');
			this.config.polymage.change(this.config.graphic);
			this.config.$interface.children('.pointer[data-owner="planet"]').addClass('fadein longfade').removeClass('fadeout quickfade');
			// setTimeout(function(){
			// 	this.config.$interface.children('.pointer[data-owner="planet"]').addClass('fadein longfade').removeClass('fadeout quickfade');//.css('display','');
			// }.bind(this), 1000);
		}

	};

})();

//

function getChunkSpecial( chunk_seed, chunk_generation, chunk_size ){
	return new Decimal(chunk_seed).plus(new Decimal(765613).times(chunk_generation)).mod(4568371).times(16807).mod(chunk_size);
	//return (chunk_seed+(765613*chunk_generation)%4568371) * 16807 % chunk_size
};

// var n = 0, N = 10000;
// for( var i = 0; i < N; ++i){
// 	var r = Math.floor(Math.random() * 2147483647);
// 	if(getChunkSpecial(r , 0, 100) < 10) ++n; //console.log(r, getChunkSpecial(r , 0, 100));
// }
// console.log(n/N);

function get_chunck( config, data, index, n ){

}

function ChunkManager( config, data, index ){
	console.log(config, data, index);
	this.seeds = data.seeds[index];
	this.n_specimen = config.n_specimen[index];
	this.intervals = config.specimen_intervals[index];

	this.max_quantity = data.population[index].floor();

	this.offset = data.deaths[index].floor();

	this.leftover = [];

	this.next_ = new Decimal( data.deaths[index] ).floor(); //34560); //[];
	//for(var i = 0; i < this.n_specimen; ++i) this.next_[i] = 0;
	//console.log('mod', this.next_.mod(this.intervals[0]).toNumber());
	this.leftover = this.getChunkN(this.next_.dividedBy(this.intervals[0]).floor()).slice(this.next_.mod(this.intervals[0]));

}
ChunkManager.prototype = {

	getChunkN: function( n ){
		var generation = [], special = [];
		for( var i = 0; i < this.intervals.length; ++i){
			console.log()
			generation[i] = i == 0 ? n : generation[i-1].dividedBy(this.intervals[i-1]).floor();
			special[i] = getChunkSpecial( this.seeds[i], generation[i], this.intervals[i]);
		}
		
		var chunk = [];
		for( var i = 0; i < this.intervals[0]; ++i) chunk[i] = {number: n*this.intervals[0]+i, type: 0};
		chunk[special[0]].type = 1;
		var gen = 1;
		while( gen < this.n_specimen && special[gen].eq(generation[gen - 1].mod(this.intervals[gen-1])) ){
			gen++;
			chunk[special[0]].type++;
		}
		console.log('fecthing chunk', generation[0].toNumber());

		// console.log(special.map(function(o){return o.toNumber()}), generation.map(function(o, i){return o.mod(this.intervals[i]).toNumber()}.bind(this)), chunk[special[0]]);
		return chunk;
	},

	next: function( qty ){
		if( !(qty instanceof Decimal) ) qty = new Decimal(qty);
		if( !qty || qty.lt(1) ) throw new Error('Quantity > 1 expected');

		//console.log("qty", qty.toNumber(), this.max_quantity.toNumber());
		var qty = Decimal.min( qty, this.max_quantity);
		//console.log('qty', qty.toNumber());
		//this.max_quantity = this.max

		var chunk = this.leftover;
		this.leftover = [];

		var mi = Decimal.min( qty, chunk.length);
		this.next_ = this.next_.plus(mi);

		if( qty.lt(chunk.length) ){
			console.log('A');
			this.leftover = chunk.slice(qty.toNumber());
			this.max_quantity = this.max_quantity.minus(qty);
			return chunk.slice(0, qty.toNumber());
		} else if ( qty.eq(chunk.length) ){
			console.log('B');
			this.max_quantity = this.max_quantity.minus(qty);
			return chunk;
		} else {
			console.log('C', this.next_.toNumber());
			this.leftover = this.getChunkN(this.next_.dividedBy(this.intervals[0]).floor());
			this.max_quantity = this.max_quantity.minus(chunk.length);
			return chunk.concat(this.next( qty.minus(chunk.length) ));
		}

	}
};

//

function setUpPopulation( config, data, pm, $pmi, $bmi ){
	$bb = $('<div class="back-button"></div>');
	$container = $('<div id="population-container" data-menu="population"></div>');

	$bb.click(function(){
		setTimeout(function(){
			$container.children('*:not(.back-button)').remove();
		}, 2000);
		$container.removeClass('reveal');
		bring_planet_view( pm, $pmi );
	});

	$container.append($bb);
	$('#game').append($container);
}

function setUpPlanet( config, data, pm, $pmi, $bmi ){

	config.species_code.map(function(code, index){

		var pconfig = config.pointers[index];

		var dir = pconfig.pointer || 'bltotr';
		var tilt = pconfig.tilt || 0;
		var $p = $('<div class="pointer '+dir+'" data-owner="planet" data-species="'+index+'"><span class="target" style="transform: rotateX('+tilt+'deg)"></span><div class="content nowrap tb-reveal">\
			<div class="thumbnail" style="background-image: url(assets/graphics/png/100px/'+code+'.png)">\
			<span class="caption"><span class="population" data-species="'+index+'">'+populationFormat(new Decimal(0))+'</span><span class="info" data-info="new" ></span></span></div>\
			<div class="reveal-content"><h3><span class="info" data-info="new" >678,453</span></h3>\
			</div></div>');
		//$p.find('.caption [data-info="new"]').html(s.obj.unseen.gt(0) ? '<i class="fa fa-level-up" aria-hidden="true"></i> '+classicFormat(s.obj.unseen) : '');
		$p.css({
			width: (pconfig.pointerSize || 15)+'%',
			height: (pconfig.pointerSize || 15)+'%',
			left: toper(pconfig.position.x),
			top: toper(pconfig.position.y)
		});

		// Obs.observe(s.obj, {
		// 	onPopulationChanged: function( sp, data ){
		// 		$p.find('.caption .population').html(populationFormat(data.population));
		// 		$p.find('.caption [data-info="new"]').html(data.unseen.gt(0) ? '<i class="fa fa-level-up" aria-hidden="true"></i> '+classicFormat(data.unseen) : '');
		// 	}
		// });

		$pmi.append($p);

		$p.children('.content').click(function(){
			// switch(code){
			// 	case 'opossum':
			// 		this.config.polymage.$.removeClass('right').addClass('left');
			// 		break;
			// 	case 'bird': case 'carp':
			// 		this.config.polymage.$.removeClass('left').addClass('right');
			// 		break;
			// }
			bring_population_view(config, data, pm, $pmi, index);
			// pm.$.addClass('left');
			// pm.change(code);
			$pmi.children('.pointer[data-owner="planet"]').addClass('fadeout quickfade').removeClass('fadein longfade');//.css('display','none');//.addClass('no-tail caption-right');//.removeClass('tltobr trtobl brtotl bltotr')
			//setTimeout(setUpPlanet, 5000);
		});

		return $p;
	}.bind(this));
}


function updatePlanet( gd ){
	$('#game .pointer[data-species]').each(function(){
		var index = parseInt($(this).attr('data-species'));
		$(this).find('.caption .population').html(populationFormat(gd.population[index]));
		$(this).find('.caption .info[data-info="new"]').html(gd.unseen[index].gt(0) ? '<i class="fa fa-level-up" aria-hidden="true"></i> '+classicFormat(gd.unseen[index]) : '');
	});
}

function setUpCraft(config, data, pm, $pmi, $bmi){
	$inventory = $('<div id="inventory"></div>');
	$craft = $('<div id="craft-container"></div>');
	// --------------------------------------------

	for( var i = 0; i < config.n_species; ++i ){
		for( var j = 0; j < config.n_specimen[i]; ++j ){
			$inventory.append($('\
				<div class="item" data-species="'+i+'" data-specimen="'+j+'" style="background-image: url(assets/graphics/png/100px_large/'+config.species_code[i]+'_sp'+(j+1)+'.png);">\
				<span>0</span>\
				</div>'));
		}
	}

	var scroll = 0;
	$inventory.bind('mousewheel DOMMouseScroll', function(e){
		// if (event.originalEvent.wheelDelta > 0 || event.originalEvent.detail < 0) {
	 //        last_scroll_top = -1;
	 //    }
	 //    else {

	 //    }
	 	//console.log('scroll',$(this).scrollTop(),e.originalEvent.wheelDelta);
	 	//$(this).scrollTop($(this).scrollTop()+e.originalEvent.wheelDelta);
	 	scroll += e.originalEvent.wheelDelta;
	 	$inventory.children('*').css('transform', 'translateY('+scroll+'px)');
	});


	// --------------------------------------------
	$('#game').append($craft.append($inventory));
}

function updateInventory( data ){
	$('#game #inventory .item').each(function(){
		$item = $(this);
		var species = parseInt($item.attr('data-species'));
		var specimen = parseInt($item.attr('data-specimen'));
		$item.children('span').text( data.inventory[species][specimen] );
	});
}

function bring_planet_view(pm, $pmi){
	pm.$.removeClass('left right');
	pm.change('planet');
	$pmi.children('.pointer[data-owner="planet"]').addClass('fadein longfade').removeClass('fadeout quickfade');
}

function bring_population_view(config, data, pm, $pmi, index){
	pm.$.addClass('left');
	pm.change(config.species_code[index]);
	$pmi.children('.pointer[data-owner!="population"]').addClass('fadeout quickfade').removeClass('fadein longfade');
	$ctn = $('<div class="specimen-container"></div>')
	$('#population-container').addClass('reveal').append($ctn);
	/////////////////////////////////////////////////////////
	var cm = new ChunkManager(config, data, index);
	var more = true;

	function add( arr, epoch ){
		epoch = epoch || 0;
		for( var i = 0; i < arr.length; ++i ){
			var sp = arr[i].type;
			var img = config.species_code[index];
			if( sp > 0 ) img += '_sp'+sp;
			var $div = $('<div class="specimen"></div>').css({
				'background-image':'url(assets/graphics/png/100px_large/'+img+'.png)',
				'transition-delay': (i*0.02+0.2*epoch)+'s'
			});
			if( sp > 0 ){
				$div.addClass('special');
				$div.append('<span class="fa fa-check-circle-o"></span>');
				console.log(data.collected, sp-1);
				if( data.collected[index][sp-1][arr[i].number] ){
					$div.addClass('already-gotcha');
				} else {
					var f = function(){
						this.addClass('gotcha');
						data.inventory[index][this._sp-1]++;
						console.log('collected', this._sp, this._id);
						updateInventory(data);
						this.off('click', f);
						data.collected[index][this._sp-1][this._id] = true;
					}.bind($div);
					$div._sp = sp;
					$div._id = arr[i].number;

					//$div.on('click', f);
					setTimeout(f, 500+i*20);
				}
			}
			console.log('+1');
			$ctn.append($div);
		}
	}

	// var epoch = 0;
	// while(more){
	// 	var arr = cm.next(10)
	// 	add(arr, epoch++);
	// 	if( arr.length == 0 ) more = false;
	// }

	//var specimens = cm.next(10);
	//add(specimens);

	if( data.population[index].gt(0) ){

		var last_scroll_top = 0;
		function onscroll(event){
		    if (event.originalEvent.wheelDelta > 0 || event.originalEvent.detail < 0) {
		        last_scroll_top = -1;
		    }
		    else {
		    	var scroll = $ctn.scrollTop();
	    		//console.log(scroll, $ctn.height(), $ctn.prop('scrollHeight') );
	    		console.log(scroll, last_scroll_top);
		    	if( scroll === last_scroll_top ){
		    		console.log('next', $ctn.prop('scrollHeight') );
		    		var arr = cm.next(20);
		    		if( arr.length > 0 ){
		    			add(arr);
			    		setTimeout(function(){
			    			//$ctn.scrollTop(scroll+500);
							$ctn.animate({
								scrollTop: scroll+500
							}, 300);
			    			$ctn.children().addClass('reveal');
			    		}, 50);
		    		} else {
		    			$ctn.unbind('mousewheel DOMMouseScroll', onscroll);
		    			$ctn.addClass('full');
		    		}
		    	}
		    	last_scroll_top = scroll;
		    }
		}

		$ctn.bind('mousewheel DOMMouseScroll', onscroll);
		

		setTimeout(function(){
			$ctn.children().addClass('reveal');
		}, 2000);
	} else {
		$ctn.addClass('full');
	}

}

function randint(){
	return Math.floor(Math.random()*46758374);
}

function getGameConfig() {
	return {
		n_species: 3,
		species_code: ['carp','opossum','bird'],
		initial_population: [292.9, 0, 0],
		initial_population_cap: [10000.09, 100.09, 100.09],
		growth: [0.2, 0.10, 0.05],

		// specimen
		n_specimen: [3, 1, 1],
		specimen_intervals: [
			[100, 100, 100],
			[100],
			[100]
		],

		// crafts
		crafts: [
			// 1st species, 1st specimen, 1 unit | 1st species, +500 max population
			{ recipe: [[0, 0, 1]],	mpop: 	[[0, 500]] },
			{ recipe: [[0, 1, 0]],	pop: 	[[1, 1]] }
		],

		// Interface
		pointers: [
			{position: new Vertex(0.50, 0.68), pointer: 'trtobl', tilt: 5, pointerSize: 15},
			{position: new Vertex(0.32, 0.55), pointer: 'brtotl', tilt: 0, pointerSize: 15},
			{position: new Vertex(0.69, 0.42), pointer: 'bltotr', tilt: 44, pointerSize: 10}
		]
	}	
}

function getNewGameData( game_config ) {
	var gd = {
		seeds: [],
		population: [],
		population_cap: [],
		collected: [],
		unseen: [],
		seen: [],
		deaths: [],
		inventory: [],
		buffs: []
	};

	// seeds
	for( var i = 0; i < game_config.n_species; ++i ){
		gd.collected[i] = [];
		gd.seeds[i] = [];
		gd.inventory[i] = [];
		gd.deaths[i] = new Decimal(0);
		gd.population[i] = new Decimal(0);
		gd.population_cap[i] = new Decimal(game_config.initial_population_cap[i]);
		gd.unseen[i] = new Decimal(0);
		for( var j = 0; j < game_config.n_specimen[i]; ++j ){
			gd.seeds[i][j] = new Decimal(randint());
			gd.inventory[i][j] = new Decimal(0);
			gd.collected[i][j] = {};
		}
	}

	gd.seeds[0][0] = new Decimal(754);
	gd.population[0] = new Decimal(game_config.initial_population[0]);

	return gd;
}

function updateTimeOfDay( last_timeofday, current_timeofday, pm ){
	if( last_timeofday !== current_timeofday ){
		switch( current_timeofday ){
			case 1:
				pm.setFilter(); // day
				break;
			case 2:
				pm.setFilter(TWILIGHT_FILTER); // twilight
				$day_night.addClass('night');
				$('#game').addClass('night')
				break;
			case 3:
				pm.setFilter(NIGHT_FILTER); // night
				break;
			case 0: default:
				pm.setFilter(MORNING_FILTER); // morning
				$day_night.removeClass('night');
				$('#game').removeClass('night')
				break;
		}
		pm.refresh();
		return current_timeofday;
	}
	return last_timeofday;
}

function numberToTimeOfDay( x ){
	x = 24*x;
	if( x < 2 ) return 0;
	if( x < 12 ) return 1;
	if( x < 14 ) return 2;
	return 3;
}

function grow( gc, gd ){
	for( var index = 0; index < gd.population.length; ++index){
		if( gd.population[index].gte(2) ){

			var population = gd.population[index];
			console.log('population', population.toString());

			var gf = new Decimal(gc.growth[index]), mp = new Decimal(gd.population_cap[index]);
			var max_ = mp.times(gf.plus(1)).dividedBy(gf);
			console.log('gf', gf.toNumber(), 'mp', mp.toNumber(), 'max_', max_.toNumber());

			var grown_population = population.times(gf.plus(1)).times(max_.minus(population).dividedBy(max_));

			var population_delta = grown_population.floor().minus(population.floor());
			var optimum_grown_population = population.times(gf.plus(1));
			var deaths = Decimal.max(0, optimum_grown_population.minus(grown_population).floor());
			var births = Decimal.max(0, population_delta.plus(deaths).floor());

			gd.unseen[index] = Decimal.min(grown_population.floor(), gd.unseen[index].plus(births));
			// gd.unseen[index] = gd.unseen[index].plus(births);
			gd.population[index] = grown_population;
			gd.deaths[index] = gd.deaths[index].plus(deaths);

			for( var i = 0; i < gd.collected[index].length; ++i ){
				for( var key in gd.collected[index][i] ){
					if( gd.deaths[index].gt(key) ) delete gd.collected[index][i][key];
				}
			}
		}
	}
}

function startGame( options ){
	var gc = getGameConfig();
	var gd = options.gd || getNewGameData(gc);
	var pm = options.pm, $pmi = options.$pmi, $bmi = options.$bmi;

	setUpPlanet(gc, gd, pm, $pmi, $bmi);
	setUpPopulation(gc, gd, pm, $pmi, $bmi);
	setUpCraft(gc, gd, pm, $pmi, $bmi);

	var CYCLE_DURATION = 24000;

	var game_started_timestamp = null;
	var last_timestamp = null;
	var days_past = 0;
	pm.setFilter(MORNING_FILTER);

	var last_timeofday = 0;

	function clock(timestamp) {
		if (!game_started_timestamp) {
			game_started_timestamp = timestamp;
		} else if( timestamp - last_timestamp > 500 ) {
			var current_day_float = (timestamp - game_started_timestamp)/CYCLE_DURATION;
			var current_day = Math.floor(current_day_float);
			var current_timeofday = numberToTimeOfDay(current_day_float - current_day);

			//last_timeofday = updateTimeOfDay(last_timeofday, current_timeofday, pm);
			last_timestamp = timestamp;

			while( days_past < current_day ){
				grow(gc, gd);
				days_past++;
			}
			updatePlanet(gd);
		}
		window.requestAnimationFrame(clock);
	}

	bring_planet_view(pm, $pmi);
	updatePlanet(gd);

	window.requestAnimationFrame(clock);

	// gd.deaths[0] = new Decimal(12);

	// var cm = new ChunkManager(gc, gd, 0);
	// for( var i = 0; i < 4; ++i ) console.log(cm.next(33));
	// var cm2 = new ChunkManager(gc, gd, 0);
	// for( var i = 0; i < 1; ++i ) console.log(cm2.next(100));

	//console.log('game data', gd);
}


$(document).ready(function(){

	$bg_interface = $('<div class="interface principal" style="width: 95vmin; height: 95vmin;"></div>');
	$('#game').append($bg_interface);

	var pm = new Polymage('assets/graphics/polys.json', 'url').ready(function( p ){
		//p.change('planet');
	});
	pm.$.addClass('principoly');
	pm.$.css({
		'width':'95vmin',
		'height':'95vmin'
	});
	$('#game').append(pm.$);

	pm.on('change', function(){
		$('#game').css('backgroundColor', pm.backgroundColor);
	});

	$pm_interface = $('<div class="interface principal" style="width: 95vmin; height: 95vmin;"></div>');
	$('#game').append($pm_interface);

	$day_night = $('<div class="daynight"><div>');
	$bg_interface.append($day_night);

	pm.ready(function(){
		startGame({pm: pm, $pmi: $pm_interface, $bgi: $bg_interface });
	});
	return;

});