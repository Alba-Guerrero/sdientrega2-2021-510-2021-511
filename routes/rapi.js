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
        let criterio = {vendedor: {$ne: res.usuario}};


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
        let emisor = {email: res.usuario}

        gestorBD.obtenerUsuarios(emisor, function (usuarioEmisor) {
            if (usuarioEmisor.length == 0) {
                res.status(500);
                res.json({
                    error: "Se ha producido un error al obtener usuario"
                })

            } else {
                let oferta = {_id: gestorBD.mongo.ObjectID(req.params.id)};

                gestorBD.obtenerOfertas(oferta, function (ofertaRespuesta) {
                    if (ofertaRespuesta.length == 0) {
                        res.status(500);
                        res.json({
                            error: "Se ha producido un error al obtener oferta"
                        })

                    } else {
                        let conversacion = {
                            interesado : res.usuario,
                            oferta : oferta._id
                        }

                        let mensaje = {
                            emisor: res.usuario,
                            receptor: '',
                            oferta: oferta._id,
                            texto: req.body.texto,
                            fecha: new Date(),
                            leido: false
                        }

                        gestorBD.obtenerConversacion(conversacion, function (converRespuesta1) {
                            if (converRespuesta1.length != 0) {

                                if(res.usuario == ofertaRespuesta[0].vendedor)
                                    mensaje.receptor = converRespuesta1[0].interesado;
                                else
                                    mensaje.receptor = ofertaRespuesta[0].vendedor;

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
                            } else {
                                conversacion = {
                                    interesado : res.usuario,
                                    vendedor : ofertaRespuesta[0].vendedor,
                                    oferta : ofertaRespuesta[0]._id
                                }

                                gestorBD.insertarConversacion(conversacion, function (converRespuesta2) {
                                    if (converRespuesta2 == null) {
                                        res.status(500);
                                        res.json({
                                            error: "Se ha producido un error al insertar conversacion"
                                        })
                                    } else {
                                        if(res.usuario == ofertaRespuesta[0].vendedor)
                                            mensaje.receptor = converRespuesta2.interesado;
                                        else
                                            mensaje.receptor = ofertaRespuesta[0].vendedor;

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
    });

    /**
     * Metodo post para listar conversaciones
     */
    app.get("/api/oferta/conversacion/:id", function (req, res) {
        var usuario = {email: res.usuario};

        gestorBD.obtenerUsuarios(usuario, function (usuarioEmisor) {
            if (usuarioEmisor.length == 0) {
                res.status(500);
                res.json({
                    error: "Se ha producido un error al obtener usuario"
                })

            } else {
                let oferta = {_id: gestorBD.mongo.ObjectID(req.params.id)};

                gestorBD.obtenerOfertas(oferta, function (ofertaRespuesta) {
                    if (ofertaRespuesta.length == 0) {
                        res.status(500);
                        res.json({
                            error: "Se ha producido un error al obtener oferta"
                        })

                    } else {
                        if (ofertaRespuesta.vendedor == usuario.email) {
                            let mensaje = {
                                oferta: oferta._id,
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
                                    res.send(JSON.stringify(mensajeRespuesta1));
                                }
                            });
                        } else {
                            let mensaje = {
                                oferta: oferta._id,
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
                                    res.send(JSON.stringify(mensajeRespuesta2));
                                }
                            });
                        }
                    }
                });
            }
        });
    });
}