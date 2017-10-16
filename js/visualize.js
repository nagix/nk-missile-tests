function landingLatLon(lat, lon, bearing, distance) {
	var a = 6378137.06; // radius at equator

	var phi1 = lat * Math.PI / 180;
	var L1 = lon * Math.PI / 180;
	var alpha1 = bearing * Math.PI / 180;
	var delta = distance * 1000 / a;

	var phi2 = Math.asin(Math.sin(phi1) * Math.cos(delta) +
		Math.cos(phi1) * Math.sin(delta) * Math.cos(alpha1));
	var dL = Math.atan2(Math.sin(alpha1) * Math.sin(delta) * Math.cos(phi1),
		Math.cos(delta) - Math.sin(phi1) * Math.sin(phi2));
	var L2 = (L1 + dL + 3 * Math.PI) % (2 * Math.PI) - Math.PI;

	return {'lat': phi2 * 180 / Math.PI, 'lon': L2 * 180 / Math.PI};
}

// For best precision
function vincenty(lat, lon, bearing, distance) {
	var a = 6378137.06; // radius at equator
	var f = 1/298.257223563; // flattening of the ellipsoid
	var b = (1 - f) * a; // radius at the poles

	var phi1 = lat * Math.PI / 180;
	var L1 = lon * Math.PI / 180;
	var alpha1 = bearing * Math.PI / 180;
	var s = distance * 1000; // in meters

	var sinAlpha1 = Math.sin(alpha1);
	var cosAlpha1 = Math.cos(alpha1);

	var tanU1 = (1 - f) * Math.tan(phi1);
	var cosU1 = 1 / Math.sqrt((1 + tanU1 * tanU1));
	var sinU1 = tanU1 * cosU1;

	var sigma1 = Math.atan2(tanU1, cosAlpha1);
	var sinAlpha = cosU1 * sinAlpha1;
	var sinSqAlpha = sinAlpha * sinAlpha;
	var cosSqAlpha = 1 - sinSqAlpha;
	var uSq = cosSqAlpha * (a * a - b * b) / (b * b);
	var A = 1 + uSq / 16384 * (4096 + uSq * (-768 + uSq * (320 - 175 * uSq)));
	var B = uSq / 1024 * (256 + uSq * (-128 + uSq * (74 - 47 * uSq)));

	var sigma = s / (b * A), sigma0;
	do {
		var cos2SigmaM = Math.cos(2 * sigma1 + sigma);
		var cosSq2SigmaM = cos2SigmaM * cos2SigmaM;
		var sinSigma = Math.sin(sigma);
		var cosSigma = Math.cos(sigma);
		var dSigma = B * sinSigma * ( cos2SigmaM + B / 4 * (cosSigma * (-1 + 2 * cosSq2SigmaM) -
			B / 6 * cos2SigmaM * (-3 + 4 * sinSigma * sinSigma) * (-3 + 4 * cosSq2SigmaM)));
		sigma0 = sigma;
		sigma = s / (b * A) + dSigma;
	} while (Math.abs(sigma0 - sigma) > 1e-12);

	var tmp = sinU1 * sinSigma - cosU1 * cosSigma * cosAlpha1;
	var phi2 = Math.atan2(
		sinU1 * cosSigma + cosU1 * sinSigma * cosAlpha1,
		(1 - f) * Math.sqrt(sinSqAlpha + tmp * tmp)
	);
	var lamda = Math.atan2(
		sinSigma * sinAlpha1,
		cosU1 * cosSigma - sinU1 * sinSigma * cosAlpha1
	);
	var C = f / 16 * cosSqAlpha * (4 + f * (4 - 3 * cosSqAlpha));
	var L = lamda - (1 - C) * f * sinAlpha * (sigma + C * sinSigma * (
		cosSq2SigmaM + C * cosSigma * (-1 + 2 * cosSq2SigmaM )
	));
	var L2 = L + L1;

	return {'lat': phi2 * 180 / Math.PI, 'lon': L2 * 180 / Math.PI};
}

