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

function Canvas(width, height, stage) {
	var canvas = this.canvas = stage ? document.getElementById('canvas') : this.initCanvas();
	this.width = canvas.width = width;
	this.height = canvas.height = height;
	if (retina) {
		canvas.style.width = canvas.width + 'px';
		canvas.style.height = canvas.height + 'px';
		canvas.width = canvas.width * 2
		canvas.height = canvas.height * 2
	}
	if (stage && typeof window.ejecta === 'undefined') {
		setVendorAttribute(canvas.getContext('2d'), 'imageSmoothingEnabled', false);
	}
	if (debug) {
		var context = canvas.getContext('2d');
		this.color = "rgb("+[(50).rInt(50),(50).rInt(50),(50).rInt(50)].join(',')+")";
		context.fillStyle = this.color;
		context.fillRect(0,0,width,height);
	}
	return this;
}

Canvas.prototype.init = function() {
	if (!this.canvas) {
		if (this.data) {
			var canvas = this.canvas = this.initCanvas();
			var img = new Image();
			var _this = this;
			img.onload = function() {
				canvas.getContext('2d').drawImage(this,0,0);
			};
			img.src = this.data;
			this.data = null;
			return true;
		} else {
			throw new Error("cannot reinitialize canvas without data url");
		}
	}
};

Canvas.prototype.initCanvas = function() {
	if (pool.length > 0) {
		return pool.shift();
	}
	var canvas = document.createElement('canvas');
	canvas.retinaResolutionEnabled = retina;
	return canvas;
};

Canvas.prototype.release = function() {
	var canvas = this.canvas;
	this.data = retina || canvas.retinaResolutionEnabled ? canvas.toDataURLHD() : canvas.toDataURL();
	pool.push(canvas);
	canvas.width = canvas.width;
	this.canvas = null;
};

Canvas.prototype.drawCircle = function(color, x, y, radius) {
	var context = this.canvas.getContext('2d');
	context.beginPath();
	context.arc(x, y, radius, 0, 2 * Math.PI, false);
	context.fillStyle = color;
	context.fill();
	return this;
};

Canvas.prototype.drawLine = function(color, x1, y1, x2, y2, thickness) {
	var context = this.canvas.getContext('2d');
	context.lineWidth = thickness;
	context.lineCap = 'round';
	context.strokeStyle = color;
	context.beginPath();
	context.moveTo(x1, y1);
	context.lineTo(x2, y2);
	context.stroke();
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
