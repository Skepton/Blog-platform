function textParse(headline, text, snippet, header){

    var snippet = snippet-1;
    if(snippet < 0){
        snippet = false;
    }
    var lines = text.split('\n');
    var complete = [];
    var image = 0;

    /*INLINE PARSE*/

    function inline_parse(line){

        if(line.indexOf('[') >= 0){

            var x = 0;
            var displace = 0;

            do{

                var url_start = line.indexOf('](', displace);
                var url_end = line.indexOf(')', displace);
                var url = line.substring(url_start+2,url_end);
                var desc_start = line.indexOf('[', displace);
                var desc = line.substring(desc_start+1,url_start);

                if(url_start >= 0 && url_end >= 0 && desc_start >= 0 && line.indexOf('[', desc_start+1)){

                    if(url_start < line.indexOf('[', desc_start+1) && url_end < line.indexOf('[', desc_start+1)  || line.indexOf('[', url_end) == -1){

                        if(url.indexOf('http://')  == -1){

                            url = 'http://'+url;

                        }

                        var link = '<a href="'+url+'">'+desc+'</a>';

                        line = [line.slice(0, desc_start), link, line.slice(url_end+1)].join('');

                    }

                }

                x++;

            }while(line.indexOf('[', displace) >= 0 && line.indexOf('](', displace) >= 0 && line.indexOf(')', displace) >= 0 && x < 10);

        }

        if(line.indexOf('*') >= 0 ){

            do{

                var strong_start = line.indexOf('*');
                var strong_end = line.indexOf('*', strong_start+1);
                var strong = line.substring(strong_start+1,strong_end);

                if(strong_start >= 0 && strong_end >= 0){

                    var link = '<strong>'+strong+'</strong>';
                    line = [line.slice(0, strong_start), link, line.slice(strong_end+1)].join('');

                }

            }while(line.indexOf('*') >= 0 && line.indexOf('*') != line.lastIndexOf('*'));

        }

        return line;

    }

    /*BLOCK PARSE*/

    for(var i=0; i<lines.length; i++){

        if (lines[i].trim().length > 0) {

            lines[i] = lines[i].trim();

            if(lines[i].charAt(0) == '#'){
                if(lines[i].charAt(1) == '#'){
                    if(lines[i].charAt(2) == '#'){
                        complete[i] = '<h4>'+lines[i].replace(/#/g,'')+'</h4>';
                    }else{
                        complete[i] = '<h3>'+lines[i].replace(/#/g,'')+'</h3>';
                    }
                }else{
                    complete[i] = '<h2>'+lines[i].replace(/#/g,'')+'</h2>';
                }

            }else if(lines[i].indexOf('![image]') == 0){

                image++;
                var url_start = lines[i].indexOf('(');
                var url_end = lines[i].lastIndexOf(')');
                var url = lines[i].substring(url_start+1,url_end);

                if(url_start > 0 && url_end > 0){
                    if(url.length > 0){
                        complete[i] = '<div class="placeholder-'+image+' dropzone-placeholder hasImage"><img class="'+image+'" src="'+url+'"><div class="dz-default dz-message hasImage"><span><p class="valign"><i class="material-icons">add</i> Click to upload article image</p></span></div></div>';
                    }else{
                        complete[i] = '<div class="placeholder-'+image+' dropzone-placeholder"><div class="dz-default dz-message"><span><p class="valign"><i class="material-icons">add</i> Click to upload article image</p></span></div></div>';
                    }
                }
            }else if(lines[i].indexOf('[grid]') == 0){

                var start = lines[i].indexOf('(');
                var end = lines[i].lastIndexOf(')');
                var grid = lines[i].substring(start+1,end);
                var className = 'grid';

                var responsive = grid.split(',');

                responsive.forEach(function(element, index){

                    switch (index) {
                        case 0:
                            className += ' small-block-grid-'+element;
                            break;
                        case 1:
                            className += ' medium-block-grid-'+element;
                            break;
                        case 2:
                            className += ' large-block-grid-'+element;
                            break;
                        default:

                    }
                });

                complete[i] = '<div class="'+className+'">';

            }else if(lines[i].indexOf('[/grid]') == 0){

                complete[i] = '</div>';

            }else if(lines[i].indexOf('"') == 0){

                var quote_start = lines[i].indexOf('"');
                var quote_end = lines[i].lastIndexOf('"');
                var quote = lines[i].substring(quote_start+1,quote_end);
                var author_start = lines[i].lastIndexOf('-');
                var author_end = lines[i].length;

                if(author_start > quote_end){
                    var author = lines[i].substring(author_start+1,author_end);
                }
                if(quote.length > 0){
                    if(author){
                        complete[i] = '<blockquote>'+quote+'<span class="author"> - '+author+'</span></blockquote>';
                    }else {
                        complete[i] = '<blockquote>'+quote+'</blockquote>';
                    }
                }

            }else{

                complete[i] = '<p>'+inline_parse(lines[i])+'</p>';

                if( (snippet === 0 || snippet > 0) && i >= snippet){
                    break;
                }
            }
        }
    }

    var container = {
        'headline': headline,
        'body': complete.join('',''),
        'header': header
    };

    return container;
};
