var mongoose = require('mongoose');
var moment = require('moment');
var utils = require('../utils/utils');
var debug = require('debug')('app:bookinstance');

var Schema = mongoose.Schema;

var BookInstanceSchema = Schema({
  book: {
    type: Schema.ObjectId,
    ref: 'Book',
    required: true
  }, //reference to the associated book
  imprint: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['Available', 'Maintenance', 'Loaned', 'Reserved'],
    default: 'Maintenance'
  },
  due_back: {
    type: Date,
    default: Date.now
  },
});

// Virtual for bookinstance's URL
BookInstanceSchema
  .virtual('url')
  .get(function() {
    return '/catalog/bookinstance/' + this._id;
  });

BookInstanceSchema
  .virtual('due_back_formatted')
  .get(function() {
    return utils.formatDate(this.due_back);
    //return moment(this.due_back).format('MMMM Do, YYYY');
  });

BookInstanceSchema
.virtual('due_back_input')
.get(function () {
  return utils.formatDateInput(this.due_back);
});

//Export model
module.exports = mongoose.model('BookInstance', BookInstanceSchema);
