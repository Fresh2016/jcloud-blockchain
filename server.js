/**
 * Copyright 2017 Jingdong All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

var express  = require('express');
var app      = express();
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var manageClient = require('./app/manage/create-client.js');
/*
 * Server configuration
 */

// Default port is 8081
var port = process.env.PORT || 8081;

// Set the static files location /public/img will be /img for users
app.use(express.static(__dirname + '/public'));
// Parse application/x-www-form-urlencoded, application/json, and application/vnd.api+json as json
app.use(bodyParser.urlencoded({'extended':'true'}));
app.use(bodyParser.json());
app.use(bodyParser.json({ type: 'application/vnd.api+json' }));
// Override with the X-HTTP-Method-Override header in the request
app.use(methodOverride('X-HTTP-Method-Override'));



/*
 * Routes
 */
require('./app/routes.js')(app);



/*
 * Server starts listen
 */
app.listen(port);
console.log("App listening on port " + port);
//manageClient.initCreate();
