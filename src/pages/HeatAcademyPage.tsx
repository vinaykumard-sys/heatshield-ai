import React, { useState } from 'react';
import { 
  GraduationCap, 
  Award, 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  AlertTriangle, 
  Download, 
  Sparkles, 
  ArrowRight, 
  Users, 
  HardHat, 
  School, 
  HeartPulse,
  RotateCcw,
  Check,
  FileText
} from 'lucide-react';
import { mockDb } from '../lib/mockDb';
import { AcademyCourse } from '../types';
import { LocationTrackerBar } from '../components/common/LocationTrackerBar';

export const HeatAcademyPage: React.FC = () => {
  const [courses, setCourses] = useState<AcademyCourse[]>(() => mockDb.getAcademyCourses());
  const [selectedRole, setSelectedRole] = useState<'residents' | 'workers' | 'schools' | 'volunteers'>('residents');
  const [activeCourseId, setActiveCourseId] = useState<string>(courses[0]?.id || 'course-1');

  // Quiz state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isQuizSubmitted, setIsQuizSubmitted] = useState(false);
  const [certIssued, setCertIssued] = useState(false);

  const activeCourse = courses.find(c => c.id === activeCourseId) || courses[0];

  const handleRoleChange = (role: 'residents' | 'workers' | 'schools' | 'volunteers') => {
    setSelectedRole(role);
    const matched = courses.find(c => c.role_target === role);
    if (matched) {
      setActiveCourseId(matched.id);
      setCurrentQuestionIndex(0);
      setSelectedAnswers({});
      setIsQuizSubmitted(false);
      setCertIssued(false);
    }
  };

  const handleSelectAnswer = (qIdx: number, optIdx: number) => {
    if (isQuizSubmitted) return;
    setSelectedAnswers(prev => ({ ...prev, [qIdx]: optIdx }));
  };

  const calculateScore = () => {
    if (!activeCourse) return 0;
    let correct = 0;
    activeCourse.quiz.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correct_index) {
        correct++;
      }
    });
    return Math.round((correct / activeCourse.quiz.length) * 100);
  };

  const handleSubmitQuiz = () => {
    setIsQuizSubmitted(true);
    const score = calculateScore();
    if (score >= 80) {
      setCertIssued(true);
    }
  };

  const handleDownloadCheatsheet = () => {
    const text = `HEATSHIELD AI - EMERGENCY HEAT ACTION PROTOCOL
Track: ${activeCourse.title}
Certified Standard: NDMA & WHO Heat Action Guideline

1. IMMEDIATE HYDRATION:
   - Drink 250ml water every 20-30 minutes.
   - Supplement with ORS (Oral Rehydration Salts) or coconut water.

2. COOLING ENVIRONMENT:
   - Move into shade or an air-conditioned cooling sanctuary immediately.
   - Use evaporative cloths on neck, armpits, and groin.

3. DANGER WARNING SIGNS (CALL 108 IMMEDIATELY):
   - Altered mental state, confusion, or delirium.
   - Hot, dry, flushed skin with cessation of sweating.
   - Persistent vomiting or seizures.

Issued by HeatShield AI Knowledge Base.`;

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `heatshield_${activeCourse.role_target}_cheatsheet.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const score = isQuizSubmitted ? calculateScore() : 0;
  const isPassed = score >= 80;

  return (
    <div className="space-y-6 pb-12">
      <LocationTrackerBar />

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-medium text-blue-600 uppercase tracking-wider">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Community Heat Health Education</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Heat Awareness Academy
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Empower yourself, your workforce, or your community with accredited heat safety protocols and earn certified badges.
          </p>
        </div>

        <button
          onClick={handleDownloadCheatsheet}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-subtle btn-press transition-all"
        >
          <FileText className="w-4 h-4 text-blue-600" />
          <span>Download Action Cheat-Sheet</span>
        </button>
      </div>

      {/* Role-Targeted Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { id: 'residents', label: 'Residents & Families', icon: Users, desc: 'Hydration & vulnerable member care' },
          { id: 'workers', label: 'Outdoor Workers', icon: HardHat, desc: 'OSHA / NDMA work-rest cycles' },
          { id: 'schools', label: 'Schools & Youth', icon: School, desc: 'Playground & classroom safety' },
          { id: 'volunteers', label: 'Community Volunteers', icon: HeartPulse, desc: 'Welfare check-ins & triage' }
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = selectedRole === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleRoleChange(tab.id as any)}
              className={`p-4 rounded-2xl border text-left btn-press card-interactive transition-all ${
                isSelected
                  ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 shadow-subtle'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-blue-600'}`} />
                <span className="font-bold text-xs">{tab.label}</span>
              </div>
              <p className={`text-[11px] mt-1 line-clamp-1 ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                {tab.desc}
              </p>
            </button>
          );
        })}
      </div>

      {/* Main Grid: Course Content & Knowledge Check Quiz */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Course Lesson & Checklists */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 shadow-subtle space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-blue-600 uppercase">
              <span>{activeCourse.lessons[0]?.reading_time_mins || 15} Mins • {activeCourse.quiz.length} Knowledge Check Questions</span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 mt-1">{activeCourse.title}</h2>
            <p className="text-xs text-slate-500 mt-1">{activeCourse.description}</p>
          </div>

          {/* Module Lessons */}
          <div className="space-y-4">
            {activeCourse.lessons.map((mod, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center font-mono">
                    {idx + 1}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900">{mod.title}</h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{mod.summary}</p>

                {/* Key Takeaways */}
                <div className="space-y-1.5 pt-2 border-t border-slate-200/60">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Action Checklist:</span>
                  {mod.key_takeaways.map((item, tIdx) => (
                    <div key={tIdx} className="flex items-start gap-2 text-xs text-slate-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Knowledge Check Quiz & Certificate Panel */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-subtle space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900">Accreditation Quiz</h3>
              </div>
              <span className="text-xs font-mono text-slate-500">Passing: 80%+</span>
            </div>

            {/* Questions list */}
            <div className="space-y-5">
              {activeCourse.quiz.map((q, qIdx) => (
                <div key={q.id} className="space-y-2.5">
                  <h4 className="text-xs font-bold text-slate-900">
                    <span className="text-blue-600 font-mono mr-1">Q{qIdx + 1}.</span> {q.question}
                  </h4>
                  <div className="space-y-1.5">
                    {q.options.map((opt, optIdx) => {
                      const isSelected = selectedAnswers[qIdx] === optIdx;
                      const isCorrect = isQuizSubmitted && q.correct_index === optIdx;
                      const isWrong = isQuizSubmitted && isSelected && !isCorrect;

                      let optClass = 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100';
                      if (isSelected) optClass = 'bg-blue-50 border-blue-500 text-blue-900 font-semibold';
                      if (isCorrect) optClass = 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold';
                      if (isWrong) optClass = 'bg-red-50 border-red-400 text-red-900';

                      return (
                        <button
                          key={optIdx}
                          disabled={isQuizSubmitted}
                          onClick={() => handleSelectAnswer(qIdx, optIdx)}
                          className={`w-full text-left p-2.5 rounded-xl border text-xs btn-press transition-all flex items-center justify-between ${optClass}`}
                        >
                          <span>{opt}</span>
                          {isCorrect && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Quiz Submit / Reset Buttons */}
            {!isQuizSubmitted ? (
              <button
                onClick={handleSubmitQuiz}
                disabled={Object.keys(selectedAnswers).length < activeCourse.quiz.length}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md btn-interact disabled:opacity-50"
              >
                Submit Answers for Evaluation
              </button>
            ) : (
              <div className="space-y-3 pt-2">
                <div className={`p-4 rounded-2xl text-center border ${
                  isPassed ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-red-50 border-red-200 text-red-900'
                }`}>
                  <div className="text-2xl font-extrabold font-mono">{score}%</div>
                  <div className="text-xs font-bold mt-0.5">
                    {isPassed ? '🎉 Passed! You achieved certification standard.' : 'Score below 80%. Review lesson takeaways and retry.'}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsQuizSubmitted(false);
                    setSelectedAnswers({});
                  }}
                  className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 btn-press flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retake Quiz</span>
                </button>
              </div>
            )}
          </div>

          {/* Certificate Badge Display when passed */}
          {certIssued && (
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-3xl p-6 shadow-xl space-y-3 animate-in zoom-in-95">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-amber-100">Certified Resilient</span>
                  <h4 className="text-base font-bold text-white">{activeCourse.badge_title}</h4>
                </div>
              </div>
              <p className="text-xs text-amber-100">
                Verified compliance with National Disaster Management Authority (NDMA) thermal resilience and community protection protocols.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HeatAcademyPage;
