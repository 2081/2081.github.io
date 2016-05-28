

DX = 100;
DY = 100;
W = 4;
H = 4;
MX = 1.5;
MY = 1.5;

tile_count = 0;


bank = 0;
hearts = 5;

banks = [0,0,0,0,0,0,0,0,0];

min_tick = 0;

n_color = 5;

freeze = false;
wrong_move = false;

kings = [null, null, null, null];


flat_bonus = 0;
mult_bonus = 1;

shop = [
	{ flat: 0, mult: 2, name: 'x2', price: 50 },
	{ flat: 0, mult: 2, name: 'x2', price: 500 },
	{ flat: 0, mult: 2, name: 'x2', price: 5000 },
	{ flat: 0, mult: 2, name: 'x2', price: 50000 },
	{ flat: 0, mult: 2, name: 'x2', price: 500000 },
	{ flat: 0, mult: 2, name: 'x2', price: 5000000 },
	{ flat: 0, mult: 2, name: 'x2', price: 50000000 }
];

var spawn_max_level = 1;
var spawn_max_level_price = 100;
var spawn_min_level = 1;
var spawn_min_level_price = 1000;

board = [];
for( var i = 0; i < W+2; ++i ) board[i] = [];


selected = null;

function updateBank(){
	//$('#bank').html(bank+'<br/><span data-res="0">'+banks[0]+'</span><span data-res="1">'+banks[1]+'</span><span data-res="2">'+banks[2]+'</span><span data-res="3">'+banks[3]+"</span>");
	//$('#bank').text(banks[0]+banks[1]+banks[2]+banks[3]);

	$('#bank').text(bank);
	$('#info-right .bank').text(banks[0]);
	$('#info-down .bank').text(banks[1]);
	$('#info-left .bank').text(banks[2]);
	$('#info-up .bank').text(banks[3]);
}

function updateTicks(){
	$('#info-right .pertick [data-base]').text(kings[0].pertick);
	$('#info-down .pertick [data-base]').text(kings[1].pertick);
	$('#info-left .pertick [data-base]').text(kings[2].pertick);
	$('#info-up .pertick [data-base]').text(kings[3].pertick);


	$('#info-right .pertick [data-final]').text(kings[0].pertick - min_tick);
	$('#info-down .pertick [data-final]').text(kings[1].pertick - min_tick);
	$('#info-left .pertick [data-final]').text(kings[2].pertick - min_tick);
	$('#info-up .pertick [data-final]').text(kings[3].pertick - min_tick);

	$('.dir-info .pertick [data-minus]').text(min_tick);
}

function updateHearts(){
	var div = $('#hearts');
	div.empty();
	for( var i = 0; i < hearts; ++i ) div.append($('<span class="heart"></span>'))
}

function getTile(x, y){
	if( x == Math.floor(x) && y == Math.floor(y) && x+1 > -1 && y+1 > -1 && x < W+2 && y < H+2 ){
		return board[x+1][y+1];
	}
	return null;
}

function setTile(x, y, value){
	if( x == Math.floor(x) && y == Math.floor(y) && x+1 > -1 && y+1 > -1 && x < W+2 && y < H+2 ){
		board[x+1][y+1] = value;
		if( value instanceof Tile ){
			value.x = x;
			value.y = y;
			value.update();
		}
		// if( value && (x == -1 || y == -1 || x == W || y == H) ){
		// 	setTimeout(function(){
		// 		console.log('>>>', x,y);
		// 		getTile(x, y).remove();
		// 	}, 500);
		// }
	}
}

function isInBounds(x, y){
	return x > -1 && x < W && y > -1 && y < H;
}

var masks = {
	H: [
		[[-2,0],[-1,0],[1,0],[2,0]],
		[[-2,0],[-1,0],[1,0]],
		[[-1,0],[ 1,0],[2,0]],
		[[-1,0],[ 1,0]]
	],
	W: [
		[[0,-2],[0,-1],[0,1],[0,2]],
		[[0,-2],[0,-1],[0,1]],
		[[0,-1],[0, 1],[0,2]],
		[[0,-1],[0, 1]],
	]
}
	

