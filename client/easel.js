define(['canvas'],function() {

var maxZoom = 1;
var minZoom = .2;
var bPooling = true;

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
		cell = new Canvas(this.stage.width, this.stage.height, data, col, row);
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
	var offsetX = (1 / minZoom / 2) * this.stage.width;
	var offsetY = (1 / minZoom / 2) * this.stage.height;

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
	x = (x - this.x) / this.scale;
	y = (y - this.y) / this.scale;

	var col = Math.floor(x / this.stage.width);
	var row = Math.floor(y / this.stage.height);

	this.updateBounds(x,y);
	x -= col * this.stage.width;
	y -= row * this.stage.height;

	return { x:x, y:y, col:col, row:row };
};

Easel.prototype.getZoneNeighbors = function(coords, threshold) {
	var ret = [];

	var zoneWidth = this.stage.width * this.scale;
	var zoneHeight = this.stage.height * this.scale;

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
		coords.x - (offsetCol * this.stage.width),
		coords.y - (offsetRow * this.stage.height),
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

Easel.prototype._drawLine = function(coords1, coords2, offsetCol, offsetRow) {
	offsetCol = offsetCol || 0;
	offsetRow = offsetRow || 0;
	this.initCell(
		coords1.col + offsetCol, coords1.row + offsetRow
	).drawLine(
		COLOR,
		coords1.x - (offsetCol * this.stage.width),
		coords1.y - (offsetRow * this.stage.height),
		coords2.x - ((offsetCol + coords1.col - coords2.col) * this.stage.width),
		coords2.y - ((offsetRow  + coords1.row - coords2.row) * this.stage.height),
		THICKNESS
	);
};

Easel.prototype.drawLine = function(x1, y1, x2, y2) {
	var coords1 = this.translateCoords(x1,y1);
	var coords2 = this.translateCoords(x2,y2);

	// this method may have multiple draw calls for the same area
	// but it should be performant enough that that doesn't matter
	var neighbors = this.getZoneNeighbors(coords1, THICKNESS / 2);
	for (var i=0; i < neighbors.length; i++) {
		this._drawLine(coords1, coords2, neighbors[i][0], neighbors[i][1]);
	}
	this._drawLine(coords1, coords2);


	neighbors = this.getZoneNeighbors(coords2, THICKNESS / 2);
	for (var i=0; i < neighbors.length; i++) {
		this._drawLine(coords2, coords1, neighbors[i][0], neighbors[i][1]);
	}
	this._drawLine(coords2, coords1);

	var colDiff = coords2.col - coords1.col;
	var rowDiff = coords2.row - coords1.row;
	if (Math.abs(colDiff) == 1 && Math.abs(rowDiff) == 1) {
		this._drawLine(coords1, coords2, colDiff, 0);
		this._drawLine(coords1, coords2, 0, rowDiff);
	}
};

Easel.prototype.getViewport = function() {
	var zoneWidth = this.stage.width * this.scale;
	var zoneHeight = this.stage.height * this.scale;

	var mincol = Math.floor(-this.x / zoneWidth);
	var numcols = Math.ceil(this.stage.width / zoneWidth) + 1;

	var minrow = Math.floor(-this.y / zoneHeight);
	var numrows = Math.ceil(this.stage.height / zoneHeight) + 1;

	return { mincol: mincol, minrow: minrow, cols: numcols, rows: numrows };
};

Easel.prototype.translate = function(dx, dy) {
	this.dx = dx;
	this.dy = dy;
	this.x += dx;
	this.y += dy;

	if (-this.x < (this.bounds.minx + this.stage.width / 2) * this.scale ) {
		this.x = -(this.bounds.minx + this.stage.width / 2) * this.scale;
	} else if (-this.x > this.bounds.maxx * this.scale - this.stage.width * (1 - this.scale / 2)) {
		this.x = -(this.bounds.maxx * this.scale - this.stage.width * (1 - this.scale / 2));
	}
	if (-this.y < (this.bounds.miny + this.stage.height / 2) * this.scale) {
		this.y = -(this.bounds.miny + this.stage.height / 2) * this.scale;
	} else if (-this.y > this.bounds.maxy * this.scale - this.stage.height * (1 - this.scale / 2)) {
		this.y = -(this.bounds.maxy * this.scale - this.stage.height * (1 - this.scale / 2));
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
	this.x -= scale * (x - this.x);
	this.y -= scale * (y - this.y);
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
		coords.x - (offsetCol * this.stage.width),
		coords.y - (offsetRow * this.stage.height),
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

	var zoneWidth = this.stage.width * this.scale;
	var zoneHeight = this.stage.height * this.scale;
	var v = this.getViewport();
	
	for (var row = v.minrow; row < v.minrow + v.rows; row++) {
		for (var col = v.mincol; col < v.mincol + v.cols; col++) {
			var cell = this.initCell(col,row);
			this.stage.drawCanvas(
				cell,
				this.x + col * zoneWidth,
				this.y + row * zoneHeight,
				zoneWidth,
				zoneHeight
			);
			cell.tick = this.ticks;
		}
	}

	if (this.eraser) {
		this.stage.drawCircle('rgb(255,200,200)', this.eraser.x, this.eraser.y, this.eraser.radius);
	}

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
	this.datastoreManager.openOrCreateDatastore('_0.5',function (error, datastore) {
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
