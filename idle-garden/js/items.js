
GLOSS.ITEM = "item";
GLOSS.FAMILY = "family";
GLOSS.FAMILIES = {
		A: "AFamily",
		B: "BFamily"
	}
GLOSS.KINGDOM = {
	SOIL: "SoilKingdom"
}

var ItemFamily, ItemFamilies;
(function ItemFamilyScope(){ /// Actually wonder if this class is useful

	var families = {};

	function FamilyData( id ){
		if( families[id] ) return families[id];
		var data = {
			id 			: id,
			kingdom		: "soil", // tag
			gloss		: GLOSS.DEFAULT, // tag
			sprite		: null,
			chroma		: ''
		}
		return families[id] = data;
	}

	function findGlossEntry( gloss ){
		//return families.find( function(o){ return o.gloss === gloss });
		return Utils.find(families, function(o){ return o.gloss === gloss });
	}

	var FamilyHandler = new Class(DataHandler).extend({
		chroma: function(value){return this.attr('chroma',value)},
		gloss: function(value){return this.attr('gloss',value)},
		sprite: function(value){return this.attr('sprite',value)},
		name: function(){return L(this.data.gloss)},
		description: function(){ return L(this.data.gloss+":description")},
		comment: function(){ return L(this.data.gloss+":comment")}
	});

	ItemFamily = function(id){
		var fdata = families[id];
		if( !fdata && typeof id === 'string' ){
			// Retrieving item from glossary entry
			fdata = findGlossEntry(id);
		} else if( !fdata ){
			var guid = GUID();
			fdata = FamilyData(guid);
		}
		return fdata ? new FamilyHandler(fdata) : null;
	}

	ItemFamilies = function(){
		return Utils.objToArray(families).map(function(o){return new FamilyHandler(o)});
	}

})();


var Item;

(function ItemScope(){

	function collectedToLevel( collected ){
		
	}

	var F = GLOSS.FAMILIES;

	var items = {};

	function ItemData( id ){
		if( items[id] ) return items[id];
		var data = {
			id 			: id,
			active		: false,
			hash		: null,
			family		: null, //gloss
			collected	: "0",
			level 		: "1",
			pending		: "0"
		}
		Display(DISPLAY.ITEM, new ItemHandler(data)).init();
		return items[id] = data;
	}

	function removeProd(idata){
		if( idata.hash ){
			var p = Production(idata.hash);
			if( idata.family ) p.removeTags(idata.family);
		}
	}

	function setProd(idata){
		if( idata.hash && idata.active ){
			var p = Production(idata.hash);
			if( idata.family ) p.addTags(idata.family);
		}
	}

	function updateLevel( ihandler ){
		var level = ihandler.level();
		var pending = ihandler.pending();
		var collected = ihandler.collected();
		var need = Item.levelNeeds(level.plus(1));

		var update = false;
		while( pending.gte(need) ) {
			update = true;	
			level = level.plus(1);
			pending = pending.minus(need);
			collected = collected.plus(need);
			need = Item.levelNeeds(level.plus(1));
		};

		if( update ){
			ihandler.attrBig('level',level);
			ihandler.attrBig('pending',pending);
			ihandler.attrBig('collected',collected);
		}
		
	}


	var ItemHandler = new Class(DataHandler).extend({
		attr: function(name, value){
			removeProd(this.data);
			var rep = this.parent(name,value);
			setProd(this.data);
			return rep;
		},
		attrBig: function(name, value){
			if(typeof value !== 'undefined' ) return this.attr(name,value.toString());
			return new Big(this.attr(name, value))
		},
		collected: function(value){ var c = this.attrBig('collected',value);  if(value)updateLevel(this); return c;},
		pending: function(value){ var c = this.attrBig('pending',value);  if(value)updateLevel(this); return c;},
		incPending: function(big){ return this.pending(new Big(this.data.pending).plus(big)); },
		level: function(){ return this.attrBig('level');},
		active: function(bool){return this.attr('active',bool)},
		hash: function(hash){ return this.attr('hash',hash)},
		family: function(family){return this.attr('family',family)},
		familyHandler: function(){ return ItemFamily(this.attr('family'))}
	});

	var ItemSelection = new Class(DataSelectionHandler).extend({
		_handlerClass: ItemHandler
	})

	function findHash( hash ){
		return Utils.find(items, function(o){ return o.hash === hash });
	}

	Item = function( id ){
		var idata = items[id];
		if( typeof id === 'string' ){
			// Retrieving item from hash should not fail, ever
			if( isHash(id) ){ 
				idata = findHash(id);
				if( !idata ) {
					var guid = GUID();
					items[guid] = idata = ItemData(guid);
					new ItemHandler(idata).hash(id);
				}
			} else {
				var f = ItemFamily(id);
				if( f ){
					var guid = GUID();
					items[guid] = idata = ItemData(guid);
					new ItemHandler(idata).family(id);
				}
			}
		}
		assert(idata, "Could not retrieve item from : "+id);
		return new ItemHandler(idata);
	}

	Item.testHash = function( hash ){
		var idata = findHash(hash);
		return idata? new ItemHandler(idata):null;
	}

	Item.levelNeeds = function( level ){
		return level.lte(1) ? new Big(0) : new Big(10).times(new Big(1.12465782211982).pow(level.minus(2))).floor(); 
	}

	console.log("LNeeds", Item.levelNeeds(new Big(2)).toString());

})();


Init(function(){
	L(GLOSS.FAMILIES.A, "Octoplant");
	L(GLOSS.FAMILIES.A+":description", "Produce dust when you click on it.");
	L(GLOSS.FAMILIES.A+":comment", "Eight times cuter.");
	ItemFamily().gloss(GLOSS.FAMILIES.A)
				.sprite('sprites/A/A_{chroma}.png; 0.9;0.9;;-0.65')
				.chroma('purple corail');
	Thumbnail(GLOSS.FAMILIES.A,'sprites/A/A_tbn.jpg');
	Thumbnail(GLOSS.FAMILIES.A+':bw','sprites/A/A_tbn_bw.jpg');

 	L(GLOSS.FAMILIES.B, "Octoplant 2.0");
	L(GLOSS.FAMILIES.B+":description", "Produce dust over time.");
	L(GLOSS.FAMILIES.B+":comment", "Eight times deadlier.");
	ItemFamily().gloss(GLOSS.FAMILIES.B)
				//.sprite('sprites/C/c.png;1;1;;-0.6');
				//.sprite('sprites/C/c.svg;1.1;1.1;;-0.65');
				.sprite('sprites/C/c.svg;1.1;1.1;;-0.65');
				//.sprite('sprites/B/B_{chroma}.png;0.9;0.9;;-0.65')
				//.chroma('blue orange');
	Thumbnail(GLOSS.FAMILIES.B,'sprites/B/B_tbn.jpg');
	Thumbnail(GLOSS.FAMILIES.B+':bw','sprites/B/B_tbn_bw.jpg');

});
