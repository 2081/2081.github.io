var gpu = new GPU();

var opt = {
    dimensions: [100, 100]
};


var W = 64;

function makePadFunc( dims, pad ){

	var dims = dims.slice();
	for( var d = 0; d < dims.length && d < 2; ++d ) dims[d] += 2*pad;

	return gpu.createKernel(function( A ){
		if( this.thread.x >= this.constants.pad && this.thread.x < this.dimensions.x - this.constants.pad	
			&& this.thread.y >= this.constants.pad && this.thread.y < this.dimensions.y - this.constants.pad){
			return A[this.thread.y - this.constants.pad][this.thread.x - this.constants.pad];
		} else {
			return 0;
		}
	}, {
		dimensions: dims,
		constants: {
			pad: pad
		}
	});
}


function makeConvFunc( dims, ksize, stride, pad ){ // in_c, out_c,

	var padFunc = makePadFunc(dims, pad);

	var convFunc = gpu.createKernel(function( A, K ){

		var x = this.constants.pad + this.thread.x*this.constants.stride;
		var y = this.constants.pad + this.thread.y*this.constants.stride;

		var k2 = Math.floor((this.constants.ksize-1)/2.0);

		var res = 0;

		for( var i = 0; i < this.constants.ksize; ++i ){
			for( var j = 0; j < this.constants.ksize; ++j ){
				res = res + A[y+j-k2][x+i-k2] * K[j][i];
			}
		}

		return res;

	}, {
		dimensions : [
			(dims[0] - ksize + 2*pad)/stride + 1,
			(dims[1] - ksize + 2*pad)/stride + 1
		],
		constants: {
			ksize: ksize,
			stride: stride,
			pad: pad
		},
		debug: false
	});

	return function( A, K ){
		return convFunc(padFunc(A), K);
	}

}


// console.log( makePadFunc([2, 2], 1)([[1, 2], [3, 4]]) );


// console.log( makeConvFunc([2, 2], 3, 1, 1)([[1, 2], [3, 4]], [[0, 0, 0], [0, 1, 0], [0, 0, 0]]) );
// console.log( makeConvFunc([2, 2], 2, 1, 0)([[1, 2], [3, 4]], [[1, 0], [0, 0]]) );
// console.log( makeConvFunc([2, 2], 2, 1, 0)([[1, 2], [3, 4]], [[0, 1], [0, 0]]) );
// console.log( makeConvFunc([2, 2], 2, 1, 0)([[1, 2], [3, 4]], [[0, 0], [1, 0]]) );
// console.log( makeConvFunc([2, 2], 2, 1, 0)([[1, 2], [3, 4]], [[0, 0], [0, 1]]) );

// makeConvFunc(1, 1, 3, 1, 2 );

// var now = Date.now();

// // for( var i = 0; i < 100; ++i) makeConvFunc([2, 2], 3, 1, 1)([[1, 2], [3, 4]], [[0, 0, 0], [0, 1, 0], [0, 0, 0]])

// // console.log('create + use', Date.now() - now )
// // now = Date.now();
// var f = makeConvFunc([2, 2], 3, 1, 1);
// for( var i = 0; i < 100; ++i) f([[1, 2], [3, 4]], [[0, 0, 0], [0, 1, 0], [0, 0, 0]])

// console.log('create once then use', Date.now() - now )

// var now = Date.now();

// for( var i = 0; i < 100; ++i) f([[1, 2], [3, 4]], [[0, 0, 0], [0, 1, 0], [0, 0, 0]])

// console.log('just use', (Date.now() - now)/100 )

// -----------------------------------------------------------

function DNA( dna ){

	// this.baseRadius = 


}

function Cell( dna ){

	this.radius = 1;
	this.x = 0;
	this.y = 0;
	this.color = 0;

	this.vx = thix.vy = 0;


}

/*

for i in N chromosomes

- angle : any value ( %2pi in computations )
- power : 0 - pmax
- duration: 0 - 10 000ms
- time: 0 - 15 000ms * i


*/
var BALL_RADIUS = 25;

var GRAVITY = true;
var PMAX = 4000000; //0.5*BALL_RADIUS*BALL_RADIUS*BALL_RADIUS*4000000/(25*25*25);
var DURATION_MAX = 3000;
var TIME_MAX = 1500;
var N_TARGET = 3;
var TARGET_RADIUS = 40;

var N_CHROMOSOMES = 100;
var BASE_PROB_MUTATION = 0.25;

