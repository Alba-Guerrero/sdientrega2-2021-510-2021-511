module.exports = function (app, swig, gestorBD) {


    app.get('/oferta/add', function (req, res) {
        if (req.session.usuario == null) {
            res.redirect("/oferta/list");
            return;
        }
        let respuesta = swig.renderFile('views/boferta.html', {});
        res.send(respuesta);
    })


    app.get("/tienda", function (req, res) {
        let criterio = {};
        if (req.query.busqueda != null) {
            criterio = {"title": {$regex: ".*" + req.query.busqueda + ".*",'$options' : 'i'}};
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


    app.get('/oferta/comprar/:id', function (req, res) {
        let ofertaId = gestorBD.mongo.ObjectID(req.params.id);
        let usuarioId = req.session.usuario;
        let compra = {
            usuario: req.session.usuario,
            ofertaId: ofertaId
        }
        gestorBD.obtenerUsuarios(usuarioId, function (user) {
            if (user == null || user.length == 0) {
                res.send("se ha producido un error");
            } else {

                gestorBD.obtenerOfertas(ofertaId, function (oferta) {
                    if (oferta == null || oferta.length == 0) {
                        res.send("se ha producido un error");
                    } else {
                        if (user[0].saldo - oferta[0].precio < 0) {
                            res.redirect("/tienda" + "?mensaje=No tienes suficientes dinero" +
                                "&tipoMensaje=alert-danger ")

                        } else {

                            user[0].saldo = user[0].saldo - oferta[0].precio;
                            oferta[0].comprador = user[0].email;
                            oferta[0].comprada = true;

                            gestorBD.modificarOferta(ofertaId, oferta[0], function (ofertacallback) {
                                if (ofertacallback == null) {
                                    res.send("error al modificar oferta");
                                } else {
                                    gestorBD.modificarUsuario(usuarioId, user[0], function (usercallback) {
                                        if (usercallback == null) {
                                            res.send("error al modificar ususrio");
                                        } else {
                                            res.redirect("/compras+?mensaje=Se harealizado la compra con éxito" +
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



    app.get("/ofertas", function (req, res) {
        let respuesta = "";
        if (req.query.title != null || req.query.detalle != null || req.query.descripcion != null || req.query.precio != null)
            respuesta += 'Titulo: ' + req.query.title + '<br>'
                + 'Detalle: ' + req.query.detalle + '<br>'
                + 'Descripción: ' + req.query.descripcion + '<br>'
                + 'Precio: ' + req.query.precio;

        res.send(respuesta);
    });



//añadir oferta

    app.post("/oferta", function (req, res) {
        if (req.session.usuario == null) {
            res.redirect("/ofertas/list");
            return;
        }
        var ofer = {
            title: req.body.title,
            detalle: req.body.detalle,
            desripcion: req.body.descripcion,
            fecha: new Date(),
            precio: req.body.precio,
            vendedor:req.session.usuario,
            comprada:false,
            comprador:""


        }

        // Conectarse
        gestorBD.insertarOferta(ofer, function (id) {
            if (id != null) {
                res.redirect("/ofertas/list?mensaje=Se ha insertado la oferta con éxito");

                } else {
                    let respuesta = swig.renderFile('views/error.html',
                        {

                            mensaje: "no se puede agregar la oferta"
                        });
                    res.send(respuesta);

                }

        });
    });

    app.get("/misofertas/list", function (req, res) {
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
    gestorBD.eliminarOferta(criterio, function (ofertas) {
        if (ofertas == null) {
            res.send("No se ha podido eliminar esta oferta");
        } else {
            res.redirect("/misofertas/list");
        }
    });
})


app.get("/compras", function (req, res) {
    let criterio = {autor: req.session.usuario};
    gestorBD.obtenerCompras(criterio, function (compras) {
        if (compras == null) {
            let respuesta = swig.renderFile('views/error.html',
                {

                    mensaje: "Error al listar "
                });
            res.send(respuesta);
        } else {
            let ofertasCompradasIds = [];
            for (i = 0; i < compras.length; i++) {
                ofertasCompradasIds.push(compras[i].ofertaId);
            }
            let criterio = {"_id": {$in: ofertasCompradasIds}}
            gestorBD.obtenerOfertas(criterio, function (ofertas) {
            let respuesta = swig.renderFile('views/bcompras.html',
                {
                    ofertas: ofertas
                });
            res.send(respuesta);
        });
    }
});


});

};