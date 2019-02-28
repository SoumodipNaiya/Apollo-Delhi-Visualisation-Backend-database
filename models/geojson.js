const mongoose = require('mongoose');
const test_schema = new mongoose.Schema({
    type: String,
    features: Array
},{collection: "geojson"});

module.exports = mongoose.model('delhi_model', test_schema);
