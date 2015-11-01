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

function loadArticleContent(article, callback){

	$.ajax('/getArticleContent/'+article, {
		success: function(response){
			callback(response);
		}
	});

}

function loadIndexContent(callback){

	$.ajax('/getIndexContent/', {
		success: function(response){
			callback(response);
		}
	});

}

function loadCategoryContent(category, subCategory, callback){

	if(!subCategory){

		$.ajax('/getCategoryContent/'+category, {
			success: function(response){
				callback(response);
			}
		});

	}else {

		$.ajax('/getCategoryContent/'+category+'/'+subCategory, {
			success: function(response){
				callback(response);
			}
		});

	}

}

/* Routing */

function routeAction(route, back){

	var url = route ? route : window.location.pathname.toString();

	if ( RoutePattern.fromString("/").matches(url) ) {
		/* ROUTING: INDEX*/

		$('body').attr('class','front-page in');

		loadIndexContent(function(response){
			if(!back){
				history.pushState({'route': url, 'page': 'category'}, 'Blogger', url);
			}

			$('#page-wrapper').html(response);

			loadComments('latest', function(response){
				$('#sidebar').html(response);
			});

			$('.sidebar-padding').css('padding-left', $('#sidebar').outerWidth());

			window.requestAnimationFrame(function(){
				$('#page-wrapper').addClass('initial');
				$('#page-wrapper').removeClass('transition-out');
			});

			$('body .pixel-tracker').remove();
			$('body').append('<img class="pixel-tracker" src="/pixel/pageview/index/'+sessionID+'" />');
		});

	}

	else if (RoutePattern.fromString("/c/:category").matches(url) || RoutePattern.fromString("/c/:category/:subcategory").matches(url)) {
		/* ROUTING: CATEGORY*/

		$('body').attr('class','category-page in');

		var category = RoutePattern.fromString("/c/:category").match(url) ? RoutePattern.fromString("/c/:category").match(url).namedParams.category : RoutePattern.fromString("/c/:category/:subcategory").match(url).namedParams.category;
		var subCategory = RoutePattern.fromString("/c/:category/:subcategory").matches(url) ? RoutePattern.fromString("/c/:category/:subcategory").match(url).namedParams.subcategory : null;

		loadCategoryContent(category, subCategory, function(response){
			if(!back){
				history.pushState({'route': url, 'page': 'category'}, 'Blogger', url);
			}

			$('#page-wrapper').html(response);

			loadComments('latest', function(response){
				$('#sidebar').html(response);
			});

			$('.sidebar-padding').css('padding-left', $('#sidebar').outerWidth());

			window.requestAnimationFrame(function(){
				$('#page-wrapper').addClass('initial');
				$('#page-wrapper').removeClass('transition-out');
			});

			$('body .pixel-tracker').remove();
			$('body').append('<img class="pixel-tracker" src="/pixel/pageview/'+category+'/'+sessionID+'" />');
		});

	}

	else if (RoutePattern.fromString("/a/:article").matches(url)) {
		/* ROUTING: ARTICLE*/

		$('body').attr('class','article in');
		$('#page-wrapper').removeClass('transition-out');

		var article = RoutePattern.fromString("/a/:article").match(url).namedParams.article;

		loadArticleContent(article, function(response){
			if(!back){
				history.pushState({'route': url, 'page': 'article'}, 'Blogger', url);
			}

			$('#page-wrapper').html(response);

			loadComments(article, function(response){
				$('#comment-content').html(response);
			});

			$(window).trigger('resize');

			$('.parallax').parallax();
			$('.materialboxed').materialbox();

			window.requestAnimationFrame(function(){
				$('#page-wrapper').addClass('initial');
			});

			$('body .pixel-tracker').remove();
			$('body').append('<img class="pixel-tracker" src="/pixel/pageview/'+article+'/'+sessionID+'" />');

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

		});

	}

	else if (RoutePattern.fromString("/u/settings").matches(url)) {

		var headerUrl = '/u/settings/picture-upload';
		var myDropzone = new Dropzone($('#profile-dropzone')[0], {
			url: headerUrl,
			clickable: true,
			previewsContainer: false,
			autoProcessQueue: true,
			maxFiles: 1,
			dictDefaultMessage: '<p class="valign"><i class="material-icons">add</i> Click to upload header image</p>',
			success: function(response, filename){
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

}

/* Page Load */
routeAction();

/* On History Back */
window.onpopstate = function(event){
	var route = event.state.route;
	$('#page-wrapper').removeClass('in').addClass('out');
	setTimeout(function(){
		routeAction(route, true);
	},150);
};

$(window).on('resize', function(){
	$('.sidebar-padding').css('padding-left', $('#sidebar').outerWidth());
});

$(document).ready(function(){
	$('.navbar-fixed').addClass('in');
	$(window).trigger('resize');
});

$(document).on('click', '.ps-load', function(e){
	e.preventDefault();
	var url = $(this).attr('href');
	$('#page-wrapper').addClass('transition-out');
	setTimeout(function(){
		routeAction(url);
	},500);
});