function buildDataVizGeometries( linearData ){

	var sphereRad = 1;
	var rad = 100;
	var loadLayer = document.getElementById('loading');

	for( var i in linearData ){
		var yearBin = linearData[i].data;

		var year = linearData[i].t;
		selectableYears.push(year);

		var count = 0;
		console.log('Building data for ...' + year);
		for( var s in yearBin ){
			var set = yearBin[s];

			var seriesPostfix = set.series ? ' [' + set.series + ']' : '';
			set.testName = (set.date + ' ' + missileLookup[set.missile].name + seriesPostfix).toUpperCase();

			var facilityName = set.facility;
			facility = facilityData[facilityName];

			//	we couldn't find the facility, it wasn't in our list...
			if( facility === undefined )
				continue;

			var distance = set.distance;
			if (isNaN(distance)) {
				distance = 0;
			}

			var apogee = set.apogee;
			if (apogee === 'unknown' && distance > 0) {
				// minimum energy trajectory
				apogee = -0.000013 * distance * distance + 0.26 * distance;
			}
			if (isNaN(apogee)) {
				apogee = 0;
			}

			var landing = landingLatLon(facility.lat, facility.lon, set.bearing, distance);
			var lon = landing.lon - 90;
			var lat = landing.lat;
			var phi = Math.PI/2 - lat * Math.PI / 180;
			var theta = 2 * Math.PI - (lon - 9.9) * Math.PI / 180;

			var lcenter = new THREE.Vector3();
			lcenter.x = Math.sin(phi) * Math.cos(theta) * rad;
			lcenter.y = Math.cos(phi) * rad;
			lcenter.z = Math.sin(phi) * Math.sin(theta) * rad;

			set.landingLocation = {
				name: set.landing,
				lat: landing.lat,
				lon: landing.lon,
				center: lcenter
			};

			if (distance == 0) {
				set.markerOnLeft = true;
			}

			//	visualize this event
			set.lineGeometry = makeConnectionLineGeometry( facility, set.landingLocation, apogee );

			testData[set.testName] = set;

		}

	}

	loadLayer.style.display = 'none';
}

function getVisualizedMesh( linearData, year, outcomeCategories, missileCategories ){
	//	pick out the year first from the data
	for (var indexFromYear = 0; indexFromYear < selectableYears.length - 1; indexFromYear++) {
		if (selectableYears[indexFromYear] == year) {
			break;
		}
	}

	var affectedTest = [];

	var bin = linearData[indexFromYear].data;

	var linesGeo = new THREE.Geometry();
	var lineColors = [];

	var particlesGeo = new THREE.BufferGeometry();
	var particlePositions = [];
	var particleSizes = [];
	var particleColors = [];

	particlesGeo.vertices = [];

	//	go through the data from year, and find all relevant geometries
	for( i in bin ){
		var set = bin[i];

		var relevantOutcomeCategory = $.inArray(set.outcome, outcomeCategories) >= 0;
		var relevantMissileCategory = $.inArray(set.missile, missileCategories) >= 0;

		if( relevantOutcomeCategory && relevantMissileCategory ){
			//	we may not have line geometry... (?)
			if( set.lineGeometry === undefined )
				continue;

			var lineColor = new THREE.Color(missileColors[set.missile]);

			var lastColor;
			//	grab the colors from the vertices
			for( s in set.lineGeometry.vertices ){
				var v = set.lineGeometry.vertices[s];
				lineColors.push(lineColor);
				lastColor = lineColor;
			}

			//	merge it all together
			linesGeo.merge(set.lineGeometry);

			var particleColor = lastColor.clone();
			var points = set.lineGeometry.vertices;
			var particleCount = 1;
			var particleSize = set.lineGeometry.size * dpr;
			if (set === selectedTest) {
				particleCount *= 4;
				particleSize *= 2;
			}
			for( var rIndex=0; rIndex<points.length-1; rIndex++ ){
				for ( var s=0; s < particleCount; s++ ) {
					var point = points[rIndex];
					var particle = point.clone();
					particle.moveIndex = rIndex;
					particle.nextIndex = rIndex+1;
					if(particle.nextIndex >= points.length )
						particle.nextIndex = 0;
					particle.lerpN = 0;
					particle.path = points;
					particlesGeo.vertices.push( particle );
					particle.size = particleSize;

					particlePositions.push( particle.x, particle.y, particle.z );
					particleSizes.push( particleSize );
					particleColors.push( particleColor.r, particleColor.g, particleColor.b );
				}
			}

			affectedTest.push(set.testName);

			if( set.outcome === 'success' ){
				summary.success[set.missile]++;
				summary.success.total++;
			}
			else if( set.outcome === 'failure' ){
				summary.failure[set.missile]++;
				summary.failure.total++;
			}
			else {
				summary.unknown[set.missile]++;
				summary.unknown.total++;
			}

			summary.total++;

		}
	}

	// console.log(selectedTest);

	linesGeo.colors = lineColors;

	//	make a final mesh out of this composite
	var splineOutline = new THREE.Line( linesGeo, new THREE.LineBasicMaterial(
		{ 	color: 0xffffff, opacity: 1.0, blending:
			THREE.AdditiveBlending, transparent:true,
			depthWrite: false, vertexColors: true,
			linewidth: 1 } )
	);


	particlesGeo.addAttribute('position', new THREE.BufferAttribute(new Float32Array(particlePositions), 3));
	particlesGeo.addAttribute('size', new THREE.BufferAttribute(new Float32Array(particleSizes), 1));
	particlesGeo.addAttribute('customColor', new THREE.BufferAttribute(new Float32Array(particleColors), 3));

	uniforms = {
		amplitude: { type: "f", value: 1.0 },
		color:     { type: "c", value: new THREE.Color( 0xffffff ) },
		texture:   { type: "t", value: new THREE.TextureLoader().load( "images/particleA.png" ) },
	};

	var shaderMaterial = new THREE.ShaderMaterial( {

		uniforms:		uniforms,
		vertexShader:	document.getElementById( 'vertexshader' ).textContent,
		fragmentShader:	document.getElementById( 'fragmentshader' ).textContent,

		blending:		THREE.AdditiveBlending,
		depthTest:		true,
		depthWrite:		false,
		transparent:	true,
		// sizeAttenuation: true,
	});



	var pSystem = new THREE.Points( particlesGeo, shaderMaterial );
	pSystem.dynamic = true;
	splineOutline.add( pSystem );

	pSystem.update = function(){
		// var time = Date.now();
		var positionArray = this.geometry.attributes.position.array;
		var index = 0;
		for( var i in this.geometry.vertices ){
			var particle = this.geometry.vertices[i];
			var path = particle.path;
			var moveLength = path.length;

			particle.lerpN += 0.05;
			if(particle.lerpN > 1){
				particle.lerpN = 0;
				particle.moveIndex = particle.nextIndex;
				particle.nextIndex++;
				if( particle.nextIndex >= path.length ){
					particle.moveIndex = 0;
					particle.nextIndex = 1;
				}
			}

			var currentPoint = path[particle.moveIndex];
			var nextPoint = path[particle.nextIndex];


			particle.copy( currentPoint );
			particle.lerp( nextPoint, particle.lerpN );

			positionArray[index++] = particle.x;
			positionArray[index++] = particle.y;
			positionArray[index++] = particle.z;
		}
		this.geometry.attributes.position.needsUpdate = true;
	};

	//	return this info as part of the mesh package, we'll use this in selectvisualization
	splineOutline.affectedTests = affectedTest;


	return splineOutline;
}

