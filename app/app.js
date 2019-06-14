'use strict';

//
// app.js
// Application entry point
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

var app = require('express')();
var path = require('path');
var fs = require('fs');
var yaml = require('js-yaml');
var Runner = require('swagger-node-runner');

// Server environment config
var config = require('./config/config');
var airr = require('./api/helpers/airr-schema');

module.exports = app; // for testing

// Swagger middleware config
var swaggerConfig = {
  appRoot: __dirname, // required config
  configDir: 'config'
};

// Load swagger API
//console.log(config.appRoot);
var swaggerFile = path.resolve(swaggerConfig.appRoot, 'api/swagger/adc-api.yaml');
console.log('Using swapper API file: ' + swaggerFile);
swaggerConfig.swagger = yaml.safeLoad(fs.readFileSync(swaggerFile, 'utf8'));

airr.schema().then(function(schema) {
    // store the schema as a global so all code can see it
    console.log('Loaded AIRR schema.');
    global.airr = schema;

    Runner.create(swaggerConfig, function(err, runner) {
	if (err) { throw err; }

	// install middleware
	var swaggerExpress = runner.expressMiddleware();
	swaggerExpress.register(app);

	var port = config.port || 8080;
	app.listen(port);

	console.log('ADC API listening on port:' + port);
    });
})
.catch(function(err) {
    console.error('Failed to load AIRR schema.');
    console.error(err);
})
