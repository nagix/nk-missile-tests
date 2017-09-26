function loadGeoData( latlonData ){
	//	-----------------------------------------------------------------------------
	//	Load the world geo data json, per facility

	var sphereRad = 1;
	var rad = 100;

	//	iterate through each set of facility pins
	for ( var i in latlonData.facilities ) {
		var facility = latlonData.facilities[i];

		//	save out facility name info
		facility.code = i;

		//	take the lat lon from the data and convert this to 3d globe space
		var lon = facility.lon - 90;
		var lat = facility.lat;

		var phi = Math.PI/2 - lat * Math.PI / 180;
		var theta = 2 * Math.PI - lon * Math.PI / 180 + Math.PI * 0.055;

		var center = new THREE.Vector3();
		center.x = Math.sin(phi) * Math.cos(theta) * rad;
		center.y = Math.cos(phi) * rad;
		center.z = Math.sin(phi) * Math.sin(theta) * rad;

		//	save and catalogue
		facility.center = center;
		facilityData[i] = facility;
	}

	// console.log(facilityData);
}

//	convenience function to get the facility object by name
function getFacility(name){
	return facilityData[name];
}
