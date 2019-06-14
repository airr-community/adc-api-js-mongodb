'use strict';

//
// helpers.js
// Helper functions for use by application
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

module.exports = {
  queryString: queryString
};

var qs = require('qs');
var parseUrl = require('parseurl');
var debug = require('debug')('swagger');

// side-effect: stores in query property on req
function queryString(req) {
  if (!req.query) {
    var url = parseUrl(req);
    req.query = (url.query) ? qs.parse(url.query) : {};
  }
  return req.query;
}
