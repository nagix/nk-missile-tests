var mouseX = 0, mouseY = 0, pmouseX = 0, pmouseY = 0;
var pressX = 0, pressY = 0;
var scale = 0, pscale = 0;

var dragging = false;
var scaling = false;

var rotateX = 0, rotateY = 0;
var rotateVX = 0, rotateVY = 0;
var rotateXMax = 90 * Math.PI/180;

var rotateTargetX = undefined;
var rotateTargetY = undefined;

var tilt = 0;
var tiltTarget = undefined;
var scaleTarget = undefined;

var keyboard = new THREEx.KeyboardState();

function onDocumentMouseMove( event ) {

	pmouseX = mouseX;
	pmouseY = mouseY;

	if (event instanceof MouseEvent) {
		mouseX = event.clientX - window.innerWidth * 0.5;
		mouseY = event.clientY - window.innerHeight * 0.5;
	} else {
		mouseX = event.touches[0].clientX - window.innerWidth * 0.5;
		mouseY = event.touches[0].clientY - window.innerHeight * 0.5;
	}

	if(dragging && !('ontouchend' in document && event instanceof TouchEvent && event.touches.length > 1)){
		if(keyboard.pressed("shift") == false){
			rotateVY += (mouseX - pmouseX) / 2 * Math.PI / 180 * 0.1;
			rotateVX += (mouseY - pmouseY) / 2 * Math.PI / 180 * 0.1;
		}
		else{
			tilt -= (mouseY - pmouseY) * 0.01;
			tilt = constrain(tilt, 0, Math.PI / 2);
			camera.position.y = 300 * Math.sin(-tilt);
			camera.position.z = 100 + 300 * Math.cos(-tilt);
			camera.lookAt(new THREE.Vector3(0, 0, 100));
		}
	}
}

function onDocumentMouseDown( event ) {
	if(typeof event.target.className === 'string' && event.target.className.indexOf('noMapDrag') !== -1) {
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

	if ('ontouchend' in document && event instanceof TouchEvent && event.touches.length > 1) {
		event.preventDefault();
	}
}

function onDocumentMouseUp( event ){
	d3Graphs.zoomBtnMouseup();
	dragging = false;
	histogramPressed = false;
}

function onClick( event ){
}

function onKeyDown( event ){
}

function handleMWheel( delta ) {
	camera.scale.z += delta * 0.1;
	camera.scale.z = constrain( camera.scale.z, 0.5, 5.0 );
	scaleTarget = undefined;
}

function onMouseWheel( event ){
	var delta = 0;

	if (event.wheelDelta) { /* IE/Opera. */
		delta = event.wheelDelta/120;
	}
	//	firefox
	else if( event.detail ){
		delta = -event.detail/3;
	}

	if (delta)
		handleMWheel(delta);

	event.returnValue = false;
}

function onDocumentResize(e){
}

function onGestureChange(event) {
	pscale = scale;
	scale = event.scale;
	if (scaling) {
		handleMWheel(Math.log(event.scale/pscale)*10);
	}
}

function onGestureStart(event) {
	scaling = true;
	scale = event.scale;
}

function onGestureEnd(event) {
	scaling = false;
}
