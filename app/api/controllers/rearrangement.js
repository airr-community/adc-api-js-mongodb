'use strict';

//
// rearrangement.js
// Rearrangement API service endpoints
//
// This file is part of the AIRR Data Commons API reference implementation.
// https://github.com/airr-community/adc-api
//
// The AIRR Community
// http://airr-community.org
//
// Copyright (C) 2019 The University of Texas Southwestern Medical Center
//
// Author: Scott Christley <scott.christley@utsouthwestern.edu>
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published
// by the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.
//

var util = require('util');

// Server environment config
var config = require('../../config/config');
var mongoSettings = require('../../config/mongoSettings');
var airr = require('../helpers/airr-schema');

var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');

var url = 'mongodb://'
    + mongoSettings.username + ':' + mongoSettings.userSecret + '@'
    + mongoSettings.hostname + ':27017/admin';

// API customization
var custom_file = undefined;
if (config.custom_file) {
    custom_file = require('../../config/' + config.custom_file);
}

/*
 Once you 'require' a module you can reference the things that it exports.  These are defined in module.exports.

 For a controller in a127 (which this is) you should export the functions referenced in your Swagger document by name.

 Either:
  - The HTTP Verb of the corresponding operation (get, put, post, delete, etc)
  - Or the operationId associated with the operation in your Swagger document
 */
module.exports = {
    getRearrangement: getRearrangement,
    queryRearrangements: queryRearrangements
};

