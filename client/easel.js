define(['canvas'],function() {

var quadSize = { width: 300, height: 300 };
var color = 'yellow';
var thickness = 10;

function Easel(width, height) {
	var stage = this.stage = new Canvas(width, height, true);
	this.buffer = new Canvas(width, height);
	this.x = 0;
	this.y = 0;
}

Easel.prototype.startDraw = function(x,y) {
	this.buffer.drawCircle(color, x - this.x, y - this.y, thickness / 2);
};

Easel.prototype.lineDraw = function(x1, y1, x2, y2) {
	this.buffer.drawLine(color, x1 - this.x, y1 - this.y, x2 - this.x, y2 - this.y, thickness);
};

Easel.prototype.translate = function(dx, dy) {
	this.x += dx;
	this.y += dy;
};

Easel.prototype.update = function() {
	this.stage.clear();
	this.stage.drawCanvas(this.buffer, this.x, this.y);
}

return Easel

});
