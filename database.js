require('dotenv').config();
const mysql = require('mysql2');

console.log(process.env.DB_HOST);
console.log(process.env.DB_USER);
console.log(process.env.DB_PASSWORD);
console.log(process.env.DB_DATABASE);



const connection = mysql.createConnection({
    host: 'caboose.proxy.rlwy.net',
    user: 'root',
    password: 'NNpcFFZuGgiUuxojiVVYCcHyZjXpTaSB',
    database: 'railway',
    port: 29990,
    ssl: {
        rejectUnauthorized: false,
    }
});


connection.connect((err) => {
    if (err) {
        console.error('Error al conectar a la base de datos de eventos:', err);
    } else {
        console.log('Conexión exitosa a la base de datos de eventos');
    }
});

module.exports = connection;
