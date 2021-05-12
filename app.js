let express=require('express');
let crypto = require('crypto');
let app= express();
let expressSession = require('express-session');
let jwt = require('jsonwebtoken');
app.set('jwt',jwt);
const log4js = require("log4js");
log4js.configure({
    appenders: { MyWallapop: { type: "file", filename: "MyWallapop.log" } },
    categories: { default: { appenders: ["MyWallapop"], level: "trace" } }
});

const logger = log4js.getLogger("MyWallapop");
app.set('logger', logger);


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

//Redireccion
app.get('/', function (req, res) {
    res.redirect('/tienda');
})

//RouterUsuarioToken
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

//RouterUsuario
var routerUsuarioSession = express.Router();
routerUsuarioSession.use(function(req, res, next) {
    if ( req.session.usuario ) {
        next();
    } else {
        res.redirect("/identificarse");
    }
});

//RouterAdmin
var routerAdminSession = express.Router();
routerAdminSession.use(function(req, res, next) {
    if ( req.session.usuario === "admin@email.com" )
        next();
    else {
        if( req.session.usuario )
            res.redirect("/ofertas/list");
        else
            res.redirect("/identificarse");
    }
});

//RouterComprarOferta
let routerComprarOferta = express.Router();
routerComprarOferta.use(function(req, res, next) {
    let path = require('path');
    let idOferta = path.basename(req.originalUrl);

    gestorBD.obtenerOfertas({"_id": mongo.ObjectID(idOferta) }, function (ofertas) {
            if(req.session.usuario &&  req.session.usuario != ofertas[0].vendedor) {
                next();
            } else {
                res.redirect("/ofertas/list");
            }
        })
});

//RouterEliminarOferta
let routerEliminarOferta = express.Router();
routerEliminarOferta.use(function(req, res, next) {
    let path = require('path');
    let idOferta = path.basename(req.originalUrl);

    gestorBD.obtenerOfertas({"_id": mongo.ObjectID(idOferta) }, function (ofertas) {
            if(req.session.usuario &&  req.session.usuario == ofertas[0].vendedor) {
                next();
            } else {
                res.redirect("/ofertas/list");
            }
        })
});

//RoutersAdmin
//app.use("/users/list",routerAdminSession);
//app.use("/users/delete",routerAdminSession);

//RouterComprarOferta
app.use("/oferta/comprar/*",routerComprarOferta);

//RouterEliminarOferta
app.use("/oferta/eliminar/*",routerEliminarOferta);

//RoutersUsuario
app.use("/compras",routerUsuarioSession);
app.use("/oferta/add",routerUsuarioSession);
app.use("/oferta",routerUsuarioSession);
app.use("/ofertas/list",routerUsuarioSession);
app.use("/ofertas/compradas",routerUsuarioSession);
app.use("/misofertas/list",routerUsuarioSession);

//RouterToken
app.use('/api/oferta', routerUsuarioToken);
app.use('/api/conversaciones', routerUsuarioToken);
app.use('/api/conversacion', routerUsuarioToken);

//Requires
require("./routes/rapi.js")(app, gestorBD);
require("./routes/rusuarios.js")(app,swig,gestorBD);
require("./routes/rofertas.js")(app,swig,gestorBD);

app.listen(app.get('port'),function (){
    console.log('Servidor activo');
});
