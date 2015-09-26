var segmentTypes = {NORMAL: 0, SPEEDUP: 1, BOUNCY: 2};
Ground = function (game) {
    var obj = {
        SEGMENT_LENGTH: 100,
        THICKNESS: 20,


        game: game,
        _ground: game.add.group(),
        heights: {},
        emmited: -1,
        active_segment: null,

        segments: {},
        materials: [],
        polygons: [],
        gridLines: [],
        collision_group: game.physics.p2.createCollisionGroup(),

        //Generates heights in offline mode
        getHeight: function (i) {
            var max = 120, min = -30;
            this.heights[i] = Math.random() * (max - min) + min;
            return this.heights[i];
        },

        updateSegments: function () {
            var x = app.player.car.body.x - 2000;
            var to = app.player.car.body.x + 2000;

            while(x < to){
                var index = Math.floor(x / this.SEGMENT_LENGTH);
                var startX = index * this.SEGMENT_LENGTH;
                if(!this.heights[index]){
                    if (!app.online) {
                        this.addLine(startX);
                        this.addSegment(startX, this.getHeight(index), this.getHeight(index), segmentTypes.NORMAL);
                    } else {
                        if (this.emmited < index) {
                            this.addLine(startX);
                            console.log('Emitting get_height with', index);
                            this.emmited = index;
                            app.socket.emit('get_height', index);
                        }
                    }
                }else if(!this.segments[index]){
                    this.addSegment(startX, this.heights[index], this.heights[index], segmentTypes.NORMAL);
                }
                x += this.SEGMENT_LENGTH;
            }
        },

        getCubicBezierPoint: function(points, t) {
            return [
                Math.pow((1-t),3)*points[0] + 3*t*Math.pow((1-t),2)*points[2] + 3*(1-t)*Math.pow(t,2)*points[4] + Math.pow(t,3)*points[6],
                Math.pow((1-t),3)*points[1] + 3*t*Math.pow((1-t),2)*points[3] + 3*(1-t)*Math.pow(t,2)*points[5] + Math.pow(t,3)*points[7]
            ];
        },

        getPolygon: function (height1, height2, height3, height4, position) {
            var h = app.height;

            var x1 = position - this.SEGMENT_LENGTH;
            var x2 = position;
            var x3 = position + this.SEGMENT_LENGTH;
            var x4 = position + this.SEGMENT_LENGTH*2;

            var anchor1 = [x2+(x3-x1)/8,height2+(height3-height1)/8];
            var anchor2 = [x3+(x2-x4)/8,height3+(height2-height4)/8];

            var midPoint1 = this.getCubicBezierPoint([x2, height2, anchor1[0], anchor1[1], anchor2[0], anchor2[1], x3, height3], 0.17);
            var midPoint2 = this.getCubicBezierPoint([x2, height2, anchor1[0], anchor1[1], anchor2[0], anchor2[1], x3, height3], 0.33);
            var midPoint3 = this.getCubicBezierPoint([x2, height2, anchor1[0], anchor1[1], anchor2[0], anchor2[1], x3, height3], 0.5);
            var midPoint4 = this.getCubicBezierPoint([x2, height2, anchor1[0], anchor1[1], anchor2[0], anchor2[1], x3, height3], 0.67);
            var midPoint5 = this.getCubicBezierPoint([x2, height2, anchor1[0], anchor1[1], anchor2[0], anchor2[1], x3, height3], 0.83);

            return [
                x2, h - height2 + this.THICKNESS,
                midPoint1[0], h - midPoint1[1] + this.THICKNESS,
                midPoint2[0], h - midPoint2[1] + this.THICKNESS,
                midPoint3[0], h - midPoint3[1] + this.THICKNESS,
                midPoint4[0], h - midPoint4[1] + this.THICKNESS,
                midPoint5[0], h - midPoint5[1] + this.THICKNESS,
                x3, h - height3 + this.THICKNESS,
                x3, h - height3,
                midPoint5[0], h - midPoint5[1],
                midPoint4[0], h - midPoint4[1],
                midPoint3[0], h - midPoint3[1],
                midPoint2[0], h - midPoint2[1],
                midPoint1[0], h - midPoint1[1],
                x2, h - height2
            ];
        },

        drawPoly: function (pts, colour) {
            var poly = new Phaser.Polygon(pts);
            var graphics = this.game.add.graphics(0, 0);
            graphics.beginFill(colour);
            graphics.drawPolygon(poly.points);
            graphics.endFill();
            this.polygons.push(graphics);
        },

        addLine: function (position) {
            var gridLine = new Phaser.Polygon([new Phaser.Point(position, -1000),
                new Phaser.Point(position + 1, -1000),
                new Phaser.Point(position + 1, 1000),
                new Phaser.Point(position, 1000)]);
            var graphics = this.game.add.graphics(0, 0);
            graphics.beginFill(0x000000, 0.4);
            graphics.drawPolygon(gridLine.points);
            graphics.endFill();
            this.gridLines.push(graphics);
        },

        addSegment: function (position, height, raw, type) {
            var index = Math.floor(position / this.SEGMENT_LENGTH);
            var beforeHeight = this.heights[index - 3] ? this.heights[index - 3] : 200;
            var lastHeight = this.heights[index - 2] ? this.heights[index - 2] : 200;
            var currentHeight = this.heights[index - 1] ? this.heights[index - 1] : 200;
            this.heights[index] = height;
            var segmentShape = this.getPolygon(beforeHeight, lastHeight, currentHeight, height, position);
            var collisionPoly = this.getPolygon(beforeHeight, lastHeight, currentHeight, height, position);
            collisionPoly[1] = collisionPoly[3] = collisionPoly[5] = collisionPoly[7] = collisionPoly[9] = collisionPoly[11] = collisionPoly[13] = app.height + 500;

            var segment = this._ground.create(0, 0);
            segment.visibility = false;
            segment.anchor.setTo(0.5, 0.5);
            this.game.physics.p2.enable(segment, true, true);

            segment.body.addPolygon({}, collisionPoly);
            segment.body.kinematic = true;
            segment.body.setCollisionGroup(this.collision_group);
            segment.body.fixedRotation = true;
            segment.body.data.gravityScale = 0;
            segment.body.debug = false;
            segment.body.collideWorldBounds = false;

            app.player.car_collides_with(this.collision_group, segment);

            var i = position / this.SEGMENT_LENGTH;
            this.materials.push(obj.game.physics.p2.createMaterial('segment' + i));

            segment.body.setMaterial(this.materials[i]);
            var contactMaterial = this.game.physics.p2.createContactMaterial(app.player.car.material, this.materials[i]); //

            //Type choosing:

            //Default
            if (type == segmentTypes.NORMAL) {
                contactMaterial.friction = 3;     // Friction to use in the contact of these two materials.
                contactMaterial.restitution = 0.3;  // Restitution (i.e. how bouncy it is!) to use in the contact of these two materials.
                var colour = 0x1166ee;
            }

            //Slippery settings
            else if (type == segmentTypes.SPEEDUP) {
                console.log("Made speedup at ", position);
                contactMaterial.friction = 4;
                contactMaterial.surfaceVelocity = 100;
                colour = 0xFF6600;
            }

            //Bouncy settings
            else if (type == segmentTypes.BOUNCY) {
                console.log("Made bouncy at ", position);
                contactMaterial.friction = 3;
                contactMaterial.relaxation = 0.25; //Elasticity, I think?
                contactMaterial.restitution = 1.5; //Bounciness
                colour = 0xFF33CC;
            }

            //contactMaterial.stiffness = 1e7;    // Stiffness of the resulting ContactEquation that this ContactMaterial generate.
            //contactMaterial.relaxation = 3;     // Relaxation of the resulting ContactEquation that this ContactMaterial generate.
            //contactMaterial.frictionStiffness = 1e7;    // Stiffness of the resulting FrictionEquation that this ContactMaterial generate.
            //contactMaterial.frictionRelaxation = 3;     // Relaxation of the resulting FrictionEquation that this ContactMaterial generate.
            //contactMaterial.surfaceVelocity = 0;        // Will add surface velocity to this material. If bodyA rests on top if bodyB, and the surface velocity is positive, bodyA will slide to the right.

            //game.physics.p2.updateBoundsCollisionGroup();

            segment.raw_value = raw;
            this.segments[index] = segment;
            this.drawPoly(segmentShape, colour);
        }
    };

    return obj;
};
