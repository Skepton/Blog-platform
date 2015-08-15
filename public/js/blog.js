/* Functions */
function postComment(form){
    
    $('#commentPostForm button[type="submit"]').find('i').addClass('hide');
    $('#commentPostForm button[type="submit"]').find('.preloader-wrapper').addClass('active').removeClass('hide');
    
    $.ajax({
        url: $(form).attr('action'),
        type: 'POST',
        data: $(form).serialize(),
        complete: function(response){
            
            if(response.statusText === 'OK'){
            
                setTimeout(function(){
                    
                    Materialize.toast('Your Article Was Saved!', 4000);
                
                    $('#commentPostForm button[type="submit"]').find('i').removeClass('hide');
                    $('#commentPostForm button[type="submit"]').find('.preloader-wrapper').removeClass('active').addClass('hide');
                    
                    var article = articleId;
                    loadComments(article);
                
                }, 500);
            
            }else {
                
                Materialize.toast('<span class="red-text">Your Article Was NOT Saved!</span>', 4000);
                
            }
            
        },
    });
    
}

function loadComments(article){
    
    $.ajax('/loadComments/'+article, {
        success: function(response){
            $('#comment-content').html(response);
        }
    });
    
}

/* Events */

$(document).on('ready', function(){
    
    var article = articleId;
    loadComments(article);
    $(window).trigger('resize');
    
    $('.parallax').parallax();
    
    $(document).on('click', '#comment-content .reply', function(){
        $('#comment-content article.selected').removeClass('selected');
        var parent = $(this).parents('article').addClass('selected').data('id');
        var username = $(this).parents('article').find('.author').text();
        $('#commentParent').val(parent);
        $('#comment-content #commentArea').focus();
        $('#reply-to .subject').text(username).parent().addClass('relevant');
    });
    
    $(document).on('click', '#reply-to .clearSubject', function(){
        $('#reply-to .subject').text('').parent().removeClass('relevant');
        $('#commentParent').val('');
        $('#comment-content article.selected').removeClass('selected');
    });
    
    $(document).on('submit', '#commentPostForm', function(e){
        e.preventDefault();
        postComment(this);
    });
    
});

$(window).on('resize', function(){
    
    var aspect = $('.article-parallax-image')[0].naturalWidth / $('.article-parallax-image')[0].naturalHeight;
    
    if(Math.round($('.article-parallax-image').width() / $('.article-parallax-image').height()) !== Math.round(aspect)){
        console.log('efsefsef');
        if(!$('.article-parallax-image').hasClass('responsive')){
            $('.article-parallax-image').addClass('responsive');
        }else {
            $('.article-parallax-image').removeClass('responsive');
        }
    }
    
    //$('#content-wrapper').css('min-height', $(window).innerHeight()-$('#nav').height());
    
});