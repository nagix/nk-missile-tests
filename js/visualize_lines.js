var globeRadius = 100;
var vec3_origin = new THREE.Vector3(0,0,0);

function makeBallisticCurveGeometry( facility, landing, apogee ){
	if( facility.center === undefined || landing.center == undefined )
		return undefined;

	var distance = landing.center.clone().sub(facility.center).length();

	//	how high we want to shoot the curve upwards
	var midHeight = globeRadius * apogee / 6378.137;
	var midLength = globeRadius + midHeight;
//	var anchorHeight = globeRadius * apogee / 6378.137 * 0.6666;
//	var anchorLength = globeRadius + anchorHeight;

	//	start of the line
	var start = facility.center;

	//	end of the line
	var end = landing.center;

	//	midpoint for the curve
	var mid = start.clone().lerp(end,0.5);
	mid.normalize();
	mid.multiplyScalar( midLength );

	//	the normal from start to end
	var normal = (new THREE.Vector3()).subVectors(start, end);
	normal.normalize();

	/*
				The curve looks like this:

				midStartAnchor---- mid ----- midEndAnchor
			  /											  \
			 /											   \
			/												\
	start/anchor 										 end/anchor

		splineCurveA							splineCurveB
	*/

	var distanceOneThird = distance * 0.333;
//	var distanceOneSixth = distance * 0.1666;

	var startAnchor = start;
	var midStartAnchor = mid.clone().add( normal.clone().multiplyScalar( distanceOneThird ) );
	var midEndAnchor = mid.clone().add( normal.clone().multiplyScalar( -distanceOneThird ) );
	var endAnchor = end;
//	var startAnchor = start.clone().lerp(end,0.1666).normalize().multiplyScalar(anchorLength);
//	var midStartAnchor = mid.clone().add( normal.clone().multiplyScalar( distanceOneSixth ) );
//	var midEndAnchor = mid.clone().add( normal.clone().multiplyScalar( -distanceOneSixth ) );
//	var endAnchor = start.clone().lerp(end,0.8333).normalize().multiplyScalar(anchorLength);

	//	now make a bezier curve out of the above like so in the diagram
	var splineCurveA = new THREE.CubicBezierCurve3( start, startAnchor, midStartAnchor, mid);
	// splineCurveA.updateArcLengths();

	var splineCurveB = new THREE.CubicBezierCurve3( mid, midEndAnchor, endAnchor, end);
	// splineCurveB.updateArcLengths();

	//	how many vertices do we want on this guy? this is for *each* side
	var vertexCountDesired = (distance + midHeight) * 2.4 + 24;

	//	collect the vertices
	var points = splineCurveA.getPoints( Math.floor( vertexCountDesired * 0.5 ) );

	//	remove the very last point since it will be duplicated on the next half of the curve
	points = points.splice(0,points.length-1);

	points = points.concat( splineCurveB.getPoints( Math.floor( vertexCountDesired * 0.5 ) ) );

	//	add one final point to the center of the earth
	//	we need this for drawing multiple arcs, but piled into one geometry buffer
	points.push( vec3_origin );

	//	create a line geometry out of these
	var curveGeometry = createLineGeometry( points );

	curveGeometry.size = 15;

	return curveGeometry;
}

function makePullupCurveGeometry( facility, landing, apogee ){
	if( facility.center === undefined || landing.center == undefined )
		return undefined;

	var distance = landing.center.clone().sub(facility.center).length();

	var topHeight = globeRadius * apogee / 6378.137;
	var topLength = globeRadius + topHeight;
	var bottomHeight = globeRadius * Math.min(apogee, 20) / 6378.137;
	var bottomLength = globeRadius + bottomHeight;
	var pullupHeight = globeRadius * Math.min(apogee, 40) / 6378.137;
	var pullupLength = globeRadius + pullupHeight;

	var start = facility.center;
	var end = landing.center;

	var p1 = start.clone().lerp(end, 0.4);
	p1.normalize();
	p1.multiplyScalar( topLength );
	var p2 = start.clone().lerp(end, 0.8);
	p2.normalize();
	p2.multiplyScalar( bottomLength );
	var p3 = start.clone().lerp(end, 0.9333);
	p3.normalize();
	p3.multiplyScalar( pullupLength );

	var normal = (new THREE.Vector3()).subVectors(start, end);
	normal.normalize();

	var distanceFourFifteen = distance * 0.2666;
	var distanceOneFifteen = distance * 0.0666;

	var startAnchor = start;
	var p1StartAnchor = p1.clone().add( normal.clone().multiplyScalar( distanceFourFifteen ) );
	var p1p2Anchor = p1.clone().add( normal.clone().multiplyScalar( -distanceFourFifteen ) );
	var p2p1Anchor = p2.clone().add( normal.clone().multiplyScalar( distanceOneFifteen ) );
	var p2p3Anchor = p2.clone().add( normal.clone().multiplyScalar( -distanceOneFifteen ) );
	var p3p2Anchor = p3.clone().add( normal.clone().multiplyScalar( distanceOneFifteen ) );
	var p3EndAnchor = p3.clone().add( normal.clone().multiplyScalar( -distanceOneFifteen ) );
	var endAnchor = end;

	var splineCurveA = new THREE.CubicBezierCurve3( start, startAnchor, p1StartAnchor, p1);
	var splineCurveB = new THREE.CubicBezierCurve3( p1, p1p2Anchor, p2p1Anchor, p2);
	var splineCurveC = new THREE.CubicBezierCurve3( p2, p2p3Anchor, p3p2Anchor, p3);
	var splineCurveD = new THREE.CubicBezierCurve3( p3, p3EndAnchor, endAnchor, end);

	var vertexCountDesired = (distance + topHeight) * 2.4 + 24;

	var pointsA = splineCurveA.getSpacedPoints( Math.ceil( vertexCountDesired * 0.4 ) );
	pointsA = pointsA.splice(0, pointsA.length - 1);
	var pointsB = splineCurveB.getSpacedPoints( Math.ceil( vertexCountDesired * 0.4 ) );
	pointsB = pointsB.splice(0, pointsB.length - 1);
	var pointsC = splineCurveC.getSpacedPoints( Math.ceil( vertexCountDesired * 0.1333 ) );
	pointsC = pointsC.splice(0, pointsC.length - 1);
	var pointsD = splineCurveD.getSpacedPoints( Math.ceil( vertexCountDesired * 0.0666 ) );

	var points = pointsA.concat( pointsB, pointsC, pointsD );

	points.push( vec3_origin );

	var curveGeometry = createLineGeometry( points );

	curveGeometry.size = 15;

	return curveGeometry;
}

function constrain(v, min, max){
	if( v < min )
		v = min;
	else
	if( v > max )
		v = max;
	return v;
}
