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
            app.get("logger").trace('rusuarios: Se ha intentado loguear con un email con formato inválido ');
            return;
        }
        if (req.body.name.length < 2) {
            res.redirect("/registrarse?mensaje=El nombre contiene menos de 2 caracteres");
            app.get("logger").trace('rusuarios: Se ha intentado loguear con un nombre  inválido, menos de dos caracteres');
            return;
        }
        if (req.body.lastname.length < 2) {
            res.redirect("/registrarse?mensaje=El apellido contiene menos de 2 caracteres");
            app.get("logger").trace('rusuarios: Se ha intentado loguear con un apellido  inválido, menos de dos caracteres');
            return;
        }
        if (req.body.password.length < 5) {
            res.redirect("/registrarse?mensaje=La contraseña contiene menos de 5 caracteres");
            return;
        }
        if (req.body.repeatpassword.length < 5) {
            res.redirect("/registrarse?mensaje=La contraseña repetida contiene menos de 5 caracteres");
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
            email: req.body.email
        }

        gestorBD.obtenerUsuarios(usuarioCheck, function (usuarios) {
            if (usuarios.length != 0) {
                res.redirect("/registrarse" +
                    "?mensaje=Este usuario ya existe en el sistema" +
                    "&tipoMensaje=alert-danger ");
                app.get("logger").trace('rusuarios: Se ha intentado registrar con el usuario existente en el sistema'+ usuarios[0].email);
            } else {
                if (req.body.password === req.body.repeatpassword){

                    gestorBD.insertarUsuario(usuario, function (id) {
                        if (id == null) {
                            app.get("logger").trace('rusuarios: Se ha  producido un error al generar el id del usuario' + usuario.email);
                            res.redirect("/registrarse?mensaje=Error al registrar usuario");
                        } else {
                            req.session.usuario = usuarioCheck.email;
                            res.redirect("/ofertas/list?mensaje=Nuevo usuario registrado");
                            app.get("logger").trace('rusuarios: Se ha  registrado con éxito'+ usuario.email);

                        }
                    });
                }
                else{
                    app.get("logger").trace('rusuarios: Se ha intentado registrar a un usuario, sus contraseñas no coinciden');
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
            app.get("logger").trace('rusuarios: No se ha podido identificar con éxito debido a un formato de email incorrecto');
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
                app.get("logger").trace('rusuarios: No se ha podido identificar con éxito debido a un error de auteticacion del usuario');
                res.redirect("/identificarse" +
                    "?mensaje=Email o password incorrecto" +
                    "&tipoMensaje=alert-danger ");
            } else {
                if (usuarios[0].email === "admin@email.com") {
                    req.session.usuario = usuarios[0].email;
                    app.get("logger").trace('rusuarios: Se ha identificado como admin');
                    res.redirect("/users/list");
                } else {
                    req.session.usuario = usuarios[0].email;
                    app.get("logger").trace('rusuarios: Se ha identificado como usuario '+usuarios[0].email);

                    res.redirect("/ofertas/list");
                }
            }
        });
    });

    app.get('/desconectarse', function (req, res) {
        app.get("logger").trace('rusuarios: Se ha cerrado corrrectamente la sesión de '+ req.session.usuario);
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
            app.get("logger").trace('rusuarios: Se ha logueado como admin para borrar los siguientes usuarios '+emails);
           if(typeof emails =='string'){

               var criterio={ email: emails}
           }else{

               criterio={ email: {$in: emails}}
           }

            if(typeof emails =='string') {
                var criteriooferta={ vendedor:  emails};
            } else {
                criteriooferta={ vendedor: { $in: emails}};
            }
            if(typeof emails =='string') {
                var criterioConver ={ $or : [{ vendedor:  emails,interesado : emails} ]};
            } else {
                 criterioConver ={ $or : [{vendedor: {$in : emails}, interesado : {$in: emails}} ]};
            }
            if(typeof emails =='string') {
                var criterioMensa ={ $or : [{ emisor:  emails,receptor : emails} ]};
            } else {
                criterioMensa ={ $or : [{emisor: {$in : emails}, receptor : {$in: emails}} ]};
            }


            gestorBD.eliminarUsuarios(criterio, function (usuarios) {

                if (usuarios == null) {
                    app.get("logger").trace('rusuarios: Se ha producido un error eliminando los siguientes usuarios'+emails);
                    let respuesta = swig.renderFile('views/error.html',
                        {

                            mensaje: "Se ha producido un error eliminando un usuario"
                        });
                    res.send(respuesta);
                } else {
                    gestorBD.eliminarOferta(criteriooferta, function (oferta) {
                        if (oferta == null) {
                            app.get("logger").trace('rusuarios: Se ha producido un error eliminando las ofertas de los siguientes usuarios'+emails);
                            let respuesta = swig.renderFile('views/error.html',
                                {

                                    mensaje: "Se ha producido un error intentando eliminar una oferta "
                                });
                            res.send(respuesta);
                        } else {
                            gestorBD.eliminarConversacion(criterioConver, function (conversacion) {
                                if (conversacion == null) {
                                    let respuesta = swig.renderFile('views/error.html',
                                        {
                                            mensaje: "Se ha producido un error intentando eliminar una conversacion "
                                        });
                                    res.send(respuesta);
                                } else {
                                    gestorBD.eliminarMensaje(criterioMensa, function (mensaje) {
                                        if (mensaje == null) {
                                            let respuesta = swig.renderFile('views/error.html',
                                                {
                                                    mensaje: "Se ha producido un error intentando eliminar una conversacion "
                                                });
                                            res.send(respuesta);
                                        } else {
                                            res.redirect("/users/list");
                                        }
                                    });
                                }
                            });
                        }


                    });
                }
            });
        }else {
            app.get("logger").trace('rusuarios: Se ha intentando borrar usuarios desde un perfil que no es administrador '+req.session.usuario);
            let respuesta = swig.renderFile('views/error.html',
                {

                    mensaje: "Esta intentado acceder a una funcionalidad exclusiva de administrador "
                });
            res.send(respuesta);
        }

    });
};