function checkCombinations(){
	var tiles_found = [];

	for( var i = 0; i < W; ++i ){
		for( var j = 0; j < H; ++j ){
			for( var group in masks ){
				for( var m in masks[group] ){
					var mask = masks[group][m];
					var t = getTile(i,j);
					if( t ){
						var ok = true;
						var tiles = [t];
						for( var k in mask ){
							var t_ = getTile(i+mask[k][0], j+mask[k][1]);
							tiles.push(t_);
							if( !t_ || t.color !== t_.color ){
								ok = false;
								break;
							}
						}
						if( ok ){
							tiles.map(function( o ){
								o['m_'+group] = o['m_'+group] ? Math.max(o['m_'+group], mask.length+1) : mask.length+1;
								if( tiles_found.indexOf(o) < 0 ) tiles_found.push(o);
							})
						}
					}
				}
			}
		}
	}

	return tiles_found;
}

function applyMultipliers( tiles ){
	tiles.map(function(t){
		var m = 1;
		for( var group in masks ){
			m *= t['m_'+group] || 1;
			delete t['m_'+group];
		}
		t.multiplier = m;
		t.update();
	});	
}

function gravity(){
	for( var i = 0; i < W; ++i ){
		var column = [];
		for( var j = 0; j < H; ++j ){
			var t = getTile(i, j);
			if( t ){
				setTile(i, j, null);
				column.push(t);
			}
		}
		while( column.length > 0 ){
			setTile(i, H-column.length, column.shift());
		}
	}
}

function fill(){
	for( var i = 0; i < W; ++i ){
		for( var j = 0; j < H; ++j ){
			if( !getTile(i,j) ){
				(function(){
					var t = new Tile(i,j);
					setTile(i, j, t);
					t.y -= 10;
					t.update();
					setTimeout(function(){
						t.y += 10;
						console.log(t.y);
						t.update();
					}, 250);
				})();
			}
		}
	}
}

function moveTile(t1, t2){
	var x1 = t1.x, y1 = t1.y;
	var x2 = t2.x, y2 = t2.y;
	var dx = x2 - x1, dy = y2 - y1;
	// console.log(dx, dy);
	if( (dx == 0 || dy == 0) && (Math.abs(dx) == 1 || Math.abs(dy) == 1) ){
		var coords = [];
		for( var i = x2, j = y2; i < W && i >= 0 && j < H && j >= 0; i += dx, j += dy ){
			coords.push(getTile(i, j));
		}
		coords.reverse();
		var to_be_deleted = null;
		for( var i = 0; i < coords.length; ++i){
			coords[i].move(dx, dy);
		}
		selected.$.removeClass('selected');
		selected = null;

		setTimeout(function(){
			setTile(x2, y2, new Tile(x2, y2));
		}, 750);

	} else {
		selected.$.removeClass('selected');
		selected = null;
	}
}

function resetTiles(){
	for( var i = 0; i < W; ++i){
		for( var j = 0; j < H; ++j){
			var t = getTile(i,j);
			if( t ){
				// t.level = 1;
				// t.pertick = 1;
				// t.update();
				t.$.css('z-index','1000');
				t.remove();
			}
			setTile(i, j, createTile(i,j));
		}
	}
}

// function swapTile(t1, t2){
// 	var x1 = t1.x, y1 = t1.y;
// 	var x2 = t2.x, y2 = t2.y;
// 	var dx = x2 - x1, dy = y2 - y1;
// 	// console.log(dx, dy);
// 	if( (dx == 0 || dy == 0) && (Math.abs(dx) == 1 || Math.abs(dy) == 1) ){
		
// 		setTile(x1, y1, t2);
// 		setTile(x2, y2, t1);



// 		if( !checkRoutine() ){
// 			setTimeout(function(){
// 				setTile(x1, y1, t1);
// 				setTile(x2, y2, t2);
// 			}, 600);
// 		}

