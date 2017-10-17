var markers = [];

function onMarkerHover( event ){
	var hx = event.clientX - window.innerWidth * 0.5;
	var hy = event.clientY - window.innerHeight * 0.5;
	var dx = mouseX - hx;
	var dy = mouseY - hy;
	var d = Math.sqrt( dx * dx + dy * dy );
	// if( event.target.style.visibility == 'visible' )
	// 	console.log('clicked on something!!');
}

function attachMarkerToTest( testName ){
	//	look up the name to mesh
	testName = testName.toUpperCase();
	var test = testData[testName];
	if( test === undefined )
		return;

	var outcome = outcomeLookup[test.outcome];
	var missile = missileLookup[test.missile];
	var facilityName = facilityData[test.facility].name;
	var apogee = test.apogee === 'unknown' ? 'Unknown' : (test.apogee === 'na' ? 'N/A' : test.apogee + 'km');
	var distance = test.distance === 'unknown' ? 'Unknown' : (test.distance === 'na' ? 'N/A' : test.distance + 'km');

	var container = document.getElementById( 'visualization' );
	var template = document.getElementById( 'marker_template' );
	var marker = template.cloneNode(true);

	test.marker = marker;
	container.appendChild( marker );

	marker.testName = testName;

	marker.onLeft = test.markerOnLeft;
	marker.selected = false;
	marker.hover = false;
	if( selectedTest && testName === selectedTest.testName.toUpperCase() )
		marker.selected = true;

	marker.setPosition = function(x,y,z){
		this._width = this.jquery.outerWidth(true);
		this._x = x;
		this._y = y;
		this._dy = this._dy * 0.95 || 0;
		this._z = z;

		this.labelLeft = x + (this.onLeft ? -(this._width + 48) : 48);
		this.labelRight = this.labelLeft + this._width;
	};

	marker.updatePosition = function(){
		this.style.left = this.labelLeft + 'px';
		this.style.top = this._y + this._dy - (this.selected ? 27 : camera.zoom * 2 + 4) + 'px';
		this.style.zIndex = this._z;

		var positionArray = this.line.geometry.attributes.position.array;
		positionArray[0] = this._x;
		positionArray[1] = this._y;
		positionArray[3] = this._x + (this.onLeft ? -48 : 48);
		positionArray[4] = this._y + this._dy;
		this.line.geometry.attributes.position.needsUpdate = true;
	};

	marker.setVisible = function( vis ){
		if( ! vis ) {
			this.style.display = 'none';
			this.line.visible = false;
		}
		else{
			this.style.display = 'inline';
			this.line.visible = true;
		}
	};
	var testLayer = marker.querySelector( '#testText');
	marker.testLayer = testLayer;
	var detailLayer = marker.querySelector( '#detailText' );
	marker.detailLayer = detailLayer;
	var descriptionLayer = marker.querySelector( '#descriptionText' );
	marker.descriptionLayer = descriptionLayer;
	marker.jquery = $(marker);
	marker.setSize = function( s ){
		this.style.fontSize = s + 'pt';
	};

	marker.update = function(){
		var matrix = rotating.matrixWorld;
		var abspos = test.landingLocation.center.clone().applyMatrix4(matrix);
		var screenPos = screenXY(abspos);

		var s = camera.zoom * 3 + 5;

		if( this.selected )
			s = 20;

		this.setSize( s );

		// if( this.selected )
			// this.setVisible( true )
		// else
			this.setVisible( abspos.z > 0 );

		var zIndex = Math.floor( 1000 - abspos.z + s );
		if( this.selected )
			zIndex = 10000;

		this.setPosition( screenPos.x, screenPos.y, zIndex );
	};

	var nameLayer = marker.querySelector( '#testText' );

	nameLayer.innerHTML = testName.replace(' ','&nbsp;');

	var detailText = "";
	detailText += "<span class=\"key\">Date:</span>&nbsp;" + test.date + "&nbsp;&nbsp;" +
		"<span class=\"key\">Test Outcome:</span>&nbsp;" + outcome + "<br />" +
		"<span class=\"key\">Missle Name:</span>&nbsp;" + missile.name + "&nbsp;&nbsp;" +
		"<span class=\"key\">Missle Type:</span>&nbsp;" + missile.type + "<br />" +
		"<span class=\"key\">Facility Name:</span>&nbsp;" + facilityName + "<br />" +
		"<span class=\"key\">Landing Location:</span>&nbsp;" + test.landingLocation.name + "<br />" +
		"<span class=\"key\">Apogee:</span>&nbsp;" + apogee + "&nbsp;&nbsp;" +
		"<span class=\"key\">Distance Travelled:</span>&nbsp;" + distance;
	marker.detailText = detailText;

	var descriptionText = "<span class=\"key\">Description:</span>&nbsp;" + test.description;
	marker.descriptionText = descriptionText;


	var markerOver = function(e){
		this.style.color = '#FFA90B';
		this.line.material.color = new THREE.Color(0xFFA90B);
		this.hover = true;
	};

	var markerOut = function(e){
		this.style.color = '#FFFFFF';
		this.line.material.color = new THREE.Color(0xDDDDDD);
		this.hover = false;
	};

	if( marker.selected ) {
		marker.classList.add('selected');
		detailLayer.innerHTML = detailText;
		descriptionLayer.innerHTML = descriptionText;
	}
	else{
		marker.addEventListener( 'mouseover', markerOver, false );
		marker.addEventListener( 'mouseout', markerOut, false );
	}


	var markerSelect = function(e){
		var selection = selectionData;
		selectVisualization( timeBins, selection.selectedYear, [this.testName || ''], selection.getOutcomeCategories(), selection.getMissileCategories() );
	};
	if ( marker.selected )
		marker.jquery.find('.close').click(markerSelect);
	else
		marker.addEventListener('click', markerSelect, true);

	var lineGeo = new THREE.BufferGeometry();
	lineGeo.addAttribute('position', new THREE.BufferAttribute(new Float32Array([0,0,0,0,0,0]), 3));
	var line = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: 0xDDDDDD }));
	line.frustumCulled = false;
	scene2d.add(line);
	marker.line = line;

	markers.push( marker );
}

