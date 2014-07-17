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

COLOR = 'yellow';
THICKNESS = 6;
var pool = [];
var retina = false;
var debug = true;
var resolutionScale = 1;
var dirty = {};

function Canvas(width, height, data, col, row) {
	this.width = width;
	this.height = height;
	this.col = col;
	this.row = row;
	this.scale = 1;
	this.points = [];

	var canvas;
	if (data == true) {
		canvas = document.getElementById('canvas');
		canvas.retinaResolutionEnabled = retina;
		canvas.width = width;
		canvas.height = height;
		setVendorAttribute(canvas.getContext('2d'), 'imageSmoothingEnabled', false);
		this.canvas = canvas;
	} else if (data) {
		this.data = data;
		canvas = this.init();
	} else {
		canvas = this.initCanvas();
		if (debug) {
			var context = canvas.getContext('2d');
			this.color = "rgb("+[(50).rInt(50),(50).rInt(50),(50).rInt(50)].join(',')+")";
			context.fillStyle = this.color;
			context.fillRect(0,0,width,height);
		}
	}
	
	
	return this;
}

Canvas.flushAll = function(callback) {
	Object.keys(dirty).forEach(function(key) {
		callback(dirty[key]);
		dirty[key].dirty = false;
	});
	dirty = {};
};

Canvas.prototype.init = function() {
	if (!this.canvas) {
		var canvas = this.canvas = this.initCanvas();
		if (debug) {
			var context = canvas.getContext('2d');
			this.color = "rgb("+[(50).rInt(50),(50).rInt(50),(50).rInt(50)].join(',')+")";
			context.fillStyle = this.color;
			context.fillRect(0,0,this.width,this.height);
		}
		if (this.data) {
			var context = canvas.getContext('2d');
			var segments = this.data.split('_');

			context.lineWidth = THICKNESS;
			context.lineCap = 'round';
			context.strokeStyle = COLOR;
			
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

			this.data = null;
		} else {
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
	this.scale = resolutionScale;
	canvas.width = this.width * this.scale;
	canvas.height = this.height * this.scale;
	this.canvas = canvas;
	setVendorAttribute(canvas.getContext('2d'), 'imageSmoothingEnabled', false);
	return canvas;
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
	canvas.height = 1;
	//canvas.width = canvas.width;
	this.canvas = null;
	this.points = [];
	return this.data;
};

Canvas.prototype.toData = function() {
	if (this.points.length > 0) {
		var data = this.points[0].join(',');
		for (var i = 1; i < this.points.length; i++) {
			data += '_' + this.points[i].join(',');
		}
		return data;
	}
};

Canvas.prototype.dirtyThis = function() {
	dirty[this.col + '_'+ this.row] = this;
	this.dirty = true;
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

Canvas.prototype.clear = function(color) {
	this.canvas.width = this.canvas.width;
	if (typeof color === 'string' || debug) {
		var context = this.canvas.getContext('2d');
		context.fillStyle = color || this.color;
		context.fillRect(0,0,this.width,this.height);
	}
	return this;
};

Canvas.prototype.clearCircle = function(x, y, radius) {
	x *= this.scale;
	y *= this.scale;
	radius *= this.scale;
	var context = this.canvas.getContext('2d');
	context.save();
	if (debug) {
		context.fillStyle = this.color;
	} else {
		context.fillStyle = 'white';
		context.globalCompositeOperation = 'destination-out';
	}
    context.beginPath();
    context.arc(x, y, radius, 0, 2 * Math.PI, false);
    context.fill();
    context.restore();
	return this;
};
