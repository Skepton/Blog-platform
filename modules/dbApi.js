var sqlite3 = require('sqlite3'),
	db = new sqlite3.cached.Database(__dirname+'/../db/sqlite3/blog.sqlite'),
	Knex = require('../db').Knex,
	bcrypt = require('bcrypt'),
	moment = require('moment'),
	markdown = require('./server_markdown').parse,
	crypto = require('crypto');
	
module.exports = {
	
	getArticles : function(category, callback){
		
		var parsedPosts = [];
		
		if (category){
			
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
			
			Knex.raw('SELECT Posts.*, User.* FROM Posts JOIN Users as User ON user.id = Posts.author WHERE Posts.slug = ? OR Posts.hashid = ? ORDER BY Posts.updated_at desc LIMIT 1', [article, article]).then(function(rows){
				if (rows) {
					
					var row = rows[0];
					var date = new moment(row.updated_at).fromNow();
					var parsedPost = markdown(row.headline, row.body, 0, row.header);
					parsedPost.id = row.id;
					parsedPost.author = row.displayname;
					parsedPost.authorPicture = row.picture;
					parsedPost.authorAbout = row.about;
					parsedPost.date = date;
					parsedPost.header = row.header;
					parsedPost.slug = row.slug;
					parsedPost.hashid = row.hashid;
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
	
	track : function(event, data){
		Knex('Tracking').insert({event: event, data: data, created_at: new Date()}).then(function(created){

		}).catch(function(err){
			console.log(err);
		});
	}
		
};