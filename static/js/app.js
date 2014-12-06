app = {
    game: null,
    width: 1500,
    height: 770,
    cursor: null
};

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
    app.game.physics.startSystem(Phaser.Physics.P2JS);;
    app.game.physics.p2.restitution = 0.4;
    
    app.game.stage.backgroundColor = '#DDDDDD';
    
    // setting gravity
    app.game.physics.p2.gravity.y = 1500;
    app.game.physics.p2.friction = 15;
    
    app.arrows = app.game.input.keyboard.createCursorKeys();
    
    app.player = new Player(app.game);
    app.ground = new Ground(app.game);    
}

function update() {
    if (app.arrows.left.isDown) {
        app.player.accelerate_car(-4);
    }
    if (app.arrows.right.isDown) {
        app.player.accelerate_car(4);
    }
}