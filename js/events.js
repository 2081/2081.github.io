
var width = Math.min($(window).width(),1024);

// creates multi-line text
function _parseText(text) {
	var parag = "";
	var continuer = true;
	for (var i = 0; i<text.length; i++)
	{
		continuer = true;
		var j;
		//If we find a "[" we continue running through text until we find a "]"
		if (text.charAt(i)=="[")
		{
			for (j=i+1; (j<(text.length)) && (continuer == true); j++)
			{	
				//If we find the "]" we just check if it was an oppening or a closing tag.
				if (text.charAt(j)=="]")
				{
					if (text.charAt(i+1)!="/")
					{
						//Adding the oppening tag as an html tag
						parag+="<"+text.substring((i+1),j)+">";
					}
					else
					{
						//Adding the closing tag as an html tag
						parag+="<"+text.substring((i+1),j)+">";		
					}
					continuer = false
				}
			}
			i+=(j-i)-1;
		}
		else 
		{
			parag+=text.charAt(i);
		}
	}
	return parag;
}

function getStringDate(date)
{
	var options = {weekday: "long", day: "2-digit", month: "long", hour: "2-digit", minute:"2-digit"};
	var str = date.toLocaleString("fr-FR",options);
	//First letter of the words to upper case
	str = str.replace(/([a-z])([a-z]*)/g, function(match,p1,p2){return p1.toUpperCase() + p2;}); 
	return str;
}

$.getJSON('events.json',function(data) {
	console.log(data); // this will show the info it in firebug console 
	var events = data.events;
        var places = data.places;
	var mainDiv = document.getElementById("events");
	
	var grid = document.createElement("ul");
	grid.className = "small-block-grid-2 medium-block-grid-4 large-block-grid-5";
	mainDiv.appendChild(grid);
	for( var i = 0; i < events.length; ++i)
	{
		var modalName = "modalEvent"+i;
		var evt = events[i];
                var place = places[evt.place]; // id is useless in the json
                
		var bloc = document.createElement("li");
		bloc.className = "text-center event-thumbnail";
		
		var link = document.createElement("a");
		link.href = "#";
		//link.className = "th [radius]";
		link.setAttribute("data-reveal-id",modalName);
		
		var img = document.createElement("img");
                img.src = "img/";
                if( "img" in evt ) {
                    img.src += evt.img;
                } else {
                    img.src += "pirate_fille.png";
                }
		
		img.alt = "image - "+evt.title;
		
		var title = document.createElement("p");
		title.className = "subheader eventTitle";
		title.textContent = evt.title;
		
		var date = document.createElement("h6");
		
		//var now = new Date(2014,8,14);
		var now = new Date();
		var d = new Date(evt.d);
		
		var dateClass = "";
		if( now.getDate() === d.getDate() ) // day from 1 to 31
		{
			dateClass = "soon";
                        var strDate = getStringDate(d);
			date.textContent = "Aujourd'hui à " + strDate.substring(strDate.length-5);
		} else if( now > d ) {
			dateClass = "past";
			date.textContent = "Dépassé";
		} else {
			dateClass = "future";
			date.textContent = getStringDate(d);
		}
		date.className = dateClass;
		
		link.appendChild(img);
		
		bloc.appendChild(link);
		bloc.appendChild(date);
		bloc.appendChild(title);
		
		grid.appendChild(bloc);
		
		
		// Creating reveal modal
		var modal = document.createElement("div");
		modal.id = modalName;
		modal.className = "reveal-modal medium text-center";
		modal.setAttribute("data-reveal","");
		modal.innerHTML = "<a class=\"close-reveal-modal\">&#215;</a>";
                
		var title = document.createElement("h1");
		title.textContent = evt.title;
		
		var gpslink = document.createElement("a");
		gpslink.className = "th [radius]";
		gpslink.href = "http://maps.google.com/maps?z=12&t=m&q="+place.gps.replace(",","+");
		gpslink.target = "_blank";
		
		var static_map = document.createElement("img");
		static_map.alt = "Google Map - "+evt.title;
		var url = "http://maps.googleapis.com/maps/api/staticmap?";
		url += "size="+width+"x200";
		url += "&markers=color:green|" + place.gps;
		static_map.src = "";
		static_map.setAttribute("temp",url);
		gpslink.appendChild(static_map);
		
		//Adding a content element p that will contain the description
		var content = document.createElement('p');
		//As we already know what the html code for the content element is, we can set it without element functions
		content.innerHTML = _parseText(evt.content);
		var rdv = document.createElement("p");
		rdv.appendChild(document.createTextNode(getStringDate(new Date(evt.d))));
		rdv.appendChild(document.createElement("br"));
		rdv.appendChild(document.createTextNode( "Lieu de rendez-vous : "+ place.name ));
		if( evt.tram > 0 ){
			rdv.appendChild(document.createElement("br"));
			rdv.appendChild(document.createTextNode("Tu auras besoin de "+evt.tram+" ticket"+(evt.tram > 1 ? "s":"")+" de tram.")) ;
		}
                
                if( "prix" in evt){
                    rdv.appendChild(document.createElement("br"));
                    rdv.appendChild(document.createTextNode("Coût de la sortie : "+ evt.prix));
                }
                
                var banner = img.cloneNode();
                banner.className += "banner";
                
                modal.appendChild(banner);
		modal.appendChild(title);
		modal.appendChild(rdv);
		
		modal.appendChild(gpslink);
                modal.appendChild(document.createElement("br"));
                modal.appendChild(document.createElement("br"));
		modal.appendChild(content);
		
		
		mainDiv.appendChild(modal);
	}
	//console.log(events);
	
	$(document).foundation();
	
	$(document).on('open.fndtn.reveal', '[data-reveal]', function () {
		// prevent all the Maps images to be loaded before we need them
		var modal = $(this);
		var img = modal.children("a").children("img")[0];
		img.src = img.getAttribute("temp");
	});
});

