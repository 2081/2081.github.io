
GLOSS.ITEM = "item";
GLOSS.ITEMS = {
		VOID: "itemVOID",
		A: "itemA",
		B: "itemB"
	}

var ItemFamily;
(function ItemFamilyScope(){

	var families = {};

	function FamilyData( id ){
		if( families[id] ) return families[id];
		var data = {
			id 			: id,
			hash		: null,
			definition	: I.VOID,
			level		: new Big(0)
		}
		return families[id] = data;
	}

})();


var Item;

(function ItemScope(){

	var I = GLOSS.ITEMS;

	var items = {};

	function ItemData( id ){
		if( items[id] ) return items[id];
		var data = {
			id 			: id,
			hash		: null,
			definition	: I.VOID,
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