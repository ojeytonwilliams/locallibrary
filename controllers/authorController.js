var Author = require('../models/author');
var async = require('async');
var Book = require('../models/book');

// Display list of all Authors
exports.author_list = function(req, res, next) {

  Author.find()
    .sort([
      ['family_name', 'ascending']
    ])
    .exec(function(err, list_authors) {
      if (err) {
        return next(err);
      }
      //Successful, so render
      res.render('author_list', {
        title: 'Author List',
        author_list: list_authors
      });
    });

};

// Display detail page for a specific Author
exports.author_detail = function(req, res, next) {

  async.parallel({
    author: function(callback) {
      Author.findById(req.params.id)
        .exec(callback);
    },
    authors_books: function(callback) {
      Book.find({
          'author': req.params.id
        }, 'title summary')
        .exec(callback);
    },
  }, function(err, results) {
    if (err) {
      return next(err);
    }
    //Successful, so render
    res.render('author_detail', {
      title: 'Author Detail',
      author: results.author,
      author_books: results.authors_books
    });
  });
};

// Display Author create form on GET
exports.author_create_get = function(req, res, next) {
  res.render('author_form', {
    title: 'Create Author'
  });
};


// Handle Author create on POST
exports.author_create_post = function(req, res, next) {

  // NOTE: It's important that the sanitization comes first, since the aim is to
  // pass valid, sanitized data to the database.  Since data must be sanitized
  // and sanitization can render data invalid, we must sanitize first.

  req.sanitize('first_name').escape();
  req.sanitize('family_name').escape();
  req.sanitize('first_name').trim();
  req.sanitize('family_name').trim();
  req.sanitize('date_of_birth').toDate();
  req.sanitize('date_of_death').toDate();

  req.checkBody('first_name', 'First name must not be empty (spaces do not count)').notEmpty(); //We won't force Alphanumeric, because people might have spaces.
  req.checkBody('family_name', 'Family name must be specified.').notEmpty();
  req.checkBody('family_name', 'Family name must be alphanumeric text.').isAlpha();
  req.checkBody('date_of_birth', 'Invalid date').optional({
    checkFalsy: true
  }).isDate();
  req.checkBody('date_of_death', 'Invalid date').optional({
    checkFalsy: true
  }).isDate();


  var errors = req.validationErrors();

  var author = new Author({
    first_name: req.body.first_name,
    family_name: req.body.family_name,
    date_of_birth: req.body.date_of_birth,
    date_of_death: req.body.date_of_death
  });

  if (errors) {
    res.render('author_form', {
      title: 'Create Author',
      author: author,
      errors: errors
    });
    return;
  } else {
    // Data from form is valid

    // Data from form is valid.
    // Check if Author with same name and date of birth already exists
    Author.findOne({
        'first_name': req.body.first_name,
        'last_name' : req.body.last_name,
        'date_of_birth': req.body.date_of_birth
      })
      .exec(function(err, found_author) {
        console.log('found_author: ' + found_author);
        if (err) {
          return next(err);
        }

        if (found_author) {
          //Author exists, redirect to their detail page
          res.redirect(found_author.url);
        } else {

          author.save(function(err) {
            if (err) {
              return next(err);
            }
            //Author saved. Redirect to author detail page
            res.redirect(author.url);
          });

        }

      });
  }

};

// Display Author delete form on GET
exports.author_delete_get = function(req, res, next) {
  res.send('NOT IMPLEMENTED: Author delete GET');
};

// Handle Author delete on POST
exports.author_delete_post = function(req, res, next) {
  res.send('NOT IMPLEMENTED: Author delete POST');
};

// Display Author update form on GET
exports.author_update_get = function(req, res, next) {
  res.send('NOT IMPLEMENTED: Author update GET');
};

// Handle Author update on POST
exports.author_update_post = function(req, res, next) {
  res.send('NOT IMPLEMENTED: Author update POST');
};
