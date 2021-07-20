var mongoose = require('mongoose');

// Page Schema
var pageSchema = mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    slug: {
        type: String,
        required: true
    },
    content: {
        type: String,
        //required: true
    },
    sorting: {
        type: Number
    }
});

module.exports = mongoose.model('Page', pageSchema);