var INITIAL_TIMER = 3000;
var TIME_PER_TARGET = 2500;
// var TARGETS_SEED = 'targets';
// var TARGETS_SEED = 'amazon';
var TARGETS_SEED = 'Mary Poppins';

var N_BALLS = 30;

var W = 1000, H = 600;
var VMAX = Math.max(W,H);
var G = 2000;
var K = 0.47;

var RZ_MAX = 0.6*Math.PI/2;

// Walls On Fire
var WOF_LEVEL = 10;

var FADING_TIME = 350;
var GAME_OVER_DELAY = 900;

var generation = 0;
var dt_divisor = 1;
var gameover_time = null;


var N_BEST = 20;
var bests = [];



function maxTimeForTarget( n ){
	return INITIAL_TIMER + n*TIME_PER_TARGET;
}


var crng = new RNG('chromosome'+Math.random());

function Chromosome( n, zero ){
	n = n || 0;
	this.angle = crng.uniform()*Math.PI; // crng.uniform()*Math.PI;
	this.power = zero ? 0 : crng.random(PMAX/1000, PMAX);
	this.duration = zero ? 0 : crng.random(DURATION_MAX/10, DURATION_MAX);
	// this.time = zero ? 0 : crng.random(0, maxTimeForTarget( n || 0 ) );
	this.time = zero ? 0 : crng.random(0, TIME_PER_TARGET);// n == 0 ? INITIAL_TIMER : TIME_PER_TARGET );
}

var colorrng = new RNG('color');
function Ball( x, y, r, zero, n_chrom ){

	this.chromosomes = [];
	for( var i = 0; i < (n_chrom || 1); ++i) this.chromosomes.push( new Chromosome(i, zero) );
	// this.chromosomes.push( new Chromosome(0, zero) );
	// this.chromosomes.push( new Chromosome(3, zero) );

	this.zpriority = Math.random();

	this.generation = 0;

	this.density = 2;
	this.k = K;

	this.x = x || W/2;
	this.y = y || H-BALL_RADIUS;
	this.radius = r || BALL_RADIUS;

	this.lastx = this.x;
	this.lasty = this.y;

	// this.style = 'rgb('+colorrng.random(0,255)+','+colorrng.random(0,255)+','+colorrng.random(0,255)+')';
	this.red = zero ? 150 : colorrng.random(0,255);
	this.green = zero ? 150 : colorrng.random(0,255);
	this.blue = zero ? 150 : colorrng.random(0,255);

	this.baseImage = srng.random(0, N_SPRITES);
	this.accentImage = srng.random(0, N_SPRITES - 1);
	this.accentImagePer = srng.uniform();

	if( this.accentImage >= this.baseImage ) this.accentImage++;

	this.vx = 0; //0; //Math.random()*2000 - 1000;
	this.vy = 0; //Math.random()*2000 - 1000; //-5000;

	this.cx = 0;
	this.cy = 0;

	this.rz = 0;


	this.target = 0;
	this.distance = -1;
	this.target_times = [];
	this.time = null;

}

var trng = new RNG(TARGETS_SEED);
var targets = [];
var best_target = 0;

function getTarget( n ){
	return targets[n] || (targets[n] = {
		x: trng.uniform()*(W-2*TARGET_RADIUS) + TARGET_RADIUS,
		y: trng.uniform()*(H-2*TARGET_RADIUS) + TARGET_RADIUS,
		count: 0
	});
}

// var orng = new RNG('obstables');
// var obstables = 

// getTarget(0);
// getTarget(1);



// -----------------------------------------------------------

var mwh = Math.min(window.innerWidth, window.innerHeight, 500);

// W = Math.max(window.innerWidth/3, 300);
// H = window.innerHeight;
W = mwh;
H = mwh;


var canvas = document.getElementById('sim-canvas');
canvas.width = W;
canvas.height = H;

var ball_sprite = document.getElementById("ball-sprite");
var ball_sprites = $.makeArray($('#ball-sprites img')),
	N_SPRITES = ball_sprites.length,
	srng = new RNG('sprites');

// console.log(ball_sprites);

// console.log(new Chromosome());

var rng = new RNG('citrouille');
var rng_land = new RNG('hamburger');

canvas.addEventListener('mousedown', function(){
	console.log('down');
	dt_divisor = 20;
});
canvas.addEventListener('mouseup', function(){
	console.log('up');
	dt_divisor = 1;
});


var balls = [];
// balls.push(new Ball(100, null, 100));
// balls.push(new Ball(350, null, 50));
// balls.push(new Ball(600, null, 10));

