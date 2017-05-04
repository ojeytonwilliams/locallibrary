var Book = require('../models/book');
var Author = require('../models/author');
var Genre = require('../models/genre');
var BookInstance = require('../models/bookinstance');
var debug = require('debug')('app:bookController');

var async = require('async');

exports.index = function(req, res) {
  debug("Starting book index");
  async.parallel({
    book_count: function(callback) {
      Book.count(callback);
    },
    book_instance_count: function(callback) {
      BookInstance.count(callback);
    },
    book_instance_available_count: function(callback) {
      BookInstance.count({
        status: 'Available'
      }, callback);
    },
    author_count: function(callback) {
      Author.count(callback);
    },
    genre_count: function(callback) {
      Genre.count(callback);
    },
  }, function(err, results) {
    if (err) debug(err);
    res.render('index', {
      title: 'Local Library Home',
      error: err,
      data: results
    });
  });
};

// Display list of all Books
exports.book_list = function(req, res, next) {

  Book.find({}, 'title author ')
    .populate('author')
    .exec(function(err, list_books) {
      if (err) {
        //  return next(err);
      }
      //Successful, so render
      res.render('book_list', {
        title: 'Book List',
        book_list: list_books
      });
    });
};

// Display detail page for a specific book
exports.book_detail = function(req, res, next) {
  debug("book_detail");
  async.parallel({
    book: function(callback) {

      Book.findById(req.params.id)
        .populate('author')
        .populate('genre')
        .exec(callback);
    },
    book_instance: function(callback) {

      BookInstance.find({
          'book': req.params.id
        })
        //.populate('book')
        .exec(callback);
    },
  }, function(err, results) {
    if (err) {
      return next(err);
    }

    if (results.book) {
      //Successful, so render
      res.render('book_detail', {
        title: 'Title',
        book: results.book,
        book_instances: results.book_instance
      });
    } else {
      // No such book, going back to catalog
      res.redirect(303, '/catalog/books')
    }
  });

};

// Display book create form on GET
exports.book_create_get = function(req, res, next) {

  //Get all authors and genres, which we can use for adding to our book.
  async.parallel({
    authors: function(callback) {
      Author.find(callback);
    },
    genres: function(callback) {
      Genre.find(callback);
    },
  }, function(err, results) {
    if (err) {
      return next(err);
    }
    res.render('book_form', {
      title: 'Create Book',
      authors: results.authors,
      genres: results.genres
    });
  });

};

// Handle book create on POST
exports.book_create_post = function(req, res, next) {

  // NOTE: As per usual, sanitization has to come first (see bookController for
  // more discussion)

  req.sanitize('title').escape();
  req.sanitize('author').escape();
  req.sanitize('summary').escape();
  req.sanitize('isbn').escape();
  req.sanitize('title').trim();
  req.sanitize('author').trim();
  req.sanitize('summary').trim();
  req.sanitize('isbn').trim();
  req.sanitize('genre').escape();

  req.checkBody('title', 'Title must not be empty.').notEmpty();
  req.checkBody('author', 'Author must not be empty').notEmpty();
  req.checkBody('summary', 'Summary must not be empty').notEmpty();
  req.checkBody('isbn', 'ISBN must not be empty').notEmpty();

  var book = new Book({
    title: req.body.title,
    author: req.body.author,
    summary: req.body.summary,
    isbn: req.body.isbn,
    genre: (typeof req.body.genre === 'undefined') ? [] : req.body.genre.split(",")
  });

  debug('BOOK: ' + book);

  var errors = req.validationErrors();
  if (errors) {
    // Some problems so we need to re-render our book

    //Get all authors and genres for form
    async.parallel({
      authors: function(callback) {
        Author.find(callback);
      },
      genres: function(callback) {
        Genre.find(callback);
      },
    }, function(err, results) {
      if (err) {
        return next(err);
      }

      // Mark our selected genres as checked
      for (i = 0; i < results.genres.length; i++) {
        if (book.genre.indexOf(results.genres[i]._id) > -1) {
          //Current genre is selected. Set "checked" flag.
          results.genres[i].checked = 'true';
        }
      }

      res.render('book_form', {
        title: 'Create Book',
        authors: results.authors,
        genres: results.genres,
        book: book,
        errors: errors
      });

    });

  } else {
    // Data from form is valid.
    // We could check if book exists already, but lets just save.

    book.save(function(err) {
      if (err) {
        return next(err);
      }
      //successful - redirect to new book record.
      res.redirect(book.url);
    });
  }

};

