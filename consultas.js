const { Pool } = require('pg');

const pool = new Pool({
    user:'postgres',
    host:'localhost',
    port:5501,
    password:'holahola',
    database:'skatepark',
})

// El sistema debe permitir registrar nuevos participantes.
// Función asincrónica para ingresar un usuario
async function nuevoUsuario(email,nombre,password,anios,especialidad,foto) {
    try {
        const result = await pool.query(
            `INSERT INTO skaters 
            (email,nombre,password,anios_experiencia,especialidad,foto,estado)
            VALUES ('${email}','${nombre}','${password}','${anios}','${especialidad}','${foto}',false)
            RETURNING *`
        );
        const usuario= result.rows[0]
        return usuario
    } catch (e) {
        console.log(e);
    }
}

// Función asincrónica para consultar todos los usuarios
async function consultarUsuarios() {
    try {
        const result = await pool.query(`SELECT * FROM skaters`);
        return result.rows;
    } catch (e) {
        console.log(e);
    }
}

// Función asincrónica para cambiar el estado de un usuario
async function cambioEstadoUsuario(id,estado) {
    const result =  await pool.query(
        `UPDATE skaters SET estado = ${estado} WHERE id = ${id} RETURNING *`
    )

    const usuario = result.rows[0];
    return usuario;
}

// Función asincrónica para solicitar email y password de usuario
async function inicioSesion(email,password) {
    try {
        const result = await pool.query(`SELECT * FROM skaters 
                                        WHERE email = '${email}' AND
                                        password = '${password}'`);
        return result.rows[0];
    } catch (e) {
        console.log(e);
    }
}


// Función asincrónica para editar datos de usuario
async function actualizarDatosUsuario(email,nombre,password,anios,especialidad) {
    const result =  await pool.query(
        `UPDATE skaters SET 
            nombre = '${nombre}',
            password = '${password}',
            anios_experiencia = ${anios},
            especialidad = '${especialidad}'
            WHERE email = '${email}' RETURNING *`
    )

    const usuario = result.rows[0];
    return usuario;
}

// Función asincrónica para eliminar cuenta
async function eliminarCuenta (email) {
    const result = await pool.query(`
        DELETE FROM skaters WHERE email = '${email}'
    `);

    return result.rowCount;
}

module.exports = { 
    consultarUsuarios,
    nuevoUsuario,
    cambioEstadoUsuario,
    inicioSesion,
    actualizarDatosUsuario,
    eliminarCuenta };