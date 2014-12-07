Competitor = function(group) {

	var car = {
		body: group.create(200, 400, 'moto')
	};

	return {
		car: car,
        group: group,

		updatePosition: function(data) {
            this.car.body.position.x = data.x;
            this.car.body.position.y = data.y - 50;
            this.car.body.rotation = data.r;
        }
	}
}