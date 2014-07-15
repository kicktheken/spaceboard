define(['canvas'],function() {

var color = 'yellow';
var thickness = 10;

function Easel(width, height) {
	var stage = this.stage = new Canvas(width, height, true);
	this.grid = {};
	this.initCell(0,0);
	this.x = 0;
	this.y = 0;
}

Easel.prototype.initCell = function(col, row) {
	if (!this.grid[row]) {
		this.grid[row] = {};
	}
	if (!this.grid[row][col]) {
		this.grid[row][col] = new Canvas(this.stage.width, this.stage.height);
	}
	return this.grid[row][col];
};

Easel.prototype.initCells = function(startcol, startrow, cols, rows) {
	for (var row = startrow; row < startrow + rows; row++) {
		for (var col = startcol; col < startcol + cols; col++) {
			this.initCell(col,row);
		}
	}
};

Easel.prototype.translateCoords = function(x,y) {
	x -= this.x;
	y -= this.y;

	var col = Math.floor(x / this.stage.width);
	var row = Math.floor(y / this.stage.height);

	x -= col * this.stage.width;
	y -= row * this.stage.height;

	return { x:x, y:y, col:col, row:row };
};

Easel.prototype._startDraw = function(coords, offsetCol, offsetRow) {
	offsetCol = offsetCol || 0;
	offsetRow = offsetRow || 0;
	this.initCell(
		coords.col + offsetCol, coords.row + offsetRow
	).drawCircle(
		color,
		coords.x - (offsetCol * this.stage.width),
		coords.y - (offsetRow * this.stage.height),
		thickness / 2
	);
	return this;
};

Easel.prototype.startDraw = function(x,y) {
	var coords = this.translateCoords(x,y);

	if (coords.x < thickness / 2) {
		if (coords.y < thickness / 2) {
			this._startDraw(coords, 0, -1);
			this._startDraw(coords, -1, -1);
		} else if (coords.y > this.stage.height - thickness / 2) {
			this._startDraw(coords, 0, 1);
			this._startDraw(coords, -1, 1);
		}
		this._startDraw(coords, -1, 0);
	} else if (coords.x > this.stage.width - thickness / 2) {
		if (coords.y < thickness / 2) {
			this._startDraw(coords, 0, -1);
			this._startDraw(coords, 1, -1);
		} else if (coords.y > this.stage.height - thickness / 2) {
			this._startDraw(coords, 0, 1);
			this._startDraw(coords, 1, 1);
		}
		this._startDraw(coords, 1, 0);
	} else if (coords.y < thickness / 2) {
		this._startDraw(coords, 0, -1);
	} else if (coords.y > this.stage.height - thickness / 2) {
		this._startDraw(coords, 0, 1);
	}

	this._startDraw(coords);
};

Easel.prototype._lineDraw = function(coords1, coords2, offsetCol, offsetRow) {
	offsetCol = offsetCol || 0;
	offsetRow = offsetRow || 0;
	this.initCell(
		coords1.col + offsetCol, coords1.row + offsetRow
	).drawLine(
		color,
		coords1.x - (offsetCol * this.stage.width),
		coords1.y - (offsetRow * this.stage.height),
		coords2.x - ((offsetCol + coords1.col - coords2.col) * this.stage.width),
		coords2.y - ((offsetRow  + coords1.row - coords2.row) * this.stage.height),
		thickness
	);
};

Easel.prototype.lineDraw = function(x1, y1, x2, y2) {
	var coords1 = this.translateCoords(x1,y1);
	var coords2 = this.translateCoords(x2,y2);
	this._lineDraw(coords1, coords2);
	this._lineDraw(coords2, coords1);
};

Easel.prototype.translate = function(dx, dy) {
	this.x += dx;
	this.y += dy;

	var xratio = -this.x / this.stage.width;
	var mincol = Math.floor(xratio);
	var numcols = xratio == mincol ? 1 : 2;

	var yratio = -this.y / this.stage.height;
	var minrow = Math.floor(yratio);
	var numrows = yratio == minrow ? 1 : 2;

	this.initCells(mincol, minrow, numcols, numrows);
};

Easel.prototype.update = function() {
	this.stage.clear();

	var xratio = -this.x / this.stage.width;
	var mincol = Math.floor(xratio);
	var numcols = xratio == mincol ? 1 : 2;

	var yratio = -this.y / this.stage.height;
	var minrow = Math.floor(yratio);
	var numrows = yratio == minrow ? 1 : 2;


	for (var row = minrow; row < minrow + numrows; row++) {
		for (var col = mincol; col < mincol + numcols; col++) {
			this.stage.drawCanvas(
				this.grid[row][col],
				this.x + col * this.stage.width,
				this.y + row * this.stage.height
			);
		}
	}
}

return Easel

});
