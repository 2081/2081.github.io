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
    grid.className = "medium-block-grid-3";
    mainDiv.appendChild(grid);
    for( var i = 0; i < events.length; ++i)
    {
        var evt = events[i];
        var bloc = document.createElement("li");
        bloc.className = "text-center";
        
        var link = document.createElement("a");
        link.href = "#";
        link.className = "th [radius]";
        link.setAttribute("data-revealed-id","modalEvent"+i);
        
        var img = document.createElement("img");
        img.src = "img/default.png";
        
        link.appendChild(img);
        bloc.appendChild(link);
        
        var title = document.createElement("h4");
        title.className = "subheader";
        title.textContent = evt.title;
        bloc.appendChild(title);
        
        grid.appendChild(bloc);
        /*
        var bloc = document.createElement("div");
        bloc.className = "panel";
        
        var row1 = document.createElement("div");
        var link = document.createElement("a");
        link.href = "#";
        link.setAttribute("data-revealed-id","modalEvent"+i);
        link.textContent = evt.title;
        bloc.appendChild(link);
        
        bloc.appendChild(document.createTextNode(evt.content));
        
        mainDiv.appendChild(bloc);*/
    }
    //console.log(events);
});

