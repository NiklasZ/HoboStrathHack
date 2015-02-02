Player = function(game) {

	var car = {
		body: game.add.sprite(200, 300,'moto'),
		wheel_front: game.add.sprite(250, 330,'wheel'),
		wheel_back: game.add.sprite(150, 330,'wheel'),
		collision_group: game.physics.p2.createCollisionGroup()
	};
    
    var life = [];
    for (i=0; i<3; i++) {
        sprite = game.add.sprite(1200 + i*50, 90,'wheel');
        sprite.fixedToCamera = true;
        life.push(sprite);
    }
    
    game.physics.p2.enable([car.wheel_front, car.wheel_back, car.body]);

   
    car.body.body.debug = false;
    car.body.body.mass = 1;
    car.body.body.clearShapes();
    //car.body.body.setRectangle(100,40);
    car.body.body.loadPolygon('motophysics','moto');
    car.body.body.setCollisionGroup(car.collision_group);

    car.wheel_front.body.setCircle(20);
    car.wheel_front.body.debug = false;
    car.wheel_front.body.mass = 3;
    car.wheel_front.body.setCollisionGroup(car.collision_group);

    car.wheel_back.body.setCircle(20);
    car.wheel_back.body.debug = false;
    car.wheel_back.body.mass = 4;
    car.wheel_back.body.setCollisionGroup(car.collision_group);

    car.material = game.physics.p2.createMaterial('spriteMaterial');
	car.wheel_front.body.setMaterial(car.material);
	car.wheel_back.body.setMaterial(car.material);

    car.spring_front = game.physics.p2.createSpring(car.body, car.wheel_front, 69, 2000, 100, null, null, [30,-5], null);
    addPhaserP2_debug(car.spring_front.data,"spring");
    car.spring_back = game.physics.p2.createSpring(car.body, car.wheel_back, 71, 2000, 100, null, null, [-32,-5], null);
    addPhaserP2_debug(car.spring_back.data,"spring");
    //Spring(world, bodyA, bodyB, restLength, stiffness, damping, worldA, worldB, localA, localB)

    var constraint = game.physics.p2.createPrismaticConstraint(car.body, car.wheel_front, false,[30,-5],[0,0],[0.3,1]);
    addPhaserP2_debug(constraint,"prismaticConstraint");
    constraint.lowerLimitEnabled = constraint.upperLimitEnabled = true;
    constraint.upperLimit = -1;
    constraint.lowerLimit = -2;    
    var constraint_1 = game.physics.p2.createPrismaticConstraint(car.body, car.wheel_back, false,[-30,-5],[0,0],[-0.3,1]);
    addPhaserP2_debug(constraint_1,"prismaticConstraint");
    constraint_1.lowerLimitEnabled = constraint_1.upperLimitEnabled = true;
    constraint_1.upperLimit = -1;
    constraint_1.lowerLimit = -2;    

    game.physics.p2.updateBoundsCollisionGroup();

	return {
		car: car,
		game: game,
        life: life,

		accelerate_car: function(a) {
            var angVel = this.car.wheel_back.body.angularVelocity;
            if (a == 0) {   // braking
                this.car.wheel_front.body.angularVelocity = 0;
                this.car.wheel_back.body.angularVelocity = 0;
            } /* else if(angVel < 0 && a > 0 || angVel > 0 && a < 0){
     			this.car.wheel_back.body.angularVelocity += a*10; // braking
                this.car.wheel_front.body.angularVelocity += a*10;
     		}*/else{
                if (Math.abs(angVel) < 80) {
     			    this.car.wheel_back.body.angularVelocity += a*7;
                } else {
                    this.car.body.body.angularVelocity -= a*(3/(Math.abs(this.car.body.body.angularVelocity)+10));  
                }
     		}
		},

        reborn_player: function() {
            this.car.body.body.angularForce = 0;
            this.car.body.body.angularVelocity = 0;
            this.car.body.body.rotation = 0;
            this.car.body.body.velocity.x = 0;
            this.car.body.body.velocity.y = 0;
            this.car.body.body.y -= 250;

            this.car.wheel_front.body.angularForce = 0;
            this.car.wheel_front.body.angularVelocity = 0;
            this.car.wheel_front.body.velocity.x = 0
            this.car.wheel_front.body.velocity.y = 0
            this.car.wheel_front.body.y = this.car.body.body.y + 20;
            this.car.wheel_front.body.x = this.car.body.body.x + 30;

            this.car.wheel_back.body.angularForce = 0;
            this.car.wheel_back.body.angularVelocity = 0;
            this.car.wheel_back.body.velocity.x = 0;
            this.car.wheel_back.body.velocity.y = 0;
            this.car.wheel_back.body.y = this.car.body.body.y + 20;
            this.car.wheel_back.body.x = this.car.body.body.x - 30;
        },

		car_collides_with: function(collision_group, segment) {
		    segment.body.collides(this.car.collision_group);
		    this.car.wheel_front.body.collides(collision_group);
		    this.car.wheel_back.body.collides(collision_group);
		    this.car.body.body.collides(collision_group);
		},

        send_car_position: function() {
            if(app.online){
                var data = {
                    x: this.car.body.x,
                    y: this.car.body.y,
                    r: this.car.body.rotation,

                    fx: this.car.wheel_front.x,
                    fy: this.car.wheel_front.y,
                    fr: this.car.wheel_front.rotation,

                    bx: this.car.wheel_back.x,
                    by: this.car.wheel_back.y,
                    br: this.car.wheel_back.rotation
                };
                app.socket.emit('send_position', data);
            }
        }
	}
}