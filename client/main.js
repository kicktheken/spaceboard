define(['easel'],function(Easel) {

var stage = new Easel(window.innerWidth, window.innerHeight);
stage.load(function(numLoaded) {
	if (!numLoaded) {
		stage.initCell(0,0);
		console.log('initialize blank stage');
	} else {
		console.log('stage loaded with data');
	}
	run();
});

function getTouch(e) {
	if (e.touches && e.touches.length > 0) {

		var touches = [];
		var averagePoint = { x: 0, y: 0, length: e.touches.length };
		for (var i=0; i < e.touches.length; i++) {
			var touch = e.touches[i]
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

function setEraser(touch) {
	var maxRadius = 0;
	for (var n in touch.touches) {
		var p = touch.touches[n];
		var dx = p.x - touch.x;
		var dy = p.y - touch.y;
		var radius = Math.sqrt(dx * dx + dy * dy);
		if (radius > maxRadius) {
			maxRadius = radius;
		}
	}
	stage.setEraser(touch.x, touch.y, maxRadius / 2 + 30);
}

function getDistance(touch) {
	if (touch.length <= 1) {
		return 0;
	}
	var dist = 0;
	var prev = touch.touches[0];
	for (var i=1; i<touch.length; i++) {
		var cur = touch.touches[i];
		var dx = cur.x - prev.x, dy = cur.y - prev.y;
		dist += Math.sqrt(dx * dx + dy * dy);
	}
	return dist;
}

//
// main code
//

function run() {
	var prevTouch;
	var touchRespond;

	var touchBegin = function(e) {
		e.preventDefault();
		stage.stopInertiaScroll();
		var touch = getTouch(e);
		touchRespond = function() {
			if (touch.length > 2) {
				setEraser(touch);
			}
		};
		prevTouch = touch
	};

	var touchMove = function(e) {
		e.preventDefault();
		var touch = getTouch(e);
		touchRespond = function() {
			if (prevTouch) {
				if (touch.length > 2) {
					setEraser(touch);
				} else if (touch.length == 2) {
					stage.zoom(getDistance(touch), touch.x, touch.y);
					var dx = touch.x - prevTouch.x;
					var dy = touch.y - prevTouch.y;
					stage.translate(dx,dy);
				} else {
					stage.lineDraw(prevTouch.x, prevTouch.y, touch.x, touch.y);
				}
				prevTouch = touch
			}
		};
	};

	var touchEnd = function(e) {
		e.preventDefault();
		if (prevTouch && prevTouch.length == 1) {
			var touch = prevTouch;
			touchRespond = function() {
				stage.startDraw(touch.x, touch.y);
			};
		} else {
			touchRespond = function() {
				stage.stopZoom();
				stage.unsetEraser();
				stage.startInertiaScroll();
			};
		}
		prevTouch = null;
	};


	function makeCallback(f) {
		return function(e) {
			touchRespond = function() {
				f(e);
				touchRespond = null;
			};
		};
	};

	document.addEventListener('mousedown', touchBegin);
	document.addEventListener('mousemove', touchMove);
	document.addEventListener('mouseup', touchEnd);

	document.addEventListener('touchstart', touchBegin);
	document.addEventListener('touchmove', touchMove);
	document.addEventListener('touchend', touchEnd);
	document.addEventListener('touchcancel', touchEnd);

	if (/Mac OS/i.test(navigator.userAgent)) { // trackpad scrolling is win
		var ffVersion = navigator.userAgent.match(/Firefox\/\d+/i);
		if (ffVersion) {
			ffVersion = ffVersion[0].substring(ffVersion[0].indexOf('/')+1);
			if (ffVersion > 16) { // deltaX only works on FF 17.0+
				initMouseScroll();
				window.addWheelListener(document, function(e) {
					stage.translate(e.deltaX, e.deltaY);
				});
			}
		} else if (/webkit/i.test(navigator.userAgent)) {
			initMouseScroll();
			window.addWheelListener(document, function(e) {
				stage.translate(e.deltaX * 20, e.deltaY * 20);
			});
		}
	}

	(function animloop(){
		requestAnimationFrame(animloop);
		if (touchRespond) {
			touchRespond();
			touchRespond = null;
		}
		stage.update();
	})();

	
	var unload = function(e) {
		stage.save();
	};
	window.onbeforeunload = unload;
	window.onunload = unload;
}

function initMouseScroll() {
    var prefix = "", _addEventListener, onwheel, support;

    // detect event model
    if ( window.addEventListener ) {
        _addEventListener = "addEventListener";
    } else {
        _addEventListener = "attachEvent";
        prefix = "on";
    }

    // detect available wheel event
    if ( document.onmousewheel !== undefined ) {
        // Webkit and IE support at least "mousewheel"
        support = "mousewheel"
    }
    try {
        // Modern browsers support "wheel"
        WheelEvent("wheel");
        support = "wheel";
    } catch (e) {}
    if ( !support ) {
        // let's assume that remaining browsers are older Firefox
        support = "DOMMouseScroll";
    }

    window.addWheelListener = function( elem, callback, useCapture ) {
        _addWheelListener( elem, support, callback, useCapture );

        // handle MozMousePixelScroll in older Firefox
        if( support == "DOMMouseScroll" ) {
            _addWheelListener( elem, "MozMousePixelScroll", callback, useCapture );
        }
    };

    function _addWheelListener( elem, eventName, callback, useCapture ) {
        elem[ _addEventListener ]( prefix + eventName, support == "wheel" ? callback : function( originalEvent ) {
            !originalEvent && ( originalEvent = window.event );

            // create a normalized event object
            var event = {
                // keep a ref to the original event object
                originalEvent: originalEvent,
                target: originalEvent.target || originalEvent.srcElement,
                type: "wheel",
                deltaMode: originalEvent.type == "MozMousePixelScroll" ? 0 : 1,
                deltaX: 0,
                delatZ: 0,
                preventDefault: function() {
                    originalEvent.preventDefault ?
                        originalEvent.preventDefault() :
                        originalEvent.returnValue = false;
                }
            };

            // calculate deltaY (and deltaX) according to the event
            if ( support == "mousewheel" ) {
                event.deltaY = - 1/40 * originalEvent.wheelDelta;
                // Webkit also support wheelDeltaX
                originalEvent.wheelDeltaX && ( event.deltaX = - 1/40 * originalEvent.wheelDeltaX );
            } else {
                event.deltaY = originalEvent.detail;
            }

            // it's time to fire the callback
            return callback( event );

        }, useCapture || false );
    }
};

});
