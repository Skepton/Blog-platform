var sqlite3 = require('sqlite3'),
    fs = require('fs'),
    db = new sqlite3.cached.Database(__dirname+'/db/sqlite3/blog.sqlite'),
    Knex = require('./db').Knex,
    bcrypt = require('bcrypt'),
    moment = require('moment'),
    crypto = require('crypto'),
    headerCrunch = require('./modules/headerCrunch').mainCrunch,
    urlSlug = require('./modules/slug').urlSlug,
    markdown = require('./modules/server_markdown').parse,
    app = require('./server.js').app;
    
    var passport = require('./modules/login_procedure').passport,
        hashPassword = require('./modules/login_procedure').hashPassword;
        
    var multipart = require('connect-multiparty');
    var multipartMiddleware = multipart();

//db.run('DROP TABLE Posts');
//db.run('DROP TABLE Users');
//db.run('DROP TABLE Comments');
//db.run('UPDATE Users SET displayname="Skepton" WHERE username = "skepton"');

/*db.each('SELECT * FROM Comments', function(err,row){
    console.log(row);
});*/

/* BASE */

app.get('/', function(req, res) {
    var parsedPosts = [];
    Knex.raw('SELECT Posts.*, User.displayname FROM Posts JOIN Users as User ON user.id = Posts.author ORDER BY Posts.updated_at desc LIMIT 10').then(function(rows){
        rows.forEach(function(row){
            var date = new moment(row.updated_at).fromNow();
            var parsedPost = markdown(row.headline, row.body, 1, row.header);
            parsedPost.author = row.displayname;
            parsedPost.date = date;
            parsedPost.slug = row.slug;
            parsedPost.hashid = row.hashid;
            parsedPosts.push(parsedPost);
        });
        
        res.render('index', {user: req.user, articles: parsedPosts});
    });
});

app.get('/article/:post', function(req, res) {
    var article = req.params.post;
    var parsedPosts = [];
    Knex.raw('SELECT Posts.*, User.displayname FROM Posts JOIN Users as User ON user.id = Posts.author WHERE Posts.slug = ? OR Posts.hashid = ? ORDER BY Posts.updated_at desc LIMIT 1', [article, article]).then(function(rows){
        var row = rows[0];

        var date = new moment(row.updated_at).fromNow();
        var parsedPost = markdown(row.headline, row.body, 0, row.header);
        parsedPost.author = row.displayname;
        parsedPost.date = date;
        parsedPost.header = row.header;
        parsedPost.slug = row.slug;
        parsedPost.hashid = row.hashid;
        parsedPosts.push(parsedPost);
        
        res.render('article', {user: req.user, articles: parsedPosts});
    });
});

app.get('/loadComments/:article', function(req, res) {
    
    var article = req.params.article;

	Knex.select('Comments.hashid','comment','thread', 'user', 'date','Users.displayname','Comments.created_at')
	.from('Comments')
	.join('Users', 'Comments.user', 'Users.id')
	.where('article', article)
	.orderBy('Comments.thread', 'asc')
	.then(function(rows){
	    rows.forEach(function(row){
	        row.date = new moment(row.created_at).fromNow();
	        row.threadLevel = row.thread.split('_').length;
	    });
	    res.render('partials/comment', {comments: rows, article: article});
	});
	
});

app.get('/login', function(req, res) {

	res.render('login');

});

app.get('/register', function(req, res) {

	res.render('register');

});

app.get('/logout', function(req, res) {

		req.logout();
		res.redirect('/');

});


/* Comment Post */
app.post('/postComments/:article', function(req, res) {

    var article = req.params.article;
    var comment = req.body.comment.trim();
    var parent = req.body.parent ? req.body.parent : 'article';
    
    if(req.user && comment.length > 0){
        
        Knex.raw(' SELECT (SELECT Comments.thread FROM Comments WHERE Comments.hashid = ? AND article = ?) AS thread, (SELECT COUNT(id) AS replies FROM Comments WHERE Comments.parent = ? AND article = ?) AS Replies ', [parent, article, parent, article])
		.then(function(row){
		    
		    console.log(row);
            
            row[0].Replies = row[0].Replies + 1;
            
            if(row[0].thread){

				var thread = row[0].thread;

				if( parseInt(row[0].Replies) > 9 && parseInt(row[0].Replies) < 99 ){

					thread = thread+'_0'+row[0].Replies;

				}else if(parseInt(row[0].Replies) < 9){

					thread = thread+'_00'+row[0].Replies;

				}else{

					thread = thread+row[0].Replies

				}

			}else{

				var thread = '';

				if( parseInt(row[0].Replies) > 9 &&  parseInt(row[0].Replies) < 99 ){

					thread = '0'+row[0].Replies;

				}else if(parseInt(row[0].Replies) < 9){

					thread = '00'+row[0].Replies;

				}else{

					thread = row[0].Replies;
					
				}
				
			}	
				
		    Knex('Comments').insert({user: req.user.id, article: article, parent: parent, comment: comment, thread: thread, created_at: new Date(), updated_at: new Date()}).then(function(created){

				Knex('Comments').where('id', created[0])
				.update({hashid: crypto.createHash('sha1').update(created[0].toString()).digest('hex')}).then(function(){

					res.send('done');
					
				})
				.catch(function(error){
					console.log(error);
				});

			});
	    });
    }
});

/* ADMIN */

app.get('/admin', function(req, res) {
    
    if( req.user && req.user.admin === 1){
        
        Knex.raw('SELECT Post.headline, substr(Post.body, 0, 60) as body, User.displayname, Post.updated_at, Post.slug, Post.hashid FROM Posts as Post JOIN Users as User ON user.id = Post.author ORDER BY Post.updated_at desc LIMIT 20').then(function(rows){
            rows.forEach(function(row){
                row['date'] = new moment(row.updated_at).fromNow();
            });
            res.render('admin/index', {articles: rows, user: req.user});
        });
        
    }else {
        res.redirect('/');
    }
    
});

