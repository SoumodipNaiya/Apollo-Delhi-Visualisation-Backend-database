const express = require("express");

const mongodb = require('mongodb');
const mongoose = require('mongoose');


const debug = require('debug')('http');
const faker = require('faker');


const circle_to_polygon = require('circle-to-polygon');
const turf = require('@turf/turf');
const geojsonArea = require('geojson-area');


const ward_model = require('../models/ward_model.js');
const geo_model = require('../models/geojson');
const best_fit_model = require('../models/best_fit');
const store_model = require('../models/store');

const property_mapper = require('../extra/property_mapper');

const circular_chart_type = ['doughnut', 'pie', 'polarArea'];
const line_chart_type = ['radar', 'bar', 'line'];
const chart_type = [circular_chart_type, line_chart_type];


const router = express.Router();


mongoose.connect(process.env.MONGO_PATH || 'mongodb://mongo:27017/geocord').then(() => {},
    (err) => {
        console.warn("Error: Can't connect to database");
    });

ward_model.findOne({}, (err, result) => {
    debug(result);
});
/**
 * @param  {} ward
 * @param  {} circle
 * @returns {} returns intersection data of circle and ward
 */
function get_intersection_data(ward, circle) {
    const data = {
        intersection: false
    };
    const intersection = turf.intersect(ward.geometry, circle);
    if (intersection) {
        const intersection_area = geojsonArea.geometry(intersection.geometry);
        const ward_area = geojsonArea.geometry(ward.geometry);
        const intersection_percentage = intersection_area / ward_area;
        debug(ward_area);
        debug(intersection_area);
        data.intersection = true;
        data.intersection_area = intersection_area;
        data.ward_area = ward_area;
        data.intersection_percentage = intersection_percentage;
    }
    return data;
}

const layer_map = [{
        layer: "Demography",
        graph: ["Literacy", "Age distribution", "Gender distribution"]
    },
    {
        layer: "Economy",
        graph: ["Property rates"]
    },
    {
        layer: "Index",
        graph: ["Fspend", "HI", "EPI"]
    },
    {
        layer: "My zone",
        graph: ["youth", "office", "My stores", "competitive stores"]
    }
];


const prop_map = {
    'Population': 'data.demography.population',
    'Literacy': 'data.demography.literacy',
    'Age distribution': 'data.demography.age_dist',
    'Gender distribution': 'data.demography.gender_dist',
    'Property rates': 'data.economy.property_rates',
    'Fspend': 'Index.Fspend',
    'HI': 'Index.HI',
    'EPI': 'Index.EPI',
    
};

/** 
 * Get the geojson from database and sends it to the client
 */

router.get('/loadgeojson', (req, res) => {
    geo_model.findOne({}, (err, result) => {
        res.status(200).send(result.features);
    });
});

/**
 * Get required graph data and send to the client
 */

