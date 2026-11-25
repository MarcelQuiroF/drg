// Pruebas de las funciones de seguridad del frontend (#23). Usan el test runner de Node,
// sin dependencias: `npm run test:frontend` desde la raíz (también corre en el CI).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { escaparHTML, urlSegura } from '../js/utils.js';

test('escaparHTML convierte los cinco caracteres especiales de HTML', () => {
    assert.equal(
        escaparHTML(`<a href="x" title='y'>&</a>`),
        '&lt;a href=&quot;x&quot; title=&#39;y&#39;&gt;&amp;&lt;/a&gt;'
    );
});

test('F1 · el nombre de cliente del análisis queda como texto, sin etiqueta', () => {
    const nombre = '<img src=x onerror=alert(1)>';
    const escapado = escaparHTML(nombre);
    assert.equal(escapado, '&lt;img src=x onerror=alert(1)&gt;');
    assert.ok(!escapado.includes('<'));
});

test('escaparHTML sirve dentro de un atributo entre comillas (data-nombre="…")', () => {
    const escapado = escaparHTML('" onmouseover="alert(1)');
    assert.ok(!escapado.includes('"'));
    assert.equal(escapado, '&quot; onmouseover=&quot;alert(1)');
});

test('escaparHTML no cambia un texto normal, con tildes y ñ', () => {
    assert.equal(escaparHTML('Peña Ñandú, mesa 3 (2 personas)'), 'Peña Ñandú, mesa 3 (2 personas)');
});

test('escaparHTML con null, undefined y números', () => {
    assert.equal(escaparHTML(null), '');
    assert.equal(escaparHTML(undefined), '');
    assert.equal(escaparHTML(0), '0');
    assert.equal(escaparHTML(18.5), '18.5');
});

test('escaparHTML escapa también un texto que ya parece escapado: se ve tal como se guardó', () => {
    // "&lt;" guardado como texto tiene que verse como "&lt;", no como "<"
    assert.equal(escaparHTML('&lt;b&gt;'), '&amp;lt;b&amp;gt;');
});

test('urlSegura acepta http y https', () => {
    assert.equal(urlSegura('https://drive.google.com/reglas.pdf'), 'https://drive.google.com/reglas.pdf');
    assert.equal(urlSegura('  http://ejemplo.com  '), 'http://ejemplo.com/');
});

test('urlSegura rechaza javascript:, data: y textos que no son URL', () => {
    assert.equal(urlSegura('javascript:alert(1)'), null);
    assert.equal(urlSegura(' JavaScript:alert(document.cookie)'), null);
    assert.equal(urlSegura('data:text/html,<script>alert(1)</script>'), null);
    assert.equal(urlSegura('reglas del juego'), null);
    assert.equal(urlSegura(''), null);
    assert.equal(urlSegura(null), null);
});