for( var i = 0; i < N_BALLS; ++i ) balls.push(new Ball(W/2, H-4*BALL_RADIUS, BALL_RADIUS, false));
// for( var i = 0; i < 100; ++i ) balls.push(new Ball(rng.random(30, 570), rng.random(100, 400), 25));

// console.log(balls);

var context = canvas.getContext("2d");

function contract( dx ){
	return 1 - Math.exp(-3*dx);
}
function release( c ){
	return -Math.log(1-Math.min(c, 0.99999999999999))/3;
}

function chromosomesUsedAtTime( ball, t ){

	var chroms = ball.chromosomes;
	var times = ball.target_times.slice();
	times.unshift(0);
	if( !chroms ){
		console.log(ball);
		throw new Error();
	}
	var i = 0;
	for( i = 0; i < chroms.length && times[i] + chroms[i].time < t; ++i);

	return i;
}

// function scoreBall( ball ){
// 	ball.score = 0;
// 	for( var i = 0; i < ball.target; ++i ) ball.score += (W+H) / ( Math.max(1, ball.target_times[i]) * Math.max( 1, chromosomesUsedAtTime(ball, ball.target_times[i]) ));
// 	ball.score += (W+H-ball.distance) / ( Math.max( 1, ball.endtime - (ball.target > 0 ? ball.target_times[ball.target-1] : 0)) + Math.max( 1, chromosomesUsedAtTime(ball, ball.endtime)) );
// 	return ball;
// }
function scoreBall( ball ){
	ball.score = (1+ball.target) * (W+H) - ball.distance - 0.1*(ball.burnspeed || 0);
	// ball.score = TIME_PER_TARGET*ball.target/ball.endtime;
	return ball;
}
function sortBalls( b1, b2 ){
	return b2.score - b1.score;
}

function posAt( dt, g, m, k, fx, fy, vx0, vy0, x0, y0, r ){

	// console.log(dt);
	var outY = function( p ){ return p.y - r < 0 || p.y + r > H; };
	var outX = function( p ){ return p.x - r < 0 || p.x + r > W; };

	// if( outX({x: x0}) || outY({y: y0}) ){
	// 	console.log(x0, y0);
	// 	throw new Error();
	// }

	// p0 = { x:x0, y:y0 };

	// if( outX({x: x0}) ) x0 = Math.round(x0);
	// if( outX({y: y0}) ) y0 = Math.round(y0);

	var tau = m/k,
		gamx = tau*(fx/m),
		gamy = tau*(g + fy/m),
		deltax = tau*(vx0 - gamx),
		deltay = tau*(vy0 - gamy);

	// console.log( Math.abs(vy0)*(dt) );
	if( y0 + r > H && Math.max( Math.abs(vx0), Math.abs(vy0) )*(dt) < 0.5 ){
		// console.log('tadaaaa');
		return {
			x: x0,
			y: y0,
			vx: vx0,
			vy: vy0
		};
	}



	function pos( t ){
		return {
			x: -deltax*Math.exp(-t/tau) + gamx*t + deltax + x0,
			y: -deltay*Math.exp(-t/tau) + gamy*t + deltay + y0
		}
	}

	var t1 = 0, t2 = dt, t = t2;
	var p = pos( t2 );


	if( outY(p) && vy !== 0 || outX(p) && vx !== 0 ){

		do{
			var t = (t1 + t2)/2;
			var p_ = pos(t);

			if( outY(p_) || outX(p_) ){
				t2 = t;
			} else {
				t1 = t;
			}

		}while(t2 - t1 > 0.005 );



		var p2 = pos(t1);

		// if( outX(p2) || outY(p2) ){
		// 	//console.log(outX(p), outY(p));
		// 	// console.log(p, p2);
		// 	throw new Error();
		// }

		var vx = (vx0 - gamx)*Math.exp(-t1/tau) + gamx;
		var vy = (vy0 - gamy)*Math.exp(-t1/tau) + gamy;

		// if( outY(p) ){
		// 	vy *= -0.55;
		// 	vx *= 1-1.85*dt;
		// }
		// if( outX(p) ){
		// 	vx *= -0.55;
		// 	vy *= 1-1.85*dt;
		// }
		if( p2.y - r < 0 || p2.y + r > H ){
			vy *= Math.max(0, 1-2.90*dt);
			vx *= Math.max(0, 1-3.85*dt);
		}
		if( p2.x - r < 0 || p2.x + r > W ){
			vy *= Math.max(0, 1-1.85*dt);
			vx *= Math.max(0, 1-3.90*dt);
		}

		if( p2.y - r < 0 && vy < 0 || p2.y + r > H && vy > 0 ){
			vy *= Math.abs(vy) * (dt - t1) < 1 ? 0 : -0.55;
			if( p2.y - r < 0 ) p2.y = r;
			if( p2.y + r > H ) p2.y = H - r;
		}
		if( p2.x - r < 0 && vx < 0 || p2.x + r > W && vx > 0 ){
			vx *= Math.abs(vx) * (dt - t1) < 1 ? 0 : -0.55;
			if( p2.x - r < 0 ) p2.x = r;
			if( p2.x + r > W ) p2.x = W - r;
		}


		// console.log(vx0, vy0, vx, vy);

		// if( p2.y - r < 0 ) p2.y = r;
		// if( p2.y + r > H ) p2.y = H - r;
		// if( p2.x - r < 0 ) p2.x = r;
		// if( p2.x + r > W ) p2.x = W - r;
		return posAt( dt - t1, g, m, k, fx, fy, vx, vy, p2.x, p2.y );

		// if( Math.max(Math.abs(vy), Math.abs(vx)) * (dt - t1) >= 0.5 ){
		// 	return posAt( dt - t1, g, m, k, fx, fy, vx, vy, p2.x, p2.y );
		// } else {
		// 	return {
		// 		x: p2.x,
		// 		y: p2.y,
		// 		vx: 0,
		// 		vy: 0
		// 	};

		// }

	}

	var result = {
		x: p.x,
		y: p.y,
		vx: (vx0 - gamx)*Math.exp(-t/tau) + gamx,
		vy: (vy0 - gamy)*Math.exp(-t/tau) + gamy
	};


	if( Math.abs(result.vx) < 1 ) result.vx = 0;
	if( Math.abs(result.vy) < 1 ) result.vy = 0;

	return result;
}



