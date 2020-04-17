
(function ($) {
    'use strict';

    if (typeof jQuery != 'undefined') {  
        // jQuery is loaded => print the version
        var version = jQuery.fn.jquery;

        $("#jquery-text").attr('class', 'text-success');
        $("#jquery-text").html("Jquery version is: " + version);

    }

    $('[data-toggle="tooltip"]').tooltip();

    // begin::message window auto fade out

    var counter = 5;

    setInterval(function () {
        counter--;
        if (counter >= 0) {
            $('.count_number').html(counter);
        }
        if (counter === 0) {
            clearInterval(counter);
            $(".session-message").fadeOut();
        }
    }, 1000);

    $('.count_number').click(function(){
        $('.session-message').fadeOut();
    });

    // end::message window auto fade out

    $(window).on('load',function(){
        
    });

})(jQuery);
