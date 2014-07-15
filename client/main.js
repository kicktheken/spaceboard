define(['easel'],function(Easel) {

var stage = new Easel(window.innerWidth, window.innerHeight);

function getTouch(e) {
	if (e.touches && e.touches.length > 0) {

		var averagePoint = { x: 0, y: 0, length: e.touches.length };
		for (var n in e.touches) {
			var touch = e.touches[n]
			averagePoint.x += touch.pageX / averagePoint.length;
			averagePoint.y += touch.pageY / averagePoint.length;
		}
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

var touchBegin = function(e) {
	var touch = getTouch(e);
	if (touch.length == 1) {
		stage.startDraw(touch.x, touch.y);
	}
	prevTouch = touch
};

var touchMove = function(e) {
	if (prevTouch) {
		var touch = getTouch(e);
		if (touch.length > 1) {
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
