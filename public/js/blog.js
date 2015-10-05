/* Functions */
function postComment(form, article){
	
	$('#commentPostForm button[type="submit"]').find('i').addClass('hide');
	$('#commentPostForm button[type="submit"]').find('.preloader-wrapper').addClass('active').removeClass('hide');
	
	$.ajax({
		url: $(form).attr('action'),
		type: 'POST',
		data: $(form).serialize(),
		complete: function(response){
			
			if(response.statusText === 'OK'){
			
				setTimeout(function(){
					
					Materialize.toast('Your comment Was Saved!', 4000);
				
					$('#commentPostForm button[type="submit"]').find('i').removeClass('hide');
					$('#commentPostForm button[type="submit"]').find('.preloader-wrapper').removeClass('active').addClass('hide');
					
					loadComments(article, function(response){
						$('#comment-content').html(response);
					});
				
				}, 500);
			
			}else {
				
				Materialize.toast('<span class="red-text">Your comment Was NOT Saved!</span>', 4000);
				
			}
			
		},
	});
	
}

function loadComments(article, callback){
	
	$.ajax('/loadComments/'+article, {
		success: function(response){
			callback(response);
		}
	});
	
}

/* Routing */
var url = window.location.pathname.toString();

if ( RoutePattern.fromString("/").matches(url) ) {
	/* ROUTING: INDEX*/
	
	loadComments('latest', function(response){
		$('#sidebar').html(response);
	});
	
} else if (RoutePattern.fromString("/category/:category").matches(url)) {
	/* ROUTING: CATEGORY*/
	var params = RoutePattern.fromString("/category/:category").match(url).namedParams.category;
	
	loadComments('latest', function(response){
		$('#sidebar').html(response);
	});
	
	
} else if (RoutePattern.fromString("/article/:article").matches(url)) {
	/* ROUTING: ARTICLE*/
	var params = RoutePattern.fromString("/article/:article").match(url).namedParams;

	$(document).on('ready', function(){
		loadComments(params.article, function(response){
			$('#comment-content').html(response);
		});
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
			postComment(this, params.article);
		});
	});
	
	$(window).on('resize', function(){
	
		var aspect = $('.article-parallax-image')[0].naturalWidth / $('.article-parallax-image')[0].naturalHeight;
	
		if (($('.article-parallax-image').width() / $('.article-parallax-image').height()).toFixed(2) !== aspect.toFixed(2)){
	
			if (!$('.article-parallax-image').hasClass('responsive')){
				$('.article-parallax-image').addClass('responsive');
			}else {
				$('.article-parallax-image').removeClass('responsive');
			}
		}
		
	});
} else if (RoutePattern.fromString("/user/settings").matches(url)) {
	
	var headerUrl = '/user/settings/picture-upload';
	var myDropzone = new Dropzone($('#profile-dropzone')[0], {
		url: headerUrl,
		clickable: true,
		previewsContainer: false,
		autoProcessQueue: true,
		maxFiles: 1,
		dictDefaultMessage: '<p class="valign"><i class="material-icons">add</i> Click to upload header image</p>',
		success: function(response, filename){
			console.log(filename);
			$('#picture').val(filename);
			$('#profile-dropzone').append('<img src="/'+filename+'" />').addClass('hasPicture');
		}
	});
	
	$('.user form').on('submit', function(e){
		
		var url = $(this).attr('action');
		
		$('button[type="submit"]').find('i').addClass('hide');
		$('button[type="submit"]').find('.preloader-wrapper').addClass('active').removeClass('hide');
		
		$.ajax({
			url: url,
			type: 'POST',
			data: $(this).serialize(),
			complete: function(response){
				
				if(response.statusText === 'OK'){
				
					setTimeout(function(){
						
						Materialize.toast('Your profile was posted!', 4000);
					
						$('button[type="submit"]').find('i').removeClass('hide');
						$('button[type="submit"]').find('.preloader-wrapper').removeClass('active').addClass('hide')
					
					},500);
				
				}else {
					
					Materialize.toast('<span class="red-text">Your profile was NOT posted!</span>', 4000);
					
				}
				
			},
		});
		
		return false;
		
	});
	
}