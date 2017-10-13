/**
ui.control.js
Created by Pitch Interactive
Created on 6/26/2012
This code will control the primary functions of the UI in the ArmsGlobe app
**/
d3.selection.prototype.moveToFront = function() {
	return this.each(function() {
		this.parentNode.appendChild(this);
	});
};

var d3Graphs = {
	barGraphWidth: 420,
	barGraphHeight: 800,
	barWidth: 14,
	barGraphTopPadding: 20,
	barGraphBottomPadding: 50,
	histogramWidth: 686,
	histogramHeight: 160,
	histogramBarWidth: 28,
	histogramLeftPadding:28,
	histogramRightPadding: 28,
	histogramVertPadding:20,
	barGraphSVG: d3.select("#wrapper").append("svg").attr('id','barGraph'),
	histogramSVG: null,
	histogramYScale: null,
	histogramXScale: null,
	cumOutcomeY: 0,
	cumSuccessY: 0,cumFailureY: 0,cumUnknownY: 0,
	cumSuccessLblY: 0,cumFailureLblY: 0,cumUnknownLblY: 0,
	inited: false,
	histogramOpen: false,
	handleLeftOffset: 34,
	handleInterval: 42,
	windowResizeTimeout: -1,
	histogramAbsMax: 0,
	previousSuccessLabelTranslateY: -1,
	previousFailureLabelTranslateY: -1,
	previousUnknownLabelTranslateY: -1,
	tiltBtnInterval: -1,
	zoomBtnInterval: -1,


	setTest: function(test) {
		$("#hudButtons .testTextInput").val(test);
		d3Graphs.updateViz();
	},
	initGraphs: function() {
		this.showHud();
		this.drawBarGraph();
		this.drawHistogram();
	},
	showHud: function() {
		if(this.inited) return;
		this.inited = true;
		d3Graphs.windowResize();
		$("#hudHeader, #hudButtons").show();
		$("#history").show();
		$("#graphIcon").show();
		$("#outcomeBtns").show();
		$("#missileTypeBtns").show();
		$("#graphIcon").click(d3Graphs.graphIconClick);
		$("#history .close").click(d3Graphs.closeHistogram);
		$("#history ul li").click(d3Graphs.clickTimeline);
		$("#handle").draggable({axis: 'x',containment: "parent",grid:[this.handleInterval, this.handleInterval], stop: d3Graphs.dropHandle, drag: d3Graphs.dropHandle });
		$("#hudButtons .searchBtn").click(d3Graphs.updateViz);
		$("#outcomeBtns>div>.label").click(d3Graphs.outcomeLabelClick);
		$("#missileTypeBtns .check").click(d3Graphs.missileBtnClick);
		$("#hudButtons .testTextInput").autocomplete({ source:selectableTests, autoFocus: true });
		$("#hudButtons .testTextInput").keyup(d3Graphs.testKeyUp);
		$("#hudButtons .testTextInput").focus(d3Graphs.testFocus);
		$("#hudButtons .aboutBtn").click(d3Graphs.toggleAboutBox);
		$(document).on("click",".ui-autocomplete li",d3Graphs.menuItemClick);
		$(window).resize(d3Graphs.windowResizeCB);
		$(".tiltBtn").mousedown(d3Graphs.tiltBtnClick);
		$(".tiltBtn").mouseup(d3Graphs.tiltBtnMouseup);
		$(".zoomBtn").mousedown(d3Graphs.zoomBtnClick);
		$(".zoomBtn").mouseup(d3Graphs.zoomBtnMouseup);

	},
	tiltBtnMouseup: function() {
		clearInterval(d3Graphs.tiltBtnInterval);
	},
	tiltBtnClick:function() {
		var delta;
		if($(this).hasClass('sideViewBtn')) {
			delta = 5;
		} else {
			delta = -5;
		}
		d3Graphs.doTilt(delta);
		d3Graphs.tiltBtnInterval = setInterval(d3Graphs.doTilt, 50, delta);
	},
	doTilt:function(delta) {
		tilt += delta * 0.01;
		tilt = constrain(tilt, 0, Math.PI / 2);
		camera.position.y = 300 * Math.sin(-tilt);
		camera.position.z = 100 + 300 * Math.cos(-tilt);
		camera.lookAt(new THREE.Vector3(0, 0, 100));
	},
	zoomBtnMouseup: function() {
		clearInterval(d3Graphs.zoomBtnInterval);
	},
	zoomBtnClick:function() {
		var delta;
		if($(this).hasClass('zoomOutBtn')) {
			delta = -0.5;
		} else {
			delta = 0.5;
		}
		d3Graphs.doZoom(delta);
		d3Graphs.zoomBtnInterval = setInterval(d3Graphs.doZoom,50,delta);
	},
	doZoom:function(delta) {
		camera.scale.z += delta * 0.1;
		camera.scale.z = constrain( camera.scale.z, 0.5, 5.0 );
	},
	toggleAboutBox:function() {
		$("#aboutContainer").toggle();
	},
	clickTimeline:function() {
		var year = $(this).html();
		if(year < 10) {
			year = (year * 1) + 2000;
		}
		if(year < 100) {
			year = (year * 1) + 1900
		}
		for (var index = 0; index < selectableYears.length - 1; index++) {
			if (selectableYears[index] == year) {
				break;
			}
		}
		var leftPos = d3Graphs.handleLeftOffset + d3Graphs.handleInterval * index;
		$("#handle").css('left',leftPos+"px");
		d3Graphs.updateViz(true);
	},
	windowResizeCB:function() {
		clearTimeout(d3Graphs.windowResizeTimeout);
		d3Graphs.windowResizeTimeout = setTimeout(d3Graphs.windowResize, 50);
	},
	windowResize: function() {
		var windowWidth = $(window).width();
		var windowHeight = $(window).height();
		d3Graphs.positionHistory(windowWidth);
		var minWidth = 1280;
		var minHeight = 860;
		var w = windowWidth < minWidth ? minWidth : windowWidth;
		var hudButtonWidth = 489;
		$('#hudButtons').css('left',w - hudButtonWidth-20);
		var missileButtonWidth = $("#missileTypeBtns").width();
		$("#missileTypeBtns").css('left',w-missileButtonWidth);
		var outcomeButtonWidth = $("#outcomeBtns").width();
		$("#outcomeBtns").css('left',w-missileButtonWidth - outcomeButtonWidth - 10);
		var barGraphHeight = 800;
		var barGraphBottomPadding = 10;
		console.log(windowHeight+ " " + barGraphHeight + " " + barGraphBottomPadding);
		var barGraphTopPos = (windowHeight < minHeight ? minHeight : windowHeight) - barGraphHeight - barGraphBottomPadding;
		console.log(barGraphTopPos);

		$("#barGraph").css('top',barGraphTopPos+'px');
		/*
		var hudHeaderLeft = $("#hudHeader").css('left');
		hudHeaderLeft = hudHeaderLeft.substr(0,hudHeaderLeft.length-2);
		console.log(hudHeaderLeft);
		var hudPaddingRight = 30;
		$("#hudHeader").width(w-hudHeaderLeft - hudPaddingRight);
		*/
	},
	positionHistory: function(windowWidth) {
		var graphIconPadding = 20;
		var historyWidth = $("#history").width();
		var totalWidth = historyWidth + $("#graphIcon").width() + graphIconPadding;
//		var windowWidth = $(window).width();
		var historyLeftPos = (windowWidth - totalWidth) / 2.0;
		var minLeftPos = 280;
		if(historyLeftPos < minLeftPos) {
			historyLeftPos = minLeftPos;
		}
		$("#history").css('left',historyLeftPos+"px");
		$("#graphIcon").css('left',historyLeftPos + historyWidth + graphIconPadding+'px');
	},
	testFocus:function(event) {
		//console.log("focus");
		setTimeout(function() { $('#hudButtons .testTextInput').select() },50);
	},
	menuItemClick:function(event) {
		d3Graphs.updateViz();
	},
	testKeyUp: function(event) {
		if(event.keyCode == 13 /*ENTER */) {
			d3Graphs.updateViz();
		}
	},

	updateViz:function(filterChanged) {
		var test = $("#hudButtons .testTextInput").val().toUpperCase();
		if (typeof testData[test] == 'undefined') {
			if (!filterChanged) {
				return;
			}
			test = selectedTest ? selectedTest.testName : '';
		}

		// year
		var yearOffset = $("#handle").css('left');
		yearOffset = yearOffset.substr(0,yearOffset.length-2);
		yearOffset -= d3Graphs.handleLeftOffset;
		yearOffset /= d3Graphs.handleInterval;
		var year = timeBins[yearOffset].t;
		if (!filterChanged && year != testData[test].date.substr(0, 4)) {
			year = +testData[test].date.substr(0, 4);
			for (var index = 0; index < selectableYears.length - 1; index++) {
				if (selectableYears[index] == year) {
					break;
				}
			}
			var leftPos = d3Graphs.handleLeftOffset + d3Graphs.handleInterval * index;
			$("#handle").css('left',leftPos+"px");
		}

		// outcome
		var outcomeArray = []
		var outcomeBtns = $("#outcomeBtns>div");
		for(var i = 0; i < outcomeBtns.length; i++) {
			var btn = $(outcomeBtns[i]);
			var outcomeKey = btn.attr('class');
			if(btn.find('.inactive').length == 0) {
				outcomeArray.push(outcomeKey);
				selectionData.outcomeCategories[outcomeKey] = true;
			} else {
				selectionData.outcomeCategories[outcomeKey] = false;
			}
		}
		if (!filterChanged && !selectionData.outcomeCategories[testData[test].outcome]) {
			outcomeArray.push(testData[test].outcome);
			selectionData.outcomeCategories[testData[test].outcome] = true;
			outcomeBtns.filter('.' + testData[test].outcome).find('.label').removeClass('inactive');
		}

		//missile
		var missileArray = [];
		var missileBtns = $("#missileTypeBtns>div");
		for(var i = 0; i < missileBtns.length; i++) {
			var btn = $(missileBtns[i]);
			var missileKey = btn.attr('class');
			if(btn.find('.inactive').length == 0) {
				missileArray.push(missileKey);
				selectionData.missileCategories[missileKey] = true;
			} else {
				selectionData.missileCategories[missileKey] = false;
			}
		}
		if (!filterChanged && !selectionData.missileCategories[testData[test].missile]) {
			missileArray.push(testData[test].missile);
			selectionData.missileCategories[testData[test].missile] = true;
			missileBtns.filter('.' + testData[test].missile).find('.check').removeClass('inactive');
		}

		selectionData.selectedYear = year;
		selectionData.selectedTest = test;
		selectVisualization(timeBins, year, [test], outcomeArray, missileArray);
	},
	dropHandle:function() {
		$("#handle").css('top','');
		d3Graphs.updateViz(true);
	},
	outcomeLabelClick: function() {
		var label = $(this);
		if(label.hasClass('inactive')) {
			label.removeClass('inactive');
		} else {
			label.addClass('inactive');
		}
		d3Graphs.updateViz(true);
	},
	missileBtnClick:function() {
		var check = $(this);
		if(check.hasClass('inactive')) {
			check.removeClass('inactive');
		} else {
			check.addClass('inactive');
		}
		d3Graphs.updateViz(true);
	},
	graphIconClick: function() {
		if(!d3Graphs.histogramOpen) {
			d3Graphs.histogramOpen = true;
			$("#history .graph").slideDown();
		} else {
			d3Graphs.closeHistogram();
		}
	},
	closeHistogram: function() {
		d3Graphs.histogramOpen = false;
		$("#history .graph").slideUp();
	},
	line: d3.line()
		// assign the X function to plot our line as we wish
	.x(function(d,i) {
		if(d == null) {
			return null;
		}
		return d3Graphs.histogramXScale(d.x) + d3Graphs.histogramLeftPadding;
	 })
	.y(function(d) {
		if(d == null) {
			return null;
		}
		return d3Graphs.histogramYScale(d.y) + d3Graphs.histogramVertPadding;
	}),
	setHistogramData:function() {
		var outcomeArray = [];
		var historical = summary.historical;
		var numHistory = historical.length;
		var absMax = 0;

		for(var i = 0; i < numHistory; i++) {
			var successes = historical[i].successes;
			var failures = historical[i].failures;
			var unknowns = historical[i].unknowns;
			outcomeArray.push([
				{'type': 'unknown', 'count': unknowns},
				{'type': 'failure', 'count': failures},
				{'type': 'success', 'count': successes}
			]);
			absMax = Math.max(absMax, successes + failures + unknowns);
		}
		this.histogramOutcomeArray = outcomeArray;
		this.histogramAbsMax = absMax;
	},
	drawHistogram:function() {
		if(this.histogramSVG == null) {
			this.histogramSVG = d3.select('#history .container').append('svg')
				.attr('id', 'histogram')
				.attr('width', this.histogramWidth)
				.attr('height', this.histogramHeight);
		}
		this.setHistogramData();

		this.histogramYScale = d3.scaleLinear().domain([0, this.histogramAbsMax]).range([0, this.histogramHeight - this.histogramVertPadding*2]);
		var maxX = summary.historical.length;
		this.histogramXScale = d3.scaleLinear().domain([0,maxX]).range([0, this.histogramWidth - this.histogramLeftPadding - this.histogramRightPadding]);

		var tickData = this.histogramYScale.ticks(5);

		//tick lines
		var ticks = this.histogramSVG.selectAll('line.tick').data(tickData);
		ticks.enter().append('svg:line')
			.attr('class', 'tick')
			.merge(ticks)
			.attr('x1', this.histogramLeftPadding)
			.attr('y1', function(d) {
				return d3Graphs.histogramHeight - d3Graphs.histogramVertPadding - d3Graphs.histogramYScale(d);
			})
			.attr('x2', this.histogramWidth - this.histogramRightPadding)
			.attr('y2', function(d) {
				return d3Graphs.histogramHeight - d3Graphs.histogramVertPadding - d3Graphs.histogramYScale(d);
			})
			.attr('stroke-dasharray', function(d) { return d == 0 ? null : '3,1'; })
			.attr('stroke-width', function(d) { return d == 0 ? 2 : 1; });
		ticks.exit().remove();

		//tick labels
		var tickLabels = this.histogramSVG.selectAll("text.tickLblLeft").data(tickData);
		tickLabels.enter().append('svg:text')
			.attr('class', 'tickLbl tickLblLeft')
			.attr('text-anchor', 'end')
			.merge(tickLabels)
			.attr('x', d3Graphs.histogramLeftPadding - 3)
			.attr('y', function(d) {
				return d3Graphs.histogramHeight - d3Graphs.histogramVertPadding - d3Graphs.histogramYScale(d) + 4;
			})
			.text(function(d) { return d; });
		tickLabels.exit().remove();

		var tickLabelsRight = this.histogramSVG.selectAll("text.tickLblRight").data(tickData);
		tickLabelsRight.enter().append('svg:text')
			.attr('class', 'tickLbl tickLblRight')
			.merge(tickLabelsRight)
			.attr('x', d3Graphs.histogramWidth - d3Graphs.histogramRightPadding + 3)
			.attr('y', function(d) {
				return d3Graphs.histogramHeight - d3Graphs.histogramVertPadding - d3Graphs.histogramYScale(d) + 4;
			})
			.text(function(d) { return d; });
		tickLabelsRight.exit().remove();

		//lines
		var successesVisible = !$("#outcomeBtns .success .label").hasClass('inactive');
		var failuresVisible = !$("#outcomeBtns .failure .label").hasClass('inactive');
		var unknownsVisible = !$("#outcomeBtns .unknown .label").hasClass('inactive');
		$("#history .labels .failures").css('display', failuresVisible ? 'block' : 'none');
		$("#history .labels .successes").css('display', successesVisible ? 'block' : 'none');
		$("#history .labels .unknowns").css('display', unknownsVisible ? 'block' : 'none');


		var outcomeBars = this.histogramSVG.selectAll("g.outcome").data(d3Graphs.histogramOutcomeArray);
		outcomeBars = outcomeBars.enter().append('g')
			.attr('class', 'outcome')
			.attr('transform', function(d, i) {
				return 'translate(' + (d3Graphs.histogramXScale(i) + d3Graphs.histogramLeftPadding) + ',' + d3Graphs.histogramVertPadding + ')';
			})
			.merge(outcomeBars);

		var outcomeRects = outcomeBars.selectAll("rect.outcome").data(function(d) { return d; });
		outcomeRects.enter().append('rect')
			.attr('class', function(d) { return 'outcome ' + d.type; })
			.attr('x', this.histogramBarWidth / 4)
			.attr('width', this.histogramBarWidth)
			.merge(outcomeRects).transition()
			.attr('y', function(d, i) {
				if (i == 0) {
					d3Graphs.cumOutcomeY = 0;
				}
				d3Graphs.cumOutcomeY += d3Graphs.histogramYScale(d.count);
				return d3Graphs.histogramHeight - d3Graphs.histogramVertPadding * 2 - d3Graphs.cumOutcomeY;
			})
			.attr('height', function(d) { return d3Graphs.histogramYScale(d.count); });
		outcomeRects.exit().remove();
		outcomeBars.exit().remove();
		outcomeBars.moveToFront();

		//active year labels
		var yearOffset = $("#handle").css('left');
		yearOffset = yearOffset.substr(0,yearOffset.length-2);
		yearOffset -= d3Graphs.handleLeftOffset;
		yearOffset /= d3Graphs.handleInterval;
		var activeYearOutcome = this.histogramOutcomeArray[yearOffset];

		var yearLabels = this.histogramSVG.selectAll("text.yearLabel").data(activeYearOutcome);
		yearLabels.enter().append('text')
			.attr('class', 'yearLabel')
			.attr('text-anchor', 'middle')
			.merge(yearLabels).transition()
			.attr('x', this.histogramLeftPadding + this.histogramXScale(yearOffset) + this.histogramBarWidth * 3 / 4)
			.attr('y', function(d, i) {
				if (i == 0) {
					d3Graphs.cumOutcomeY = 0;
				}
				var height = d3Graphs.histogramYScale(d.count);
				d3Graphs.cumOutcomeY += height;
				var value = d3Graphs.histogramHeight - d3Graphs.histogramVertPadding - d3Graphs.cumOutcomeY;
				if (height >= 10) {
					value += height / 2 + 5;
				} else if (d.type === 'success') {
					value -= 2;
				} else {
					value += height + 12;
				}
				return value;
			})
			.text(function(d) { return d.count || this.textContent; })
			.attr('opacity', function(d) {
				if (d.count == 0) {
					return 0;
				}
				if (d.type === 'success') {
					return successesVisible ? 1 : 0;
				} else if (d.type === 'failure') {
					return failuresVisible ? 1 : 0;
				} else {
					return unknownsVisible ? 1 : 0;
				}
			});
		yearLabels.exit().remove();
		yearLabels.moveToFront();

	},
	drawBarGraph: function() {
		this.barGraphSVG
			.attr('id', 'barGraph')
			.attr('width', d3Graphs.barGraphWidth)
			.attr('height', d3Graphs.barGraphHeight)
			.attr('class', 'overlayTests noPointer');
		var successArray = [];
		var failureArray = [];
		var unknownArray = [];
		var successTotal = summary.success.total;
		var failureTotal = summary.failure.total;
		var unknownTotal = summary.unknown.total;
		var minMissileCount = Number.MAX_VALUE;
		var maxMissileCount = Number.MIN_VALUE;
		for(var code in missileLookup) {
			var sCount = summary.success[code];
			var fCount = summary.failure[code];
			var uCount = summary.unknown[code];
			if(sCount < minMissileCount) {
				minMissileCount = sCount;
			}
			if(sCount > maxMissileCount) {
				maxMissileCount = sCount;
			}
			if(fCount < minMissileCount) {
				minMissileCount = fCount;
			}
			if(fCount > maxMissileCount) {
				maxMissileCount = fCount;
			}
			if(uCount < minMissileCount) {
				minMissileCount = uCount;
			}
			if(uCount > maxMissileCount) {
				maxMissileCount = uCount;
			}
			successArray.unshift({"type":code, "count": sCount});
			failureArray.unshift({"type":code, "count": fCount});
			unknownArray.unshift({"type":code, "count": uCount});
		}
		var max = 19;
		var yScale = d3.scaleLinear().domain([0,max]).range([0,this.barGraphHeight - this.barGraphBottomPadding - this.barGraphTopPadding]);
		var midX = this.barGraphWidth / 3;
		this.cumSuccessY = this.cumFailureY = this.cumUnknownY = 0;

		var successRects = this.barGraphSVG.selectAll(".bar.success").data(successArray);
		successRects.enter().append('rect')
			.attr('class', function(d) { return 'bar success ' + d.type; })
			.attr('x', midX - this.barWidth)
			.attr('width', this.barWidth)
			.merge(successRects).transition()
			.attr('y', function(d) {
				d3Graphs.cumSuccessY += yScale(d.count);
				return value = d3Graphs.barGraphHeight - d3Graphs.barGraphBottomPadding - d3Graphs.cumSuccessY;
			})
			.attr('height', function(d) { return yScale(d.count); });
		successRects.exit().remove();

		var failureRects = this.barGraphSVG.selectAll('.bar.failure').data(failureArray);
		failureRects.enter().append('rect')
			.attr('class', function(d) { return 'bar failure ' + d.type; })
			.attr('x', midX + 10)
			.attr('width', this.barWidth)
			.merge(failureRects).transition()
			.attr('y', function(d) {
				d3Graphs.cumFailureY += yScale(d.count);
				return value = d3Graphs.barGraphHeight - d3Graphs.barGraphBottomPadding - d3Graphs.cumFailureY;
			})
			.attr('height', function(d) { return yScale(d.count); });
		failureRects.exit().remove();

		var unknownRects = this.barGraphSVG.selectAll('.bar.unknownBar').data(unknownArray);
		unknownRects.enter().append('rect')
			.attr('class', function(d) { return 'bar unknownBar ' + d.type; })
			.attr('x', midX + 120)
			.attr('width', this.barWidth)
			.merge(unknownRects).transition()
			.attr('y', function(d) {
				d3Graphs.cumUnknownY += yScale(d.count);
				return d3Graphs.barGraphHeight - d3Graphs.barGraphBottomPadding - d3Graphs.cumUnknownY;
			})
			.attr('height', function(d) { return yScale(d.count); });
		unknownRects.exit().remove();

		//bar graph labels
		this.cumSuccessLblY = 0;
		this.cumFailureLblY = 0;
		this.cumUnknownLblY = 0;
		this.previousSuccessLabelTranslateY = 0;
		this.previousFailureLabelTranslateY = 0;
		this.previousUnknownLabelTranslateY = 0;
		var fontSizeInterpolater = d3.interpolateRound(12,28);
		var smallLabelSize = 22;
		var mediumLabelSize = 40;

		//success labels
		var successLabels = this.barGraphSVG.selectAll('g.successLabel').data(successArray);
		var newSuccessLabels = successLabels.enter().append('g')
			.attr('class', function(d) { return 'successLabel ' + d.type; });
		newSuccessLabels.append('rect')
			.attr('class', function(d) { return 'barGraphLabelBG ' + d.type; });
		newSuccessLabels.append('text')
			.attr('class', 'numericLabel')
			.attr('text-anchor', 'end');
		newSuccessLabels.append('text')
			.attr('class', function(d) { return 'textLabel success ' + d.type; })
			.attr('text-anchor', 'end')
			.attr('y', 15);
		successLabels = newSuccessLabels.merge(successLabels);
		successLabels.transition()
			.attr('transform', function(d) {
				var translate = 'translate(' + (d3Graphs.barGraphWidth / 3 - 25) + ',';
				var value = d3Graphs.barGraphHeight - d3Graphs.barGraphBottomPadding - d3Graphs.cumSuccessLblY - yScale(d.count) / 2;
				d3Graphs.cumSuccessLblY += yScale(d.count);
				translate += value + ')';
				this.previousSuccessLabelTranslateY = value;
				return translate;
			})
			.attr('opacity', function(d) { return d.count > 0 ? 1 : 0; });
		successLabels.exit().remove();
		successLabels.selectAll('.numericLabel').transition()
			.text(function(d) { return this.parentNode.__data__.count || this.textContent; })
			.attr('font-size', function(d) {
				return fontSizeInterpolater((this.parentNode.__data__.count - minMissileCount) / (maxMissileCount - minMissileCount)) + 'px';
			});
		successLabels.selectAll('.textLabel')
			.text(function(d) { return missileLookup[this.parentNode.__data__.type].name.toUpperCase(); });
		successLabels.selectAll('.barGraphLabelBG').transition()
			.attr('width', function(d) {
				return d3.select(this.parentNode).select('.textLabel').node().getComputedTextLength();
			})
			.attr('height', function(d) {
				return fontSizeInterpolater((this.parentNode.__data__.count - minMissileCount) / (maxMissileCount - minMissileCount)) + 16;
			})
			.attr('x', function(d) {
				return -d3.select(this.parentNode).select('.textLabel').node().getComputedTextLength();
			})
			.attr('y', function(d) {
				return -fontSizeInterpolater((this.parentNode.__data__.count - minMissileCount) / (maxMissileCount - minMissileCount));
			});

		//failure labels
		var failureLabels = this.barGraphSVG.selectAll('g.failureLabel').data(failureArray);
		var newFailureLabels = failureLabels.enter().append('g')
			.attr('class', function(d) { return 'failureLabel ' + d.type; });
		newFailureLabels.append('rect')
			.attr('class', function(d) { return 'barGraphLabelBG failureBG ' + d.type; })
			.attr('x', 0);
		newFailureLabels.append('text')
			.attr('class', 'numericLabel')
			.attr('text-anchor', 'start');
		newFailureLabels.append('text')
			.attr('class', function(d) { return 'textLabel failure ' + d.type; })
			.attr('text-anchor', 'start')
			.attr('y', 15);
		failureLabels = newFailureLabels.merge(failureLabels);
		failureLabels.transition()
			.attr('transform', function(d) {
				var translate = 'translate(' + (d3Graphs.barGraphWidth / 3 + 35) + ',';
				var value = d3Graphs.barGraphHeight - d3Graphs.barGraphBottomPadding - d3Graphs.cumFailureLblY - yScale(d.count) / 2;
				d3Graphs.cumFailureLblY += yScale(d.count);
				translate += value + ')';
				this.previousFailureLabelTranslateY = value;
				return translate;
			})
			.attr('opacity', function(d) { return d.count > 0 ? 1 : 0; });
		failureLabels.exit().remove();
		failureLabels.selectAll('.numericLabel').transition()
			.text(function(d) { return this.parentNode.__data__.count || this.textContent; })
			.attr('font-size', function(d) {
				return fontSizeInterpolater((this.parentNode.__data__.count - minMissileCount) / (maxMissileCount - minMissileCount)) + 'px';
			});
		failureLabels.selectAll('.textLabel')
			.text(function(d) { return missileLookup[this.parentNode.__data__.type].name.toUpperCase(); });
		failureLabels.selectAll('.barGraphLabelBG').transition()
			.attr('width', function(d) {
				return d3.select(this.parentNode).select('.textLabel').node().getComputedTextLength();
			})
			.attr('height', function(d) {
				return fontSizeInterpolater((this.parentNode.__data__.count - minMissileCount) / (maxMissileCount - minMissileCount)) + 16;
			})
			.attr('y', function(d) {
				return -fontSizeInterpolater((this.parentNode.__data__.count - minMissileCount) / (maxMissileCount - minMissileCount));
			});

		//unknown labels
		var unknownLabels = this.barGraphSVG.selectAll('g.unknownLabel').data(unknownArray);
		var newUnknownLabels = unknownLabels.enter().append('g')
			.attr('class', function(d) { return 'unknownLabel ' + d.type; });
		newUnknownLabels.append('rect')
			.attr('class', function(d) { return 'barGraphLabelBG unknownBG ' + d.type; })
			.attr('x', 0);
		newUnknownLabels.append('text')
			.attr('class', 'numericLabel')
			.attr('text-anchor', 'start');
		newUnknownLabels.append('text')
			.attr('class', function(d) { return 'textLabel unknown ' + d.type; })
			.attr('text-anchor', 'start')
			.attr('y', 15);
		unknownLabels = newUnknownLabels.merge(unknownLabels);
		unknownLabels.transition()
			.attr('transform', function(d) {
				var translate = 'translate(' + (d3Graphs.barGraphWidth / 3 + 145) + ',';
				var value = d3Graphs.barGraphHeight - d3Graphs.barGraphBottomPadding - d3Graphs.cumUnknownLblY - yScale(d.count) / 2;
				d3Graphs.cumUnknownLblY += yScale(d.count);
				translate += value + ')';
				this.previousUnknownLabelTranslateY = value;
				return translate;
			})
			.attr('opacity', function(d) { return d.count > 0 ? 1 : 0; });
		unknownLabels.exit().remove();
		unknownLabels.selectAll('.numericLabel').transition()
			.text(function(d) { return this.parentNode.__data__.count || this.textContent; })
			.attr('font-size', function(d) {
				return fontSizeInterpolater((this.parentNode.__data__.count - minMissileCount) / (maxMissileCount - minMissileCount)) + 'px';
			});
		unknownLabels.selectAll('.textLabel')
			.text(function(d) { return missileLookup[this.parentNode.__data__.type].name.toUpperCase(); });
		unknownLabels.selectAll('.barGraphLabelBG').transition()
			.attr('width', function(d) {
				return d3.select(this.parentNode).select('.textLabel').node().getComputedTextLength();
			})
			.attr('height', function(d) {
				return fontSizeInterpolater((this.parentNode.__data__.count - minMissileCount) / (maxMissileCount - minMissileCount)) + 16;
			})
			.attr('y', function(d) {
				return -fontSizeInterpolater((this.parentNode.__data__.count - minMissileCount) / (maxMissileCount - minMissileCount));
			});

		//over all numeric total outcome labels
		var successsesVisible = !$("#outcomeBtns .success .label").hasClass('inactive');
		var failuresVisible = !$("#outcomeBtns .failure .label").hasClass('inactive');
		var unknownVisible = !$("#outcomeBtns .unknown .label").hasClass('inactive');

		//success total label at bottom
		var successTotalLabel = this.barGraphSVG.selectAll('text.totalLabel.successTotalLabel').data([1]);
		successTotalLabel.enter().append('text')
			.attr('class', 'totalLabel successTotalLabel')
			.attr('text-anchor', 'end')
			.attr('x', midX)
			.attr('y', this.barGraphHeight - this.barGraphBottomPadding + 25)
			.merge(successTotalLabel).transition()
			.text(successsesVisible ? successTotal : function() { return this.textContent; })
			.attr('opacity', successsesVisible ? 1 : 0);

		//failure total label at bottom
		var failureTotalLabel = this.barGraphSVG.selectAll('text.totalLabel.failureTotalLabel').data([1]);
		failureTotalLabel.enter().append('text')
			.attr('class', 'totalLabel failureTotalLabel')
			.attr('x', midX + 10)
			.attr('y', this.barGraphHeight - this.barGraphBottomPadding + 25)
			.merge(failureTotalLabel).transition()
			.text(failuresVisible ? failureTotal : function() { return this.textContent; })
			.attr('opacity', failuresVisible ? 1 : 0);

		//unknown total label at bottom
		var unknownTotalLabel = this.barGraphSVG.selectAll('text.totalLabel.unknownTotalLabel').data([1]);
		unknownTotalLabel.enter().append('text')
			.attr('class', 'totalLabel unknownTotalLabel')
			.attr('x', midX + 120)
			.attr('y', this.barGraphHeight - this.barGraphBottomPadding + 25)
			.merge(unknownTotalLabel).transition()
			.text(unknownVisible ? unknownTotal : function() { return this.textContent; })
			.attr('opacity', unknownVisible ? 1 : 0);

		//success label at bottom
		var successLabel = this.barGraphSVG.selectAll('text.successLabel').data([1]);
		successLabel.enter().append('text')
			.attr('class', 'successLabel')
			.attr('text-anchor', 'end')
			.text('SUCCESS')
			.attr('x', midX)
			.attr('y', this.barGraphHeight - this.barGraphBottomPadding + 45)
			.merge(successLabel).transition()
			.attr('opacity', successsesVisible ? 1 : 0);

		//failure label at bottom
		var failureLabel = this.barGraphSVG.selectAll('text.failureLabel').data([1]);
		failureLabel.enter().append('text')
			.attr('class', 'failureLabel')
			.text('FAILURE')
			.attr('x', midX + 10)
			.attr('y', this.barGraphHeight - this.barGraphBottomPadding + 45)
			.merge(failureLabel).transition()
			.attr('opacity', failuresVisible ? 1 : 0);

		//unknown label at bottom
		var unknownLabel = this.barGraphSVG.selectAll('text.unknownLabel').data([1]);
		unknownLabel.enter().append('text')
			.attr('class', 'unknownLabel')
			.text('UNKNOWN')
			.attr('x', midX + 95)
			.attr('y', this.barGraphHeight - this.barGraphBottomPadding + 45)
			.merge(unknownLabel).transition()
			.attr('opacity', unknownVisible ? 1 : 0);
	},
	dragHandleStart: function(event) {
		console.log('start');
		event.dataTransfer.setData('text/uri-list','images/yearHandle.png');
		event.dataTransfer.setDragImage(document.getElementById('handle'),0,0);
		event.dataTransfer.effectAllowed='move';
	}
}
