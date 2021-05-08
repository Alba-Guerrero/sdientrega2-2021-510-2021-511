module.exports = function(app, gestorBD) {

    app.get("/api/identificarse", function(req, res) {
        let respuesta = swig.renderFile('views/bidentificacion.html', {});
        res.send(respuesta);
    });

    app.post("/api/identificarse", function(req, res) {
        let seguro = app.get("crypto").createHmac('sha256', app.get('clave'))
            .update(req.body.password).digest('hex');
        let criterio = {
            email : req.body.email,
            password : seguro
        }

        gestorBD.obtenerUsuarios(criterio, function(usuarios) {
            if (usuarios == null || usuarios.length == 0) {
                res.status(401);
                res.json({
                    autenticado : false
                })
            } else {
                let token = app.get('jwt').sign(
                    { usuario: criterio.email , tiempo: Date.now()/1000 },
                    "secreto");
                res.status(200);
                res.json({
                    autenticado: true,
                    token : token
                });
            }
        });
    });

    app.post("/api/ofertas", function(req, res) {
        let criterio = {"vendedor": {$ne: req.body.email }};
        gestorBD.obtenerOfertas( criterio , function(ofertas) {
            if (ofertas == null) {
                res.status(500);
                res.json({
                    error : "Se ha producido un error"
                })
            } else {
                res.status(200);
                res.send( JSON.stringify(ofertas) );
            }
        });
    });
}