app.get('/admin/getPreview/:article', function(req, res) {
    
    var article = req.params.article;
    if( req.user && req.user.admin === 1){
    
        Knex.raw('SELECT Posts.*, User.displayname FROM Posts JOIN Users as User ON user.id = Posts.author WHERE Posts.slug = ? OR Posts.hashid = ? ORDER BY Posts.updated_at desc LIMIT 1', [article, article]).then(function(rows){
            var row = rows[0];
            var date = new moment(row.updated_at).fromNow();
            var parsedPost = markdown(row.headline, row.body, 0, row.header);
            parsedPost.author = row.displayname;
            parsedPost.date = date;
            parsedPost.header = row.header;
            parsedPost.slug = row.slug;
            parsedPost.hashid = row.hashid;
            res.send(parsedPost);
        });
        
    }
    
});

app.get('/admin/composer/new', function(req, res) {
    
    if( req.user && req.user.admin === 1){
        
        Knex('Posts').insert({
            headline: '',
            header: '',
            body: '',
            author: req.user.id,
            created_at: new Date().toISOString(), 
			updated_at: new Date().toISOString()
            
        }).then(function(created){
            
            var hash = crypto.createHash('MD5').update(created[0].toString()).digest('hex');
            
            Knex('Posts')
            .where('id', created[0])
            .update({
                slug: hash,
                hashid: hash
            }).then(function(){
                res.redirect('/admin/composer/edit/'+hash);
            });
            
        });
	    
    }else {
        res.redirect('/');
    }
    
});

app.get('/admin/composer/edit/:post', function(req, res) {
    
    var post = req.params.post;
    
    if( req.user && req.user.admin === 1){
        
        Knex('Posts')
        .select()
        .where('hashid', post).then(function(row){
            
            if(!row){
                res.redirect('/admin');
            }
            
            res.render('admin/composer', {post: row[0], user: req.user});
            
        });
	    
    }else {
        res.redirect('/');
    }
    
});

app.get('/admin/composer/delete/:post', function(req, res) {
    
    var post = req.params.post;
    
    if( req.user && req.user.admin === 1){
        
        Knex('Posts')
        .where('hashid',post)
        .del()
        .then(function(created){

            res.redirect('/admin', {user: req.user});

        });
	    
    }else {
        res.redirect('/');
    }
    
});

/* Admin Post */

app.post('/admin/composer/save/:post', function(req, res) {
    
    if( req.user && req.user.admin === 1){
    
        var post = req.params.post, headline = req.body.headline, body = req.body.body, header = req.body.header;
        
        Knex('Posts')
        .where('hashid',post)
        .update({
            headline: headline,
            body: body,
            header: header
        }).then(function(){

            if(headline != '' && headline.length > 0){
                
                Knex('Posts')
                .where('hashid',post)
                .update({
                    slug: urlSlug(headline)
                }).then(function(){
                    res.send('OK');
                });
                
            }else {
                res.send('OK');
            }

        });
	    
    }else {
        res.redirect('/');
    }
    
});

app.post('/admin/composer/header-upload/:post', multipartMiddleware, function(req, res) {
    
    var filename = req.params.post;
    var uploadedFile = req.files.file.path;
    
    if( req.user && req.user.admin === 1){
        
        fs.readFile(uploadedFile, function (err, data) {
            
            var newFilename = 'images/article-cache/' + filename + '_header.' + uploadedFile.split('.')[uploadedFile.split('.').length-1];

            var newPath = __dirname + "/public/" + newFilename;
            
            fs.writeFile(newPath, data, function (err) {
                
                fs.unlink(uploadedFile, function() {
                    if (err) throw err;
                });
                
                headerCrunch(newPath);
                
                res.send(newFilename);
                
            });
            
        });
        
    }
    
});

app.post('/admin/composer/article-upload/:post', multipartMiddleware, function(req, res) {
    
    var filename = req.params.post;
    var uploadedFile = req.files.file.path;
    
    var articleImagehash = crypto.createHash('sha1').update(req.files.file.originalFilename).digest('hex');
    
    if( req.user && req.user.admin === 1){
        
        fs.readFile(uploadedFile, function (err, data) {
            
            var newFilename = 'images/article-cache/' + filename + '_' + articleImagehash + '.' + uploadedFile.split('.')[uploadedFile.split('.').length-1];

            var newPath = __dirname + "/public/" + newFilename;
            
            fs.writeFile(newPath, data, function (err) {
                
                fs.unlink(uploadedFile, function() {
                    if (err) throw err;
                });
                
                res.send(newFilename);
                
            });
            
        });
        
    }
    
});

/* Login Post */

app.post('/register', function(req, res) {

	var username = req.body.username.toLowerCase(), password = req.body.password, displayname = req.body.username;

	bcrypt.genSalt(10, function(err, salt) {
	    
    	hashPassword(password, salt, function(hash){
    	    
        	Knex('Users').insert({
        		username: username,
        		displayname: displayname,
        		password: hash,
        		created_at: new Date().toISOString(), 
        		updated_at: new Date().toISOString()})
        	.then(function(created){

        		passport.authenticate('local')(req, res, function () {
        
        			res.redirect('/');
        		});
        		
        	}).catch(function(error) {
        		res.redirect('/login');
        	});
    	    
    	});
    	
	});

});

app.post('/login', passport.authenticate('local', { failureRedirect: '/login' }), function(req, res) {

    if(req.user.admin === 1){
	    res.redirect('/admin');
    }else {
        res.redirect('/');
    }

});
