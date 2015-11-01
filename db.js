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
			t.boolean('picture').defaultTo(false);
			t.string('about',255);
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
			t.string('source', 1024);
			t.string('tags', 1024);
			t.string('author', 64);
			t.string('slug', 255).unique();
			t.timestamps();

		});
	}
});

Knex.schema.hasTable('Categories').then(function(exists) {
	if (!exists) {
		return Knex.schema.createTable('Categories', function(t) {

			t.increments('id').primary();
			t.integer('sorting').defaultTo(-1);
			t.integer('parent').defaultTo(null);
			t.string('title', 64).unique();
			t.string('slug', 64);

		});
	}
});

Knex.schema.hasTable('hasCategory').then(function(exists) {
	if (!exists) {
		return Knex.schema.createTable('hasCategory', function(t) {

			t.increments('id').primary();
			t.integer('article').unique();
			t.integer('category');
			t.string('subCategory');

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

Knex.schema.hasTable('Tracking').then(function(exists) {
	if (!exists) {
		return Knex.schema.createTable('Tracking', function(t) {

			t.increments('id').primary();
			t.string('event',65);
			t.string('data', 255);
			t.string('sessionID', 48);
			t.timestamps();

		});
	}
});

module.exports.Knex = Knex;