/*
  Construct mongodb query based upon the filters parameters. The
  filters parameter is a JSON object that can be any number of nested
  levels, so we recursively construct the query.
*/
function constructQueryOperation(filter) {
    if (!filter['op']) return null;
    if (!filter['content']) return null;

    var content = filter['content'];

    // TODO: do we need to handle value being an array when a single value is expected?
    // TODO: mechanism to return error information
    // TODO: validate queryable field names?

    // determine type from schema
    var content_type = null;
    var content_properties = null;
    if (content['field'] != undefined) {
	var schema = global.airr['Rearrangement'];
	var props = schema;

	// traverse down the object schema hierarchy to find field definition
	var objs = content['field'].split('.');
	for (var i = 0; i < objs.length; ++i) {
	    var p = objs[i];
	    if (props.type == 'array') {
		if (config.debug) console.log(props.items);
		if (props.items.type == 'object') {
		    props = props.items.properties[p];
		} else if (props.items['allOf'] != undefined) {
		    var new_props = undefined;
		    for (var j = 0; j < props.items['allOf'].length; ++j) {
			if (props.items['allOf'][j].properties != undefined)
			    if (props.items['allOf'][j].properties[p] != undefined) {
				new_props = props.items['allOf'][j].properties[p];
				break;
			    }
		    }
		    props = new_props;
		}
	    } else if (props.type == 'object') {
		props = props.properties[p];
	    } else props = undefined;
	    if (props == undefined) break;
	}

	if (props != undefined) {
	    if (props['type'] != undefined) {
		content_type = props['type'];
		content_properties = props;
	    }
	} else {
	    console.error(content['field'] + ' is not found in AIRR schema.');
	}
    }
    // if not in schema then maybe its a custom field
    // so use the same type as the value.
    if (!content_type) content_type = typeof content['value'];
    if (config.debug) console.log('type: ' + content_type);

    // Check if query field is required. By default, the ADC API can reject
    // queries on the rearrangement endpoint for optional fields.
    if (content_properties != undefined) {
        if (content_properties['x-airr'] != undefined) {
            if ((content_properties['x-airr']['adc-query-support'] != undefined) &&
                (content_properties['x-airr']['adc-query-support'])) {
                // need to support query
            } else {
                // optional field, reject
                if (config.debug) console.log('VDJ-ADC-API INFO: ' + content['field'] + ' is an optional query field.');
                error['message'] = "query not supported on field: " + content['field'];
                return null;
            }
        }
    }

    // verify the value type against the field type
    // stringify the value properly for the query
    var content_value = undefined;
    if (content['value'] != undefined) {
        if (content['value'] instanceof Array) {
            // we do not bother checking the types of array elements
            content_value = JSON.stringify(content['value']);
        } else {
            // if the field is an array
            // then check if items are basic type
            if (content_type == 'array') {
                if (content_properties && content_properties['items'] && content_properties['items']['type'])
                    content_type = content_properties['items']['type'];
            }

            switch(content_type) {
            case 'integer':
            case 'number':
                if (((typeof content['value']) != 'integer') && ((typeof content['value']) != 'number')) {
                    return null;
                }
                content_value = content['value'];
                break;
            case 'boolean':
                if ((typeof content['value']) != 'boolean') {
                    return null;
                }
                content_value = content['value'];
                break;
            case 'string':
                if ((typeof content['value']) != 'string') {
                    return null;
                }
                content_value = '"' + content['value'] + '"';
                break;
            default:
                return null;
            }
        }
    }
    if (config.debug) console.log('value: ' + content_value);

    // query operators
    switch(filter['op']) {
    case '=':
	if ((content['field'] != undefined) && (content_value != undefined)) {
	    return '{"' + content['field'] + '":' + content_value + '}';
	}
	return null;

    case '!=':
	if ((content['field'] != undefined) && (content_value != undefined)) {
	    return '{"' + content['field'] + '": { "$ne":' + content_value + '}}';
	}
	return null;

    case '<':
	if ((content['field'] != undefined) && (content_value != undefined)) {
	    return '{"' + content['field'] + '": { "$lt":' + content_value + '}}';
	}
	return null;

    case '<=':
	if ((content['field'] != undefined) && (content_value != undefined)) {
	    return '{"' + content['field'] + '": { "$lte":' + content_value + '}}';
	}
	return null;

    case '>':
	if ((content['field'] != undefined) && (content_value != undefined)) {
	    return '{"' + content['field'] + '": { "$gt":' + content_value + '}}';
	}
	return null;

    case '>=':
	if ((content['field'] != undefined) && (content_value != undefined)) {
	    return '{"' + content['field'] + '": { "$gte":' + content_value + '}}';
	}
	return null;

    case 'contains':
        if (content_type != 'string') return null;
	if ((content['field'] != undefined) && (content_value != undefined)) {
	    return '{"' + content['field'] + '": { "$regex":' + content_value + ', "$options": "i"}}';
	}
	return null;

    case 'is': // is missing
    case 'is missing':
	if (content['field'] != undefined) {
	    return '{"' + content['field'] + '": { "$exists": false } }';
	}
	return null;

    case 'not': // is not missing
    case 'is not missing':
	if (content['field'] != undefined) {
	    return '{"' + content['field'] + '": { "$exists": true } }';
	}
	return null;

    case 'in':
	if ((content['field'] != undefined) && (content_value != undefined) && (content['value'] instanceof Array)) {
	    return '{"' + content['field'] + '": { "$in":' + content_value + '}}';
	}
	return null;

    case 'exclude':
	if ((content['field'] != undefined) && (content_value != undefined) && (content['value'] instanceof Array)) {
	    return '{"' + content['field'] + '": { "$nin":' + content_value + '}}';
	}
	return null;

    case 'and':
	if ((content instanceof Array) && (content.length > 1)) {
	    var exp_list = [];
	    for (var i = 0; i < content.length; ++i) {
		var exp = constructQueryOperation(content[i]);
		if (exp == null) return null;
		exp_list.push(exp);
	    }
	    return '{ "$and":[' + exp_list + ']}';
	}
	return null;

    case 'or':
	if ((content instanceof Array) && (content.length > 1)) {
	    var exp_list = [];
	    for (var i = 0; i < content.length; ++i) {
		var exp = constructQueryOperation(content[i]);
		if (exp == null) return null;
		exp_list.push(exp);
	    }
	    return '{ "$or":[' + exp_list + ']}';
	}
	return null;

    default:
	console.error('Unknown operator in filters:', filter['op']);
	return null;
    }

    // should not get here
    return null;
}

/*
  Functions in a127 controllers used for operations should take two parameters:

  Param 1: a handle to the request object
  Param 2: a handle to the response object
 */
