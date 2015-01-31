module.exports = function (uid) {
    return {
        uid: uid,
        paid: false,

        setPosition: function(position) {
            this.x = position['x'];
            this.y = position['y'];
            this.r = position['r'];

            this.fx = position['fx'];
            this.fy = position['fy'];
            this.fr = position['fr'];

            this.bx = position['bx'];
            this.by = position['by'];
            this.br = position['br'];
        }
    };
};