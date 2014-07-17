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

var pool = [];
var retina = false;
var debug = true;
var resolutionScale = 1;

function Canvas(width, height, data, callback) {
	this.width = width;
	this.height = height;
	this.scale = 1;

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
		canvas = this.init(callback);
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

Canvas.prototype.init = function(callback) {
	if (!this.canvas) {
		if (this.data) {
			var canvas = this.canvas = this.initCanvas();

			if (debug) {
				var context = canvas.getContext('2d');
				this.color = "rgb("+[(50).rInt(50),(50).rInt(50),(50).rInt(50)].join(',')+")";
				context.fillStyle = this.color;
				context.fillRect(0,0,this.width,this.height);
			}
			var context = canvas.getContext('2d');
			var segments = this.data.split('_');

			context.lineWidth = 5;
			context.lineCap = 'round';
			context.strokeStyle = 'yellow';
			
			for (var i = 0; i < segments.length; i++) {
				var segment = segments[i].split(',');
				this.points.push(segment);
				context.beginPath();
				context.moveTo(segment[0], segment[1]);
				for (var j = 2; j < segment.length; j += 2) {
					context.lineTo(segment[j], segment[j+1]);
				}
				context.stroke();
			}

			this.data = null;
			return this.canvas;
		} else {
			console.error("missing data at cell "+[this.col,this.row].join());
		}
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
	this.points = [];
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

	if (this.points.length > 0) {
		this.data = '';
		this.data += this.points[0].join(',');
		for (var i = 1; i < this.points.length; i++) {
			this.data += '_' + this.points[i].join(',');
		}
	}
	pool.push(canvas);
	canvas.height = 1;
	//canvas.width = canvas.width;
	this.canvas = null;
	return this.data;
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
