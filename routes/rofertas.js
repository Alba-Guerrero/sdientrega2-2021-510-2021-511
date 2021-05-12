module.exports = function (app, swig, gestorBD) {

    /**
     * Metodo get para añadir una oferta, redereiza el formulario para añadir una oferta
     */
    app.get('/oferta/add', function (req, res) {

        criterio = { email : req.session.usuario };
        gestorBD.obtenerUsuarios(criterio, function (usuarioRespuesta) {
            if (usuarioRespuesta.length == 0) {
                let respuesta = swig.renderFile('views/error.html',
                    {

                        mensaje: "Error al obtener usuario "
                    });
                res.send(respuesta);

            }else {
                let respuesta = swig.renderFile('views/boferta.html', {
                    usuario:req.session.usuario,
                    saldo : usuarioRespuesta[0].saldo

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
            if(ofertas==null){
                app.get("logger").error('rofertas:'+ req.session.usuario+'  Se ha producido un error al obtener las ofertas propias');
                let respuesta = swig.renderFile('views/error.html',
                    {

                        mensaje: "Se ha producido un error al obtener una oferta"
                    });
                res.send(respuesta);
            }
            else {
                app.get("logger").trace('rofertas:'+ req.session.usuario+'  Se ha accedido a las ofertas propias');

                let respuesta = swig.renderFile('views/bcompras.html',
                    {
                        ofertas: ofertas
                    });
                res.send(respuesta);
            }
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
                app.get("logger").error('rofertas:'+ req.session.usuario+'  Se ha producido un error al obtener el usuario');
                let respuesta = swig.renderFile('views/error.html',
                    {

                        mensaje: "Se ha producido un error al obtener el usuario"
                    });
                res.send(respuesta);

            } else {

                gestorBD.obtenerOfertas(ofertaId, function (oferta) {
                    if (oferta == null || oferta.length == 0) {
                        app.get("logger").error('rofertas:'+ req.session.usuario+'  Se ha producido un error al obtner la oferta');
                        let respuesta = swig.renderFile('views/error.html',
                            {

                                mensaje: "Se ha producido un error al obtener una oferta"
                            });
                        res.send(respuesta);
                    } else {
                        if (user[0].saldo - oferta[0].precio < 0) {
                            res.redirect("/oferta/list" + "?mensaje=No tienes suficientes dinero" +
                                "&tipoMensaje=alert-danger ")
                        }else if (user[0].email === oferta[0].vendedor) {
                            app.get("logger").trace('rofertas:'+ req.session.usuario+'  Se ha intentado comprar la oferta '+ req.params.id+' donde es el vendedor');
                                res.redirect("/oferta/list" + "?mensaje=No puedes comprar una oferta propia" +
                                    "&tipoMensaje=alert-danger ")

                        } else {

                            user[0].saldo = user[0].saldo - oferta[0].precio;
                            oferta[0].comprador = user[0].email;
                            oferta[0].comprada = true;

                            gestorBD.modificarOferta(ofertaId, oferta[0], function (ofertacallback) {
                                if (ofertacallback == null) {
                                    app.get("logger").trace('rofertas:'+ req.session.usuario+'  Se ha producido un error durante la compra de la oferta '+ req.params.id);
                                    let respuesta = swig.renderFile('views/error.html',
                                        {

                                            mensaje: "Se ha producido un error durante la compra"
                                        });
                                    res.send(respuesta);

                                } else {
                                    gestorBD.modificarUsuario(usuarioId, user[0], function (usercallback) {
                                        if (usercallback == null) {
                                            app.get("logger").trace('rofertas:'+ req.session.usuario+'  Se ha producido un error durante la compra de la oferta '+ req.params.id);
                                            let respuesta = swig.renderFile('views/error.html',
                                                {

                                                    mensaje: "Se ha producido un error durante la compra"
                                                });
                                            res.send(respuesta);
                                        } else {
                                            app.get("logger").trace('rofertas:El usuario '+ req.session.usuario+'  ha comprado con éxito la oferta '+ req.params.id);
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
            app.get("logger").trace('rofertas: Se ha itentado añadir una  una oferta sin estar logueado');
            res.redirect("/identificarse");
            return;
        }
        if (req.body.title < 2) {
            app.get("logger").trace('rofertas:El usuario '+ req.session.usuario+'  Se ha intentado añadir una oferta con un titulo inferior a dos caracteres');
            res.redirect("/oferta/add?mensaje=El título debe tener más de 2 caracteres");
            return;
        }
        if (req.body.desripcion < 2) {
            app.get("logger").trace('rofertas:El usuario '+ req.session.usuario+'  Se ha intentado añadir una oferta con una descricpion inferior a dos caracteres');
            res.redirect("/oferta/add?mensaje=La descricpión debe tener más de 2 caracteres");
            return;
        }
        if (req.body.precio < 0) {
            app.get("logger").trace('rofertas:El usuario '+ req.session.usuario+'  Se ha itentado añadir una oferta con un precio negativo');
            res.redirect("/oferta/add?mensaje=El precio contiene un valor negativo");
            return;
        }

        var ofer = {
            title: req.body.title,
            detalle: req.body.detalle,
            descripcion: req.body.descripcion,
            fecha: new Date(),
            precio: req.body.precio,
            vendedor: req.session.usuario,
            comprada: false,
            comprador: ""
        }

        gestorBD.insertarOferta(ofer, function (id) {
            if (id != null) {
                app.get("logger").trace('rofertas:El usuario '+ req.session.usuario+' Ha añadido una oferta con éxito con el siguiente id'+ id);
                res.redirect("/oferta/list?mensaje=Se ha insertado la oferta con éxito");

            } else {
                app.get("logger").trace('rofertas:El usuario '+ req.session.usuario+' Ha intentado añadir una oferta pero se ha producido un error');
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
    app.get("/misoferta/list", function (req, res) {
        let criterio = {vendedor: {$eq: req.session.usuario}};
        if (req.query.busqueda != null) {
            criterio = {"title": {$regex: ".*" + req.query.busqueda + ".*", '$options': 'i'}};
        }
        let pg = parseInt(req.query.pg); // Es String !!!
        if (req.query.pg == null) { // Puede no venir el param
            pg = 1;
        }
        gestorBD.obtenerOfertasPg(criterio, pg, function (ofertas, total) {
            if (ofertas == null) {
                app.get("logger").trace('rofertas:El usuario '+ req.session.usuario+' Ha intentado ver sus lista de ofertas pero se ha producido un error');
                let respuesta = swig.renderFile('views/error.html',
                    {

                        mensaje: "Error al listar las ofertas"
                    });
                res.send(respuesta);
            }
            else {
                criterio = {email: req.session.usuario};
                gestorBD.obtenerUsuarios(criterio, function (usuarioRespuesta) {
                    if (usuarioRespuesta.length == 0) {
                        let respuesta = swig.renderFile('views/error.html',
                            {

                                mensaje: "Error al obtener usuario "
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
                        app.get("logger").trace('rofertas:El usuario ' + req.session.usuario + ' Ha accedido a sus ofertas propias');

                        let respuesta = swig.renderFile('views/bofertaspropias.html',
                            {
                                usuario: req.session.usuario,
                                saldo:usuarioRespuesta[0].saldo,
                                ofertas: ofertas,
                                paginas: paginas,
                                actual: pg
                            });
                        res.send(respuesta);
                    }
                });
            }
        });

    });

    /**
     * Metodo get del lista de ofertas a comprar
     */
    app.get("/oferta/list", function (req, res) {
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
                app.get("logger").trace('rofertas:El usuario '+ req.session.usuario+' Ha intentado acceder a la lista de ofertas pero se ha producido un error');
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
                app.get("logger").trace('rofertas:El usuario '+ req.session.usuario+' Ha accedido a la lista de ofertas');
                criterio = { email : req.session.usuario };
                gestorBD.obtenerUsuarios(criterio, function (usuarioRespuesta) {
                    if (usuarioRespuesta.length == 0) {
                        let respuesta = swig.renderFile('views/error.html',
                            {

                                mensaje: "Error al obtener usuario "
                            });
                        res.send(respuesta);

                    } else {
                        let respuesta = swig.renderFile('views/btienda.html',
                            {
                                usuario: req.session.usuario,
                                saldo : usuarioRespuesta[0].saldo,
                                ofertas: ofertas,
                                paginas: paginas,
                                actual: pg
                            });
                        res.send(respuesta);
                    }
                });
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
                app.get("logger").trace('rofertas:El usuario '+ req.session.usuario+' Ha intentado eliminar la oferta '+req.params.id +' sin éxito');
                let respuesta = swig.renderFile('views/error.html',
                    {

                        mensaje: "No se ha podido eliminar esta oferta "
                    });
                res.send(respuesta);

            } else {
                app.get("logger").trace('rofertas:El usuario '+ req.session.usuario+' ha eliminado la oferta '+req.params.id +' correctamente');
                res.redirect("/misoferta/list");
            }
        });
    })

    /**
     * Metodo get para ver el listado de ofertas compradas
     */

    app.get("/oferta/compradas", function (req, res) {
        let criterio = {$and: [{"comprada": true}, {comprador: {$eq: req.session.usuario}}]};
        gestorBD.obtenerOfertas(criterio, function (ofertas) {
            if (ofertas == null) {
                app.get("logger").trace('rofertas:Se ha producido un error listando la oferta');
                let respuesta = swig.renderFile('views/error.html',
                    {

                        mensaje: "Error al listar "
                    });
                res.send(respuesta);
            } else {
                app.get("logger").trace('rofertas:Se ha accedido a la lista de ofertas compradas');
                criterio = { email : req.session.usuario };

                gestorBD.obtenerUsuarios(criterio, function (usuarioRespuesta) {
                    if (usuarioRespuesta.length == 0) {
                        res.status(500);
                        res.json({
                            error: "Se ha producido un error al obtener usuario"
                        })
                    } else {
                        let respuesta = swig.renderFile('views/bofertascompradas.html',
                            {
                                usuario: req.session.usuario,
                                saldo : usuarioRespuesta[0].saldo,
                                ofertas: ofertas
                            });
                        res.send(respuesta);
                    }
                });
            }
        });
    });
};