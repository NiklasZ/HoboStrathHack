Competitor = function(group) {

	var car = {
		body: group.create(200, 400, 'moto_black'),
        wheel_front: group.create(250, 430,'wheel_black'),
        wheel_back: group.create(150, 430,'wheel_black')
	};
    car.body.anchor.setTo(0.5, 0.5);
    car.wheel_front.anchor.setTo(0.5, 0.5);
    car.wheel_back.anchor.setTo(0.5, 0.5);

	return {
		car: car,
        group: group,

		updatePosition: function(data) {
            this.car.body.position.x = data.x;
            this.car.body.position.y = data.y;
            this.car.body.rotation = data.r;

            group.game.debug.pixel( data.x, data.y, 'rgba(255,125,0,1)' ) ;

            this.car.wheel_front.position.x = data.fx;
            this.car.wheel_front.position.y = data.fy;

            this.car.wheel_back.position.x = data.bx;
            this.car.wheel_back.position.y = data.by;

            this.name = data.name;
        }
	}
}