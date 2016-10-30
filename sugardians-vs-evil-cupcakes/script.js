
// https://www.npmjs.com/package/ces

// Credit "Kenney.nl" or "www.kenney.nl", this is not mandatory.

// Util

(function(){

function circlesIntersect( r1, a1, radius1, r2, a2, radius2 ){

	var x1 = r1 * Math.cos(a1),
		x2 = r2 * Math.cos(a2),
		y1 = r1 * Math.sin(a1),
		y2 = r2 * Math.sin(a2);

	var d = (x2 - x1)*(x2 - x1) + (y2 - y1)*(y2 - y1);

	return d < (radius1 + radius2)*(radius1 + radius2);

}

// Components
var Sprite = CES.Component.extend({
	name: 'sprite',
	// dtan = tangent
	init: function( id, w, h, dr, dalpha, dtan, dx, dy, rotation ){
		this.id = id || '';
		this.width = w || 10;
		this.height = h || 10;
		this.dx = dx || 0;
		this.dy = dy || 0;
		this.dr = dr ||0;
		this.dalpha = dalpha || 0;
		this.dtan = dtan || 0;
		this.rotation = rotation || 0;
	}
});


var Health = CES.Component.extend({
	name: 'health',
	init: function( maxHealth ){
		this.health = this.maxHealth = maxHealth || 1;
	},
	isDead: function(){
		return this.health <= 0;
	},
	receiveDamage: function (damage) {
		this.health -= damage;
		this.health = Math.max(this.health, 0);
	}
});

var Position = CES.Component.extend({
	name: 'position',
	init: function( r, alpha ){
		this.r = r;
		this.alpha = alpha;
	}
});

var Rotation = CES.Component.extend({
	name: 'rotation',
	init: function( z ){
		this.z = z;
	}
});

var Velocity = CES.Component.extend({
	name: 'velocity',
	init: function( r, alpha ){
		this.r = r;
		this.alpha = alpha;
	}
});

var RVelocity = CES.Component.extend({
	name: 'rvelocity',
	init: function( z ){
		this.z = z;
	}
});

var Enemy = CES.Component.extend({
	name: 'enemy',
	init: function(){
	}
});

var Projectile = CES.Component.extend({
	name: 'projectile',
	init: function( owner ){
		this.owner = owner;
	}
});

var Missile = CES.Component.extend({
	name: 'missile',
	init: function( target, speed ){
		this.target = target;
	}
});

var Hitbox = CES.Component.extend({
	name: 'hitbox',
	init: function( radius ){
		this.radius = radius;
	}
});

var FireSpeed = CES.Component.extend({
	name: 'firespeed',
	init: function( cooldown ){
		this.cooldown = cooldown || 1;
		this.timestamp = 0; // piwit
	},
	fire: function( tt ){ // timestamps in seconds
		this.timestamp = tt || Date.now();
	},
	canFire: function( tt ){
		return (tt || Date.now()) - this.timestamp >= 1000*this.cooldown;
	}
});

var Target = CES.Component.extend({
	name: 'target',
	init: function(){
		this.target = null;
	},
	hasTarget: function(){
		return this.target ? true : false;
	},
	setTarget: function( target ){
		this.target = target;
	},
	removeTarget: function(){
		this.target = null;
	}
});

var FireMemory = CES.Component.extend({
	name: 'firememory',
	init: function(){
		this.enemies = [];
	},
	timesFired: function( enemy ){
		return this.enemies[enemy.id] || 0;
	},
	fire: function( enemy ){
		if( !this.enemies[enemy.id] ) this.enemies[enemy.id] = 0;
		this.enemies[enemy.id] += 1;
	},
	removeFromMemory: function( enemy ){
		delete this.enemies[enemy.id]
	}
});

var IdleStats = CES.Component.extend({
	name: 'idlestats',
	init: function(){
		this.moneyPerHit = 1;
	}
});

// Systems

var SimplePhysicsSystem = CES.System.extend({
	update: function(dt) {
		var entities, position, velocity;

		entities = this.world.getEntities('position','velocity');

		entities.forEach(function( entity ){
			position = entity.getComponent('position');
			velocity = entity.getComponent('velocity');

			position.r += velocity.r * dt / 1000;
			position.alpha += velocity.alpha * dt / 1000;
			position.alpha %= 2*Math.PI;
		});

		entities = this.world.getEntities('rotation','rvelocity');

		entities.forEach(function( entity ){
			rotation = entity.getComponent('rotation');
			rvelocity = entity.getComponent('rvelocity');

			rotation.z += rvelocity.z * dt / 1000;
			rotation.z %= 2*Math.PI;
		});
	}
});

var RepelSystem = CES.System.extend({
	update: function(dt) {
		var entities, enemy, position;

		entities = this.world.getEntities('position','enemy');

		entities.forEach(function( entity ){
			position = entity.getComponent('position');

			if( position.r < 45 ) {
				// position.r = 60; // position.r = 1.42*W/2;
				world.removeEntity(entity);

				player.getComponent('firememory').removeFromMemory(entity);

				spawnEnemy();
			} else if( position.r < 70 ) {
				// position.r = 60; // position.r = 1.42*W/2;
				// var hitbox = entity.getComponent('hitbox');
				// if( hitbox ) entity.removeComponent('hitbox');

				var rvelocity = entity.getComponent('rvelocity'),
					velocity = entity.getComponent('velocity');

				if( rvelocity ) rvelocity.z = 5;
				
				// entity.getComponent('velocity').r /= 2;
			}
		});
	}
});

var ProjectileGarbageCollectorSystem = CES.System.extend({
	update: function(dt) {
		var entities, position;

		entities = this.world.getEntities('projectile', 'position');

		entities.forEach(function( entity ){
			position = entity.getComponent('position');

			if( position.r > 600 ) {
				world.removeEntity(entity);
			}
		});

	}
});

var ProjectileCollision = CES.System.extend({
	update: function(dt) {
		var projectiles, ppos, phb,
			enemies, epos, ehb;



		projectiles = this.world.getEntities('projectile', 'position', 'hitbox');
		enemies = this.world.getEntities('enemy', 'position', 'hitbox');

		projectiles.forEach(function( projectile ){
			ppos = projectile.getComponent('position');
			phb = projectile.getComponent('hitbox');

			var hit = false;

			enemies.forEach(function( enemy ){
				if( !hit ){
					epos = enemy.getComponent('position');
					ehb = enemy.getComponent('hitbox');

					if( circlesIntersect( ppos.r, ppos.alpha, phb.radius,
										  epos.r, epos.alpha, ehb.radius ) ){

						world.removeEntity(enemy);
						player.getComponent('firememory').removeFromMemory(enemy);

						world.removeEntity(projectile);
						hit = true;

						if( MANUAL ) {
							gamedata.manualmoney += 1;
						} else {
							gamedata.money += 1;
						}

						spawnEnemy();

					}
				}
			});
		});

	}
});

var SeekTarget = CES.System.extend({
	update: function( dt ){
		if( MANUAL ){
			player.getComponent('target').removeTarget();
			return;
		}

		var enemies = this.world.getEntities('enemy','position');
		var ppos, prot, epos, da;

		var target = player.getComponent('target');
		var t = null;

		ppos = player.getComponent('position');
		prot = player.getComponent('rotation');


		// var rmin = 100000;
		// var dalpha = Math.PI;

		// enemies.forEach(function( enemy ){
		// 	epos = enemy.getComponent('position');

		// 	if( epos.r > 60 ){
		// 		da = (epos.alpha - ppos.alpha + 2*Math.PI)%2*Math.PI;

		// 		if( epos.r < rmin - 10
		// 			|| epos.r < rmin + 10 && da < dalpha ){
		// 			t = enemy;
		// 			rmin = epos.r
		// 			dalpha = da;
		// 		}
		// 	}
			
		// });

		var scores = [], score;

		var firememory = player.getComponent('firememory'),
			timesfired;

		var i = 0, j = 0;

		enemies.forEach(function( enemy ){

			timesfired = firememory.timesFired(enemy);

			epos = enemy.getComponent('position');

			score = {};
			score.enemy = enemy;

			score.alpha = 1 - Math.abs(((epos.alpha - prot.z + 2*Math.PI)%(2*Math.PI) - Math.PI)/Math.PI);

			score.radius = Math.max(0, 300 - Math.max(epos.r,60) )/300;

			score.alpha /= timesfired + 3;
			score.radius /= timesfired + 3;

			scores.push(score);

		});

		var k = scores.length;

		scores.sort(function( a, b ){
			return 1*(b.alpha - a.alpha) + 2*(b.radius - a.radius);
		});

		// if( scores.length == 0 ) console.log('no target available !!! (', i, j,k, ')');

		target.setTarget( scores.length > 0 ? scores[0].enemy : null );
	}
});

var PlayerAimSystem = CES.System.extend({
	update: function( dt ){
		if( MANUAL ) {
			player.getComponent('rvelocity').z = 0;
			return;
		}

		var target = player.getComponent('target');

		var rvelocity = player.getComponent('rvelocity');

		rvelocity.z = 0;

		if( target ) target = target.target;
		if( target ){

			var tpos = target.getComponent('position'),
				prot = player.getComponent('rotation');

			if( tpos ){
				var dalpha = (tpos.alpha - prot.z + 16*Math.PI)%(2*Math.PI) - Math.PI;

				// console.log(dalpha, tpos.alpha);
				if( Math.abs(dalpha) > 0.04 ){

					var x = Math.min(Math.abs(dalpha), 0.25);


					dalpha = dalpha < 0 ? -1 : ( dalpha > 0 ? 1 : 0 );

					rvelocity.z = dalpha * 30  * Math.max( 0.01, x * x) / 0.25;
				}
			}
		}

	}
});

var PlayerShootSystem = CES.System.extend({
	update: function( dt ){
		if( MANUAL ) return;
		var firespeed = player.getComponent('firespeed');

		var now = Date.now();
		if( firespeed.canFire( now ) ){

			// firespeed.fire();
			// fire();

			var target = player.getComponent('target').target;
			if( target ){
				var tpos = target.getComponent('position'),
					prot = player.getComponent('rotation');

				if( tpos ){
					var dalpha = (tpos.alpha - prot.z + 16*Math.PI)%(2*Math.PI) - Math.PI;

					if( Math.abs(dalpha) < 0.04 ){
						firespeed.fire();
						fire();

						player.getComponent('firememory').fire(target);
					}
				}				
			}
		}
	}
});


var upgrades = [],
	upgrades_changed = true;

function Upgrade( icon, style, name, description, price, manualprice, effect, priority ){

	this.icon 		= icon 		|| '';
	this.style 		= style 	|| '';
	this.name 		= name 		|| 'Upgrade X';
	this.price 		= price 	|| 0;
	this.manualprice = manualprice || 0;
	this.effect 	= effect 	|| function(){};
	this.priority 	= priority 	|| upgrades.length;

	this.description = description || 'No description...';

	this.bought 	= false;

	upgrades.push( this );

}

function upgradeReset(){
	player.getComponent('firespeed').cooldown = 5;
}


new Upgrade( 'blueship', 'manual', 'Basic laser', 'Doubles blue income.', 0, 50,
			 function(){
			 	console.log('heeeey');
			 } );

new Upgrade( 'greenship', 'manual', 'Advanced laser', 'Doubles blue income.', 150, 0,
			 function(){
			 	console.log('heeeey');
			 } );

new Upgrade( 'orangeship', 'manual', 'Advanced laser', 'Doubles blue income.', 150, 500,
			 function(){
			 	console.log('heeeey');
			 } );

new Upgrade( 'blueship', 'manual', 'Advanced laser', 'Doubles blue income.', 150, 500,
			 function(){
			 	console.log('heeeey');
			 } );

new Upgrade( 'orangeship', 'manual', 'Advanced laser', 'Doubles blue income.', 150, 0,
			 function(){
			 	console.log('heeeey');
			 } );

new Upgrade( 'greenship', 'manual', 'Advanced laser', 'Doubles blue income.', 150, 500,
			 function(){
			 	console.log('heeeey');
			 } );

new Upgrade( 'orangeship', 'manual', 'Advanced laser', 'Doubles blue income.', 150, 500,
			 function(){
			 	console.log('heeeey');
			 } );

new Upgrade( 'redship', 'manual', 'Advanced laser', 'Doubles blue income.', 0, 50000,
			 function(){
			 	console.log('heeeey');
			 } );

new Upgrade( 'redship', 'manual', 'Advanced laser', 'Doubles blue income.', 150, 500,
			 function(){
			 	console.log('heeeey');
			 } );

new Upgrade( 'greenship', 'manual', 'Advanced laser', 'Doubles blue income.', 150, 500,
			 function(){
			 	console.log('heeeey');
			 } );

new Upgrade( 'blueship', 'manual', 'Advanced laser', 'Doubles blue income.', 150, 0,
			 function(){
			 	console.log('heeeey');
			 } );

new Upgrade( 'redship', 'manual', 'Advanced laser', 'Doubles blue income.', 150, 500,
			 function(){
			 	console.log('heeeey');
			 } );



// world

var W = 0, H = 0;
var images = [];

var MANUAL = false;

var world = new CES.World();

world.addSystem(new SimplePhysicsSystem());
world.addSystem(new RepelSystem());
world.addSystem(new SeekTarget());
world.addSystem(new PlayerAimSystem());
world.addSystem(new PlayerShootSystem());
world.addSystem(new ProjectileCollision());
world.addSystem(new ProjectileGarbageCollectorSystem());

var player;

var gamedata = {
	money: 0,
	manualmoney: 0
};


// Draw

function remakeShop(){
	console.log('Remaking shop...', upgrades.length);
	$('#upgrade-shop *:not(.section-title)').remove();

	var shopdiv = $('#upgrade-shop');

	var ups = upgrades.slice(0);

	ups.sort(function( a, b ){ return (a.price || 0) - (b.price || 0) });

	console.log(ups.length);

	for( var i = 0; i < ups.length; ++i ){
		var up = ups[i];

		if( up.bought ){
			// add to unlocked upgrades
		} else {
			// add to shop
			var div = $('<div class="shop-entry" style="'+up.style+'">\
					<span data-icon="'+up.icon+'"></span>\
					<div class="manual-group">\
						<span class="shop-entry-price '+(up.manualprice > 0 ? '' : 'zero')+'">'+up.manualprice+'</span>\
					</div><div class="auto-group">\
						<span class="shop-entry-price '+(up.price > 0 ? '' : 'zero')+'">'+up.price+'</span>\
					</div>\
					<div class="tooltip down-arrow">\
						<span class="tooltip-item name up-name">'+up.name+'</span><br>\
						<span class="tooltip-item desc up-desc">'+up.description+'</span>\
					</div>\
				</div>')

			shopdiv.append(div);
		}
	}
}

var canvas = null;

function draw(){
	if( !canvas ) return;

	var position, x, y, dx, dy, r;
	var ctx = canvas.getContext('2d');
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	ctx.drawImage(images['blackhole'], W/2 - 70, H/2 - 70, 140, 140);

	world.getEntities('position', 'sprite').forEach(function( entity ){
		position = entity.getComponent('position');
		sprite = entity.getComponent('sprite');

		rotation = entity.getComponent('rotation');


		x = (position.r + sprite.dr) * Math.cos(position.alpha) + W/2;
		y = (position.r + sprite.dr) * Math.sin(position.alpha) + H/2;

		ctx.save();

		dx = x + sprite.dx + sprite.width/2;
		dy = y + sprite.dy + sprite.height/2;

		r = position.alpha + sprite.rotation;

		if( rotation ){
			r += rotation.z;
		}

		ctx.translate(dx, dy);
		ctx.rotate( r );
		ctx.translate(-dx, -dy);

		ctx.drawImage(images[sprite.id], x + sprite.dx, y + sprite.dy, sprite.width, sprite.height);


		ctx.restore();
	});

	if( false ) world.getEntities('position', 'hitbox').forEach(function( entity ){
		position = entity.getComponent('position');
		hitbox = entity.getComponent('hitbox');

		x = (position.r ) * Math.cos(position.alpha) + W/2;
		y = (position.r ) * Math.sin(position.alpha) + H/2;

		ctx.save();

		ctx.beginPath()
		ctx.arc( x, y, hitbox.radius, 0, 2*Math.PI )
		ctx.lineWidth = 1;
		ctx.strokeStyle = 'rgba(255,0,0,0.5)';
		ctx.stroke();

		ctx.restore();
	});

	if( true ) world.getEntities('target').forEach(function( entity ){
		target = entity.getComponent('target');

		var entity = target.target;

		if( entity ){
			var position = entity.getComponent('position');
			if( position ){

				x = (position.r ) * Math.cos(position.alpha) + W/2;
				y = (position.r ) * Math.sin(position.alpha) + H/2;

				ctx.save();

				ctx.beginPath()
				ctx.arc( x, y, 12, 0, 2*Math.PI )
				ctx.lineWidth = 1;
				ctx.strokeStyle = 'rgba(255,255,0,0.5)';
				ctx.stroke();

				ctx.restore();
			}
		}
	});

	ctx.font="20px Georgia";
	ctx.fillText(world.getEntities().length,200,50);

	$('#currency-balance').text(gamedata.money);
	$('#manual-currency-balance').text(gamedata.manualmoney);

	// $('html').css('background-color', MANUAL ? '#dcf5f4' : '#dff5dc');
}

// Events


function onMouseMoveRotatePlayer( e ){

	if( MANUAL ){
		var bcr = canvas.getBoundingClientRect();

		var dx = e.clientX - (bcr.left + canvas.width / 2);
		var dy = e.clientY - (bcr.top + canvas.height / 2);

		var r = Math.atan2(-dy, -dx)%(2*Math.PI);

		player.getComponent('rotation').z = r;
		// player.getComponent('position').alpha = r;
		
	}
	
}

function onClickShoot( e ){
	fire();
}

// actions

function spawnEnemy(){

	var special = Math.random() < 0.01;


	var enemy = new CES.Entity();
	enemy.addComponent(new Position(1.01*W/2, Math.random()*2*Math.PI));
	enemy.addComponent(new Velocity(-5 - Math.random()*10, 0.05));
	enemy.addComponent(new Rotation(Math.random()*Math.PI*2));
	enemy.addComponent(new RVelocity(0.5));
	enemy.addComponent(new Health(100));
	enemy.addComponent(new Enemy());
	enemy.addComponent(new Sprite(
		special ? 'meteorspecial' : 'meteor'+(Math.floor(Math.random()*2)+1),
		18, 18,
		0, 0, 0,
		-9, -9
	));
	enemy.addComponent(new Hitbox(9));

	world.addEntity( enemy );
}

function fire(){
	var e = new CES.Entity();

	e.addComponent(new Position(30, player.getComponent('rotation').z + Math.PI));
	e.addComponent(new Velocity(500, 0));
	e.addComponent(new Projectile( player ));
	e.addComponent(new Sprite(MANUAL ? 'manuallaser' : 'laser', 6.5, 18.5, -7, 0, 0, -3.75, -9.25, Math.PI/2));
	e.addComponent(new Hitbox(3));

	world.addEntity(e);
}


// Routine

var then = null;

function game_step( timestamp ){

	if( !then ) then = timestamp;

	world.update(timestamp - then);

	window.requestAnimationFrame(game_step);

	draw();

	if( upgrades_changed ){
		remakeShop();
		upgrades_changed = false;
	}

	then = timestamp;
}


$(document).ready(function(){

	console.log('Document ready.');

	canvas = document.getElementById('canvas');
	W = canvas.width;
	H = canvas.height;

	$('#images img').each(function(){
		images[this.id] = this;
	});

	player = new CES.Entity();
	player.addComponent(new Position(0, 0));
	player.addComponent(new Sprite('ship', 66, 37, 0, 0, 0, -33, -18, -Math.PI/2));
	player.addComponent(new Rotation(0));
	player.addComponent(new RVelocity(0));
	player.addComponent(new Target());
	player.addComponent(new FireSpeed(0.1));
	player.addComponent(new FireMemory());

	world.addEntity( player );

	for( var i = 0; i < 50; ++i ){
		spawnEnemy();
	}

	$(window).on('mousemove', onMouseMoveRotatePlayer );

	$(canvas).on('click', onClickShoot );

	$(canvas).on('mouseenter', function(){
		MANUAL = true;
		player.getComponent('sprite').id = 'manualship';
		$('html').addClass('manual');
	});
	$(canvas).on('mouseleave', function(){
		MANUAL = false;
		player.getComponent('sprite').id = 'ship';
		$('html').removeClass('manual');
	});
	

	window.requestAnimationFrame(game_step);

});

})();