function pad(num, size) {
    var s = num+"";
    while (s.length < size) s = "0" + s;
    return s;
}

var start, t1, elapsed_t1, time_left = null;


function step(t2) {
	if( time_left == null ) time_left = 2*TIME_MAX;
	if(!elapsed_t1) elapsed_t1 = 0;
	if(!start) start = t2;
	if(!t1) t1 = t2;
	var dt = t2 - t1;
	var t = t2 - start;

	dt /= dt_divisor
	var elapsed_t2 = elapsed_t1 + dt;

	var dt1000 = dt/1000;


	context.clearRect(0, 0, W, 3);
	context.clearRect(W-3, 0, 3, H);
	context.clearRect(0, H-3, W, 3);
	context.clearRect(0, 0, 3, H);


	context.clearRect( W/2 - 100, 0, 200, 100);

	for(var i in balls){
		var ball = balls[i];

		context.clearRect(ball.x - 2.5*ball.radius, ball.y - 2.5*ball.radius, 5*ball.radius, 5*ball.radius);
	}
	for(var i in targets){
		var t = targets[i];

		context.clearRect(t.x - 50, t.y - 50, 100, 100);
	}

	var mvx = 0, mvy = 0;

	for(var i in balls){
		var ball = balls[i];

		var vol = 0.75*3.14*ball.radius*ball.radius*ball.radius;
		
		var m = vol * ball.density;

		var times = [elapsed_t1, elapsed_t2];
		for( var j in ball.chromosomes ){
			var c = ball.chromosomes[j];
			if( c.time > elapsed_t1  && c.time < elapsed_t2 ) times.push(c.time);
			if( c.time + c.duration > elapsed_t1  && c.time + c.duration < elapsed_t2 ) times.push(c.time + c.duration);
		}

		times = times.sort(function(a, b){ return a - b;});

		ball.lastx = ball.x;
		ball.lasty = ball.y;

		for(var j = 0; j < times.length - 1; ++j ){


			var t1_ = times[j],
				t2_ = times[j+1],
				t12 = (t1_ + t2_)/2;

			// console.log(t1_, t2_);
			// console.log(t2_ > t1_);

			var fx = 0;
			var fy = 0;

			if( ! ball.gameover ){

				var chrom = ball.chromosomes[ball.target];
				var time = ball.target == 0 ? 0 : ball.target_times[ball.target-1];

				if( chrom && time + chrom.time < t12 && time + chrom.time + chrom.duration > t12 ){

					// if( ball.target > 0 ){
					// 	console.log('okay');
					// }

					fx += Math.cos(chrom.angle) * chrom.power*100;
					fy -= Math.sin(chrom.angle) * chrom.power*100;
				}

			}

			

			// for( var k in ball.chromosomes ){
			// 	var c = ball.chromosomes[k];
			// 	if( c.time < t12 && c.time + c.duration > t12 ){
			// 		fx += Math.cos(c.angle) * c.power*100;
			// 		fy -= Math.sin(c.angle) * c.power*100;
			// 	}
			// }

			// var tau = m/ball.k;

			// console.log(t2_ - t1_);

			var pos = posAt( (t2_ - t1_)/(1000) , G, m, ball.k, fx, fy, ball.vx, ball.vy, ball.x, ball.y, 0);

			// console.log(ball.x, ball.y, ball.vx, ball.vy)
			// console.log(pos);


			// console.log(ball.fx);
			// ball.rz += ball.fx/(PMAX*100) * (t2_ - t1_)/(1000);
			ball.rz = (pos.vx - ball.vx)/(t2_ - t1_);

			ball.x = pos.x;
			ball.y = pos.y;
			ball.vx = pos.vx;
			ball.vy = pos.vy;
			ball.fx = fx;
			ball.fy = fy;



			ball.rz = Math.min(Math.max(ball.rz, -RZ_MAX), RZ_MAX)

			if( !ball.gameover ){
				var r = ball.radius;
				if( ball.target >= WOF_LEVEL && (ball.y - r < 0 || ball.y + r > H || ball.x - r < 0 || ball.x + r > W ) ){
					ball.gameover = true;
					ball.endtime = elapsed_t2;
					ball.burntime = elapsed_t2 - (ball.target_times[ball.target - 1] || 0);
					ball.burnspeed = Math.abs(ball.vx) + Math.abs(ball.vy);
					// console.log(ball.burnspeed);
					ball.burnt = true;
				}
			}
		}

	}

	var maxtarget = 0;

	for(var i = 0; i < balls.length; ++i){
		var ball = balls[i];
		maxtarget = Math.max(ball.target, maxtarget);

		if( !ball.gameover ){

			var n = ball.target,
				target = getTarget(n);

			var d1 = Math.sqrt(Math.pow(target.x - ball.x, 2) + Math.pow(target.y - ball.y, 2)),
				d2 = Math.sqrt(Math.pow(target.x - (ball.lastx+ball.x)/2, 2) + Math.pow(target.y - (ball.lasty+ball.y)/2, 2));//,
				// d3 = Math.sqrt(Math.pow(ball.lastx - ball.x, 2) + Math.pow(ball.lasty - ball.y, 2));

			if( d1 <= Math.abs(TARGET_RADIUS - 0*ball.radius)
				||  d2 <= Math.abs(TARGET_RADIUS - 0*ball.radius) ) {
				if( target.count === 0 ){
					time_left += TIME_MAX;
					best_target = ball.target+1;
				}
				target.count++;
				ball.target++;
				ball.distance = -1;
				ball.target_times.push(elapsed_t2);
				i--;

			} else if( ball.distance < 0 || d1 < ball.distance ){
				ball.distance = d1;
			}
			
		}


	}

	for(var i = targets.length-Math.min(3, targets.length); i < targets.length; ++i){
		var t = targets[i];

		context.beginPath();
		context.arc(t.x+2, t.y+3, TARGET_RADIUS, 0, 2 * Math.PI, false);
		context.fillStyle = 'rgba(0,0,0,0.2)';
		context.fill();

		context.beginPath();
		context.arc(t.x, t.y, TARGET_RADIUS, 0, 2 * Math.PI, false);
		context.fillStyle = 'rgba(255,255,255,1)';
		context.fill();

		context.beginPath();
		context.arc(t.x, t.y, TARGET_RADIUS - 2, -Math.PI/2, 2*Math.PI*t.count/N_BALLS -Math.PI/2, false);
		context.lineWidth = 4;
		context.strokeStyle = '#3d8ee8';
		context.stroke();

		context.fillStyle = 'rgba(0,0,0,0.2)';
		context.font = "30px Roboto";
		context.textAlign = "center";
		context.textBaseline = 'middle';
		context.fillText(pad(i+1, 2),t.x,t.y);
	}

	balls.sort(function(b1, b2){ return 2*(b1.target- b2.target) + b1.zpriority - b2.zpriority});

	for(var i in balls){
		var ball = balls[i];

		var fading = 1 - (elapsed_t2 - ball.endtime || 0)/FADING_TIME;
		if( fading < 0 ) continue;

		var scy = 1-Math.max( ball.y + ball.radius - H, - ball.y + ball.radius, 0)/ball.radius/2,
			scx = 1-Math.max( ball.x + ball.radius - W, - ball.x + ball.radius, 0)/ball.radius/2;

		var dx = 0, dy = 0;

		function f( x ){
			var n = 8;
			// return n*x/((n-1)*x+1);
			return -x/((n-1)*x-n);
			// var k = 2.75;
			// return (Math.atan(10*(x-0.5)) + k/2)/k;

			// return Math.pow(x, 2);
		}

		if( true ){
			var speed = 1500;
			var v = 1 + f((1-Math.min(speed, Math.abs(ball.vy))/speed))*4.5;
			var scy_ = 1 - (1-scy)/v ;
			var scx_ = 1 - (1-scx)/v ;

			dy = 2*(scy_-scy) * ball.radius;
			dx = 2*(scx_-scx) * ball.radius;

			scy = scy_;
			scx = scx_;
		}

		scx2 = scx + (1-scy)
		scy2 = scy + (1-scx)

		context.save();

		context.translate(
			(ball.x > W/2 ? -1 : 1)*(Math.abs(dx) + ball.radius*(1-scx)),
			(ball.y > H/2 ? -1 : 1)*(Math.abs(dy) + ball.radius*(1-scy))
		);

		context.scale(scx2, scy2);

		// context.beginPath();
		// context.arc((ball.x + 2)/scx2, (ball.y+3)/scy2, ball.radius, 0, 2 * Math.PI, false);
		// context.fillStyle = 'rgba(0,0,0,'+0.1*fading+')';
		// context.fill();

		context.save();

		context.translate( ball.x/scx2, ball.y/scy2 );
		// var alpha = ball.fx*Math.PI;
		// context.rotate( alpha);
		context.rotate( ball.rz );

		var alpha = Math.max(0, Math.min(1, (TIME_PER_TARGET -  (elapsed_t2 - (ball.target_times[ball.target - 1] || 0)))/FADING_TIME));
		// console.log(alpha);
		context.globalAlpha = alpha;
		// console.log('alpha',alpha, ball.fx);
		// context.scale(1/(scx2*Math.sin(Math.abs(alpha)) + scy2*Math.cos(alpha)), 1/(scx2*Math.cos(alpha) + scy2*Math.sin(Math.abs(alpha))));
		context.drawImage( ball_sprites[ball.baseImage], -1.17*ball.radius, -1.17*ball.radius, 2.34*ball.radius, 2.34*ball.radius);

		// context.globalAlpha = Math.pow(ball.accentImagePer, 4);
		// context.globalAlpha = ball.accentImagePer;
		// context.drawImage( ball_sprites[ball.accentImage], -1.17*ball.radius, -1.17*ball.radius, 2.34*ball.radius, 2.34*ball.radius);

		// context.rotate( -ball.vx*Math.PI/4000);
		// context.translate( ball.x/scx2, ball.y/scy2 );

		context.restore();


		// context.beginPath();
		// context.arc((ball.x)/scx2, ball.y/scy2, ball.radius, 0, 2 * Math.PI, false);
		// context.fillStyle = 'rgba('+ball.red+','+ball.green+','+ball.blue+','+ fading +')';//(ball.target == best_target ? 1 : 0.2)+')';
		// context.fill();

		if( ball.burnt ){
			$('#sim-canvas').addClass('fire');
			context.beginPath();
			context.arc((ball.x)/scx2, ball.y/scy2, ball.radius, 0, 2 * Math.PI, false);
			context.lineWidth = 2;
			context.strokeStyle = 'red';
			context.stroke();
		}


		// context.fillStyle = 'rgba(255,255,255,0.75)';
		// context.font = "18px Roboto";
		// context.textAlign = "center";
		// context.textBaseline = 'middle';
		// // context.fillText(pad(ball.target, 2), ball.x/scx2, ball.y/scy2);
		// context.fillText(pad(ball.generation, 2), ball.x/scx2, ball.y/scy2);

		// context.beginPath();
		// context.strokeStyle = 'white';

		// context.moveTo(ball.x/scx2, ball.y/scy2);
		// context.lineTo((ball.x + 50*ball.vx/VMAX)/scx2, ((ball.y)+50*ball.vy/VMAX)/scy2);
		// context.stroke();

		context.restore();
		// if( maxtarget >= WOF_LEVEL ){
		// 	context.beginPath();
		// 	context.moveTo(0, 0);
		// 	context.lineTo(W, 0);
		// 	context.lineTo(W, H);
		// 	context.lineTo(0, H);
		// 	context.lineTo(0, 0);

		// 	context.strokeStyle = 'red';
		// 	context.lineWidth = 2;
		// 	context.stroke();
		// }

	}

	$('#sim-canvas').toggleClass('fire', maxtarget >= WOF_LEVEL);

	var minutes = Math.floor((elapsed_t2/60000)),
		seconds = Math.ceil((elapsed_t2/1000)) - 60*minutes;

	context.fillStyle = 'rgba(255,255,255,1)';
	context.font = "42px Roboto";
	context.textAlign = "center";
	context.textBaseline = 'top';
	context.fillText(pad(minutes, 2)+':'+pad(seconds, 2), W/2, 0);


	time_left -= dt;

	var balls_out = 0;

	for( var i in balls ){
		var ball = balls[i];
		if( ball.gameover ){
			balls_out++;
		} else {
			var mt = (ball.target_times[ball.target-1] || 0) + TIME_PER_TARGET; //maxTimeForTarget(ball.target);
			if( elapsed_t2 > mt ){
				ball.gameover = true;
				ball.endtime = mt;

				balls_out++;
			}
		}
	}

	if( !gameover_time && balls_out >= N_BALLS ){
		gameover_time = elapsed_t2;
	}

	if( gameover_time && elapsed_t2 > gameover_time + GAME_OVER_DELAY){

		gameover_time = null;
		time_left = null;
		// dt_divisor = 20;

		// console.log(bests.concat(balls.map(scoreBall)));


		bests = bests.concat(balls.map(scoreBall))
		bests = bests.filter(function(value, index, self){
			return self.indexOf(value) === index;
		});
		bests = bests.sort(sortBalls).slice(0, Math.min(N_BEST, bests.length) );

		var sorted_balls = balls.map(scoreBall).sort(sortBalls);

		// console.log('best score:', sorted_balls[0].score);
		// console.log('> chromosomes used:', chromosomesUsedAtTime(sorted_balls[0], sorted_balls[0].endtime));
		// console.log(sorted_balls[0]);
		// console.log('lowest score:', sorted_balls[N_BALLS-1].score);

		// displayGenes(sorted_balls[0], $('#best-genes'));

		// console.log(sorted_balls);
		// a = g;




		// var n_select = Math.floor(0.2*N_BALLS);
		// var selected = sorted_balls.slice(0, n_select);

		// var new_balls = [];

		// for( var i = 0; i < n_select; ++i ){
		// 	var b = new Ball(),
		// 		b2 = selected[i];

		// 	['chromosomes', 'red', 'green', 'blue', 'zpriority', 'generation'].map(function( prop ){
		// 		b[prop] = b2[prop];
		// 	});

		// 	new_balls.push(b);
		// }

		// for( var i = n_select; i < N_BALLS; ++i ){
		// 	var r1 = brng.random(0, n_select),
		// 		r2 = brng.random(0, n_select - 1);
		// 	if( r2 >= r1 ) r2 += 1;
		// 	new_balls.push( breed( selected[r1], selected[r2] ) );
		// }

		var new_balls = [];

		for( var i = 0; i < N_BALLS; ++i ){
			var r1 = brng.random(0, bests.length),
				r2 = brng.random(0, Math.max(0, bests.length - 1));
			if( r2 >= r1 && bests.length > 1) r2 += 1;
			new_balls.push( breed( bests[r1], bests[r2] ) );
		}

		targets = [];
		trng = new RNG(TARGETS_SEED);
		best_target = 0;

		balls = new_balls;
		elapsed_t1 = elapsed_t2 = 0;

		context.clearRect(0, 0, W, H);

		var glb = $('#genes-leader-board');
		glb.empty();

		for( var i = 0; i < bests.length; ++i){
			var ball = bests[i];
			// var $ctn = $('<div class="board-entry card">\
			// 	<div class="thumbnail-ctn"><span class="ball" style="background-color: rgb('+ball.red+','+ball.green+','+ball.blue+');"></span></div>\
			// </div>');
			var $ctn = $('<div class="board-entry card"></div>');

			// console.log(ball.baseImage, ball_sprites[ball.baseImage]);

			$ctn.append( $(ball_sprites[ball.baseImage]).clone() );
			var $div = $('<div class="genes" data-rank="'+i+'"></div>');
			$ctn.append($div);
			$ctn.append($('<div class="info-ctn"><p><span class="title">Gen.</span>'+ball.generation+'</p><p>'+Math.floor(ball.score)+'<span class="title"> pt.</span></p></div>"'))

			displayGenes(bests[i], $div);
			glb.append($ctn);
		}

	}


	t1 = t2;
	elapsed_t1 = elapsed_t2;
	window.requestAnimationFrame(step);
}

