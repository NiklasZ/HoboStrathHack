app = {
    game: null,
    width: 1500,
    height: 770,
    cursor: null
};

$(function(){
    $('.start-menu').hide();
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
    $('.start-menu').hide();
    $('.overlay').overlay();
       
    app.game = new Phaser.Game(app.width, app.height, Phaser.AUTO, 'gameDiv', { preload: preload, create: create, update: update });
}

function preload() {
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
}
