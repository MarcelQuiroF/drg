# Documentación de DRG – Mesa Dragón

La documentación está ordenada **por disciplina**, en el mismo orden en que avanza un proyecto: primero se entiende el negocio, después se definen los requisitos, luego se diseña, se implementa, se prueba y se entrega. El código (`backend/`, `frontend/`) está en la raíz del repositorio; esta carpeta solo tiene documentos.

| Carpeta | Qué contiene |
|---------|--------------|
| [`01_negocio/`](01_negocio/) | Contexto del negocio: cómo trabaja hoy, qué problemas tiene, objetivos del sistema y créditos del equipo |
| [`02_requisitos/`](02_requisitos/) | Requisitos funcionales y no funcionales, reglas de negocio, matriz de brechas y preguntas para el dueño |
| [`03_diseno/`](03_diseno/) | Arquitectura, modelo de datos, endpoints de la API y decisiones de arquitectura (`adr/`) |
| [`04_implementacion/`](04_implementacion/) | Guía de instalación y de desarrollo |
| [`05_pruebas/`](05_pruebas/) | Plan de pruebas y casos de prueba |
| [`06_proyecto/`](06_proyecto/) | Gestión del proyecto: trazabilidad, actas, manual de usuario y documentos de entrega |

## Documentos actuales

- [Guía de instalación](04_implementacion/instalacion.md)
- [Dependencias: cómo revisarlas y actualizarlas](04_implementacion/dependencias.md)
- [Endpoints de la API](03_diseno/endpoints.md)
- [Arquitectura](03_diseno/arquitectura.md) *(por completar)*
- [Modelo de datos](03_diseno/modelo-datos.md) *(por completar)*
- [Plantilla de ADR](03_diseno/adr/000-plantilla.md)

## Reglas

- Cada documento nuevo va en la carpeta de su disciplina. Si no está claro dónde va, se decide en la issue que lo crea.
- Nombres de archivo en minúsculas, con guiones y sin tildes ni ñ (`matriz-brechas.md`, `preguntas-dueno.md`).
- Si un PR cambia la API, actualiza `03_diseno/endpoints.md` en el mismo PR.
- Las decisiones de arquitectura se registran como ADR en `03_diseno/adr/` (ver la plantilla).
