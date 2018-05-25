$(function () {
    //Show and hide child divs with plus
    $(".plus").click(function () {
        //get the current component id
        var id = $(this).attr('data-id');
        //if component is hidden then show only the first child
        if($("div[data-parent-id^='"+id+"']").css('display') == 'none'){ 
            $("div[data-parent-id='"+id+"']").show();
            $(this).html("-"); //change + to -
        } else {
            //component is not hidden then hide all children in the hierarchy
            $("div[data-parent-id^='"+id+"']").hide();
            $("div[data-parent-id^='"+id+"'] > span.plus").html("+");
            $(this).html("+"); //change - to +
        }
    });
});