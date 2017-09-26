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
	if( testName === selectedTest.testName.toUpperCase() )
		marker.selected = true;

	marker.setPosition = function(x,y,z){
		this.style.left = x - (this.onLeft ? this.jquery.outerWidth(true) : 0) + 'px';
		this.style.top = y + 'px';
		this.style.zIndex = z;
		if (x < window.innerWidth / 2) {

		}
	}

	marker.setVisible = function( vis ){
		if( ! vis )
			this.style.display = 'none';
		else{
			this.style.display = 'inline';
		}
	}
	var testLayer = marker.querySelector( '#testText');
	marker.testLayer = testLayer;
	var detailLayer = marker.querySelector( '#detailText' );
	marker.detailLayer = detailLayer;
	var descriptionLayer = marker.querySelector( '#descriptionText' );
	marker.descriptionLayer = descriptionLayer;
	marker.jquery = $(marker);
	marker.setSize = function( s ){
		this.style.fontSize = s + 'pt';
		if(s < 20) {
			this.style.padding = "0px";
		} else {
			this.style.padding = "10px";
		}
		this.style.marginTop = (- s * 0.7 - (s == 20 ? 13 : 0)) + 'px';
		this.style.marginLeft = (1 + s * 0.35) + 'px';
		this.style.marginRight = (1 + s * 0.35) + 'px';
	}

	marker.update = function(){
		var matrix = rotating.matrixWorld;
		var abspos = test.landingLocation.center.clone().applyMatrix4(matrix);
		var screenPos = screenXY(abspos);

		var s = camera.scale.z * 3 + 5;

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
	}

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
		this.hover = true;
	}

	var markerOut = function(e){
		this.style.color = '#FFFFFF';
		this.hover = false;
	}

	if( marker.selected ) {
		marker.style.backgroundColor = 'rgba(0,0,0,.66)';
		marker.style.borderSpacing = '3px';
		detailLayer.innerHTML = detailText;
		descriptionLayer.innerHTML = descriptionText;
	}
	else{
		marker.style.backgroundColor = 'transparent';
		marker.style.borderSpacing = '0px';
		marker.addEventListener( 'mouseover', markerOver, false );
		marker.addEventListener( 'mouseout', markerOut, false );
	}


	var markerSelect = function(e){
		var selection = selectionData;
		selectVisualization( timeBins, selection.selectedYear, [this.testName], selection.getOutcomeCategories(), selection.getMissileCategories() );
	};
	marker.addEventListener('click', markerSelect, true);

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
	container.removeChild( test.marker );
	test.marker = undefined;
}
