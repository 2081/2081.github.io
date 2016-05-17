
// CONSTANTS

NB_VERTICES = 3;
NB_POLY = 30;


// Observer

// var Observable, observe, notify;

// (function(){

// 	var currentID = 0;
// 	function nextID(){ return 'xFgdHjkOQl'+(currentID++)+''; }

// 	var observableCode = '_xFgdHjkOQl_observableID';
// 	var observerCode = '_xFgdHjkOQl_observerID';

// 	observables = {};

// 	typeObserved = {};

// 	observers = {};

// 	function _notify( obj, ev, params ){

// 	}

// 	Observable = function( obj ){
// 		if( ! obj[observableCode] ){
// 			var id = nextID();
// 			observables[id] = { obj: obj, obs: [] };
// 			obj[observableCode] = id;
// 			obj.notify = function( ev, params ){
// 				return _notify(obj, ev, params);
// 			}
// 		}
// 		//return observables[obj[observableCode]];
// 	};

// 	Object.defineProperty(Object.prototype, 'observe',{
// 		value: function(){
// 			var list = 
// 			if( !this[observerCode] ){
// 				var id = nextID();
// 				this.observerCode = id;
// 				observers[id] = this;
// 			}
			
// 		},
// 		writable: true,
// 		configurable: true,
// 		enumerable: false
// 	});

// })();

// CLASSES

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

function Edge( p, q, link ){
	this.p = new Vertex(), this.q = new Vertex();

	if( p instanceof Vertex && q instanceof Vertex ){
		this.p = link ? p : new Vertex(p); this.q = link ? q : new Vertex(q);
	} else if ( p instanceof Edge ){
		link = q;
		this.p = link ? p.p : new Vertex(p.p); this.q = link ? p.q : new Vertex(p.q);
	}
};

Edge.prototype = {
	intersect: function( e ){
		var d1, d2;
    	var a1, a2, b1, b2, c1, c2;

	    // Convert self to a line (line 1) of infinite length.
	    // We want the line in linear equation standard form: A*x + B*y + C = 0
	    // See: http://en.wikipedia.org/wiki/Linear_equation
	    a1 = this.q.y - this.p.y;
	    b1 = this.p.x - this.q.x;
	    c1 = (this.q.x * this.p.y) - (this.p.x * this.q.y);

	    // Every point (x,y), that solves the equation above, is on the line,
	    // every point that does not solve it, is not. The equation will have a
	    // positive result if it is on one side of the line and a negative one 
	    // if is on the other side of it. We insert (x1,y1) and (x2,y2) of vector
	    // 2 into the equation above.
	    d1 = (a1 * e.p.x) + (b1 * e.p.y) + c1;
	    d2 = (a1 * e.q.x) + (b1 * e.q.y) + c1;

	    // If d1 and d2 both have the same sign, they are both on the same side
	    // of our line 1 and in that case no intersection is possible. Careful, 
	    // 0 is a special case, that's why we don't test ">=" and "<=", 
	    // but "<" and ">".
	    if (d1 > 0 && d2 > 0) return false;
	    if (d1 < 0 && d2 < 0) return false;

    // The fact that vector 2 intersected the infinite line 1 above doesn't 
    // mean it also intersects the vector 1. Vector 1 is only a subset of that
    // infinite line 1, so it may have intersected that line before the vector
    // started or after it ended. To know for sure, we have to repeat the
    // the same test the other way round. We start by calculating the 
    // infinite line 2 in linear equation standard form.
    a2 = e.q.y - e.p.y;
    b2 = e.p.x - e.q.x;
    c2 = (e.q.x * e.p.y) - (e.p.x * e.q.y);

    // Calculate d1 and d2 again, this time using points of vector 1.
    d1 = (a2 * this.p.x) + (b2 * this.p.y) + c2;
    d2 = (a2 * this.q.x) + (b2 * this.q.y) + c2;

    // Again, if both have the same sign (and neither one is 0),
    // no intersection is possible.
    if (d1 > 0 && d2 > 0) return false;
    if (d1 < 0 && d2 < 0) return false;

    // If we get here, only two possibilities are left. Either the two
    // vectors intersect in exactly one point or they are collinear, which
    // means they intersect in any number of points from zero to infinite.
    if ((a1 * b2) - (a2 * b1) == 0.0) return true;

    // If they are not collinear, they must intersect in exactly one point.
    return true;
	}
};

