define(['canvas'],function() {

var stage = new Canvas(window.innerWidth, window.innerHeight, true);

function run() {

	var color = 'yellow';
	var thickness = 10;

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
		if (touch.length == 1) {
			stage.drawCircle(color, touch.x, touch.y, thickness / 2);
		}
		prevTouch = touch
	};

	var touchMove = function(e) {
		if (prevTouch) {
			var touch = getTouch(e);
			if (touch.length > 1) {
				var dx = touch.x - prevTouch.x;
				var dy = touch.y - prevTouch.y;
				// TODO: pan camera
			} else {
				stage.drawLine(color, prevTouch.x, prevTouch.y, touch.x, touch.y, thickness);
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
}

run();

});
