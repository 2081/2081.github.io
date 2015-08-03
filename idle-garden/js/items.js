
GLOSS.ITEM = "item";
GLOSS.FAMILY = "family";
GLOSS.FAMILIES = {
		A: "AFamily",
		B: "BFamily"
	}
GLOSS.KINGDOM = {
	SOIL: "SoilKingdom"
}

var ItemFamily;
(function ItemFamilyScope(){ /// Actually wonder if this class is useful

	var families = {};

	function FamilyData( id ){
		if( families[id] ) return families[id];
		var data = {
			id 			: id,
			kingdom		: "soil", // tag
			gloss		: GLOSS.DEFAULT // tag
		}
		return families[id] = data;
	}

	function findGlossEntry( gloss ){
		//return families.find( function(o){ return o.gloss === gloss });
		return Utils.find(families, function(o){ return o.gloss === gloss });
	}

	var FamilyHandler = new Class(DataHandler).extend({

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

})();

Init(function(){
	L(GLOSS.FAMILIES.A, "Octoplant");
	ItemFamily().attr("gloss", GLOSS.FAMILIES.A);

 	L(GLOSS.FAMILIES.B, "Octoplant 2.0");
	ItemFamily().attr("gloss", GLOSS.FAMILIES.B);
});

var Item;

(function ItemScope(){

	var F = GLOSS.FAMILIES;

	var items = {};

	function ItemData( id ){
		if( items[id] ) return items[id];
		var data = {
			id 			: id,
			active		: false,
			hash		: null,
			family		: null, //gloss
			level		: new Big(0)
		}
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


	var ItemHandler = new Class(DataHandler).extend({
		attr: function(name, value){
			removeProd(this.data);
			var rep = this.parent(name,value);
			setProd(this.data);
			return rep;
		},
		active: function(bool){return this.attr('active',bool)},
		hash: function(hash){return this.attr('hash',hash)},
		family: function(family){return this.attr('family',family)}
	});

	var ItemSelection = new Class(DataSelectionHandler).extend({
		_handlerClass: ItemHandler
	})

	function findHash( hash ){
		Utils.find(items, function(o){ return o.hash === hash });
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

})();