function selectVisualization( linearData, year, tests, outcomeCategories, missileCategories ){
	//	we're only doing one test for now so...
	var cName = tests[0].toUpperCase();

	$("#hudButtons .testTextInput").val(cName);
	previouslySelectedTest = selectedTest;
	selectedTest = testData[tests[0].toUpperCase()];

	summary = {
		success: {
			total: 0
		},
		failure: {
			total: 0
		},
		unknown: {
			total: 0
		},
		total: 0,
		max: 0,
		historical: getHistoricalData()
	};
	for( var i in missileLookup ){
		summary.success[i] = 0;
		summary.failure[i] = 0;
		summary.unknown[i] = 0;
	}

	// console.log(selectedTest);

	//	clear markers
	for( var i in selectableTests ){
		removeMarkerFromTest( selectableTests[i] );
	}

	//	clear children
	while( visualizationMesh.children.length > 0 ){
		var c = visualizationMesh.children[0];
		visualizationMesh.remove(c);
	}

	//	build the mesh
	console.time('getVisualizedMesh');
	var mesh = getVisualizedMesh( timeBins, year, outcomeCategories, missileCategories );
	console.timeEnd('getVisualizedMesh');

	//	add it to scene graph
	visualizationMesh.add( mesh );

	for( var i in mesh.affectedTests ){
		var testName = mesh.affectedTests[i];
		var test = testData[testName];
		attachMarkerToTest( testName );
	}

	if( previouslySelectedTest !== selectedTest ){
		if( selectedTest ){
			var facility = facilityData[selectedTest.facility];
			var landing = selectedTest.landingLocation;

			rotateTargetX = (facility.lat + landing.lat) / 2 * Math.PI / 180;
			var targetY0 = -((facility.lon + landing.lon) / 2 - 9.9) * Math.PI / 180;
			var piCounter = 0;
			while(true) {
				var targetY0Neg = targetY0 - Math.PI * 2 * piCounter;
				var targetY0Pos = targetY0 + Math.PI * 2 * piCounter;
				if(Math.abs(targetY0Neg - rotating.rotation.y) < Math.PI) {
					rotateTargetY = targetY0Neg;
					break;
				} else if(Math.abs(targetY0Pos - rotating.rotation.y) < Math.PI) {
					rotateTargetY = targetY0Pos;
					break;
				}
				piCounter++;
				rotateTargetY = wrap(targetY0, -Math.PI, Math.PI);
			}
			// console.log(rotateTargetY);
			//lines commented below source of rotation error
			//is there a more reliable way to ensure we don't rotate around the globe too much?
			/*
			if( Math.abs(rotateTargetY - rotating.rotation.y) > Math.PI )
				rotateTargetY += Math.PI;
			*/
			rotateVX *= 0.6;
			rotateVY *= 0.6;

			scaleTarget = 90 / (landing.center.clone().sub(facility.center).length() + 30);
		}
	}

	d3Graphs.initGraphs();
}
