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

    $('.js-volume').each(function () {
        if(Math.abs($(this).data('volume') - music_volume) < 0.2){
            $(this).addClass('active');
        }
    }).click(function () {
        if(app.theme_sound){
            var volume = $(this).data('volume');
            app.theme_sound.volume = volume;
            app.music_volume = volume;
            setCookie('volume', volume);

            $(this).parent().find('.btn').removeClass('active');
            $(this).addClass('active');
        }
    });

    $('.js-repeat').click(function () {
        reset();
    });
    
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
            app.player.isDead = true;
            app.overlay.trigger('show');
            $("#checkout").hide();
            $("#win").show();

            if(msg == app.sid){
                $("#win .msg").html('You won!');
            }else{
                var name = app.competitors[msg].name || '#' + msg;
                $("#win .msg").html(name + ' won!');
            }   
        });
    }  
});

function init() {
    $('.info-board').toggle("slide", { direction: "left" }, 700);
    $('.start-menu').hide();
    app.overlay = $('.overlay');
    app.overlay.overlay();

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
    app.game.world.setBounds(0, -1000, 20000, 2000);
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

    app.player.car.body.body.onBeginContact.add(crush_trigger);

    app._competitors = app.game.add.group();

    for (var i=-1000; i<1000; i += 100) {
        addHorizontalLines(i);
    }

    app.explosion_sound = app.game.add.audio('ambient', 1, false);
    app.theme_sound = app.game.add.audio('theme', 1, true);
    app.music_volume = music_volume;
    app.theme_sound.play('', 0, app.music_volume, true);
}

function update() {
    var index = Math.floor(app.player.car.body.x / app.ground.SEGMENT_LENGTH);
    var active_segment = app.ground.segments[index];
    app.active_segment = active_segment ? active_segment.raw_value : 0;

    if(!app.player.isDead){
        if (app.arrows.left.isDown) {
            app.player.accelerate_car(-4);
        }
        if (app.arrows.right.isDown) {
            app.player.accelerate_car(4);
        }
        if (app.spaceKey.isDown) {
            app.player.accelerate_car(0);
        }

        if(app.player.car.body.x>app.score) app.score = app.player.car.body.x;
        $('#info div:nth-child(2)').text("Distance: "+app.score.toFixed(2)+" m");

        app.player.send_car_position();

        if(app.online && app.player.car.body.x > 19800 && !app.won_send){
            console.log('I won');
            app.won_send = true;
            app.socket.emit('i_won');
        }
    }

    app.ground.updateSegments();
    updatePhaserP2_debug();
}

function addHorizontalLines(position) {
    var gridLine = new Phaser.Polygon([
        new Phaser.Point(0, position+1),
        new Phaser.Point(20000, position+1),
        new Phaser.Point(20000, position),
        new Phaser.Point(0, position)
    ]);
    var graphics = app.game.add.graphics(0, 0);
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
    if(app.player.isDead)return;

    var ang = app.player.car.body.body.angle;
    if ((ang <= 180 && ang >= 120) || (ang >= -180 && ang <= -120)) {
        // Destroy one life wheel
        if(app.player.life.length > 0){
            var anim=app.game.add.sprite(app.width - 80 - 50 * app.player.life.length, 60, 'boom');
            anim.fixedToCamera = true;
            anim.animations.add('explode');
            anim.animations.play('explode',60,false);
            app.player.life[0].destroy();
            app.explosion_sound.play('',0,1,false);
        }

        // Die or respawn
        if (app.player.life.length <= 0) {
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
        //app.player.car.wheel_front.destroy();
        //app.player.car.wheel_back.destroy();
        //app.player.car.body.destroy();
        app.player.isDead = true;
        app.overlay.trigger('show');
        $("#checkout").show();
        $("#win").hide();

    },600);
    

}

function reset(){
    app.overlay.trigger('hide');
    app.player.reset();
    app.theme_sound.play('', 0 , app.music_volume, true);
    app.won_send = false;
    setTimeout(function(){
        console.log('Resetting score');
        app.score = 0;
    }, 100);
}

function render () {
    app.game.debug.text('Historical stock price: ' + app.active_segment.toFixed(2), 100, 132, "#666699","16px Verdana");
}
