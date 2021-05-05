module.exports = function(app,swig,gestorBD) {
    app.get("/usuarios", function(req, res) {
        res.send("ver usuarios");
    });



    app.get("/registrarse", function(req, res) {
        let respuesta = swig.renderFile('views/bregistro.html', {});
        res.send(respuesta);
    });
    app.post('/registrarse', function(req, res) {
        let seguro = app.get("crypto").createHmac('sha256', app.get('clave'))
            .update(req.body.password).digest('hex');
        let usuario = {

            email: req.body.email,
            name: req.body.name,
            lastname: req.body.lastname,
            password: seguro,
            saldo: 100,
            role: "estandar"

        }
        let usuarioCheck = {
            email: req.body.email,
            password: seguro
        }

        gestorBD.obtenerUsuarios(usuarioCheck, function (usuarios) {
            if (usuarios.length != 0) {
                res.redirect("/identificarse" +
                    "?mensaje=Este usuario ya existe en el sistema" +
                    "&tipoMensaje=alert-danger ");
            } else {
                if (req.body.password === req.body.repeatpassword)

                    gestorBD.insertarUsuario(usuario, function (id) {
                        if (id == null) {
                            res.redirect("/registrarse?mensaje=Error al registrar usuario");
                        } else {
                            res.redirect("/identificarse?mensaje=Nuevo usuario registrado");
                        }
                    });
            }
        });
    });

    app.get("/identificarse", function(req, res) {
        let respuesta = swig.renderFile('views/bidentificacion.html', {});
        res.send(respuesta);
    });


    app.post("/identificarse", function(req, res) {
        let seguro = app.get("crypto").createHmac('sha256', app.get('clave'))
            .update(req.body.password).digest('hex');
        let criterio = {
            email : req.body.email,
            password : seguro
        }
        gestorBD.obtenerUsuarios(criterio, function(usuarios) {
            if (usuarios == null || usuarios.length == 0) {
                req.session.usuario = null;
                res.redirect("/identificarse" +
                    "?mensaje=Email o password incorrecto"+
                    "&tipoMensaje=alert-danger ");
            } else {
                if (usuarios[0].email === "admin@email.com") {
                    req.session.usuario = usuarios[0].email;
                    res.redirect("/users/list");
                } else {
                    req.session.usuario = usuarios[0].email;
                    res.redirect("/ofertas/list");
                }
            }
        });
    });
    app.get('/desconectarse', function (req, res) {
        req.session.usuario = null;
        res.send("Usuario desconectado");
    })
    app.get("/users/list", function (req, res) {
        var criterio = {email: {$ne: "admin@email.com"}};
        gestorBD.obtenerUsuarios(criterio, function (usuarios) {
                var respuesta = swig.renderFile('views/busuarios.html', {

                    usuarios: usuarios

                });

                res.send(respuesta);
            });
        });
    app.post("/user/delete", function (req, res) {
        var emails= req.body.emails;
        var criterio= {email:  emails};

        gestorBD.eliminarUsuarios(criterio, function (usuarios) {
            if (usuarios == null) {
                res.send("Se ha producido un error eliminando un usuario");
            } else {
                gestorBD.eliminarOferta(criterio, function (oferta) {
                    if (oferta == null) {
                        res.send("Se ha producido un error eliminado una oferta");
                    } else {
                        res.redirect("/users/list");
                    }


                });
            }
    });
    });
};