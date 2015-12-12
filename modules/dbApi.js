var sqlite3 = require('sqlite3'),
	db = new sqlite3.cached.Database(__dirname+'/../db/sqlite3/blog.sqlite'),
	Knex = require('../db').Knex,
	bcrypt = require('bcrypt'),
	moment = require('moment'),
	urlSlug = require('./slug').urlSlug,
	markdown = require('./server_markdown').parse,
	crypto = require('crypto');

module.exports = {

	getArticles : function(category, subCategory, callback){

		var parsedPosts = [];

		if (category && category !== 'all'  && !subCategory){

			Knex.raw('SELECT Posts.*, User.displayname FROM Posts JOIN Users as User ON user.id = Posts.author JOIN hasCategory ON Posts.hashid = hasCategory.article JOIN Categories ON hasCategory.category = Categories.id WHERE Categories.slug = ? ORDER BY Posts.updated_at desc LIMIT 15', [category]).then(function(rows){
				if (rows){

					rows.forEach(function(row){
						var date = new moment(row.updated_at).fromNow();
						var parsedPost = markdown(row.headline, row.body, 1, row.header);
						parsedPost.id = row.id;
						parsedPost.author = row.displayname;
						parsedPost.date = date;
						parsedPost.slug = row.slug;
						parsedPost.hashid = row.hashid;
						parsedPosts.push(parsedPost);

					});

					callback(parsedPosts);

				} else {
					callback(false);
				}
			});

		} else if (category  && category !== 'all' && subCategory) {

			Knex.raw('SELECT Posts.*, User.displayname FROM Posts JOIN Users as User ON user.id = Posts.author JOIN hasCategory ON Posts.hashid = hasCategory.article JOIN Categories ON hasCategory.category = Categories.id WHERE Categories.slug = ? AND hasCategory.subCategory = ? ORDER BY Posts.updated_at desc LIMIT 15', [category, subCategory]).then(function(rows){
				if (rows){
					rows.forEach(function(row){
						var date = new moment(row.updated_at).fromNow();
						var parsedPost = markdown(row.headline, row.body, 1, row.header);
						parsedPost.id = row.id;
						parsedPost.author = row.displayname;
						parsedPost.date = date;
						parsedPost.slug = row.slug;
						parsedPost.hashid = row.hashid;
						parsedPosts.push(parsedPost);

					});

					callback(parsedPosts);

				} else {
					callback(false);
				}

			});

		} else if (category === 'all' && subCategory) {

			Knex.raw('SELECT Posts.*, User.displayname FROM Posts JOIN Users as User ON user.id = Posts.author JOIN hasCategory ON Posts.hashid = hasCategory.article JOIN Categories ON hasCategory.category = Categories.id WHERE hasCategory.subCategory = ? ORDER BY Posts.updated_at desc LIMIT 15', [subCategory]).then(function(rows){
				if (rows){

					rows.forEach(function(row){
						var date = new moment(row.updated_at).fromNow();
						var parsedPost = markdown(row.headline, row.body, 1, row.header);
						parsedPost.id = row.id;
						parsedPost.author = row.displayname;
						parsedPost.date = date;
						parsedPost.slug = row.slug;
						parsedPost.hashid = row.hashid;
						parsedPosts.push(parsedPost);

					});

					callback(parsedPosts);

				} else {
					callback(false);
				}

			});

		} else {

			Knex.raw('SELECT Posts.*, User.displayname FROM Posts JOIN Users as User ON user.id = Posts.author ORDER BY Posts.updated_at desc LIMIT 15').then(function(rows){
				rows.forEach(function(row){

					var date = new moment(row.updated_at).fromNow();
					var parsedPost = markdown(row.headline, row.body, 1, row.header);
					parsedPost.id = row.id;
					parsedPost.author = row.displayname;
					parsedPost.date = date;
					parsedPost.slug = row.slug;
					parsedPost.hashid = row.hashid;
					parsedPosts.push(parsedPost);

				});

				callback(parsedPosts);
			});

		}

	},

	getArticle : function(article, callback){

		var parsedPosts = [];

		if (article){

			Knex.raw('SELECT Posts.*, User.displayname, User.picture, User.about FROM Posts JOIN Users as User ON user.id = Posts.author WHERE Posts.slug = ? OR Posts.hashid = ? ORDER BY Posts.updated_at desc LIMIT 1', [article, article]).then(function(rows){
				if (rows) {

					var row = rows[0];
					var date = new moment(row.updated_at).fromNow();
					var parsedPost = markdown(row.headline, row.body, 0, row.header);
					var tags = row.tags.split(',');
					var tagsUrl = row.tags.split(',');

					for(var i = 0; i<tags.length; i++){
						tags[i] = tags[i].trim();
						tagsUrl[i] = urlSlug(tags[i].trim());
					}

					parsedPost.id = row.id;
					parsedPost.author = row.displayname;
					parsedPost.authorPicture = row.picture;
					parsedPost.authorAbout = row.about;
					parsedPost.date = date;
					parsedPost.header = row.header;
					parsedPost.slug = row.slug;
					parsedPost.hashid = row.hashid;
					parsedPost.source = row.source;
					parsedPost.tags = tags;
					parsedPost.tagsUrl = tagsUrl;
					parsedPosts.push(parsedPost);

					callback(parsedPosts);

				} else {

					callback(false);

				}
			});

		}else {

			callback(false);

		}

	},

	getComments : function(article, callback){

		if (article != 'latest'){

			Knex.select('Comments.hashid','comment','thread', 'user', 'date','Users.displayname','Comments.created_at')
			.from('Comments')
			.join('Users', 'Comments.user', 'Users.id')
			.join('Posts', 'Comments.article', 'Posts.hashid')
			.where('Posts.slug', article)
			.orderBy('Comments.thread', 'asc')
			.then(function(rows){

				rows.forEach(function(row){
					row.date = new moment(row.created_at).fromNow();
					row.threadLevel = row.thread.split('_').length;
				});

				Knex.select('hashid')
				.from('Posts')
				.where('slug', article).then(function(article){
					callback(rows, article[0].hashid);
				});

			});

		} else {

			Knex.select('Comments.hashid','comment','thread', 'user', 'date','Users.displayname','Comments.created_at', 'Posts.headline', 'Posts.slug')
			.from('Comments')
			.join('Users', 'Comments.user', 'Users.id')
			.join('Posts', 'Comments.article','Posts.hashid')
			.orderBy('Comments.created_at', 'desc')
			.limit(10)
			.then(function(rows){

				rows.forEach(function(row){
					row.date = new moment(row.created_at).fromNow();
				});

				callback(rows);
			});

		}
	},

	track : function(event, data, id){
		Knex('Tracking').insert({event: event, data: data, created_at: new Date(), sessionID: id}).then(function(created){

		}).catch(function(err){
			console.log(err);
		});
	},

	getArticlesTracking : function(event, end, timeframe, callback){
		var now = moment().valueOf();
		var then = moment().subtract(end, 'days').valueOf();
		console.log(now, then);
		Knex('Tracking').select('Tracking.*','Posts.headline','Posts.id as PostId')
		.join('Posts','Tracking.data','Posts.slug')
		.where('Tracking.event',event)
		.whereBetween('Tracking.created_at', [then, now])
		.then(function(rows){
			callback(rows);
		}).catch(function(err){
			console.log(err);
		});
	}

};
