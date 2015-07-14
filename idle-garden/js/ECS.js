/*(function(){

	var FUNCTION_SEPARATOR = "\u02d0";

	// For debug purposes
	function namedFunction(name, fn) { // http://stackoverflow.com/a/28665860
	    return new Function('fn',
	        "return function ECS" + FUNCTION_SEPARATOR + name + "(){ return fn.apply(this,arguments)}"
	    )(fn)
	}

	var ECS = function(){};
	{
		ECS.prototype.select = function( selection ){

		}
		ECS.prototype.entities = {};
	}
	var ecs = ECS.prototype;
	ecs.Component = {};

	var mergeProperties = function( s1, s2 ){
		for( var i in s1 ){
			if( typeof s2[i] !== 'undefined' ) s1[i] = s2[i];
		}
		return s1;
	};

	var curEntityID = 0;
	ECS.prototype.Entity = function(){
		this.id = curEntityID++;
		this.components = {};
		ecs.entities[this.id] = this;
	};
	(function(){
		var Entity = ECS.prototype.Entity;
		Entity.prototype.add = function( component, params ){
			this.components[component] = ecs.newComponent(component, params);
			this.components[">"+component] = true;
			return this;
		};

		Entity.prototype.remove = function( component ){};

		Entity.prototype.disable = function( component ){};
	})();

	ECS.prototype.components = {};
	ECS.prototype.defineComponent = function( name, struct ){

		var c = namedFunction("Component"+FUNCTION_SEPARATOR+name,function (){
			for( var item in struct ){
				this[item] = struct[item];
			}
		});
		c.prototype.name = name;
		ecs.components[name] = c;
	};
	ECS.prototype.newComponent = function( name, struct ){
		console.log(new ecs.components[name],name,struct);
		return mergeProperties(new ecs.components[name],struct || {});
	};

	window.EntityComponentSystem = ECS;
})();/**/

(function(){
	var ECS = function(){
	};
	var ecs = ECS.prototype;

	// public namespaces
	var $Component = ecs.Component = {};
	var $System = ecs.System = {};
	var $Entity = ecs.Entity = {};


	var componentDefinitions = {};

	var Component;
	(function(){
		var stdCmpMap = {};
		var newCmpMap = {};
		var disCmpMap = {};

		Component = function( name ){

		}

		Component.init = function( name ){
			stdCmpMap[name] = {};
			newCmpMap[name] = {};
			disCmpMap[name] = {};
		}

		Component.add = function( id, name, args ){
			if( ! componentDefinitions[name] ) throw new Error("ECS: Component "+name+" does not exist.");
			var cmp = componentDefinitions[name].new(args);
			stdCmpMap[name][id] = newCmpMap[name][id] = cmp;
		}

		Component.remove = function( id, name ){
			if( ! stdCmpMap[name] ) throw new Error("ECS: Component "+name+" does not exist.");
			delete stdCmpMap[name][id];
			delete newCmpMap[name][id];
			delete disCmpMap[name][id];
		}

		Component.removeAll = function( id ){
			for( var cmp in componentDefinitions ){
				Component.remove(id, componentDefinitions[cmp].name);
			}
		}

	})();

	var ComponentDefinition = function( name ){
		this.name = name;

		Component.init(name);

		this._properties = {};
		this.properties = function( props ){ this._properties = props; return this;};

		this._constructor = function(){};
		this.constructor = function( f ){ // ( f || "a","b",... )
			if( typeof f === 'string'){
				var args = arguments;
				this._constructor = function(){
					for( var i = 0; i < args.length; ++i ) this[args[i]] = arguments[i];
				}
			} else if( typeof f === 'function'){
				this._constructor = f;
			}
			return this;
		};

		this.new = function(args){
			var cmp = {};
			cmp[this.name] = this._properties;
			this._constructor.apply(cmp[this.name],args);
			return cmp;
		};
	}

	$Component.define = function( name ){
		var cd = new ComponentDefinition(name);
		componentDefinitions[name] = cd;
		return cd;
	}

	var Entity;
	(function(){

		var entities = {};

		var lastId = 0;

		function newId(){
			return lastId++;
		}

		function addCmp(name){
			var entity = this;
			return function(){
				Component.add(entity.id,name,arguments);
				return entity;
			}
		}

		function removeCmp(name){
			Component.remove(this.id,name);
			return this;
		}

		function kill(){
			Component.removeAll(this.id);
			delete entities[this.id];
		}

		Entity = function( id ){
			if( typeof id === 'undefined'){
				id = newId();
				entities[id] = true;
			}
			if( entities[id] ){
				var entity = {
					id: id,
					add: addCmp,
					remove: removeCmp,
					kill: kill
				}
				return entity;
			}
			return null;
		}



	})();

	$Entity.create = function(){
		return Entity();
	}

	$Entity.get = function(id){
		return Entity(id);
	}

	var System;
	(function(){
		var systems = {};

		System = new function System(){};

		function sort(){
			return this;
		}

		function setSelection( selection ){
			systems[this.name].selection = selection;
			return this;
		}

		function setEach( each ){
			systems[this.name].each = each;
			return this;
		}

		function setDo( fdo ){
			systems[this.name].do = fdo;
			return this;
		}

		System.define = function( name ){
			var systemFactory = {
				name: name,
				select: setSelection,
				sort: sort,
				do: setDo,
				each: setEach,

			};

			if( ! systems[name] ) {
				systems[name] = {
					selection: null,
					sort: null,
					do: null,
					each: null
				};
			}
			
			return system;
		}

		System.delete = function( name ){
			delete systems[name];
		}
	})();

	console.log(System);

	$System.define = function( name ){
		return System.get(name);
	}

	$System.delete = function( name ){
		System.delete( name );
	}

	window.EntityComponentSystem = ECS;

})();


var ECS = new EntityComponentSystem();

/*
	ECS.Component.define("name") 
					.properties({
						x: 0,
						y: 0
					})
					.constructor("x","y")
					.constructor(function(x,y){
	
					});

	ECS.System.define("render")
				.select("position >displayable")
				.sort()
				.do(function( entities ){
	
				})
				.each( function( entity ){
	
				});

	ECS.Entity.create() : returns id ... how ?
				.add("position")(x,y)
				.add("displayable")(display);
				.delete()
	
	ECS.System.order([
		"collision",
		"render"
	]);
*/

console.log(ECS.Component.define("walking")
							.properties({
								x: 0,
								y: 0
							})
							//.constructor("y","x"));
							.constructor(function(x,y){this.x = x; this.y = y;console.log("Walking:",this)}));

console.log(ECS.Entity.create()
						.add("walking")(8,3),
			ECS.Entity.create().add("walking")(10,15).kill());
console.log(ECS);

ECS.System.define("rwalk")
			.select("walking")
			.each(function( entity ){

			});

/*
ECS.defineComponent("position",{x:0,y:0});

var e = new ECS.Entity().add("position",{y:30});
console.log(ECS, e);

var obj = {
	">position": 10,
	position : {
		x : 5
	}
};
console.log(obj, obj["position.x"]);
(function(){
	var a;
	console.log(this);
})();
console.log(this);
*/