var globeRadius = 100;
var vec3_origin = new THREE.Vector3(0,0,0);

function makeConnectionLineGeometry( facility, landing, apogee ){
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

	var distanceOneThird = distance * 0.33;
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
	var vertexCountDesired = Math.floor( (distance + midHeight) * 0.3 + 3 );

	//	collect the vertices
	var points = splineCurveA.getPoints( vertexCountDesired );

	//	remove the very last point since it will be duplicated on the next half of the curve
	points = points.splice(0,points.length-1);

	points = points.concat( splineCurveB.getPoints( vertexCountDesired ) );

	//	add one final point to the center of the earth
	//	we need this for drawing multiple arcs, but piled into one geometry buffer
	points.push( vec3_origin );

	//	create a line geometry out of these
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
