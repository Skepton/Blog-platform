var passport = require('passport'),
	bcrypt = require('bcrypt'),
	sqlite3 = require('sqlite3'),
	db = new sqlite3.cached.Database(__dirname+'/../db/sqlite3/blog.sqlite'),
	LocalStrategy = require('passport-local').Strategy;

function hashPassword(password, salt, callback) {

	bcrypt.hash(password, salt, function(err, hash) {
		
		if(err){
			return false;
		}
		
		callback(hash);
	});
	
}

function compareHash(password, expected){
	return bcrypt.compareSync(password, expected);
}

passport.use(new LocalStrategy(function(username, password, done) {

	username = username.toLowerCase();

	db.get('SELECT password FROM Users WHERE username = ?', username, function(err, row) {

		if (!row || err) return done(null, false);
		
		if(!compareHash(password, row.password)) return done(null, false);

		db.get('SELECT username, displayname, id, admin, picture, about FROM Users WHERE username = ?', username, function(err, row) {
	
			if (!row) return done(null, false);
			return done(null, row);
		});

	});

}));

passport.serializeUser(function(user, done) {

	return done(null, user.id);
});

passport.deserializeUser(function(id, done) {

	db.get('SELECT username, displayname, id, admin, picture, about FROM Users WHERE id = ?', id, function(err, row) {

		if (!row) return done(null, false);
		return done(null, row);
	});

});

module.exports.hashPassword = hashPassword;
module.exports.passport = passport;