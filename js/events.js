/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
$.getJSON("events.json", function(data) {
    //console.log(data); // this will show the info it in firebug console 
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
        link.className = "th [radius]";
        link.setAttribute("data-reveal-id",modalName);
        
        var img = document.createElement("img");
        img.src = "img/pirate.png";
        
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
        modal.innerHTML = evt.content + "<a class=\"close-reveal-modal\">&#215;</a>";
        mainDiv.appendChild(modal);
    }
    //console.log(events);
	$(document).foundation();
});

