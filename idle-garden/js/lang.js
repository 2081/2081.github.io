

var L;

(function LangScope(){

	var LOCALES = [];

	var defaultLocale = "en_US";
	var currentLocale = defaultLocale;

	var words = {};

	L = function(id, str, locale) {
		if( typeof str !== 'undefined' ){
			if( typeof locale !== 'undefined' ){
				words[locale][id] = str;
				return L[locale];
			}
			words[defaultLocale][id] = str;
			return L;
		} else if ( typeof id !== 'undefined' ){
			return words[currentLocale][id] || words[defaultLocale][id];
		}
		return "";
	}

	L.addLanguageSupport = function( code ){
		LOCALES.push(code);
		words[code] = {};
		L[code] = function( id, str ){ L(id,str,code); return L[code]};
	}

	L.selectLanguage = function( code ){
		if( words[code] ) currentLocale = code;
	}

	L.addLanguageSupport("en_US");

	/*
		TODO: include {0},{1} to include parameters in the language
		{0|[OP1]?lalalala...|[OP2]?lililil...|?in the end}
		OP
			>(N|V)
			<(N|V)
			=(N|V)
			where N is a number : -15.26, 5, 5666, 456.2146
			where V is a variable : {0}, {1}, {0|...} (beware loops !)

		lack of OP means "else"

	*/

	function processString( str, args ){
		var brackets = /[{]([^}{}]*)[}]/g;
		var id = /^\d+$/g;
		var idnoreplace = /^\d+[!]$/g;
		//var conditions = /^(\d+)(|([><=]?)\?[^|]*)+$/g;
		var conditions = /^(\d+)|([><=])/;
		while(str.match(brackets)){
			str = str.replace(brackets, function(a, o){
				console.log(o, o.match(id));
				var i;
				if( (i = o.match(id)) ) {
					return args[parseInt(i)];
				} else if( i = o.match(idnoreplace)){
					console.log("noreplace");
					return o.replace('!','');
				} else {
					var expressions = o.split("|");
					console.log(expressions);
					var identifier;
					if( !(identifier = o.match(expressions[0])) ) throw new Error("Lang: cannot parse : {"+o+"}. Identifier expected after bracket.");
					for( var i = 1; i < expressions.length; ++i){
						var s = expressions[i];
						"(([+-]?(\d*|\d+\.\d+))|\{(\d+)\}])";
						var op = s.match(/^([><=])?(([+-]?(\d*|\d+\.\d+))|\{(\d+)\}])\?(.*$)/);
						//var rep = s.substring(s.indexOf('?')+1);
						console.log(o,op);
						/*switch(op){
							default:
								return 
						}*/
					}
				}
				return o;
			})
		}
		console.log("result :", str);
	}

	var str1 = "I'm {0} the {1|>0?Superieur a 0.|<{0!}?Inferieur a 0.|=0?Egal 0. |?Else} with my head.";

	processString( str1 , ["banana",5]);

})();

L("a","This piece of land cannot produce any *Mighty Dust*.")
 ("b","La réponse b");

 console.log(L("a"),L("b"));
 L.selectLanguage("en_US");