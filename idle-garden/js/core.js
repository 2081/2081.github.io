



var Data;
(function(){

	// Classes

	var DataHandler = new Class({
		initialize: function( data ){
			this.data = data;
		},

		attr: function( name, value ){
			if( typeof value === 'undefined' ) return this.data[name];
			this.data[name] = value;
			return this;
		},

		attrKeyValue: function( name, key, value ){
			if( typeof value === 'undefined' ) return this.data[name][key];
			this.data[name][key] = value;
			return this;
		},

		id: function(){ return this.data.id }
	});

	// Init

	var DATAS = {};


	function Handler( data ){
		if( ! data ) return null;

		return DataHandler(data);
	}

	Data = function( id ){
		return Handler( DATAS[id] );
	}
	Data.new = function( data ){
		var id = data ? data.id : GUID();
		return Handler( DATAS[id] = data || {id:id}; )
	}

})();