// 	}
// 	selected.$.removeClass('selected');
// 	selected = null;
// }

function Tile(x, y){
	this.x = x;
	this.y = y;
	this.ref = tile_count++;
	this.type = 'blank';

	// this.level = 0;
	// this.gold = 0; //1*mult_bonus;
	// this.experience = 0;
	// this.multiplier = 1;

	// this.color = Math.floor(Math.random()*n_color);

	// this.mult_bonus = mult_bonus;

	var tile = $('<div class="tile"></div>');
	//tile.addClass('type'+0);
	tile.attr('data-shape','blank');
	tile.css('transform', getTransform(x,y));
	//tile.click(this.onTileClick.bind(this));

	// this.$level = $('<span data-info="level">0</span>');
	// this.$resource = $('<span data-info="resource">1</span>');
	// this.$pertick = $('<span data-info="pertick"></span>');
	// this.$multi = $('<span data-info="multi"></span>');

	this.$ = tile;

	//tile.append(this.$level).append(this.$resource).append(this.$multi);
	$('#board').append(tile);

	setTimeout(this.cycle.bind(this), 1000);

	Tile.allTiles.push(this);
}

Tile.prototype = {
	remove: function(){
		var index = Tile.allTiles.indexOf(this);
		if( index > -1 ){
			if( getTile(this.x, this.y) === this ) setTile(this.x, this.y, null);
			// bank += this.gold*this.multiplier;
			bank += this.experience || 0;
			updateBank();

			this.$.css('transform', getTransform(this.x, this.y)+' scale(3,3) rotateZ(189deg)');
			this.$.css('opacity', 0);

			setTimeout(function(){
				this.$.remove();
				delete this;
			}.bind(this), 500);

			Tile.allTiles.splice(index, 1);
		} else {
			console.log('!! Trying to remove a tile twice');
		}
		
	},
	move: function(dx, dy){
		var t = getTile(this.x+dx, this.y+dy);


		if( this === kings[this.dir] ) setTile(this.x, this.y, null);
		this.x += dx; this.y += dy;
		setTile(this.x, this.y, this);

		this.$.css('transform', getTransform(this.x,this.y));

		if( !isInBounds(this.x, this.y) && this !== kings[this.dir] ){
			setTimeout((function(){
				if( !this.onBoardEdge() ){
					this.remove();
				}
			}).bind(this), 750);
		}

		if( t && this !== kings[this.dir] ){
			if( this.type != 'blank' && this.type === t.type ){
				setTimeout((function(){
					this.merge(t);
				}).bind(this), 500);
			} else {
				t.move(dx, dy);
			}
		}
	},
	merge: function( tile ){
		tile.remove();
	},
	cycle: function(){
		// this.experience += 1*this.mult_bonus*(this.level+1);
		// var level = Math.max(Math.log(this.experience/100+1)/Math.log(2), 0),
		// 	dl = this.experience > 100 ? level - this.level : this.experience/100;
		// this.level = Math.floor(level);
		// this.$level.html(this.level+'<small>('+Math.floor(dl*100)+'%)</small>' );
		// this.$resource.text(Math.floor(this.experience));
		// setTimeout(this.cycle.bind(this), 1000);
	},
	update: function( ms ){
		// this.$resource.text(Math.floor(this.experience));
		// this.$multi.text(this.multiplier);
		// if( this.multiplier > 1 ) this.$multi.addClass('visible');
		this.$.css('transform', getTransform(this.x,this.y));
	},
	get: function(dx, dy){
		return getTile(this.x+dx, this.y+dy);
	},
	onBoardEdge: function(){
	}
};
Tile.allTiles = [];

