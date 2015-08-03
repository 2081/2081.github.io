d3.selection.prototype.moveToFront = function() {
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};

d3.selection.prototype.appendExternSVG = function( url, callback ){
		var selection = this;
		d3.xml(url, function(error, doc) {

			var elements = doc.getElementsByTagName("svg")[0].getElementsByTagName("*");
			while( elements.length > 0 ) {
				selection.append( function(){ return elements[0]} );
			}
			/*console.log("Selection", selection.select("path")[0]);
			var box = selection.select("path").each(function(){
				console.log(this.getBBox());
			});
			console.log("BBox", box);*/

		});
	}

var SVG_BANK = Object.freeze({
	COG: "typicons/svg/cog.svg",
	INFO: "typicons/svg/info-large.svg",
	LEAF: "typicons/svg/leaf.svg",
	LAND: "typicons/svg/arrow-up-thick.svg"
});

var SVG_TRANSFORM = {};
SVG_TRANSFORM[SVG_BANK.COG] = "scale(0.13,0.13)";
SVG_TRANSFORM[SVG_BANK.INFO] = "scale(0.13,0.13)";
SVG_TRANSFORM[SVG_BANK.LAND] = "scale(0.13,0.13)";
SVG_TRANSFORM[SVG_BANK.LEAF] = "translate(0.3,0.3) scale(0.11,0.11)";

var LoadSVG, UseSVG;
(function(){

	var map = {};
	var waiting = {};

	LoadSVG  = function( url, g ){

		g.appendExternSVG(url, function(svg){
			svg.attr({
				width: null,
				height: null,
				viewBox: null
			})
		});
	}

	UseSVG = function( url ){
		var id = map[url];
		if( ! id ){
			map[url] = id = "svg"+GUID();

			console.log("d3 select",d3.select("svg.main > defs"));
			var g = d3.select("svg.main > defs").append('g').attr({
																id: id,
																transform: (SVG_TRANSFORM[url] || "")
															});
			LoadSVG(url, g);
		} 
		return '#'+id;
	}

	d3.selection.prototype.appendUseSVG = function( url ){
		return this.append("use").attr({
									"xlink:href": UseSVG( url )
								}).classed('icon',true);
	}

})();

