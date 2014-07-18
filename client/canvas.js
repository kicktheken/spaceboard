function setVendorAttribute(el, attr, val) {
	var uc = attr.charAt(0).toUpperCase() + attr.substr(1);
	el[attr] = el['ms' + uc] = el['moz' + uc] = el['webkit' + uc] = el['o' + uc] = val;
}

Number.prototype.rInt = function(n) {
	return Math.floor(Math.random() * this) + (n || 0);
};

Number.prototype.floor = function() {
	return Math.floor(this);
};

COLOR = 'rgb(0,80,150)';
BGCOLOR = 'rgb(245,240,225)';
GRIDCOLOR = 'rgb(220,230,240)';
THICKNESS = 10;
var pool = [];
var retina = true;
var resolutionScale = 1;
var dirty = {};

function Canvas(width, height, data, col, row) {
	this.width = width;
	this.height = height;
	this.col = col;
	this.row = row;
	this.scale = 1;
	this.points = [];

	if (data == true) {
		var canvas = document.getElementById('canvas');
		canvas.retinaResolutionEnabled = retina; // this is only for Ejecta
		canvas.width = width;
		canvas.height = height;
		setVendorAttribute(canvas.getContext('2d'), 'imageSmoothingEnabled', false);
		if (retina) {
			canvas.width = canvas.width * Canvas.getScale();
			canvas.height = canvas.height * Canvas.getScale();
		}
		this.canvas = canvas;
	} else if (data) {
		this.data = data;
		this.init();
	} else {
		this.initCanvas();
		this.clear();
	}
	
	
	return this;
}

Canvas.flushAll = function(callback) {
	Object.keys(dirty).forEach(function(key) {
		var cell = dirty[key];
		if (cell.canvas) {
			callback(cell);
			cell.load();
			cell.dirty = false;
		}
	});
	dirty = {};
};

Canvas.getScale = function() {
	return resolutionScale * (
		retina && window.devicePixelRatio > 1 ? window.devicePixelRatio : 1
	);
};

Canvas.prototype.init = function() {
	if (!this.canvas) {
		var canvas = this.canvas = this.initCanvas();
		this.clear();
		if (this.data) {
			this.load(this.data);
			this.data = null;
		}
		return canvas;
	}
};

Canvas.prototype.initCanvas = function() {
	var canvas;
	if (pool.length > 0) {
		canvas = pool.shift();
	} else {
		canvas = document.createElement('canvas');
		canvas.retinaResolutionEnabled = retina;
	}
	this.scale = Canvas.getScale();
	canvas.width = this.width * this.scale;
	canvas.height = this.height * this.scale;
	this.canvas = canvas;
	setVendorAttribute(canvas.getContext('2d'), 'imageSmoothingEnabled', false);
	return canvas;
};

Canvas.prototype.resize = function(width, height) {
	this.canvas.width = width * Canvas.getScale();
	this.canvas.height = height * Canvas.getScale();
	this.width = width;
	this.height = height;
};

Canvas.prototype.load = function(data) {
	if (!data) {
		this.canvas.width = this.canvas.width;
		data = this.toData();
	}
	var context = this.canvas.getContext('2d');
	this.clear();
	if (!data) {
		return;
	}
	var segments = data.split('_');

	context.lineWidth = THICKNESS;
	context.lineCap = 'round';
	context.strokeStyle = COLOR;
	this.points = [];
	
	for (var i = 0; i < segments.length; i++) {
		var segment = segments[i].split(',');
		var points = [];
		context.beginPath();
		var x = parseFloat(segment[0]);
		var y = parseFloat(segment[1]);
		points.push(x);
		points.push(y);
		if (segment.length == 2) {
			context.arc(x, y, THICKNESS / 2, 0, 2 * Math.PI, false);
			context.fillStyle = COLOR;
			context.fill();
		} else {
			context.moveTo(x, y);
			for (var j = 2; j < segment.length; j += 2) {
				x = parseFloat(segment[j]);
				y = parseFloat(segment[j+1]);
				context.lineTo(x, y);
				points.push(x);
				points.push(y);
			}
			context.stroke();
		}
		this.points.push(points);
	}
};

Canvas.prototype.release = function() {
	var canvas = this.canvas;
	if (!canvas) {
		if (this.data) {
			return this.data;
		} else {
			throw new Error("cannot release a released canvas");
		}
	}
	this.data = this.toData();
	pool.push(canvas);
	this.canvas = null;
	this.points = [];
	return this.data;
};

Canvas.prototype.toData = function(floor) {
	if (this.points.length > 0) {
		if (floor) {
			function floor(arg) { return arg.floor(); }
			var data = this.points[0].map(floor).join(',');
			for (var i = 1; i < this.points.length; i++) {
				data += '_' + this.points[i].map(floor).join(',');
			}
		} else {
			var data = this.points[0].join(',');
			for (var i = 1; i < this.points.length; i++) {
				data += '_' + this.points[i].join(',');
			}
		}
		
		return data;
	}
};

