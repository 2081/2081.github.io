
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
			kingdom		: "soil",
			gloss		: GLOSS.DEFAULT
		}
		return families[id] = data;
	}

	function findGlossEntry( gloss ){
		return families.find( function(o){ return o.gloss === gloss });
	}

	var FamilyHandler = new Class(DataHandler).extend({

	});

	ItemFamily = function(id){
		var fdata = families[id];
		if( !fdata && typeof id === 'string' ){
			// Retrieving item from glossary entry
			fdata = findGlossEntry(id);
		}
		return new FamilyHandler(fdata);
	}

})();

Init(function(){
	L(GLOSS.FAMILIES.A, "Item A")
	 (GLOSS.FAMILIES.B, "Item B");
});


var Item;

(function ItemScope(){

	var F = GLOSS.FAMILIES;

	var items = {};

	function ItemData( id ){
		if( items[id] ) return items[id];
		var data = {
			id 			: id,
			hash		: null,
			family		: null,
			level		: new Big(0)
		}
		return items[id] = data;
	}

	var ItemHandler = new Class(DataHandler).extend({

	});

	var ItemSelection = new Class(DataSelectionHandler).extend({
		_handlerClass: ItemHandler
	})

	function findHash( hash ){
		return items.find( function(o){ return o.hash === hash });
	}

	Item = function( id ){
		var idata = items[id];
		if( typeof id === 'string' ){
			// Retrieving item from hash should not fail, ever
			if( isHash(id) ){ 
				idata = findHash(hash);
				if( !idata ) {
					var guid = GUID();
					items[guid] = idata = ItemData(guid);
					idata.hash = id;
				}
			}
		}
		assert(idata, "Could not retrieve item from : {0}.".format(id));
		return new ItemHandler(idata);
	}

})();