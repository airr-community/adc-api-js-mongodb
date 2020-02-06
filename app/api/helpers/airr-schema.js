'use strict';

//
// airr-schema.js
// Load AIRR schema for use by application
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

// Server environment config
var config = require('../../config/config');
var mongoSettings = require('../../config/mongoSettings');

// Node Libraries
var yaml = require('js-yaml');
var path = require('path');
var fs = require('fs');
var $RefParser = require('json-schema-ref-parser');

// API customization
var custom_file = undefined;
if (config.custom_file) {
    custom_file = require('../../config/' + config.custom_file);
}

// AIRR config
var airrConfig = {
  appRoot: __dirname, // required config
  configDir: 'config'
};

var airr = {};
module.exports = airr;

airr.schema = function() {
    // Load AIRR spec for field names
    var airrFile = path.resolve(airrConfig.appRoot, '../../config/airr-schema.yaml');
    //console.log(airrFile);
    var doc = yaml.safeLoad(fs.readFileSync(airrFile));
    if (!doc) {
	console.error('Could not load AIRR schema yaml file.');
	throw new Error('Could not load AIRR schema yaml file.');
    }
    // dereference all $ref objects, returns a promise
    return $RefParser.dereference(doc);
}

// Recursively walk through schema and collect all the required fields.
// The schema loader resolves the $ref references so we do not need to follow them.
airr.collectRequiredFields = function(schema, required_list, context) {
    for (var f in schema['properties']) {
	var full_field = f;
	if (context) full_field = context + '.' + f;
	//console.log(full_field);
	//console.log(schema['properties'][f]);

	if (schema['properties'][f]['x-airr']) {
	    // standard required field
	    if (schema['properties'][f]['x-airr']['required'])
		required_list.push(full_field);
	} else if (schema['properties'][f]['type'] == 'object') {
	    // sub-object
	    airr.collectRequiredFields(schema['properties'][f], required_list, full_field);
	} else if (schema['properties'][f]['type'] == 'array') {
	    if (schema['properties'][f]['items']['x-airr']) {
		// array of standard required fields
		if (schema['properties'][f]['items']['x-airr']['required'])
		    required_list.push(full_field);
	    } else if (schema['properties'][f]['items']['type'] == 'object') {
		// array of sub-objects
		airr.collectRequiredFields(schema['properties'][f]['items'], required_list, full_field);
	    } else if (schema['properties'][f]['items']['allOf']) {
		// array of composite objects
		for (var s in schema['properties'][f]['items']['allOf']) {
		    airr.collectRequiredFields(schema['properties'][f]['items']['allOf'][s], required_list, full_field);
		}
	    } else {
		// unhandled schema structure
		console.error('Unhandled schema array structure: ' + full_field);
	    }
	} else if (schema['properties'][f]['type']) {
	    // it has a type but is not required so ignore
	} else {
	    // unhandled schema structure
	    console.error('Unhandled schema structure: ' + full_field);
	}
    }
}

// Add the required fields to the document if any are missing
airr.addRequiredFields = function(document, required_list, schema) {
    for (var r in required_list) {
	var path = required_list[r].split('.');
	var obj = document;
	var spec = schema;
	for (var p = 0; p < path.length; p++) {
	    spec = spec['properties'][path[p]];
	    if (spec['type'] == 'array') {
		if ((spec['items']['type'] == undefined) || (spec['items']['type'] == 'object')) {
		    // array of object
		    if (obj[path[p]] == undefined) obj[path[p]] = [{}];
		    var sub_spec = spec['items'];
		    if (spec['items']['allOf']) {
			// need to combine the properties
			sub_spec = { type: 'object', properties: {} };
			for (var i in spec['items']['allOf']) {
			    var sub_obj = spec['items']['allOf'][i];
			    for (var j in sub_obj['properties']) {
				sub_spec['properties'][j] = sub_obj['properties'][j];
			    }
			}
		    }
		    for (var a in obj[path[p]]) {
			airr.addRequiredFields(obj[path[p]][a], [ path.slice(p+1).join('.') ], sub_spec);
		    }
		} else {
		    // array of primitive data types
		    if (obj[path[p]] == undefined) obj[path[p]] = null;
		}
		break;
	    } else if (spec['type'] == 'object') {
		if (obj[path[p]] == undefined) {
		    if (p == path.length - 1) obj[path[p]] = null;
		    else obj[path[p]] = {};
		}
		obj = obj[path[p]];
	    } else if (obj[path[p]] != undefined) obj = obj[path[p]];
	    else if (p == path.length - 1) obj[path[p]] = null;
	    else console.error('Internal error (addRequiredFields) do not know how to handle path element: ' + p);
	}
    }
}
