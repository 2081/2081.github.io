

DX = 100;
DY = 100;
W = 4;
H = 4;
MX = 1.5;
MY = 1.5;

tile_count = 0;

bank = 0;

n_color = 5;

freeze = false;


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


board = [];
for( var i = 0; i < W+2; ++i ) board[i] = [];


selected = null;

function updateBank(){
	$('#bank').text(bank);
}

function getTile(x, y){
	if( x+1 > -1 && y+1 > -1 && x < W+2 && y < H+2 ){
		return board[x+1][y+1];
	}
	return null;
}

function setTile(x, y, value){
	if( x+1 > -1 && y+1 > -1 && x < W+2 && y < H+2 ){
		board[x+1][y+1] = value;
		if( value instanceof Tile ){
			value.x = x;
			value.y = y;
			value.update();
		}
		if( value && (x == -1 || y == -1 || x == W || y == H) ){
			setTimeout(function(){
				console.log('>>>', x,y);
				getTile(x, y).remove();
			}, 500);
		}
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

function swapTile(t1, t2){
	var x1 = t1.x, y1 = t1.y;
	var x2 = t2.x, y2 = t2.y;
	var dx = x2 - x1, dy = y2 - y1;
	// console.log(dx, dy);
	if( (dx == 0 || dy == 0) && (Math.abs(dx) == 1 || Math.abs(dy) == 1) ){
		
		setTile(x1, y1, t2);
		setTile(x2, y2, t1);



		if( !checkRoutine() ){
			setTimeout(function(){
				setTile(x1, y1, t1);
				setTile(x2, y2, t2);
			}, 600);
		}

	}
	selected.$.removeClass('selected');
	selected = null;
}

function Tile(x, y){
	this.x = x;
	this.y = y;
	this.ref = tile_count++;

	this.level = 0;
	this.gold = 0; //1*mult_bonus;
	this.experience = 0;
	this.multiplier = 1;

	this.color = Math.floor(Math.random()*n_color);

	this.mult_bonus = mult_bonus;

	var tile = $('<div class="tile"></div>');
	tile.addClass('type'+this.color);
	tile.css('transform', getTransform(x,y));
	//tile.click(this.onTileClick.bind(this));

	this.$level = $('<span data-info="level">0</span>');
	this.$resource = $('<span data-info="resource">1</span>');
	this.$pertick = $('<span data-info="pertick"></span>');
	this.$multi = $('<span data-info="multi"></span>');

	this.$ = tile;

	tile.append(this.$level).append(this.$resource).append(this.$multi);
	$('#board').append(tile);

	setTimeout(this.cycle.bind(this), 1000);
}



Tile.prototype = {
	onTileClick: function(){
		if( !freeze ){
			if( !selected ){
				selected = this;
				this.$.addClass('selected');
			} else {
				var t1 = selected, t2 = this;
				swapTile(t1, t2);
				
			}
		}
	},
	remove: function(){
		setTile(this.x, this.y, null);
		//bank += this.gold*this.multiplier;
		bank += this.experience;
		updateBank();

		this.$.css('transform', getTransform(this.x, this.y)+' scale(3,3) rotateZ(189deg)');
		this.$.css('opacity', 0);

		setTimeout(function(){
			this.$.remove();
			delete this;
		}.bind(this), 500);
	},
	move: function(dx, dy){
		setTile(this.x, this.y, null);
		this.x += dx; this.y += dy;
		setTile(this.x, this.y, this);

		this.$.css('transform', getTransform(this.x,this.y));

		if( !isInBounds(this.x, this.y) ){
			setTimeout(this.remove.bind(this), 750);
		}
	},
	cycle0: function(){

	},
	cycle: function(){
		this.experience += 1*this.mult_bonus*(this.level+1);
		var level = Math.max(Math.log(this.experience/100+1)/Math.log(2), 0),
			dl = this.experience > 100 ? level - this.level : this.experience/100;
		this.level = Math.floor(level);
		this.$level.html(this.level+'<small>('+Math.floor(dl*100)+'%)</small>' );
		this.$resource.text(Math.floor(this.experience));
		setTimeout(this.cycle.bind(this), 1000);
	},
	update: function(){
		this.$resource.text(Math.floor(this.experience));
		this.$multi.text(this.multiplier);
		if( this.multiplier > 1 ) this.$multi.addClass('visible');
		this.$.css('transform', getTransform(this.x,this.y));
	},
	get: function(dx, dy){
		return getTile(this.x+dx, this.y+dy);
	}
};



function getTransform(x, y){
	return 'translate(-50%, -50%) translate('+(x-MX)*100+'%,'+(y-MY)*100+'%) translate('+(x-MX)*1+'px,'+(y-MY)*1+'px)';
}

function parentLevelToChildLevel(n, m){
	var r = Math.random()*2.4;
	console.log(n, m, r, Math.floor((n+m+r)/2));
	return Math.floor((n+m+r)/2);
}




function onTileClick( e ){
	if( ! selected ){
		selected = $(this);
		$(this).addClass('selected');
	} else {
		var t1 = selected, t2 = $(this);
		var x1 = parseInt(t1.attr('data-x')), y1 = parseInt(t1.attr('data-y'));
		var x2 = parseInt(t2.attr('data-x')), y2 = parseInt(t2.attr('data-y'));
		var dx = x2 - x1, dy = y2 - y1;
		// console.log(dx, dy);
		if( (dx == 0 || dy == 0) && (Math.abs(dx) == 1 || Math.abs(dy) == 1) ){
			//console.log('okay');
			var last = null;
			var coords = [];
			for( var i = x2, j = y2; i < W && i >= 0 && j < H && j >= 0; i += dx, j += dy ){
				coords.push({x:i,y:j});
				// var x = i, y = j;
				// var t = getTile(x,y);
				// t.$.css('transform', getTransform(x+dx,y+dy));
				// last = t;
			}
			coords.reverse();
			for( var i = 0; i < coords.length; ++i){
				var t = getTile(x,y);
				setTile(x+dx, y+dy, t);
				t.$.css('transform', getTransform(x+dx,y+dy));
			}
			// $('.tile[data-xx][data-yy]').each(function(){
			// 	var div = $(this);
			// 	div.attr('data-x', div.attr('data-xx'));
			// 	div.attr('data-y', div.attr('data-yy'));
			// 	div.removeAttr('data-xx').removeAttr('data-yy');
			// });
			selected.removeClass('selected');
			selected = null;

			var l1 = parseInt(t1.attr('data-level')),
				l2 = parseInt(t2.attr('data-level'));

			setTimeout(function(){
				// var tile = $('<div class="tile"></div>');
				// tile.css('transform', getTransform(x2,y2));
				// tile.attr('data-x', x2);
				// tile.attr('data-y', y2);
				// var l = parentLevelToChildLevel(l1,l2);
				// tile.attr('data-level', l);
				// tile.addClass('l'+l);
				// tile.text('0');
				// tile.click(onTileClick);
				// $('body').append(tile);
				setTile(x2, y2, new Tile(x2, y2));
			}, 750);

			setTimeout(function(){
				//$('.tile[data-x="'+lastx+'"][data-y="'+lasty+'"]').remove();
			}, 650);

		} else {
			selected.removeClass('selected');
			selected = null;
		}
	}
}

function onSepClick( x, y ){
	if( !freeze ){
		freeze = true;
		var horizontal = Math.floor(x) == x;
		var x1, x2, y1, y2;
		console.log(horizontal, x, y);
		if( horizontal ){ // horizontal separator, vertical movement
			//var t;
			//while( (t = getTile() )
			for( var j = -1; j < Math.floor(y); ++j ){
				setTile(x, j, getTile(x, j+1));
			}
			for( var j = H; j > Math.ceil(y); --j){
				setTile(x, j, getTile(x, j-1));
			}
		} else {
			for( var i = -1; i < Math.floor(x); ++i ){
				setTile(i, y, getTile(i+1, y));
			}
			for( var i = W; i > Math.ceil(x); --i){
				setTile(i, y, getTile(i-1, y));
			}
		}

		setTimeout(function(){
			setTile(Math.floor(x), Math.floor(y), new Tile(0,0));
			setTile(Math.ceil(x), Math.ceil(y), new Tile(0,0));
			freeze = false;
		}, 500);	
	}
}

function checkRoutine(){
	console.log('checkRoutine');
	var tiles = checkCombinations();

	if( tiles.length > 0 ){
		freeze = true;

		tiles.map(function(t){
			t.$.css('transform', getTransform(t.x, t.y)+' scale(0.9,0.9)');
			t.$.addClass('combined');
		});

		applyMultipliers(tiles);

		setTimeout(function(){
			tiles.map(function(t){
				t.remove();
			});

			setTimeout(function(){
				gravity();
				fill();

				setTimeout(function(){
					if( !checkRoutine() ){
						freeze = false;
					}
				}, 750);
			}, 300);

		}, 1000);

		return true;
	}
	return false;
}

$(document).ready(function(){

	for( var i = 0; i < W; ++i ){
		for( var j = 0; j < H; ++j ){
			setTile(i, j, new Tile(i,j));
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

		$('#shop').append(div);
	}

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

	// setTimeout(checkRoutine, 1000);

});