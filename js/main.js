var masterContainer = document.getElementById('visualization');

var overlay = document.getElementById('visualization');

var mapIndexedImage;
var mapOutlineImage;

//	where in html to hold all our things
var glContainer = document.getElementById( 'glContainer' );
var dpr = window.devicePixelRatio ? window.devicePixelRatio : 1;

//	contains a list of facility codes with their matching facility names
var latlonFile = 'data/facility_lat_lon.json';
var missileFile = 'data/missile.json';

var camera, scene, renderer, controls;

var pinsBase, pinsBaseMat;
var lookupCanvas
var lookupTexture;
var sphere;
var rotating;	
var visualizationMesh;							

var mapUniforms;

//	contains the data loaded from the test data file
//	contains a list of years, followed by tests within that year
var timeBins;

//	contains latlon data for each facility
var latlonData;			    

//	contains above but organized as a mapped list via ['facilityname'] = facilityobject
//	each facility object has data like center of facility in 3d space, lat lon and facility name
var facilityData = new Object();		
var testData = new Object();

//	contains a list of missile code to missile name for running lookups
var missileLookup;		    

var selectableYears = [];		    
var selectableTests = [];			    
var summary;

//	a list of outcome 'codes'
//	now they are just strings of categories
//	Outcome Came : Outcome Node
var outcomeLookup = {
	'success': 'Success',
	'failure': 'Failure',
	'unknown': 'Unknown'
};  	

//	A list of missile colors
var missileColors = {
	'er-scud' : 0x1A62A5,
	'hwasong-12' : 0x6C6C6C,
	'hwasong-14' : 0xAEB21A,
	'kn-02': 0xB68982,
	'musudan': 0x9FBAE3,
	'nodong': 0xFD690F,
	'polaris-1': 0xFEAE65,
	'polaris-2': 0xDA5CB6,
	'scud-b': 0x279221,
	'scud-c': 0x89DC78,
	'scud-c-marv': 0xBBBBBB,
	'taepodong-1': 0xCA0F1E,
	'unha': 0x814EAF,
	'unha-3': 0xB89FCB,
	'unknown': 0x78433B
};

//	the currently selected test
var selectedTest = null;
var previouslySelectedTest = null;

//	contains info about what year, what tests, outcomes, missiles, etc that's being visualized
var selectionData;

//	when the app is idle this will be true
var idle = false;

//	for svg loading
//	deprecated, not using svg loading anymore
var assetList = [];

//	TODO
//	use underscore and ".after" to load these in order
//	don't look at me I'm ugly
function start( e ){	
	//	detect for webgl and reject everything else
	if ( ! Detector.webgl ) {
		Detector.addGetWebGLMessage();
	}
	else{
		//	ensure the map images are loaded first!!
		mapOutlineImage = new Image();
		mapOutlineImage.src = 'images/map_outline.png';
		mapOutlineImage.onload = function(){
			loadWorldPins(
				function(){										
					loadMissileData(
						function(){
							loadContentData(								
								function(){																	
									initScene();
									animate();		
								}
							);														
						}
					);
				}
			);
		};			
	};
}			



var Selection = function(){
	this.selectedYear = '2010';
	this.selectedTest = '2017-08-28 HWASONG-12';

	this.outcomeCategories = new Object();
	for( var i in outcomeLookup ){
		this.outcomeCategories[i] = true;
	}				
	this.missileCategories = new Object();
	for( var i in missileLookup ){
		this.missileCategories[i] = true;
	}

	this.getOutcomeCategories = function(){
		var list = [];
		for( var i in this.outcomeCategories ){
			if( this.outcomeCategories[i] )
				list.push(i);
		}
		return list;
	}

	this.getMissileCategories = function(){
		var list = [];
		for( var i in this.missileCategories ){
			if( this.missileCategories[i] )
				list.push(i);
		}
		return list;
	}

};

