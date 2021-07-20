var mongoose = require('mongoose');

// Category Schema
var loaihoaSchema = mongoose.Schema({
    slug: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('LoaiHoa', loaihoaSchema);