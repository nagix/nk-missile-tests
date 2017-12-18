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

	var datetime = test.date
	if (test.time !== 'unknown') {
		datetime += "&nbsp;" + test.time;
	}

	var missile = missileLookup[test.missile];
	var facilityName = facilityData[test.facility].name;
	var apogee = test.apogee === 'unknown' ? dict['unknown'] : (test.apogee === 'na' ? dict['na'] : test.apogee + 'km');
	var distance = test.distance === 'unknown' ? dict['unknown'] : (test.distance === 'na' ? dict['na'] : test.distance + 'km');

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

		if (!this.selected) {
			this.setSize(s);
		}

		this.setVisible((new THREE.Vector3()).subVectors(camera.position, abspos).dot(abspos) > 0);

		var zIndex = Math.floor( 1000 + abspos.z );
		if( this.selected )
			zIndex = 10000;

		this.setPosition( screenPos.x, screenPos.y, zIndex );
	};

	var nameLayer = marker.querySelector( '#testText' );

	nameLayer.innerHTML = testName.replace(' ','&nbsp;');

	var detailText = '';
	detailText += '<span class="key">' + dict['date'] + ':</span>&nbsp;' + datetime + '&nbsp;&nbsp;' +
		'<span class="key">' + dict['test-outcome'] + ':</span>&nbsp;' + dict[test.outcome] + '<br />' +
		'<span class="key">' + dict['missile-name'] + ':</span>&nbsp;' + missile.name + '&nbsp;&nbsp;' +
		'<span class="key">' + dict['missile-type'] + ':</span>&nbsp;' + missile.type + '<br />' +
		'<span class="key">' + dict['facility-name'] + ':</span>&nbsp;' + facilityName + '<br />' +
		'<span class="key">' + dict['landing-location'] + ':</span>&nbsp;' + dict[test.landingLocation.name] + '<br />' +
		'<span class="key">' + dict['apogee'] + ':</span>&nbsp;' + apogee + '&nbsp;&nbsp;' +
		'<span class="key">' + dict['distance-travelled'] + ':</span>&nbsp;' + distance;
	marker.detailText = detailText;

	var descriptionText = '<span class="key">' + dict['description'] + ':</span>&nbsp;' + test.description;
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
		detailLayer.style.display = 'block';
		descriptionLayer.innerHTML = descriptionText;
		descriptionLayer.style.display = 'block';
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
		marker.jquery.find('.close').on('click', markerSelect);
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