//	-----------------------------------------------------------------------------
//	All the initialization stuff for THREE
function initScene() {

	//	-----------------------------------------------------------------------------
    //	Let's make a scene		
	scene = new THREE.Scene();
	scene.matrixAutoUpdate = false;		
	// scene.fog = new THREE.FogExp2( 0xBBBBBB, 0.00003 );		        		       

	scene.add( new THREE.AmbientLight( 0x505050 ) );				

	light1 = new THREE.SpotLight( 0xeeeeee, 3 );
	light1.position.x = 730; 
	light1.position.y = 520;
	light1.position.z = 626;
	light1.castShadow = true;
	scene.add( light1 );

	light2 = new THREE.PointLight( 0x222222, 14.8 );
	light2.position.x = -640;
	light2.position.y = -500;
	light2.position.z = -1000;
	scene.add( light2 );				

	rotating = new THREE.Object3D();
	scene.add(rotating);

	var outlinedMapTexture = new THREE.Texture( mapOutlineImage );
	outlinedMapTexture.needsUpdate = true;
	// outlinedMapTexture.magFilter = THREE.NearestFilter;
	// outlinedMapTexture.minFilter = THREE.NearestFilter;

	var mapMaterial = new THREE.MeshBasicMaterial();
	mapMaterial.map = outlinedMapTexture;


    //	-----------------------------------------------------------------------------
	sphere = new THREE.Mesh( new THREE.SphereGeometry( 100, 40, 40 ), mapMaterial );				
	sphere.doubleSided = false;
	sphere.rotation.x = Math.PI;				
	sphere.rotation.y = -Math.PI/2;
	sphere.rotation.z = Math.PI;
	sphere.id = "base";	
	rotating.add( sphere );	


  var ringMaterial = new THREE.LineBasicMaterial({ color: Math.random()*0xffffff, linewidth: 0.5 });
  for (var i = 0; i < 40; i++) {
    var ringGeo = new THREE.Geometry();
    for (var j = 0; j <= 40; j++) {
      var x = Math.sin(Math.PI*j/20)*Math.cos(Math.PI*i/20)*100.4;
      var y = Math.cos(Math.PI*j/20)*100.4;
      var z = Math.sin(Math.PI*j/20)*Math.sin(Math.PI*i/20)*100.4;
      ringGeo.vertices.push(new THREE.Vector3(x, y, z));
    }
    var line = new THREE.Line(ringGeo, ringMaterial);
    rotating.add(line);
  }
  for (var i = 1; i < 40; i++) {
    var ringGeo = new THREE.Geometry();
    for (var j = 0; j <= 40; j++) {
      var x = Math.sin(Math.PI*j/20)*Math.sin(Math.PI*i/40)*100.4;
      var y = Math.cos(Math.PI*i/40)*100.4;
      var z = Math.cos(Math.PI*j/20)*Math.sin(Math.PI*i/40)*100.4;
      ringGeo.vertices.push(new THREE.Vector3(x, y, z));
    }
    var line = new THREE.Line(ringGeo, ringMaterial);
    rotating.add(line);
  }

	for( var i in timeBins ){					
		var bin = timeBins[i].data;
		for( var s in bin ){
			var set = bin[s];

			var seriesPostfix = set.series ? ' [' + set.series + ']' : '';
			var testName = (set.date + ' ' + missileLookup[set.missile].name + seriesPostfix).toUpperCase();

			selectableTests.push( testName );
		}
	}

	console.log( selectableTests );
	
	// load geo data (facility lat lons in this case)
	console.time('loadGeoData');
	loadGeoData( latlonData );				
	console.timeEnd('loadGeoData');				

	console.time('buildDataVizGeometries');
	var vizilines = buildDataVizGeometries(timeBins);
	console.timeEnd('buildDataVizGeometries');

	visualizationMesh = new THREE.Object3D();
	rotating.add(visualizationMesh);	

	selectionData = new Selection();

	selectVisualization( timeBins, '2017', ['2017-08-28 HWASONG-12'], Object.keys(outcomeLookup), Object.keys(missileLookup) );					


    //	-----------------------------------------------------------------------------
    //	Setup our renderer
	renderer = new THREE.WebGLRenderer({antialias:false});
	renderer.setPixelRatio(dpr);
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.autoClear = false;
	
	renderer.sortObjects = false;		
	renderer.generateMipmaps = false;					

	glContainer.appendChild( renderer.domElement );									


    //	-----------------------------------------------------------------------------
    //	Event listeners
	document.addEventListener( 'mousemove', onDocumentMouseMove, true );
	document.addEventListener( 'windowResize', onDocumentResize, false );

	//masterContainer.addEventListener( 'mousedown', onDocumentMouseDown, true );	
	//masterContainer.addEventListener( 'mouseup', onDocumentMouseUp, false );	
	document.addEventListener( 'mousedown', onDocumentMouseDown, true );	
	document.addEventListener( 'mouseup', onDocumentMouseUp, false );	
	
	masterContainer.addEventListener( 'click', onClick, true );	
	masterContainer.addEventListener( 'mousewheel', onMouseWheel, false );
	
	//	firefox	
	masterContainer.addEventListener( 'DOMMouseScroll', function(e){
		    var evt=window.event || e; //equalize event object
    		onMouseWheel(evt);
	}, false );

	document.addEventListener( 'keydown', onKeyDown, false);												    			    	

    //	-----------------------------------------------------------------------------
    //	Setup our camera
    camera = new THREE.PerspectiveCamera( 12, window.innerWidth / window.innerHeight, 1, 20000 ); 		        
	camera.position.z = 400;
	camera.position.y = 0;
	camera.lookAt(scene.position);	
	scene.add( camera );	  

	var windowResize = THREEx.WindowResize(renderer, camera)		
}
	

