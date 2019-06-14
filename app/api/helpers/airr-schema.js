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

module.exports.schema = function() {
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
