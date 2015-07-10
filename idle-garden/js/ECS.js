{

	var ECS = function(){};
	{
		ECS.prototype.select = function( selection ){

		}
		ECS.prototype.entities = {};
	}

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
		ECS.entities[this.id] = this;
	};
	{
		var Entity = ECS.prototype.Entity;
		Entity.prototype.add = function( component, params ){
			this.components[component] = ECS.newComponent(component, params);
			return this;
		};
	}

	ECS.prototype.components = {};
	ECS.prototype.defineComponent = function( name, struct ){
		var c = function(){
			for( var item in struct ){
				this[item] = struct[item];
			}
		}
		c.prototype.name = name;
		ECS.components[name] = c;
	};
	ECS.prototype.newComponent = function( name, struct ){
		console.log(new ECS.components[name],name,struct);
		return mergeProperties(new ECS.components[name],struct || {});
	};

	window.EntityComponentSystem = ECS;
}

var ECS = new EntityComponentSystem();

ECS.defineComponent("position",{x:0,y:0});

/* ECS.defineSystem("render","position displayable", function(){

	})???.requestSort("ascending",function(e){e.position.z});
	;
*/
/*
ECS.defineOrder([
	"collision",
	"render"
]);
*/

var e = new ECS.Entity().add("position",{y:30});
console.log(ECS, e);
