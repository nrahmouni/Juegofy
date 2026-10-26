# Parche para GameCanvas.tsx

Añade estos imports al principio de GameCanvas.tsx:

import { BubblePopGame } from './games/BubblePopGame';
import { SentenceTrainGame } from './games/SentenceTrainGame';

Y dentro del <main> añade estos bloques (junto a los demás if gameMode === ...):

{gameMode === 'bubble_pop' && (
  <BubblePopGame
    player={player}
    practiceLang={practiceLang}
    selectedLevel={selectedLevel}
    learnedWordIds={learnedWordIds}
    missedWordIds={missedWordIds}
    onMarkWordLearned={onMarkWordLearned}
    onMarkWordMissed={onMarkWordMissed}
    onWin={handleWin}
    setProgressPercent={setProgressPercent}
    starsCollected={starsCollected}
    setStarsCollected={setStarsCollected}
    wordsLearned={wordsLearned}
    setWordsLearned={setWordsLearned}
  />
)}

{gameMode === 'sentence_train' && (
  <SentenceTrainGame
    player={player}
    practiceLang={practiceLang}
    selectedLevel={selectedLevel}
    learnedWordIds={learnedWordIds}
    missedWordIds={missedWordIds}
    onMarkWordLearned={onMarkWordLearned}
    onMarkWordMissed={onMarkWordMissed}
    onWin={handleWin}
    setProgressPercent={setProgressPercent}
    starsCollected={starsCollected}
    setStarsCollected={setStarsCollected}
    wordsLearned={wordsLearned}
    setWordsLearned={setWordsLearned}
  />
)}

También cambia:
- safari_adventure → safari_photo  (o mantén ambos)
- Asegúrate de que dress_up y crazy_kitchen ya estén mapeados.
