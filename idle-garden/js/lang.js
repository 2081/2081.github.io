

var L;

(function LangScope(){

	var LOCALES = [];

	var defaultLocale = "en_US";
	var currentLocale = defaultLocale;

	var words = {};


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
		if( args ){
			//console.log(processString, args);
			var brackets = /[{]([^}{}]*)[}]/g;
			var id = /^\w+$/g;
			var idnoreplace = /^\d+[!]$/g;
			var conditions = /^(\d+)|([><=])/;
			while(str.match(brackets)){
				str = str.replace(brackets, function(a, o){
					var i;
					if( (i = o.match(id)) ) {
						return args[i] || args[parseInt(i)];
					} else {
						var expressions = o.split("|");
						var identifier;
						if( !(identifier = o.match(expressions[0])) ) throw new Error("Lang: cannot parse : {"+o+"}. Identifier expected after bracket.");
						for( var i = 1; i < expressions.length; ++i){
							var s = expressions[i];
							var match = s.match(/^([><=])?(([+-]?(\d*|\d+\.\d+))|\{(\d+)\}])\?(.*$)/);
							var op = match[1], n = new Big(args[identifier] || 0), m = new Big(match[2] || 0), exp = match[6];
							switch(op){
								case '>':
									if( n.gt(m) ) return exp;
									break;
								case '<':
									if( n.lt(m) ) return exp;
									break;
								case '=':
									if( n.eq(m) ) return exp;
									break;
								default:
									return exp;
							}
						}
					}
					return "";
				})
			}
		}
		return str;
	}

	/*var str1 = "I'm {0} the {1|>0?Superieur a 0.|<{0}?Inferieur a 0.|=0?Egal 0. |?Else} with my head.";
	var str1 = "I can tell you that {0} is {0|>{1}?greater than|<{1}?lower than|?equal to} {1}.";
	var str1 = "I have {0} carrot{0|>1?s}";

	processString( str1 , [6,5]);
	processString( str1 , [1,6]);
	processString( str1 , [5,5]);*/

	wordHandler = function( str ){
		return function(){ return processString(str, arguments)}
	}


	L = function(id, str, locale) {
		var str;
		if( typeof str !== 'undefined' ){
			if( typeof locale !== 'undefined' ){
				words[locale][id] = str;
				return L[locale];
			}
			words[defaultLocale][id] = str;
			return L;
		} else if ( typeof id !== 'undefined' ){
			str = words[currentLocale][id] || words[defaultLocale][id];
		}
		return str;
	}

	L.addLanguageSupport = function( code ){
		LOCALES.push(code);
		words[code] = {};
		L[code] = function( id, str ){ L(id,str,code); return L[code]};
	}

	L.selectLanguage = function( code ){
		if( words[code] ) currentLocale = code;
	}


	L.keys = function(){
		return Object.keys(words[defaultLocale]);
	}

	L.addLanguageSupport("en_US");

	String.prototype.Lformat = function(){ return processString(this,arguments.length == 1 && typeof arguments[0] === 'object' ? arguments[0]: arguments) };


})();

L.selectLanguage("en_US");

L("a","This piece of land cannot produce any <strong>Mighty Dust</strong>.")
 ("b","La réponse b");