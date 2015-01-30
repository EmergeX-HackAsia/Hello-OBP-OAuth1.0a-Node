// Open Bank Project

// Copyright 2011,2014 TESOBE / Music Pictures Ltd.

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

// http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Open Bank Project (http://www.openbankproject.com)
// Copyright 2011-2015 TESOBE / Music Pictures Ltd.

// This product includes software developed at
// TESOBE (http://www.tesobe.com/)
// by
// TESOBE: contact AT tesobe DOT com
// Nina Gänsdorfer: nina AT tesobe DOT com
// Everett Sochowski: everett AT tesobe DOT com
// Stefan Bethge: stefan AT tesobe DOT com

var express = require('express');
var session = require('express-session')
var util = require('util');
var oauth = require('oauth');

var app = express();

// To get the values for the following fields, please register your client here:
// https://apisandbox.openbankproject.com/consumer-registration
var _openbankConsumerKey = "yourOpenBankConsumerKey";
var _openbankConsumerSecret = "yourOpenBankConsumerSecret";

var base_url = 'https://apisandbox.openbankproject.com';
var consumer = new oauth.OAuth(
  base_url + '/oauth/initiate',
  base_url + '/oauth/token',
  _openbankConsumerKey,
  _openbankConsumerSecret,
  '1.0',                             //rfc oauth 1.0, includes 1.0a
  'http://127.0.0.1:8080/callback',
  'HMAC-SHA1');

var cookieParser = require('cookie-parser');
app.use(session({
  secret: "very secret",
  resave: false,
  saveUninitialized: true
}));


app.get('/connect', function(req, res){
  consumer.getOAuthRequestToken(function(error, oauthToken, oauthTokenSecret, results){
    if (error) {
      res.status(500).send("Error getting OAuth request token : " + util.inspect(error));
    } else {
      req.session.oauthRequestToken = oauthToken;
      req.session.oauthRequestTokenSecret = oauthTokenSecret;
      res.redirect(base_url + "/oauth/authorize?oauth_token="+req.session.oauthRequestToken);
    }
  });
});


app.get('/callback', function(req, res){
  consumer.getOAuthAccessToken(
    req.session.oauthRequestToken,
    req.session.oauthRequestTokenSecret,
    req.query.oauth_verifier,
    function(error, oauthAccessToken, oauthAccessTokenSecret, result) {
      if (error) {
        //oauthAccessToken, -Secret and result are now undefined
        res.status(500).send("Error getting OAuth access token : " + util.inspect(error));
      } else {
        //error is now undefined
        req.session.oauthAccessToken = oauthAccessToken;
        req.session.oauthAccessTokenSecret = oauthAccessTokenSecret;
        res.redirect('/signed_in');
      }
    }
  );
});


app.get('/signed_in', function(req, res){
  res.status(200).send('Signing in by OAuth worked. Now you can do API calls on private data like this one: <br><a href="/getBanks">Get private banks</a>')
});


app.get('/getBanks', function(req, res){
  consumer.get("https://apisandbox.openbankproject.com/obp/v1.2.1/banks/rbs/accounts/private",
  req.session.oauthAccessToken,
  req.session.oauthAccessTokenSecret,
  function (error, data, response) {
      var parsedData = JSON.parse(data);
      res.status(200).send(parsedData)
  });
});


app.get('*', function(req, res){
  res.redirect('/connect');
});

app.listen(8080);

