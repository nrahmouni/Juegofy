# 🎮 Mundo Mágico — Análisis de la Interfaz, Catálogo de Juegos y Prompt Maestro

---

## 📑 Índice
1. [Visión General de la Web App](#1-visión-general-de-la-web-app)
2. [Análisis de la Interfaz y Experiencia de Usuario (UI/UX)](#2-análisis-de-la-interfaz-y-experiencia-de-usuario-uiux)
3. [Catálogo Detallado de los 10 Juegos Principales](#3-catálogo-detallado-de-los-10-juegos-principales)
4. [Juegos y Modos Adicionales](#4-juegos-y-modos-adicionales)
5. [Arquitectura Técnica de Audio y Sincronización](#5-arquitectura-técnica-de-audio-y-sincronización)
6. [PROMPT MAESTRO para Recrear la Aplicación](#6-prompt-maestro-para-recrear-la-aplicación)

---

## 1. Visión General de la Web App

**Mundo Mágico** es una plataforma web progresiva (SPA) de videojuegos educativos interactivos, diseñada específicamente para niños de **3 a 9 años**. 

### Objetivos Clave:
- **Multijugador local por turnos**: Permite que varios niños (de 1 a 4 jugadores, como hermanos o compañeros de clase) jueguen en el mismo dispositivo pasando el turno de manera fluida y cooperativa.
- **Inmersión lingüística en 4 idiomas**:
  - 🇪🇸 **Español** (`es-ES`)
  - 🇧🇪 **Flamenco / Neerlandés** (`nl-BE`)
  - 🇫🇷 **Francés** (`fr-FR`)
  - 🇸🇦 **Árabe** (`ar-SA`)
- **Progresión adaptativa de 8 niveles**:
  - *Niveles 1 a 5*: Letras, fonética y vocabulario fundamental (animales, comida, colores, partes del cuerpo, familia).
  - *Niveles 6 a 8*: Frases compuestas, sintaxis y oraciones completas de la vida real con soporte auditivo.

---

## 2. Análisis de la Interfaz y Experiencia de Usuario (UI/UX)

### A. Principios de Diseño Infantil
1. **Ergonomía Táctil Adaptada**: 
   - Los botones y zonas interactivas tienen un tamaño mínimo de **56x56 px** (*touch targets* amplios), facilitando la precisión de dedos pequeños en tablets y teléfonos móviles.
   - Prevención de desbordamiento de pantalla: interfaz contenida (*viewport-fit*), eliminando barras de scroll no deseadas que confunden a los niños pequeños.
2. **Tipografía Emocional y Legible**:
   - Uso de las fuentes **Baloo 2** y **Fredoka**, caracterizadas por sus terminaciones redondeadas, trazos gruesos y caracteres diferenciados que facilitan el reconocimiento de grafías a lectores tempranos.
3. **Botones Blandos / "Squishy" en 3D**:
   - Cada botón interactivo cuenta con relieve inferior sombreado (`border-b-4` a `border-b-6`) que se comprime físicamente al presionar (`active:translate-y-1 active:border-b-0`), brindando una respuesta táctil que simula juguetes reales.
4. **Iconografía Vectorial SVG Propia**:
   - Eliminación de emojis de sistema operativo (que cambian o se ven inconsistentes entre Android, iOS y Windows) en favor de ilustraciones SVG animadas con gradientes vivos, ojos expresivos y contornos nítidos.

### B. Gestión de Turnos y Jugadores
- **Selector de Perfiles Rápido**: Tarjetas personalizables donde cada niño tiene su propio nombre en mayúsculas, color identificativo y avatar animal.
- **Economía de Logros Positiva**: Cada acierto otorga estrellas brillantes ✨, confeti en pantalla y monedas sin castigos frustrantes. Si el niño comete un error, el sistema ofrece una pista auditiva y permite reintentar inmediatamente.

---

## 3. Catálogo Detallado de los 10 Juegos Principales

### 1. 👾 ¡Come-Palabras! (`monster_feeder`)
- **Mecánica**: Un monstruo amigable abre y cierra su gran boca en el centro de la pantalla. En la bandeja inferior flotan varios alimentos con sus nombres correspondientes. El niño debe pulsar o arrastrar el alimento solicitado directamente a la boca del monstruo.
- **Habilidades que desarrolla**: Comprensión auditiva rápida, vocabulario de alimentos y motricidad fina de arrastre.

### 2. 🏹 Tirachinas Mágico (`slingshot_magic`)
- **Mecánica**: Física interactiva de resorte elástico. El jugador toca el proyectil en la horqueta del tirachinas, lo estira hacia atrás calculando ángulo y potencia con una estela de trayectoria, y lo suelta disparado hacia la nube que contiene la palabra correcta.
- **Habilidades que desarrolla**: Percepción espacial, estimación de trayectorias físicas, discriminación fonética bajo puntería.

### 3. 🏃 Carrera de Palabras (`word_dash`)
- **Mecánica**: Juego de estilo *endless runner* con 3 carriles en perspectiva. El personaje avanza a velocidad continua mientras aparecen obstáculos que esquivar y portales con palabras. El niño toca o desliza para situarse en el carril de la palabra correcta.
- **Habilidades que desarrolla**: Reflejos motrices, lectura rápida en movimiento y toma ágil de decisiones.

### 4. 🧲 Empareja Mágico (`drag_match`)
- **Mecánica**: Cuadrícula con tarjetas ilustradas e imanes de palabras. Al arrastrar una tarjeta cerca de su hueco correspondiente, un efecto magnético de *snap* la absorbe suavemente, emitiendo un sonido armónico y pronunciando la palabra.
- **Habilidades que desarrolla**: Asociación semántica imagen-texto, memoria visual y ortografía.

### 5. 🚀 Cohete Turbo (`rocket_race`)
- **Mecánica**: Navegación en gravedad cero espacial. El niño pilota un cohete a reacción esquivando asteroides y recolectando constelaciones de estrellas que deletrean letras y palabras clave.
- **Habilidades que desarrolla**: Orientación bidimensional continua, coordinación bimanual y refuerzo del abecedario.

### 6. 🫧 Burbujas Mágicas (`bubble_pop`)
- **Mecánica**: Burbujas jabonosas flotan y se mecen suavemente por la pantalla. La voz del juego pronuncia una palabra diana; el niño debe tocar y reventar únicamente la burbuja correcta, produciendo una explosión de gotas de agua y sonido *pop*.
- **Habilidades que desarrolla**: Discriminación auditiva pura, velocidad de reflejos y atención selectiva.

### 7. 👗 Viste a tu Amigo (`dress_up`)
- **Mecánica**: Maniquí interactivo dividido en 4 zonas anatómicas (cabeza, torso, piernas y pies). El jugador arrastra prendas (gorro, camiseta, pantalón, zapatillas) a su ubicación anatómica correcta. Al encajar la prenda, se pronuncia su nombre en el idioma elegido.
- **Habilidades que desarrolla**: Esquema corporal, vocabulario de ropa y colores, categorización espacial.

### 8. 📸 Safari Fotográfico (`safari_photo`)
- **Mecánica**: Escenario de selva profunda donde animales salvajes se asoman y ocultan entre ramas y arbustos. El juego pide localizar un animal específico; el niño debe enfocarlo y presionar el botón del obturador fotográfico para tomar una foto Polaroid instantánea.
- **Habilidades que desarrolla**: Rastreo visual, paciencia, atención sostenida y fauna en múltiples idiomas.

### 9. 🚂 El Tren de las Frases (`sentence_train`)
- **Mecánica**: Una locomotora a vapor animada con chimenea humeante, ruedas en movimiento y vagones de carga enlazados sobre vías de tren con traviesas de madera. En cada vagón se aloja una palabra de la oración. El niño arrastra o toca las palabras para armar la frase en el orden gramatical exacto.
- **Sincronización Audiovisual**:
  - Al colocar cada palabra, se pronuncia individualmente para feedback instantáneo.
  - Al completar la oración, los vagones se iluminan en secuencia progresiva al ritmo exacto en que la voz lee cada término, rematando con la frase completa, silbato de tren 🚂 y confeti.
- **Habilidades que desarrolla**: Sintaxis, estructura oracional, orden lógico de lectura y comprensión semántica.

### 10. 🍳 Cocina del Chef (`crazy_kitchen`)
- **Mecánica**: Un simpático chef solicita ingredientes secuenciales para completar una receta mágica. El niño debe recordar y arrastrar los alimentos requeridos a la sartén chispeante en el orden preciso indicado.
- **Habilidades que desarrolla**: Memoria de trabajo secuencial, seguimiento de recetas paso a paso y vocabulario de cocina.

---

## 4. Juegos y Modos Adicionales

- 🇧🇪 **Mundo Flamenco (`flemish_world`)**: Hub regional inmersivo ambientado en Flandes con minijuegos específicos:
  - Clasificación de artículos de género gramatical (*de* vs. *het*).
  - La tienda de gofres (*wafelwinkel*).
  - El molino de viento de palabras y los globos aerostáticos.
- 🧞 **Genio Árabe (`lang_arabic`)**: Reconocimiento de fonemas y vocabulario con caligrafía árabe adaptada y pronunciación nativa.
- 🌻 **Topos Flamencos (`lang_flemish`)**: Juego estilo *Whack-a-Mole* donde topos sonrientes emergen de madrigueras portando palabras en flamenco.
- 🥐 **Chef de París (`lang_french`)**: Preparación y servicio de mesas en un bistró parisino.
- 🛤️ **Circuito Mágico (`circuit_path`)**: Trazado continuo con el dedo sobre un circuito luminoso sin despegar el dedo para afianzar la motricidad grafomotora.

---

## 5. Arquitectura Técnica de Audio y Sincronización

La aplicación implementa un sistema propietario en `src/audio/soundManager.ts` diseñado para eliminar los problemas comunes de audio web en dispositivos móviles:

```
┌─────────────────────────────────────────────────────────────────┐
│                        SOUND MANAGER                            │
├────────────────────────────────┬────────────────────────────────┤
│      Web Audio API Chiptune    │    SpeechSynthesis Controller  │
│  - Síntesis de ondas cuadradas │  - Cola asíncrona Promise-based│
│    y sinusoidales sin latencia │  - Cancelación segura de tokens│
│  - Sonidos de pops, silbato,   │  - Ducking automático de música│
│    monedas y fanfarrias        │  - Sincronización palabra-luz  │
└────────────────────────────────┴────────────────────────────────┘
```

1. **Cero Dependencia de MP3 Externos**: Los efectos de sonido no dependen de descargas de archivos de audio que puedan fallar por conectividad o bloqueos del navegador.
2. **Sistema de Tokens de Voz**: Evita que una nueva locución corte abruptamente la anterior a mitad de palabra, garantizando que el niño escuche la pronunciación completa y clara.
3. **Atenuación Automática (*Audio Ducking*)**: Durante la locución de voz, la música ambiental de fondo reduce automáticamente su volumen para garantizar una inteligibilidad acústica perfecta.

---

## 6. PROMPT MAESTRO para Recrear la Aplicación

Copia el siguiente bloque y utilízalo para regenerar o extender la aplicación completa:

```markdown
Construye una aplicación web completa, responsiva y de producción en React 19 + TypeScript + Vite + Tailwind CSS llamada "Mundo Mágico", diseñada como un centro de videojuegos educativos interactivos para niños de 3 a 9 años, con soporte multijugador local por turnos (1 a 4 jugadores) y aprendizaje en 4 idiomas: Español (es-ES), Flamenco/Neerlandés (nl-BE), Francés (fr-FR) y Árabe (ar-SA).

### REQUISITOS DE DISEÑO Y UI/UX:
1. Estilo visual anti-fatiga, alegre e hipercolorido con tipografías infantiles (Baloo 2 y Fredoka) y bordes redondeados (rounded-2xl y rounded-3xl).
2. Botones táctiles "squishy" interactivos en 3D con relieve inferior (border-b-4 a border-b-6) que se comprimen al presionar (active:translate-y-1).
3. Iconos SVG propios de gran detalle con gradientes y sombras para cada juego (no usar emojis genéricos en los botones principales).
4. Barra superior con cambio de idioma instantáneo (banderas 🇪🇸, 🇧🇪, 🇫🇷, 🇸🇦) y selector de nivel de dificultad del 1 al 8.
5. Barra flotante inferior permanente con contador de estrellas, palabras aprendidas y barra de progreso.

### MOTOR DE AUDIO Y SINCRONIZACIÓN (soundManager.ts):
- Web Audio API Chiptune: Generación procedural de efectos (clicks, pops, aciertos, fallos, elásticos, monedas, silbato de tren y fanfarria triunfal).
- SpeechSynthesis Sincronizado: Método 'speakAsync(text, lang, interrupt)' basado en Promesas con Speech Tokens y cancelación limpia para evitar cortes a mitad de locución.
- Sincronización visual obligatoria: En los juegos de lectura y orden de oraciones, los vagones o ranuras deben iluminarse en sincronía exacta con cada palabra que pronuncia la voz.

### CATÁLOGO DE LOS 10 JUEGOS PRINCIPALES:
1. "¡Come-Palabras!" (monster_feeder): Monstruo animado que abre la boca; el niño arrastra la comida solicitada hacia su boca.
2. "Tirachinas Mágico" (slingshot_magic): Física de arrastre elástico con cálculo de trayectoria para disparar orbes a nubes de palabras.
3. "Carrera de Palabras" (word_dash): Runner de 3 carriles donde el niño cambia de carril para esquivar piedras y cruzar el portal de la palabra correcta.
4. "Empareja Mágico" (drag_match): Arrastre de tarjetas de palabras hacia ranuras con efecto magnético de acople ("snap").
5. "Cohete Turbo" (rocket_race): Vuelo espacial guiando un cohete propulsado hacia estrellas y constelaciones de letras.
6. "Burbujas Mágicas" (bubble_pop): Burbujas que flotan suavemente; el niño escucha el audio y revienta la burbuja correcta con partículas de agua.
7. "Viste a tu Amigo" (dress_up): Maniquí con 4 zonas (cabeza, torso, piernas, pies) para arrastrar y encajar ropa aprendiendo el esquema corporal.
8. "Safari Fotográfico" (safari_photo): Animales que se asoman en la selva; el niño presiona el obturador cuando el animal pedido está a la vista, obteniendo una foto instantánea Polaroid.
9. "El Tren de las Frases" (sentence_train): Locomotora a vapor con humo animado y vagones de madera sobre raíles; el niño ordena las palabras de una frase. Al acertar, los vagones se iluminan uno a uno en sincronía con la voz que lee la oración, seguido de silbato de tren y confeti.
10. "Cocina del Chef" (crazy_kitchen): Un simpático cocinero solicita ingredientes en secuencia para preparar recetas en la sartén.

### GESTIÓN DE JUGADORES Y APRENDIZAJE:
- Configuración de turnos para 1 a 4 niños con nombre, avatar animal y color identificativo.
- Banco de datos con más de 100 elementos clasificados por categorías y niveles (palabras sueltas en niveles 1-5, oraciones completas en niveles 6-8).
- Mensajes de felicitación personalizados con el nombre del jugador en turno ("¡Excelente trabajo, Faysal!").
- Modal de fin de turno y podio de celebración final.
```