function Poly(){
	this.vertices = [];
	this.edges = [];
	this.minBox = new Vertex(1,1);
	this.maxBox = new Vertex(0,0);

	this.z = 0;

	this.r = Math.floor(Math.random()*256);
	this.g = Math.floor(Math.random()*256);
	this.b = Math.floor(Math.random()*256);

	if( arguments[0] instanceof Poly ){
		// construct by copy
		var p = arguments[0];
		for( var i = 0; i < p.vertices.length; i++ ){
			this.vertices.push( new Vertex(p.vertices[i]) );
		}
	} else if( arguments[0] instanceof Vertex ){
		var i = 0, v;
		while( (v = arguments[i]) instanceof Vertex ){
			this.vertices.push( new Vertex(v) );
			i++;
		}
	} else if( arguments[0] instanceof Array ){
		var a = arguments[0];
		for( var i in a ){
			this.vertices.push( new Vertex(a[i]) );
		}
	}

	for( var i = 0; i < this.vertices.length; ++i ){
		this.edges.push( new Edge(this.vertices[i], this.vertices[(i+1)%this.vertices.length], true));
	}

	this.updateBox();
};

Poly.prototype = {

	contains: function( v ){

		if( v.x < this.minBox.x || v.x > this.maxBox.x ||
			v.y < this.minBox.y || v.y > this.maxBox.y ) {
			return false;
		}	

		var u = new Vertex(-1, v.y);
		var ray = new Edge(u,v);

		var inter = 0;		
		for( var i = 0; i < this.edges.length; ++i){
			if( this.edges[i].intersect(ray) ){
				inter++;
			}
		}
		return inter % 2 == 0 ? false : true;
	},

	updateBox: function(){
		this.minBox = new Vertex(1,1);
		this.maxBox = new Vertex(0,0);
		for( var i in this.vertices ){
			var v = this.vertices[i];
			this.minBox.x = Math.min(this.minBox.x, v.x);
			this.maxBox.x = Math.max(this.maxBox.x, v.x);
			this.minBox.y = Math.min(this.minBox.y, v.y);
			this.maxBox.y = Math.max(this.maxBox.y, v.y);
		}
	},

	compare: function( p ){
		return this.z - p.z;
	},

	makeObservable: function(){
		Obs.observable( this, true );
	},

	notify: function(){},

	update: function(){
		this.notify('update');
	},

	vertice: function( i ){
		return this.vertices[i];
	},

	barycenter: function(){
		var b = new Vertex();
		for( var i in this.vertices ) b = b.plus(this.vertices[i]);
		return b.scale(1/this.vertices.length);
	}
};

function Ordered( itemType ){
	this.elts = [];
	this.itemType = itemType;
}

(function(){

	function blankMap( ordered ){
		var map = [];
		for( var i = 0; i < ordered.elts.length; ++i ) map[i] = [i];
		return map;
	}

	Ordered.prototype = {
		rearrange: function( map ){
			var arr = [];
			for( var i = 0; i < this.elts.length; ++i ){
				arr[i] = this.elts[map[i]];
			}
			this.elts = arr;
			return this;
		},
		moveElt: function( i, j ){
			var map = blankMap(this);
			if( i < j ){
				map.map(function( m ){ return m > i && m <= j ? --m : m });
			} else if( i > j ){
				map.map(function( m ){ return m >= j && m < i ? ++m : m });
			}
			return this.rearrange(map);
		},
		push: function( elt ){
			if( elt instanceof Array ){
				this.elts.push.apply(this.elts, elt);
			} else if ( elt instanceof this.itemType ){
				this.elts.push(elt);
			}
			return this;
		},
		size: function(){
			return this.elts.length;
		},
		get: function( i ){
			return this.elts[i] || null;
		}
	}

})();

// Interface

function PolyView( poly ){
	this.poly = poly;
	this.wrapper = $('<div class="wrapper"></div>'); // data-wid="'+(NB_POLY-1-i)+'"
	this.holder = $('<div class="holder"></div>'); // data-wid="'+(NB_POLY-1-i)+'"

	this.wrapper.append(this.holder);

	$('.workbench .polys').append(this.wrapper);

	Obs.observe(poly, this);
}

PolyView.prototype = {
	onUpdate: function( ){
		var clip = 'polygon(';

		for( var j = 0; j < this.poly.vertices.length; ++j){
			if( j !== 0 ) clip +=', ';
			var v = this.poly.vertices[j];
			clip += toper(v.x)+' '+toper(v.y);
		}
		clip += ')';

		this.holder.css({
			'-webkit-clip-path': clip,
			'background-color': 'rgb('+this.poly.r+','+this.poly.g+','+this.poly.b+')'
		});

		this.wrapper.css('z-index', this.poly.z);
	},

	onMouseEnter: function(){
		this.holder.addClass('highlight');
	},

	onMouseLeave: function(){
		this.holder.removeClass('highlight');
	},

	onSelect: function(){
		this.holder.addClass('selected');
	},

	onDeselect: function(){
		this.holder.removeClass('selected');
	}
}



// app

var holders = [];

var polys = new Ordered(Poly);

var highlighted = null;
var selected = null;
var currentHandle = null;

function toper( x ){
	return x*100+'%';
}