function ProdTile(x, y){
	Tile.call(this, x, y);

	this.type = 'normal';
	this.level = spawn_min_level+Math.floor(Math.random()*(1+spawn_max_level-spawn_min_level));

	this.prod = 1;
	this.pertick = this.level;
	this.tick = 5000;

	this.time = 0;

	this.$.attr('data-shape','square');
	//this.$prod = $('<span data-info="prod">0</span>');
	this.$pertick = $('<span data-info="pertick">'+this.pertick+'</span>');
	//this.$tick = $('<span data-info="tick">'+Math.floor(this.tick/1000)+'<small>s</small></span>');
	this.$.append(this.$prod, this.$tick, this.$pertick);

}
ProdTile.prototype = Object.create(Tile.prototype, {
	update: {
		value: function( ms ){
			Tile.prototype.update.apply(this, arguments);
			// ------------------------------------------
			ms = ms || 0;
			if( isInBounds(this.x, this.y) ){
				this.time += ms*this.tick;
				var ticks = Math.floor(this.time/this.tick);
				if( ticks > 0 ){
					this.time -= ticks*this.tick;
					this.prod += ticks*this.pertick;
					// console.log('update',this.prod);
				}
			}

			//this.$prod.text(this.prod);
			this.$pertick.text(this.pertick);
			//this.$tick.html(Math.floor(this.tick/1000)+'<small>s</small>');
		}
	},
	merge: {
		value: function( tile ){
			this.prod += tile.prod;
			this.level += tile.level;
			this.pertick += tile.pertick;
			Tile.prototype.merge.apply(this, arguments);
			this.update();
		}
	},
	onBoardEdge: {
		value: function(){
			bank += this.prod || 0;
			updateBank();
		}
	}
});
ProdTile.prototype.constructor = Tile;


function DirProdTile(x, y, dir){
	ProdTile.call(this, x, y);
	// var dirs = 

	dir = typeof dir === 'number' ? dir : Math.floor(Math.random()*4);
	this.dir = dir;

	switch( dir ){
		case 0:
			this.type = 'dir-right';
			this.$.attr('data-shape','dir-right');
			break;
		case 1:
			this.type = 'dir-down';
			this.$.attr('data-shape','dir-down');
			break;
		case 2:
			this.type = 'dir-left';
			this.$.attr('data-shape','dir-left');
			break;
		case 3:
			this.type = 'dir-up';
			this.$.attr('data-shape','dir-up');
			break;
	}

	
}

DirProdTile.prototype = Object.create(ProdTile.prototype, {
	onBoardEdge: {
		value: function(){
			if( this.x < 0 && this.dir == DirProdTile.LEFT ||
				this.x >= W && this.dir == DirProdTile.RIGHT ||
				this.y < 0 && this.dir == DirProdTile.UP ||
				this.y >= H && this.dir == DirProdTile.DOWN ){
				
				// banks[this.dir] += this.prod || 0;
				// updateBank();
				// this.$.addClass('right');

				if( !kings[this.dir] || this.level > kings[this.dir].level  ){
					if(kings[this.dir]) kings[this.dir].remove();
					// hearts++;
					// updateHearts();
					kings[this.dir] = this;
					var x, y;
					switch(this.dir){
						case DirProdTile.RIGHT: x = 5; y = 1.5; break;
						case DirProdTile.DOWN: x = 1.5; y = 5; break;
						case DirProdTile.LEFT: x = -2; y = 1.5; break;
						case DirProdTile.UP: x = 1.5; y = -2; break;
					}
					this.move(x-this.x,y-this.y);

					var mt = this.pertick;
					for( var i = 0; i < 4; ++i ){
						var pt = kings[i].pertick;
						if( pt  < mt ) mt = pt;
					}
					min_tick = mt;

					updateTicks();

					return true;
				}

			} else {
				this.$.addClass('wrong');
				// wrong_move = true;
				setTimeout(resetTiles, 500);
				//hearts--;
				//updateHearts();
				//if( hearts == 0 ) $('#board').append($('<div id="game-over"></div>'));
			}
		}
	},
	merge: {
		value: function(){
			ProdTile.prototype.merge.apply(this, arguments);
			// if( this.dir == DirProdTile.RIGHT && this.level > 3 ){
			// 	this.$.addClass('heart');
			// }
		}
	}
});
DirProdTile.prototype.constructor = DirProdTile;
DirProdTile.RIGHT = 0;
DirProdTile.DOWN = 1;
DirProdTile.LEFT = 2;
DirProdTile.UP = 3;


