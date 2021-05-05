
module.exports = function(app,swig,gestorBD) {


    app.get('/oferta/add', function (req, res) {
        if (req.session.usuario == null) {
            res.redirect("/tienda");
            return;
        }
        let respuesta = swig.renderFile('views/oferta/add.html', {});
        res.send(respuesta);
    })
    app.get('/oferta/modificar/:id', function (req, res) {
        let criterio = {"_id": gestorBD.mongo.ObjectID(req.params.id)};
        gestorBD.obtenerOfertas(criterio, function (ofertas) {
            if (ofertas == null) {
                res.send(respuesta);
            } else {
                let respuesta = swig.renderFile('views/bofertaModificar.html',
                    {
                        oferta: ofertas[0]
                    });
                res.send(respuesta);
            }
        });
    })


    app.get('/oferta/comprar/:id', function (req, res) {
        let ofertaId = gestorBD.mongo.ObjectID(req.params.id);
        let compra = {
            usuario: req.session.usuario,
            ofertaId: ofertaId
        }
        // let user = {"usuario": req.session.usuario};
        //  var res=autorIgualAUsuario(cancionId,user);
        // if(res) {
        gestorBD.insertarCompra(compra, function (idCompra) {
            if (idCompra == null) {
                res.send(respuesta);
            } else {
                res.redirect("/compras");
            }
        });
        // }
        //else{
        //   res.send("No se puede comprar mismo usuario");
        //  }

    });


    app.get('/oferta/:id', function (req, res) {
        let criterio = {"_id": gestorBD.mongo.ObjectID(req.params.id)};


        gestorBD.obtenerOfertas(criterio, function (ofertas) {
            if (ofertas == null) {
                res.send("Error al recuperar la oferta.");
            } else {
                let user = {"usuario": req.session.usuario};
                let result=false;
                gestorBD.obtenerCompras(user, function (compras) {

                    if (compras != null) {
                        for (i = 0; i < compras.length; i++) {
                            if (compras[i].ofertaId.toString() == req.params.id) {
                                console.log("Entro en el true");
                                result= true;

                            }

                        }

                    }
                     else {
                        let criterio2 = {"cancion_id": gestorBD.mongo.ObjectID(req.params.id)};
                        gestorBD.obtenerComentarios(criterio2, function (comentarios) {
                            if (comentarios != null) {
                                let configuracion = {
                                    url: "https://www.freeforexapi.com/api/live?pairs=EURUSD",
                                    method: "get",
                                    headers: {
                                        "token": "ejemplo",
                                    }
                                }
                                let rest = app.get("rest");
                                rest(configuracion, function (error, response, body) {
                                    console.log("cod: " + response.statusCode + " Cuerpo :" + body);
                                    let objetoRespuesta = JSON.parse(body);
                                    let cambioUSD = objetoRespuesta.rates.EURUSD.rate;
                                    // nuevo campo "usd"
                                    canciones[0].usd = cambioUSD * canciones[0].precio;
                                    let respuesta = swig.renderFile('views/busuarios.html',
                                        {
                                            cancion: canciones[0],
                                            comprada: false,
                                            comentarios: comentarios
                                        });
                                    res.send(respuesta);
                                });


                            } else {
                                let configuracion = {
                                    url: "https://www.freeforexapi.com/api/live?pairs=EURUSD",
                                    method: "get",
                                    headers: {
                                        "token": "ejemplo",
                                    }
                                }
                                let rest = app.get("rest");
                                rest(configuracion, function (error, response, body) {
                                    console.log("cod: " + response.statusCode + " Cuerpo :" + body);
                                    let objetoRespuesta = JSON.parse(body);
                                    let cambioUSD = objetoRespuesta.rates.EURUSD.rate;
                                    // nuevo campo "usd"
                                    canciones[0].usd = cambioUSD * canciones[0].precio;
                                    let respuesta = swig.renderFile('views/busuarios.html',
                                        {
                                            cancion: canciones[0],
                                            comprada: false,
                                            comentarios: comentarios
                                        });
                                    res.send(respuesta);
                                });
                            }


                        });
                    }
                });

            }
        });

    });
    app.get('/compras', function (req, res) {
        let criterio = {"usuario": req.session.usuario};
        gestorBD.obtenerCompras(criterio, function (compras) {
            if (compras == null) {
                let respuesta = swig.renderFile('views/error.html',
                    {

                        mensaje: "No se puede listar "
                    });
                res.send(respuesta);
            } else {
                let cancionesCompradasIds = [];
                for (i = 0; i < compras.length; i++) {
                    cancionesCompradasIds.push(compras[i].cancionId);
                }
                let criterio = {"_id": {$in: cancionesCompradasIds}}
                gestorBD.obtenerCanciones(criterio, function (canciones) {
                    let respuesta = swig.renderFile('views/bcompras.html',
                        {
                            canciones: canciones,
                            comprada:true
                        });
                    res.send(respuesta);
                });
            }
        });
    });


    app.get("/ofertas", function (req, res) {
        let respuesta = "";
        if (req.query.title != null || req.query.detalle != null || req.query.descripcion != null || req.query.precio != null)
            respuesta += 'Titulo: ' + req.query.title + '<br>'
                + 'Detalle: ' + req.query.detalle  + '<br>'
        + 'Descripción: ' + req.query.descripcion + '<br>'
                + 'Precio: ' + req.query.precio;

        res.send(respuesta);
    });


    app.get('/suma', function (req, res) {
        let respuesta = parseInt(req.query.num1) + parseInt(req.query.num2);
        res.send(String(respuesta));
    });


    app.post("/oferta", function (req, res) {
        if (req.session.usuario == null) {
            res.redirect("/tienda");
            return;
        }
        var oferta = {
            title: req.body.title,
            detalle: req.body.detalle,
            desripcion: req.body.descripcion,
            precio: req.body.precio

        }

        // Conectarse
        gestorBD.insertarOferta(oferta, function (id) {
            if (id == null) {
                res.redirect("/publicaciones");
            } else {
                if (req.files.portada != null) {
                    let audio = req.files.audio;
                    audio.mv('public/audios/' + id + '.mp3', function (err) {
                        if (err) {
                            let respuesta = swig.renderFile('views/error.html',
                                {

                                    mensaje: "no se puede agregar la oferta"
                                });
                            res.send(respuesta);

                        } else {

                            res.send("Agregada id: " + id);
                        }

                    });
                }
            }
        });

    });




    app.get("/ofertas/list", function (req, res) {
        let criterio = {};
        if (req.query.busqueda != null) {
            criterio = {"nombre": {$regex: ".*" + req.query.busqueda + ".*"}};
        }
        let pg = parseInt(req.query.pg); // Es String !!!
        if (req.query.pg == null) { // Puede no venir el param
            pg = 1;
        }
        gestorBD.obtenerOfertasPg(criterio, pg, function (ofertas, total) {
            if (ofertas == null) {
                let respuesta = swig.renderFile('views/error.html',
                    {

                        mensaje: "Error al listar "
                    });
                res.send(respuesta);
            } else {
                let ultimaPg = total / 4;
                if (total % 4 > 0) { // Sobran decimales
                    ultimaPg = ultimaPg + 1;
                }
                let paginas = []; // paginas mostrar
                for (let i = pg - 2; i <= pg + 2; i++) {
                    if (i > 0 && i <= ultimaPg) {
                        paginas.push(i);
                    }
                }
                let respuesta = swig.renderFile('views/btienda.html',
                    {
                        ofertas: ofertas,
                        paginas: paginas,
                        actual: pg
                    });
                res.send(respuesta);
            }
        });

    });

    app.get('/oferta/:id', function (req, res) {
        let respuesta = 'id: ' + req.params.id;
        res.send(respuesta);
    });

    app.get('/oferta/eliminar/:id', function (req, res) {
        let criterio = {"_id": gestorBD.mongo.ObjectID(req.params.id)};
        gestorBD.eliminarOferta(criterio, function (canciones) {
            if (canciones == null) {
                res.send(respuesta);
            } else {
                res.redirect("/publicaciones");
            }
        });
    })


    app.get("/publicaciones", function (req, res) {
        let criterio = {autor: req.session.usuario};
        gestorBD.obtenerCanciones(criterio, function (canciones) {
            if (canciones == null) {
                let respuesta = swig.renderFile('views/error.html',
                    {

                        mensaje: "Error al listar "
                    });
                res.send(respuesta);
            } else {
                let respuesta = swig.renderFile('views/bpublicaciones.html',
                    {
                        canciones: canciones
                    });
                res.send(respuesta);
            }
        });
    });



};