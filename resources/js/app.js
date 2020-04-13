
(function ($) {
    'use strict';

    if (typeof jQuery != 'undefined') {  
        // jQuery is loaded => print the version
        var version = jQuery.fn.jquery;

        $("#jquery-text").attr('class', 'text-success');
        $("#jquery-text").html("Jquery version is: " + version);

    }

    $('[data-toggle="tooltip"]').tooltip();

    setTimeout(function() {
        $('#session-message').fadeOut('slow');
    }, 2000); // <-- time in milliseconds

    $(window).on('load',function(){
        
    });

})(jQuery);