window.requestAnimationFrame(step);


var brng = new RNG('breeding');

function breed( b1, b2 ){

	var n_chrom = Math.max(b1.chromosomes.length, b2.chromosomes.length, b1.target+1, b2.target+1);


	// console.log('N CHROM', n_chrom);

	var b = new Ball(null, null, null, false, n_chrom);

	if( brng.random(0,1) ){
		var b_ = b2;
		b2 = b1;
		b1 = b_;
	}

	var highest_target = Math.max(b1.target, b2.target);
	//console.log(highest_target);

	b.generation = Math.max(b1.generation, b2.generation) + 1;

	b.red = 0.9*b1.red + 0.1*b2.red;
	b.green = 0.9*b1.green + 0.1*b2.green;
	b.blue = 0.9*b1.blue + 0.1*b2.blue;

	b.baseImage = b1.baseImage;

	// console.log(b.chromosomes.length);

	var n = Math.min(b1.chromosomes.length, b2.chromosomes.length);

	for( var i = 0; i < n; ++i ){
		// var r = brng.random(0,1);
		var c1 = b1.chromosomes[i] || b2.chromosomes[i],
			c2 = b2.chromosomes[i] || b1.chromosomes[i],
			c3 = new Chromosome();

		var allowMutation = highest_target >= i;
		var probMutation = BASE_PROB_MUTATION / Math.pow(10, (1 + highest_target - i));
		// console.log(i, highest_target, allowMutation);

		for( var key in c3 ){
			var r = brng.uniform();
			if( allowMutation && (r < probMutation || r > 1 - probMutation) ){
				// var color = ['red','green','blue'][brng.random(0,2)];
				// b[color] = b[color] + brng.random(20,150);
				// b[color] = b[color] + brng.random(20,150);
				['red','green','blue'].map(function( c ){ b[c] = (b[c] + brng.random(20,150))%256; });

				b.baseImage = srng.random(0, N_SPRITES-1);
				if( b.baseImage >= b1.baseImage ) b.baseImage++;

			} else {
				var c = r < 0.9 ? c1 : c2;
				if( allowMutation && brng.uniform() < 10*probMutation ){
					c3[key] = 0.9*c[key] + 0.1*c3[key];
					// console.log('RARE');
				} else {
					c3[key] = c[key];
				}
			} 
		}

		b.chromosomes[i] = c3;

	}

	b.red = Math.floor(b.red);
	b.green = Math.floor(b.green);
	b.blue = Math.floor(b.blue);

	return b;
}

