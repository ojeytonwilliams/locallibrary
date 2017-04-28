var mongoose = require('mongoose');
var moment = require('moment');
var formatDate = require('../utils/utils').formatDate;

var Schema = mongoose.Schema;

var AuthorSchema = Schema({
  first_name: {
    type: String,
    required: true,
    max: 100
  },
  family_name: {
    type: String,
    required: true,
    max: 100
  },
  date_of_birth: {
    type: Date
  },
  date_of_death: {
    type: Date
  },
});

// Virtual for author's full name
AuthorSchema
  .virtual('name')
  .get(function() {
    return this.family_name + ', ' + this.first_name;
  });

// Virtual for author's URL
AuthorSchema
  .virtual('url')
  .get(function() {
    return '/catalog/author/' + this._id;
  });

AuthorSchema
  .virtual('date_of_birth_formatted')
  .get(function() {
    return formatDate(this.date_of_birth);
  });

AuthorSchema
  .virtual('date_of_death_formatted')
  .get(function() {
    return formatDate(this.date_of_death)
  });

AuthorSchema
  .virtual('lifespan')
  .get(function () {
    return this.date_of_birth_formatted + " - " + this.date_of_death_formatted;
  })

//Export model
module.exports = mongoose.model('Author', AuthorSchema);
