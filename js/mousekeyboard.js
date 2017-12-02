var mouseX = 0, mouseY = 0, pmouseX = 0, pmouseY = 0;
var pressX = 0, pressY = 0;
var pscale = 0;

var dragging = false;
var touchEndTime = 0;

var rotateX = 0, rotateY = 0;
var rotateVX = 0, rotateVY = 0;
var rotateXMax = 90 * Math.PI / 180;

var rotateTargetX = undefined;
var rotateTargetY = undefined;

var tilt = 0;
var tiltTarget = undefined;
var scaleTarget = undefined;

var keyboard = new THREEx.KeyboardState();

function onDocumentMouseMove(event) {

	pmouseX = mouseX;
	pmouseY = mouseY;

	if (event instanceof MouseEvent) {
		mouseX = event.clientX - window.innerWidth * 0.5;
		mouseY = event.clientY - window.innerHeight * 0.5;
	} else {
		mouseX = event.touches[0].clientX - window.innerWidth * 0.5;
		mouseY = event.touches[0].clientY - window.innerHeight * 0.5;
	}

	if (dragging && !('ontouchmove' in document && event instanceof TouchEvent && event.touches.length > 1)) {
		if (keyboard.pressed("shift") == false) {
			rotateVY += (mouseX - pmouseX) / 2 * Math.PI / 180 * 0.1;
			rotateVX += (mouseY - pmouseY) / 2 * Math.PI / 180 * 0.1;
		} else {
			handleTiltWheel((mouseY - pmouseY) * 0.1);
		}
	}

	// This prevents zooming by gesture
	if (dragging && 'ontouchmove' in document && event instanceof TouchEvent) {
		event.preventDefault();
	}
}

function onDocumentMouseDown(event) {
	if (typeof event.target.className === 'string' && event.target.className.indexOf('noMapDrag') !== -1) {
		return;
	}

	if (event instanceof MouseEvent) {
		mouseX = event.clientX - window.innerWidth * 0.5;
		mouseY = event.clientY - window.innerHeight * 0.5;
	} else {
		mouseX = event.touches[0].clientX - window.innerWidth * 0.5;
		mouseY = event.touches[0].clientY - window.innerHeight * 0.5;
	}

	dragging = true;
	pressX = mouseX;
	pressY = mouseY;
	rotateTargetX = undefined;
	rotateTargetX = undefined;
	tiltTarget = undefined;
	scaleTarget = undefined;

	// This prevents zooming by gesture
	if ('ontouchstart' in document && event instanceof TouchEvent && event.touches.length > 1) {
		event.preventDefault();
	}
}

function onDocumentMouseUp(event) {
	d3Graphs.tiltBtnMouseup();
	d3Graphs.zoomBtnMouseup();
	dragging = false;
	histogramPressed = false;

	// This prevents zooming by double-taps
	if ('ontouchend' in document && event instanceof TouchEvent) {
		var now = new Date().getTime();
		if (now - touchEndTime < 500) {
			event.preventDefault();
		}
		touchEndTime = now;
	}
}

function onClick(event) {
}

function onKeyDown(event) {
}

function handleMWheel(delta) {
	camera.zoom += delta * 0.1;
	camera.zoom = constrain(camera.zoom, 0.5, 5.0);
	camera.updateProjectionMatrix();
	scaleTarget = undefined;
}

function onMouseWheel(event) {
	var delta = 0;

	if (event.wheelDelta) { /* IE/Opera. */
		delta = event.wheelDelta / 120;
	} else if (event.detail) { // firefox
		delta = -event.detail / 3;
	}

	if (delta) {
		handleMWheel(delta);
	}

	event.returnValue = false;
}

function onDocumentResize(event) {
}

function onDocumentPinch(event) {
	if (event.type === 'pinchmove') {
		handleMWheel(Math.log(event.scale / pscale) * 10);
	}
	pscale = event.scale;
}

function handleTiltWheel(delta) {
	tilt -= delta * 0.1;
	tilt = constrain(tilt, 0, Math.PI / 2);
	camera.position.y = 300 * Math.sin(-tilt);
	camera.position.z = 100 + 300 * Math.cos(-tilt);
	camera.lookAt(new THREE.Vector3(0, 0, 100));
	tiltTarget = undefined;
}

function onDocumentPan(event) {
	handleTiltWheel(event.velocityY);
}