// Display Book delete form on GET
exports.book_delete_get = function(req, res, next) {
  async.parallel({
    book: function(callback) {
      Book.findById(req.params.id).exec(callback);
    },
    book_instances: function(callback) {

      BookInstance.find({
          'book': req.params.id
        })
        //.populate('book')
        .exec(callback);
    },
  }, function(err, results) {
    if (err) {
      return next(err);
    }

    if (results.book) {
      //Successful, so render
      res.render('book_delete', {
        title: 'Delete Book',
        book: results.book,
        book_instances: results.book_instances
      });
    } else {
      debug("Invalid delete get request, redirecting to root");

      res.redirect(303, '/')
    }
  });

};

// Handle Book delete on POST
exports.book_delete_post = function(req, res, next) {
  debug("book_delete_post");
  req.checkBody('bookid', 'Book id must exist').notEmpty();
  var errors = req.validationErrors();
  if (errors) {
    debug("Invalid delete post request, redirecting to books");
    res.redirect(303, '/catalog/books')
  } else {
    async.parallel({
      book: function(callback) {
        Book.findById(req.body.bookid).exec(callback);
      },
    }, function(err, results) {
      if (err) {
        debug(err);
        return next(err);
      }

      //Delete object and redirect to the list of books.
      Book.findByIdAndRemove(req.body.bookid, function deleteBook(err) {
        if (err) {
          return next(err);
        }
        //Success - go to book list
        debug("Sucessfully deleted book");
        res.redirect(303, '/catalog/books');
      });

    });
  }
};

// Display book update form on GET
exports.book_update_get = function(req, res, next) {

  req.sanitize('id').escape();
  req.sanitize('id').trim();

  //Get book, authors and genres for form
  async.parallel({
    book: function(callback) {
      Book.findById(req.params.id).populate('author').populate('genre').exec(callback);
    },
    authors: function(callback) {
      Author.find(callback);
    },
    genres: function(callback) {
      Genre.find(callback);
    },
  }, function(err, results) {
    if (err) {
      return next(err);
    }

    if (results.book) { // There is a book, so we should process it.
      // Mark any selected genres as checked.
      for (var all_g_iter = 0; all_g_iter < results.genres.length; all_g_iter++) {
        results.book.genre.forEach((genre) => {
          if (results.genres[all_g_iter]._id.toString() == genre._id.toString()) {
            results.genres[all_g_iter].checked = 'true';
          }
        });
      }

      res.render('book_form', {
        title: 'Update Book',
        authors: results.authors,
        genres: results.genres,
        book: results.book
      });
    } else {
      // Nothing to see here, redirecting to the book list
      // TODO: Inform the user and consider how the redirecting affects pressing
      // back on the browser!
      res.redirect('/catalog/books');
    }
  });

};

// Handle book update on POST
exports.book_update_post = function(req, res, next) {

  //Sanitize id passed in.
  req.sanitize('id').escape();
  req.sanitize('id').trim();

  //Check other data
  req.sanitize('title').escape();
  req.sanitize('author').escape();
  req.sanitize('summary').escape();
  req.sanitize('isbn').escape();
  req.sanitize('title').trim();
  req.sanitize('author').trim();
  req.sanitize('summary').trim();
  req.sanitize('isbn').trim();
  req.sanitize('genre').escape();

  //Validate
  req.checkBody('title', 'Title must not be empty.').notEmpty();
  req.checkBody('author', 'Author must not be empty').notEmpty();
  req.checkBody('summary', 'Summary must not be empty').notEmpty();
  req.checkBody('isbn', 'ISBN must not be empty').notEmpty();


  var book = new Book({
    title: req.body.title,
    author: req.body.author,
    summary: req.body.summary,
    isbn: req.body.isbn,
    genre: (typeof req.body.genre === 'undefined') ? [] : req.body.genre.split(","),
    _id: req.params.id //This is required, or a new ID will be assigned!
  });

  var errors = req.validationErrors();
  if (errors) {
    // Re-render book with error information
    // Get all authors and genres for form
    async.parallel({
      authors: function(callback) {
        Author.find(callback);
      },
      genres: function(callback) {
        Genre.find(callback);
      },
    }, function(err, results) {
      if (err) {
        return next(err);
      }

      // Mark our selected genres as checked
      for (i = 0; i < results.genres.length; i++) {
        if (book.genre.indexOf(results.genres[i]._id) > -1) {
          results.genres[i].checked = 'true';
        }
      }
      res.render('book_form', {
        title: 'Update Book',
        authors: results.authors,
        genres: results.genres,
        book: book,
        errors: errors
      });
    });

  } else {
    // Data from form is valid. Update the record.
    Book.findByIdAndUpdate(req.params.id, book, {}, function(err, thebook) {
      if (err) {
        return next(err);
      }
      //successful - redirect to book detail page.
      res.redirect(thebook.url);
    });
  }

};
