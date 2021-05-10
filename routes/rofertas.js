module.exports = function (app, swig, gestorBD) {

    /**
     * Metodo get para añadir una oferta, redereiza el formulario para añadir una oferta
     */
    app.get('/oferta/add', function (req, res) {
        if (req.session.usuario == null) {
            res.redirect("/oferta/list");
            return;
        }
        let respuesta = swig.renderFile('views/boferta.html', {});
        res.send(respuesta);
    })

    /**
     * Metodo para visualizar la tienda(listado de ofertas)
     */
    app.get("/tienda", function (req, res) {
        let criterio = {"vendedor": {$ne: req.session.usuario}};
        if (req.query.busqueda != null) {
            criterio = {
                $and: [{
                    "title": {
                        $regex: ".*" + req.query.busqueda + ".*",
                        '$options': 'i'
                    }
                }, {vendedor: {$ne: req.session.usuario}}]
            };
            //criterio={"title": {$regex: ".*" + req.query.busqueda + ".*",'$options' : 'i'}};
        }
        let pg = parseInt(req.query.pg);
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

    app.get("/compras", function (req, res) {
        let criterio = {
            comprador: req.session.usuario,
            comprada: true
        };
        gestorBD.obtenerOfertas(criterio, function (ofertas) {
            let respuesta = swig.renderFile('views/bcompras.html',
                {
                    ofertas: ofertas
                });
            res.send(respuesta);
        });
    });

    /**
     * Metodo get para comprar una oferta
     */
    app.get('/oferta/comprar/:id', function (req, res) {
        let ofertaId = {"_id": gestorBD.mongo.ObjectID(req.params.id)};
        let usuarioId = {email: req.session.usuario};

        gestorBD.obtenerUsuarios(usuarioId, function (user) {
            if (user == null || user.length == 0) {
                let respuesta = swig.renderFile('views/error.html',
                    {

                        mensaje: "Se ha producido un error al obtener el usuario"
                    });
                res.send(respuesta);

            } else {

                gestorBD.obtenerOfertas(ofertaId, function (oferta) {
                    if (oferta == null || oferta.length == 0) {
                        let respuesta = swig.renderFile('views/error.html',
                            {

                                mensaje: "Se ha producido un error al obtener una oferta"
                            });
                        res.send(respuesta);
                    } else {
                        if (user[0].saldo - oferta[0].precio < 0) {
                            res.redirect("/tienda" + "?mensaje=No tienes suficientes dinero" +
                                "&tipoMensaje=alert-danger ")
                        } else if (user[0].email === oferta[0].vendedor) {
                            res.redirect("/tienda" + "?mensaje=No puedes comprar una oferta propia" +
                                "&tipoMensaje=alert-danger ")

                        } else {

                            user[0].saldo = user[0].saldo - oferta[0].precio;
                            oferta[0].comprador = user[0].email;
                            oferta[0].comprada = true;

                            gestorBD.modificarOferta(ofertaId, oferta[0], function (ofertacallback) {
                                if (ofertacallback == null) {
                                    let respuesta = swig.renderFile('views/error.html',
                                        {

                                            mensaje: "Se ha producido un error durante la compra"
                                        });
                                    res.send(respuesta);

                                } else {
                                    gestorBD.modificarUsuario(usuarioId, user[0], function (usercallback) {
                                        if (usercallback == null) {
                                            let respuesta = swig.renderFile('views/error.html',
                                                {

                                                    mensaje: "Se ha producido un error durante la compra"
                                                });
                                            res.send(respuesta);
                                        } else {
                                            res.redirect("/compras?mensaje=Se ha realizado la compra con éxito" +
                                                "&tipoMensaje=alert-danger ");
                                        }
                                    });
                                }
                            });
                        }
                    }
                });

            }
        });


    });


    /**
     * Metodo post de añadir una oferta
     */
    app.post("/oferta", function (req, res) {
        if (req.session.usuario == null) {
            res.redirect("/identificarse");
            return;
        }
        if (req.body.title < 2) {
            res.redirect("/oferta/add?mensaje=El título debe tener más de 2 caracteres");
            return;
        }
        if (req.body.desripcion < 2) {
            res.redirect("/oferta/add?mensaje=La descricpión debe tener más de 2 caracteres");
            return;
        }
        if (req.body.precio < 0) {
            res.redirect("/oferta/add?mensaje=El precio contiene un valor negativo");
            return;
        }

        var ofer = {
            title: req.body.title,
            detalle: req.body.detalle,
            desripcion: req.body.descripcion,
            fecha: new Date(),
            precio: req.body.precio,
            vendedor: req.session.usuario,
            comprada: false,
            comprador: ""
        }

        gestorBD.insertarOferta(ofer, function (id) {
            if (id != null) {
                res.redirect("/ofertas/list?mensaje=Se ha insertado la oferta con éxito");

            } else {
                let respuesta = swig.renderFile('views/error.html',
                    {

                        mensaje: "No se puede agregar la oferta"
                    });
                res.send(respuesta);
            }
        });
    });

    /**
     * Metodo get de ofertas propias
     */
    app.get("/misofertas/list", function (req, res) {
        let criterio = {};
        if (req.query.busqueda != null) {
            criterio = {"title": {$regex: ".*" + req.query.busqueda + ".*", '$options': 'i'}};
        }
        let pg = parseInt(req.query.pg); // Es String !!!
        if (req.query.pg == null) { // Puede no venir el param
            pg = 1;
        }
        gestorBD.obtenerOfertasPg(criterio, pg, function (ofertas, total) {
            if (ofertas == null) {
                let respuesta = swig.renderFile('views/error.html',
                    {

                        mensaje: "Error al listar las ofertas"
                    });
                res.send(respuesta);
            } else {
                let ultimaPg = total / 5;
                if (total % 5 > 0) { // Sobran decimales
                    ultimaPg = ultimaPg + 1;
                }
                let paginas = []; // paginas mostrar
                for (let i = pg - 2; i <= pg + 2; i++) {
                    if (i > 0 && i <= ultimaPg) {
                        paginas.push(i);
                    }
                }
                let respuesta = swig.renderFile('views/bofertaspropias.html',
                    {
                        ofertas: ofertas,
                        paginas: paginas,
                        actual: pg
                    });
                res.send(respuesta);
            }
        });

    });

    /**
     * Metodo get del lista de ofertas a comprar
     */
    app.get("/ofertas/list", function (req, res) {
        let criterio = {"vendedor": {$ne: req.session.usuario}};
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
                let ultimaPg = total / 5;
                if (total % 5 > 0) { // Sobran decimales
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
                        usuario: req.session.usuario,
                        ofertas: ofertas,
                        paginas: paginas,
                        actual: pg
                    });
                res.send(respuesta);
            }
        });
    });

    /**
     * Método get para eliminar ofertas propias,renderiza vista de ofertas propias
     */
    app.get('/oferta/eliminar/:id', function (req, res) {
        let criterio = {"_id": gestorBD.mongo.ObjectID(req.params.id)};
        gestorBD.eliminarOferta(criterio, function (ofertas) {
            if (ofertas == null) {
                res.send("No se ha podido eliminar esta oferta");
            } else {
                res.redirect("/misofertas/list");
            }
        });
    })

    /**
     * Metodo get para ver el listado de ofertas compradas
     */
    app.get("/ofertas/compradas", function (req, res) {
        let criterio = {$and: [{"comprada": true}, {"vendedor": {$ne: req.session.usuario}}]};
        gestorBD.obtenerOfertas(criterio, function (ofertas) {
            if (ofertas == null) {
                let respuesta = swig.renderFile('views/error.html',
                    {

                        mensaje: "Error al listar "
                    });
                res.send(respuesta);
            } else {

                let respuesta = swig.renderFile('views/bofertascompradas.html',
                    {
                        ofertas: ofertas,

                    });
                res.send(respuesta);
            }
        });
    });
};