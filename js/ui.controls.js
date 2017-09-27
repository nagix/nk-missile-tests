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
		$(".zoomBtn").mousedown(d3Graphs.zoomBtnClick);
		$(".zoomBtn").mouseup(d3Graphs.zoomBtnMouseup);

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
			test = selectedTest.testName;
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
			this.histogramSVG = d3.select('#history .container').append('svg');
			this.histogramSVG.attr('id','histogram').attr('width',this.histogramWidth).attr('height',this.histogramHeight);
		}
		this.setHistogramData();

		this.histogramYScale = d3.scaleLinear().domain([0, this.histogramAbsMax]).range([0, this.histogramHeight - this.histogramVertPadding*2]);
		var maxX = summary.historical.length;
		this.histogramXScale = d3.scaleLinear().domain([0,maxX]).range([0, this.histogramWidth - this.histogramLeftPadding - this.histogramRightPadding]);

		var tickData = this.histogramYScale.ticks(5);
		//tick lines
		var ticks = this.histogramSVG.selectAll('line.tick').data(tickData);
		ticks.enter().append('svg:line').attr('class','tick')
		.merge(ticks)
		.attr('y1',function(d) {
			return d3Graphs.histogramHeight - d3Graphs.histogramVertPadding - d3Graphs.histogramYScale(d);
		}).attr('y2', function(d) {
			return d3Graphs.histogramHeight - d3Graphs.histogramVertPadding - d3Graphs.histogramYScale(d);
		}).attr('x1',this.histogramLeftPadding).attr('x2',this.histogramWidth - this.histogramRightPadding)
		.attr('stroke-dasharray',function(d) {
			if(d == 0) {
				return null;
			}
			return '3,1';
		}).attr('stroke-width',function(d) {
			if(d == 0) {
				return 2;
			}
			return 1;
		});
		//tick labels
		var tickLabels = this.histogramSVG.selectAll("text.tickLblLeft").data(tickData);
		tickLabels.enter().append('svg:text').attr('class','tickLbl tickLblLeft').attr('text-anchor','end')
		.merge(tickLabels)
		.attr('x', d3Graphs.histogramLeftPadding-3).attr('y',function(d) {
			return d3Graphs.histogramHeight - d3Graphs.histogramVertPadding - d3Graphs.histogramYScale(d) + 4;
		}).text(function(d) { return Math.abs(d); });
		var tickLabelsRight = this.histogramSVG.selectAll("text.tickLblRight").data(tickData);
		tickLabelsRight.enter().append('svg:text').attr('class','tickLbl tickLblRight')
		.merge(tickLabelsRight)
		.attr('x', d3Graphs.histogramWidth - d3Graphs.histogramRightPadding+3).attr('y',function(d) {
			return d3Graphs.histogramHeight - d3Graphs.histogramVertPadding - d3Graphs.histogramYScale(d) + 4;
		}).text(function(d) { return Math.abs(d); });
		ticks.exit().remove();
		tickLabels.exit().remove();
		tickLabelsRight.exit().remove();
		//lines
		var successesVisible = !$("#outcomeBtns .success .label").hasClass('inactive');
		var failuresVisible = !$("#outcomeBtns .failure .label").hasClass('inactive');
		var unknownsVisible = !$("#outcomeBtns .unknown .label").hasClass('inactive');
		$("#history .labels .failures").css('display', failuresVisible ? 'block' : 'none');
		$("#history .labels .successes").css('display', successesVisible ? 'block' : 'none');
		$("#history .labels .unknowns").css('display', unknownsVisible ? 'block' : 'none');


		var outcomeBars = this.histogramSVG.selectAll("g.outcome").data(d3Graphs.histogramOutcomeArray);
		outcomeBars = outcomeBars.enter().append('g').attr('class', 'outcome').attr('transform', function(d, i) {
			return 'translate(' + (d3Graphs.histogramXScale(i) + d3Graphs.histogramLeftPadding) + ',' + d3Graphs.histogramVertPadding + ')';
		}).merge(outcomeBars);

		var outcomeRects = outcomeBars.selectAll("rect.outcome").data(function(d) { return d; });
		outcomeRects.enter().append('rect').attr('class', function(d) {
			return 'outcome ' + d.type; }).attr('x', this.histogramBarWidth / 4).attr('width',this.histogramBarWidth)
		.merge(outcomeRects)
		.attr('y',function(d, i) {
			if (i == 0) {
				d3Graphs.cumOutcomeY = 0;
			}
			var value = d3Graphs.histogramHeight - d3Graphs.histogramVertPadding * 2 - d3Graphs.cumOutcomeY - d3Graphs.histogramYScale(d.count);
			d3Graphs.cumOutcomeY += d3Graphs.histogramYScale(d.count);
			return value;
		}).attr('height',function(d) { return d3Graphs.histogramYScale(d.count); });

		//active year labels
		var yearOffset = $("#handle").css('left');
		yearOffset = yearOffset.substr(0,yearOffset.length-2);
		yearOffset -= d3Graphs.handleLeftOffset;
		yearOffset /= d3Graphs.handleInterval;
		var activeYearOutcome = this.histogramOutcomeArray[yearOffset];

		var yearLabels = this.histogramSVG.selectAll("text.yearLabel").data(activeYearOutcome);

		yearLabels.enter().append('text').attr('class','yearLabel').attr('text-anchor','middle')
		.merge(yearLabels)
		.attr('x', this.histogramLeftPadding + this.histogramXScale(yearOffset) + this.histogramBarWidth * 3 / 4)
		.attr('y',function(d, i) {
			if (i == 0) {
				d3Graphs.cumOutcomeY = 0;
			}
			var height = d3Graphs.histogramYScale(d.count);
			var value = d3Graphs.histogramHeight - d3Graphs.histogramVertPadding - d3Graphs.cumOutcomeY - height / 2 + 5;
			d3Graphs.cumOutcomeY += height;
			if (height < 10) {
				value += d.type === 'success' ? -7 - height / 2 : 7 + height / 2;
			}
			return value;
		}).text(function(d) {
			 return d.count;

		}).attr('visibility', function(d) {
			if(d.count == 0) {
				return 'hidden';
			}
			if(d.type == 'success') {
				return successesVisible ? 'visible' : 'hidden';
			} else if(d.type == 'failure') {
				return failuresVisible ? 'visible' : 'hidden';
			} else {
				return unknownsVisible ? 'visible' : 'hidden';
			}
		});
		yearLabels.moveToFront();

	},
	drawBarGraph: function() {
		this.barGraphSVG.attr('id','barGraph').attr('width',d3Graphs.barGraphWidth).attr('height',d3Graphs.barGraphHeight).attr('class','overlayTests noPointer');
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
		var successRects = this.barGraphSVG.selectAll(".bar.success").data(successArray);
		var midX = this.barGraphWidth / 3;
		this.cumSuccessY = this.cumFailureY = this.cumUnknownY = 0;
		successRects.enter().append('rect').attr('class', function(d) {
			return 'bar success '+d.type;
		}).attr('x',midX - this.barWidth).attr('width',this.barWidth)
		.merge(successRects)
		.attr('y',function(d) {
			var value = d3Graphs.barGraphHeight - d3Graphs.barGraphBottomPadding - d3Graphs.cumSuccessY - yScale(d.count) ;
			d3Graphs.cumSuccessY += yScale(d.count);
			return value;
		}).attr('height',function(d) { return yScale(d.count); });
		var failureRects = this.barGraphSVG.selectAll('.bar.failure').data(failureArray);
		failureRects.enter().append('rect').attr('class',function(d) {
			return 'bar failure '+ d.type;
		}).attr('x',midX + 10).attr('width',this.barWidth)
		.merge(failureRects)
		.attr('y',function(d) {
			var value = d3Graphs.barGraphHeight - d3Graphs.barGraphBottomPadding - d3Graphs.cumFailureY - yScale(d.count);
			d3Graphs.cumFailureY += yScale(d.count);
			return value;
		}).attr('height',function(d) { return yScale(d.count); });
		var unknownRects = this.barGraphSVG.selectAll('.bar.unknownBar').data(unknownArray);
		unknownRects.enter().append('rect').attr('class',function(d) {
			return 'bar unknownBar '+ d.type;
		}).attr('x',midX + 120).attr('width',this.barWidth)
		.merge(unknownRects)
		.attr('y',function(d) {
			var value = d3Graphs.barGraphHeight - d3Graphs.barGraphBottomPadding - d3Graphs.cumUnknownY - yScale(d.count);
			d3Graphs.cumUnknownY += yScale(d.count);
			return value;
		}).attr('height',function(d) { return yScale(d.count); });
		//bar graph labels
		this.cumSuccessLblY = 0;
		this.cumFailureLblY = 0;
		this.cumUnknownLblY = 0;
		this.previousSuccessLabelTranslateY = 0;
		this.previousFailureLabelTranslateY = 0;
		this.previousUnknownLabelTranslateY = 0;
		var paddingFromBottomOfGraph = 00;
		var heightPerLabel = 25;
		var fontSizeInterpolater = d3.interpolateRound(10,28);
		var smallLabelSize = 22;
		var mediumLabelSize = 40;
		//success labels
		var successLabelBGs = this.barGraphSVG.selectAll("rect.barGraphLabelBG").data(successArray);
		successLabelBGs = successLabelBGs.enter().append('rect').attr('class',function(d) {
			return 'barGraphLabelBG ' + d.type; }).merge(successLabelBGs);
		var successLabels = this.barGraphSVG.selectAll("g.successLabel").data(successArray);
		successLabels = successLabels.enter().append("g").attr('class',function(d) {
			return 'successLabel '+d.type;
		})
		.merge(successLabels)
		.attr('transform',function(d) {
			var translate = 'translate('+(d3Graphs.barGraphWidth / 3 - 25)+",";
			var value = d3Graphs.barGraphHeight - d3Graphs.barGraphBottomPadding - d3Graphs.cumSuccessLblY - yScale(d.count)/2;
			d3Graphs.cumSuccessLblY += yScale(d.count);
			translate += value+")";
			this.previousSuccessLabelTranslateY = value;
			return translate;
		}).attr('display',function(d) {
			if(d.count == 0) { return 'none';}
			return null;
		});
		successLabels.selectAll("*").remove();
		var successLabelArray = successLabels._groups[0];
		var successLabelBGArray = successLabelBGs._groups[0];
		for(var i = 0; i < successLabelArray.length; i++) {
			var successLabelE = successLabelArray[i];
			var successLabel = d3.select(successLabelE);
			var data = successArray[i];
			successLabel.data(data);
			var pieceHeight = yScale(data.count);
			var labelHeight = -1;
			var labelBGYPos = -1;
			var labelWidth = -1;
			var successLabelBG = d3.select(successLabelBGArray[i]);
			if(pieceHeight < smallLabelSize) {
				//just add number
				//console.log("small label");
				var numericLabel = successLabel.append('text').text(function(d) {
					return d.count;
				}).attr('text-anchor','end').attr('alignment-baseline','central')
				.attr('font-size',function(d) {
					return fontSizeInterpolater((d.count-minMissileCount)/(maxMissileCount - minMissileCount));
				});
				labelHeight = fontSizeInterpolater((data.count-minMissileCount)/(maxMissileCount-minMissileCount));
				labelBGYPos = - labelHeight / 2;
				var numericLabelEle = numericLabel._groups[0][0];
				labelWidth = numericLabelEle.getComputedTextLength();
			} else {
				//number and type
				//console.log('medium label');
				var numericLabel = successLabel.append('text').text(function(d) {
					return d.count;
				}).attr('text-anchor','end').attr('font-size',function(d) {
					return fontSizeInterpolater((d.count-minMissileCount)/(maxMissileCount - minMissileCount));
				});
				var textLabel = successLabel.append('text').text(function(d) {
					return missileLookup[d.type].name.toUpperCase();
				}).attr('text-anchor','end').attr('y',15).attr('class',function(d) { return 'success '+d.type});
				labelHeight = fontSizeInterpolater((data.count-minMissileCount)/(maxMissileCount-minMissileCount));
				labelBGYPos = -labelHeight;
				labelHeight += 16;
				var numericLabelEle = numericLabel._groups[0][0];
				var textLabelEle = textLabel._groups[0][0];
				labelWidth = numericLabelEle.getComputedTextLength() > textLabelEle.getComputedTextLength() ? numericLabelEle.getComputedTextLength() : textLabelEle.getComputedTextLength();
			}
			if(labelHeight != -1 && labelBGYPos != -1 && labelWidth != -1) {
				successLabelBG.attr('x',-labelWidth).attr('y',labelBGYPos).attr('width',labelWidth).attr('height',labelHeight)
					.attr('transform',successLabel.attr('transform'));
			}
		}
		//failure labels
		var failureLabelBGs = this.barGraphSVG.selectAll("rect.barGraphLabelBG.failureBG").data(failureArray);
		failureLabelBGs = failureLabelBGs.enter().append('rect').attr('class',function(d) {
			return 'barGraphLabelBG failureBG ' + d.type; }).merge(failureLabelBGs);
		var failureLabels = this.barGraphSVG.selectAll("g.failureLabel").data(failureArray);
		failureLabels = failureLabels.enter().append("g").attr('class',function(d) {
			return 'failureLabel '+d.type;
		}).merge(failureLabels)
		.attr('transform',function(d) {
			var translate = 'translate('+(d3Graphs.barGraphWidth / 3 + 35)+",";
			var value = d3Graphs.barGraphHeight - d3Graphs.barGraphBottomPadding - d3Graphs.cumFailureLblY - yScale(d.count)/2;
			d3Graphs.cumFailureLblY += yScale(d.count);
			translate += value+")";
			this.previousFailureLabelTranslateY = value;
			return translate;
		}).attr('display',function(d) {
			if(d.count == 0) { return 'none';}
			return null;
		});
		failureLabels.selectAll("*").remove();
		var failureLabelArray = failureLabels._groups[0];
		var failureLabelBGArray = failureLabelBGs._groups[0];
		for(var i = 0; i < failureLabelArray.length; i++) {
			var failureLabelE = failureLabelArray[i];
			var failureLabel = d3.select(failureLabelE);
			var data = failureArray[i];
			failureLabel.data(data);
			var pieceHeight = yScale(data.count);
			var labelHeight = -1;
			var labelBGYPos = -1;
			var labelWidth = -1;
			var failureLabelBG = d3.select(failureLabelBGArray[i]);
			if(pieceHeight < smallLabelSize) {
				//just add number
				//console.log("small label");
				var numericLabel = failureLabel.append('text').text(function(d) {
					return d.count;
				}).attr('text-anchor','start').attr('alignment-baseline','central')
				.attr('font-size',function(d) {
					return fontSizeInterpolater((d.count-minMissileCount)/(maxMissileCount - minMissileCount));
				});
				labelHeight = fontSizeInterpolater((data.count-minMissileCount)/(maxMissileCount-minMissileCount));
				labelBGYPos = - labelHeight / 2;
				var numericLabelEle = numericLabel._groups[0][0];
				labelWidth = numericLabelEle.getComputedTextLength();
			} else {
				//number and type
				var numericLabel = failureLabel.append('text').text(function(d) {
					return d.count;
				}).attr('text-anchor','start').attr('font-size',function(d) {
					return fontSizeInterpolater((d.count-minMissileCount)/(maxMissileCount - minMissileCount));
				});
				var textLabel = failureLabel.append('text').text(function(d) {
					return missileLookup[d.type].name.toUpperCase();
				}).attr('text-anchor','start').attr('y',15).attr('class',function(d) { return 'failure '+d.type});
				labelHeight = fontSizeInterpolater((data.count-minMissileCount)/(maxMissileCount-minMissileCount));
				labelBGYPos = -labelHeight;
				labelHeight += 16;
				var numericLabelEle = numericLabel._groups[0][0];
				var textLabelEle = textLabel._groups[0][0];
				labelWidth = numericLabelEle.getComputedTextLength() > textLabelEle.getComputedTextLength() ? numericLabelEle.getComputedTextLength() : textLabelEle.getComputedTextLength();
			}
			if(labelHeight != -1 && labelBGYPos != -1 && labelWidth != -1) {
				failureLabelBG.attr('x',0).attr('y',labelBGYPos).attr('width',labelWidth).attr('height',labelHeight)
					.attr('transform',failureLabel.attr('transform'));
			}
		}
		//unknown labels
		var unknownLabelBGs = this.barGraphSVG.selectAll("rect.barGraphLabelBG.unknownBG").data(unknownArray);
		unknownLabelBGs = unknownLabelBGs.enter().append('rect').attr('class',function(d) {
			return 'barGraphLabelBG unknownBG ' + d.type; }).merge(unknownLabelBGs);
		var unknownLabels = this.barGraphSVG.selectAll("g.unknownLabel").data(unknownArray);
		unknownLabels = unknownLabels.enter().append("g").attr('class',function(d) {
			return 'unknownLabel '+d.type;
		}).merge(unknownLabels)
		.attr('transform',function(d) {
			var translate = 'translate('+(d3Graphs.barGraphWidth / 3 + 145)+",";
			var value = d3Graphs.barGraphHeight - d3Graphs.barGraphBottomPadding - d3Graphs.cumUnknownLblY - yScale(d.count)/2;
			d3Graphs.cumUnknownLblY += yScale(d.count);
			translate += value+")";
			this.previousUnknownLabelTranslateY = value;
			return translate;
		}).attr('display',function(d) {
			if(d.count == 0) { return 'none';}
			return null;
		});
		unknownLabels.selectAll("*").remove();
		var unknownLabelArray = unknownLabels._groups[0];
		var unknownLabelBGArray = unknownLabelBGs._groups[0];
		for(var i = 0; i < unknownLabelArray.length; i++) {
			var unknownLabelE = unknownLabelArray[i];
			var unknownLabel = d3.select(unknownLabelE);
			var data = unknownArray[i];
			unknownLabel.data(data);
			var pieceHeight = yScale(data.count);
			var labelHeight = -1;
			var labelBGYPos = -1;
			var labelWidth = -1;
			var unknownLabelBG = d3.select(unknownLabelBGArray[i]);
			if(pieceHeight < smallLabelSize) {
				//just add number
				//console.log("small label");
				var numericLabel = unknownLabel.append('text').text(function(d) {
					return d.count;
				}).attr('text-anchor','start').attr('alignment-baseline','central')
				.attr('font-size',function(d) {
					return fontSizeInterpolater((d.count-minMissileCount)/(maxMissileCount - minMissileCount));
				});
				labelHeight = fontSizeInterpolater((data.count-minMissileCount)/(maxMissileCount-minMissileCount));
				labelBGYPos = - labelHeight / 2;
				var numericLabelEle = numericLabel._groups[0][0];
				labelWidth = numericLabelEle.getComputedTextLength();
			} else {
				//number and type
				var numericLabel = unknownLabel.append('text').text(function(d) {
					return d.count;
				}).attr('text-anchor','start').attr('font-size',function(d) {
					return fontSizeInterpolater((d.count-minMissileCount)/(maxMissileCount - minMissileCount));
				});
				var textLabel = unknownLabel.append('text').text(function(d) {
					return missileLookup[d.type].name.toUpperCase();
				}).attr('text-anchor','start').attr('y',15).attr('class',function(d) { return 'unknown '+d.type});
				labelHeight = fontSizeInterpolater((data.count-minMissileCount)/(maxMissileCount-minMissileCount));
				labelBGYPos = -labelHeight;
				labelHeight += 16;
				var numericLabelEle = numericLabel._groups[0][0];
				var textLabelEle = textLabel._groups[0][0];
				labelWidth = numericLabelEle.getComputedTextLength() > textLabelEle.getComputedTextLength() ? numericLabelEle.getComputedTextLength() : textLabelEle.getComputedTextLength();
			}
			if(labelHeight != -1 && labelBGYPos != -1 && labelWidth != -1) {
				unknownLabelBG.attr('x',0).attr('y',labelBGYPos).attr('width',labelWidth).attr('height',labelHeight)
					.attr('transform',unknownLabel.attr('transform'));
			}
		}
		//over all numeric total outcome labels
		var successsesVisible = !$("#outcomeBtns .success .label").hasClass('inactive');
		var failuresVisible = !$("#outcomeBtns .failure .label").hasClass('inactive');
		var unknownVisible = !$("#outcomeBtns .unknown .label").hasClass('inactive');
		var successTotalLabel = this.barGraphSVG.selectAll('text.totalLabel.successTotalLabel').data([1]);
		successTotalLabel.enter().append('text').attr('x',midX).attr('text-anchor','end')
			.attr('class','totalLabel successTotalLabel').attr('y',this.barGraphHeight- this.barGraphBottomPadding + 25)
			.merge(successTotalLabel)
			.text(successTotal).attr('visibility',successsesVisible ? "visible":"hidden");
		var failureTotalLabel = this.barGraphSVG.selectAll('text.totalLabel.failureTotalLabel').data([1]);
		failureTotalLabel.enter().append('text').attr('x',midX+10)
			.attr('class','totalLabel failureTotalLabel').attr('y', this.barGraphHeight - this.barGraphBottomPadding+25)
			.merge(failureTotalLabel)
			.text(failureTotal).attr('visibility',failuresVisible ? "visible":"hidden");
		var unknownTotalLabel = this.barGraphSVG.selectAll('text.totalLabel.unknownTotalLabel').data([1]);
		unknownTotalLabel.enter().append('text').attr('x',midX+120)
			.attr('class','totalLabel unknownTotalLabel').attr('y', this.barGraphHeight - this.barGraphBottomPadding+25)
			.merge(unknownTotalLabel)
			.text(unknownTotal).attr('visibility',unknownVisible ? "visible":"hidden");
		//success label at bottom
		var successLabel = this.barGraphSVG.selectAll('text.successLabel').data([1]);
		successLabel.enter().append('text').attr('x',midX).attr('text-anchor','end').text('SUCCESS')
			.attr('class','successLabel').attr('y', this.barGraphHeight - this.barGraphBottomPadding + 45)
			.merge(successLabel)
			.attr('visibility',successsesVisible ? "visible":"hidden");
		//failure label at bottom
		var failureLabel = this.barGraphSVG.selectAll('text.failureLabel').data([1]);
		failureLabel.enter().append('text').attr('x',midX+10).text('FAILURE')
			.attr('class','failureLabel').attr('y', this.barGraphHeight - this.barGraphBottomPadding + 45)
			.merge(failureLabel)
			.attr('visibility',failuresVisible ? "visible":"hidden");
		//unknown label at bottom
		var unknownLabel = this.barGraphSVG.selectAll('text.unknownLabel').data([1]);
		unknownLabel.enter().append('text').attr('x',midX+95).text('UNKNOWN')
			.attr('class','unknownLabel').attr('y', this.barGraphHeight - this.barGraphBottomPadding + 45)
			.merge(unknownLabel)
			.attr('visibility',unknownVisible ? "visible":"hidden");
	},
	dragHandleStart: function(event) {
		console.log('start');
		event.dataTransfer.setData('text/uri-list','images/yearHandle.png');
		event.dataTransfer.setDragImage(document.getElementById('handle'),0,0);
		event.dataTransfer.effectAllowed='move';
	}
}
