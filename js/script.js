

$(document).ready(function(){

	var ua = navigator.userAgent.toString().toLowerCase();
	var CHROME = (ua.indexOf("chrome") != -1);
	var ANDROID = (ua.indexOf("android") > -1);

	if(CHROME && !ANDROID) {
		$("#wrapper").smoothWheel()
	}
	$("#wrapper").focus();

	scrollTarget = $( window ).scrollTop();
	lastScroll = $( window ).scrollTop();
	step = 5;

	$( window ).scroll( function(){
		var scroll = $( window ).scrollTop();
		//console.log("main scroll", scroll);
		$( window ).scrollTop(0);
		$( "#wrapper" ).scrollTop($("#wrapper").scrollTop() + scroll );
	});

	$( "#wrapper" ).scroll( function() {
		var scroll = $( "#wrapper" ).scrollTop();
		//console.log("scroll",lastScroll,scroll);
		
		/*if( Math.abs(scroll - lastScroll) > step ){
			scrollTarget = scroll;
			console.log("return");
			$( window ).scrollTop(lastScroll + step*(scroll - lastScroll > 0 ? 1 : -1));
			return;
		}

		lastScroll = scroll;
		if( Math.abs(scroll - scrollTarget) >= step ) {
			$( window ).scrollTop(scrollTarget);
		}*/

		//console.log("FLOAT",$("#map.float"));

		var width = $( "#map" ).css("width").match("\\d*")[0];
		//console.log("width",width);

		$(".float").each(function( index ){
			//console.log("this",this);
			var x = $(this).attr('x')*1;
			var y = $(this).attr('y')*1;
			var w = $(this).attr('w')*1;
			var s = $(this).attr('scroll')*1;
			//console.log("coord",x+y);

			//console.log("left",(x*width));
			$(this).css({
				top: (y*width + scroll*s)+"px",
				left: (x*width)+"px",
				width: (w*width)+"px"
			});
		});
			/*$(this).stop();
			$(this).animate({
				top: (200 + y + scroll*s)+"px",
				left: x+"px"
			});*/

		/*$(".float").animate({
		    left:'250px',
		    opacity:'0.5',
		    height:'150px',
		    width:'150px'
		  });*/
	});

	$( window ).resize( function(){
		var width = $( ".container12" ).css("width");
		$('#map').css("width",width);

		width = width.match("\\d*")[0];
		$(".float").each(function(){
			var w = $(this).attr('w')*1;
			$(this).find("img").width(w*width);
		});

		$( "#wrapper" ).scroll();
	});

	// initialising widths
	$(".float img").one("load", function() {
		console.log("img width",this.naturalWidth,this.naturalHeight);
	  $(this).parent().attr("w",this.naturalWidth/1280);
	}).each(function() {
	  if(this.complete) $(this).load();
	});

	$(window).load(function(){
		$( "#wrapper" ).resize();	
	});

});

