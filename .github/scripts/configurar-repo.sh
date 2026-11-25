#!/usr/bin/env bash
# Crea (o actualiza) las etiquetas y los milestones del repositorio DRG.
# Se puede ejecutar varias veces: lo que ya existe se actualiza y no se duplica.
#
# Requisitos: GitHub CLI (https://cli.github.com) con sesión iniciada (`gh auth login`).
# Uso, desde la raíz del repo:
#   bash .github/scripts/configurar-repo.sh
#   bash .github/scripts/configurar-repo.sh --borrar-por-defecto   # además borra las etiquetas que GitHub crea por defecto

set -euo pipefail

REPO="${REPO:-MarcelQuiroF/drg}"

etiqueta() {
    # etiqueta <nombre> <color hex sin #> <descripción>
    gh label create "$1" --repo "$REPO" --color "$2" --description "$3" --force
}

echo "== Etiquetas en $REPO"

# Tipo
etiqueta "bug"               "d73a4a" "Algo no funciona como debería"
etiqueta "tarea"             "1d76db" "Trabajo técnico, de documentación o de infraestructura"
etiqueta "historia-usuario"  "0e8a16" "Funcionalidad nueva desde el punto de vista del usuario"
etiqueta "mejora"            "a2eeef" "Mejora de algo que ya existe"
etiqueta "docs"              "0075ca" "Documentación"
etiqueta "seguridad"         "b60205" "Vulnerabilidad o permisos"
etiqueta "deuda-tecnica"     "fbca04" "Limpieza, refactor o código muerto"
etiqueta "pruebas"           "bfd4f2" "Pruebas automáticas o manuales"

# Prioridad
etiqueta "prioridad:alta"    "b60205" "Afecta dinero, datos o seguridad; va primero"
etiqueta "prioridad:media"   "d93f0b" "Importante, pero no bloquea el uso"
etiqueta "prioridad:baja"    "c2e0c6" "Puede esperar"

# Zona
etiqueta "backend"           "5319e7" "API, servicios, lógica de negocio"
etiqueta "frontend"          "f9d0c4" "Interfaz web"
etiqueta "db"                "006b75" "Migraciones, modelos, seeders"
etiqueta "mobile"            "c5def5" "App móvil para meseros"

# Estado
etiqueta "bloqueado"         "000000" "Espera una decisión o a otra issue"
etiqueta "futuro"            "ededed" "Fuera del alcance de la entrega actual"
etiqueta "no-se-hara"        "ffffff" "Descartado (el motivo va en un comentario)"

if [[ "${1:-}" == "--borrar-por-defecto" ]]; then
    echo "== Borrando etiquetas por defecto de GitHub que no se usan"
    for e in "documentation" "duplicate" "enhancement" "good first issue" "help wanted" "invalid" "question" "wontfix"; do
        gh label delete "$e" --repo "$REPO" --yes 2>/dev/null && echo "  borrada: $e" || true
    done
fi

echo "== Milestones en $REPO"

milestone() {
    # milestone <título> <descripción>
    local titulo="$1" descripcion="$2" numero
    numero="$(gh api "repos/$REPO/milestones?state=all&per_page=100" \
        --jq ".[] | select(.title == \"$titulo\") | .number")"
    if [[ -n "$numero" ]]; then
        gh api -X PATCH "repos/$REPO/milestones/$numero" -f description="$descripcion" > /dev/null
        echo "  actualizado: $titulo"
    else
        gh api -X POST "repos/$REPO/milestones" -f title="$titulo" -f description="$descripcion" > /dev/null
        echo "  creado: $titulo"
    fi
}

milestone "Etapa 0 · Terreno de trabajo"        "Convenciones, plantillas, etiquetas, instrucciones y skills"
milestone "Etapa 1 · Requisitos"                "Requisitos reescritos, matriz de brechas, créditos y reunión con el dueño"
milestone "Etapa 2 · Backlog y decisiones"      "Issues del backlog, ADRs, arquitectura, modelo de datos y README"
milestone "Etapa 3 · Limpieza y pruebas"        "Limpieza, ESLint/Prettier, seeder, pruebas base y CI"
milestone "Etapa 4 · Bugs críticos"             "Pagos QR, totales, XSS, categorías, permisos, token 401, zona horaria, modelos vs BD"
milestone "Etapa 5 · TypeScript"                "Migración gradual del backend y el frontend, con validación Zod"
milestone "Etapa 6 · Funcionalidades"           "Brechas validadas por el negocio, UX y Fases 2-3 del análisis"
milestone "Etapa 6b · App móvil"                "App para meseros: login, mesas, órdenes y envío a cocina"
milestone "Etapa 7 · Despliegue y entrega"      "Instalación en el local, respaldos, manual, piloto, acta y v1.0.0"
milestone "Etapa 8 · Portafolio"                "README final, caso de estudio y revisión de datos sensibles"
milestone "Etapa 9 · Nube"                      "Evaluar y planificar el paso a la nube"

echo "Listo."