function getRearrangement(req, res) {
    if (config.debug) console.log('getRearrangement: ' + req.swagger.params['sequence_id'].value);

    var result = {};
    var result_message = "Unknown error";
    var results = [];

    // all AIRR fields
    var all_fields = [];
    airr.collectFields(global.airr['Rearrangement'], 'airr-schema', all_fields, null);

    // construct info object for response
    var info = { };
    var schema = global.airr['Info'];
    info['title'] = config.info.description;
    info['description'] = 'API response for rearrangement query'
    info['version'] = schema.version;
    info['contact'] = schema.contact;

    MongoClient.connect(url, function(err, db) {
	assert.equal(null, err);
	if (config.debug) console.log("Connected successfully to mongo");

	var v1airr = db.db(mongoSettings.dbname);
	var collection = v1airr.collection('rearrangement');

	collection.findOne({ sequence_id: req.swagger.params['sequence_id'].value })
	    .then(function(record) {
		db.close();
		if (record) {
		    // by default include all AIRR required fields
		    if (record['_id']) delete record['_id'];
		    airr.addFields(record, all_fields, global.airr['Rearrangement']);
		    res.json({"Info":info,"Rearrangement":[record]});
		} else
		    res.json({"Info":info,"Rearrangement":[]});
	    })
	    .catch(function() {
		db.close();
		res.status(500).json({"message":result_message});
		return;
	    });	
    });
}

