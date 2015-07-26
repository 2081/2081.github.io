
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


DISPLAY = {
	SLOT: "slot",
	TOOLTIP: "tooltip"
}

var Display;
(function(){

	var funcs = {};

	var cache = {};

	Display = function( key, param ){
		if( arguments.length == 1 ) return DisplayFactory(key);

		var f = funcs[key];
		if( f ) {
			if( cache[key] ) return  cache[key][param] || (cache[key][param] = f(param));
			return f(param);
		};
		return null;
	}

	Display.new = function( key, _cache, func ){
		if( arguments.length == 2 ) func = _cache;
		if( arguments.length == 3 ) cache[key] = {};
			
		funcs[key] = func;
	}

	Display.destroy = function( entry, key ){
		delete cache[entry][key];
	}

})();

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

(function(){

	function addItem( body, glossEntry, title ){
		var tburl = Thumbnail(glossEntry);
		var item =  body.append("div").classed("tooltip-item",true);
		if( tburl ) {
			var tb = item.append("div").classed("thumbnail",true);
			tb.append("img")
			.classed("thumbnail", true)
			.attr({
				src: tburl,
				alt: "item"
			});
		}
		item.append("div").classed("name", true).text(title);
		return item;
	}

	Display.new(DISPLAY.TOOLTIP, true, function( hash ){
		return DisplayFactory({
			isTooltip: true,
			location: hash,
			pos: Place(hash).center2D(),
			initialize: function( transition ){
				if( !this.div ){

					console.log(this.bonusHeight);

					this.div = UI.floatingDiv(this.pos.scal(Playground.RADIUS));
					this.bodyProd = this.div.append("div").classed("tooltip-body",true);

					this.bodyBonus =  this.div.append("div").classed("tooltip-bonus-outer",true).append("div").classed("tooltip-bonus-inner",true);
					this.scrollInfo = this.bodyBonus.append("div").classed("scroll-info",true).html("<p>scroll down to check bonuses</p>");

					this.bonusHeight = this.bonusHeight || 0;
					this.bonusHeightDefault = parseInt(this.div.select(".tooltip-bonus-outer").style("height"));
					console.log("outer",this.bonusHeightDefault);

					d3.select('body').on("mousewheel.tooltip", this.onMouseWheel.bind(this));
					d3.select('body').on("DOMMouseScroll.tooltip", this.onMouseWheel.bind(this));
					//d3.select('body').on("mousewheel.tooltip", this.onMouseWheel.bind(this));

					//this.slotBox = addItem(this.bodyBonus);

					this.div.transition().delay(150).style("opacity",1).duration(200);
				}
			},

			onMouseWheel: function(){
				var delta = d3.event.deltaY;;
				var h = Math.min(Math.max(this.bonusHeight+delta,0), parseInt(this.bodyBonus.style("height"))-10);

				console.log(h);
				this.bonusHeight = h;
			},

			/// Bonus
			setSolid: function( slot ){
				this.scrollInfo.style("visibility", (this.bonusHeight > 10 ? "hidden" : "visible"));
				var slotBox = addItem( this.bodyBonus, GLOSS.SLOT, "Mighty Land" );
				slotBox.append('p').text("+"+( slot.attr("number") || 0 )+"% Dust/s");

				var prod = Production(hash);
				var prodBox = addItem(this.bodyProd, null, "Total");
				var dps = prod[RESC.DPS].data.perTick, dpc = prod[RESC.DPC].data.perTick;
				if( dps > 0 ) prodBox.append("p").classed("price",true).html( Utils.numberFormat(dps)+" Dust/sec");
				if( dpc > 0 ) prodBox.append("p").classed("price",true).html( Utils.numberFormat(dpc)+" Dust/click");
				if( dps == 0 && dpc == 0 ) prodBox.append("p").html("This piece of land cannot produce any <strong>Mighty Dust</strong>.");
			},

			setGhost: function( slot ){
				this.scrollInfo.style("visibility","hidden");
				var slotBox = this.bodyProd.append("div")
											   .classed("tooltip-item",true);
				slotBox.append('p').html("Create a <strong>Mighty Land</strong> here");
				var price = Price(GLOSS.SLOT);
				slotBox.append('p').classed("price",true).classed("expensive", !Wallet.affordable(price)).text( Utils.numberFormat(price)+" Dust");
			},

			refresh: function(){
				if( this.div ){
					this.div.select(".tooltip-bonus-outer").style("height", this.bonusHeightDefault+this.bonusHeight+'px');
					this.div.selectAll('.tooltip-item').remove();
					var slot = Slot(hash);
					if( slot.state() === SLOT_STATE.GHOST ) {
						this.setGhost( slot );
					} else if ( slot.state() === SLOT_STATE.SOLID ){
						this.setSolid( slot );

					}
				}
			},

			destroy: function(){
				if( this.div ){
					this.div.transition().style("opacity",0).duration(200).remove();
					//delete this.body;
					delete this.div;
					delete this.bonusHeight;
				}
			}
		});
	});
})();