function animate() {	

	//	Disallow roll for now, this is interfering with keyboard input during search
/*	    	
	if(keyboard.pressed('o') && keyboard.pressed('shift') == false)
		camera.rotation.z -= 0.08;		    	
	if(keyboard.pressed('p') && keyboard.pressed('shift') == false)
		camera.rotation.z += 0.08;		   
*/

	if( rotateTargetX !== undefined && rotateTargetY !== undefined ){

		rotateVX += (rotateTargetX - rotateX) * 0.012;
		rotateVY += (rotateTargetY - rotateY) * 0.012;

		// var move = new THREE.Vector3( rotateVX, rotateVY, 0 );
		// var distance = move.length();
		// if( distance > .01 )
		// 	distance = .01;
		// move.normalize();
		// move.multiplyScalar( distance );

		// rotateVX = move.x;
		// rotateVy = move.y;		

		if( Math.abs(rotateTargetX - rotateX) < 0.1 && Math.abs(rotateTargetY - rotateY) < 0.1 ){
			rotateTargetX = undefined;
			rotateTargetY = undefined;
		}
	}
	
	rotateX += rotateVX;
	rotateY += rotateVY;

	//rotateY = wrap( rotateY, -Math.PI, Math.PI );

	rotateVX *= 0.98;
	rotateVY *= 0.98;

	if(dragging || rotateTargetX !== undefined ){
		rotateVX *= 0.6;
		rotateVY *= 0.6;
	}	     

	//	constrain the pivot up/down to the poles
	//	force a bit of bounce back action when hitting the poles
	if(rotateX < -rotateXMax){
		rotateX = -rotateXMax;
		rotateVX *= -0.95;
	}
	if(rotateX > rotateXMax){
		rotateX = rotateXMax;
		rotateVX *= -0.95;
	}		    			    		   	

	rotating.rotation.x = rotateX;
	rotating.rotation.y = rotateY;	

    render();	
    		        		       
    requestAnimationFrame( animate );	


	rotating.traverse(function(mesh) {
		if (mesh.update !== undefined) {
			mesh.update();
		}
	});	

	for( var i in markers ){
		var marker = markers[i];
		marker.update();
	}		    	

}

function render() {	
	renderer.clear();		    					
    renderer.render( scene, camera );				
}		   

function getHistoricalData() {
	var history = [];	

	var outcomeCategories = selectionData.getOutcomeCategories();
	var missileCategories = selectionData.getMissileCategories();

	for( var i in timeBins ){
		var yearBin = timeBins[i].data;		
		var value = {successes: 0, failures:0, unknowns:0};
		for( var s in yearBin ){
			var set = yearBin[s];
			var outcomeName = set.outcome;
			var missileName = set.missile;

			var relevantCategory = ( $.inArray(outcomeName, outcomeCategories ) >= 0 ) && 
								   ( $.inArray(missileName, missileCategories ) >= 0 );				

			if( relevantCategory == false )
				continue;

			if( outcomeName === 'success' )
				value.successes++;
			else if( outcomeName === 'failure' )
				value.failures++;
			else
				value.unknowns++;
		}
		history.push(value);
	}
	// console.log(history);
	return history;
}
