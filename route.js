var sqlite3 = require('sqlite3'),
    fs = require('fs'),
    db = new sqlite3.cached.Database(__dirname+'/db/sqlite3/blog.sqlite'),
    Knex = require('./db').Knex,
    bcrypt = require('bcrypt'),
    moment = require('moment'),
    crypto = require('crypto'),
    headerCrunch = require('./modules/headerCrunch').articleCrunch,
    profileCrunch = require('./modules/headerCrunch').profileCrunch,
    urlSlug = require('./modules/slug').urlSlug,
    markdown = require('./modules/server_markdown').parse,
    dbApi = require('./modules/dbApi'),
    app = require('./server.js').app;

    var passport = require('./modules/login_procedure').passport,
        hashPassword = require('./modules/login_procedure').hashPassword;

    var multipart = require('connect-multiparty');
    var multipartMiddleware = multipart();

// db.run('DROP TABLE Posts');
// db.run('DROP TABLE Users');
// db.run('DROP TABLE Comments');
// db.run('DROP TABLE Categories');
// db.run('DROP TABLE hasCategory');
// db.run('DROP TABLE Tracking');
// db.run('INSERT INTO Categories (title, slug) VALUES( "TV Series","tv-series")');

// db.each('SELECT * FROM Tracking', function(err, row){
//     console.log(row);
// });

//db.run('UPDATE Users SET admin = 1 WHERE username = "skepton"');

/* Get MENU items*/
var menuItems = [];
db.each('SELECT * FROM Categories Order By Categories.sorting ', function(err, row){
    var menuItem = {
        'title': row.title,
        'slug': row.slug
    }
    menuItems.push(menuItem);
});

/* BASE */

app.get('/', function(req, res) {
    res.render('index', {user: req.user, menu: menuItems, sessionID: req.sessionID});
});

app.get('/getIndexContent', function(req, res) {
    dbApi.getArticles(null, null, function(parsedPosts){
        res.render('partials/indexContent', {user: req.user, articles: parsedPosts});
    });
});

app.get(['/c/:category', '/c/:category/:subCategory'], function(req, res) {
    res.render('index', {user: req.user, menu: menuItems, sessionID: req.sessionID});
});

app.get('/getCategoryContent/:category', function(req, res){

    var category = req.params.category;

    dbApi.getArticles(category, null, function(parsedPosts){
        if (parsedPosts){
            res.render('partials/indexContent', {user: req.user, articles: parsedPosts});
        }else {
            res.send('err');
        }
    });

});

app.get('/getCategoryContent/:category/:subCategory', function(req, res){

    var category = req.params.category, subCategory = req.params.subCategory;

    dbApi.getArticles(category, subCategory, function(parsedPosts){
        if (parsedPosts){
            res.render('partials/indexContent', {user: req.user, articles: parsedPosts});
        }else {
            res.send('err');
        }
    });

});

app.get('/a/:article', function(req, res) {
    var article = req.params.article;
    dbApi.getArticle(article, function(parsedPosts){
        if (parsedPosts){
            res.render('article', {user: req.user, articles: parsedPosts, menu: menuItems, sessionID: req.sessionID});
        } else {
            res.redirect('/');
        }
    });
});

app.get('/getArticleContent/:article', function(req, res) {
    var article = req.params.article;
    dbApi.getArticle(article, function(parsedPosts){
        if (parsedPosts){
            res.render('partials/article-main', {user: req.user, articles: parsedPosts});
        } else {
            res.send(err);
        }
    });
});

app.get('/loadComments/:article', function(req, res) {

    var article = req.params.article;

    if (article != 'latest') {

        dbApi.getComments(article, function(parsedPosts, article){
    	    res.render('partials/comment', {comments: parsedPosts, article: article, user: req.user});
        });

    } else {

        dbApi.getComments(article, function(parsedPosts){
    	    res.render('partials/sidebar-comments', {comments: parsedPosts, user: req.user});
        });

    }


});

app.get('/u/settings', function(req, res){

    if (req.user){
        res.render('user-settings', {user: req.user, menu: menuItems, sessionID: req.sessionID});
    }

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
					dbApi.track('comment',article);

				})
				.catch(function(error){
					console.log(error);
				});

			});
	    });
    }
});