router.post('/chart', (req, res) => {
    debug(req.body);

    /** 
     * Best fit mode.
     * Find the required best fit mode from the database.
     * The data in database is in the form { name: String, latlng: Array, radius: Number }
     * The required format is [{ latlng: [Number, Number], radius: Number }]
     * So we change into that form
     */

    if(req.body.layer === 'My zone') {
        
        const data = {
            type: 'FeatureCollection',
            features: []
        };

        if(req.body.graph === 'My stores') {
            store_model.find({store: "Nirula's"}, (err, result) => {
                result.forEach((d) => {
                    data.features.push(turf.point(d.geometry.coordinates, {'marker-symbol': 'circle'}));
                });
                return res.status(200).send(data);
            });
        }

        else if(req.body.graph === 'competitive stores' ) {
            store_model.find({store: {$ne: "Nirula's"}}, (err, result) => {
                result.forEach((d) => {
                    data.features.push(turf.point(d.geometry.coordinates, {'marker-symbol': 'circle'}));
                });
                return res.status(200).send(data);
            });
        }
        else {
            best_fit_model.find({type: req.body.graph}, (err, result) => {
                result.forEach((g) => {
                    data.features.push({
                        type: 'Feature',
                        geometry: {
                            coordinates: g.geometry.coordinates,
                            type: 'Circle',
                            radius: '0.5'
                        }
                    });
                });
                return res.status(200).send(data);
    
            });
        }
        

        
    }

    /**
     * Normal mode
     * Request parameters are - 
     * id: Array of ward IDs
     * layer: Name of the layer. Since no two graphs have the same name, at this point this is useless
     * graph: Name of the graph
     */


    if (req.body.mode === "normal") {
        const ids = req.body.id;
        const layer = req.body.layer;
        const graph = req.body.graph;
        debug("Normal");
        debug(req.body);

        // If it's a test process, use random data
        if (process.env.TEST) {
            let data = {
                type: circular_chart_type[Math.floor(Math.random() * circular_chart_type.length)],
                label: [],
                values: []
            };

            for (var i = 0; i < 1; ++i) {
                debug(i);
                let _data = {
                    data: [],
                    label: faker.fake("{{name.lastName}}")
                }

                for (var j = 0; j < 5; ++j) {
                    data.label.push(j);
                    _data.data.push(Math.random() * 1000);
                }
                data.values.push(_data);
            }

      

            console.log(data);
            return res.status(200).send(data);
        }



        const data = {
            type: chart_type[Math.floor(Math.random() * chart_type.length)][Math.floor(Math.random() * 3)],
            label: [],
            values: []
        };
        ward_model.find({
            ward_id: {
                $in: ids
            }
        }, (err, result) => {
            if (err) return res.status(500);
            const _data = {
                data: [],
                label: graph
            };
     
            if(graph === 'Age distribution' || graph === 'Gender distribution') {
                result.forEach((ward) => {
                    const dist = property_mapper(ward, prop_map[graph]);
                    for(var i in dist) {
                        debug(i);
                        const index = data.label.indexOf(i);
                        if(index === -1) {
                            data.label.push(i);
                            _data.data.push(dist[i]);
                        }
                        else {
                            _data.data[index] += dist[i];
                        }
                        
                    }
                });
                
                data.values.push(_data);
                debug(data);
                return res.status(200).send(data);
            }

            
            result.forEach((ward) => {
                debug(ward);
                data.label.push(ward.ward_name);
                _data.data.push(property_mapper(ward, prop_map[graph]))
            });
            data.values.push(_data);
            debug(data);
            res.status(200).send(data);
        });



    } 

    /**
     * Catchment mode.
     * Similar to normal mode, except we need a radius value
     */
    
    else if (req.body.mode === "catchment") {
        const lat = req.body.latlng.lat;
        const lng = req.body.latlng.lng;
        const graph = req.body.graph;
        const radius = req.body.radius;
        const layer = req.body.layer;
        debug(req.body);
        if (process.env.TEST) {
            let data = {
                type: circular_chart_type[Math.floor(Math.random() * circular_chart_type.length)],
                label: [],
                values: []
            };

            for (var i = 0; i < 1; ++i) {
                debug(i);
                let _data = {
                    data: [],
                    label: faker.fake("{{name.lastName}}")
                }

                for (var j = 0; j < 5; ++j) {
                    data.label.push(j);
                    _data.data.push(Math.random() * 1000);
                }
                data.values.push(_data);
            }


            console.log(data);
            return res.status(200).send(data);

        }
        /**
         * Production logic for intersection.
         * To achieve this, we create a circle around the point, and convert it into a polygon
         * Then use $geoIntersects to find out which wards intersect that polygon
         * Then we get the necessary data for each intersecting wards
         */
        const data = {
            type: circular_chart_type[Math.floor(Math.random() * circular_chart_type.length)],
            label: [],
            values: []
        };
        debug(circle_to_polygon);
        debug(circle_to_polygon([lng, lat], radius));
        ward_model.find({
            geometry: {
                $geoIntersects: {
                    $geometry: circle_to_polygon([lng, lat], radius)
                }
            }
        }, (err, result) => {
            debug(err);
            if (err || !result || result.length <= 0) return res.status(500).send({
                success: false,
                error: "ERROR: No matching data found"
            });

            const circle = turf.circle([lng, lat], radius, {
                steps: 100,
                units: "meters"
            });
            debug(result);
            const _data = {

                data: [],

            };
            const to_graph = layer_map.find((e) => {
                debug(e);
                return e.layer === layer && e.graph.includes(graph);
            });
            if (typeof to_graph === 'undefined') {
                debug(to_graph);
                return res.status(200).send({
                    success: false,
                    error: "Graph parameter not supported"
                });
            }
            /**
             * Age distribution and Gender distribution require special treatment
             * Since they get summed up for every intersecting ward.
             */
            if(graph === 'Age distribution' || graph === 'Gender distribution') {
                result.forEach((ward) => {
                    const dist = property_mapper(ward, prop_map[graph]);
                    const intersection_result = get_intersection_data(ward, circle);
                    if(intersection_result.intersection) {
                        const intersection_percentage = intersection_result.intersection_percentage;
                        for(var i in dist) {
                            debug(i);
                            /**
                             * Check if the data for current label is already present or not.
                             * If not, insert
                             * If present, sum up
                             */
                            const index = data.label.indexOf(i);
                            if(index === -1) {
                                data.label.push(i);
                                _data.data.push(dist[i]);
                            }
                            else {
                                _data.data[index] += (dist[i] * intersection_percentage );
                            }
                            
                        }
                    }
                    
                });
                
                data.values.push(_data);
                debug(data);
                return res.status(200).send(data);
            }
            else {
                result.forEach((ward) => {
                    const intersection_result = get_intersection_data(ward, circle);
    
                    if (intersection_result.intersection) {
                        const intersection_percentage = intersection_result.intersection_percentage;
                        data.label.push(ward.ward_name);
                        _data.data.push(property_mapper(ward, prop_map[graph]) * intersection_percentage);
                    }
    
                });
                data.values.push(_data);
                debug(data);
                res.status(200).send(data);
            }
            
        });
    }

});

/**
 * Choropleth - Send everything to the client
 */

router.get('/init/choropleth', (req, res) => {

    ward_model.find({}, (err, result) => {
        if (err) return res.status(500).send({
            success: false,
            error: "ERROR: No matching data found"
        });
        const val = {};
        if (process.env.TEST) {
            for (var i = 1; i < 400; ++i) {
                val[i.toString()] = {
                    'Economy': {
                        "Assets": Math.random(),
                        "Property rates": Math.random(),
                        "Banks": Math.random(),
                        "Bricks": Math.random(),
                        "Household room": Math.random()
                    },
                    'Demography': {
                        "Population": Math.random(),
                        "Literacy": Math.random(),
                        "Workers": Math.random()
                    },
                    "Index": {
                        "FSpend": Math.random(),
                        "HI": Math.random(),
                        "EPI": Math.random()
                    }
                }
            }
            return res.status(200).send(val);
        }
        result.forEach((ward) => {
            val[ward.ward_id] = {};
            layer_map.forEach((t) => {
                val[ward.ward_id][t.layer] = {};
                t.graph.forEach((graph) => {
                    debug(property_mapper(ward, prop_map[graph]));
                    val[ward.ward_id][t.layer][graph] = t.layer === 'My zone'? 0:property_mapper(ward, prop_map[graph]) ;
                });
            });
        });

        res.status(200).send(val);


    });
});

/**
 * Send which layers to plot
 */
router.get('/init/menu', (req, res) => {
    res.status(200).send(layer_map);
});

module.exports = router;