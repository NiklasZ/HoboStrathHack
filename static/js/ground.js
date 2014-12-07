Ground = function(game) {
    var obj = {
    	SEGMENT_LENGTH: 100,
    	THICKNESS: 20,


    	game: game,
    	_ground: game.add.group(),
    	last_height: 0,
        last_position: 0,
        emmited: -1,
        active_segment: null,

    	segments: [],
        collision_group: game.physics.p2.createCollisionGroup(),

        getHeight: function(pos) {
            var max = 120, min = -30;
            return Math.random()*(max - min) + min;    
        },

        updateSegments: function() {
            var position = this.last_position;
            while(position - app.player.car.body.x < 1000){
                if(!app.online){
                    this.addSegment(position, this.getHeight(position),this.getHeight(position));
                }else{
                    var i = position / this.SEGMENT_LENGTH;
                    if(this.emmited < i){
                        console.log('Emitting get_height with', i);
                        this.emmited = i;
                        app.socket.emit('get_height', i);
                    }
                }
                position += this.SEGMENT_LENGTH;
            }
            if( this.segments[0] && app.player.car.body.x - this.segments[0].x > 1000){
                this.segments[0].destroy();
                this.segments.shift();
            }

        },

    	getPolygon: function(last_height, height, position) {
    		var h = app.height;
		    return [
		    	[position, h - last_height + this.THICKNESS],
	        	[position + this.SEGMENT_LENGTH, h - height + this.THICKNESS],
	            [position + this.SEGMENT_LENGTH, h - height],
	            [position, h - last_height]
	        ];
    	},

    	addSegment: function(position, height, raw) {
    		var segmentShape = this.getPolygon(this.last_height, height, position);
    		this.last_height = height;


    		var segment = this._ground.create(0,0);
			segment.anchor.setTo(0.5, 0.5)
    		this.game.physics.p2.enable(segment ,true, true);
    
		    segment.body.addPolygon({}, segmentShape);
		    segment.body.kinematic = true;
		    segment.body.setCollisionGroup(this.collision_group);
		    segment.body.fixedRotation = true;
		    segment.body.data.gravityScale = 0;
		    segment.body.collideWorldBounds = false;
    
    		app.player.car_collides_with(this.collision_group, segment);

			segment.body.setMaterial(this.material);
		    var contactMaterial = this.game.physics.p2.createContactMaterial(app.player.car.material, this.material);
		    contactMaterial.friction = 3;     // Friction to use in the contact of these two materials.

    		//game.physics.p2.updateBoundsCollisionGroup();
		    
            segment.raw_value = raw;
            //console.log(segment.body.x);

		    this.segments.push(segment);
            this.last_position = position + this.SEGMENT_LENGTH;
    	}
    };
	        
	obj.material = obj.game.physics.p2.createMaterial('worldMaterial');

    return obj;
}