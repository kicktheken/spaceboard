define(['easel'],function(Easel) {

var stage = new Easel(window.innerWidth, window.innerHeight);

function getTouch(e) {
	if (e.touches && e.touches.length > 0) {

		var touches = [];
		var averagePoint = { x: 0, y: 0, length: e.touches.length };
		for (var n in e.touches) {
			var touch = e.touches[n]
			touch = { x: touch.pageX, y: touch.pageY };
			touches.push(touch);
			averagePoint.x += touch.x / averagePoint.length;
			averagePoint.y += touch.y / averagePoint.length;
		}
		averagePoint.touches = touches;
		return averagePoint;
	}
	var ret = { x: e.pageX - canvas.offsetLeft, y: e.pageY - canvas.offsetTop, length: 1 };
	if (retina) {
		ret.x *= 2;
		ret.y *= 2;
	}
	return ret;
}

var prevTouch;

function setEraser(touch) {
	var maxRadius = 0;
	for (var n in touch.touches) {
		var p = touch.touches[n]
		var dx = p.x - touch.x;
		var dy = p.y - touch.y;
		var radius = Math.sqrt(dx * dx + dy * dy);
		if (radius > maxRadius) {
			maxRadius = radius;
		}
	}
	stage.setEraser(touch.x, touch.y, maxRadius + 20);
}

var touchBegin = function(e) {
	stage.stopInertiaScroll();
	var touch = getTouch(e);
	if (touch.length == 1) {
		stage.startDraw(touch.x, touch.y);
	} else if (touch.length > 2) {
		setEraser(touch);
	}
	prevTouch = touch
};

var touchMove = function(e) {
	if (prevTouch) {
		var touch = getTouch(e);
		if (touch.length > 2) {
			setEraser(touch);
		} else if (touch.length == 2) {
			var dx = touch.x - prevTouch.x;
			var dy = touch.y - prevTouch.y;
			stage.translate(dx,dy);
		} else {
			stage.lineDraw(prevTouch.x, prevTouch.y, touch.x, touch.y);
		}
		prevTouch = touch;
	}
};

var touchEnd = function(e) {
	stage.unsetEraser();
	stage.startInertiaScroll();
	prevTouch = null;
};

document.addEventListener('mousedown', touchBegin);
document.addEventListener('mousemove', touchMove);
document.addEventListener('mouseup', touchEnd);

document.addEventListener('touchstart', touchBegin);
document.addEventListener('touchmove', touchMove);
document.addEventListener('touchend', touchEnd);

(function animloop(){
	requestAnimationFrame(animloop);
	stage.update();
})();


});
