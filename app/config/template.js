'use strict';

//
// template.js
// Template for API service customization
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

var template = {};

module.exports = template;

//
// Customizations for /repertoire entrypoint.
//

// Customize parameter name/values when constructing query
template.parameterNameForQuerySamples = function(parameter, req, res) {
    //console.log('parameterNameForQuerySamples');
    return undefined;
}

// return a value, or return null skip parameter, or return undefined
// for default parameter handling
template.parameterValueForQuerySamples = function(parameter, req, res) {
    //console.log('parameterValueForQuerySamples');
    return undefined;
}

// Customize return data
template.dataCleanForQuerySamples = function(p, result, req, res) {
    //console.log('dataCleanForQuerySamples');
    return undefined;
}

//
// Customizations for /rearrangement entrypoints.
//

// Customize parameter name/values when constructing query
template.parameterNameForQuerySequences = function(parameter, req, res) {
    //console.log('parameterNameForQuerySequences');
    return undefined;
}

// return a value, or return null skip parameter, or return undefined
// for default parameter handling
template.parameterValueForQuerySequences = function(parameter, req, res) {
    //console.log('parameterValueForQuerySequences');
    return undefined;
}

// Customize count return data for /sequences_summary
template.countsForQuerySequencesSummary = function(counts, result, req, res) {
    //console.log('countsForQuerySequencesSummary');
    return undefined;
}

// Customize summary return data for /sequences_summary
template.dataCleanForQuerySequencesSummary = function(name, result, req, res) {
    //console.log('dataCleanForQuerySequencesSummary');
    return undefined;
}

// Customize items return data for /sequences_summary
template.dataCleanForQuerySequences = function(name, result, req, res) {
    //console.log('dataCleanForQuerySequences');
    return undefined;
}

// Customize header fields for /sequences_data
template.headersForQuerySequencesData = function(req, res) {
    console.log('headersForQuerySequencesData');
    return undefined;
}

// Customize return data for /sequences_data
template.dataCleanForQuerySequencesData = function(name, result, req, res) {
    //console.log('dataCleanForQuerySequencesData');
    return undefined;
}
