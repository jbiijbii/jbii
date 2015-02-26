var express         = require('express');
var path            = require('path');
var favicon         = require('serve-favicon');
var logger          = require('morgan');
var cookieParser    = require('cookie-parser');
var bodyParser      = require('body-parser');
var mongodb         = require('mongodb');


// Setup mongodb
var dbServer, db, dbUser, dbPass, ipaddr, port;
dbServer= new mongodb.Server(process.env.OPENSHIFT_MONGODB_DB_HOST, parseInt(process.env.OPENSHIFT_MONGODB_DB_PORT));
db      = new mongodb.Db(process.env.OPENSHIFT_APP_NAME, dbServer, { auto_reconnect: true });
dbUser  = process.env.OPENSHIFT_MONGODB_DB_USERNAME;
dbPass  = process.env.OPENSHIFT_MONGODB_DB_PASSWORD;
ipaddr  = process.env.OPENSHIFT_NODEJS_IP;
port    = parseInt(process.env.OPENSHIFT_NODEJS_PORT) || 8080;
if (typeof ipaddr === "undefined") {
    console.warn('No OPENSHIFT_NODEJS_IP environment variable');
};
 //default response with info about app URLs
var conn = 'mongodb://' + dbUser + ':' + dbPass + '@' + process.env.OPENSHIFT_MONGODB_DB_HOST + ':' + process.env.OPENSHIFT_MONGODB_DB_PORT;



var routes = {};


routes['root'] = function (req, res) {
    res.render('index', { title: 'Express' });
};

routes['workweek_get'] = function (req, res) {
    
    //console.log('inside wrokweek_get routes  ' );

    var proxyurl = req.param('jbii', null);
    
    if (proxyurl) {
        if (proxyurl === 'get')
            return res.render('jbii-get', null)
        else if (proxyurl === 'post')
            return res.render('jbii-post', null);
        else
            res.render('error', { title: 'Express' });  
    } 
    else {
        res.render('error', { title: 'Express' });   
    }
};

routes['workweek_get_ww'] = function (req, res) {
    
    var workweek_date = req.params.ww_date;
    
    var json = { ww_date: workweek_date };
    var errobj = { status: 'error', message : 'invalid date ' + workweek_date, workweek: '' };
    
    db.collection('workweek').find(json).toArray(function (err, items) {
        if (err) res.json(errobj);
        else if (items.length === 0) res.json(errobj); //not found in collection
        else {
            wwobj = { status: 'success', message : '', workweek: items[0].year + 'WW' + items[0].week };
            res.json(wwobj);
        }
    });
};

routes['workweek_post'] = function (req, res) {
    
    var workweek_date = req.params.ww_date;
    
    //need to validate format here
    var json = { ww_date: workweek_date };
    var errobj = { status: 'error', message : 'invalid date ' + workweek_date, workweek: '' };
    //db.collection(process.env.OPENSHIFT_APP_NAME).find(json).toArray(function (err, items) {
    db.collection('workweek').find(json).toArray(function (err, items) {
        if (err) res.json(errobj);
        else if (items.length === 0) res.json(errobj); //not found in collection
        else {
            wwobj = { status: 'success', message : '', workweek: items[0].year + 'WW' + items[0].week };
            res.json(wwobj);
        }
    });
};

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
 
//define all the url mappings
app.get('/', routes['root']);
app.get('/'     + 'workweek',               routes['workweek_get']);
app.get('/'     + 'workweek'+'/:ww_date',   routes['workweek_get_ww']);
app.post('/'    + 'workweek',               routes['workweek_post']);

db.open(function(err, db){
    if(err){ throw err };
    db.authenticate(dbUser, dbPass, {authdb: "admin"}, function(err, res){
        if(err){ throw err };
	app.listen(port, ipaddr, function () {
    		console.log('listening on port ' + port);
	});
    });
});

