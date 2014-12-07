app = {
    game: null,
    width: 1500,
    height: 770,
    cursor: null,
    score: 0,
    competitors: {},
    active_segment: 0,
    explosion_sound: null
};

$(function(){
    $('.info-board').hide();
    $("#start").click(init);
/*
    $("#pay").click(function(){
        console.log('click');
        $(this).parents('form').submit();
    });*/

    if(document.domain){
        app.online = true;

        app.socket = io.connect('http://'+ document.domain +':5000/race');
        app.socket.on('connect', function() {
            console.log('Connected to the server');
        });

        app.socket.on('data', function(msg) {
            console.log('Got data for ', msg);
            app.ground.addSegment(msg.pos * app.ground.SEGMENT_LENGTH, msg.height, msg.raw);
        });

        app.socket.on('broadcast_positions', function(msg) {
            show_competitors(msg);
        }); 

        app.socket.on('player_info', function(msg) {
            console.log('Player info', msg);
            app.sid = msg;
        });

        app.socket.on('track_info', function(msg) {
            console.log('Track info', msg);
            $('#info div:nth-child(1) p').text('Current track: ' + msg.name);
        });
    }  
});

function init() {
    $('.info-board').toggle("slide", { direction: "left" }, 700);
    $('.start-menu').hide();
    $('.overlay').overlay();

       
    app.game = new Phaser.Game(app.width, app.height, Phaser.CANVAS, 'gameDiv', { preload: preload, create: create, update: update, render: render });
}

function preload() {
    app.game.load.spritesheet('boom', 'static/assets/explosion.hasgraphics.png', 100, 100, 75);

    app.game.load.image('moto_black', 'static/assets/moto.png');
    app.game.load.image('wheel_black', 'static/assets/wheel.png');

    app.game.load.image('moto', 'static/assets/moto2.png');
    app.game.load.image('wheel', 'static/assets/wheel1.png');
    app.game.load.physics('motophysics','static/assets/moto.json');

    app.game.load.audio('ambient','static/assets/explosion.ogg');
}

function create() {
    // adding P2 physics to the game
    app.game.world.setBounds(0, 0, 19200, 1000);
    app.game.physics.startSystem(Phaser.Physics.P2JS);
    app.game.physics.p2.restitution = 0.4;
    
    app.game.stage.backgroundColor = '#DDDDDD';
    

    
    // setting gravity
    app.game.physics.p2.gravity.y = 1500;
    app.game.physics.p2.friction = 15;
    
    app.arrows = app.game.input.keyboard.createCursorKeys();
    app.spaceKey = app.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
    
    app.player = new Player(app.game);
    app.ground = new Ground(app.game);
    app.ground.updateSegments(); 
    app.game.camera.follow(app.player.car.body);

    app._competitors = app.game.add.group();

    for (i=0; i<2*app.game.height; i += 100) {
        addHorizontalLines(i);
    }

    //app.stockChangeText = app.game.add.text(app.player.car.body.body.x+150, 150, "suuuper bonus!", { font: "30px Arial", fill: "#ff0044", align: "center" });
    //app.stockChangeText.anchor.setTo(0.5, 0.5);

    //app._competitors.z = -99;
    //app._competitors.updateZ();
}

function update() {
    if (app.arrows.left.isDown) {
        app.player.accelerate_car(-4);
    }
    if (app.arrows.right.isDown) {
        app.player.accelerate_car(4);
    }
    if (app.spaceKey.isDown) {
        app.player.accelerate_car(0);
    }

    
    app.ground.updateSegments();
    for (var i = 0; i < app.ground.segments.length; i++) {
        if(app.player.car.body.x >= app.ground.segments[i].x && app.player.car.body.x <=  app.ground.segments[i].x+100){
            app.active_segment = app.ground.segments[i].raw_value;
            //console.log(app.ground.segments[i].raw_value);
            break;
        }
    };

    $('#info div:nth-child(2)').text("Distance: "+app.score.toFixed(2)+" m");
    if(app.player.car.body.x>app.score) app.score = app.player.car.body.x;

    app.player.send_car_position();

    app.ground.updateSegments();
    updateText();
}

function updateText() {
    //app.stockChangeText.x = app.width-150;
    //app.stockChangeText.y = 150;
}

function addHorizontalLines(position) {
    gridLine = new Phaser.Polygon([ new Phaser.Point(0, position+1),
                                    new Phaser.Point(19200, position+1),
                                    new Phaser.Point(19200, position),
                                    new Phaser.Point(0, position) ]);
        graphics = app.game.add.graphics(0, 0),
        graphics.beginFill(0x000000, 0.4);
        graphics.drawPolygon(gridLine.points);
        graphics.endFill();
}

function show_competitors(data) {
    if(!app.game || !app._competitors)return;
    for(var sid in data){
        if(sid != app.sid){
            var player_data = data[sid];
            if(!app.competitors[sid]){
                app.competitors[sid] = new Competitor(app._competitors);
            }
            app.competitors[sid].updatePosition(player_data);
        }
    }
}

function explosion() {
    console.log("you exlode");
    var anim=app.game.add.sprite(app.player.car.body.x-60, app.player.car.body.y-90, 'boom');
    var explosion_sound = app.game.add.audio('ambient', 1, false);

    anim.animations.add('explode');
    anim.animations.play('explode',60,false);
    
    explosion_sound.play('',0,1,false);

    setTimeout(function(){
        app.player.car.wheel_front.destroy();
        app.player.car.wheel_back.destroy();
        app.player.car.body.destroy();
        $("#help").click();
    },600);
    

}
function drawAxes(){
    
}

function render () {

    app.game.debug.text('Historical stock price: ' + app.active_segment.toFixed(2), 100, 132, "#666699","16px Verdana");

}
