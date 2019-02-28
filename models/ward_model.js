const mongoose = require('mongoose');

const ward_schema = new mongoose.Schema({
    ward_id: String,
    ward_name: String,
    Centroids: Object,
    POI:Object,
    geometry: {
        type: {
            type: String
        },
        coordinates: Array
    },
    "Visibility Index": Number,
    data: {
        restaurant: Array,
        demography: {
            gender_dist: Object,
            age_dist: Object,
            population: Number,
            literacy: Number,
            workers: Number
        },
        economy: {
            assets: Number,
            household_room: Number,
            bricks: Number,
            property_rates: Number,
            banks: Number
        }
        
    },
    movement_id: Number,
    Index: {
        Fspend: Number,
        HI: Number,
        EPI: Number
    },
    visibility: {
        cnscore: Number,
        weights: Array
    }



}, {
    collection: 'ward'
});

module.exports = mongoose.model('Ward', ward_schema);