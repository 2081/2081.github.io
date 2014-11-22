var ctrl = new Controleur();

/////////////////////////////////////////////////////////////////////////

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

var map = ctrl.vue.map;

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
    addCircle(pos,node.getAttribute('id'));
}

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

//////////////////////////////////////////////////////////////////////////////////
if (window.File && window.FileReader && window.FileList && window.Blob) {
    // Great success! All the File APIs are supported.
} else {
    alert('Les APIs pour l\'ouverture des fichiers ne sont pas pris en charge');
}


///////////////////////////////////////////////////
// Class Controleur

function Controleur(){

    // attributes

    // functions
    this.annuler = function() {
        console.log("undo");
    };
    this.retablir = function(){
        console.log("redo");
    };
    this.chargerPlan = function(){
        document.getElementById('charger-plan').click();
        //... récupérer fichier
    };
    this.chargerLivraisons = function(){
        document.getElementById('charger-livraisons').click();
        //... récupérer fichier
    };
    this.clicTelechargerInitineraire = function(){
        var pdf = new jsPDF();
        var elementHandler = {
            '#ignorePDF': function (element, renderer) {
                return true;
            }
        };
        var source = window.document.getElementById('FDR');
        pdf.fromHTML(
            source,
            15,
            15,
            {
              'width': 180,'elementHandlers': elementHandler
            });

        pdf.output("dataurlnewwindow");
        //... récupérer fichier
    };

    // init
    this.vue = new Vue(this);

}

///////////////////////////////////////////////////
// Class Vue

function Vue(controleur){
    // functions
    this.enableRedo = function(){
        console.log("Vue.enableRedo");
    };
    this.disableRedo = function(){
        console.log("Vue.disableRedo");
    };

    //Constructeur
    // initialisation de la map
    this.map = L.map('map',{maxBounds:[[-0.1,-0.1],[0.9,0.9]],zoomControl:false}).setView([0.4, 0.4], 10);
    // Ajout des controls (boutons)
    console.log("ctrl : ");
    console.log(controleur);
    L.control.zoom({position:'topright'}).addTo(this.map);
    L.easyButton('fa-arrow-circle-left', controleur.annuler, 'Undo', this.map);
    L.easyButton('fa-arrow-circle-right', controleur.retablir, 'Redo', this.map);
    L.easyButton('fa-road', controleur.chargerPlan, 'Charger un plan', this.map).setPosition('bottomleft');
    L.easyButton('fa-cubes', controleur.chargerLivraisons, 'Charger les livraison', this.map).setPosition('bottomleft');
    L.easyButton('fa-plus', null, 'Ajouter une livraison', this.map).setPosition('bottomleft');
    this.controlCalcul = L.easyButton('fa-refresh', null, "Calculer l'itinéraire", this.map).setPosition('bottomleft');
    this.controlCalcul.getContainer().getElementsByTagName('i')[0].className += " fa-spin";
    console.log(this.controlCalcul.getContainer().className);
    var controlFDR = L.easyButton('fa-file-text', controleur.clicTelechargerInitineraire, "Télécharger la feuille de route", this.map).setPosition('bottomright');

}