function createTile(x, y){

	var dirs = [];
	if( x > 0 && !(x == 1 && (y == H-1 || y == 0) && getTile(x+1, y) && getTile(x+1, y).dir == DirProdTile.LEFT ) ) 	dirs.push(DirProdTile.RIGHT);
	if( x < W-1 && !(x ==2 && (y == H-1 || y == 0) && getTile(x-1, y) && getTile(x-1, y).dir == DirProdTile.RIGHT ) ) 	dirs.push(DirProdTile.LEFT);
	if( y > 0 && !(y == 1 && (x == W-1 || x == 0) && getTile(x, y+1) && getTile(x, y+1).dir == DirProdTile.UP ) )		dirs.push(DirProdTile.DOWN);
	if( y < H-1 && !(y == 2 && (x == W-1 || x == 0) && getTile(x, y-1) && getTile(x, y-1).dir == DirProdTile.DOWN ) ) 	dirs.push(DirProdTile.UP);

	var dir = dirs[Math.floor(Math.random()*dirs.length)];

	return new DirProdTile(x, y, dir);
}


function getTransform(x, y){
	return 'translate(-50%, -50%) translate('+(x-MX)*100+'%,'+(y-MY)*100+'%) translate('+(x-MX)*1+'px,'+(y-MY)*1+'px)';
}

function parentLevelToChildLevel(n, m){
	var r = Math.random()*2.4;
	console.log(n, m, r, Math.floor((n+m+r)/2));
	return Math.floor((n+m+r)/2);
}

function onSepClick( x, y ){
	if( !freeze ){
		freeze = true;
		var fx = Math.floor(x), fy = Math.floor(y), cx = Math.ceil(x), cy = Math.ceil(y);

		var dx = (2*x)%2, dy = (2*y)%2;

		getTile(fx, fy).move(-1*dx, -1*dy);
		getTile(cx, cy).move(1*dx, 1*dy);
			
		setTimeout(function(){
			Tile.allTiles.map(function(t){t.update(1)});
		}, 350);

		setTimeout(function(){
			setTile(fx, fy, createTile(fx, fy));
			setTile(cx, cy, createTile(cx, cy));

			if( wrong_move ) {
				wrong_move = false;
				resetTiles();
			}
			freeze = false;
		}, 500);	
	}
}

// function checkRoutine(){
// 	console.log('checkRoutine');
// 	var tiles = checkCombinations();

// 	if( tiles.length > 0 ){
// 		freeze = true;

// 		tiles.map(function(t){
// 			t.$.css('transform', getTransform(t.x, t.y)+' scale(0.9,0.9)');
// 			t.$.addClass('combined');
// 		});

// 		applyMultipliers(tiles);

// 		setTimeout(function(){
// 			tiles.map(function(t){
// 				t.remove();
// 			});

// 			setTimeout(function(){
// 				gravity();
// 				fill();

// 				setTimeout(function(){
// 					if( !checkRoutine() ){
// 						freeze = false;
// 					}
// 				}, 750);
// 			}, 300);

// 		}, 1000);

// 		return true;
// 	}
// 	return false;
// }

