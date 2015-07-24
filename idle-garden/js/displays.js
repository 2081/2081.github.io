
var UI;
(function(){
	UI = {};

	UI.toScreenXY = function( v2 ){
		var w = parseInt(d3.select("#playground").style("width"));
		var h = parseInt(d3.select("#playground").style("height"));
		return    v2.plus(new Geom.Vector2(Config.svg.vbx - Config.svg.currentVbx, Config.svg.vby - Config.svg.currentVby))
					.scal(new Geom.Vector2(Math.min(h/w,1),1))
					.plus(new Geom.Vector2(-Config.svg.vbx,-Config.svg.vby));
	}

	UI.floatingDiv = function( pos, container ){
		var ctn = container || "#playground";
		var actPos = UI.toScreenXY(pos);
		return d3.select(ctn)
					.append("div")
						.classed("fui-container",true)
						.style({
							"left": actPos.x+"%",
							"top" : actPos.y+"%",
							"opacity": 0
						});
	}
})();


var Display;
(function(){

	var funcs = {};

	Display = function( key, param ){
		if( arguments.length == 1 ) return DisplayFactory(key);
		var f = funcs[key];
		if( f ) return f(param);
		return null;
	}

	Display.new = function( code, func ){
		funcs[code] = func;
	}

})();

DISPLAY = {
	SLOT: "slot",
	TOOLTIP: "tooltip"
}

Display.new(DISPLAY.SLOT, function( slotHandler ){
	return DisplayFactory({
		handler: slotHandler,
		location: slotHandler.place(),
		initialize: function(){
			var place = Place(this.handler.place());
			this.group = place.container();

			//var width = Config.slot.bgFactor*this.hexagon.radius*2*Math.cos(Math.PI/6);
			var width = Config.slot.bgFactor*Playground.RADIUS*2*Math.cos(Math.PI/6);
			var height = width*Config.slot.bgRatio;
			var c = place.center2D().scal(Playground.RADIUS);


			this.img = this.group.append("image")
								.attr("x",c.x-width/2)
								.attr("y",c.y-height/2)
								.attr("width",width)
								.attr("height",height)
								.attr("overflow","visible")
								.attr("xlink:href","")
								.classed("bg",true)
								;

			var group = this.group, display = this;
			this.eventsID = place.bindEvents({
				mouseenter: function(){
					console.log("enter");
					//eventPolygon.attr("fill","rgba(255, 255, 0, 0.2)");
					group.selectAll(".sprite"+(display.state == SLOT_STATE.SOLID ? " , image.bg":""))
							.style("filter","url(#hoverFilter)");
					group.select('.bg').style("opacity",display.appearence.hoverOpactity);

					//if( that.state == SLOT_STATE.SOLID) group.select("image.bg").style("filter")

					//if( display.state != SLOT_STATE.VOID) display.tooltip.show();
				},
				mouseout : function(){
					//eventPolygon.attr("fill","transparent");
					group.selectAll("*").style("filter","none");
					group.select('.bg').style("opacity",display.appearence.opacity);
					//display.tooltip.hide();

					//console.log("mouseout");
					/*console.log(group.select("feColorMatrix"));
					group.select("feColorMatrix").remove();*/
				}
			});
				

			this.state = SLOT_STATE.VOID;
			this.appearence = {};
		},

		refresh: function(){
			if( this.state != this.handler.state() ){
				this.state = this.handler.state();
				var img = this.group.select("image.bg");

				this.appearence.bg = "";
				this.appearence.opacity = 1;
				this.appearence.hoverOpactity = 1;

				switch(this.state ){
					case SLOT_STATE.GHOST:
						this.appearence.bg = Config.slot.bg_ghost;
						this.appearence.opacity = 0.3;
						break;
					case SLOT_STATE.SOLID:
						this.appearence.bg = Config.slot.bg;
						break;
					case SLOT_STATE.VOID:
						break;
				}
				img.attr("xlink:href",this.appearence.bg)
				   .style("opacity",this.appearence.opacity);
			}
		},

		destroy: function(){

		}
	});
});

Display.new(DISPLAY.TOOLTIP, function( hash ){
	return DisplayFactory({
		location: hash,
		pos: Place(hash).center2D(),
		initialize: function(){
			this.div = UI.floatingDiv(this.pos.scal(Playground.RADIUS));
			console.log(this.pos);
			this.body = this.div.append("div").classed("tooltip-body",true);

			var slot = Slot(this.location);
			if( slot.state() === SLOT_STATE.GHOST ) {
				var slotBox = this.body.append("div")
									   .classed("tooltip-item",true);

				slotBox.append('p').html("Create a <strong>Mighty Land</strong> here");

				var price = Price(GLOSS.SLOT);
				slotBox.append('p').classed("price",true).text(price.toString()+" Dust");
			}

			this.div.transition().delay(150).style("opacity",1).duration(200);
		},

		refresh: function(){

		},

		destroy: function(){
			if( this.div ){
				this.body = null;
				this.div.transition().style("opacity",0).duration(200).remove();
				this.div = null;
			}
		}
	})
});