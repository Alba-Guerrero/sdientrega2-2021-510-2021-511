module.exports = function (app, swig, gestorBD) {


    app.get('/oferta/add', function (req, res) {
        if (req.session.usuario == null) {
            res.redirect("/oferta/list");
            return;
        }
        let respuesta = swig.renderFile('views/boferta.html', {});
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
        var oferta = {
            title: req.body.title,
            detalle: req.body.detalle,
            desripcion: req.body.descripcion,
            fecha: new Date(),
            precio: req.body.precio

        }

        // Conectarse
        gestorBD.insertarOferta(oferta, function (id) {
            if (id == null) {
                res.redirect("/ofertas/list");
            } else {

                if ( req.files.title != null && req.files.detalle != null && req.files.desripcion != null &&
                    req.files.fecha != null && req.files.precio != null) {

                    res.send("Agregada id: " + id);

                } else {
                    let respuesta = swig.renderFile('views/error.html',
                        {

                            mensaje: "no se puede agregar la oferta"
                        });
                    res.send(respuesta);

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
    gestorBD.eliminarOferta(criterio, function (ofertas) {
        if (ofertas == null) {
            res.send("No se ha podido eliminar esta oferta");
        } else {
            res.redirect("/ofertas/list");
        }
    });
})


app.get("/compradas", function (req, res) {
    let criterio = {autor: req.session.usuario};
    gestorBD.obtenerCompras(criterio, function (compras) {
        if (compras == null) {
            let respuesta = swig.renderFile('views/error.html',
                {

                    mensaje: "Error al listar "
                });
            res.send(respuesta);
        } else {
            let respuesta = swig.renderFile('views/bcompras.html',
                {
                    compras: compras
                });
            res.send(respuesta);
        }
    });
});


}
;