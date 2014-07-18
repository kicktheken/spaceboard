define(['canvas'],function() {

var maxZoom = 1;
var minZoom = .2;
var bPooling = true;
var quadSize = { width: 800, height: 800 };

function Easel(width, height, client) {
	this.stage = new Canvas(width, height, true);
	this.grid = {};
	this.active = [];
	this.x = 0;
	this.y = 0;

	this.dx = 0;
	this.dy = 0;
	this.scale = 1;
	this.ticks = 0;

	this.scrollevents = [];
	var extend = 0;
	this.bounds = {
		minx: -(1 / minZoom / 2 + extend) * width,
		miny: -(1 / minZoom / 2 + extend) * height,
		maxx: (1 / minZoom / 2 + extend) * width,
		maxy: (1 / minZoom / 2 + extend) * height
	};

	if (client) {
		this.datastoreManager = client.getDatastoreManager();
	}
}

Easel.prototype.initCell = function(col, row, data) {
	if (!this.grid[row]) {
		this.grid[row] = {};
	}
	var cell = this.grid[row][col];
	if (cell) {
		if (!cell.canvas) {
			cell.data = this.getData(col,row);
		}
		if (cell.init()) {
			this.active.push(cell);
		}
	} else {
		if (!data) {
			data = this.getData(col,row);
		}
		cell = new Canvas(quadSize.width, quadSize.height, data, col, row);
		this.grid[row][col] = cell;
		this.active.push(cell);
	}
	
	return cell;
};

Easel.prototype.initCells = function(startcol, startrow, cols, rows) {
	for (var row = startrow; row < startrow + rows; row++) {
		for (var col = startcol; col < startcol + cols; col++) {
			this.initCell(col,row);
		}
	}
};

Easel.prototype.resize = function(width, height) {
	this.stage.resize(width,height);
};

Easel.prototype.getData = function(col, row) {
	var data;
	if (this.datastore) {
		var cellTable = this.datastore.getTable('cells');
		var record = cellTable.get(col + '_' + row);
		if (record) {
			data = record.get('data');
		}
	} else {
		data = localStorage.getItem(col + '_' + row);
	}
	return data;

};

Easel.prototype.updateBounds = function(x,y) {
	var offsetX = (1 / minZoom / 2) * quadSize.width;
	var offsetY = (1 / minZoom / 2) * quadSize.height;

	if (x < this.bounds.minx + offsetX) {
		this.bounds.minx = x - offsetX;
	} else if (x > this.bounds.maxx - offsetX) {
		this.bounds.maxx = x + offsetX;
	}
	if (y < this.bounds.miny + offsetY) {
		this.bounds.miny = y - offsetY;
	} else if (y > this.bounds.maxy - offsetY) {
		this.bounds.maxy = y + offsetY;
	}
};

Easel.prototype.translateCoords = function(x,y) {
	x = (x - this.x / Canvas.getScale()) / this.scale;
	y = (y - this.y / Canvas.getScale()) / this.scale;

	var col = Math.floor(x / quadSize.width);
	var row = Math.floor(y / quadSize.height);

	this.updateBounds(x,y);
	x -= col * quadSize.width;
	y -= row * quadSize.height;

	return { x:x, y:y, col:col, row:row };
};

Easel.prototype.getZoneNeighbors = function(coords, threshold) {
	var ret = [];

	var zoneWidth = quadSize.width * this.scale;
	var zoneHeight = quadSize.height * this.scale;

	if (coords.x < threshold) {
		if (coords.y < threshold) {
			ret.push([0,-1]);
			ret.push([-1,-1]);
		} else if (coords.y > zoneHeight - threshold) {
			ret.push([0,1]);
			ret.push([-1,1]);
		}
		ret.push([-1,0]);
	} else if (coords.x > zoneWidth - threshold) {
		if (coords.y < threshold) {
			ret.push([0,-1]);
			ret.push([1,-1]);
		} else if (coords.y > zoneHeight - threshold) {
			ret.push([0,1]);
			ret.push([1,1]);
		}
		ret.push([1,0]);
	} else if (coords.y < threshold) {
		ret.push([0,-1]);
	} else if (coords.y > zoneHeight - threshold) {
		ret.push([0,1]);
	}

	return ret;
};

Easel.prototype._drawDot = function(coords, offsetCol, offsetRow) {
	offsetCol = offsetCol || 0;
	offsetRow = offsetRow || 0;
	this.initCell(
		coords.col + offsetCol, coords.row + offsetRow
	).drawCircle(
		COLOR,
		coords.x - (offsetCol * quadSize.width),
		coords.y - (offsetRow * quadSize.height),
		THICKNESS / 2
	);
	return this;
};

Easel.prototype.drawDot = function(x,y) {
	var coords = this.translateCoords(x,y);

	var neighbors = this.getZoneNeighbors(coords, THICKNESS / 2);
	for (var i=0; i < neighbors.length; i++) {
		this._drawDot(coords, neighbors[i][0], neighbors[i][1]);
	}

	this._drawDot(coords);
};

Easel.prototype._drawLine = function(coords1, coords2, offsetCol, offsetRow, exclude, reverse) {
	offsetCol = offsetCol || 0;
	offsetRow = offsetRow || 0;
	exclude = exclude || {};

	var col = coords1.col + offsetCol;
	var row = coords1.row + offsetRow;
	var key = col + '_' + row;
	if (exclude[key]) {
		return;
	} else {
		exclude[key] = true;
	}
	var cell = this.initCell(col, row);
	var x1 = coords1.x - (offsetCol * quadSize.width);
	var y1 = coords1.y - (offsetRow * quadSize.height);
	var x2 = coords2.x - ((offsetCol + coords1.col - coords2.col) * quadSize.width);
	var y2 = coords2.y - ((offsetRow  + coords1.row - coords2.row) * quadSize.height);
	if (reverse) {
		cell.drawLine(COLOR, x2, y2, x1, y1, THICKNESS);
	} else {
		cell.drawLine(COLOR, x1, y1, x2, y2, THICKNESS);
	}
};

Easel.prototype.drawLine = function(x1, y1, x2, y2) {
	var coords1 = this.translateCoords(x1,y1);
	var coords2 = this.translateCoords(x2,y2);

	var exclude = {};
	var neighbors = this.getZoneNeighbors(coords1, THICKNESS / 2);
	for (var i=0; i < neighbors.length; i++) {
		this._drawLine(coords1, coords2, neighbors[i][0], neighbors[i][1], exclude);
	}
	this._drawLine(coords1, coords2, 0, 0, exclude);

	neighbors = this.getZoneNeighbors(coords2, THICKNESS / 2);
	for (var i=0; i < neighbors.length; i++) {
		this._drawLine(coords2, coords1, neighbors[i][0], neighbors[i][1], exclude, true);
	}
	this._drawLine(coords2, coords1, 0, 0, exclude, true);

	var colDiff = coords2.col - coords1.col;
	var rowDiff = coords2.row - coords1.row;
	if (Math.abs(colDiff) == 1 && Math.abs(rowDiff) == 1) {
		this._drawLine(coords1, coords2, colDiff, 0);
		this._drawLine(coords1, coords2, 0, rowDiff);
	}
};

Easel.prototype.getViewport = function() {
	var zoneWidth = quadSize.width * this.scale;
	var zoneHeight = quadSize.height * this.scale;

	var xoffset = -this.x //- this.stage.width + quadSize.width;
	var mincol = Math.floor(xoffset / zoneWidth / Canvas.getScale());
	var numcols = Math.ceil(this.stage.width / zoneWidth) + 1;

	var yoffset = -this.y //- this.stage.height + quadSize.height;
	var minrow = Math.floor(-this.y / zoneHeight / Canvas.getScale());
	var numrows = Math.ceil(this.stage.height / zoneHeight) + 1;

	return { mincol: mincol, minrow: minrow, cols: numcols, rows: numrows };
};

Easel.prototype.translate = function(dx, dy) {
	dx *= Canvas.getScale();
	dy *= Canvas.getScale();
	this.dx = dx;
	this.dy = dy;
	this.x += dx;
	this.y += dy;

	var scale = this.scale * Canvas.getScale();
	var sscale = (1 - this.scale / 2) * Canvas.getScale();
	if (-this.x < (this.bounds.minx + quadSize.width / 2) * scale ) {
		this.x = -(this.bounds.minx + quadSize.width / 2) * scale;
	} else if (-this.x > this.bounds.maxx * scale - quadSize.width * sscale) {
		this.x = -(this.bounds.maxx * scale - quadSize.width * sscale);
	}
	if (-this.y < (this.bounds.miny + quadSize.height / 2) * scale) {
		this.y = -(this.bounds.miny + quadSize.height / 2) * scale;
	} else if (-this.y > this.bounds.maxy * scale - quadSize.height * sscale) {
		this.y = -(this.bounds.maxy * scale - quadSize.height * sscale);
	}

	var v = this.getViewport();
	this.initCells(v.mincol, v.minrow, v.cols, v.rows);
};

Easel.prototype.zoom = function(dist, x, y) {
	if (!this.dist) {
		this.dist = dist;
		return;
	}
	var newscale = this.scale * dist/this.dist;

	if (newscale > maxZoom) {
		newscale = maxZoom;
	} else if (newscale < minZoom) {
		newscale = minZoom;
	}


	var scale = (newscale - this.scale) / this.scale;
	this.x -= scale * (x * Canvas.getScale() - this.x);
	this.y -= scale * (y * Canvas.getScale() - this.y);
	this.scale = newscale;
	this.dist = dist;
};

Easel.prototype.stopZoom = function() {
	this.dist = null;
};

Easel.prototype.startInertiaScroll = function() {
	this.scrollevents = [];

	var velocity = Math.sqrt(this.dx * this.dx, this.dy * this.dy);
	var decr = 1 / velocity / 2;
	
	function fade(t) {
		t--;
		return t*t;
	}
	for (var t = 0; t <= 1; t += decr) {
		var m = fade(t);
		this.scrollevents.push([m * this.dx, m * this.dy]);
	}

	this.dx = 0;
	this.dy = 0;
};

Easel.prototype.stopInertiaScroll = function() {
	this.scrollevents = [];
};

Easel.prototype.setEraser = function(x,y,radius) {
	this.eraser = { x: x, y: y, radius: radius };
};

Easel.prototype.unsetEraser = function() {
	this.eraser = null;
};

Easel.prototype._erase = function(coords, radius, offsetCol, offsetRow) {
	offsetCol = offsetCol || 0;
	offsetRow = offsetRow || 0;
	this.initCell(
		coords.col + offsetCol, coords.row + offsetRow
	).clearCircle(
		coords.x - (offsetCol * quadSize.width),
		coords.y - (offsetRow * quadSize.height),
		radius
	);
};

Easel.prototype.erase = function(x, y, radius) {
	radius /= this.scale;

	var coords = this.translateCoords(x,y);
	var neighbors = this.getZoneNeighbors(coords, radius);
	for (var i=0; i < neighbors.length; i++) {
		this._erase(coords, radius, neighbors[i][0], neighbors[i][1]);
	}
	this._erase(coords, radius);
};

Easel.prototype.update = function() {
	++this.ticks;
	this.stage.clear();

	if (this.scrollevents.length > 0) {
		var se = this.scrollevents.shift();
		this.translate(se[0],se[1]);
	}

	if (this.eraser) {
		this.erase(this.eraser.x, this.eraser.y, this.eraser.radius);
	}

	var zoneWidth = quadSize.width * this.scale * Canvas.getScale();
	var zoneHeight = quadSize.height * this.scale * Canvas.getScale();;
	var v = this.getViewport();
	
	var x = this.x + (this.stage.width - quadSize.width) * this.scale;
	var y = this.y + (this.stage.height - quadSize.height) * this.scale;
	for (var row = v.minrow; row < v.minrow + v.rows; row++) {
		for (var col = v.mincol; col < v.mincol + v.cols; col++) {
			var cell = this.initCell(col,row);
			this.stage.drawCanvas(
				cell,
				x + col * zoneWidth,
				y + row * zoneHeight,
				zoneWidth,
				zoneHeight
			);
			cell.tick = this.ticks;
		}
	}

	if (this.eraser) {
		this.stage.drawCircle('rgb(255,200,200)',
			this.eraser.x * Canvas.getScale(),
			this.eraser.y * Canvas.getScale(),
			this.eraser.radius * Canvas.getScale()
		);
	}

	//
	// draw number labels on grids
	//
	var glyphColor = 'rgb(200,215,225)';
	var context = this.stage.canvas.getContext("2d");
	context.fillStyle = glyphColor;
	var fontsize = (this.stage.width/10 * this.scale).floor();
	context.font = fontsize + "px Arial";

	for (var col = v.mincol; col < v.mincol + v.cols; col++) {
		context.fillText(col, x + (col + .5) * zoneWidth + fontsize / 5, fontsize);
	}
	for (var row = v.minrow; row < v.minrow + v.rows; row++) {
		context.fillText(-row, fontsize / 5, y + (row + .5) * zoneHeight - fontsize / 5);
	}

	//
	// draw zoom indicator
	//
	var trueWidth = this.stage.canvas.width;
	context.strokeStyle = GRIDCOLOR;
	context.lineWidth = 5;
	context.lineCap = 'square';
    context.beginPath();
	context.moveTo(trueWidth -90, 30);
	context.lineTo(trueWidth -30, 30);
	context.moveTo(trueWidth -90, 150);
	context.lineTo(trueWidth -30, 150);
	context.moveTo(trueWidth -60, 30);
	context.lineTo(trueWidth -60, 150);
    context.stroke();

	context.strokeStyle = glyphColor;
	context.lineWidth = 8;
	var scaleToY = 30 + 120 * (this.scale - minZoom) / (maxZoom - minZoom);
	context.beginPath();
	context.moveTo(trueWidth -90, scaleToY);
	context.lineTo(trueWidth -30, scaleToY);
	context.stroke();

	if (bPooling) {
		for (var i = this.active.length - 1; i >= 0; i--) {
			var cell = this.active[i];
			if (cell.tick != this.ticks) {
				this.active.splice(i,1);
				var data = cell.release();
				this.updateCell(cell, data);
			}
		}
	}
};

Easel.prototype.updateCell = function(cell, data) {
	var key = cell.col + '_' + cell.row;
	if (data) {
		if (this.datastore) {
			this.replaceRecord(this.datastore.getTable('cells'), key, {
				col: cell.col,
				row: cell.row,
				data: data
			});
		} else {
			localStorage.setItem(key, data);
		}
	} else {
		if (this.datastore) {
			var record = this.datastore.getTable('cells').get(key);
			if (record) {
				record.deleteRecord();
			}
		} else {
			localStorage.removeItem(key)
		}
	}
};

Easel.prototype.replaceRecord = function(table, id, values) {
	var record = table.getOrInsert(id, values);
	Object.keys(values).forEach(function(key) {
		record.set(key, values[key]);
	});
};

Easel.prototype.flushMeta = function() {
	if (this.datastore) {
		var easelTable = this.datastore.getTable('easel');
		this.replaceRecord(easelTable, 'this',{
			x: this.x,
			y: this.y,
			scale: this.scale,
			minx: this.bounds.minx,
			miny: this.bounds.miny,
			maxx: this.bounds.maxx,
			maxy: this.bounds.maxy
		});
	}
};

Easel.prototype.flushDirty = function() {
	var _this = this;
	Canvas.flushAll(function(cell) {
		var data = cell.toData();
		_this.updateCell(cell, data);
	});

	this.flushMeta();
};

Easel.prototype.save = function() {
	if (!this.datastore) {
		for (var i = 0; i < this.active.length; i++) {
			var canvas = this.active[i];
			var key = canvas.col + '_' + canvas.row;
			var data = canvas.release();
			this.updateCell(canvas, data);
		}
		localStorage.setItem('x', this.x);
		localStorage.setItem('y', this.y);
		localStorage.setItem('scale', this.scale);
		localStorage.setItem('minx', this.bounds.minx);
		localStorage.setItem('miny', this.bounds.miny);
		localStorage.setItem('maxx', this.bounds.maxx);
		localStorage.setItem('maxy', this.bounds.maxy);
		return;
	}

	var cellTable = this.datastore.getTable('cells');
	for (var i = 0; i < this.active.length; i++) {
		var cell = this.active[i];
		var data = cell.release();
		this.updateCell(cell,data);
	}

	this.flushMeta();
};

Easel.prototype.load = function(done) {
	if (!this.datastoreManager) {
		this.x = parseFloat(localStorage.getItem('x')) || 0;
		this.y = parseFloat(localStorage.getItem('y')) || 0;
		this.scale = parseFloat(localStorage.getItem('scale')) || 1;
		this.bounds.minx = parseFloat(localStorage.getItem('minx')) || this.bounds.minx;
		this.bounds.miny = parseFloat(localStorage.getItem('miny')) || this.bounds.miny;
		this.bounds.maxx = parseFloat(localStorage.getItem('maxx')) || this.bounds.maxx;
		this.bounds.maxy = parseFloat(localStorage.getItem('maxy')) || this.bounds.maxy;

		var v = this.getViewport();
		var numCellsWithData = 0;

		for (var row = v.minrow; row < v.minrow + v.rows; row++) {
			for (var col = v.mincol; col < v.mincol + v.cols; col++) {
				var data = localStorage.getItem(col + '_' + row);
				if (data) {
					numCellsWithData++;
					this.initCell(col, row, data);
				} else {
					this.initCell(col, row);
				}
			}
		}

		done(numCellsWithData);
		return;
	}
	var _this = this;
	this.datastoreManager.openOrCreateDatastore('_dd5',function (error, datastore) {
		if (error) {
			throw new Error('Error opening default datastore: ' + error);
		}
		_this.datastore = datastore;

		var easelTable = datastore.getTable('easel');
		var record = easelTable.get('this');
		if (!record) {
			return done();
		}
		_this.x = record.get('x');
		_this.y = record.get('y');
		_this.scale = record.get('scale');
		_this.bounds.minx = record.get('minx');
		_this.bounds.miny = record.get('miny');
		_this.bounds.maxx = record.get('maxx');
		_this.bounds.maxy = record.get('maxy');

		var cellTable = datastore.getTable('cells');
		var v = _this.getViewport();
		var numCellsWithData = 0;

		for (var row = v.minrow; row < v.minrow + v.rows; row++) {
			for (var col = v.mincol; col < v.mincol + v.cols; col++) {
				var cell = cellTable.get(col + '_' + row);
				if (cell) {
					numCellsWithData++;
					_this.initCell(col, row, cell.get('data'));
				}
			}
		}

		done(numCellsWithData);
	});
};

return Easel;

});
