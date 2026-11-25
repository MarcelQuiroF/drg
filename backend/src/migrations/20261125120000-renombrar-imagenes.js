'use strict';

/**
 * #16: actualiza los nombres de imagen guardados en producto y juego después
 * de renombrar archivos en frontend/assets/ y quitar las tildes de las carpetas
 * (imágenes/ → imagenes/, íconos/ → iconos/).
 *
 * El frontend arma la ruta con el nombre guardado en la columna `imagen`
 * (por ejemplo `../assets/imagenes/${producto.imagen}`), así que una fila con
 * un nombre viejo daría 404. Solo cambia las filas que usan esos nombres; las
 * demás quedan igual. El `down` deja los nombres como estaban.
 */

const TABLAS = ['producto', 'juego'];

// [nombre viejo, nombre nuevo]
const ARCHIVOS = [
    ['amigoshdp.jpg', 'juego-cartas-amigos-1.jpg'],
    ['amigosmierda.jpg', 'juego-cartas-amigos-2.jpg'],
    ['tostaKaka.jpg', 'torta.jpg'],
    ['adeu.jpg', 'ticket-to-ride-europa.jpg'],
    ['aro.jpg', 'arquitectos-reino-oeste.jpg'],
    ['artem.jpg', 'arte-moderno.jpg'],
    ['azval.jpg', 'space-aztecs.jpg'],
    ['Avalon.jpg', 'avalon.jpg'],
    ['Azul.jpg', 'azul.jpg'],
    ['here.png', 'here-to-slay.png'],
    ['chochos.jpg', 'tarwi.jpg']
];

const CARPETAS = [
    ['assets/imágenes/', 'assets/imagenes/'],
    ['assets/íconos/', 'assets/iconos/']
];

// Escapa un texto para usarlo literal dentro de una expresión regular.
const literal = (texto) => texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function aplicar(queryInterface, transaction, archivos, carpetas) {
    for (const tabla of TABLAS) {
        // La imagen puede guardarse solo con el nombre ("catan.jpg") o con una
        // ruta ("../assets/imágenes/catan.jpg"): se cambia el nombre al final.
        for (const [desde, hacia] of archivos) {
            const patron = `(^|/)${literal(desde)}$`;
            await queryInterface.sequelize.query(
                `UPDATE "${tabla}" SET imagen = regexp_replace(imagen, :patron, :reemplazo)
                 WHERE imagen ~ :patron`,
                { replacements: { patron, reemplazo: `\\1${hacia}` }, transaction }
            );
        }
        for (const [desde, hacia] of carpetas) {
            await queryInterface.sequelize.query(
                `UPDATE "${tabla}" SET imagen = replace(imagen, :desde, :hacia)
                 WHERE strpos(imagen, :desde) > 0`,
                { replacements: { desde, hacia }, transaction }
            );
        }
    }
}

const invertir = (pares) => pares.map(([desde, hacia]) => [hacia, desde]);

module.exports = {
    async up(queryInterface) {
        await queryInterface.sequelize.transaction((transaction) =>
            aplicar(queryInterface, transaction, ARCHIVOS, CARPETAS)
        );
    },

    async down(queryInterface) {
        await queryInterface.sequelize.transaction((transaction) =>
            aplicar(queryInterface, transaction, invertir(ARCHIVOS), invertir(CARPETAS))
        );
    }
};
