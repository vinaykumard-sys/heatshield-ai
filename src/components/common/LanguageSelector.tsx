import React from 'react';
import { Languages } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { SupportedLanguage } from '../../types';

export const LanguageSelector: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  const options: { code: SupportedLanguage; label: string; native: string }[] = [
    { code: 'en', label: 'English', native: 'English' },
    { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
    { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
  ];

  return (
    <div className="flex items-center bg-obsidian-900 border border-white/[0.08] rounded-xl p-0.5 shadow-sm text-xs">
      <span className="px-2 text-slate-400 flex items-center gap-1 font-medium">
        <Languages className="w-3.5 h-3.5 text-amber-400" />
      </span>
      <div className="flex divide-x divide-white/[0.08]">
        {options.map((opt) => (
          <button
            key={opt.code}
            onClick={() => setLanguage(opt.code)}
            className={`px-2.5 py-1 rounded-lg transition-all font-medium text-xs ${
              language === opt.code
                ? 'bg-white/[0.1] text-white shadow-sm ring-1 ring-white/10 font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
            title={opt.label}
          >
            {opt.native}
          </button>
        ))}
      </div>
    </div>
  );
};