function update_poly( i ){
	// var p = polys.get(i), h = holders[i];

	// var clip = 'polygon(';

	// for( var j = 0; j < p.vertices.length; ++j){
	// 	if( j !== 0 ) clip +=', ';
	// 	var v = p.vertices[j];
	// 	clip += toper(v.x)+' '+toper(v.y);
	// }
	// clip += ')';

	// h.css({
	// 	'-webkit-clip-path': clip,
	// 	'background-color': 'rgb('+p.r+','+p.g+','+p.b+')'
	// });
}

function update_all_polys(){
	for( var i = 0; i < NB_POLY; ++i ){
		update_poly(i);
	}
}

function relativeCoord( x, y, element ){
	var offset = element.offset();
	return new Vertex((x - offset.left)/element.width(),
					  (y - offset.top)/element.height());
}

function meToPoly( me, workbench ){
	// var offset = workbench.offset();
	// var x = (me.pageX - offset.left)/workbench.width();
	// var y = (me.pageY - offset.top)/workbench.height();
	//console.log(x, y);

	var p = relativeCoord(me.pageX, me.pageY, workbench);

	for( var i = polys.size()-1; i >= 0; --i ){
		if( polys.get(i).contains(p) ){
			return polys.get(i);
		}
	}

	return null;
}

$(document).ready(function(){

	$('.workbench').append($('<div class="polys"></div>'));
	$('.workbench').append($('<div class="handles"></div>'));

	var polyObserver = Obs.observe( Poly, {
		onArrive: function( poly ){
			new PolyView( poly );
			poly.update();
		}
	});

	for( var i = 0; i < NB_POLY; ++i){
		var vs = [];
		for( var j = 0; j < NB_VERTICES; j++){
			vs.push( new Vertex(Math.random(), Math.random() ) );
		}
		var p = new Poly(vs);
		p.id = i;
		polys.push(p);
		p.makeObservable();
	}

	for(var i = 0; i < NB_POLY; ++i){
		// var wrapper = $('<div class="wrapper" data-wid="'+(NB_POLY-1-i)+'"></div>');
		// var holder = $('<div class="holder" data-wid="'+(NB_POLY-1-i)+'"></div>');
		// $('.workbench .polys').append(wrapper.append(holder));
		// holders.unshift(holder);
	}

	update_all_polys();

	var _currentHover = null;
	$('.workbench .polys').on('mousemove', function(e){
		var p = meToPoly(e, $(this));
		if( _currentHover !== p ){
			if( _currentHover ) _currentHover.notify('mouseLeave');
			_currentHover = p;
			$('#main-workbench').toggleClass('oversomething', _currentHover? true : false);
			if( _currentHover ) _currentHover.notify('mouseEnter');
		}
	});

	$('.workbench .polys').click( function(e){
		var p = meToPoly(e, $(this));
		if( selected ) selected.notify('deselect');
		selected = p;
		removeHandles();
		$('#main-workbench').toggleClass('somethingselected', selected? true : false);
		if( p ){
			p.notify('select');
			var e = new Event('polySelected');
			e.poly = p;
			window.dispatchEvent(e);
		}
	});



	$('#main-workbench').on('dragover', function(e){

		if( currentHandle.attr('data-vertex') ){
			var vi = parseInt(currentHandle.attr('data-vertex'))
			var v = selected.vertices[vi];

			var v_ = relativeCoord(e.pageX, e.pageY, $(this)).plus(new Vertex(-0.02,-0.02));
			v.x = v_.x; v.y = v_.y;

			// currentHandle.css({
			// 	'top': toper(v_.y),
			// 	'left': toper(v.x)
			// });

			selected.update();

			e.preventDefault();
		}

		
	});

	$('#main-workbench').on('dragenter', function(e){
		e.preventDefault();
	});

	$('#main-workbench').on('drop', function(e){
		e.preventDefault();
	});

});

function removeHandles(){
	$('#main-workbench .handles').children('*').remove();
}

function addHanlde( poly, data, fv, param ){
	var handle = $('<div class="handle" draggable="true" '+data+'></div>');


	function update(){
		var v = new Vertex();
		if( poly[fv] instanceof Function ) v = poly[fv](param);
		handle.css({
			'top': toper( v.y ),
			'left': toper( v.x )
		});
	}

	var obse = {onUpdate: update};

	Obs.observe( poly, obse );

	handle.on('dragstart', function(e){
		console.log(e);
		currentHandle = $(this);
		//e.originalEvent.dataTransfer.setData('number', i);
	});

	handle.on('dragend', function(e){
		console.log('drag end', e);
		Obs.stopObservation( poly, obse );
	});

	update();

	$('#main-workbench .handles').append(handle);
}

function addHanldes( poly ){
	var bar = new Vertex(0,0);
	for( var i in poly.vertices ){
		addHanlde(poly, 'data-vertex="'+i+'"', 'vertice', i);
	}
	addHanlde(poly, 'data-handle="move"', 'barycenter', null);
}

window.addEventListener('polySelected', function( e ){
	//console.log('poly selected !', e.poly);

	addHanldes(e.poly);

});

