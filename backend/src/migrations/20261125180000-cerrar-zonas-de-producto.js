'use strict';

/**
 * #32: la zona de un producto pasa a ser una lista cerrada: COCINA o CAFETERIA (RF-14).
 *
 * Por qué CHECK y no un ENUM de PostgreSQL (decisión de Marcelo, sesión 4.4): la lista es valor
 * de prueba hasta el 10/12 (P-12). Un CHECK se cambia con DROP + ADD en una migración; a un ENUM
 * no se le puede quitar un valor sin recrear el tipo, y Sequelize maneja mal los ENUM en
 * changeColumn. La columna sigue siendo varchar(50) NOT NULL.
 *
 * 1. Normaliza los datos existentes, también los productos borrados (el CHECK vale para todas
 *    las filas), sin distinguir mayúsculas, espacios ni tildes:
 *    - cocina → COCINA
 *    - cafeteria, cafetería → CAFETERIA
 *    - barra → CAFETERIA (el POS ya trataba BARRA como bebida)
 *    - cualquier otro valor (por ejemplo "Postres", que pudo entrar por Excel) → CAFETERIA, que es
 *      lo que ya hacía la impresión: todo lo que no es COCINA va al ticket de cafetería (decisión
 *      de Marcelo). La migración lista esos productos para revisarlos desde el panel.
 * 2. Agrega la restricción CHECK producto_zona_valida.
 *
 * `down`: quita la restricción. Los valores normalizados se quedan como están: no se guarda cuál
 * era el texto original.
 */

const RESTRICCION = 'producto_zona_valida';
// Mismo criterio que normalizarZona (config/zonasProducto.js), en SQL: sin tildes, sin espacios y en mayúsculas
const ZONA_NORMALIZADA = `upper(btrim(translate(zona, 'áéíóúÁÉÍÓÚ', 'aeiouAEIOU')))`;

module.exports = {
    async up(queryInterface) {
        await queryInterface.sequelize.transaction(async (transaction) => {
            const consultar = (sql) => queryInterface.sequelize.query(sql, { transaction });

            const [sinDeducir] = await consultar(
                `SELECT id, nombre, zona FROM producto
                 WHERE ${ZONA_NORMALIZADA} NOT IN ('COCINA', 'CAFETERIA', 'BARRA') ORDER BY id`
            );

            const [cambiados] = await consultar(
                `UPDATE producto SET zona = CASE WHEN ${ZONA_NORMALIZADA} = 'COCINA' THEN 'COCINA' ELSE 'CAFETERIA' END
                 WHERE zona NOT IN ('COCINA', 'CAFETERIA')
                 RETURNING id`
            );
            if (cambiados.length > 0) {
                console.warn(`[#32] Zona normalizada en ${cambiados.length} producto(s).`);
            }
            if (sinDeducir.length > 0) {
                const lista = sinDeducir.map((p) => `#${p.id} ${p.nombre} ("${p.zona}")`).join(', ');
                console.warn(
                    `[#32] ${sinDeducir.length} producto(s) con una zona que no se pudo deducir quedaron en CAFETERIA; ` +
                        `revíselos desde el panel: ${lista}.`
                );
            }

            await consultar(
                `ALTER TABLE producto ADD CONSTRAINT "${RESTRICCION}" CHECK (zona IN ('COCINA', 'CAFETERIA'))`
            );
        });
    },

    async down(queryInterface) {
        await queryInterface.sequelize.query(`ALTER TABLE producto DROP CONSTRAINT IF EXISTS "${RESTRICCION}"`);
    }
};
