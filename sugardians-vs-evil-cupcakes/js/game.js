(function(){

	var COOLDOWN_MAX = 9999,
		INITIAL_MANUAL_FIRECOOLDOWN = 0.75,
		INITIAL_IDLE_FIRECOOLDOWN = 3,
		INITIAL_MONEYPERKILL = 1;

	var IDLE_RINGCOLOR = 'rgba(128,255,0,0.4)',
		// MANUAL_RINGCOLOR = 'rgba(54,186,245,0.2)',
		MANUAL_RINGCOLOR = 'rgba(255,255,255,0.2)',
		IDLE_MONEYCOLOR = '#2fd8ff',
		MANUAL_MONEYCOLOR = '#a0e336';
	// https://www.npmjs.com/package/ces

	// Credit "Kenney.nl" or "www.kenney.nl", this is not mandatory.
	var build_date = new Date(1477840732.3217106*1000);

	(function(){
		var monthNames = ["January", "February", "March", "April", "May", "June", "July",
						  "August", "September", "October",	"November", "December"];

		var day = build_date.getDate();
		var monthIndex = build_date.getMonth();
		var year = build_date.getFullYear();
		var hour = build_date.getHours();
		var min = build_date.getMinutes();
		var sec = build_date.getSeconds();

		function numtostr( n ){
			if( n < 10 ) return '0' + n;
			return '' + n;
		}

		var strdate = '%c' + numtostr(day) + '/' + numtostr(monthIndex) + '/' + year;
		var strhour = '%c' + numtostr(hour) + ':' + numtostr(min) + ':' + numtostr(sec);

		console.log('%cGame file built on the ' + strdate + '%c at ' + strhour + '%c GMT+2',
					"background: #dcf5f4; color: blue;",
					'background: #dcf5f4; color: blue; font-weight: bold;',
					"background: #dcf5f4; color: blue;",
					'background: #dcf5f4; color: blue; font-weight: bold;' ,
					"background: #dcf5f4; color: blue;");
	})();

	// Utils
	// @include: beginning of utils.js.
	
	function getXY( r, a ){
		var ra = typeof r == 'object' ? r : {r:r, a:a};
	
		return {
			x: ra.r * Math.cos(ra.a),
			y: ra.r * Math.sin(ra.a)
		}
	}
	
	function getRA( x, y ){
		var xy = typeof x == 'object' ? x : {x:x, y:y};
	
		var r = Math.sqrt( xy.x*xy.x + xy.y*xy.y );
	
		var ra = {
			r: r,
			a: r == 0 ? 0 : Math.asin(xy.y / r)
		};
	
		if( xy.x < 0 ) ra.a = Math.PI - ra.a;
	
		ra.a = ( ra.a + 16*Math.PI)%(2*Math.PI)
	
		return ra;
	}
	
	function circlesIntersect( r1, a1, radius1, r2, a2, radius2 ){
	
		var x1 = r1 * Math.cos(a1),
			x2 = r2 * Math.cos(a2),
			y1 = r1 * Math.sin(a1),
			y2 = r2 * Math.sin(a2);
	
		var d = (x2 - x1)*(x2 - x1) + (y2 - y1)*(y2 - y1);
	
		return d < (radius1 + radius2)*(radius1 + radius2);
	
	}	
	// @include: end of utils.js.

	// Components
	// @include: beginning of Components/components.js.
	
	var Sprite = CES.Component.extend({
		name: 'sprite',
		// dtan = tangent
		init: function( id, w, h, dr, dalpha, dtan, dx, dy, rotation, autorotation ){
			this.id = id || '';
			this.width = w || 10;
			this.height = h || 10;
			this.dx = dx || 0;
			this.dy = dy || 0;
			this.dr = dr ||0;
			this.dalpha = dalpha || 0;
			this.dtan = dtan || 0;
			this.rotation = rotation || 0;
			this.autorotation = autorotation || false;
			this.opacity = 1;
		},
		copy: function(){
			return new Sprite(this.id, this.width, this.height, this.dr, this.dalpha, this.dtan, this.dx, this.dy, this.rotation);
		}
	});
	
	
	var Words = CES.Component.extend({
		name: 'words',
		init: function( params ){
			this.str = params.str + '' || '';
			this.opacity = params.opacity || 1;
			this.color = params.color || 'white';
			this.textAlign = params.textAlign || 'center';
			this.dx = params.dx || 0;
			this.dy = params.dy || 0;
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
			if( r instanceof Position ){
				this.r = r.r;
				this.alpha = r.alpha;
			} else {
				this.r = r;
				this.alpha = alpha;
			}
		},
		copy: function(){ return new Position(this) },
		xy: function(){
			return getXY( this.r, this.alpha );
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
	
	var CartesianVelocity = CES.Component.extend({
		name: 'cartesianvelocity',
		init: function( x, y ){
			this.x = x;
			this.y = y;
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
	
	var METEOR_TYPE = {
		DEFAULT: 0,
		BLUE: 1,
		GREEN: 2
	};
	
	var Meteor = CES.Component.extend({
		name: 'meteor',
		init: function( type ){
			this.setType(type);
		},
		setType: function( type ){
			this.type = type || METEOR_TYPE.DEFAULT;
		}
	});
	
	var Player = CES.Component.extend({
		name: 'player',
		init: function( params ){
			this.mode = params.mode || 'idle';
			this.onKill = params.onKill || function(){};
			this.moneyColor = params.moneyColor || 'yellow';
	
			//
			this.moneyPerKill = params.moneyPerKill || 0;
			this.blueMeteorFireNumber = params.blueMeteorFireNumber || 0;
		},
		kill: function(){
			this.onKill( this.moneyPerKill );
			return this.moneyPerKill;
		},
		isManual: function(){ return this.mode === 'manual' },
		isIdle: function(){ return this.mode === 'idle' }
	});
	
	var Status = CES.Component.extend({
		name: 'status',
		init: function(){
			this.disabled = false;
		},
		isDisabled: function(){
			return this.disabled;
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
			this.timestamp = Date.now(); // piwit
		},
		fire: function( tt ){ // timestamps in seconds
			this.timestamp = tt || Date.now();
		},
		canFire: function( tt ){
			return (tt || Date.now()) - this.timestamp >= 1000*this.cooldown;
		},
		getPercentReload: function(){
			return Math.max(0, Math.min(1, (Date.now() - this.timestamp)/(1000*this.cooldown)));
		}
	});
	
	var FireSpeedRing = CES.Component.extend({
		name: 'firespeedring',
		init: function( color, radius, linewidth ){
			this.color = color || 'green';
			this.radius = radius || 15;
			this.linewidth = linewidth || 5;
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
	
	var Alive = CES.Component.extend({
		name: 'alive',
		init: function( t ){
			this.birthtime = t || Date.now();
		}
	});
	
	var Dead = CES.Component.extend({
		name: 'dead',
		init: function( t ){
			this.deathtime = t || Date.now();
		}
	});
	
	var DelayedRemoval = CES.Component.extend({
		name: 'delayedremoval',
		init: function( duration ){
			this.duration = duration;
			this.createdTime = Date.now();
		},
		isPast: function( now ){
			return (now || Date.now()) - this.createdTime >= this.duration;
		}
	});
	
	var FadeOut = CES.Component.extend({
		name: 'fadeout',
		init: function( duration, delay ){
			this.duration = duration;
			this.delay = delay || 0;
			this.createdTime = Date.now();
		},
		getFade: function( now ){
			return 1 - Math.min(1, Math.max(0, ((now || Date.now()) - this.delay - this.createdTime)/this.duration));
		}
	});	
	// @include: end of Components/components.js.

	// Systems
	// @include: beginning of Systems/systems.js.
	
	
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
	
			entities = this.world.getEntities('position','cartesianvelocity');
	
			var xy, ra;
			entities.forEach(function( entity ){
				position = entity.getComponent('position');
				velocity = entity.getComponent('cartesianvelocity');
	
				xy = getXY( position.r, position.alpha );
	
				xy.x += velocity.x * dt / 1000;
				xy.y += velocity.y * dt / 1000;
	
				// console.log(velocity.y, xy.y);
	
				ra = getRA( xy );
	
				position.r = ra.r;
				position.alpha = ra.a ;
	
				// position.r += velocity.r * dt / 1000;
				// position.alpha += velocity.alpha * dt / 1000;
				// position.alpha %= 2*Math.PI;
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
	
			entities = this.world.getEntities('position','alive','enemy');
	
			entities.forEach(function( entity ){
				position = entity.getComponent('position');
	
				if( position.r < 45 ) {
					// position.r = 60; // position.r = 1.42*W/2;
					//world.removeEntity(entity);
					entity.addComponent(new Dead());
	
					player.getComponent('firememory').removeFromMemory(entity);
	
				} else if( position.r < 70 ) {
					// position.r = 60; // position.r = 1.42*W/2;
					// var hitbox = entity.getComponent('hitbox');
					// if( hitbox ) entity.removeComponent('hitbox');
	
					var rvelocity = entity.getComponent('rvelocity'),
						velocity = entity.getComponent('velocity');
	
					if( rvelocity ) rvelocity.z = 3;
					
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
			var meteor, player;
	
	
	
			projectiles = this.world.getEntities('projectile', 'position', 'hitbox');
			enemies = this.world.getEntities('enemy','alive', 'position', 'hitbox');
	
			projectiles.forEach(function( projectile ){
				ppos = projectile.getComponent('position');
				phb = projectile.getComponent('hitbox');
	
				var hit = false;
	
				enemies.forEach(function( enemy ){
					if( !hit && !enemy.hasComponent('dead') ){ // the list isn't updated, we don't wanna hit the same twice
						epos = enemy.getComponent('position');
						ehb = enemy.getComponent('hitbox');
	
						if( circlesIntersect( ppos.r, ppos.alpha, phb.radius,
											  epos.r, epos.alpha, ehb.radius ) ){
	
							meteor = enemy.getComponent('meteor'); 
	
							// world.removeEntity(enemy);
							enemy.addComponent(new Dead());
							// enemy._dead = true;
	
							world.removeEntity(projectile);
							hit = true;
	
							// if( MANUAL ) {
							// 	gamedata.manualmoney += player.getComponent('manualstats').moneyPerKill;
							// } else {
							// 	gamedata.money += player.getComponent('idlestats').moneyPerKill;;
							// }
							var proj = projectile.getComponent('projectile');
							if( proj.owner && proj.owner.getComponent ){
								var player = proj.owner;
								if( player ){
	
									var p = player.getComponent('player');
	
									if( meteor && meteor.type == METEOR_TYPE.BLUE ) echoFireCircle( epos, projectile );
	
									player.getComponent('firememory').removeFromMemory(enemy);
									var money = p.kill();
	
									var wordsEntity = new CES.Entity();
									wordsEntity.addComponent( epos.copy() );
									wordsEntity.addComponent( new Words( {str: money, color: p.moneyColor, dy: -10 } ) );
									wordsEntity.addComponent( new CartesianVelocity( 0, -50 ) );
									wordsEntity.addComponent( new DelayedRemoval(750) );
									wordsEntity.addComponent( new FadeOut(500, 250) );
	
									world.addEntity( wordsEntity );
	
								}
							}
	
						}
					}
				});
			});
	
		}
	});
	
	var SeekTarget = CES.System.extend({
		update: function( dt ){
			// if( MANUAL ){
			// 	player.getComponent('target').removeTarget();
			// 	return;
			// }
	
			var world = this.world;
	
			var players = world.getEntities('player', 'target');
	
			players.forEach(function( player ){
	
				if( player.getComponent('status').isDisabled() ){
					player.getComponent('target').removeTarget();
				} else {
	
					var enemies = world.getEntities('enemy','alive','position');
					var ppos, prot, epos, da;
	
					var target = player.getComponent('target');
					var t = null;
	
					ppos = player.getComponent('position');
					prot = player.getComponent('rotation');
	
					var scores = [], score;
	
					var firememory = player.getComponent('firememory'),
						timesfired;
	
					var i = 0, j = 0;
	
					enemies.forEach(function( enemy ){
	
						timesfired = firememory.timesFired(enemy);
	
						epos = enemy.getComponent('position');
						if( epos.r > 180 ) return;
	
						score = {};
						score.enemy = enemy;
	
						score.alpha = 1 - Math.abs(((epos.alpha - prot.z + 2*Math.PI)%(2*Math.PI) - Math.PI)/Math.PI);
	
						score.radius = Math.max(0, 300 - Math.max(epos.r,60) )/300;
	
						score.alpha /= timesfired + 3;
						score.radius /= timesfired + 3;
	
						if( enemy.hasComponent('meteor') && enemy.getComponent('meteor').type == METEOR_TYPE.BLUE ){
							score.alpha *= 0.7;
							score.radius *= 0.7;
						}
	
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
	
			
		}
	});
	
	var PlayerAimSystem = CES.System.extend({
		update: function( dt ){
	
			var world = this.world;
			var players = world.getEntities('player', 'target');
	
			players.forEach(function( player ){
	
				if( player.getComponent('status').isDisabled() ){
					player.getComponent('rvelocity').z = 0;
	
				} else {
	
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
	
		}
	});
	
	var PlayerShootSystem = CES.System.extend({
		update: function( dt ){
	
			var world = this.world;
			var players = world.getEntities('player');
	
			players.forEach(function( player ){
				if( !player.getComponent('status').isDisabled() ){
					var firespeed = player.getComponent('firespeed');
	
					var now = Date.now();
					if( firespeed.canFire( now ) ){
	
						// firespeed.fire();
						// fire();
	
						var target = player.getComponent('target');
						var condition = true;
	
						if( target ){
	
							target = target.target;
							if( target ){
	
								var tpos = target.getComponent('position'),
									prot = player.getComponent('rotation');
	
								if( tpos ){
									var dalpha = (tpos.alpha - prot.z + 16*Math.PI)%(2*Math.PI) - Math.PI;
	
									condition = Math.abs(dalpha) < 0.04;
									// if( Math.abs(dalpha) < 0.04 ){
									// 	firespeed.fire();
									// 	fire( player );
									// 	player.getComponent('firememory').fire(target);
									// }
								}			
								
							} else {
								condition = false;
							}
						}
	
						if( condition ){
							fire( player );
							var firememory = player.getComponent('firememory');
							if( firememory && typeof target == 'object' ) firememory.fire(target);
						}
					}
				}
			});
		}
	});
	
	
	// var MeteorRespawn = CES.System.extend({
	// 	addedToWorld: function( world ){
	// 		world.entityRemoved('enemy', 'meteor').add(function(entity) {
	// 	    	spawnEnemy();
	// 	    });
	// 	    this._super(world);
	// 	},
	
	// 	update: function(){}
	
	// });
	
	var DeadEnemiesSystem = CES.System.extend({
		addedToWorld: function( world ){
			world.entityAdded('enemy', 'dead').add(function( entity ) {
				entity.removeComponent('alive');
		    	entity.removeComponent('velocity');
		    	entity.removeComponent('cartesianvelocity');
		    	entity.getComponent('rvelocity').z = 10;
	
		    	spawnEnemy();
		    });
		    this._super(world);
		},
	
		update: function(){
			var now = Date.now();
			var entities = this.world.getEntities('enemy', 'dead').forEach(function( entity ){
	
				var dt = (now - entity.getComponent('dead').deathtime)/375;
	
				if( dt > 1 ){
					world.removeEntity(entity);
				} else {
					if( entity.hasComponent('sprite') ){
						entity.getComponent('sprite').opacity = 1 - dt;
					}
				}
			});
		}
	});
	
	var DelayedRemovalSystem = CES.System.extend({
		update: function(){
			var now = Date.now(),
				delayedremoval,
				world = this.world;
	
	
			var entities = this.world.getEntities('delayedremoval').forEach(function( entity ){
	
				delayedremoval = entity.getComponent('delayedremoval');
	
				if( delayedremoval.isPast() ){
					world.removeEntity(entity);
				}
	
			});
		}
	});
	
	var FadingSystem = CES.System.extend({
		update: function(){
			var now = Date.now();
	
			this.world.getEntities('fadeout', 'words').forEach(function( entity ){
				entity.getComponent('words').opacity = entity.getComponent('fadeout').getFade( now );
			});
			this.world.getEntities('fadeout', 'sprite').forEach(function( entity ){
				entity.getComponent('sprite').opacity = entity.getComponent('fadeout').getFade( now );
			});
		}
	});
	
	// @include: end of Systems/systems.js.

	// @include: beginning of upgrades.js.
	
	
	var upgrades = [],
		upgrades_byid = [],
		upgrades_changed = false,
		upgrades_forceRefresh = false;
		upgrades_buyintents = [];
	
	function Upgrade( id, params ){ //id, icon, target, name, description, price, manualprice, requirements, effect, priority ){
	
	
	
		if( !id || id == '' ) console.warn('Invalid upgrade id:', id); // @DEBUG
		if( upgrades_byid[id] ) console.warn('Upgrade id already in use: ', id); //@DEBUG
		this.id 		= id 		|| '';
		this.icon 		= params.icon 		|| '';
		this.target 	= params.target 	|| '';
		this.name 		= params.name 		|| 'Upgrade X';
	
		var idleprice = params.idleprice || 0,
			manualprice = params.manualprice || 0;
	
		var fip = typeof idleprice == 'function' ? idleprice : function(){ return idleprice },
			fmp = typeof manualprice == 'function' ? manualprice : function(){ return manualprice };
	
		this.price 		= function(){ return Math.floor(fip(this.bought + 1)) }.bind(this);
		this.manualprice 		= function(){ return Math.floor(fmp(this.bought + 1)) }.bind(this);
	
		this.depth		= params.depth || 1;
	
		this.requires = params.requires || function(){ return true };
		this.requires = this.requires instanceof Array ? this.requires : [this.requires];
	
		this.effect 	= params.effect 	|| function(){};
		this.replaces	= params.replaces	|| null;
	
		this.priority 	= params.priority 	|| upgrades.length;
	
		this.description = params.description || 'No description...';
	
		this.bought 	= 0;
	
		upgrades.push( this );
		upgrades_byid[id] = this;
	
	}
	
	function upCheckTemplate( str ){ return function(){ return upgrades_byid[str].bought; } };
	
	// function upgradeReset(){
	// 	player.getComponent('firespeed').cooldown = 5;
	// }
	
	
	
	// var IdleStats = CES.Component.extend({
	// 	name: 'idlestats',
	// 	init: function(){
	// 		this.moneyPerKill = 0;
	// 		// this.firecooldown = +Infinity;
	// 	}
	// });
	
	// var ManualStats = CES.Component.extend({
	// 	name: 'manualstats',
	// 	init: function(){
	// 		this.moneyPerKill = 0;
	// 		// this.firecooldown = +Infinity;
	// 	}
	// });
	
	
	var UpgraderSystem = CES.System.extend({
		update: function( dt ){
			if( upgrades_buyintents.length > 0 ){
	
				upgrades_buyintents.map( function( id ){
	
					var up = upgrades_byid[id];
					if( up && up.bought < up.depth ){
						console.log('New buy intent : ', up.id);
						if( debit(up.price(up.bought+1), up.manualprice(up.bought+1)) ){
							up.bought += 1;
							upgrades_changed = true;
							console.log('Bought : ', up.id);
						}
					}
	
				});
	
				upgrades_buyintents = [];
			}
			if( upgrades_changed ){
	
				var cmpts, ups, play, firespeed;
	
				// getting upgrades and sorting them by computation priority
				ups = upgrades.slice(0);
				ups.sort(function( a, b ){ return (a.priority || 0) - (b.priority || 0) });
	
				this.world.getEntities('player').forEach(function( player ){
	
					playerInfo = player.getComponent('player');
					firespeed = player.getComponent('firespeed');
	
					cmpts = {
						player: playerInfo,
						firespeed: firespeed
					};
	
					// Common
					playerInfo.moneyPerKill = INITIAL_MONEYPERKILL;
					playerInfo.blueMeteorFireNumber = 0;
	
					// manual
					if( playerInfo.isManual() ){
						firespeed.cooldown = INITIAL_MANUAL_FIRECOOLDOWN;
	
					}
					// idle
					else if ( playerInfo.isIdle() ){
						firespeed.cooldown = COOLDOWN_MAX + 1;
					}
	
					ups.map(function( up ){
						if( up.bought && up.target.indexOf(cmpts.player.mode) > -1 ) up.effect(cmpts, up.bought);
					});
				});
	
				console.log('updgrades updated.');
	
				remakeUpgrades();
				upgrades_changed = false;
			}
	
		}
	});
	
	var UpgradeShopRefreshSystem = CES.System.extend({
		update: function( dt ){
			this.last = (this.last || -3000);
			this.now = (this.now || 0) + dt;
	
			if( upgrades_forceRefresh || this.now - this.last > 500 ){
			
				$('#upgrade-shop [data-upgrade-id]').each(function(){
					var id = this.getAttribute('data-upgrade-id'),
						up = upgrades_byid[id];
					if( up ){
						$(this).toggleClass('overpriced', !canBuy(up) );
						$(this).toggleClass('overpriced-idle', !canBuyIdle(up.price()) );
						$(this).toggleClass('overpriced-manual', !canBuyManual(up.manualprice()) );
					}
				});
	
				upgrades_forceRefresh = false;
				this.last = this.now;
			}
		}
	});
	
	new Upgrade( 'blueplayer',  {
		icon:'0002',
		target:'manual',
		name:'Blue Sugardian',
		description:'The <strong class="blue">Blue Sugardian</strong> will appear when your <strong class="tech">cursor</strong> is <strong class="tech">over</strong> the battlefield and it will start shooting in the direction of the cursor.\
		<br>Enemies vaporized with its lasers will earn you <strong class="blue">blue sugarpoints</strong>.',
	}).bought++;
	
	new Upgrade( 'greenplayer',  {
		icon:'0003',
		target:'idle',
		name:'Green Sugardian',
		description:'The <strong class="green">Green Sugardian</strong> will appear when your <strong class="tech">cursor</strong> is <strong class="tech">out</strong> of the battlefield and it will start shooting on its own.\
		<br>Enemies vaporized with its lasers will earn you <strong class="green">green sugarpoints</strong>.\
		<br>It doesn\'t know yet how to shoot though.',
	}).bought++;
	
	
	new Upgrade( 'unlockidle',  {
		icon:'0007',
		target:'idle',
		name:'Green Laser',
		description:'The <strong class="green">Green Sugardian</strong> starts firing <strong class="value">once</strong> every <strong class="value">3</strong> seconds.',
		manualprice: 10,
		effect: function( cmpts ){
			cmpts.firespeed.cooldown = INITIAL_IDLE_FIRECOOLDOWN;
		}
	});
	
	new Upgrade( 'nutella', {
		icon:'0005',
		target:'manual',
		name:'Deep Space Blues',
		description:'Doubles the amount of <strong class="tech">Sugarpoints</strong> earned by the <strong class="blue">Blue Sugardian</strong>.',
		depth: 30,
		requires: 'unlockidle',
		idleprice: function( rank ){ return 30*Math.pow(2.1,rank-1) },
		// idleprice: function( rank ){ return 30*Math.pow(1.8, rank-1) },
		effect: function( cmpts, rank ){
			cmpts.player.moneyPerKill *= Math.pow(2, rank);
		}
	});
	
	new Upgrade( 'mrpropre', {
		icon: '0006',
		target: 'idle',
		name: 'Grinning Void',
		description: 'Doubles the amount of <strong class="tech">Sugarpoints</strong> earned by the <strong class="green">Green Sugardian</strong>.',
		depth: 20,
		requires: 'unlockidle',
		manualprice: function( rank ){ return 100*Math.pow(2.6, rank-1) },
		// manualprice: function( rank ){ return 100*Math.pow(2.8, rank-1) },
		effect: function( cmpts, rank ){
		 	cmpts.player.moneyPerKill *= Math.pow(2, rank);
		}
	});
	
	// new Upgrade( 'goyave', {
	// 	icon: 'manual-currency',
	// 	target: 'manual',
	// 	name: 'Advanced laser',
	// 	description: 'Doubles blue income.',
	// 	idleprice: 50,
	// 	requires: 'nutella',
	// 	effect: function( cmpts ){
	// 		cmpts.player.moneyPerKill *= 2;
	// 	}
	// });
	
	
	new Upgrade('concombre', {
		icon: '0004',
		target: 'idle',
		name: 'Higher Glucemia',
		description: 'Increases the <strong class="green">Green Sugardian</strong>\'s <strong class="tech">attack speed</strong> by <strong class="value">10%</strong> per level.',
		requires: 'unlockidle',
		idleprice: function( rank ){ return 10*Math.pow(1.5, rank-1) },
		manualprice: function( rank ){ return 10*Math.pow(1.5, rank-1) },
		depth: 35,
		effect: function( cmpts, rank ){
			cmpts.firespeed.cooldown *= Math.pow(0.9, rank);
		}
	});
	
	// new Upgrade( 'papaye', {
	// 	icon: 'greenship',
	// 	target: 'idle',
	// 	name: 'Advanced laser',
	// 	description: 'Increases green attack speed by 100%.',
	// 	idleprice: 5, 
	// 	manualprice: 20,
	// 	requires: 'citrouille',
	// 	effect: function( cmpts ){
	// 		cmpts.firespeed.cooldown /= 2;
	// 	}
	// });
	
	// new Upgrade( 'pomme', {
	// 	icon: 'greenship',
	// 	target: 'idle',
	// 	name: 'Advanced laser',
	// 	description: 'Increases green attack speed by 50%.', 
	// 	idleprice: 20,
	// 	manualprice: 30,
	// 	requires: 'papaye',
	// 	effect: function( cmpts ){
	// 		cmpts.firespeed.cooldown /= 1.5;
	// 	}
	// });
	
	// /// ATTACK SPEED
	
	
	
	// //// BLUE METEOR FIRE NUMBER
	new Upgrade( 'bluemeteor', {
		icon: '0001',
		target: 'manual',
		name: 'Bouncy Blue',
		description: 'Hitting a <strong class="blue">Blue Cupcake</strong> with a <strong class="blue">blue laser</strong> will set off <strong class="value">3</strong> <strong class="tech">Echo Lasers</strong>.',
		effect: function(cmpts){
			cmpts.player.blueMeteorFireNumber = 3;
		}
	}).bought = 1;
	
	new Upgrade( 'bluemeteorechofire', {
		icon: '0008',
		target: 'manual',
		name: 'Sweet Bounciness',
		description: '<strong class="value">One</strong> more <strong class="tech">Echo Laser</strong> per <strong class="blue">Blue Cupcake</strong>.',
		depth: 9,
		idleprice: function( rank ){ return Math.pow(10, rank) },//_tmp_prices[i][0],
		manualprice: function( rank ){ return Math.pow(10, rank) }, //_tmp_prices[i][1],
		requires: ['bluemeteor', 'unlockidle'],
		effect: function(cmpts, rank){
			cmpts.player.blueMeteorFireNumber += rank;
		}
	});	
	
	// var _tmp_prices = [[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]];
	
	// for( var i = 0; i < 12; ++i){
	// 	new Upgrade( 'bluemeteor'+(i+1), {
	// 		icon: 'bluemeteor',
	// 		target: 'manual',
	// 		name: 'Bounciness refinement '+['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'][i],
	// 		description: 'One more blue echo laser.',
	// 		idleprice: Math.pow(10, i+1),//_tmp_prices[i][0],
	// 		manualprice: Math.pow(10, i+1), //_tmp_prices[i][1],
	// 		requires: 'bluemeteor'+i,
	// 		effect: function(cmpts){
	// 			cmpts.player.blueMeteorFireNumber += 1;
	// 		}
	// 	});	
	// }
	
	
	function onUpgradeEntryClick( e ){
		var id = $(this).attr('data-upgrade-id') || null;
		if( id ){
			upgrades_buyintents.push( id );
		}
	}
	
	function remakeUpgrades(){
		console.log('Remaking shop...', upgrades.length);
		$('#upgrade-shop *:not(.section-title)').remove();
	
		var shopdiv = $('#upgrade-shop');
	
		var ups = upgrades.slice(0);
	
		ups.sort(function( a, b ){ return ((a.price() + a.manualprice())|| 0) - ((b.price() + b.manualprice())|| 0) });
	
		for( var i = 0; i < ups.length; ++i ){
			var up = ups[i];
	
			if( up.bought < up.depth ){
	
				var requirements = true;
				up.requires.map(function( r ){
					switch( typeof r ){
						case 'string':
							requirements = requirements && upgrades_byid[r].bought;
							break;
						case 'function':
							requirements = requirements && r();
							break;
					}
				});
	
				if( requirements ) {
					// add to shop
	
					// <span class="noselect" data-icon="'+up.icon+'">\
					// 	<span class="rank">'+ (up.depth > 1 ? (up.bought+1) :'')+'</span>\
					// </span>\
	
					var div = $('<div class="shop-entry" data-upgrade-id="'+up.id+'">\
							<div class="shop-entry-icon-holder">\
								<span class="noselect" data-icon="'+up.icon+'">\
									<span class="rank">'+ (up.depth > 1 ? (up.bought+1) :'')+'</span>\
								</span>\
							</div>\
							<div class="manual-group noselect">\
								<span class="shop-entry-price '+(up.manualprice() > 0 ? '' : 'zero')+'">'+up.manualprice()+'</span>\
							</div><div class="idle-group noselect">\
								<span class="shop-entry-price '+(up.price() > 0 ? '' : 'zero')+'">'+up.price()+'</span>\
							</div>\
							<div class="tooltip left right-arrow noselect">\
								<span class="tooltip-item name up-name">'+up.name+ (up.depth > 1 ? ' ('+(up.bought+1)+'/'+up.depth+')':'')+'</span><br>\
								<span class="tooltip-item desc up-desc">'+up.description+'</span>\
							</div>\
						</div>')
	
					div.on('click', onUpgradeEntryClick);
	
					shopdiv.append(div);
				}
			}
		}
	
		$('#upgrade-owned *:not(.section-title)').remove();
		var owneddiv = $('#upgrade-owned');
		// TODO: another sorting method
		ups.sort(function( a, b ){ return ((a.price() + a.manualprice())|| 0) - ((b.price() + b.manualprice())|| 0) });
	
		for( var i = 0; i < ups.length; ++i ){
			var up = ups[i];
	
			// <span class="noselect" data-icon="'+up.icon+'">\
			// 	<span class="rank">'+ (up.depth > 1 ? (up.bought) :'')+'</span>\
			// </span>\
	
			if( up.bought ){
				var div = $('<div class="shop-entry" data-upgrade-id="'+up.id+'" style="'+up.style+'">\
						<div class="shop-entry-icon-holder">\
							<span class="noselect" data-icon="'+up.icon+'">\
								<span class="rank">'+ (up.depth > 1 ? (up.bought) :'')+'</span>\
							</span>\
						</div>\
						<div class="tooltip right left-arrow noselect">\
							<span class="tooltip-item name up-name">'+up.name+ (up.depth > 1 ? ' ('+up.bought+'/'+up.depth+')':'')+'</span><br>\
							<span class="tooltip-item desc up-desc">'+up.description+'</span>\
						</div>\
					</div>')
	
				div.on('click', onUpgradeEntryClick);
	
				owneddiv.append(div);
			}
		}
	
		upgrades_forceRefresh = true;
	
	}	
	// @include: end of upgrades.js.

	var statistics = {};
	// @include: beginning of statistics.js.
	
	(function(){
	
		statistics = statistics || {};
		var s = statistics ;
	
		s.game = {
			manualmoneyearned : 0,
			idlemoneyearned : 0,
			clicks : 0,
			enemieshit : 0
		};
	
		s.at = {
			manualmoneyearned : 0,
			idlemoneyearned : 0,
			clicks : 0,
			enemieshit : 0
		};
	
	
	
		console.log('statistics.js loaded.'); //@DEBUG
	})();	
	// @include: end of statistics.js.


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

	world.addSystem(new FadingSystem());

	world.addSystem(new DeadEnemiesSystem());
	world.addSystem(new DelayedRemovalSystem());
	// world.addSystem(new MeteorRespawn());

	world.addSystem(new UpgraderSystem());
	world.addSystem(new UpgradeShopRefreshSystem());

	var player, playermanual;

	var gamedata = {
		money: 0,
		manualmoney: 0
	};

	function canBuyIdle( idlemoney ){ return gamedata.money >= idlemoney; }
	function canBuyManual( manualmoney ){ return gamedata.manualmoney >= manualmoney; }

	function canBuy( idlemoney, manualmoney ){
		if( idlemoney instanceof Upgrade ) return canBuy( idlemoney.price(), idlemoney.manualprice() );
		return canBuyIdle(idlemoney) && canBuyManual(manualmoney);
	}

	function debit( idlemoney, manualmoney ){
		if( canBuy(idlemoney, manualmoney) ){
			gamedata.money -= idlemoney;
			gamedata.manualmoney -= manualmoney;
			return true;
		}
		return false;
	}


	// Draw

	var canvas = null;
	var toggleReloadIndicator = false;

	function draw(){
		if( !canvas ) return;

		var position, sprite, status,
			x, y, dx, dy, r;
		var ctx = canvas.getContext('2d');
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// ctx.drawImage(images['blackhole'], W/2 - 70, H/2 - 70, 140, 140);

		world.getEntities('position', 'sprite').forEach(function( entity ){

			status = entity.getComponent('status');
			if( status && status.isDisabled() ) return;

			position = entity.getComponent('position');
			sprite = entity.getComponent('sprite');

			rotation = entity.getComponent('rotation');


			x = (position.r + sprite.dr) * Math.cos(position.alpha) + W/2;
			y = (position.r + sprite.dr) * Math.sin(position.alpha) + H/2;

			ctx.save();

			dx = x + sprite.dx + sprite.width/2;
			dy = y + sprite.dy + sprite.height/2;

			r = ( sprite.autorotation ? position.alpha : 0 ) + sprite.rotation;

			if( rotation ){
				r += rotation.z;
			}

			ctx.translate(dx, dy);
			ctx.rotate( r );
			ctx.translate(-dx, -dy);

			ctx.globalAlpha = sprite.opacity;

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

		if( false ) world.getEntities('target').forEach(function( entity ){
			target = entity.getComponent('target');

			var entity = target.target;

			if( entity ){
				var position = entity.getComponent('position');
				if( position ){

					x = (position.r ) * Math.cos(position.alpha) + W/2;
					y = (position.r ) * Math.sin(position.alpha) + H/2;

					var hitbox = entity.getComponent('hitbox');
					if( hitbox ) hitbox = hitbox.radius;

					ctx.save();

					ctx.beginPath()
					ctx.arc( x, y, hitbox || 12, 0, 2*Math.PI )
					ctx.lineWidth = 1;
					ctx.strokeStyle = 'rgba(255,255,0,0.5)';
					ctx.stroke();

					ctx.restore();
				}
			}
		});

		if( true ) world.getEntities('words', 'position').forEach(function( entity ){
			var words = entity.getComponent('words'),
				position = entity.getComponent('position'),
				xy = position.xy();

			ctx.font="16px Calibri";
			ctx.fillStyle = words.color;
			ctx.globalAlpha = words.opacity;
			ctx.textAlign = words.textAlign;
			ctx.fillText( words.str, xy.x + W/2 + words.dx, xy.y + H/2 + words.dy);
			// console.log( xy );

			// ctx.font="30px Verdana";
			// // Create gradient
			// var gradient=ctx.createLinearGradient(0,0,c.width,0);
			// gradient.addColorStop("0","magenta");
			// gradient.addColorStop("0.5","blue");
			// gradient.addColorStop("1.0","red");
			// // Fill with gradient
			// ctx.fillStyle=gradient;
			// ctx.fillText("Big smile!",10,90);

		});
		ctx.globalAlpha = 1;

		if( true ) world.getEntities('firespeed', 'firespeedring').forEach(function( entity ){


			var firespeed = entity.getComponent('firespeed'),
				fpr = entity.getComponent('firespeedring');

			// var dr = 1000*(Date.now() - firespeed.timestamp)/firespeed.cooldown;
			var x = 1 - firespeed.getPercentReload(),
				alpha = x * Math.PI * 2
				origin = -Math.PI/2;

			if( x != 0 && firespeed.cooldown <= COOLDOWN_MAX && firespeed.cooldown > 0.3 ) {
				ctx.save();

				ctx.beginPath()

				ctx.arc( W/2, H/2, fpr.radius, Math.PI*2 - alpha + origin, origin );

				ctx.lineWidth = fpr.linewidth;
				ctx.strokeStyle = fpr.color;
				ctx.stroke();

				ctx.restore();
			}

			
		});


		// ctx.font="20px Georgia";
		// ctx.fillStyle = 'green';
		// ctx.fillText(world.getEntities().length,220,60);

		$('#currency-balance').text(gamedata.money);
		$('#manual-currency-balance').text(gamedata.manualmoney);

		// $('html').css('background-color', MANUAL ? '#dcf5f4' : '#dff5dc');
	}

	// Events


	function onMouseMoveRotatePlayer( e ){

		// if( MANUAL ){
			var bcr = canvas.getBoundingClientRect();

			var dx = e.clientX - (bcr.left + canvas.width / 2);
			var dy = e.clientY - (bcr.top + canvas.height / 2);

			var r = Math.atan2(-dy, -dx)%(2*Math.PI);

			playermanual.getComponent('rotation').z = r;
			// player.getComponent('position').alpha = r;
			
		// }
		
	}

	// function onClickShoot( e ){
	// 	fire( playermanual );
	// }

	// actions

	function spawnEnemy(){

		var cupcakes = [];
		cupcakes[METEOR_TYPE.DEFAULT] = 'evilcupcake';
		cupcakes[METEOR_TYPE.BLUE] = 'evilcupcakeblue';
		cupcakes[METEOR_TYPE.GREEN] = 'evilcupcakegreen';
		cupcakes[METEOR_TYPE.PURPLE] = 'evilcupcakepurple';

		var rnd = Math.random();
		var cupcaketype = METEOR_TYPE.DEFAULT;
		if( rnd < 0.1 ){
			cupcaketype = METEOR_TYPE.BLUE;
		} else if( rnd < 0.2 ){
			cupcaketype = METEOR_TYPE.GREEN;
		} else if( rnd < 0.3 ){
			cupcaketype = METEOR_TYPE.PURPLE;
		}


		var enemy = new CES.Entity();
		enemy.addComponent(new Position(1.01*W/2, Math.random()*2*Math.PI));
		enemy.addComponent(new Velocity(-5 - Math.random()*10, 0.05));
		enemy.addComponent(new Rotation(Math.random()*Math.PI*2));
		enemy.addComponent(new RVelocity(0.5));
		enemy.addComponent(new Health(100));
		enemy.addComponent(new Enemy());
		enemy.addComponent(new Sprite(
			// special ? 'bluemeteor1' : 'meteor'+(Math.floor(Math.random()*2)+1),
			cupcakes[cupcaketype],
			40, 40,
			0, 0, 0,
			-20, -20
		));
		enemy.addComponent(new Hitbox(16));
		enemy.addComponent(new Meteor());
		enemy.getComponent('meteor').setType( cupcaketype );
		enemy.addComponent(new Alive());

		world.addEntity( enemy );
	}

	function echoFireCircle( pos, projectile ){
		// var xy = getXY(pos.r, pos.alpha);
		// console.log('Echo fire', xy.x, xy.y);

		var rnd = Math.random()*Math.PI*2;

		var player = projectile.getComponent('projectile').owner;
		var n = player.getComponent('player').blueMeteorFireNumber;

		console.log('n', n);

		for( var i = 0; i < n; ++i){
			var e = new CES.Entity();

			var a = rnd + i*Math.PI*2/n;
			var v = 500;

			e.addComponent(new Position( pos.r , pos.alpha ));
			e.addComponent(new Rotation( a ));
			// e.addComponent(new Velocity(500, 0));
			e.addComponent(new CartesianVelocity( v*Math.cos(a) , v*Math.sin(a) ));
			e.addComponent(new Projectile( player ));
			e.addComponent( projectile.getComponent('sprite').copy() );
			// e.addComponent(new Sprite(MANUAL ? 'manuallaser' : 'laser', 6.5, 18.5, -7, 0, 0, -3.75, -9.25, Math.PI/2, false));

			e.addComponent(new Hitbox(3));

			world.addEntity(e);
		}

	}

	function fire( player ){
		var e = new CES.Entity();

		e.addComponent(new Position(30, player.getComponent('rotation').z + Math.PI));
		e.addComponent(new Velocity(500, 0));
		e.addComponent(new Projectile( player ));
		e.addComponent(new Sprite(MANUAL ? 'manuallaser' : 'laser', 6.5, 18.5, -7, 0, 0, -3.75, -9.25, Math.PI/2, true));
		e.addComponent(new Hitbox(3));

		world.addEntity(e);


		player.getComponent('firespeed').fire();
	}


	// Routine

	var then = null;

	function game_step( timestamp ){

		if( !then ) then = timestamp;

		world.update(timestamp - then);

		window.requestAnimationFrame(game_step);

		draw();

		// if( upgrades_changed ){
		// 	remakeShop();
		// 	upgrades_changed = false;
		// }

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
		player.addComponent(new Player({
			mode:'idle',
			onKill: function( money ){ gamedata.money += money },
			moneyColor: MANUAL_MONEYCOLOR
		}));
		player.addComponent(new Position(0, 0));
		// player.addComponent(new Sprite('ship', 66, 37, 0, 0, 0, -33, -18, -Math.PI/2, true));
		player.addComponent(new Sprite('macaroongreen', 52, 52, 0, 0, 0, -26, -26, -Math.PI/2, true));
		player.addComponent(new Rotation(0));
		player.addComponent(new RVelocity(0));
		player.addComponent(new Target());
		player.addComponent(new FireSpeed());
		player.addComponent(new FireSpeedRing(IDLE_RINGCOLOR, 40, 5));
		player.addComponent(new FireMemory());

		// player.addComponent(new ManualStats());
		// player.addComponent(new IdleStats());

		player.addComponent(new Status());


		playermanual = new CES.Entity();
		playermanual.addComponent(new Player({
			mode:'manual',
			onKill: function( money ){ gamedata.manualmoney += money },
			moneyColor: IDLE_MONEYCOLOR
		}));
		playermanual.addComponent(new Position(0, 0));
		// playermanual.addComponent(new Sprite('manualship', 66, 37, 0, 0, 0, -33, -18, -Math.PI/2, true));
		playermanual.addComponent(new Sprite('macaroonblue', 66, 66, 0, 0, 0, -33, -33, -Math.PI/2, true));
		playermanual.addComponent(new Rotation(0));
		playermanual.addComponent(new RVelocity(0));
		// playermanual.addComponent(new Target());
		playermanual.addComponent(new FireSpeed());
		playermanual.addComponent(new FireSpeedRing(MANUAL_RINGCOLOR, 45, 5));
		playermanual.addComponent(new FireMemory());

		// playermanual.addComponent(new ManualStats());
		// playermanual.addComponent(new IdleStats());

		playermanual.addComponent(new Status());
		playermanual.getComponent('status').disabled = true;

		world.addEntity( player );
		world.addEntity( playermanual );

		console.log(player);


		for( var i = 0; i < 50; ++i ){
			spawnEnemy();
		}

		$(window).on('mousemove', onMouseMoveRotatePlayer );

		// $(canvas).on('click', function( e ){ fire( playermanual ) } );

		$(canvas).on('mouseenter', function(){
			MANUAL = true;
			player.getComponent('status').disabled = true;
			playermanual.getComponent('status').disabled = false;
			// player.getComponent('sprite').id = 'manualship';
			$('html').addClass('manual');
		});
		$(canvas).on('mouseleave', function(){
			MANUAL = false;
			player.getComponent('status').disabled = false;
			playermanual.getComponent('status').disabled = true;
			// player.getComponent('sprite').id = 'ship';
			$('html').removeClass('manual');
		});
		

		upgrades_changed = true;
		window.requestAnimationFrame(game_step);

	});

	// console.log(getRA(getXY(0,0)));
	// console.log(getRA(getXY(1,2)));
	// console.log(getRA(getXY(5,Math.PI)), getXY(5,Math.PI));
	// console.log(getRA(getXY(100,0.5)));
	// console.log(getRA(getXY(1,Math.PI/2)), Math.PI/2, getXY(1,Math.PI/2));
	// console.log(getRA(getXY(1,3*Math.PI/2)), 3*Math.PI/2, getXY(1,3*Math.PI/2));
	// console.log(getRA(getXY(1,5*Math.PI/6)), 5*Math.PI/6, getXY(1,5*Math.PI/6));


})();