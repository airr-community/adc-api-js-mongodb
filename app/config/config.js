'use strict';

//
// config.js
// Application configuration settings
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

var path = require('path');
var fs = require('fs');

var config = {};

module.exports = config;

// General
config.port = process.env.API_PORT;

// API customization
config.custom_file = process.env.CUSTOM_FILE;

// Error/debug reporting
config.debug = process.env.DEBUG_CONSOLE;
config.slackURL = process.env.SLACK_WEBHOOK_URL;

// get info
var infoFile = path.resolve(__dirname, '../package.json');
var infoString = fs.readFileSync(infoFile, 'utf8');
config.info = JSON.parse(infoString);

// constraints
config.max_size = 1000;
config.max_query_size = 2 * 1024 * 1024;
