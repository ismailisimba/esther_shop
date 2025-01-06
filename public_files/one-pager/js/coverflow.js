(function ($) {
    $.fn.coverflow = function (options) {
        var isMethodCall = typeof options === 'string' ? true : false;

        if (isMethodCall) {
            var method = options;
            var args = Array.prototype.slice.call(arguments, 1);
        } else {
            var defaults = {
                itemContainer: 'ul', // Container for the flippin' items.
                autoplay: false, 
                autoplay_speed: 1000,
                itemSelector: 'li', // Selector for children of itemContainer to flip
                style: 'coverflow', // Switch between 'coverflow' or 'carousel' display styles
                start: 'center', // Starting item. Set to 0 to start at the first, 'center' to start in the middle or the index of the item you want to start with.

                enableKeyboard: true, // Enable left/right arrow navigation
                enableMousewheel: true, // Enable scrollwheel navigation (up = left, down = right)
                enableTouch: true, // Enable swipe navigation for touch devices

                enableNavButtons: true, // If true, coverflow will insert Previous / Next buttons

                onItemSwitch: function () {}, // Callback function when items are switches
                disableRotation: false
            };
            var settings = $.extend({}, defaults, options);

            var win = $(window);
        }

        return this.each(function () {

            var _coverflow = $(this);
            var methods;

            if (isMethodCall) {
                methods = _coverflow.data('methods');
                return methods[method].apply(this, args);
            }

            var _flipItemsOuter;
            var _flipItems;
            var _flipNav;
            var _flipNavItems;
            var _current = 0;

            var _startTouchX = 0;
            var _actionThrottle = 0;
            var _throttleTimeout;
            var compatibility;
            var autoplay_int = 0;

            // public methods
            methods = {
                jump: jump
            };
            _coverflow.data('methods', methods);
            
            if( settings.autoplay === true ){
            	autoplay_fn('start');
            }

            function removeThrottle() {
                _actionThrottle = 0;
            }

            function resize() {
                _flipItemsOuter.height(calculateBiggestFlipItemHeight());
                _coverflow.css("height", "auto");
                if (settings.style === 'carousel') {
                    _flipItemsOuter.width(_flipItems.width());
                }
            }

            function calculateBiggestFlipItemHeight() {
                var biggestHeight = 0;
                _flipItems.each(function () {
                    if ($(this).height() > biggestHeight) biggestHeight = $(this).height();
                });
                return biggestHeight;
            }


            function updateNav() {
                if (_flipItems.length > 1) {
                    currentItem = $(_flipItems[_current]);
                    
                    _coverflow.find('#coverflow-current').text( _current + 1)
                }
            }

            function buildNavButtons() {
                if (settings.enableNavButtons && _flipItems.length > 1) {
                    _coverflow.find(".coverflow-controls").remove();
					
					var autoplay_icon = '<i class="fa fa-play"></i>';
					if( settings.autoplay === true ){
						autoplay_icon = '<i class="fa fa-pause"></i>';
					}
					var controls = $("<div class='coverflow-controls'></div>"),
						autoplay = $("<a href='#' class='coverflow-autoplay'>" + ( autoplay_icon ) + "</a>"),
						prev_btn = $("<a href='#' class='coverflow-prev'><i class='fa fa-angle-left'></i></a>"),
						next_btn = $("<a href='#' class='coverflow-next'><i class='fa fa-angle-right'></i></a>"),
						info_box = $("<div class='coverflow-info'><span id='coverflow-current'>1</span>/<span id='coverflow-totals'>" + ( _flipItems.length ) + "</span></div>");;
						
					controls.append( autoplay );
					controls.append( prev_btn );
					controls.append( info_box );
					controls.append( next_btn );
                    _coverflow.append( controls );

                    _coverflow.find('.coverflow-prev').on("click", function (e) {
                        e.preventDefault();
                        
                        autoplay_fn('stop');
                        jump("left");
                    });

                    _coverflow.find('.coverflow-next').on("click", function (e) {
                        e.preventDefault();
                        
                        autoplay_fn('stop');
                        jump("right");
                    });
                    
                    _coverflow.find('.coverflow-autoplay').on("click", function (e) {
                        e.preventDefault();
                        
                        var that = $(this),
                        	has_play_icon = ( that.find('.fa-play').size() > 0 ) ? true : false;
                        
                        if( has_play_icon ){
                        	autoplay_fn('start');
                        }
                        else{
                        	autoplay_fn('stop');
                        }
                    });
                }
            }

            function center() {
                var currentItem = $(_flipItems[_current]).addClass("flip-current");

                _flipItems.removeClass("flip-prev flip-next flip-current flip-past flip-future no-transition");

                if (settings.style === 'carousel') {

                    _flipItems.addClass("flip-hidden");

                    var nextItem = $(_flipItems[_current + 1]),
                        futureItem = $(_flipItems[_current + 2]),
                        prevItem = $(_flipItems[_current - 1]),
                        pastItem = $(_flipItems[_current - 2]);

                    if (_current === 0) {
                        prevItem = _flipItems.last();
                        pastItem = prevItem.prev();
                    } else if (_current === 1) {
                        pastItem = _flipItems.last();
                    } else if (_current === _flipItems.length - 2) {
                        futureItem = _flipItems.first();
                    } else if (_current === _flipItems.length - 1) {
                        nextItem = _flipItems.first();
                        futureItem = $(_flipItems[1]);
                    }

                    futureItem.removeClass("flip-hidden").addClass("flip-future");
                    pastItem.removeClass("flip-hidden").addClass("flip-past");
                    nextItem.removeClass("flip-hidden").addClass("flip-next");
                    prevItem.removeClass("flip-hidden").addClass("flip-prev");

                } else {
                    var spacer = (currentItem.outerWidth() / 2) - 100;
                    var totalLeft = 0;
                    var totalWidth = _flipItemsOuter.width();
                    var currentWidth = currentItem.outerWidth();
                    var currentLeft = (_flipItems.index(currentItem) * currentWidth) / 2 + spacer / 2;

                    _flipItems.removeClass("flip-hidden");

                    for (i = 0; i < _flipItems.length; i++) {
                        var thisItem = $(_flipItems[i]);
                        var thisWidth = thisItem.outerWidth();

                        if (i < _current) {
                            thisItem.addClass("flip-past")
                                .css({
                                    "z-index": i,
                                    "left": (i * thisWidth / 2) + "px"
                                });
                        } else if (i > _current) {
                            thisItem.addClass("flip-future")
                                .css({
                                    "z-index": _flipItems.length - i,
                                    "left": (i * thisWidth / 2) + spacer + "px"
                                });
                        }
                    }

                    currentItem.css({
                        "z-index": _flipItems.length + 1,
                        "left": currentLeft + "px"
                    });

                    totalLeft = (currentLeft + (currentWidth / 2)) - (totalWidth / 2);
                    var newLeftPos = -1 * (totalLeft) + "px";
                    /* Untested Compatibility */
                    if (compatibility) {
                        var leftItems = $(".flip-past");
                        var rightItems = $(".flip-future");
                        $(".flip-current").css("zoom", "1.0");
                        for (i = 0; i < leftItems.length; i++) {
                            $(leftItems[i]).css("zoom", (100 - ((leftItems.length - i) * 5) + "%"));
                        }
                        for (i = 0; i < rightItems.length; i++) {
                            $(rightItems[i]).css("zoom", (100 - ((i + 1) * 5) + "%"));
                        }

                        _flipItemsOuter.animate({
                            "left": newLeftPos
                        }, 333);
                    } else {
                        _flipItemsOuter.css("left", newLeftPos);
                    }
                }

                currentItem
                    .addClass("flip-current")
                    .removeClass("flip-prev flip-next flip-past flip-future flip-hidden");

                resize();
                updateNav();
                settings.onItemSwitch.call(this);
            }
            
            function autoplay_fn( state ) { 
            	if( state == 'start' ){
            		autoplay_int = setInterval(function(){
            			autoplay_next();
            		}, settings.autoplay_speed );
            		
            		_coverflow.find('.coverflow-autoplay').html('<i class="fa fa-pause"></i>');
            	}
            	else{
            		clearInterval(autoplay_int);
            		_coverflow.find('.coverflow-autoplay').html('<i class="fa fa-play"></i>');
            	}
            }
            
            function autoplay_next()
            {
            	var _next = _current + 1;
            	if( _current > (_flipItems.length - 2) ){
            		_next = 0;
            	} 
            	jump( _next, true ); 
            }

            function jump(to, from_autoplay) {
                if (_flipItems.length > 1) {
                	if( autoplay_int > 0 && from_autoplay != true ){
                		clearInterval(autoplay_int);
            			_coverflow.find('.coverflow-autoplay').html('<i class="fa fa-play"></i>');
                	}
                    if (to === "left") {
                        if (_current > 0) {
                            _current--;
                        } else {
                            _current = _flipItems.length - 1;
                        }
                    } else if (to === "right") {
                        if (_current < _flipItems.length - 1) {
                            _current++;
                        } else {
                            _current = 0;
                        }
                    } else if (typeof to === 'number') {
                        _current = to;
                    } else {
                        // if object is sent, get its index
                        _current = _flipItems.index(to);
                    }
                    center();
                }
            }

            function init() {

                // Basic setup
                _coverflow.addClass("coverflow coverflow-active coverflow-" + settings.style).css("visibility", "hidden");
                if (settings.disableRotation)
                    _coverflow.addClass('no-rotate');
                _flipItemsOuter = _coverflow.find(settings.itemContainer).addClass("flip-items");
                _flipItems = _flipItemsOuter.find(settings.itemSelector).addClass("flip-item flip-hidden").wrapInner("<div class='flip-content' />");

                //Browsers that don't support CSS3 transforms get compatibility:
                var isIEmax8 = ('\v' === 'v'); //IE <= 8
                var checkIE = document.createElement("b");
                checkIE.innerHTML = "<!--[if IE 9]><i></i><![endif]-->"; //IE 9
                var isIE9 = checkIE.getElementsByTagName("i").length === 1;
                if (isIEmax8 || isIE9) {
                    compatibility = true;
                    _flipItemsOuter.addClass("compatibility");
                }


                // Insert navigation if enabled.
                buildNavButtons();


                // Set the starting item
                if (settings.start && _flipItems.length > 1) {
                    // Find the middle item if start = center
                    if (settings.start === 'center') {
                        if (!_flipItems.length % 2) {
                            _current = _flipItems.length / 2 + 1;
                        } else {
                            _current = Math.floor(_flipItems.length / 2);
                        }
                    } else {
                        _current = settings.start;
                    }
                }


                // initialize containers
                resize();


                // Necessary to start coverflow invisible and then fadeIn so height/width can be set accurately after page load
                _coverflow.hide().css("visibility", "visible").fadeIn(400, function () {
                    center();
                });


                // Attach event bindings.
                win.resize(function () {
                    resize();
                    center();
                });


                // Navigate directly to an item by clicking
                _flipItems.on("click", function (e) {
                    if (!$(this).hasClass("flip-current")) {
                        e.preventDefault();
                    }
                    jump(_flipItems.index(this));
                });


                // Keyboard Navigation
                if (settings.enableKeyboard && _flipItems.length > 1) {
                    win.on("keydown.coverflow", function (e) {
                        _actionThrottle++;
                        if (_actionThrottle % 7 !== 0 && _actionThrottle !== 1) return; //if holding the key down, ignore most events

                        var code = e.which;
                        if (code === 37) {
                            e.preventDefault();
                            jump('left');
                        } else if (code === 39) {
                            e.preventDefault();
                            jump('right');
                        }
                    });

                    win.on("keyup.coverflow", function (e) {
                        _actionThrottle = 0; //reset action throttle on key lift to avoid throttling new interactions
                    });
                }


                // Mousewheel Navigation
                if (settings.enableMousewheel && _flipItems.length > 1) { // TODO: Fix scrollwheel on Firefox
                    _coverflow.on("mousewheel.coverflow", function (e) {
                        _throttleTimeout = window.setTimeout(removeThrottle, 500); //throttling should expire if scrolling pauses for a moment.
                        _actionThrottle++;
                        if (_actionThrottle % 4 !== 0 && _actionThrottle !== 1) return; //throttling like with held-down keys
                        window.clearTimeout(_throttleTimeout);

                        if (e.originalEvent.wheelDelta / 120 > 0) {
                            jump("left");
                        } else {
                            jump("right");
                        }

                        e.preventDefault();
                    });
                }


                // Touch Navigation
                if (settings.enableTouch && _flipItems.length > 1) {
                    _coverflow.on("touchstart.coverflow", function (e) {
                        _startTouchX = e.originalEvent.targetTouches[0].screenX;
                    });

                    _coverflow.on("touchmove.coverflow", function (e) {
                        e.preventDefault();
                        var nowX = e.originalEvent.targetTouches[0].screenX;
                        var touchDiff = nowX - _startTouchX;
                        if (touchDiff > _flipItems[0].clientWidth / 1.75) {
                            jump("left");
                            _startTouchX = nowX;
                        } else if (touchDiff < -1 * (_flipItems[0].clientWidth / 1.75)) {
                            jump("right");
                            _startTouchX = nowX;
                        }
                    });

                    _coverflow.on("touchend.coverflow", function (e) {
                        _startTouchX = 0;
                    });
                }
            }


            // Initialize if coverflow is not already active.
            if (!_coverflow.hasClass("coverflow-active")) {
                init();
            }
        });
    };
})(jQuery);