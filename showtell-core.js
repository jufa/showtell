var showtell = (function($){
	var $container; //reference to the slide container
	var $slideList;
	var slideCount;
	var currentSlide=0;
	var me = this;
	var offScreenX=1024;
	var xSpeed=500;
	var animating = 0;
	var paused = false;
	var targetSlide;
	var $scrollTarget

	var scrollTop = function(){
	}
	return {
		handleBtnNext: function(e){
			paused = true;
			if(currentSlide<slideCount-1) {
				showtell.gotoSlide(currentSlide+1);
			} else {
				//if we were in automatic slider mode, we want to wrap if the user hits next
				if(automatic){
					showtell.skiptoSlide(0);
				}
			}
			e.preventDefault();
		},
		handleBtnPrev: function(e){
			paused = true;
			if(currentSlide>0) {
				showtell.gotoSlide(currentSlide-1);
			} else {
				if(automatic){
					showtell.skiptoSlide(slideCount-1);
				}
			}
			e.preventDefault();
		},
		handleBtnPlay: function(e){
			paused = false;
			showtell.updateControls();
			e.preventDefault();
		},
		handleBtnPause: function(e){
			paused = true;
			showtell.updateControls();
			e.preventDefault();
		},
		handleShowContents: function (e) {
			$('#relative').hide();
			$('.slide').hide();
			$('.toc').show();
			showtell.scrollUp();
			$('#wrapper').css('width','100%');
			$('#wrapper').css('height','100%');
			e.preventDefault();
			
		},
		handleFullscreen: function(e) {
			console.log("Attempting FULLSCREEEEEEN "+ $(window).width() );
			var elem = document.getElementById("wrapper");
			/*
			if (elem.requestFullscreen) {
			  elem.requestFullscreen();
			} else if (elem.mozRequestFullScreen) {
			  elem.mozRequestFullScreen();
			} else if (elem.webkitRequestFullscreen) {
			  elem.webkitRequestFullscreen();
			}
			*/
			//$('#wrapper').css({'max-width':'100%'});
			//$('#wrapper').css({'box-shadow':'none' });
			
			$('#wrapper').css('max-width', $(window).width() );
			$('#wrapper').css({'max-height': $(window).height() });
			$('#container').css({'min-height': $(window).height() - $('#navigation').height() - $('#fipsbar').height() - $('.progress').height() });
			//relayout offstage slides to a revised offsteage value:
			offScreenX = $(window).width();
			//want to scroll up to fips instead of container top:
			$scrollTarget = $('#wrapper');
			//reflow slides:
			showtell.skiptoSlide(currentSlide);
			e.preventDefault();
		},
		handleHideContents: function (e) {
			hideContents();
			showtell.scrollUp();
			e.preventDefault();
		},
		hideContents: function () {
			$('#relative').show();
			$('.slide').eq(currentSlide).show();
			$('.toc').hide();
		},
		handleContentsClick: function (e) {
			//get link and goto that slide
			showtell.skiptoSlide($(this).attr('href'),true);
			e.preventDefault();
		},
		handleTouchstart: function (e){
			e.preventDefault();
		},
		updateProgressBar: function(target){
			var $ref = $('.progress');
			var w = 100.0 / parseFloat(slideCount);
			console.log('pct:'+w);
			$ref.css('width',parseInt(w)+'%');
			$ref.animate({'margin-left': w*target+'%'},xSpeed);
		},
		init: function(slideContainer){
			if(slideContainer.attr("automatic") != undefined){
				automatic = true;
				timeOnSlide = parseInt(slideContainer.attr("automatic"));
				if(timeOnSlide <= xSpeed) automatic = false; //no transition pause allowed that is <= than transition time in msec		
			} else {
				automatic = false;
			}
			//offScreenX = $('#wrapper').width();
			$container = slideContainer;
			$slideList = $container.find('.slide');
			slideCount = $slideList.length;
			console.log("init: slides found: "  + slideCount);
			$slideList.css('left',offScreenX+'px');
			$slideList.hide();
			//add button listeners
			$('#navigation').find('.next').on('click', this.handleBtnNext);
			$('#navigation').find('.prev').on('click', this.handleBtnPrev);
			$('#navigation').find('.contents').on('click', this.handleShowContents);
			$('#navigation').find('.home').on('click', this.handleFullscreen);
			$('#navigation').find('.play').on('click', this.handleBtnPlay);
			$('#navigation').find('.pause').on('click', this.handleBtnPause);
			showtell.updateControls();
			//where do we scroll up to when a slide changes?:
			$scrollTarget = $('#container');
			//$('#container').on('touchstart', this.handleTouchstart); 
			showtell.startTimer();//nothing will happen if automatic is not set;
			showtell.setupContentsSlide();
			showtell.skiptoSlide(0);	
		},
		updateControls: function(){
			//if auto...
			if(automatic==true){
				$('.home').hide();
				$('.contents').hide();
				if(paused==true){
					$('.pause').hide();
					$('.play').show();
				} else {
					$('.pause').show();
					$('.play').hide();
				}
			} else {
				$('.pause').hide();
				$('.play').hide();
				$('.home').show();
				$('.contents').show();
				$('.next').show();
				$('.prev').show();
			}
		},
		startTimer:function(){
			if(automatic==false) return;
			setInterval(showtell.slideshowNext, timeOnSlide);
		},
		slideshowNext:function(){
			if (paused==true) return;
			if(currentSlide < slideCount-1) showtell.gotoSlide(currentSlide+1);
			else showtell.skiptoSlide(0);
		},
		scrollUp: function(callback){
			callback = callback || null;
			var scrolledPx = Math.max($('html').scrollTop(), $('body').scrollTop());
			console.log( scrolledPx + ",   " + $scrollTarget.offset().top);
			if( parseInt(scrolledPx) > parseInt($scrollTarget.offset().top)) {
				$('body,html').animate({
					scrollTop: $scrollTarget.offset().top
				}, 200, callback);
			} else {
				if (callback != null) callback();
			}
		},
		transitionComplete: function(){
			console.log("trans");
			$('#container').css('overflow-y','visible');
			$slideList.eq(currentSlide).hide(); 
			currentSlide = targetSlide;
			$slideList.eq(targetSlide).css('position','relative');
			animating = 0; 
		},
		setupContentsSlide: function() {
			var lbl="";
			for (var i=0;i<slideCount;i++) {
				lbl = $slideList.eq(i).find('h3').html();
				$('.toc').append('<a href="'+i+'">'+lbl+'</a>');
			}
			$('.toc').find('a').on('click', showtell.handleContentsClick);
			$('.toc').hide();
		},
		skiptoSlide: function (tgtSlide){
			if (animating==1) return;
			animating = 1;
			$('#container').css('overflow-y','hidden');
			targetSlide=parseInt(tgtSlide);
			showtell.hideContents();
			
			console.log("skiptoSlide: "  + targetSlide+"/"+slideCount);
			$slideList.eq(targetSlide).show();
			$slideList.eq(targetSlide).css('position','absolute');
			for (var i=0;i<slideCount;i++){
				if(i < targetSlide){
					$slideList.eq(i).css('position','absolute');
					$slideList.eq(i).css('left', -offScreenX+'px');
					$slideList.eq(i).hide();
				} else if (i == targetSlide){
					$slideList.eq(i).css('left', '0px');
				} else if (i > targetSlide) {
					$slideList.eq(i).css('position','absolute');
					$slideList.eq(i).hide();
					$slideList.eq(targetSlide).css('left', '0px');
					$slideList.eq(i).css('left', offScreenX+'px');
				}
			}
			$slideList.eq(targetSlide).css('left', '0px');
			
			$('#container').css('overflow-y','visible');
			currentSlide = targetSlide;
			$slideList.eq(targetSlide).css('position','relative');
			showtell.scrollUp();
			showtell.updateProgressBar(targetSlide);
			animating = 0;
		},
		animationNextSlide:function(){
			$slideList.eq(targetSlide).delay(xSpeed).animate({left: '0px'}, xSpeed, showtell.transitionComplete);
			$slideList.eq(currentSlide).delay(xSpeed).animate({left: -offScreenX+'px'}, xSpeed);
		},
		animationPrevSlide:function(){
			$slideList.eq(targetSlide).delay(xSpeed).animate({left: '0px'}, xSpeed, showtell.transitionComplete);
			$slideList.eq(currentSlide).delay(xSpeed).animate({left: offScreenX+'px'}, xSpeed);
		},
		
				
		gotoSlide: function(tgtSlide) {
			if (animating==1) return;
			animating = 1;
			targetSlide=parseInt(tgtSlide);
			$('#container').css('overflow-y','hidden');
			console.log("gotoSlide: "  + targetSlide+"/"+slideCount);
			$slideList.eq(targetSlide).show();
			$slideList.eq(currentSlide).css('position','absolute');
			$slideList.eq(targetSlide).css('position','absolute');
			if(currentSlide < targetSlide){
				//$slideList.eq(targetSlide).addClass('.stageRight');
				showtell.scrollUp(showtell.animationNextSlide);
			} else if (currentSlide == targetSlide){
				$slideList.eq(currentSlide).css('left', '0px');
				animating=0;
			} else {
				showtell.scrollUp(showtell.animationPrevSlide);	
			}
			showtell.updateProgressBar(targetSlide);

			//currentSlide = tgtSlide;
			
			//$slideList.eq(tgtSlide).css('position','relative');
			
				
		}
		
			

	};	//end public methods
	})($);
	
	




