// Fotos de productos y juegos (#96): una sola función y una sola carpeta para el POS, el panel del
// admin y el catálogo de clientes.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { rutaImagen, CARPETA_IMAGENES } from '../js/utils.js';

const DEFECTO = '../assets/productos/default-game.png';

test('un nombre de archivo va a la carpeta de fotos', () => {
    assert.equal(rutaImagen('catan.jpg', DEFECTO), '../assets/imagenes/catan.jpg');
    assert.equal(rutaImagen('  catan.jpg  ', DEFECTO), '../assets/imagenes/catan.jpg');
});

test('un nombre con espacios o caracteres raros se codifica', () => {
    assert.equal(rutaImagen('mi foto #1.png', DEFECTO), '../assets/imagenes/mi%20foto%20%231.png');
});

test('sin imagen se usa la imagen por defecto', () => {
    for (const vacio of [null, undefined, '', '   ']) assert.equal(rutaImagen(vacio, DEFECTO), DEFECTO);
});

test('una imagen subida, una URL o una ruta ya armada se usan tal cual', () => {
    const subida = 'data:image/png;base64,AAAA';
    for (const valor of [subida, 'https://ejemplo.com/a.jpg', 'http://x/b.png', '../assets/otra/c.png', '/d.png']) {
        assert.equal(rutaImagen(valor, DEFECTO), valor);
    }
});

test('las tres pantallas usan rutaImagen y ninguna arma la ruta a mano', () => {
    for (const archivo of ['js/catalogoCliente.js', 'js/modules/productos.js', 'js/modules/adminProductos.js']) {
        const codigo = readFileSync(new URL(`../${archivo}`, import.meta.url), 'utf8');
        assert.match(codigo, /rutaImagen\(/, `${archivo} no usa rutaImagen`);
        assert.doesNotMatch(codigo, /assets\/(imagenes|productos)\/\$\{/, `${archivo} arma la ruta a mano`);
    }
});

test('assets/productos/ solo tiene imágenes por defecto y la carpeta de fotos existe', () => {
    const productos = readdirSync(new URL('../assets/productos/', import.meta.url));
    assert.deepEqual(
        productos.filter((f) => !f.startsWith('default-')),
        []
    );
    assert.ok(existsSync(new URL(`../${CARPETA_IMAGENES.replace('../', '')}catan.jpg`, import.meta.url)));
});
