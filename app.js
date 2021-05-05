let express=require('express');
let crypto = require('crypto');
let app= express();
let expressSession = require('express-session');
let jwt = require('jsonwebtoken');
app.set('jwt',jwt);




let swig = require('swig');

let mongo = require('mongodb');

let bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
let fs = require('fs');


app.use(express.static('public'));

let gestorBD = require("./modules/gestorBD.js");
gestorBD.init(app,mongo);

app.use(expressSession({
    secret: 'abcdefg',
    resave: true,
    saveUninitialized: true
}));

//Variables
app.set('port',8081);
app.set('db','mongodb://admin:admin@mywallapop-shard-00-00.7adn3.mongodb.net:27017,mywallapop-shard-00-01.7adn3.mongodb.net:27017,mywallapop-shard-00-02.7adn3.mongodb.net:27017/myFirstDatabase?ssl=true&replicaSet=atlas-3o8e26-shard-0&authSource=admin&retryWrites=true&w=majority');
app.set('clave','abcdefg');
app.set('crypto',crypto);
//Rutas/controladores por lógica
require("./routes/rusuarios.js")(app,swig,gestorBD); // (app, param1, param2, etc.)
require("./routes/rofertas.js")(app,swig,gestorBD); // (app, param1, param2, etc.)




app.get('/', function (req, res) {
    res.redirect('/home');
})




app.listen(app.get('port'),function (){
    console.log('Servidor activo');
});