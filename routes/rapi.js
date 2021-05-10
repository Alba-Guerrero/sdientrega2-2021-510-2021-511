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

    app.post("/api/oferta", function(req, res) {
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

    /**
     * Metodo post para añadir un mensaje
     */
    app.post("/api/oferta/mensaje/:id", function (req, res) {
        if(req.body.emisor != req.body.receptor) {
            var emisor = {
                email : req.body.emisor
            }

            gestorBD.obtenerUsuarios(emisor, function (usuarios) {
                if (usuarios.length == 0) {
                    res.status(500);
                    res.json({
                        error: "El emisor no existe"
                    })

                } else {
                    var receptor = {
                        email : req.body.receptor
                    }

                    gestorBD.obtenerUsuarios(receptor, function (usuarios) {
                        if (usuarios.length == 0) {
                            res.status(500);
                            res.json({
                                error: "El receptor no existe"
                            })

                        } else {
                            let oferta = {
                                "_id": gestorBD.mongo.ObjectID(req.params.id),
                                "vendedor": receptor.email
                            };

                            gestorBD.obtenerOfertas(oferta, function (usuarios) {
                                if (usuarios.length == 0) {
                                    res.status(500);
                                    res.json({
                                        error: "La oferta no existe"
                                    })

                                } else {
                                    var mensaje = {
                                        emisor: req.body.emisor,
                                        receptor: req.body.receptor,
                                        oferta: oferta,
                                        mensaje: req.body.mensaje,
                                        fecha: new Date(),
                                        leido:false
                                    }

                                    gestorBD.insertarMensaje(mensaje, function (id) {
                                        if (id == null) {
                                            res.status(500);
                                            res.json({
                                                error: "Se ha producido un error"
                                            })
                                        } else {
                                            res.status(200);
                                            res.json({
                                                mensaje: "Mensaje insertado correctamente",
                                                _id: id
                                            })
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }
    });

}