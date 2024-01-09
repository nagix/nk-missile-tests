var satellitePoints;
var satellites = [];

var container = document.getElementById('visualization');
var template = document.getElementById('marker_template');

const raycaster = new THREE.Raycaster();
const direction = new THREE.Vector3();

function satelliteLatLonToPoint(latLon) {
	var a = 6378.13706; // radius at equator
	var rad = 100 * (1 + latLon.altitude / a);

	var lon = latLon.longitude - 90;
	var lat = latLon.latitude;
	var phi = Math.PI / 2 - lat * Math.PI / 180;
	var theta = 2 * Math.PI - (lon - 9.9) * Math.PI / 180;

	var point = new THREE.Vector3();
	point.x = Math.sin(phi) * Math.cos(theta) * rad;
	point.y = Math.cos(phi) * rad;
	point.z = Math.sin(phi) * Math.sin(theta) * rad;

	return point;
}

function resetSatellites(year) {
	if (satellitePoints) {
		rotating.remove(satellitePoints);
		satellitePoints = undefined;
	}
	for (var i = 0; i < satellites.length; i++) {
		var satellite = satellites[i];
		if (satellite.line) {
			rotating.remove(satellite.line);
			delete satellite.line;
		}
		if (satellite.leaderLine) {
			scene2d.remove(satellite.leaderLine);
			delete satellite.leaderLine;
		}
		if (satellite.marker) {
			container.removeChild(satellite.marker)
			delete satellite.marker;
		}
	}

	satellites = [];
	for (var i = 0; i < satelliteData.length; i++) {
		var launchYear = +satelliteData[i].launchdate.substr(0, 4);
		var decayYear = satelliteData[i].decaydate ? +satelliteData[i].decaydate.substr(0, 4) : Infinity;
		if (year >= launchYear && year <= decayYear) {
			satellites.push(satelliteData[i]);
		}
	}

	if (satellites.length === 0) {
		return;
	}

	var satelliteGeo = new THREE.BufferGeometry();
	satelliteGeo.addAttribute('position', new THREE.BufferAttribute(new Float32Array(satellites.length * 3), 3));
	var texture = new THREE.TextureLoader().load('images/satellite.png');
	texture.colorSpace = THREE.SRGBColorSpace;
	var satelliteMaterial = new THREE.PointsMaterial( { size: 30, sizeAttenuation: true, map: texture, alphaTest: 0.5, transparent: true } );
	satellitePoints = new THREE.Points( satelliteGeo, satelliteMaterial );
	satellitePoints.frustumCulled = false;
	rotating.add(satellitePoints);

	for (var i = 0; i < satellites.length; i++) {
		var satellite = satellites[i];
		var tle = satellite.tle;
		var hue = (baseHue + 0.5 + (i - (satellites.length - 1) / 2) / (satellites.length + 1)) % 1;
		if (tle) {
			satellite.orb = new Orb.SGP4(tle);
			var line = satellite.line = getSatelliteLine(hue);
			rotating.add(line);
		} else {
			var catno = satellite.catno;
			var xhr = new XMLHttpRequest();
			xhr.open('GET', 'https://celestrak.org/NORAD/elements/gp.php?CATNR=' + catno + '&FORMAT=TLE', true);
			xhr.onreadystatechange = function() {
				if (xhr.readyState === 4 && xhr.status === 200) {
					var lines = xhr.responseText.split('\r\n');
					tle = satellite.tle = { first_line: lines[1], second_line: lines[2]};
					satellite.orb = new Orb.SGP4(tle);
					var line = satellite.line = getSatelliteLine(hue);
					rotating.add(line);
				}
			};
			xhr.send(null);
		}

		var leaderLineGeo = new THREE.BufferGeometry();
		leaderLineGeo.addAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
		var leaderLine = satellite.leaderLine = new THREE.Line(leaderLineGeo, new THREE.LineBasicMaterial({ color: 0xDDDDDD }));
		leaderLine.frustumCulled = false;
		scene2d.add(leaderLine);

		var marker = satellite.marker = template.cloneNode(true);
		var nameLayer = marker.querySelector( '#testText' );
		nameLayer.innerHTML = satellite.name.toUpperCase().replace(' ', '&nbsp;');
		container.appendChild(marker);

		satellite.lastUpdated = 0;
	}
}

