function setVendorAttribute(el, attr, val) {
	var uc = attr.charAt(0).toUpperCase() + attr.substr(1);
	el[attr] = el['ms' + uc] = el['moz' + uc] = el['webkit' + uc] = el['o' + uc] = val;
}

var retina = false;

var canvas = document.getElementById('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
if (retina) {
	canvas.style.width = canvas.width + 'px';
	canvas.style.height = canvas.height + 'px';
	canvas.width = canvas.width * 2
	canvas.height = canvas.height * 2
}

var context = canvas.getContext('2d');
setVendorAttribute(context, 'imageSmoothingEnabled', false);

for (var k in createjs) {
	if (!window[k]) {
		window[k] = createjs[k]
	}
}
var stage = new Stage(canvas);

function run() {
	createjs.Touch.enable(stage);
	stage.enableMouseOver(10);
	stage.mouseMoveOutside = true; // keep tracking the mouse even when it leaves the canvas

	var color = 'yellow';
	var thickness = 10;
	var shape = new Shape();
	stage.addChild(shape);
	stage.update();

	function getTouch(e) {
		if (e.touches && e.touches.length > 0) {
			return { x: e.touches[0].pageX, y: e.touches[0].pageY };
		}
		var ret = { x: e.pageX - canvas.offsetLeft, y: e.pageY - canvas.offsetTop };
		if (retina) {
			ret.x *= 2;
			ret.y *= 2;
		}
		return ret;
	}

	var prevTouch;

	var touchBegin = function(e) {
		var touch = getTouch(e);
		shape.graphics.beginFill(color).drawCircle(touch.x, touch.y, thickness / 2);
		prevTouch = touch
	};

	var touchMove = function(e) {
		if (prevTouch) {
			var touch = getTouch(e);
			shape.graphics
				.setStrokeStyle(thickness,1)
				.beginStroke(color)
				.moveTo(prevTouch.x, prevTouch.y)
				.lineTo(touch.x, touch.y).endStroke()
			prevTouch = touch;
		}
	};

	var touchEnd = function(e) {
		prevTouch = null;
	};

	document.addEventListener('mousedown', touchBegin);
	document.addEventListener('mousemove', touchMove);
	document.addEventListener('mouseup', touchEnd);

	document.addEventListener('touchstart', touchBegin);
	document.addEventListener('touchmove', touchMove);
	document.addEventListener('touchend', touchEnd);


	Ticker.addEventListener("tick", stage);
	Ticker.setFPS(60);
}

run();
