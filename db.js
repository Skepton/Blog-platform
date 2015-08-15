var bcrypt = require('bcrypt'),
	Knex = require('knex')({
		client: 'sqlite3',
		connection: {
		filename: __dirname+'/db/sqlite3/blog.sqlite'
	}
});

Knex.schema.hasTable('Users').then(function(exists) {
	if (!exists) {
		return Knex.schema.createTable('Users', function(t) {

			t.increments('id').primary();
			t.string('username', 32).unique();
			t.string('displayname', 32).unique();
			t.string('password', 60);
			t.boolean('admin').defaultTo(false);
			t.timestamps();

		});
	}
});

Knex.schema.hasTable('Posts').then(function(exists) {
	if (!exists) {
		return Knex.schema.createTable('Posts', function(t) {

			t.increments('id').primary();
			t.string('hashid', 255).unique();
			t.string('headline', 255);
			t.string('header', 255);
			t.text('body');
			t.boolean('published').defaultTo(false);
			t.string('author', 64);
			t.string('slug', 255).unique();
			t.timestamps();

		});
	}
});

Knex.schema.hasTable('Comments').then(function(exists) {
	if (!exists) {
		return Knex.schema.createTable('Comments', function(t) {

			t.increments('id').primary();
			t.string('hashid',255);
			t.string('article',255);
			t.string('parent', 255);
			t.text('comment');
			t.string('thread',255);
			t.integer('user');
			t.timestamps();

		});
	}
});

module.exports.Knex = Knex;