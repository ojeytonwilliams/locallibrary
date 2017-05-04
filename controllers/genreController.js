var Genre = require('../models/genre');
var Book = require('../models/book');
var async = require('async');
var debug = require('debug')('app:genreController');

// Display list of all Genre
exports.genre_list = function(req, res, next) {

  Genre
    .find()
    .sort([
      ['name', 'ascending']
    ])
    .exec(function(err, list_genres) {
      if (err) return next(err);

      res.render('genre_list', {
        title: "Genre List",
        genre_list: list_genres
      });
    })
};

// Display detail page for a specific Genre
exports.genre_detail = function(req, res, next) {

  async.parallel({
    genre: function(callback) {
      Genre.findById(req.params.id)
        .exec(callback);
    },

    genre_books: function(callback) {
      Book.find({
          'genre': req.params.id
        })
        .exec(callback);
    },

  }, function(err, results) {
    if (err) {
      return next(err);
    }
    if(results.genre){
    //Successful, so render
    res.render('genre_detail', {
      title: 'Genre Detail',
      genre: results.genre,
      genre_books: results.genre_books
    });
  } else {
    //Nothing here, redirect to genre list
    // TODO: Too many redirects.  You have to mash the back button too many times
    // before you actually seem to be going backwards.
    res.redirect(303, '/catalog/genres');
  }
  });

};

// Display Genre create form on GET
exports.genre_create_get = function(req, res, next) {
  res.render('genre_form', {
    title: 'Create Genre'
  });
};

// Handle Genre create on POST
exports.genre_create_post = function(req, res, next) {

  //Trim and escape the name field.
  // NOTE: These have to come first, otherwise a Genre name consisting of one
  // or more spaces will pass the notEmpty check (because spaces count as stuff)
  // *then* get trimmed to nothing and not be valid when we ask Mongoose to save
  // it.
  req.sanitize('name').escape();
  req.sanitize('name').trim();

  //Check that the name field is not empty
  req.checkBody('name', 'Genre name required').notEmpty();

  //Run the validators
  var errors = req.validationErrors();

  //Create a genre object with escaped and trimmed data.
  var genre = new Genre({
    name: req.body.name
  });

  if (errors) {
    //If there are errors render the form again, passing the previously entered values and errors
    res.render('genre_form', {
      title: 'Create Genre',
      genre: genre,
      errors: errors
    });
    return;
  } else {
    // Data from form is valid.
    // Check if Genre with same name already exists
    Genre.findOne({
        'name': req.body.name
      })
      .exec(function(err, found_genre) {
        debug('found_genre: ' + found_genre);
        if (err) {
          return next(err);
        }

        if (found_genre) {
          //Genre exists, redirect to its detail page
          res.redirect(found_genre.url);
        } else {

          genre.save(function(err) {
            if (err) {
              return next(err);
            }
            //Genre saved. Redirect to genre detail page
            res.redirect(genre.url);
          });

        }

      });
  }

};

// Display Genre delete form on GET
exports.genre_delete_get = function(req, res, next) {
  async.parallel({
    genre: function(callback) {
      Genre.findById(req.params.id).exec(callback);
    },
    genres_books: function(callback) {
      Book.find({
        'genre': req.params.id
      }).exec(callback);
    },
  }, function(err, results) {
    if (err) {
      return next(err);
    }

    if (results.genre) {
      //Successful, so render
      res.render('genre_delete', {
        title: 'Delete Genre',
        genre: results.genre,
        genres_books: results.genres_books
      });
    } else {
      debug("Invalid delete Genre get request, redirecting to genres");

      res.redirect(303, '/catalog/genres')
    }
  });

};

// Handle Genre delete on POST
exports.genre_delete_post = function(req, res, next) {
  debug("genre_delete_post");
  req.checkBody('genreid', 'Genre id must exist').notEmpty();
  var errors = req.validationErrors();
  if (errors) {
    debug("Invalid delete Genre post request, redirecting to genres");
    res.redirect(303, '/catalog/genres')
  } else {
    async.parallel({
      genre: function(callback) {
        Genre.findById(req.body.genreid).exec(callback);
      },
      genres_books: function(callback) {
        Book.find({
          'genre': req.body.genreid
        }, 'title summary').exec(callback);
      },
    }, function(err, results) {
      if (err) {
        debug(err);
        return next(err);
      }
      //Success
      if (results.genres_books > 0) {
        //Genre has books. Render in same way as for GET route.
        res.render('genre_delete', {
          title: 'Delete Genre',
          genre: results.genre,
          genres_books: results.genres_books
        });
        return;
      } else {
        //Genre has no books. Delete object and redirect to the list of genres.
        Genre.findByIdAndRemove(req.body.genreid, function deleteGenre(err) {
          if (err) {
            return next(err);
          }
          //Success - got to genre list
          debug("Sucessfully deleted genre");
          res.redirect(303, '/catalog/genres');
        });

      }
    });
  }
};

// Display Genre update form on GET
exports.genre_update_get = function(req, res, next) {
  res.send('NOT IMPLEMENTED: Genre update GET');
};

// Handle Genre update on POST
exports.genre_update_post = function(req, res, next) {
  res.send('NOT IMPLEMENTED: Genre update POST');
};
