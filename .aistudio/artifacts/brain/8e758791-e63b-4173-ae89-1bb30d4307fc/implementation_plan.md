# Implementation Plan: UI Layout Polish & Text Overflows Correction

Fix all text wrapping, canvas clipping, and context-aware instruction bugs across all 6 mini-games, specifically resolving lilypad text overflows in MathBridgeGame and ensuring pristine readability on all screen sizes.

---

## 1. Canvas Text Layout & Overflow Fixes (MathBridgeGame)
1. **Lilypad Text Scaling & Wrapping**:
   - Wrap long shape and word text inside canvas lilypads (e.g. "Cuadrado", "Círculo", "Triángulo") across multiple lines or scale font size down (`font = 'bold 16px "Baloo 2"'`) so text never overflows or gets clipped.
2. **Context-Aware Footer Instructions**:
   - Update MathBridgeGame footer hint to say "apunta a la hoja con la respuesta correcta 🐸" instead of specifically "número" when asking shape questions.

---

## 2. Multi-Game Text & UI Polish Audit
1. **ArabicCatcherGame**: Check falling balloon text alignment and word wrapping.
2. **FlemishWhackGame**: Check mole burrow sign text sizing for longer Flemish words.
3. **FrenchBubbleGame**: Check space bubble text font sizing and spacing.
4. **AlphabetMemoryGame**: Check card typography for long words.
5. **ClassicTrackGame**: Check track HUD and warning banner presence.

---

## 3. Verification
- Run `compile_applet` and `lint_applet` to confirm clean build.