function removeMarkerFromTest( testName ){
	testName = testName.toUpperCase();
	var test = testData[testName];
	if( test === undefined )
		return;
	if( test.marker === undefined )
		return;

	var index = markers.indexOf(test.marker);
	if( index >= 0 )
		markers.splice( index, 1 );
	var container = document.getElementById( 'visualization' );
	scene2d.remove(test.marker.line);
	container.removeChild( test.marker );
	test.marker = undefined;
}

function updateMarkers () {
	var height = camera.zoom * 4 + 8;

	for (var i in markers) {
		var marker = markers[i];
		marker.update();
	}

	// eliminate overlap
	for (var r = 0; r < 8; r++) {
		for (var i = 0; i < markers.length; i++) {
			var marker1 = markers[i];
			for (var j = i + 1; j < markers.length; j++) {
				var marker2 = markers[j];
				var y1 = marker1._y + marker1._dy;
				var y2 = marker2._y + marker2._dy;
				if (marker1.labelLeft < marker2.labelRight && marker2.labelLeft < marker1.labelRight &&
					y1 < y2 + height && y2 < y1 + height) {
					if (marker1._y < marker2._y && y1 > y2 || marker1._y > marker2._y && y1 < y2) {
						var dy = marker1._dy;
						marker1._dy = marker2._dy;
						marker2._dy = dy;
						y1 = marker1._y + marker1._dy;
						y2 = marker2._y + marker2._dy;
					}
					var overlap = y1 <= y2 ? y1 + height - y2 : y1 - y2 - height;
					marker1._dy -= overlap / 2;
					marker2._dy += overlap / 2;
				}
			}
		}
	}

	for (var i in markers) {
		var marker = markers[i];
		marker.updatePosition();
	}
}
