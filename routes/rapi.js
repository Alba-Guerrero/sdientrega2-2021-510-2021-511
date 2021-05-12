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
    app.post("/api/oferta/mensaje/:id/:interesado", function (req, res) {

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
                            interesado: req.params.interesado,
                            vendedor:ofertaRespuesta[0].vendedor,
                            oferta: oferta._id

                        }


                        let mensaje = {
                            emisor: res.usuario,
                            receptor: "",
                            oferta: oferta._id,
                            texto: req.body.texto,
                            fecha: new Date(),
                            leido: false
                        }

                        gestorBD.obtenerConversacion(conversacion, function (converRespuesta1) {
                            if (converRespuesta1.length != 0 && converRespuesta1!=null) {

                                if (res.usuario == converRespuesta1[0].vendedor)
                                    mensaje.receptor = converRespuesta1[0].interesado

                                else
                                    mensaje.receptor = converRespuesta1[0].vendedor;

                                console.log(mensaje.receptor);
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
                                    interesado: req.params.interesado,
                                    vendedor: ofertaRespuesta[0].vendedor,
                                    oferta: ofertaRespuesta[0]._id,
                                    title:ofertaRespuesta[0].title
                                }

                                gestorBD.insertarConversacion(conversacion, function (converRespuesta2) {
                                    if (converRespuesta2 == null) {
                                        res.status(500);
                                        res.json({
                                            error: "Se ha producido un error al insertar conversacion"
                                        })
                                    } else {
                                        if (res.usuario == ofertaRespuesta[0].vendedor)
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
        });
    });

    app.get("/api/conversacion/:id", function (req, res) {

        var usuario = {email: res.usuario};
        gestorBD.obtenerUsuarios(usuario, function (usuarioEmisor) {
            if (usuarioEmisor.length == 0) {
                res.status(500);
                res.json({
                    error: "Se ha producido un error al obtener usuario"
                })

            } else {
                let conversacion = {_id: gestorBD.mongo.ObjectID(req.params.id)};

                gestorBD.obtenerConversacion(conversacion, function (converRespuesta1) {
                    if (converRespuesta1.length === 0) {
                        res.status(500);
                        res.json({
                            error: "Se ha producido un error al obtener oferta"
                        })

                    } else {
                        let criterio = {
                            oferta: converRespuesta1[0].oferta,
                            $or: [
                                {emisor: converRespuesta1[0].interesado, receptor: converRespuesta1[0].vendedor},
                                {emisor: converRespuesta1[0].vendedor, receptor: converRespuesta1[0].interesado}
                            ]
                        }
                        gestorBD.obtenerMensaje(criterio, function (mensajeRespuesta) {
                            if (mensajeRespuesta == null) {
                                res.status(500);
                                res.json({
                                    error: "Se ha producido un error al obtener oferta"
                                })
                            } else {
                                res.status(200);
                                res.send(JSON.stringify(mensajeRespuesta));


                            }
                        });
                    }
                });
            }
        });
    })


    /**
     * Metodo post para obtener mensajes de una conversaciones
     */
    app.get("/api/conversaciones", function (req, res) {

       var usuario = {email: res.usuario};


        gestorBD.obtenerUsuarios(usuario, function (usuarioEmisor) {
            if (usuarioEmisor.length == 0) {
                res.status(500);
                res.json({
                    error: "Se ha producido un error al obtener usuario"
                })

            } else {
                        let criterio = {
                            $or: [
                                { vendedor : res.usuario},
                                { interesado : res.usuario}
                          ]}

                        gestorBD.obtenerConversacion(criterio, function (mensajeRespuesta) {
                            if (mensajeRespuesta == null) {
                                res.status(500);
                                res.json({
                                    error: "Se ha producido un error al obtener la conversacion"
                                })
                            } else {

                                res.status(200);
                                res.send(JSON.stringify(mensajeRespuesta));
                            }
                        });
                    }
                });
    });


    /**
     * Metodo post para obtener mensajes de una conversaciones
     */
    app.get("/api/oferta/mensaje/:id", function (req, res) {


        var usuario = {email: res.usuario};

        gestorBD.obtenerUsuarios(usuario, function (usuarioEmisor) {
            if (usuarioEmisor.length == 0) {
                res.status(500);
                res.json({
                    error: "Se ha producido un error al obtener usuario"
                })

            } else {
                let ofertaId = {_id: gestorBD.mongo.ObjectID(req.params.id)};

                gestorBD.obtenerOfertas(ofertaId, function (ofertas) {
                    if (ofertas.length === 0) {
                        res.status(500);
                        res.json({
                            error: "Se ha producido un error al obtener oferta"
                        })

                    } else  {
                        let criterio = { oferta :ofertas[0]._id ,
                            $or: [
                                { emisor : ofertas[0].vendedor},
                                { receptor : ofertas[0].vendedor}
                            ]}

                        gestorBD.obtenerMensaje(criterio, function (mensajeRespuesta) {
                            if (mensajeRespuesta == null) {
                                res.status(500);
                                res.json({
                                    error: "Se ha producido un error al obtener oferta"
                                })
                            } else {
                                console.log(mensajeRespuesta);
                                res.status(200);
                                res.send(JSON.stringify(mensajeRespuesta));
                            }
                        });
                    }
                });
            }
        });
    });

    app.put("/api/oferta/mensaje/leido/:id", function (req, res) {
        let criterio = {_id : gestorBD.mongo.ObjectID(req.params.id)};
        let mensaje = {leido : true};

        gestorBD.obtenerMensaje(criterio, function (mensajeRespuesta1) {
            if (mensajeRespuesta1 == null) {
                res.status(500);
                res.json({
                    error: "Se ha producido un error al obtener oferta"
                })
            } else if(res.usuario == mensajeRespuesta1[0].emisor || res.usuario == mensajeRespuesta1[0].receptor) {
                gestorBD.modificarMensaje(criterio, mensaje, function (respuesta) {
                    if (respuesta == null) {
                        res.status(500);
                        res.json({
                            error: "Se ha producido un error al obtener oferta"
                        })
                    } else {
                        res.status(200);
                        res.send({
                            respuesta : "Se ha modificado correctamente"
                        });
                    }
                });
            } else {
                res.status(500);
                res.json({
                    error: "No es el emisor o el receptor del mensaje"
                })
            }
        });
    });
}