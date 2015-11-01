/* Variables*/
var keydownTimeout;
var dropzones = [];

/* Functions */
function fillImageUrl(index, url){

	var text = $('#write #body').val();
	var lines = text.split('\n');
	var image = 0;

	for(var i=0; i<lines.length; i++){
		if (lines[i].trim().length > 0) {
			if(lines[i].indexOf('![image]') == 0){
				image++;
				if(image === index){
					var url_start = lines[i].indexOf('(');
					var url_end = lines[i].lastIndexOf(')');

					lines[i] = lines[i].substring(0, url_start+1)+'/'+url+lines[i].substring(url_end, url_end+1);
				}
			}
		}
	}
	return lines.join('\n','');
}
function dropzoneSetup(){

	var headerUrl = $('#write form').attr('action').replace('save','header-upload');
	var myDropzone = new Dropzone($('#header-dropzone')[0], {
		url: headerUrl,
		clickable: true,
		previewsContainer: false,
		autoProcessQueue: true,
		maxFiles: 1,
		dictDefaultMessage: '<p class="valign"><i class="material-icons">add</i> Click to upload header image</p>',
		success: function(response, filename){
			$('#write').find('#header').val(filename);
		}
	});

	var articleUrl = $('#write form').attr('action').replace('save','header-upload').replace('header','article');
	for(var i = 0; i < $('.dropzone-placeholder').length; i++){

		var dropzone = new Dropzone($('.dropzone-placeholder')[i], {
			url: articleUrl,
			clickable: true,
			previewsContainer: false,
			autoProcessQueue: true,
			maxFiles: 1,
			dictDefaultMessage: '<p class="valign"><i class="material-icons">add</i> Click to upload header image</p>',
			success: function(response, filename){
				var index = parseInt($(this.element).attr('class').split('placeholder-')[1]);
				$('#write #body').val(fillImageUrl(index,filename)).trigger('keyup');
				onKeyUpParsePreview();
			}
		});
	}

	dropzones.push(myDropzone);

}

function dropzoneClear(){

	if(dropzones.length > 0){

		for( var index in dropzones){
			dropzones[index].disable();
			dropzones[index].hiddenFileInput.remove();
		};

	}

}

/* Composer Parse*/
function onKeyUpParsePreview(){

	var headline = $('#write').find('#headline').val();
	var body = $('#write').find('#body').val();
	var header = $('#write').find('#header').val();

	dropzoneClear();

	var content = textParse(headline, body, false, header);
	var template = $('#article-template').html();
	content.author = article_user;
	content.date = new moment().fromNow();
	$('#preview article').html(swig.render(template, {locals: {article: content}}));

	dropzoneSetup();

}

function articlePreviewParse(article){
	var content = textParse(article.headline, article.body, false, article.header);
	content.author = article.author;
	content.date = article.date;
	var template = $('#article-template').html();

	$('#preview article').html(swig.render(template, {locals: {article: content}}));
}

/* Events */

$(document).on('ready', function(){

	$(window).trigger('resize');

	$('#headline, #body').on('keyup', function(){
		clearTimeout(keydownTimeout);
		keydownTimeout = setTimeout(function(){
			onKeyUpParsePreview();
		},250);
	});

	$('#write form').on('submit', function(e){

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

						Materialize.toast('Your Article was posted!', 4000);

						$('button[type="submit"]').find('i').removeClass('hide');
						$('button[type="submit"]').find('.preloader-wrapper').removeClass('active').addClass('hide')

					},500);

				}else {

					Materialize.toast('<span class="red-text">Your Article was NOT posted!</span>', 4000);

				}

			},
		});

		return false;

	});

	$('#post-list .collection-item').on('click', function(){
		var preloader = $(this).find('.preloader-wrapper').addClass('active');
		$('#post-list .collection-item.selected').removeClass('selected');
		var article = $(this).addClass('selected').data('article');
		$.ajax('/admin/getPreview/'+article, {
			success: function(response){
				setTimeout(function(){
					articlePreviewParse(response);
					preloader.removeClass('active');
				}, 300);
			}
		});
	});

	$('#post-list .collection-item').first().trigger('click');

	setTimeout(function(){
		$('#headline, #body').trigger('keyup');
	},500);

});

$(window).on('resize', function(){
	$('#preview').css('padding-left', $('#post-list, #write').outerWidth());
});

$(document).ready(function(){
	$('body').addClass('loaded');
	$('.navbar-fixed').addClass('in');
	$(window).trigger('resize');
});
