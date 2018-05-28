$(function () {
    //Show and hide child divs with plus
    $(".plus").click(function () {
        //get the current component id
        var id = $(this).attr('data-id');
        //if component is hidden then show only the first child
        if ($("div[data-parent-id^='" + id + "']").css('display') == 'none') {
            $("div[data-parent-id='" + id + "']").show();
            $(this).html("-"); //change + to -
        } else {
            //component is not hidden then hide all children in the hierarchy
            $("div[data-parent-id^='" + id + "']").hide();
            $("div[data-parent-id^='" + id + "'] > span.plus").html("+");
            $(this).html("+"); //change - to +
        }
    });

    // Create event export link
    $(".export-link").click(function (e) {
        e.preventDefault(); // remove default function

        // send GET request to the server with the requested id
        $.get($(this).attr("href"), function (data) {
            // embed the received data in the hidden link on the page
            $('#downloadFile')
                .attr('href', 'data:text/csv;charset=utf8,' + data)
                .attr('download', 'data.csv');
            //simulate a click on this link
            $('#downloadFile').get(0).click();
        });
    });

    // iterate all div elements witch contains data from database
    $(".component-container").each(function (div) {
        var thisId = ($(this).attr("data-id"));
        var parentId = ($(this).attr("data-parent-id"));

        var nextParentId = '';
        // check attribute data-parent-id and make id to its child
        if(parentId == '0'){
            nextParentId = thisId;
        } else {
            nextParentId = parentId +'-'+thisId;
        }
        // the number of elements with given id
        var currentCount = $("div[data-parent-id='" + nextParentId + "']");
        // if current div doesn't have child elements - hide its plus in html
        if (currentCount.length == 0) {
            $("span.plus[data-id="+nextParentId+"]").hide();
        }
           
    });

});