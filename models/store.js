const mongoose = require('mongoose');
const store_schema = new mongoose.Schema({
    geometry: {
        coordinates: Array,
        type: {
            type: String
        }
    },
    store: String
}, { collection: 'store' });

module.exports = mongoose.model('Store', store_schema);