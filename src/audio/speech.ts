/**
 * Speech synthesis helper for language learning games
 * Uses browser Web Speech API with automatic language selection and gentle audio fallback
 */

export function speakWord(
  text: string,
  lang: 'es-ES' | 'ar-SA' | 'nl-BE' | 'nl-NL' | 'fr-FR' | 'en-US'
) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  try {
    window.speechSynthesis.cancel(); // Stop any pending utterances

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.88; // Slower, crystal clear for kids
    utterance.pitch = 1.15; // Friendly and warm

    // Try finding a matching native voice
    const voices = window.speechSynthesis.getVoices();
    const prefix = lang.slice(0, 2);
    const matchingVoice = voices.find(
      (v) => v.lang.toLowerCase() === lang.toLowerCase() || v.lang.toLowerCase().startsWith(prefix)
    );
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('SpeechSynthesis error:', err);
  }
}
