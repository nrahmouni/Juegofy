import React, { useState } from 'react';
import { X, Brain, Volume2, Sparkles, CheckCircle2, AlertCircle, RotateCcw } from 'lucide-react';
import {
  LearningItem,
  SPANISH_VOCAB_ITEMS,
  ALPHABET_LEARNING_ITEMS,
  FLEMISH_LEARNING_ITEMS,
  ARABIC_LEARNING_ITEMS,
  FRENCH_LEARNING_ITEMS,
  ALL_LEARNING_ITEMS,
} from '../data/learningData';
import { sounds } from '../audio/soundManager';

interface Props {
  learnedWordIds: string[];
  missedWordIds: string[];
  onResetProgress: () => void;
  onClose: () => void;
}

type TabId = 'es' | 'abc' | 'fl' | 'ar' | 'fr';

const TABS: { id: TabId; label: string; flag: string; items: LearningItem[] }[] = [
  { id: 'es', label: 'Español', flag: '🇪🇸', items: SPANISH_VOCAB_ITEMS },
  { id: 'abc', label: 'Letras', flag: '🚂', items: ALPHABET_LEARNING_ITEMS },
  { id: 'fl', label: 'Flamenco', flag: '🇧🇪', items: FLEMISH_LEARNING_ITEMS },
  { id: 'ar', label: 'Árabe', flag: '🇸🇦', items: ARABIC_LEARNING_ITEMS },
  { id: 'fr', label: 'Francés', flag: '🇫🇷', items: FRENCH_LEARNING_ITEMS },
];

export const SmartLearningModal: React.FC<Props> = ({
  learnedWordIds,
  missedWordIds,
  onResetProgress,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<TabId>('es');

  const currentTab = TABS.find((t) => t.id === activeTab) || TABS[0];
  const learnedInTab = currentTab.items.filter((i) => learnedWordIds.includes(i.id)).length;
  const totalMastered = ALL_LEARNING_ITEMS.filter((i) => learnedWordIds.includes(i.id)).length;
  const totalReview = ALL_LEARNING_ITEMS.filter((i) => missedWordIds.includes(i.id)).length;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-5 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-2xl max-h-[90dvh] bg-white rounded-[2.5rem] p-4 sm:p-6 shadow-2xl border-b-8 border-slate-200 flex flex-col">
        {/* Close Button */}
        <button
          onClick={() => {
            sounds.sfxPop();
            onClose();
          }}
          className="absolute -top-3 -right-3 p-3 bg-rose-500 text-white rounded-2xl shadow-xl btn-squishy"
          aria-label="Cerrar diccionario inteligente"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-3 pr-8">
          <div className="flex items-center gap-2.5">
            <div className="w-11 h-11 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-inner">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-indigo-950 uppercase leading-none">
                Aprendizaje Inteligente 🦉
              </h3>
              <p className="text-[11px] font-bold text-slate-500">
                Toca cualquier tarjeta para escuchar su pronunciación
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sounds.sfxPop();
              onResetProgress();
              sounds.speak('Progreso reiniciado', 'es-ES');
            }}
            className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-600 font-black text-xs flex items-center gap-1 border border-rose-200 btn-squishy"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reiniciar
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-2.5 text-center">
            <div className="text-[10px] font-black text-emerald-700 uppercase">Dominadas</div>
            <div className="text-lg sm:text-xl font-black text-emerald-950">
              {totalMastered} / {ALL_LEARNING_ITEMS.length}
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-2.5 text-center">
            <div className="text-[10px] font-black text-amber-700 uppercase">En Repaso Activo</div>
            <div className="text-lg sm:text-xl font-black text-amber-950">{totalReview}</div>
          </div>
          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-2.5 text-center">
            <div className="text-[10px] font-black text-indigo-700 uppercase">{currentTab.label}</div>
            <div className="text-lg sm:text-xl font-black text-indigo-950">
              {learnedInTab} / {currentTab.items.length}
            </div>
          </div>
        </div>

        {/* Language Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 shrink-0">
          {TABS.map((tab) => {
            const active = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  sounds.sfxPop();
                  setActiveTab(tab.id);
                }}
                className={`px-3 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 transition-all shrink-0 ${
                  active
                    ? 'bg-indigo-600 text-white shadow-md scale-105'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{tab.flag}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Interactive Word Cards Grid */}
        <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-2 pr-1">
          {currentTab.items.map((item) => {
            const isMastered = learnedWordIds.includes(item.id);
            const isReview = missedWordIds.includes(item.id) && !isMastered;
            return (
              <button
                key={item.id}
                onClick={() => {
                  sounds.sfxPop();
                  sounds.speak(item.audioText, item.audioLang);
                }}
                className={`p-2.5 rounded-2xl border-2 text-left flex items-center gap-2.5 transition-all btn-squishy ${
                  isMastered
                    ? 'bg-emerald-50/80 border-emerald-300'
                    : isReview
                    ? 'bg-amber-50 border-amber-300'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <span className="text-3xl shrink-0">{item.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-white text-slate-500 border border-slate-200">
                      N{item.level}
                    </span>
                    {isMastered && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                    {isReview && <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                  </div>
                  <div className="text-xs font-black text-slate-900 truncate mt-0.5">{item.targetText}</div>
                  <div className="text-[10px] font-bold text-slate-500 truncate">{item.es}</div>
                </div>
                <Volume2 className="w-4 h-4 text-indigo-500 shrink-0" />
              </button>
            );
          })}
        </div>

        {/* Footer Tip */}
        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-500">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Las palabras dominadas no se repiten hasta reiniciar
          </span>
        </div>
      </div>
    </div>
  );
};