/* User Post */

app.post('/user/settings/picture-upload', multipartMiddleware, function(req, res) {

    var filename = crypto.createHash('MD5').update(req.user.id.toString()).digest('hex');
    var uploadedFile = req.files.file.path;

    if( req.user){

        fs.readFile(uploadedFile, function (err, data) {

            var newFilename = 'images/user-cache/' + filename + '_profile.jpg';

            var newPath = __dirname + "/public/" + newFilename;

            fs.writeFile(newPath, data, function (err) {

                fs.unlink(uploadedFile, function() {
                    if (err) throw err;
                });

                profileCrunch(newPath, function(done){

                    if(done){
                        res.send(newFilename);
                    }else {
                        res.send(false);
                    }

                });

            });

        });

    }

});

app.post('/user/settings/save', multipartMiddleware, function(req, res) {

    var about = req.body.about, picture = req.body.picture;

    if (req.user){
        Knex('Users')
        .where('id',req.user.id)
        .returning('id')
        .update({
            about: about,
            picture: picture
        }).then(function(updated){
            res.send('OK');
        });
    }
});

/* Admin */

app.get('/admin', function(req, res) {

    if( req.user && req.user.admin === 1){

        Knex.raw('SELECT Post.headline, substr(Post.body, 0, 60) as body, User.displayname, Post.updated_at, Post.slug, Post.hashid FROM Posts as Post JOIN Users as User ON user.id = Post.author ORDER BY Post.updated_at desc LIMIT 20').then(function(rows){
            rows.forEach(function(row){
                row['date'] = new moment(row.updated_at).fromNow();
            });
            res.render('admin/index', {articles: rows, user: req.user, active: 'articleCenter', sessionID: req.sessionID});
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
        .select('*')
        .leftJoin('hasCategory','Posts.hashid','hasCategory.article')
        .where('hashid', post).then(function(row){

            var article = row[0];
            console.log(article);
            if(!row){
                res.redirect('/admin');
            }

            Knex('Categories')
            .select('*').then(function(rows){
                res.render('admin/composer', {post: article, user: req.user, categories: rows, active: 'articleCenter'});
            });

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

            res.redirect('admin/index', {user: req.user});

        });

    }else {
        res.redirect('/');
    }

});

app.get('/admin/stats', function(req, res) {

    var post = req.params.post;

    if( req.user && req.user.admin === 1){
      dbApi.getArticlesTracking('pageview', 1, 'days',function(data){
        res.render('admin/stats', {tracking: data});
      });
    }

});

/* Admin Post */
app.post('/admin/composer/save/:article', function(req, res) {

    if( req.user && req.user.admin === 1){

        var article = req.params.article, headline = req.body.headline, body = req.body.body, header = req.body.header, category = req.body.category, subCategory = req.body.subcategory, source = req.body.source, tags = req.body.tags;

        Knex('Posts')
        .where('hashid',article)
        .returning('id')
        .update({
            headline: headline,
            body: body,
            header: header,
            source: source,
            tags: tags
        }).then(function(updated){
            Knex('Posts')
            .select('id')
            .where('hashid', article).then(function(row){

                Knex('hasCategory')
                .insert({'category': category, 'subCategory': subCategory, 'article': article}).then(function(row){

                }).catch(function(error){

                    Knex('hasCategory')
                    .update({'category': category, 'subCategory': subCategory})
                    .where('article', article).catch(function(error){
                        console.log(error);
                    });
                });
            });

            if(headline != '' && headline.length > 0){

                Knex('Posts')
                .where('hashid',article)
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
        			dbApi.track('register','success');
        		});

        	}).catch(function(error) {
        		res.redirect('/register');
        		dbApi.track('register','error');
        	});

    	});

	});

});

app.post('/login', passport.authenticate('local', { failureRedirect: '/login' }), function(req, res) {

    if (req.user.admin === 1){
	    res.redirect('/admin');
	    dbApi.track('login','success');
    }else {
        res.redirect('/');
        dbApi.track('login','success');
    }

});

/* Tracking */
app.get('/pixel/:event/:data/:id', function(req, res){

    var event = req.params.event, data = req.params.data, id = req.params.id;
    dbApi.track(event, data, id);

    res.redirect('/images/pixel.gif');

});
