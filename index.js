// Requerimientos

// 1. Crear una API REST con el Framework Express
// Importartacion de dependencias utilizadas
const express = require('express')
const app = express();
const bodyParser = require('body-parser');
const exphbs = require('express-handlebars');
const expressFileUpload = require('express-fileupload');
const jwt = require('jsonwebtoken');
const secretKey = 'Top Secret';

// Importacion de funciones
const { consultarUsuarios,
    nuevoUsuario,
    cambioEstadoUsuario,
    inicioSesion,
    actualizarDatosUsuario,
    eliminarCuenta } = require('./consultas');

// Servidor
app.listen(3000, () => {
    console.log('Servidor ON')
});

// body-parser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Directorio público
app.use(express.static(__dirname + '/public'));

// 3. Ofrecer la funcionalidad Upload File con express-fileupload 
app.use(expressFileUpload({ // Middleware para express-fileupload
    limits: { fileSize: 5000000 },
    abortOnLimit: true,
    responseOnLimit: 'El peso del archivo supera el limite permitido',
})
)
//disponer el style
app.use("/css", express.static(__dirname + "/node_modules/bootstrap/dist/css"))

// 2. Servir contenido dinámico con express-handlebars
app.engine(
    "handlebars",
    exphbs({
        defaultLayout: "main",
        layoutsDir: `${__dirname}/views/mainLayout`,
    })
);
app.set("view engine", "handlebars");// disponer plantillas

// Ruta raíz
app.get('/', (req, res) => {
    res.render('index');
})

// Ruta POST /usuario
app.post('/usuarios', async (req, res) => {
    console.log(req.files.foto.name)
    const foto = req.files.foto.name
    const { email, nombre, password, anios, especialidad } = req.body;
    try {
        const respuesta = await nuevoUsuario(email, nombre, password, anios, especialidad, foto);
        await req.files.foto.mv(__dirname + "/public/imgs/" + foto)
        res.status(201).send(respuesta);
    } catch (e) {
        res.status(500).send({
            error: `Algo salió mal... ${e}`,
            code: 500
        })
    }
})

// Ruta para admin
app.get('/Admin', async (req, res) => {
    try {
        const usuarios = await consultarUsuarios()
        res.render('Admin', { usuarios })
    } catch (e) {
        res.status(500).send({
            error: `Algo salió mal... ${e}`,
            code: 500
        })
    }
})

// Ruta PUT para cambiar estado del usuario
app.put('/usuarios', async (req, res) => {
    const { id, estado } = req.body;
    try {
        const usuario = await cambioEstadoUsuario(id, estado);
        res.status(200).send(usuario);
    } catch (e) {
        res.status(500).send({
            error: `Algo salió mal... ${e}`,
            code: 500
        })
    }
})

// Ruta para login
app.get('/Login', (req, res) => {
    res.render('Login')
})

// 4. Implementar seguridad y restricción de recursos o contenido con JWT 
// Ruta POST para inicio de sesión y autenticacion con JWT de los datos a ingresar
app.post('/verify', async (req, res) => {
    const { email, password } = req.body;
    const user = await inicioSesion(email, password)

    if (email === '' || password === '') {
        res.status(401).send({
            error: 'Debe llenar todos los campos',
            code: 401,
        })
    } else {

        if (user.length != 0) {
            if (user[0].estado === true) {
                const token = jwt.sign(
                    {
                        exp: Math.floor(Date.now() / 1000) + 180,
                        data: user,
                    },
                    secretKey
                );
                res.send(token);
            } else {
                res.status(401).send({
                    error: 'El registro de este usuario no ha sido autorizado por el administrador',
                    code: 401,
                })
            }
        } else {
            res.status(404).send({
                error: 'Este usuario no está registrado en la base de datos',
                code: 404,
            });
        }
    }

});

// Ruta para verificar datos ingresados
app.get('/Datos', (req, res) => {
    const { token } = req.query;
    jwt.verify(token, secretKey, (err, decoded) => {
        const { data } = decoded

        const email = data[0].email;
        const nombre = data[0].nombre;
        const password = data[0].password;
        const anios_experiencia = data[0].anios_experiencia;
        const especialidad = data[0].especialidad;
        err
            ? res.status(401).send({
                error: '401 Unauthorized',
                message: 'Usted no está autorizado para ingresar a este sitio',
                token_error: err.message,
            })
            : res.render('Datos', { email, nombre, password, anios_experiencia, especialidad })
    })
})

// Ruta POST /subir_foto
app.post('/upload', async (req, res) => {
    if (Object.keys(req.files).length == 0) {
        return res.status(404).send("No se encontro ningun archivo en la consulta")
    }

    const { email, nombre, password, password_2, anios, especialidad } = req.body;
    console.log(email);
    const { foto } = req.files;
    const { name } = foto;

    if (password !== password_2) {
        res.send("Las contraseñas no coinciden.");
    }
    try {
        foto.mv(`${__dirname}/public/imgs/${name}`, async (err) => {
            if (err) return res.status(500).send({
                error: `Algo salió mal... ${e}`,
                code: 500
            })
            await send(email, nombre, password, password_2, anios, especialidad)
            res.send("Se ha registrado con éxito.");
        })
    }
    catch (e) {
        res.status(500).send({
            error: `Algo salió mal... ${e}`,
            code: 500
        })
    };
})

// Ruta para registro
app.get('/registro', (req, res) => {
    res.render('Registro')
})

// Ruta GET /usuarios
app.get('/usuarios', async (req, res) => {
    const respuesta = await consultarUsuarios();
    res.send(respuesta);
})

// Ruta PUT para cambiar datos del usuario
app.put('/actualizar_datos', async (req, res) => {
    const { email, nombre, password, anios, especialidad } = req.body;

    try {
        const usuario = await actualizarDatosUsuario(email, nombre, password, anios, especialidad);
        res.status(200).send(usuario);
    } catch (e) {
        res.status(500).send({
            error: `Algo salió mal... ${e}`,
            code: 500
        })
    }
})

// Ruta DELETE para eliminar cuenta
app.delete('/eliminar_cuenta/:email', async (req, res) => {

    try {
        const { email } = req.params;
        const respuesta = await eliminarCuenta(email);
        res.sendStatus(200).send(respuesta);

    } catch (e) {
        res.status(500).send({
            error: `Algo salió mal... ${e}`,
            code: 500
        })
    }
})