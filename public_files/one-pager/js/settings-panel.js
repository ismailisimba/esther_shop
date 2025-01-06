(function($) {"use strict";

	function getQueryVariable(variable) 
	{
	    var query = window.location.search.substring(1);
	    var vars = query.split('&');
	    for (var i = 0; i < vars.length; i++) {
	        var pair = vars[i].split('=');
	        if (decodeURIComponent(pair[0]) == variable) {
	            return decodeURIComponent(pair[1]);
	        }
	    }
	}

	$(document).ready(function($) {
		$("#styles_panel .open-button, #styles_panel .close-button").click(function() {
			if ($("#styles_panel .open-button").is(":visible")) {
				$("#styles_panel .open-button").animate({
					"left" : "-300px"
				}, 500, function() {
					$(this).hide();
				});
				$("#styles_panel .options").animate({
					"left" : "0px"
				}, 500).show();
			} else {
				$("#styles_panel .options").animate({
					"left" : "-300px"
				}, 500, function() {
					$(this).hide();
				});
				$("#styles_panel .open-button").show().animate({
					"left" : "0"
				}, 500);
			}
		});
		$('#black-menu').on('click', function() {
			$('#navbar-top').removeClass('navbar-default').addClass('navbar-inverse')
		});
		$('#white-menu').on('click', function() {
			$('#navbar-top').removeClass('navbar-inverse').addClass('navbar-default')
		});
		$('#black-back').on('click', function() {
			$('body').addClass('body-inverse')
		});
		$('#white-back').on('click', function() {
			$('body').removeClass('body-inverse')
		});
		$("#main-color li").bind('click', function() {
			var color_name = $(this).data('color-name');
			
			$("head").find("#change-color").remove();
			$('<link rel="stylesheet" id="change-color" type="text/css" href="css/colors/' + ( color_name ) + '.css?' + ( Math.random(0, 10000)) + '" >')
   				.appendTo("head");
    
			//$('body').attr('data-body-class', color_name);
		});
		
		var header = window.location.href.split("PT/"),
			header = header[1].replace(".html", '');
		$("#main-slider").find("option[value='" + ( header ) + "']").prop('selected', true);

		$("#main-slider").change(function(e){
			e.preventDefault();
			
			var that = $(this),
				new_slide = that.val(),
				curr_slide = '',
				base_url = window.location.href.split("?"),
				new_url = base_url[0].split("PT/"),
				new_url = new_url[0];
				
				if( new_slide == '' ){ 
					new_slide = 'index';
				}
				if( new_slide != "" ){
					new_url = new_url + "PT/" + new_slide + '.html';
				}
				
				window.location = new_url;
				return;
		});
	});
})(jQuery); 