$(document).ready(function(){

	for( var i = 0; i < W; ++i ){
		for( var j = 0; j < H; ++j ){
			setTile(i, j, createTile(i,j));
		}
	}

	for( var i = 0; i < shop.length; ++i){
		var entry = shop[i];

		var div = $('<div class="shopentry">\
			<span data-info="price">'+entry.price+'</span>\
			<span data-info="name">'+entry.name+'</span>\
		</div>');
		div.shopentry = entry;

		div.click(function(){
			if( bank >= this.shopentry.price ){
				bank -= this.shopentry.price;
				updateBank();

				mult_bonus *= this.shopentry.mult;
				this.remove();
			}
		}.bind(div));

		// $('#shop').append(div);
	}


	var $maxSpawnLevel = $('<div class="shopentry">\
			<span data-info="price">'+spawn_max_level_price+'</span><br/>\
			<span data-info="name">+ Max Spawn Level (current: <span>1</span>)</span>\
		</div>');

	$('#shop').append($maxSpawnLevel);

	$maxSpawnLevel.click(function(){
		if( bank >= spawn_max_level_price ){
			bank -= spawn_max_level_price;
			spawn_max_level++;
			spawn_max_level_price *= 2;
			$(this).children('[data-info="price"]').text(spawn_max_level_price);
			$(this).find('[data-info="name"] span').text(spawn_max_level);
		}
	});

	var $minSpawnLevel = $('<div class="shopentry">\
			<span data-info="price">'+spawn_min_level_price+'</span><br/>\
			<span data-info="name">+ Min Spawn Level (current: <span>1</span>)</span>\
		</div>');

	$('#shop').append($minSpawnLevel);

	$minSpawnLevel.click(function(){
		if( bank >= spawn_min_level_price && spawn_min_level < spawn_max_level ){
			bank -= spawn_min_level_price;
			spawn_min_level++;
			spawn_min_level_price *= 2;
			$(this).children('[data-info="price"]').text(spawn_min_level_price);
			$(this).find('[data-info="name"] span').text(spawn_min_level);
		}
	});



	for( var i = 0; i < 2*W-1; ++i ){
		for( var j = 0; j < 2*H-1; ++j){
			if( (i%2 == 0 && j%2 == 1)||(i%2 == 1 && j%2 == 0)){
				(function(){

					// var horizontal = i%2 == 0;
					// var coord1 = [], coord2 = [];
					// if( horizontal ){
					// 	coord1 = [i/2, (j-1)/2], coord2 = [i/2, (j+1)/2];
					// } else {
					// 	coord1 = [(i-1)/2, j/2], coord2 = [(i+1)/2, j/2];
					// }
					var x = i/2, y = j/2;


					var div = $('<div class="separator"></div>');
					div.css('transform', getTransform(i/2, j/2) +' scale(0.71,0.71) rotateZ(45deg)');// + (i%2 == 0 ? 'scale(1,0.2) ' : 'scale(0.2,1) '));
					div.click(function(){
						onSepClick(x, y);
					});
					//div.addClass( i%2 == 0 ? 'horizontal' : 'vertical' );

					$('#board').append(div);
				})();
				
			}
			
		}
	}
	var freq = 500;
	var last = Date.now();
	function updateTiles(){
		var now = Date.now(), dt = now - last;
		Tile.allTiles.map(function(t){t.update(dt)});
		last = now;
		setTimeout(updateTiles, freq);
	}
	//setTimeout(updateTiles, freq);

	function kingsRoutine(){
		var min = banks[0];
		for( var i in kings ){
			var k = kings[i];
			if( k ) banks[i] += k.pertick;
			if( banks[i] < min ) min = banks[i];
		}
		for( var i in kings ){
			banks[i] -= min;
		}
		bank += min;
		updateBank();
		setTimeout(kingsRoutine, 3000);
	}
	kingsRoutine();

	updateBank();
	updateHearts();

	kings[DirProdTile.RIGHT] = new DirProdTile(5, 1.5, DirProdTile.RIGHT);
	kings[DirProdTile.LEFT] = new DirProdTile(-2, 1.5, DirProdTile.LEFT);
	kings[DirProdTile.UP] = new DirProdTile(1.5, -2, DirProdTile.UP);
	kings[DirProdTile.DOWN] = new DirProdTile(1.5, 5, DirProdTile.DOWN);

	for( var i = 0; i < 4; ++i ){
		kings[i].level = kings[i].pertick = 0;
		kings[i].update();
	}
	//new DirProdTile(1.5, -2, 3);

	$('#info-up').css('transform', getTransform(2.5, -2));
	$('#info-down').css('transform', getTransform(2.5, 5));
	$('#info-right').css('transform', getTransform(5, 2.5));
	$('#info-left').css('transform', getTransform(-2, 2.5));


	updateTicks();

});