app = {
    game: null,
    width: 1500,
    height: 770,
    cursor: null,
    score: 0
};

$(function(){
    $('.start-menu').hide();
    $('.info-board').hide();
    $("#start").click(init);

    if(document.domain){
        app.socket = io.connect('http://'+ document.domain +':5000/race');
        app.socket.on('connect', function() {
            console.log('Connected to the server');
        });

        app.socket.on('data', function(msg) {
            app.heights = msg;
            $('.start-menu').show();
        }); 
    }else{
        app.heights = sample_data['Allianz SE 2014'];
        $('.start-menu').show();      
    }       
});

function init() {
    $('.info-board').toggle("slide", { direction: "left" }, 700);
    $('.start-menu').hide();
    $('.overlay').overlay();

       
    app.game = new Phaser.Game(app.width, app.height, Phaser.AUTO, 'gameDiv', { preload: preload, create: create, update: update });
}

function preload() {
    //app.game.load.spritesheet('boom', '/assets/boom.png', 40, 40);
    app.game.load.image('moto', 'static/assets/moto.png');
    app.game.load.image('wheel', 'static/assets/wheel.png');
    app.game.load.physics('motophysics','static/assets/moto.json');
}

function create() {
    // adding P2 physics to the game
    app.game.world.setBounds(0, 0, 19200, 1000);
    app.game.physics.startSystem(Phaser.Physics.P2JS);
    app.game.physics.p2.restitution = 0.4;
    
    app.game.stage.backgroundColor = '#DDDDDD';
   /* var anim=app.game.add.sprite(0,0, 'boom');

    anim.animations.add('run', [1, 2, 3, 4, 5, 6, 7, 8], 60, true);
    anim.play('run');*/
    
    // setting gravity
    app.game.physics.p2.gravity.y = 1500;
    app.game.physics.p2.friction = 15;
    
    app.arrows = app.game.input.keyboard.createCursorKeys();
    
    app.player = new Player(app.game);
    app.ground = new Ground(app.game, app.heights); 
    app.game.camera.follow(app.player.car.body);   
}

function update() {
    if (app.arrows.left.isDown) {
        app.player.accelerate_car(-4);
    }
    if (app.arrows.right.isDown) {
        app.player.accelerate_car(4);
    }
    updateGround();
    
     $('#info div:nth-child(2)').text("Distance: "+app.score.toFixed(2)+" m");
     if(app.player.car.body.x>app.score) app.score = app.player.car.body.x;

}

function generatePoint(){
    var max = 120, min = -30;
    return randHeight = Math.random()*(max - min) + min;

}

function updateGround(){
    if(app.ground.last_position - app.player.car.body.x < 1000){
        app.ground.HEIGHTS.push(generatePoint());
        app.ground.addSegments();
        
    }
    else if( app.player.car.body.x - app.ground.segments[0].x > 1000){
        app.ground.segments[0].destroy();
        app.ground.segments.shift();
    }
    //console.log(app.ground.segments.length);
    /*if(app.ground.segments.length>50){
        console.log("I AM DESTRYOING YOUR MAMMA", app.ground.segments[0].x);
        app.ground.segments[0].destroy();
        app.ground.segments.shift();
    }*/

}
