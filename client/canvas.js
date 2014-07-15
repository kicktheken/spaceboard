function setVendorAttribute(el, attr, val) {
	var uc = attr.charAt(0).toUpperCase() + attr.substr(1);
	el[attr] = el['ms' + uc] = el['moz' + uc] = el['webkit' + uc] = el['o' + uc] = val;
}

var retina = false;

function Canvas(width, height, stage) {
	var canvas = this.canvas = stage ? document.getElementById('canvas') : document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	if (retina) {
		canvas.style.width = canvas.width + 'px';
		canvas.style.height = canvas.height + 'px';
		canvas.width = canvas.width * 2
		canvas.height = canvas.height * 2
	}
	if (stage && typeof window.ejecta === 'undefined') {
		setVendorAttribute(canvas.getContext('2d'), 'imageSmoothingEnabled', false);
	}
	return this;
}

Canvas.prototype = {
	drawCircle: function(color, x, y, radius) {
		var context = this.canvas.getContext('2d');
		context.beginPath();
		context.arc(x, y, radius, 0, 2 * Math.PI, false);
		context.fillStyle = color;
		context.fill();
		return this;
	},

	drawLine: function(color, x1, y1, x2, y2, thickness) {
		var context = this.canvas.getContext('2d');
		context.lineWidth = thickness;
		context.lineCap = 'round';
		context.strokeStyle = color;
		context.beginPath();
		context.moveTo(x1, y1);
		context.lineTo(x2, y2);
		context.stroke();
		return this;
	},

	drawCanvas: function(canvas, x, y) {
		var context = this.canvas.getContext('2d');
		context.drawImage(canvas.canvas, x, y);
		return this;
	},

	clear: function() {
		this.canvas.width = this.canvas.width;
	}
}