PI2 = 1*Math.PI
var ALLELE_LENGTH = 20;


// duration for chromosomes is between 0 and TIME_PER_TARGET
// Is the time to use it after the corresponding target

function displayGenes( ball, div ){
	div.empty();

	// console.log(ball);

	//var n = Math.min( N_CHROMOSOMES, ball.target + 1);
	for( var i = 0; i < ball.chromosomes.length; ++i){
		var c = ball.chromosomes[i];

		var cdiv = $('<p class="chromosome">\
			<span class="allele A" style="width: '+ Math.max(1, ALLELE_LENGTH*(0.05+0.95*(c.angle || 0  % PI2)/PI2))+'px;">\
			</span><span class="allele B" style="width: '+ Math.max(1, ALLELE_LENGTH*(0.05+0.95*(c.power || 0)/PMAX))+'px;">\
			</span><span class="allele C" style="width: '+ Math.max(1, ALLELE_LENGTH*(0.05+0.95*(c.time || 0)/TIME_MAX))+'px;">\
			</span><span class="allele D" style="width: '+ Math.max(1, ALLELE_LENGTH*(0.05+0.95*(c.duration || 0)/DURATION_MAX))+'px;">\
		</span></p>');

		div.append(cdiv);
	}
}


$(document).ready(function(){
	displayGenes(balls[0], $('#best-genes'));
	ball_sprite = document.getElementById("ball-sprite");
});