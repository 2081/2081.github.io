

var L;

(function LangScope(){

	var words = {};

	L = function(id, str) {
		if( typeof str !== 'undefined' ){
			words[id] = str;
			return this;
		} else if ( typeof id !== 'undefined' ){
			return words[id];
		}
		return "";
	}

})();

L("a","This piece of land cannot produce any *Mighty Dust*.")
 ("b","");

 console.log(L("a"),L("b"));