var UI;
(function(){
	UI = {};

	UI.toScreenXY = function( v2 ){
		var w = parseInt(d3.select("#playground").style("width"));
		var h = parseInt(d3.select("#playground").style("height"));
		//console.log("hw", w, h, h-w);
		return    v2.plus(new Geom.Vector2(Config.svg.vbx - Config.svg.currentVbx, Config.svg.vby - Config.svg.currentVby))
					.scal(new Geom.Vector2(Math.min(h/w,1), Math.min(w/h,1)))
					.plus(new Geom.Vector2(-Config.svg.vbx,-Config.svg.vby));
	}

	UI.floatingDiv = function( pos, container ){
		var ctn = container || "#playground";
		var actPos = UI.toScreenXY(pos);
		//console.log("actPos", pos, actPos);
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
					group.selectAll(".sprite"+(display.state == SLOT_STATE.SOLID ? " , image.bg":""))
							.style("filter","url(#hoverFilter)");
					group.select('.bg').style("opacity",display.appearence.hoverOpactity);
				},
				mouseleave : function(){
					group.selectAll("*").style("filter","none");
					group.select('.bg').style("opacity",display.appearence.opacity);
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

// TOOLTIP
(function(){

	function addItem( body, tburl, title ){
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
					d3.select('body').on("wheel.tooltip", this.onMouseWheel.bind(this));

					this.div.transition().delay(150).style("opacity",1).duration(200);
				}
			},

			onMouseWheel: function( ){
				if( this.div && Slot(this.location).state() === SLOT_STATE.SOLID ) {
					var delta = d3.event.deltaY || null;
					if( delta == 3 || delta == -3 ) delta *=10; // Need to find something better
					if( delta === null ) return;
					var h = Math.min(Math.max(this.bonusHeight+delta,0), parseInt(this.bodyBonus.style("height"))-10);

					console.log(h);
					this.bonusHeight = h;
				}
			},

			/// Bonus
			setSolid: function( slot ){
				this.scrollInfo.style("visibility", (this.bonusHeight > 10 ? "hidden" : "visible"));

				var bonuses = BonusGroup(hash);
				for( var key in bonuses ){
					var group = bonuses[key];
					
					var dps_flat = group[RESC.DPS][0];
					var dps_mult = group[RESC.DPS][1];
					var dpc_flat = group[RESC.DPC][0];
					var dpc_mult = group[RESC.DPC][1];

					if( !dps_flat.eq(0) || !dps_mult.eq(0) || !dpc_flat.eq(0) || !dpc_mult.eq(0) ){
						var bonusDiv = addItem( this.bodyBonus, group.thumbnail, group.name );
						bonusDiv.append('p').classed("tooltip-description",true).text(group.description);

						if( dps_mult.eq(dpc_mult) && !dps_mult.eq(0) ){
							bonusDiv.append('p').classed("tooltip-bonus",true).classed("all",true)
									.html("<span class='percentage'>"+(dps_mult.gt(0)?"+":"-")+Utils.numberFormat(dps_mult.times(100))+"%<small>(All)</small></span> ");
							dps_mult = dpc_mult = new Big(0);
						}

						/*if( dps_flat.eq(dpc_flat) && !dps_flat.eq(0) ){
							bonusDiv.append('p').classed("tooltip-bonus",true)
									.html((dps_flat.gt(0)?"+":"-")+Utils.numberFormat(dps_flat)+"% (All)");
							dps_flat = dpc_flat = new Big(0);
						}*/
						
						if( !dps_flat.eq(0) || !dps_mult.eq(0) ) bonusDiv.append('p').classed("tooltip-bonus",true).classed("dps",true)
								.html((dps_flat.eq(0)?"":(dps_flat.gt(0)?"+":"-")+Utils.numberFormat(dps_flat)+(dps_mult.eq(0)?"":"<span class='separator'>/</span>"))+(dps_mult.eq(0)?"":"<span class='percentage'>"+(dps_mult.gt(0)?"+":"-")+Utils.numberFormat(dps_mult.times(100))+"%")+"</span> <small>Dust/s</small>");

						if( !dpc_flat.eq(0) || !dpc_mult.eq(0) ) bonusDiv.append('p').classed("tooltip-bonus",true).classed("dpc",true)
								.html((dpc_flat.eq(0)?"":(dpc_flat.gt(0)?"+":"-")+Utils.numberFormat(dpc_flat)+(dpc_mult.eq(0)?"":"<span class='separator'>/</span>"))+(dpc_mult.eq(0)?"":"<span class='percentage'>"+(dpc_mult.gt(0)?"+":"-")+Utils.numberFormat(dpc_mult.times(100))+"%")+"</span> <small>Dust/click</small>");
					}

					
					
				}


				var prod = Production(hash);
				var prodBox = addItem(this.bodyProd, null, "Total");
				var dps = prod[RESC.DPS].data.perTick, dpc = prod[RESC.DPC].data.perTick;
				if( dps > 0 ) prodBox.append("p").classed("price",true).html( Utils.numberFormat(dps)+" Dust/sec");
				if( dpc > 0 ) prodBox.append("p").classed("price",true).classed("dpc",true).html( Utils.numberFormat(dpc)+" Dust/click");
				if( dps == 0 && dpc == 0 ) prodBox.append("p").classed("tooltip-description",true).html("This piece of land cannot produce any <strong>Mighty Dust</strong>.");
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

// SLOTMENU
(function(){

	SLOTMENU_STATE = Object.freeze({
		MINI	: 1,
		OPENED 	: 2
	});

	d3.selection.prototype.appendRevealButton = function( opt ) {
	    var group = this.append("g").classed("smenu-mini",true);

	    pos = opt.pos || new Geom.Vector2(0,0);
	    name = opt.text || '';
	    color = opt.colorClass || "";
	    width = opt.hoverW || 1;
	    height = opt.hoverH || 1;
	    icon = opt.icon || null;

		var w = Playground.RADIUS/3;

		var style = {
						width: w,
						height: w,
						x: pos.x -w/2,
						y: pos.y -w/2,
						ry: w/2
					};
		var hoverStyle = {
							width: width*w,
							height: height*w,
							x: pos.x -width*w/2,
							y: pos.y -height*w/2
						}

	    var r = group.append("rect")
					.classed("smenu-mini-shape "+color,true)
					.attr(style)
					.on({
						mouseenter: function(){ r.attr(hoverStyle)},
						mouseleave: function(){ r.attr(style)}
					});
		
		if(icon){
			console.log("ICON",group.appendUseSVG(icon).attr({
									x: pos.x -w/2,
									y: pos.y -w/2,
									height: w,
									width: w
								}));
		}

		return group;
	};

	Display.new(DISPLAY.MINIS, true, function( hash ){
		return DisplayFactory({
			location: hash,
			pos: Place(hash).center2D().scal(Playground.RADIUS),
			state: SLOTMENU_STATE.VOID,
			initialize: function( transition ){
				if( !this.mini ){
					console.log("init MINI");
					this.container = Place(hash).svgEventGroup();
					this.mini = this.container.appendRevealButton({ 
													pos : this.pos.plus(new Geom.Vector2(0,Playground.RADIUS/2)),
													text : "Plant",
													colorClass: "brown",
													hoverW: 1.2,
													hoverH: 1.2,
													icon: SVG_BANK.LEAF
												})
											  .on({mouseenter: function(){Display(DISPLAY.TOOLTIP, hash).show();   },
												   mouseleave: function(){Display(DISPLAY.TOOLTIP, hash).destroy();}});

					this.mini2 = this.container.appendRevealButton({ 
													pos : this.pos.plus(new Geom.Vector2(Playground.RADIUS/1.8,Playground.RADIUS/4)),
													text : "Info",
													colorClass: "",
													hoverW: 1.2,
													hoverH: 1.2,
													icon: SVG_BANK.INFO
												})
											  .on({mouseenter: function(){Display(DISPLAY.TOOLTIP, hash).show();   },
												   mouseleave: function(){Display(DISPLAY.TOOLTIP, hash).destroy();}});

					this.minighost = this.container.appendRevealButton({ 
													pos : this.pos.plus(new Geom.Vector2(0,0)),
													text : "Land",
													colorClass: "green",
													hoverW: 1.2,
													hoverH: 1.2,
													icon: SVG_BANK.LAND
												})
											  .on({mouseenter: function(){Display(DISPLAY.TOOLTIP, hash).show();   },
												   mouseleave: function(){Display(DISPLAY.TOOLTIP, hash).destroy();},
												   click: function(){ UserAction.buyLand(hash) }});

					console.log("mini", this.mini);
					//this.mini.append("title").text("Build");

					this.fadeIn = this.fadeInGhost = true;

					this.container.moveToFront();

				}
			},
			revealMini: function( selection ){
				selection.transition()
						 .duration(300)
						 .style("visibility","visible")
						 .style("pointer-events","all")
						 .style("opacity",1);
			},
			hideMini: function( selection ){
				selection.transition()
						 .duration(300)
						 .style("opacity",0)
						 .style("pointer-events","none")
						 .style("visibility","hidden");
			},
			refresh: function(){
				var sstate = Slot(this.location).state();
				if( this.mini && this.state !== sstate ){
					switch( sstate ){
						case SLOT_STATE.SOLID:
							Display(DISPLAY.TOOLTIP, hash).destroy();
							this.revealMini(this.mini);
							this.revealMini(this.mini2);
							this.hideMini(this.minighost);
							break;
						case SLOT_STATE.GHOST:
							this.revealMini(this.minighost);
							break;
					}
					/*if( this.mini && Slot(this.location).state() === SLOT_STATE.SOLID ){
					if( this.fadeIn ){
							this.revealMini(this.mini);
							this.revealMini(this.mini2);
							this.fadeIn = false;
						} 
					} else if( this.minighost && Slot(this.location).state() === SLOT_STATE.GHOST ){
						if( this.fadeInGhost ){
							this.revealMini(this.minighost);
							this.fadeInGhost = false;
						} 
					} else {
						this.fadeIn = this.fadeInGhost = true;
					}*/
					this.state = sstate;
				}				
			},

			destroy: function(){
				if( this.container ){
					this.container.selectAll(".smenu-mini").transition().duration(300).style("opacity",0).remove();
					delete this.mini;
					delete this.mini2;
					delete minighost;
					delete this.container;
					this.state = SLOT_STATE.VOID;
				}
				/*if( this.div && !this.hover ){
					console.log('DESTROY');
					this.div.transition().style("opacity",0).duration(200).remove();
					delete this.div;
				}*/
			}
		});
	})

})();