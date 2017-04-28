"use strict";

var moment = require('moment');

module.exports.formatDate = (date) => {return date ? moment(date).format('MMMM Do, YYYY') : ''};
