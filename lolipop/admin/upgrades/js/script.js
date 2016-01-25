
function save() {
    var tab = [];
    $('.upgrade-ctn').each(function(){
        var obj = {};
        $this = $(this);
        form = $this.find('form')[0];

        ['id','op','value','valueType','targets','unlock','price','shop','name','description','img']
            .map( function( o ){ obj[o] = form[o].value });

        tab.push(obj);

    });

    var blob = new Blob([JSON.stringify(tab)], {type: "text/plain;charset=utf-8"}, true);
    saveAs(blob, "upgrade-config.json");
}

function upgradeContainer(){
    return $("<div class='upgrade-ctn'>\
                    <form>\
                        <input type='text' name='id' placeholder='ID'>\
                        <select name='op'><option value='+'>+</option><option value='*'>*</option></select>\
                        <input type='text' name='value' placeholder='VALUE'>\
                        <select name='valueType'><option value='fixed'>fixed</option><option value='var'>var</option></select>\
                        <textarea name='targets' cols='50' placeholder='TARGET, value'></textarea>\
                        <textarea name='unlock' cols='50' placeholder='Unlocked by'></textarea>\
                        <input type='text' name='price' placeholder='price'>\
                        Shop <select name='shop'><option value='yes'>yes</option><option value='no'>no</option></select>\
                        <div class='shop-section'>\
                            <input type='text' name='name' placeholder='NAME'>\
                            <textarea name='description' cols='50' placeholder='Description'></textarea>\
                            <input type='text' name='img' placeholder='Image ID'>\
                        </div>\
                    </form>\
                </div>");
}

function addUpgrade( config ){
    var $div = upgradeContainer();

    form = $div.find('form')[0];

    ['id','op','value','valueType','targets','unlock','price','shop','name','description','img']
        .map( function( o ){ console.log(config,o,config[o]);if(config[o]) form[o].value = config[o]; });

    $('#upgrades-ctn').append($div);

}

function loadUpgrades( json ){
    json.map( addUpgrade );
}


var dir = "images/";
var fileextension = ".png";
$.ajax({
    //This will retrieve the contents of the folder if the folder is configured as 'browsable'
    url: dir,
    success: function (data) {
        //List all .png file names in the page
        $(data).find("a:contains(" + fileextension + ")").each(function () {
            var filename = this.href.replace(window.location.host, "").replace("http://", "");
            $("body").append("<img src='" + dir + filename + "'>");
        });
    }
});


$(document).ready(function(){
    $('#save-button').on('click',function(){
        save();
    });

    jQuery.getJSON('upgrade-config.json',null,function( o ){ loadUpgrades(o) });
});