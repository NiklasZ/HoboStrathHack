Ground = function(game, heights) {
    var obj = {
    	HEIGHTS: [100,120,60,30,60,56,70,120],
    	SEGMENT_LENGTH: 100,
    	THICKNESS: 20,


    	game: game,
    	_ground: game.add.group(),
    	last_height: 0,
        last_position: 0,

    	segments: [],
        collision_group: game.physics.p2.createCollisionGroup(),

    	addSegments: function() {
    		while(this.HEIGHTS.length){
    			this.addSegment(this.last_position);
    			this.last_position += this.SEGMENT_LENGTH;
    		}
    	},

    	getPolygon: function(last_height, height, last_position) {
    		var h = app.height;
		    return [
		    	[this.last_position, h - last_height + this.THICKNESS],
	        	[this.last_position + this.SEGMENT_LENGTH, h - height + this.THICKNESS],
	            [this.last_position + this.SEGMENT_LENGTH, h - height],
	            [this.last_position, h - last_height]
	        ];
    	},

    	addSegment: function(last_position) {
    		var height = this.HEIGHTS.shift();
    		var segmentShape = this.getPolygon(this.last_height, height, this.last_position);
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
		    contactMaterial.friction = 5;     // Friction to use in the contact of these two materials.

    		//game.physics.p2.updateBoundsCollisionGroup();
		    
		    this.segments.push(segment);
    	}
    };
	        
	obj.material = obj.game.physics.p2.createMaterial('worldMaterial');
    obj.addSegments();

    return obj;
}