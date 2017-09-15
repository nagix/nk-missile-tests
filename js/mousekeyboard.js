var mouseX = 0, mouseY = 0, pmouseX = 0, pmouseY = 0;
var pressX = 0, pressY = 0;

var dragging = false;						

var rotateX = 0, rotateY = 0;
var rotateVX = 0, rotateVY = 0;
var rotateXMax = 90 * Math.PI/180;	

var rotateTargetX = undefined;
var rotateTargetY = undefined;

var keyboard = new THREEx.KeyboardState();	

function onDocumentMouseMove( event ) {

	pmouseX = mouseX;
	pmouseY = mouseY;

	mouseX = event.clientX - window.innerWidth * 0.5;
	mouseY = event.clientY - window.innerHeight * 0.5;

	if(dragging){
		if(keyboard.pressed("shift") == false){
			rotateVY += (mouseX - pmouseX) / 2 * Math.PI / 180 * 0.1;
  			rotateVX += (mouseY - pmouseY) / 2 * Math.PI / 180 * 0.1;	
  		}
  		else{
  			camera.position.x -= (mouseX - pmouseX) * .1; 
  			camera.position.y += (mouseY - pmouseY) * .1;
  		}
	}
}

function onDocumentMouseDown( event ) {	
    if(event.target.className.indexOf('noMapDrag') !== -1) {
        return;
    }
    dragging = true;			   
    pressX = mouseX;
    pressY = mouseY;   	
    rotateTargetX = undefined;
    rotateTargetX = undefined;
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