function queryRearrangements(req, res) {
    if (config.debug) console.log('queryRearrangements');

    var results = [];
    var result = {};
    var result_message = "Unknown error";

    var bodyData = req.swagger.params['data'].value;

    // AIRR fields
    var all_fields = [];
    if (bodyData['include_fields']) {
	airr.collectFields(global.airr['Rearrangement'], bodyData['include_fields'], all_fields, null);
        if (config.debug) console.log(all_fields);
    }

    // field projection
    var projection = {};
    if (bodyData['fields'] != undefined) {
	var fields = bodyData['fields'];
	if (config.debug) console.log('fields: ', fields);
	if (! (fields instanceof Array)) {
	    result_message = "fields parameter is not an array.";
	    res.status(400).json({"message":result_message});
	    return;
	}
	for (var i = 0; i < fields.length; ++i) {
	    if (fields[i] == '_id') continue;
	    projection[fields[i]] = 1;
	}

	// add AIRR required fields to projection
	// NOTE: projection will not add a field if it is not already in the document
	// so below after the data has been retrieved, missing fields need to be
	// added with null values.
	if (all_fields.length > 0) {
	    for (var r in all_fields) projection[all_fields[r]] = 1;
	}

        // add to field list so will be put in response if necessary
	for (var i = 0; i < fields.length; ++i) {
	    if (fields[i] == '_id') continue;
            all_fields.push(fields[i]);
        }
    }
    projection['_id'] = 0;

    // format parameter
    var format = 'json';
    if (bodyData['format'] != undefined)
    format = bodyData['format'];
    if ((format != 'json') && (format != 'tsv')) {
        result_message = "Unknown format.";
        res.status(400).json({"message":result_message});
        return;
    }

    // from parameter
    var from = 0;
    if (bodyData['from'] != undefined)
	from = bodyData['from'];
    if (from < 0) {
	result_message = "Invalid from parameter.";
	res.status(400).json({"message":result_message});
	return;
    }

    // size parameter
    var size = config.max_size;
    if (bodyData['size'] != undefined)
	size = bodyData['size'];
    if (size < 0) {
	result_message = "Invalid size parameter.";
	res.status(400).json({"message":result_message});
	return;
    }
    if (size > config.max_size) {
	result_message = "Size (" + size + ") exceeds maximum size (" + config.max_size + ").";
	res.status(400).json({"message":result_message});
	return;
    }

    // construct query string
    var filter = {};
    var query = undefined;
    if (bodyData['filters'] != undefined) {
	filter = bodyData['filters'];
	if (config.debug) console.log(filter);
	try {
	    query = constructQueryOperation(filter);
	    if (config.debug) console.log(query);

	    if (!query) {
		result_message = "Could not construct valid query.";
		res.status(400).json({"message":result_message});
		return;
	    }

	    // turn query string into JSON for mongo
            query = JSON.parse(query);
	} catch (e) {
            result_message = "Could not construct valid query: " + e;
            res.status(400).json({"message":result_message});
            return;
	}
    }

    // facets parameter
    var facets = bodyData['facets'];
    var agg = [];
    if (facets != undefined) {
        if (query) agg.push({ $match: query });
	agg.push(
		{ $group: {
		    _id: '$' + facets,
		    count: { $sum: 1}
		}});
	if (config.debug) console.log(agg);
    }

    // construct info object for response
    var info = { };
    var schema = global.airr['Info'];
    info['title'] = config.info.description;
    info['description'] = 'API response for rearrangement query'
    info['version'] = schema.version;
    info['contact'] = schema.contact;

    // Handle client HTTP request abort
    var abortQuery = false;
    req.on("close", function() {
	if (config.debug) console.log('Client request closed unexpectedly');
	abortQuery = true;
    });

    MongoClient.connect(url, function(err, db) {
	assert.equal(null, err);
	if (config.debug) console.log("Connected successfully to mongo");

	var v1airr = db.db(mongoSettings.dbname);
	var collection = v1airr.collection('rearrangement');

	if (facets) {
	    // perform a facets aggregation query
	    collection.aggregate(agg).toArray()
		.then(function(records) {
		    //console.log(records);
		    if (config.debug) console.log('Retrieve ' + records.length + ' records.');
		    
		    for (var i in records) {
			var entry = records[i];
			var new_entry = {}
			new_entry[facets] = entry['_id'];
			new_entry['count'] = entry['count'];
			results.push(new_entry);
		    }

		    db.close();
		    res.json({"Info":info,"Facet":results});
		    return;
		})
		.catch(function() {
		    db.close();
		    res.status(500).json({"message":result_message});
		    return;
		});
	} else {
	    // format parameter
	    if (format == 'json') {
		res.setHeader('Content-Type', 'application/json');
		res.setHeader('Content-Disposition', 'attachment;filename="data.json"');
	    } else if (format == 'tsv') {
		res.setHeader('Content-Type', 'text/tsv');
		res.setHeader('Content-Disposition', 'attachment;filename="data.tsv"');

		// Load AIRR spec for field names
		var schema = global.airr['Rearrangement'];
		if (!schema) {
		    console.error('Rearrangement schema missing.');
		    res.status(500).end();
		    return;
		}

		var headers = [];
		// if fields parameter specified then return only those fields
		// if include_fields parameter, those fields were added
		// to the projection and thus added to the headers here.
		if (bodyData['fields'] != undefined) {
		    // schema fields
		    for (var p in schema['properties']) {
			if (projection[p]) headers.push(p);
		    }
		    // add custom fields on end
		    for (var p in projection) {
			if (projection[p]) {
		            if (schema['properties'][p]) continue;
		            else headers.push(p);
			}
		    }
		} else {
		    // otherwise return the schema fields
		    for (var p in schema['properties']) {
                        // skip deprecated
                        if ((schema['properties'][p]['x-airr']) && (schema['properties'][p]['x-airr']['deprecated']))
                            continue;
                        headers.push(p);
                    }
		}

		res.write(headers.join('\t'));
		res.write('\n');
		if (config.debug) console.log(headers);
	    }

	    var first = true;
	    if (format == 'json')
		res.write('{"Info":' + JSON.stringify(info) + ',"Rearrangement": [\n');

	    // perform a normal query
	    var cursor = collection.find(query).skip(from).limit(size).project(projection);
	    cursor.forEach(function(entry) {
		if (abortQuery) {
		    if (config.debug) console.log('aborting query');
		    cursor.close(function(err, result) {
			// db will be closed by callback
		    });
		} else {
		    // data cleanup
		    var record = '';
		    for (var p in entry) {
			if (entry[p] == undefined) delete entry[p];
			else if ((typeof entry[p] == 'string') && (entry[p].length == 0)) delete entry[p];
			else if (p == '_id') delete entry[p];
			//else if (custom_file) custom_file.dataCleanForQuerySequencesData(p, entry, req, res);
		    }

		    // add any missing required fields
		    if (all_fields.length > 0) {
			airr.addFields(entry, all_fields, global.airr['Rearrangement']);
		    }

		    if (!first) {
			if (format == 'json') res.write(',\n');
			if (format == 'tsv') res.write('\n');
		    }  else {
			first = false;
		    }

		    if (format == 'json') res.write(JSON.stringify(entry));
		    if (format == 'tsv') {
			var vals = [];
			for (var i = 0; i < headers.length; ++i) {
			    var p = headers[i];
			    //if (config.debug) console.log(p, entry[p]);
			    if (entry[p] == undefined) vals.push('');
			    else vals.push(entry[p]);
			}
			res.write(vals.join('\t'));
		    }
		}
	    }, function(err) {
	        db.close();
	        if (format == 'json') res.write(']}\n');
	        if (format == 'tsv') res.write('\n');
	        res.end();
	    });
	}
    });
}
