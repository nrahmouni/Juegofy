# Mundo Mágico (Juegofy)

Aventura de aprendizaje por turnos para niños (3–9 años) con retos en **español, flamenco, árabe y francés**.

## Características

- **12 modos de juego** con mecánicas de arrastrar, lanzar, apuntar y construir frases
- **Audio 100 % sincronizado**: el juego espera a que termine de hablar antes de avanzar
- **Adaptive learning**: repasa palabras falladas y no repite las ya aprendidas
- Multijugador por turnos, avatares con cámara, monedas, podium y confeti
- Temas visuales: Dulces, Selva, Espacio, Océano, Volcán

### Modos de juego

| Modo | Mecánica |
|------|----------|
| Come-Palabras | Arrastra / lanza comida a la boca del monstruo |
| Tirachinas Mágico | Estira, apunta y dispara a nubes |
| Atrapa-Paracaídas | Desliza la cesta o arrastra paracaídas |
| Empareja Mágico ✨ | Arrastra la palabra al dibujo correcto |
| Constructor de Frases ✨ | Ordena tokens arrastrándolos |
| Cohete Espacial | Pilota y atrapa astros |
| Tren de Letras | Construye palabras y frases |
| Cofres del Tesoro | Memoria |
| Topos Flamencos / Burbujas Árabes / Chef Francés / Safari | Específicos por idioma |

✨ = nuevos en esta versión

## Cómo ejecutar

```bash
# Instalar (usa bun o npm)
bun install
# o: npm install

# Copia la clave de Gemini
cp .env.example .env
# Edita .env y pon tu GEMINI_API_KEY

# Desarrollo
bun run dev
# o: npm run dev
```

Abre http://localhost:3000

## Estructura clave

```
src/
  audio/soundManager.ts   # SFX + TTS sincronizado + haptics
  hooks/useAdaptiveRound.ts
  components/games/       # Todos los mini-juegos
  data/learningData.ts    # Vocabulario + GAME_MODES
  types/game.ts
```

## Notas de audio

- Usa siempre `await sounds.speakSequence([...])` o `await sounds.speakAsync(...)`.
- Nunca avances de ronda con `setTimeout` fijos mientras habla.
- `sounds.hapticSuccess()` / `hapticError()` dan feedback táctil en móviles.
