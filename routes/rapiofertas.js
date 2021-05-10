module.exports = function (app, gestorBD) {

    /**
     * Metodo post para iniciar sesion
     */
    app.post("/api/identificarse", function (req, res) {
        let seguro = app.get("crypto").createHmac('sha256', app.get('clave'))
            .update(req.body.password).digest('hex');
        let criterio = {
            email: req.body.email,
            password: seguro
        }

        gestorBD.obtenerUsuarios(criterio, function (usuarios) {
            if (usuarios == null || usuarios.length == 0) {
                res.status(401);
                res.json({
                    autenticado: false
                })
            } else {
                let token = app.get('jwt').sign(
                    {usuario: criterio.email, tiempo: Date.now() / 1000},
                    "secreto");
                res.status(200);
                res.json({
                    autenticado: true,
                    token: token
                });
            }
        });
    });

    /**
     * Metodo get para listar ofertas no propias
     */
    app.get("/api/oferta", function (req, res) {
        let criterio = {"vendedor": {$ne: req.body.email}};

        gestorBD.obtenerOfertas(criterio, function (ofertas) {
            if (ofertas == null) {
                res.status(500);
                res.json({
                    error: "Se ha producido un error al obtener oferta"
                })
            } else {
                res.status(200);
                res.send(JSON.stringify(ofertas));
            }
        });
    });

    /**
     * Metodo post para añadir un mensaje
     */
    app.post("/api/oferta/mensaje/:id", function (req, res) {
        if (req.body.emisor != req.body.receptor) {
            var emisor = {
                email: req.body.emisor
            }

            gestorBD.obtenerUsuarios(emisor, function (usuarioEmisor) {
                if (usuarioEmisor.length == 0) {
                    res.status(500);
                    res.json({
                        error: "Se ha producido un error al obtener usuario"
                    })

                } else {
                    var receptor = {
                        email: req.body.receptor
                    }

                    gestorBD.obtenerUsuarios(receptor, function (usuarioReceptor) {
                        if (usuarioReceptor.length == 0) {
                            res.status(500);
                            res.json({
                                error: "Se ha producido un error al obtener usuario"
                            })

                        } else {
                            let oferta = {
                                _id: gestorBD.mongo.ObjectID(req.params.id),
                                vendedor: receptor.email
                            };

                            gestorBD.obtenerOfertas(oferta, function (ofertaRespuesta) {
                                if (ofertaRespuesta.length == 0) {
                                    res.status(500);
                                    res.json({
                                        error: "Se ha producido un error al obtener oferta"
                                    })

                                } else {
                                    var mensaje = {
                                        emisor: req.body.emisor,
                                        receptor: req.body.receptor,
                                        oferta: oferta._id,
                                        mensaje: req.body.mensaje,
                                        fecha: new Date(),
                                        leido: false
                                    }

                                    gestorBD.insertarMensaje(mensaje, function (id) {
                                        if (id == null) {
                                            res.status(500);
                                            res.json({
                                                error: "Se ha producido un error al insertar mensaje"
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

    /**
     * Metodo post para listar conversaciones
     */
    app.get("/api/oferta/conversacion/:id", function (req, res) {
        var usuario = {
            email: req.body.email
        };

        gestorBD.obtenerUsuarios(usuario, function (usuarioEmisor) {
            if (usuarioEmisor.length == 0) {
                res.status(500);
                res.json({
                    error: "Se ha producido un error al obtener usuario"
                })

            } else {
                let oferta = {
                    _id: gestorBD.mongo.ObjectID(req.params.id),
                };

                gestorBD.obtenerOfertas(oferta, function (ofertaRespuesta) {
                    if (ofertaRespuesta.length == 0) {
                        res.status(500);
                        res.json({
                            error: "Se ha producido un error al obtener oferta"
                        })

                    } else {
                        if(ofertaRespuesta.vendedor == usuario.email) {
                            let mensaje = {
                                oferta: gestorBD.mongo.ObjectID(req.params.id),
                                receptor: usuario.email
                            }

                            gestorBD.obtenerMensaje(mensaje, function (mensajeRespuesta1) {
                                if (mensajeRespuesta1 == null) {
                                    res.status(500);
                                    res.json({
                                        error: "Se ha producido un error al obtener mensaje"
                                    })
                                } else {
                                    res.status(200);
                                    res.send( JSON.stringify(mensajeRespuesta1));
                                }
                            });
                        } else {
                            let mensaje = {
                                oferta: gestorBD.mongo.ObjectID(req.params.id),
                                emisor: usuario.email
                            }

                            gestorBD.obtenerMensaje(mensaje, function (mensajeRespuesta2) {
                                if (mensajeRespuesta2 == null) {
                                    res.status(500);
                                    res.json({
                                        error: "Se ha producido un error al obtener mensaje"
                                    })
                                } else {
                                    res.status(200);
                                    res.send( JSON.stringify(mensajeRespuesta2));
                                }
                            });
                        }
                    }
                });
            }
        });
    });
}