function getSatelliteLine(hue) {
	var geometry = new THREE.BufferGeometry();
	geometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(303), 3));
	geometry.addAttribute('color', new THREE.BufferAttribute(new Float32Array(303), 3));

	var color = new THREE.Color().setHSL(hue, 1, 0.66);
	for (var i = 0; i <= 50; i++) {
		var positionArray = geometry.attributes.color.array;
		var factor = Math.min((i + 1) / 5, 1)
		positionArray[i * 3] = positionArray[(100 - i) * 3] = color.r * factor;
		positionArray[i * 3 + 1] = positionArray[(100 - i) * 3 + 1] = color.g * factor;
		positionArray[i * 3 + 2] = positionArray[(100 - i) * 3 + 2] = color.b * factor;
	}
	var line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ vertexColors: true }));
	line.frustumCulled = false;

	return line;
}

function updateSatellites() {
	var now = Date.now();
	var positionArray;

	for (var i = 0; i < satellites.length; i++) {
		var satellite = satellites[i];
		var orb = satellite.orb;

		if (!orb) {
			continue;
		}

		var latlng = orb.latlng(new Date(now));
		var point = satelliteLatLonToPoint(latlng);

		positionArray = satellitePoints.geometry.attributes.position.array;
		positionArray[i * 3] = point.x;
		positionArray[i * 3 + 1] = point.y;
		positionArray[i * 3 + 2] = point.z;
		satellitePoints.geometry.attributes.position.needsUpdate = true;

		if (satellite.lastUpdated <= now - 60000) {
			positionArray = satellite.line.geometry.attributes.position.array;
			for (var j = 0; j <= 100; j++) {
				latlng = orb.latlng(new Date(now + (j - 50) * 120000));
				var p = satelliteLatLonToPoint(latlng);
				positionArray[j * 3] = p.x;
				positionArray[j * 3 + 1] = p.y;
				positionArray[j * 3 + 2] = p.z;
			}
			satellite.line.geometry.attributes.position.needsUpdate = true;
			satellite.lastUpdated = now;
		}

		var leaderLine = satellite.leaderLine;
		var abspos = point.clone().applyMatrix4(rotating.matrixWorld);
		var screenPos = screenXY(abspos);

		positionArray = leaderLine.geometry.attributes.position.array;
		positionArray[0] = screenPos.x;
		positionArray[1] = screenPos.y;
		positionArray[3] = screenPos.x + 48;
		positionArray[4] = screenPos.y;
		leaderLine.geometry.attributes.position.needsUpdate = true;

		var marker = satellite.marker;
		var s = camera.zoom * 3 + 5;

	//	if (!this.selected) {
			marker.style.fontSize = s + 'pt';
	//	}

	//	this.setVisible((new THREE.Vector3()).subVectors(camera.position, abspos).dot(abspos) > 0);

		var zIndex = Math.floor( 1000 + abspos.z );
	//	if( this.selected )
	//		zIndex = 10000;

		marker.style.left = screenPos.x + 48 + 'px';
		marker.style.top = screenPos.y - (camera.zoom * 2 + 4) + 'px';
		marker.style.zIndex = zIndex;

		if ((new THREE.Vector3()).subVectors(camera.position, abspos).dot(abspos) > 0) {
			marker.style.display = 'inline';
			leaderLine.visible = true;
		} else {
			direction.copy(abspos).sub(camera.position).normalize();
			raycaster.set(camera.position, direction);
			var intersects = raycaster.intersectObject(sphere, false);
			if (intersects.length > 0) {
				marker.style.display = 'none';
				leaderLine.visible = false;
			} else {
				marker.style.display = 'inline';
				leaderLine.visible = true;
			}
		}
	}
}
