const express = require("express");
const cors = require("cors");
const connection = require("./database");
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const path = require("path");
const sanitizeHtml = require('sanitize-html');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static("node_modules"));
app.use(express.static(path.join(__dirname, "public")));

// Función de sanitización mejorada
const sanitizeInput = (value) => {
    return sanitizeHtml(value, {
        allowedTags: [],  // Elimina todas las etiquetas HTML
        allowedAttributes: {},
        disallowedTagsMode: 'discard'
    }).replace(/&.*?;/g, "");  // Elimina cualquier entidad HTML como &lt; &gt;
};

const limiter = rateLimit({
    windowMs: 2 * 60 * 1000,
    max: 125,
    message: "¡Ja! No puedes tirar mi server.",
});

app.use(limiter);

// Obtener todas las reservas
app.get("/reservas", (req, res) => {
    const query = "SELECT * FROM reservas LIMIT 10";

    connection.query(query, (err, results) => {
        if (err) {
            console.error("Error al obtener las reservas:", err);
            return res.status(500).json({ mensaje: "Error al obtener las reservas" });
        }
        res.status(200).json(results);
    });
});

// Obtener una reserva por ID
app.get("/reserva/:id", (req, res) => {
    const { id } = req.params;
    const query = "SELECT * FROM reservas WHERE id = ?";

    connection.query(query, [id], (err, results) => {
        if (err) {
            console.error("Error al obtener la reserva:", err);
            return res.status(500).json({ mensaje: "Error al obtener la reserva" });
        }
        if (results.length > 0) {
            res.status(200).json(results[0]);
        } else {
            res.status(404).json({ mensaje: "Reserva no encontrada" });
        }
    });
});

// Guardar una nueva reserva con validación y sanitización
app.post("/guardar-reserva", [
    body('apellidos').trim().isLength({ min: 2, max: 27 }).escape().withMessage('Los apellidos deben tener entre 2 y 27 caracteres'),
    body('nombres').trim().isLength({ min: 2, max: 20 }).escape().withMessage('El nombre debe tener entre 2 y 20 caracteres'),
    body('email').trim().isEmail().withMessage('Ingresa un email válido'),
    body('telefono').trim().isNumeric().isLength({ min: 10, max: 10 }).withMessage('Número de teléfono debe ser de 10 dígitos'),
    body('tipo_evento').trim().isLength({ min: 3, max: 10 }).escape().withMessage('Tipo de evento debe ser válido'),
    body('plan_evento').trim().isIn(['Clasico', 'Premium', 'Golden']).withMessage('Plan de evento no válido'),
    body('cantidad_anticipo').isNumeric().withMessage('Cantidad de anticipo debe ser un número'),
    body('servicio_adicional').trim().optional().escape(),
    body('horas_renta').isIn(['3', '4', '5', '6', '7']).withMessage('Horas de renta no válidas'),
    body('compromiso_pago').isBoolean().withMessage('Compromiso de pago debe ser verdadero o falso')
], (req, res) => {
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    // **Sanitización final antes de insertar en la BD**
    const sanitizedData = {
        apellidos: sanitizeInput(req.body.apellidos),
        nombres: sanitizeInput(req.body.nombres),
        email: req.body.email,  // No sanitizar el email
        telefono: req.body.telefono,  // No sanitizar el teléfono
        tipo_evento: sanitizeInput(req.body.tipo_evento),
        plan_evento: req.body.plan_evento,
        cantidad_anticipo: req.body.cantidad_anticipo,
        servicio_adicional: sanitizeInput(req.body.servicio_adicional || ""),
        horas_renta: req.body.horas_renta,
        compromiso_pago: req.body.compromiso_pago
    };

    const query = `INSERT INTO reservas (apellidos, nombres, email, telefono, tipo_evento, plan_evento, cantidad_anticipo, servicio_adicional, horas_renta, compromiso_pago) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    connection.query(query, [
        sanitizedData.apellidos,
        sanitizedData.nombres,
        sanitizedData.email,
        sanitizedData.telefono,
        sanitizedData.tipo_evento,
        sanitizedData.plan_evento,
        sanitizedData.cantidad_anticipo,
        sanitizedData.servicio_adicional,
        sanitizedData.horas_renta,
        sanitizedData.compromiso_pago
    ], (err, results) => {
        if (err) {
            console.error("Error al guardar la reserva:", err);
            return res.status(500).json({ mensaje: "Error en el servidor" });
        }
        res.status(200).json({ mensaje: "Reserva guardada con éxito" });
    });
});

// Ruta para eliminar una reserva
app.delete("/eliminar-reserva/:id", (req, res) => {
    const { id } = req.params;
    const query = "DELETE FROM reservas WHERE id = ?";

    connection.query(query, [id], (err, results) => {
        if (err) {
            console.error("Error al eliminar la reserva:", err);
            return res.status(500).json({ mensaje: "Error al eliminar la reserva" });
        }
        if (results.affectedRows > 0) {
            res.status(200).json({ mensaje: "Reserva eliminada con éxito" });
        } else {
            res.status(404).json({ mensaje: "Reserva no encontrada" });
        }
    });
});

const PORT = process.env.PORT || 29990;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
});
