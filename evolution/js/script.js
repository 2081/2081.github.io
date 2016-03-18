(function() {

    var Engine = Matter.Engine,
    World = Matter.World,
    Bodies = Matter.Bodies
    Composites = Matter.Composites;

    // create a Matter.js engine
    var engine = Engine.create(document.body);

    // create two boxes and a ground
    var boxA = Bodies.rectangle(400, 200, 80, 80);
    var boxB = Bodies.rectangle(450, 50, 80, 80);
    var ground = Bodies.rectangle(400, 620, 810, 60, { isStatic: true });
    var leftSide = Bodies.rectangle(400, 620, 60, 800, { isStatic: true });

    // add all of the bodies to the world
    //World.add(engine.world, [boxA, boxB, ground]);

    var particleOptions = { 
            friction: 0.05,
            frictionStatic: 0.1,
            render: { visible: true } 
        };

    var blop = Composites.softBody(400, 300, 3, 3, 0, 0, true, 15, particleOptions);

    var bodies = blop.bodies;

    Matter.Body.scale(bodies[1],1.2,1.2);

    var inter = setInterval(function(){
        var a = 1+ (Math.random()-0.5)/10;
        Matter.Body.scale(bodies[8],a,a);
    }, 100);

    console.log('allbodies', bodies[3]);

    World.add(engine.world, [blop, ground, leftSide]);

    // World.add(engine.world, [
    //         Composites.softBody(250, 100, 5, 5, 0, 0, true, 18, particleOptions),
    //         ,
    //         Composites.softBody(250, 400, 4, 4, 0, 0, true, 15, particleOptions)
    //     ]);

    // run the engine
    Engine.run(engine);
})();