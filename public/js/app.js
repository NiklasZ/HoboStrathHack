app = {
    game: null,
    width: 1500,
    height: 770,
    cursor: null,
    score: 0,
    competitors: {},
    active_segment: 0,
    explosion_sound: null,
    won_send: false,
    debug: {springs: [], constraints: []}
};

function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + "; " + expires;
}

$(function(){
    $('.info-board').hide();
    $("#start").click(init);

    app.paid = window.paid == '$$$';

    app.width = $(window).width() - 100;
    //app.height = $(window).height() - 100;

    $('#viewport').width(app.width);
    $('.info-board').width(app.width + 6);
    $('#viewport').height(app.height);
    
    if(document.domain){
        app.online = true;

        app.socket = io.connect(location.host);
        app.socket.on('connect', function() {
            console.log('Connected to the server');
        });

        app.socket.on('data', function(msg) {
            console.log('Got data for ', msg);
            app.ground.addSegment(msg.pos * app.ground.SEGMENT_LENGTH, msg.height, msg.raw, msg.type);
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

        app.socket.on('he_won', function(msg) {
            console.log('Someone won', msg);
            app.player.car.wheel_front.destroy();
            app.player.car.wheel_back.destroy();
            app.player.car.body.destroy();
            $("#help").click();
            $("#checkout").hide();

            if(msg == app.sid){
                $("#win").html('You won!');                
            }else{
                var name = app.competitors[msg].name || '#' + msg;
                $("#win").html(name + ' won!'); 
            }   
        });
    }  
});

function init() {
    $('.info-board').toggle("slide", { direction: "left" }, 700);
    $('.start-menu').hide();
    $('.overlay').overlay();

    if(app.online){
        var name = $('#playername').val();
        app.socket.emit('send_name', name);
        setCookie('uname', name);
    }
       
    app.game = new Phaser.Game(app.width, app.height, Phaser.CANVAS, 'gameDiv', { preload: preload, create: create, update: update, render: render });
}

function preload() {
    app.game.load.spritesheet('boom', 'assets/explosion.hasgraphics.png', 100, 100, 75);

    app.game.load.image('moto_black', 'assets/moto.png');
    app.game.load.image('wheel_black', 'assets/wheel.png');

    app.game.load.image('moto', app.paid ? 'assets/moto1Pimp1.png' : 'assets/moto2.png');
    app.game.load.image('wheel', app.paid ? 'assets/wheel1Pimp.png' : 'assets/wheel1.png');
    app.game.load.physics('motophysics','assets/moto.json');

    app.game.load.audio('ambient','assets/explosion.ogg');
    app.game.load.audio('theme','assets/theme.ogg');

    initPhaserP2_debug();
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
    app.player.name = $('#playername').val();
    app.ground = new Ground(app.game);
    app.ground.updateSegments(); 
    app.game.camera.follow(app.player.car.body);

    app._competitors = app.game.add.group();

    for (var i=0; i<2*app.game.height; i += 100) {
        addHorizontalLines(i);
    }

    app.explosion_sound = app.game.add.audio('ambient', 1, false);
    app.theme_sound = app.game.add.audio('theme', 1, true);
    app.theme_sound.play('',0,1,true);

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

    if(app.online && app.player.car.body.x > 19000 && !app.won_send){
        console.log('I won');
        app.won_send = true;
        app.socket.emit('i_won');
    }

    updatePhaserP2_debug();
    app.player.car.body.body.onEndContact.add(crush_trigger,this);
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

function crush_trigger() {
    var ang = app.player.car.body.body.angle;
    if ((ang <= 180 && ang >= 120) || (ang >= -180 && ang <= -120)) {
        var anim=app.game.add.sprite(1320 - 50*app.player.life.length, 60, 'boom');
        anim.fixedToCamera = true;
        anim.animations.add('explode');
        anim.animations.play('explode',60,false);
        app.player.life[0].destroy();
        app.explosion_sound.play('',0,1,false);

        if (app.player.life.length <= 1) {
            explosion();
        } else {
            app.player.reborn_player();
            app.player.life.shift();
        }
    }
}

function explosion() {
    console.log("you exlode");
    var anim=app.game.add.sprite(app.player.car.body.x-60, app.player.car.body.y-90, 'boom');
    anim.animations.add('explode');
    anim.animations.play('explode',60,false);
    app.theme_sound.stop();
    app.explosion_sound.play('',0,1,false);

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
