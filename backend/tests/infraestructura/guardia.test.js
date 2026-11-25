'use strict';

// La guardia que impide correr las pruebas contra la base de desarrollo.
const { motivosParaRechazar } = require('../soporte/baseDePruebas');

const PRUEBAS = 'postgres://drg:clave@localhost:5432/drg_test';
const DESARROLLO = 'postgres://drg:clave@localhost:5432/drg';

describe('Guardia de la base de pruebas', () => {
    test('acepta una base que termina en _test, distinta de la de desarrollo, con NODE_ENV=test', () => {
        expect(motivosParaRechazar({ urlPruebas: PRUEBAS, urlDesarrollo: DESARROLLO, nodeEnv: 'test' })).toEqual([]);
    });

    test('rechaza si falta DATABASE_URL_TEST', () => {
        const motivos = motivosParaRechazar({ urlPruebas: undefined, urlDesarrollo: DESARROLLO, nodeEnv: 'test' });
        expect(motivos.join(' ')).toMatch(/Falta DATABASE_URL_TEST/);
    });

    test('rechaza si NODE_ENV no es test', () => {
        const motivos = motivosParaRechazar({ urlPruebas: PRUEBAS, urlDesarrollo: DESARROLLO, nodeEnv: 'development' });
        expect(motivos.join(' ')).toMatch(/NODE_ENV/);
    });

    test('rechaza una base cuyo nombre no termina en _test', () => {
        const motivos = motivosParaRechazar({
            urlPruebas: 'postgres://drg:clave@localhost:5432/drg_pruebas',
            nodeEnv: 'test'
        });
        expect(motivos.join(' ')).toMatch(/terminar en "_test"/);
    });

    test('rechaza la misma base que DATABASE_URL aunque cambie el usuario o se escriba 127.0.0.1', () => {
        const motivos = motivosParaRechazar({
            urlPruebas: 'postgres://otro:otra@127.0.0.1:5432/drg_test',
            urlDesarrollo: 'postgres://drg:clave@localhost/drg_test',
            nodeEnv: 'test'
        });
        expect(motivos.join(' ')).toMatch(/misma base que DATABASE_URL/);
    });

    test('acepta el mismo nombre de base en otro servidor o puerto', () => {
        const motivos = motivosParaRechazar({
            urlPruebas: 'postgres://drg:clave@localhost:5433/drg_test',
            urlDesarrollo: 'postgres://drg:clave@localhost:5432/drg_test',
            nodeEnv: 'test'
        });
        expect(motivos).toEqual([]);
    });

    test('rechaza una URL mal escrita', () => {
        const motivos = motivosParaRechazar({ urlPruebas: 'no-es-una-url', nodeEnv: 'test' });
        expect(motivos.join(' ')).toMatch(/no es una URL válida/);
    });
});