Canvas.prototype.dirtyThis = function() {
	if (typeof this.col === 'number' && typeof this.row === 'number') {
		var key = this.col + '_'+ this.row;
		dirty[key] = this;
		this.dirty = true;
	}
};

Canvas.prototype.drawCircle = function(color, x, y, radius) {
	x *= this.scale;
	y *= this.scale;
	radius *= this.scale;
	var context = this.canvas.getContext('2d');
	context.beginPath();
	context.arc(x, y, radius, 0, 2 * Math.PI, false);
	context.fillStyle = color;
	context.fill();
	this.points.push([x,y]);
	this.dirtyThis();
	return this;
};

Canvas.prototype.drawLine = function(color, x1, y1, x2, y2, thickness) {
	x1 *= this.scale;
	y1 *= this.scale;
	x2 *= this.scale;
	y2 *= this.scale;
	thickness *= this.scale;

	var context = this.canvas.getContext('2d');
	context.lineWidth = thickness;
	context.lineCap = 'round';
	context.strokeStyle = color;
	context.beginPath();
	context.moveTo(x1, y1);
	context.lineTo(x2, y2);
	context.stroke();

	if (this.points.length > 0) {
		var lastSet = this.points[this.points.length - 1];
		var x = lastSet[lastSet.length - 2];
		var y = lastSet[lastSet.length - 1];
		if (x == x1 && y == y1) {
			lastSet.push(x2);
			lastSet.push(y2);
		} else {
			this.points.push([x1, y1, x2, y2]);
		}
	} else {
		this.points.push([x1, y1, x2, y2]);
	}
	this.dirtyThis();
	return this;
};

Canvas.prototype.drawCanvas = function(canvas, x, y, width, height) {
	var context = this.canvas.getContext('2d');
	if (width && height) {
		context.drawImage(canvas.canvas, x, y, width, height);
	} else {
		context.drawImage(canvas.canvas, x, y);
	}
	return this;
};

Canvas.prototype.clear = function() {
	var width = this.canvas.width;
	var height = this.canvas.height;
	this.canvas.width = width;
	var context = this.canvas.getContext('2d');
	context.fillStyle = BGCOLOR;
	context.fillRect(0,0,width,height);

	context.fillStyle = GRIDCOLOR;
	context.fillRect(0, (height-THICKNESS)/2, width, THICKNESS);
	context.fillRect((width-THICKNESS)/2, 0, THICKNESS, height);
	return this;
};

Canvas.prototype.clearCircle = function(x, y, radius) {
	x *= this.scale;
	y *= this.scale;
	radius *= this.scale;

	var isErased = false;
	for (var i = this.points.length - 1; i >= 0; i--) {
		var segment = this.points[i];
		if (segment.length == 2) {
			var dx = segment[0] - x;
			var dy = segment[1] - y;
			// circle to dot intersection
			if (dx * dx + dy * dy <= radius * radius) {
				this.points.splice(i,1);
				isErased = true;
			}
		} else {
			for (var j = segment.length - 4; j >= 0; j-=2) {
				var x1 = segment[j];
				var y1 = segment[j+1];
				var x2 = segment[j+2];
				var y2 = segment[j+3];

				var dx = x2 - x1;
				var dy = y2 - y1;
				var cx = x - x1;
				var cy = y - y1;
				var cross = dx*cy - dy*cx;
				
				if (cross * cross <= radius * radius * (dx*dx + dy*dy)) {
					// start point intersects circle
					if (cx * cx + cy * cy <= radius * radius) {
						segment.splice(j,2);
						if (j < segment.length) {
							var newsegment = segment.splice(j, segment.length - j);
							if (newsegment.length > 2) { // don't include dots
								this.points.splice(i+1,0,newsegment);
							}
						}
						j-=2;
						isErased = true;
					} else if ( // end point or middle intersects circle
						(dx-cx)*(dx-cx) + (dy-cy)*(dy-cy) <= radius*radius ||
						dx*cx + dy*cy >= 0 && dx*cx + dy*cy <= dx*dx + dy*dy
					) {
						segment.splice(j+2,2);
						if (j+2 < segment.length) {
							var newsegment = segment.splice(j+2, segment.length - j);
							if (newsegment.length > 2) { // don't include dots
								this.points.splice(i+1,0,newsegment);
							}
						}
						isErased = true;
					}
				}
			}
			if (segment.length <= 2) {
				this.points.splice(i,1);
			}
		}
	}
	if (isErased || this.points.length == 0) {
		this.dirtyThis();
	}

	var context = this.canvas.getContext('2d');
	context.save();
	context.fillStyle = BGCOLOR;
    context.beginPath();
    context.arc(x, y, radius, 0, 2 * Math.PI, false);
    context.fill();
    context.restore();
	return this;
};
