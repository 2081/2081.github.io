
if (window.XMLHttpRequest)
{// code for IE7+, Firefox, Chrome, Opera, Safari
    xmlhttp=new XMLHttpRequest();
}
else
{// code for IE6, IE5
    xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
}
xmlhttp.open("GET","xml/plan10x10.xml",false);
xmlhttp.send();
xmlDoc=xmlhttp.responseXML;

console.log(xmlDoc);

var map = L.map('map',{maxBounds:[[-0.1,-0.1],[0.9,0.9]]}).setView([0.4, 0.4], 10);

var nodes = xmlDoc.getElementsByTagName("Noeud");
for( var i = 0; i < nodes.length; ++i){
    var node = nodes[i];
    var pos = [node.getAttribute('x')/1000, node.getAttribute('y')/1000];

    var trs = node.getElementsByTagName("LeTronconSortant");
    for( var j = 0; j < trs.length; ++j){
        var tr = trs[j];
        var node2 = xmlDoc.getElementById(tr.getAttribute("idNoeudDestination"));
        var pos2 = [node2.getAttribute('x')/1000, node2.getAttribute('y')/1000];

        addLine(pos, pos2, tr.getAttribute("nomRue"));
    }
}

for( var i = 0; i < nodes.length; ++i){
    var node = nodes[i];
    var pos = [node.getAttribute('x')/1000, node.getAttribute('y')/1000];

    console.log(node.getAttribute('y'));

    addCircle(pos,node.getAttribute('id'));
}
//console.log(xmlDoc.getElementById(0));

function addLine( A, B, label){
    L.polyline([A,B],{weight:5})
        .addTo(map)
        .bindLabel(label)
        .on("mouseover", function (){
            this.setStyle({color:"#0f0"});
        })
        .on("mouseout", function (){
            this.setStyle({color:'#03f'});
        });
}

function addCircle( pos, id){
    var circle = L.circle(pos, 520, {
        color: 'red',
        fillColor: '#f03',
        fillOpacity: 0.5
    }).addTo(map)
        .bindPopup("Node "+id+"<br>("+pos[0]+","+pos[1]+")", {offset: L.point(0,-10),closeButton:false})
        .on("mouseover",function () {this.openPopup();})
        .on("mouseout",function () {this.closePopup();})
        .on("click",function () {alert("Vous avez sélectionné un noeud. Malheureusement cette fonctionnalité n'est pas encore implémentée...");});
};

/*
// Load the xml file using ajax 
$.ajax({
    type: "GET",
    url: "xml/plan10x10.xml",
    dataType: "xml",
    success: function (xml) {
        // Parse the xml file and get data
        var xmlDoc = $.parseXML(xml),
            $xml = $(xmlDoc);
        $xml.find('Noeud[id="0"] LeTronconSortant').each(function () {
            alert($(this).text());
        });
    }
});*/

/*


            function addLivraison( pos, nom, colis){
                var circle = L.circle(pos, 50, {
                    color: 'red',
                    fillColor: '#f03',
                    fillOpacity: 0.5
                }).addTo(map)
                    .bindPopup("Livraison: <b>"+nom+"</b><br>10-12h<br>"+colis+" colis", {offset: L.point(0,-10),closeButton:false})
                    .on("mouseover",function () {this.openPopup();})
                    .on("mouseout",function () {this.closePopup();})
                    .on("click",function () {alert("Vous avez sélectionné une livraison. Malheureusement cette fonctionnalité n'est pas encore implémentée...");});
            };

            var A = [45.79, 4.87];
            var B = [45.78, 4.88];
            var route = L.polyline([A,B],{weight:4})
                        .addTo(map)
                        .bindLabel("Rue de la paix")
                        .on("mouseover", function (){
                            this.setStyle({color:"#0f0"});
                        })
                        .on("mouseout", function (){
                            this.setStyle({color:'#03f'});
                        });
            addLivraison(A, "Marc Zuckerberg", 2);
            addLivraison(B, "Robin", 3);
            */