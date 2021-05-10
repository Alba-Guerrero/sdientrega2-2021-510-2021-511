let express=require('express');
let crypto = require('crypto');
let app= express();
let expressSession = require('express-session');
let jwt = require('jsonwebtoken');
app.set('jwt',jwt);

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Methods", "POST, GET, DELETE, UPDATE, PUT");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, token");
    // Debemos especificar todas las headers que se aceptan. Content-Type , token
    next();
});

app.use(expressSession({
    secret: 'abcdefg',
    resave: true,
    saveUninitialized: true
}));


let swig = require('swig');

let mongo = require('mongodb');

let bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
let fs = require('fs');


app.use(express.static('public'));

let gestorBD = require("./modules/gestorBD.js");
gestorBD.init(app,mongo);


//Variables
app.set('port',8081);
app.set('db','mongodb://admin:admin@mywallapop-shard-00-00.7adn3.mongodb.net:27017,mywallapop-shard-00-01.7adn3.mongodb.net:27017,mywallapop-shard-00-02.7adn3.mongodb.net:27017/myFirstDatabase?ssl=true&replicaSet=atlas-3o8e26-shard-0&authSource=admin&retryWrites=true&w=majority');
app.set('clave','abcdefg');
app.set('crypto',crypto);
//Rutas/controladores por lógica


app.get('/', function (req, res) {
    res.redirect('/home');
})




//Api
let routerUsuarioToken = express.Router();
routerUsuarioToken.use(function(req, res, next) {
    let token = req.headers['token'] || req.body.token || req.query.token;
    if (token != null) {
        jwt.verify(token, 'secreto', function(err, infoToken) {
            if (err || (Date.now()/1000 - infoToken.tiempo) > 600){
                res.status(403); // Forbidden
                res.json({
                    acceso : false,
                    error: 'Token invalido o caducado'
                });
                return;

            } else {
                res.usuario = infoToken.usuario;
                next();
            }
        });

    } else {
        res.status(403); // Forbidden
        res.json({
            acceso : false,
            mensaje: 'No existe token'
        });
    }
});
// Aplicar routerUsuarioToken
app.use('/api/oferta', routerUsuarioToken);
require("./routes/rapi.js")(app, gestorBD);
require("./routes/rusuarios.js")(app,swig,gestorBD); // (app, param1, param2, etc.)
require("./routes/rofertas.js")(app,swig,gestorBD); // (app, param1, param2, etc.)
app.listen(app.get('port'),function (){
    console.log('Servidor activo');
});
