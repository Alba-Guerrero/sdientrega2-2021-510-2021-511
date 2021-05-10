module.exports = function (app, swig, gestorBD) {

    app.get("/registrarse", function (req, res) {
        let respuesta = swig.renderFile('views/bregistro.html', {});
        res.send(respuesta);
    });

    app.post('/registrarse', function (req, res) {
        let seguro = app.get("crypto").createHmac('sha256', app.get('clave'))
            .update(req.body.password).digest('hex');

        if (!req.body.email.includes("@")) {
            res.redirect("/registrarse?mensaje=El email no tiene un formato válido");
            return;
        }
        if (req.body.name.length < 2) {
            res.redirect("/registrarse?mensaje=El nombre contiene menos de 2 caracteres");
            return;
        }
        if (req.body.lastname.length < 2) {
            res.redirect("/registrarse?mensaje=El apellido contiene menos de 2 caracteres");
            return;
        }

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
                if (req.body.password === req.body.repeatpassword){

                    gestorBD.insertarUsuario(usuario, function (id) {
                        if (id == null) {
                            res.redirect("/registrarse?mensaje=Error al registrar usuario");
                        } else {
                            res.redirect("/identificarse?mensaje=Nuevo usuario registrado");
                        }
                    });
                }
                else{
                    res.redirect("/registrarse?mensaje=Las contraseñas no coinciden");

                }}
        });
    });

    app.get("/identificarse", function (req, res) {
        let respuesta = swig.renderFile('views/bidentificacion.html', {});
        res.send(respuesta);
    });

    app.post("/identificarse", function (req, res) {
        let seguro = app.get("crypto").createHmac('sha256', app.get('clave'))
            .update(req.body.password).digest('hex');

        if (!req.body.email.includes("@")) {
            res.redirect("/identificarse?mensaje=El email no tiene un formato válido");
            return;
        }

        let criterio = {
            email: req.body.email,
            password: seguro
        }
        gestorBD.obtenerUsuarios(criterio, function (usuarios) {
            if (usuarios == null || usuarios.length == 0) {
                req.session.usuario = null;
                res.redirect("/identificarse" +
                    "?mensaje=Email o password incorrecto" +
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
        res.redirect("/identificarse" +
            "?mensaje=Ha cerrado sesión con éxito"+
            "&tipoMensaje=alert-danger ");
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

        if(req.session.usuario=="admin@email.com") {
            var emails= req.body.emails;
            var criterio= {"email":  emails};
            var criteriooferta={ "vendedor":emails};
            gestorBD.eliminarUsuarios(criterio, function (usuarios) {
                if (usuarios == null) {
                    res.send("Se ha producido un error eliminando un usuario");
                } else {
                    gestorBD.eliminarOferta(criteriooferta, function (oferta) {
                        if (oferta == null) {
                            let respuesta = swig.renderFile('views/error.html',
                                {

                                    mensaje: "Se ha producido un error intentando eliminar una oferta "
                                });
                            res.send(respuesta);
                        } else {
                            res.redirect("/users/list");
                        }


                    });
                }
            });
        }else {
            let respuesta = swig.renderFile('views/error.html',
                {

                    mensaje: "Esta intentado acceder a una funcionalidad exclusiva de administrador "
                });
            res.send(respuesta);
        }

    });
};