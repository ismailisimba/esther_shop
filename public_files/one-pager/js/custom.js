(function($) {
	"use strict";
	
	var __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    __slice = [].slice;
    
	// define the main helpers
	var $window = $(window),
		isTouch = __indexOf.call(window, 'ontouchstart') >= 0,
		windows_height = $window.height(),
		windows_width = $window.width(),
		menu_type = 'static',
		$windowHeight, $pageHeight, $footerHeight, $ctaHeight,
		$scrollTop;
		
	function load_html( html_url, response_box )
	{
		$.post(
			html_url,
			function(response) {
				
				// show if need
				response_box.show();
				
				var ajax_pos = response_box.position();

				// write the response into ajax container 
				response_box.html( response );
				
				// scroll down to the new container
				$('html, body').animate({
					scrollTop: ( ajax_pos.top - 70 ) + "px"
				}, 450);
				
				$("a[rel^='prettyPhoto']").prettyPhoto({
			    	social_tools: null,
			    	deeplinking: false
			    });
			}
		);
	}
	
	// Smooth Scrolling
	function niceScrollInit()
	{
		$("html").niceScroll({
			scrollspeed: 60,
			mousescrollstep: 40,
			cursorwidth: 15,
			cursorborder: 0,
			cursorcolor: '#303030',
			cursorborderradius: 6,
			autohidemode: false,
			horizrailenabled: false
		});

		if($('#boxed').length == 0){
			$('body').css('padding-right','16px');
		}
		
		$('html').addClass('no-overflow-y');
	}
	
	function topmenu_observer()
	{
		// fixed or static tot menu
		var scroll_pos = $(window).scrollTop();
		if( scroll_pos >= $(window).height() ){
			$("#navbar-top .pt_navbar").addClass('pt_navbar-fixed');
			menu_type = 'fixed';
		}
		
		if( menu_type == 'fixed' && scroll_pos <= windows_height ){
			$("#navbar-top .pt_navbar").removeClass('pt_navbar-fixed');
			menu_type = 'static';
		}
	}
	
	// Smooth scroll for in page links
	function smooth_scroll_in_page()
	{
		var target, scroll;
		
	    $("a[href*=#]:not([href=#]), a.the-image").on("click", function(e) {
	    	if( typeof($(this).attr('href')) == 'undefined' ){
	    		target = $("[id=" + $(this).attr('xlink:href').replace("#", '') + "]");
	    	}else{
	    		target = $("[id=" + $(this).attr('href').replace("#", '') + "]");
	    	}
            
            if (target.length) {
               
                e.preventDefault();
              
                var avail = $(document).height() - $(window).height();
                scroll = $(target).position().top;
              
                if (scroll > avail) {
                    scroll = avail;
                }
				
				$('html, body').animate({
					scrollTop: ( scroll - 80 ) + "px"
				}, 450);
            }
	    });
	}
	
	function SendMail( that )
	{
	    var isValid = true;
	    var btn = that.find('.form-submit'),
	    	old_value = btn.val();
	    var emailReg = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/;
	    if(!emailReg.test($('#contact-email').val()) || $('#contact-email').val() == ""){
	        isValid = false;
	        alert('Your email is not in valid format');
	    }
	    
	    if( isValid ){
	    	btn = btn.val('Sending email ...');
	    }
		
	    if(isValid){
	        var params = {
	            'name'      : $('#contact-name').val(),
	            'email'     : $('#contact-email').val(),
	            'subject'   : 'Email from PT',
	            'message'   : $('#contact-message').val()
	        };
	        jQuery.ajax({
	            type: "POST",
	            url: "php/emailHandler.php",
	            data: params,
	            success: function(response){
	                if(response){
	                    var responseObj = jQuery.parseJSON(response);
	                    alert( responseObj.status );
	                }
	                
	                btn = btn.val( old_value );
	            },
	            error: function (xhr, ajaxOptions, thrownError){
	                //xhr.status : 404, 303, 501...
	                var error = null;
	                switch(xhr.status)
	                {
	                    case "301":
	                        error = "Redirection Error!";
	                        break;
	                    case "307":
	                        error = "Error, temporary server redirection!";
	                        break;
	                    case "400":
	                        error = "Bad request!";
	                        break;
	                    case "404":
	                        error = "Page not found!";
	                        break;
	                    case "500":
	                        error = "Server is currently unavailable!";
	                        break;
	                    default:
	                        error ="Unespected error, please try again later.";
	                }
	                if(error){
	                    alert(error);
	                }
	            }
	        });
	    }
	}

	// Image with Animation / Col Animation
	function animations()
	{
		$('.has-animation').onScreen({
			container: window,
			direction: 'vertical',
			doIn: function() {
				var that = $(this);
				that.delay(that.attr('data-delay')).animate({
					'opacity' : 1
				}, 800,'easeOutSine');
			},
			tolerance: 0,
			throttle: 50,
			toggleClass: 'onScreen',
			debug: false
		});
	}
	
	function menu_selection()
	{
		$("#main-nav").find("a").each(function(i){
			var that = $(this);
			$(that.attr('href')).onScreen({
				container: window,
				direction: 'vertical',
				doIn: function() {
					var that = $(this);
					
					// find menu item for current item 
					$("#main-nav").find('.active').removeClass('active');
					$("#main-nav").find('a[href$="#' + ( that.attr('id') ) + '"]').parent('li').addClass('active');
				},
				tolerance: 200,
				throttle: 50,
				toggleClass: 'onScreen',
				debug: false
			});
		});
	}
	
	function nice_scroll()
	{
		/// make sure to init smooth scrolling after slider height exists
		var $smoothActive = $('body').attr('data-smooth-scrolling'); 
		var $smoothCache = ( $smoothActive == 1 ) ? true : false;
		if (
				$(window).width() > 690 && 
				$('body').outerHeight(true) > $(window).height() && !navigator.userAgent.match(/(Android|iPod|iPhone|iPad|IEMobile|Opera Mini)/)
		) {
		    niceScrollInit();
		} else {
		    $('body').attr('data-smooth-scrolling', '0');
		}
	}
	
	function layoutFix()
	{
		$('#welcome').css({
			height: $(window).height()
		});
		
		$('.blurImageContainer').gaussianBlur({
			deviation: 2.6 // level of blur
		});
		
        $(".blog-list-div article .post-thumb").each(function(){
			var that = $(this);
			
			that.find('.blog-overlay').css({
				'width': that.width() - 2,
				'height': that.height() - 1,
			});
		});
	}
		
	function calcToTopColor(){
		$scrollTop = $(window).scrollTop();
		$windowHeight = $(window).height();
		$pageHeight = $('body').height();
		$footerHeight = $('#footer-outer').height();
		$ctaHeight = ($('#call-to-action').length > 0) ? $('#call-to-action').height() : 0;
		
		if( ($scrollTop-35 + $windowHeight) >= ($pageHeight - $footerHeight) && $('#boxed').length == 0){
			$('#to-top').addClass('dark');
		}
		
		else {
			$('#to-top').removeClass('dark');
		}
	}
	
	function showToTop()
	{
		if( $scrollTop > 350 ){

			$('#to-top').stop(true,true).animate({
				'bottom' : '17px'
			},350,'easeInOutCubic');	
			
			$(window).unbind('scroll',showToTop);
			$(window).bind('scroll',hideToTop);
		}
	}
	
	function hideToTop()
	{
		if( $scrollTop < 350 ){
	
			$('#to-top').stop(true,true).animate({
				'bottom' : '-30px'
			},350,'easeInOutCubic');	
			
			$(window).unbind('scroll',hideToTop);
			$(window).bind('scroll',showToTop);	
		}
	}
	
	function triggers()
	{
		layoutFix();
		menu_selection();
		smooth_scroll_in_page();
		animations();
		nice_scroll();
		$window.scroll(topmenu_observer);
		
		
		$("body").on('click', '#toggle-nav', function(e){
			e.preventDefault();
			
			var nav_menu = $("#navbar-top .pt_navbar ul");
			
			if( nav_menu.height() < 10 ){
				nav_menu.addClass('open_menu');
			}else{
				nav_menu.removeClass('open_menu');
			}
		});
		
		$(".blog-list-div").on('click', 'a.pt_load_html', function(e){
			e.preventDefault();
			 
			load_html( $(this).prop('href'), $("#blog-details"));
		});
		
		$("#portfolio").on('click', 'a.pt_load_html', function(e){
			e.preventDefault();
			 
			load_html( $(this).prop('href'), $("#pt_portfolio_ajax_response"));
		});
		
		$(".div_ajax_container").on('click', 'a.pt_close_div_btn', function(e){
			e.preventDefault();
			
			var that = $(this),
				parent = that.parents(".div_ajax_container");
			
			parent.slideUp(400, function(){
				parent.html('');
			});
		});
		
		$("#blog-details").on('click', 'a.pt_close_div_btn', function(e){
			e.preventDefault();
			
			var that = $(this),
				parent = that.parents("#blog-details");
			
			parent.slideUp(400, function(){
				parent.html('');
			});
		});
		
		// slide the testimonials
		$(".the-testimonials-list").owlCarousel({
			autoPlay : 4000,
			navigation : false,
			pagination : true,
			singleItem: true,
		});
		
		$(".coverflow").coverflow();
		
		// Revolution Slider
	    var revapi = $('.tp-banner').revolution(
		{	
			delay: 929000,
			startwidth: windows_width,
			startheight: windows_height,
			hideThumbs: 10,
			fullWidth: "off",
			fullScreen: "on",
			navigationVOffset: 80,
			fullScreenAlignForce:"on",
			fullScreenOffsetContainer: ""
		});
		
		var revapiVideo = $('.tp-banner-video').revolution(
		{
			delay:9000,
			startwidth: windows_width,
			startheight: windows_height,
			fullWidth: "off",
			fullScreen: "on",
			fullScreenAlignForce:"on",
			//minFullScreenHeight:"320",
			videoJsPath:"rs-plugin/videojs/",
			fullScreenOffsetContainer: ""
		});
		
		// contact form
		$(".contact-form").submit(function(e){
			e.preventDefault();
			
			SendMail( $(this) );
		});
		
		
		var $scrollTop = $(window).scrollTop();

		// starting bind
		if( $('#to-top').length > 0 && $(window).width() > 1020) {
			
			if($scrollTop > 350){
				$(window).bind('scroll', hideToTop);
			}
			else {
				$(window).bind('scroll', showToTop);
			}
		}
		
		// to top color
		if( $('#to-top').length > 0 ) {
			//calc on scroll
			$(window).scroll(calcToTopColor);
			
			//calc on resize
			$(window).resize(calcToTopColor);
		}
		
		// scroll up event
		$('#to-top').click(function(){
			$('body,html').stop().animate({
				scrollTop:0
			},800,'easeOutQuad')
			return false;
		});
		
		$('a.tipsy-trigger').tipsy({
			fade: true, 
			gravity: 'n'
		});
	}
	
	$(window).bind('resize', function(e){
	    window.resizeEvt;
	    $(window).resize(function(){
	        clearTimeout(window.resizeEvt);
	        window.resizeEvt = setTimeout(function(){
	        	layoutFix();
	        }, 350);
	    });
	});
	
	$(document).ready(function()
	{
		// call the triggers observer	
		triggers();
	});
	
	$(window).load(function()
	{
		layoutFix();
		
		$('.doc-loader').fadeOut('fast');
		
		$('#pt_masonry').isotope({
		    itemSelector: '.pt_classes_item',
		    masonry: {
		    	columnWidth: 1
		    }
		});
		$("#pt_masonry .masonry-item").each(function(){
			var that = $(this);
			that.find('.overlay').css({
				'width': that.width() - 2,
				'height': that.height() - 2,
			});
		});
		
		var isotope_container = $('.pt_portfolio_grid');
        isotope_container.isotope({
            itemSelector : '.portfolio-item',
            resizable: true, // disable normal resizing
            transformsEnabled: true,
            masonry: { columnWidth: '1' }
        });
        
        $('.portfolio-filter a').click(function(){
            $('.portfolio-filter a').removeClass('active');
            $(this).addClass('active');
            var selector = $(this).attr('data-filter');
            isotope_container.isotope({ filter: selector });
            return false;
        });
	});
	
})(jQuery);

if (typeof console === "undefined") {
    console = {};
    if (typeof console.log === "undefined") console.log = function (msg) {}
}