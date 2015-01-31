SHOW_DEBUG = false;

function initPhaserP2_debug()
{
    app.game.load.crossOrigin = true;
    app.game.load.image('pixel', 'assets/pixel.png');
    app.game.load.image('spring', 'assets/spring.png');
    line = new Phaser.Line(0, 0, 200, 200);
}

function addPhaserP2_debug(P2_object,type)
{
    if(type == "spring")
    {
        var springSprite = app.game.add.tileSprite(0, 0, 24, (P2_object.restLength * 20), 'spring');
        springSprite.anchor.setTo(0.5, 0);
        springSprite.rest = 0;
        console.log(P2_object);
        var point_A = app.game.add.sprite((P2_object.localAnchorA[0]*20), (P2_object.localAnchorA[1]*20)); //DUMMY
        var point_B = app.game.add.sprite((P2_object.localAnchorB[0]*20), (P2_object.localAnchorB[1]*20)); //DUMMY
        P2_object.bodyA.parent.sprite.addChild(point_A)
        P2_object.bodyB.parent.sprite.addChild(point_B)
        app.game.physics.p2.enable([point_A,point_B]);
        point_A.body.static = true;
        point_B.body.static = true;
        app.debug.springs.push([P2_object,springSprite,point_A,point_B]);
    }
    if(type == "prismaticConstraint")
    {
        var constraintSprite = app.game.add.sprite(0, 0, 'pixel');
        var point_A = app.game.add.sprite((P2_object.localAnchorA[0]*20)*-1, (P2_object.localAnchorA[1]*20)*-1); //DUMMY
        var point_B = app.game.add.sprite((P2_object.localAnchorB[0]*20)*-1, (P2_object.localAnchorB[1]*20)*-1); //DUMMY
        P2_object.bodyA.parent.sprite.addChild(point_A)
        P2_object.bodyB.parent.sprite.addChild(point_B)
        app.game.physics.p2.enable([point_A,point_B]);
        point_A.body.static = true;
        point_B.body.static = true;
        app.debug.constraints.push([P2_object,constraintSprite,point_A,point_B]);
    }
}

function updatePhaserP2_debug()
{
    if(SHOW_DEBUG){
        for (var i = 0; i < app.debug.springs.length; i++)
        {
            var point_A = {x:app.debug.springs[i][2].world.x, y:app.debug.springs[i][2].world.y};
            var point_B = {x:app.debug.springs[i][3].world.x, y:app.debug.springs[i][3].world.y};
            line.setTo(point_A.x,point_A.y,point_B.x,point_B.y);
            app.debug.springs[i][1].position.x = line.start.x;
            app.debug.springs[i][1].position.y = line.start.y;
            app.debug.springs[i][1].angle = (line.angle*180 / Math.PI)-90;
            app.debug.springs[i][1].scale.y = line.length/(app.debug.springs[i][0].restLength*20);
        }
        for (var i = 0; i < app.debug.constraints.length; i++)
        {
            var point_A = {x:app.debug.constraints[i][2].world.x, y:app.debug.constraints[i][2].world.y};
            var point_B = {x:app.debug.constraints[i][3].world.x, y:app.debug.constraints[i][3].world.y};
            line.setTo(point_A.x,point_A.y,point_B.x,point_B.y);
            app.debug.constraints[i][1].position.x = line.start.x;
            app.debug.constraints[i][1].position.y = line.start.y;
            app.debug.constraints[i][1].angle = (line.angle*180 / Math.PI);
            app.debug.constraints[i][1].scale.x = line.length;
        }
    }
}
