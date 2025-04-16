const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname)));

// Mapear rutas limpias a archivos HTML
const cleanRoutes = [
    { route: '/votar', file: 'votar.html' },
    { route: '/panel', file: 'panel.html' },
    { route: '/login', file: 'login.html' },
    { route: '/index', file: 'index.html' } // Si necesitas que también funcione /index
];

// Configurar las rutas
cleanRoutes.forEach(({ route, file }) => {
    app.get(route, (req, res) => {
        const filePath = path.join(__dirname, file);
        if (fs.existsSync(filePath)) {
            res.sendFile(filePath);
        } else {
            res.status(404).send('Página no encontrada');
        }
    });
});

// Endpoint para obtener actualizaciones
app.get('/api/actualizaciones', (req, res) => {
    const filePath = path.join(__dirname, 'data', 'actualizaciones.json');
    console.log(`[GET] Solicitud para obtener actualizaciones desde ${filePath}`);

    if (fs.existsSync(filePath)) {
        const actualizaciones = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        console.log('[GET] Actualizaciones enviadas:', actualizaciones);
        res.json(actualizaciones);
    } else {
        console.warn('[GET] No se encontró el archivo de actualizaciones. Enviando lista vacía.');
        res.json([]);
    }
});

// Endpoint para agregar una nueva actualización
app.post('/api/actualizaciones', (req, res) => {
    console.log('[POST] Solicitud para agregar actualización. Cuerpo de la solicitud:', req.body);

    const { titulo, contenido } = req.body;

    // Validación de datos
    if (!titulo || !contenido) {
        console.error('[POST] Error: El título y el contenido son obligatorios.');
        return res.status(400).json({ error: 'El título y el contenido son obligatorios.' });
    }

    const filePath = path.join(__dirname, 'data', 'actualizaciones.json');
    console.log(`[POST] Ruta del archivo de actualizaciones: ${filePath}`);

    let actualizaciones = [];

    try {
        // Verificar si el archivo existe
        if (fs.existsSync(filePath)) {
            console.log('[POST] Leyendo el archivo existente.');
            actualizaciones = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } else {
            console.warn('[POST] El archivo no existe. Se creará un archivo nuevo.');
            fs.mkdirSync(path.dirname(filePath), { recursive: true }); // Crear la carpeta si no existe
        }

        // Agregar la nueva actualización
        const nuevaActualizacion = { titulo, contenido, fecha: new Date().toISOString() };
        actualizaciones.unshift(nuevaActualizacion);

        // Guardar en el archivo
        fs.writeFileSync(filePath, JSON.stringify(actualizaciones, null, 2));
        console.log('[POST] Actualización agregada correctamente:', nuevaActualizacion);

        res.json({ message: 'Actualización agregada correctamente.' });
    } catch (error) {
        console.error('[POST] Error al procesar la solicitud:', error.message);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// Endpoint para editar una actualización existente
app.put('/api/actualizaciones/:index', (req, res) => {
    const { index } = req.params;
    const { titulo, contenido } = req.body;

    console.log('[PUT] Solicitud para editar actualización. Índice:', index);
    console.log('[PUT] Cuerpo de la solicitud:', req.body);

    if (!titulo || !contenido) {
        console.error('[PUT] Error: El título y el contenido son obligatorios.');
        return res.status(400).json({ error: 'El título y el contenido son obligatorios.' });
    }

    const filePath = path.join(__dirname, 'data', 'actualizaciones.json');
    console.log(`[PUT] Ruta del archivo de actualizaciones: ${filePath}`);

    try {
        if (!fs.existsSync(filePath)) {
            console.error('[PUT] Error: No se encontraron actualizaciones.');
            return res.status(404).json({ error: 'No se encontraron actualizaciones.' });
        }

        const actualizaciones = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        if (index < 0 || index >= actualizaciones.length) {
            console.error('[PUT] Error: Índice inválido.');
            return res.status(400).json({ error: 'Índice inválido.' });
        }

        actualizaciones[index] = { ...actualizaciones[index], titulo, contenido, fecha: new Date().toISOString() };
        fs.writeFileSync(filePath, JSON.stringify(actualizaciones, null, 2));
        console.log('[PUT] Actualización editada correctamente:', actualizaciones[index]);

        res.json({ message: 'Actualización editada correctamente.' });
    } catch (error) {
        console.error('[PUT] Error al procesar la solicitud:', error.message);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// Endpoint para eliminar una actualización
app.delete('/api/actualizaciones/:index', (req, res) => {
    const { index } = req.params;
    const filePath = path.join(__dirname, 'data', 'actualizaciones.json');

    console.log(`[DELETE] Solicitud para eliminar actualización. Índice: ${index}`);

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'No se encontraron actualizaciones.' });
    }

    const actualizaciones = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    if (index < 0 || index >= actualizaciones.length) {
        return res.status(400).json({ error: 'Índice inválido.' });
    }

    // Eliminar actualización
    const eliminada = actualizaciones.splice(index, 1);
    fs.writeFileSync(filePath, JSON.stringify(actualizaciones, null, 2));

    console.log('[DELETE] Actualización eliminada:', eliminada);
    res.json({ message: 'Actualización eliminada correctamente.' });
});

// Iniciar el servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor corriendo en http://0.0.0.0:${PORT}`);
});