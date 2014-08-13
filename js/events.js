/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

/*$.ajax({
    url: 'events.json',
    dataType: 'json',
    error: function(xhr, status, error) {
        var err = eval("(" + xhr.responseText + ")");
        alert(err.Message);
    },
    success: function( data ) {
      alert( "SUCCESS:  " + data );
    }
  });
  */
 
 var width = Math.min($(window).width(),1024);



$.getJSON('events.json',function(data) {
    console.log(data); // this will show the info it in firebug console 
    var events = data.events;
    var mainDiv = document.getElementById("events");
    
    var grid = document.createElement("ul");
    grid.className = "small-block-grid-2 medium-block-grid-3 large-block-grid-4";
    mainDiv.appendChild(grid);
    for( var i = 0; i < events.length; ++i)
    {
        var modalName = "modalEvent"+i;
        var evt = events[i];
        var bloc = document.createElement("li");
        bloc.className = "text-center";
        
        var link = document.createElement("a");
        link.href = "#";
        //link.className = "th [radius]";
        link.setAttribute("data-reveal-id",modalName);
        
        var img = document.createElement("img");
		
		// TEMPORARY
		switch( i ) {
		case 0:
			img.src = "img/combat_moussaillon.png";
			break;
		case 1:
			img.src = "img/cuite.png";
			break;
		default:
			img.src = "img/eye.png";
			break;
		}
		// TEMPORARY
		
		
        img.alt = "image - "+evt.title;
        
        link.appendChild(img);
        bloc.appendChild(link);
        
        var title = document.createElement("h4");
        title.className = "subheader";
        title.textContent = evt.title;
        bloc.appendChild(title);
        
        grid.appendChild(bloc);
        
        
        // Creating reveal modal
        var modal = document.createElement("div");
        modal.id = modalName;
        modal.className = "reveal-modal tiny";
        modal.setAttribute("data-reveal","");
        modal.innerHTML = "<a class=\"close-reveal-modal\">&#215;</a>";
        
        var title = document.createElement("h1");
        title.textContent = evt.title;
        
        var gpslink = document.createElement("a");
        gpslink.className = "th [radius]"
        gpslink.href = "http://maps.google.com/maps?z=12&t=m&q="+evt.gps.replace(",","+");
        gpslink.target = "_blank";
        
        var static_map = document.createElement("img");
        static_map.alt = "Google Map - "+evt.title;
        var url = "http://maps.googleapis.com/maps/api/staticmap?";
        url += "size="+width+"x200";
        url += "&markers=color:green|" + evt.gps;
        static_map.src = "";
        static_map.setAttribute("temp",url);
        gpslink.appendChild(static_map);
        
        var content = document.createElement("p");
        content.appendChild(document.createTextNode(evt.content));
        var rdv = document.createElement("p");
        rdv.textContent = "Lieu de rendez-vous : "+ evt.rdv;
        if( evt.tram > 0 ){
            rdv.appendChild(document.createElement("br"));
            rdv.appendChild(document.createTextNode("Tu auras besoin de "+evt.tram+" ticket"+(evt.tram > 1 ? "s":"")+" de tram.")) ;
        }
        modal.appendChild(title);
        modal.appendChild(rdv);
        
        modal.appendChild(gpslink);
        modal.appendChild(content);
        
        
        mainDiv.appendChild(modal);
    }
    //console.log(events);
    
    $(document).foundation();
    
    $(document).on('open.fndtn.reveal', '[data-reveal]', function () {
        // prevent all images to be loaded before we need them
        var modal = $(this);
        var img = modal.children("a").children("img")[0];
        img.src = img.getAttribute("temp");
    });
});

