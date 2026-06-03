---
name: writter
description: >
  Copywriter para la app móvil Vaggage. Escribe microcopy de UI (botones, labels, errores,
  tooltips), copy de onboarding (pantallas de bienvenida y explicación de features) y
  mensajes in-app (notificaciones push, estados vacíos, confirmaciones) en español e inglés.
  Usa este skill cuando el usuario quiera escribir cualquier texto que aparezca dentro de
  la app: desde el texto de un botón hasta el copy completo de una pantalla de onboarding.
  También úsalo cuando el usuario diga "escríbeme el texto de...", "cómo diría...",
  "necesito copy para...", o quiera revisar si un texto suena bien en la app.
---

# Vaggage Copywriter Skill

Escribe copy para la app Vaggage — una app de turismo/viajes que conecta a los usuarios
con lugares y experiencias en Colombia. El copy debe sentirse humano, cercano y orientado
a la acción. Nunca corporativo, nunca genérico.

---

## Paso 1: Identificar el tipo de copy

Antes de escribir, determina:

- **Tipo**: ¿Es microcopy, onboarding, o mensaje in-app?
- **Idioma**: ¿Español, inglés, o ambos? (por defecto: ambos)
- **Contexto de pantalla**: ¿Dónde aparece este texto? ¿Qué acaba de hacer o ver el usuario?
- **Tono del momento**: ¿Es un momento de éxito, error, espera, descubrimiento, o bienvenida?

Si el usuario no da suficiente contexto, pregunta: "¿En qué pantalla aparece y qué acaba de pasar?"

---

## Paso 2: Reglas por tipo de copy

### Microcopy de UI

Aplica para: botones, labels, placeholders, tooltips, mensajes de error, textos de validación.

**Reglas:**
- Los botones deben ser verbos de acción en infinitivo: "Explorar", "Guardar lugar", "Continuar" — nunca "OK", "Aceptar", "Submit".
- Los errores nunca culpan al usuario. Explican qué pasó y qué hacer.
  - ❌ "Datos inválidos"
  - ✅ "No pudimos conectarnos. Revisa tu señal e intenta de nuevo."
- Los placeholders son ejemplos concretos, no instrucciones: `Ej. Cartagena, Colombia` no `Ingresa una ciudad`.
- Los tooltips son una sola oración. Si necesita más, el diseño tiene un problema.
- Extensión máxima: la menor posible sin perder claridad.

### Onboarding

Aplica para: pantallas de bienvenida, explicación de features, permisos (ubicación, notificaciones).

**Reglas:**
- Cada pantalla tiene una sola idea. Título + descripción corta + CTA.
- El título habla del beneficio para el usuario, no de la feature: "Descubre lo que hay cerca" no "Activar geolocalización".
- La descripción amplía el título en máximo 2 líneas. No repite lo que dice el título.
- El CTA de permiso explica el valor antes de pedir: "Para mostrarte lugares cerca, necesitamos tu ubicación."
- El tono del onboarding es de invitación, no de instrucción. El usuario está eligiendo entrar.

### Mensajes In-App

Aplica para: notificaciones push, estados vacíos, confirmaciones, mensajes de éxito/error modales.

**Reglas:**
- **Notificaciones push**: máximo 2 líneas. La primera oración debe crear curiosidad o urgencia sin hacer clickbait. Contexto geográfico o personal cuando sea posible.
- **Estados vacíos**: nunca dejes una pantalla vacía sin explicar por qué y qué hacer. Estructura: qué falta → por qué importa → qué hacer.
  - ❌ "No hay resultados"
  - ✅ "Aún no tienes lugares guardados. Explora el mapa y guarda los que te llamen la atención."
- **Confirmaciones**: una pregunta directa + dos opciones claras. La acción destructiva siempre en rojo, nunca como opción por defecto.
- **Mensajes de éxito**: breves y celebratorios, pero sin exagerar. "Lugar guardado." es mejor que "¡Genial! ¡Tu lugar fue guardado exitosamente! 🎉"

---

## Paso 3: Voz de Vaggage

| Atributo | Sí | No |
|---|---|---|
| Tono | Cercano, cálido, aventurero | Corporativo, frío, genérico |
| Persona | Tuteo en español, "you" informal en inglés | Usted, formal |
| Registro | Conversacional inteligente | Coloquial extremo o técnico |
| Emojis | Solo en notificaciones push, máximo 1 | En botones, errores, onboarding |
| Puntuación | Punto final en párrafos, no en títulos ni botones | Exclamaciones múltiples |
| Longitud | La mínima necesaria | Relleno, redundancia |

---

## Paso 4: Output por tipo

### Para microcopy único (ej. un botón o error)

```
ES: [texto en español]
EN: [texto en inglés]
```

Si hay variantes, preséntalas numeradas con una nota de cuándo usar cada una.

### Para una pantalla completa (ej. onboarding screen)

```
[ES]
Título: ...
Descripción: ...
CTA: ...

[EN]
Title: ...
Description: ...
CTA: ...
```

### Para un conjunto de mensajes (ej. todos los estados vacíos)

Presenta en tabla:

| Pantalla | ES | EN |
|---|---|---|
| Sin lugares guardados | ... | ... |
| Sin conexión | ... | ... |

---

## Paso 5: Revisión antes de entregar

Antes de presentar el copy, verifica:

- [ ] ¿El texto más corto posible sin perder significado?
- [ ] ¿El tono es coherente con el resto de la voz de Vaggage?
- [ ] ¿Los errores son empáticos y orientan al usuario?
- [ ] ¿Los CTAs son verbos de acción?
- [ ] ¿La versión en inglés suena nativa (no es traducción literal)?

---

Después de entregar, ofrece en una línea: "¿Ajusto el tono, la longitud, o quieres una variante diferente?"
