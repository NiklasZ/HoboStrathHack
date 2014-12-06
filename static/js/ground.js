Ground = function(game) {
    var obj = {
    	HEIGHTS: [50,100,50,80,110,130,50,0,50,100,50,80,110,130,50,0,0,50,100,50,80,110,130,50,0],
    	SEGMENT_LENGTH: 100,
    	THICKNESS: 20,

    	game: game,
    	_ground: game.add.group(),
    	last_height: 0,

    	segments: [],

    	addSegments: function() {
    		var pos = 0;
    		for(var i in this.HEIGHTS){
    			this.addSegment(pos);
    			pos += this.SEGMENT_LENGTH;
    		}
    	},

    	getPolygon: function(last_height, height, pos) {
    		var h = app.height;
		    return [
		    	[pos, h - last_height + this.THICKNESS],
	        	[pos + this.SEGMENT_LENGTH, h - height + this.THICKNESS],
	            [pos + this.SEGMENT_LENGTH, h - height],
	            [pos, h - last_height]
	        ];
    	},

    	addSegment: function(pos) {
    		var height = this.HEIGHTS.shift();
    		var segmentShape = this.getPolygon(this.last_height, height, pos);
    		this.last_height = height;

    		var collision_group = game.physics.p2.createCollisionGroup();

    		var segment = this._ground.create(0,0);
			segment.anchor.setTo(0.5, 0.5)
    		this.game.physics.p2.enable(segment ,true, true);
    
		    segment.body.addPolygon({}, segmentShape);
		    segment.body.kinematic = true;
		    segment.body.setCollisionGroup(collision_group);
		    segment.body.fixedRotation = true;
		    segment.body.data.gravityScale = 0;
		    segment.body.collideWorldBounds = false;
    
    		app.player.car_collides_with(collision_group, segment);

			segment.body.setMaterial(this.material);
		    var contactMaterial = this.game.physics.p2.createContactMaterial(app.player.car.material, this.material);
		    contactMaterial.friction = 5;     // Friction to use in the contact of these two materials.

    		game.physics.p2.updateBoundsCollisionGroup();
		    
		    this.segments.push(segment);
    	}
    };
	        
	obj.material = obj.game.physics.p2.createMaterial('worldMaterial');
    obj.addSegments();

    return obj;
}