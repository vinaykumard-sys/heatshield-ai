import React, { useState, useEffect } from 'react';
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
  FileText,
  X,
  ChevronRight,
  ChevronLeft,
  Printer,
  Share2,
  CheckCircle,
  HelpCircle,
  Compass
} from 'lucide-react';
import { mockDb } from '../lib/mockDb';
import { AcademyCourse } from '../types';
import { LocationTrackerBar } from '../components/common/LocationTrackerBar';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';

export const HeatAcademyPage: React.FC = () => {
  const [courses] = useState<AcademyCourse[]>(() => mockDb.getAcademyCourses());
  const [selectedRole, setSelectedRole] = useState<'residents' | 'workers' | 'schools' | 'volunteers'>('residents');
  const [activeCourseId, setActiveCourseId] = useState<string>(() => {
    const list = mockDb.getAcademyCourses();
    const firstForRole = list.find(c => c.role_target === 'residents');
    return firstForRole?.id || list[0]?.id || 'course-residents';
  });

  // Track progress from mockDb
  const [academyProgress, setAcademyProgress] = useState(() => mockDb.getAcademyProgress());

  // Interactive Quiz state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isQuizSubmitted, setIsQuizSubmitted] = useState(false);
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [expandedLessonId, setExpandedLessonId] = useState<string | null>(null);

  const activeCourse = courses.find(c => c.id === activeCourseId) || courses[0];
  const activeCourseProgress = academyProgress[activeCourse?.id];
  const completedLessons = activeCourseProgress?.completedLessons || [];
  const storedQuizScore = activeCourseProgress?.quizScore;

  // Local certificate status synced with quiz results or existing record
  const [certIssued, setCertIssued] = useState(() => {
    return (storedQuizScore !== undefined && storedQuizScore >= 80);
  });

  // Update certificate status if stored score or active course changes
  useEffect(() => {
    const score = academyProgress[activeCourse?.id]?.quizScore;
    if (score !== undefined && score >= 80) {
      setCertIssued(true);
    } else if (!isQuizSubmitted) {
      setCertIssued(false);
    }
  }, [activeCourseId, academyProgress]);

  const handleRoleChange = (role: 'residents' | 'workers' | 'schools' | 'volunteers') => {
    setSelectedRole(role);
    const matched = courses.find(c => c.role_target === role);
    if (matched) {
      setActiveCourseId(matched.id);
      setCurrentQuestionIndex(0);
      setSelectedAnswers({});
      setIsQuizSubmitted(false);
      const prevScore = academyProgress[matched.id]?.quizScore;
      setCertIssued(prevScore !== undefined && prevScore >= 80);
      setExpandedLessonId(null);
    }
  };

  const handleToggleLessonComplete = (lessonId: string) => {
    if (!activeCourse) return;
    mockDb.recordLessonComplete(activeCourse.id, lessonId);
    setAcademyProgress(mockDb.getAcademyProgress());
  };

  const handleSelectAnswer = (qIdx: number, optIdx: number) => {
    if (isQuizSubmitted) return;
    setSelectedAnswers(prev => ({ ...prev, [qIdx]: optIdx }));
  };

  const calculateScore = () => {
    if (!activeCourse || !activeCourse.quiz || activeCourse.quiz.length === 0) return 0;
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
    mockDb.recordQuizScore(activeCourse.id, score);
    setAcademyProgress(mockDb.getAcademyProgress());
    if (score >= 80) {
      setCertIssued(true);
    }
  };

  const handleResetQuiz = () => {
    setIsQuizSubmitted(false);
    setSelectedAnswers({});
    setCurrentQuestionIndex(0);
  };

  const handleDownloadCheatsheet = () => {
    if (!activeCourse) return;
    const text = `HEATSHIELD AI - EMERGENCY HEAT ACTION PROTOCOL
Track: ${activeCourse.title}
Target Audience: ${activeCourse.role_target.toUpperCase()}
Accreditation Standard: National Disaster Management Authority (NDMA) & WHO Heat Action Guidelines
Generated On: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}

1. IMMEDIATE HYDRATION & ELECTROLYTE PROTOCOL:
   - Drink 250ml - 500ml water every 20-30 minutes during heat hours.
   - Supplement with Oral Rehydration Salts (ORS), coconut water, or salted buttermilk (chaas).
   - Avoid alcohol, highly caffeinated sodas, and heavy sugary drinks.

2. COOLING ENVIRONMENT & SHELTER:
   - Move into shade or an air-conditioned cooling sanctuary immediately.
   - Apply cold, wet washcloths to neck, armpits, and forehead.
   - Draw window blinds and utilize cross-ventilation during non-peak hours.

3. DANGER WARNING SIGNS (CALL 112 / 108 IMMEDIATELY):
   - Altered mental state, confusion, slurred speech, or delirium.
   - Hot, red, dry skin with complete stoppage of sweating.
   - Persistent vomiting, severe involuntary muscle cramps, or seizures.

4. ACTION CHECKLIST FOR THIS TRACK:
${activeCourse.lessons.flatMap(l => l.key_takeaways).map(t => `   [ ] ${t}`).join('\n')}

Issued by HeatShield AI Community Heat Health Academy.`;

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `heatshield_${activeCourse.role_target}_cheatsheet.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const score = isQuizSubmitted ? calculateScore() : (storedQuizScore ?? 0);
  const isPassed = (isQuizSubmitted && score >= 80) || (storedQuizScore !== undefined && storedQuizScore >= 80);

  // Overall Academy Progress Metrics
  const totalCourses = courses.length || 1;
  const certifiedCoursesCount = courses.filter(c => {
    const s = academyProgress[c.id]?.quizScore;
    return s !== undefined && s >= 80;
  }).length;
  const totalLessonsInAcademy = courses.reduce((acc, c) => acc + c.lessons.length, 0);
  const totalLessonsCompleted = Object.values(academyProgress).reduce((acc, p) => acc + (p.completedLessons?.length || 0), 0);
  const overallProgressPct = Math.min(100, Math.round(((totalLessonsCompleted + certifiedCoursesCount) / (totalLessonsInAcademy + totalCourses)) * 100));

  // Active track progress
  const activeCourseLessonsCount = activeCourse?.lessons.length || 1;
  const activeCourseCompletedLessonsCount = completedLessons.length;
  const activeCourseProgressPct = Math.round(
    ((activeCourseCompletedLessonsCount + (isPassed ? 1 : 0)) / (activeCourseLessonsCount + 1)) * 100
  );

  const roleTabs = [
    { 
      id: 'residents', 
      label: 'Residents & Families', 
      icon: Users, 
      desc: 'Home cooling, hydration & elder care' 
    },
    { 
      id: 'workers', 
      label: 'Outdoor Workers', 
      icon: HardHat, 
      desc: 'Work-rest cycles, WBGT & heat stress' 
    },
    { 
      id: 'schools', 
      label: 'Schools & Youth', 
      icon: School, 
      desc: 'Playground curfew & student wellness' 
    },
    { 
      id: 'volunteers', 
      label: 'Community Volunteers', 
      icon: HeartPulse, 
      desc: 'Welfare visits, hydration & relief triage' 
    }
  ] as const;

  return (
    <div className="space-y-6 pb-12 font-sans text-[#0F172A]">
      <LocationTrackerBar />

      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="primary" dot size="sm">
              HeatShield Learning Academy
            </Badge>
            <Badge variant="subtle" size="sm">
              NDMA & WHO Accredited
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
            Heat Awareness Academy
          </h1>
          <p className="text-sm text-[#64748B] mt-1 max-w-2xl">
            Practical heat safety education for families, outdoor teams, educators, and volunteers. Learn life-saving prevention habits, test your knowledge, and earn certified digital badges.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          <Button
            variant="outline"
            size="md"
            icon={<FileText className="w-4 h-4 text-[#1E60F2]" />}
            onClick={handleDownloadCheatsheet}
          >
            Download Safety Cheat-Sheet
          </Button>

          {certIssued && (
            <Button
              variant="primary"
              size="md"
              icon={<Award className="w-4 h-4 text-white" />}
              onClick={() => setShowCertificateModal(true)}
            >
              View Certificate
            </Button>
          )}
        </div>
      </div>

      {/* Academy Progress Overview Card */}
      <Card padding="md" className="border-[#E5EDF5] bg-white shadow-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#0F172A] flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-[#1E60F2]" />
                Overall Certification Progress
              </span>
              <span className="text-xs font-bold text-[#1E60F2]">
                {overallProgressPct}% Completed
              </span>
            </div>

            {/* Clean Progress Bar */}
            <div className="w-full bg-[#E5EDF5] h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-[#1E60F2] h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${overallProgressPct}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-[#64748B]">
              <span>{totalLessonsCompleted} of {totalLessonsInAcademy} lessons finished</span>
              <span>{certifiedCoursesCount} of {totalCourses} tracks certified</span>
            </div>
          </div>

          <div className="flex items-center gap-3 border-t md:border-t-0 md:border-l border-[#E5EDF5] pt-3 md:pt-0 md:pl-5 shrink-0">
            <div className="text-center px-2">
              <div className="text-lg font-bold text-[#0F172A]">{certifiedCoursesCount}</div>
              <div className="text-[11px] text-[#64748B]">Badges Earned</div>
            </div>
            <div className="h-8 w-px bg-[#E5EDF5]" />
            <div className="text-center px-2">
              <div className="text-lg font-bold text-emerald-600">80%+</div>
              <div className="text-[11px] text-[#64748B]">Pass Standard</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Role-Targeted Tracks Navigation */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#0F172A]">Choose Your Learning Track</h2>
          <span className="text-xs text-[#64748B]">Select a role to view specific protocols</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {roleTabs.map((tab) => {
            const Icon = tab.icon;
            const isSelected = selectedRole === tab.id;
            const courseForTab = courses.find(c => c.role_target === tab.id);
            const isTabCertified = courseForTab && (academyProgress[courseForTab.id]?.quizScore ?? 0) >= 80;

            return (
              <button
                key={tab.id}
                onClick={() => handleRoleChange(tab.id)}
                className={`p-4 rounded-[20px] border text-left transition-all duration-200 ease-out relative group flex flex-col justify-between ${
                  isSelected
                    ? 'bg-blue-50/60 border-[#1E60F2] shadow-[0_4px_16px_rgba(30,96,242,0.12)] ring-1 ring-[#1E60F2]'
                    : 'bg-white border-[#E5EDF5] hover:border-slate-300 hover:shadow-card shadow-card'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                      isSelected ? 'bg-[#1E60F2] text-white shadow-xs' : 'bg-slate-100 text-slate-700 group-hover:bg-blue-50 group-hover:text-[#1E60F2]'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    {isTabCertified ? (
                      <Badge variant="success" size="sm">
                        <Check className="w-3 h-3 mr-0.5 inline" /> Certified
                      </Badge>
                    ) : isSelected ? (
                      <Badge variant="primary" size="sm">
                        Active Track
                      </Badge>
                    ) : null}
                  </div>

                  <div className="font-bold text-sm text-[#0F172A]">{tab.label}</div>
                  <p className="text-xs text-[#64748B] mt-1 line-clamp-2 leading-relaxed">
                    {tab.desc}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100/80 flex items-center justify-between text-[11px] font-medium text-[#64748B]">
                  <span>{courseForTab?.lessons.length || 2} Lessons</span>
                  <span className="flex items-center gap-1 text-[#1E60F2] group-hover:translate-x-0.5 transition-transform">
                    Explore <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Course Content & Knowledge Check Quiz */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Course Modules & Action Checklists */}
        <div className="lg:col-span-7 space-y-4">
          <Card padding="lg" className="border-[#E5EDF5] bg-white shadow-card space-y-6">
            {/* Track Header */}
            <div className="border-b border-[#E5EDF5] pb-5">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="primary" size="sm">
                    {activeCourse.role_target.toUpperCase()} MODULE
                  </Badge>
                  <span className="text-xs text-[#64748B] flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {activeCourse.lessons[0]?.reading_time_mins || 12} mins reading
                  </span>
                </div>

                <Badge variant={isPassed ? 'success' : 'subtle'} size="sm">
                  {isPassed ? '✓ Track Certified' : `${activeCourseCompletedLessonsCount}/${activeCourseLessonsCount} Lessons Done`}
                </Badge>
              </div>

              <h2 className="text-xl sm:text-2xl font-extrabold text-[#0F172A] tracking-tight">
                {activeCourse.title}
              </h2>
              <p className="text-xs sm:text-sm text-[#64748B] mt-1.5 leading-relaxed">
                {activeCourse.description}
              </p>

              {/* Course Track Progress Bar */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-[#64748B]">Track Completion</span>
                  <span className="font-bold text-[#1E60F2]">{activeCourseProgressPct}%</span>
                </div>
                <div className="w-full bg-[#E5EDF5] h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-[#1E60F2] h-full rounded-full transition-all duration-300"
                    style={{ width: `${activeCourseProgressPct}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Module Lessons */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-[#1E60F2]" />
                  Curriculum Lessons & Checklists
                </h3>
                <span className="text-xs text-[#64748B]">Click lesson to read guidance</span>
              </div>

              {activeCourse.lessons.map((lesson, idx) => {
                const isLessonComplete = completedLessons.includes(lesson.id);
                const isExpanded = expandedLessonId === lesson.id || (expandedLessonId === null && idx === 0);

                return (
                  <div
                    key={lesson.id || idx}
                    className={`rounded-[18px] border transition-all duration-200 overflow-hidden ${
                      isExpanded 
                        ? 'border-[#1E60F2]/40 bg-white shadow-card' 
                        : 'border-[#E5EDF5] bg-slate-50/50 hover:bg-white hover:border-slate-300'
                    }`}
                  >
                    {/* Lesson Bar */}
                    <div 
                      onClick={() => setExpandedLessonId(isExpanded ? '' : lesson.id)}
                      className="p-4 sm:p-4.5 cursor-pointer flex items-center justify-between gap-3 select-none"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 transition-colors ${
                          isLessonComplete 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : 'bg-blue-100 text-[#1E60F2]'
                        }`}>
                          {isLessonComplete ? <Check className="w-4 h-4" /> : idx + 1}
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-[#0F172A] leading-snug">
                            {lesson.title}
                          </h4>
                          <span className="text-[11px] text-[#64748B]">
                            {lesson.reading_time_mins} min read • Key Takeaways Included
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isLessonComplete && (
                          <Badge variant="success" size="sm">
                            Finished
                          </Badge>
                        )}
                        <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-90 text-[#1E60F2]' : ''}`} />
                      </div>
                    </div>

                    {/* Lesson Expanded Content */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-1 sm:px-5 sm:pb-5 space-y-4 border-t border-slate-100">
                        {/* Summary */}
                        <div className="text-xs sm:text-sm text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-100 leading-relaxed">
                          <strong className="text-[#0F172A] block mb-1">Core Focus:</strong>
                          {lesson.summary}
                        </div>

                        {/* Detailed Content Paragraphs */}
                        {lesson.content && lesson.content.length > 0 && (
                          <div className="space-y-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                              Protocol Guidance:
                            </span>
                            <div className="space-y-2">
                              {lesson.content.map((p, pIdx) => (
                                <p key={pIdx} className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                  {p}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Key Action Checklist */}
                        <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-100/70 space-y-2">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-[#1E60F2] uppercase tracking-wider">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Action Checklist:</span>
                          </div>
                          <div className="space-y-1.5">
                            {lesson.key_takeaways.map((item, tIdx) => (
                              <div key={tIdx} className="flex items-start gap-2 text-xs text-slate-700">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                                <span className="leading-relaxed">{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Mark Complete Button */}
                        <div className="pt-2 flex items-center justify-end">
                          <Button
                            variant={isLessonComplete ? 'secondary' : 'soft'}
                            size="sm"
                            icon={isLessonComplete ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleLessonComplete(lesson.id);
                            }}
                          >
                            {isLessonComplete ? 'Marked as Completed' : 'Mark Lesson as Finished'}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Right Column: Quiz Accreditation Card & Certificate View */}
        <div className="lg:col-span-5 space-y-6">
          {/* Knowledge Check Card */}
          <Card padding="lg" className="border-[#E5EDF5] bg-white shadow-card space-y-5">
            <div className="flex items-center justify-between border-b border-[#E5EDF5] pb-3.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#0F172A]">Accreditation Quiz</h3>
                  <span className="text-[11px] text-[#64748B]">{activeCourse.quiz.length} Questions</span>
                </div>
              </div>

              <Badge variant={isPassed ? 'success' : 'warning'} size="sm">
                Pass mark: 80%+
              </Badge>
            </div>

            {/* Quiz Overview & Current Status */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-[#64748B] leading-relaxed">
              Verify your understanding of this safety protocol. Scoring 80% or higher awards you the official <strong className="text-[#0F172A]">{activeCourse.badge_title}</strong> credential.
            </div>

            {/* Inline Quiz Question List / Preview */}
            <div className="space-y-4">
              {activeCourse.quiz.map((q, qIdx) => {
                const isAnswered = selectedAnswers[qIdx] !== undefined;
                return (
                  <div key={q.id || qIdx} className="space-y-2 border-b border-slate-100 last:border-b-0 pb-3 last:pb-0">
                    <h4 className="text-xs font-bold text-[#0F172A] flex items-start gap-1.5 leading-snug">
                      <span className="text-[#1E60F2] font-mono shrink-0">Q{qIdx + 1}.</span>
                      <span>{q.question}</span>
                    </h4>

                    <div className="space-y-1.5 pl-4">
                      {q.options.map((opt, optIdx) => {
                        const isSelected = selectedAnswers[qIdx] === optIdx;
                        const isCorrect = isQuizSubmitted && q.correct_index === optIdx;
                        const isWrong = isQuizSubmitted && isSelected && !isCorrect;

                        let buttonStyles = 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100';
                        if (isSelected) buttonStyles = 'bg-blue-50 border-[#1E60F2] text-[#0F172A] font-medium shadow-xs';
                        if (isCorrect) buttonStyles = 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold';
                        if (isWrong) buttonStyles = 'bg-red-50 border-red-400 text-red-900';

                        return (
                          <button
                            key={optIdx}
                            disabled={isQuizSubmitted}
                            onClick={() => handleSelectAnswer(qIdx, optIdx)}
                            className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all flex items-center justify-between gap-2 ${buttonStyles}`}
                          >
                            <span className="leading-snug">{opt}</span>
                            {isCorrect && <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                            {isWrong && <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>

                    {/* Explanation if submitted */}
                    {isQuizSubmitted && q.explanation && (
                      <div className="ml-4 mt-2 p-2.5 rounded-lg bg-blue-50/60 border border-blue-100 text-[11px] text-slate-600 leading-relaxed">
                        <strong className="text-[#1E60F2] block mb-0.5">Explanation:</strong>
                        {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Quiz Interactive Launch / Submission Footer */}
            <div className="pt-2 space-y-3">
              {!isQuizSubmitted ? (
                <div className="space-y-2">
                  <Button
                    variant="primary"
                    size="md"
                    className="w-full shadow-card"
                    disabled={Object.keys(selectedAnswers).length < activeCourse.quiz.length}
                    onClick={handleSubmitQuiz}
                  >
                    Submit Answers for Evaluation
                  </Button>

                  <Button
                    variant="soft"
                    size="sm"
                    className="w-full"
                    onClick={() => setIsQuizModalOpen(true)}
                  >
                    Launch Interactive Step-by-Step Quiz
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className={`p-4 rounded-[18px] text-center border ${
                    isPassed 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                      : 'bg-red-50 border-red-200 text-red-900'
                  }`}>
                    <div className="text-3xl font-extrabold font-mono tracking-tight">{score}%</div>
                    <div className="text-xs font-bold mt-1">
                      {isPassed 
                        ? '🎉 Passed! You achieved certification standard.' 
                        : 'Score below 80%. Review the module checklist and retry.'
                      }
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      icon={<RotateCcw className="w-3.5 h-3.5" />}
                      onClick={handleResetQuiz}
                    >
                      Retake Quiz
                    </Button>

                    {isPassed && (
                      <Button
                        variant="primary"
                        size="sm"
                        className="flex-1"
                        icon={<Award className="w-3.5 h-3.5 text-white" />}
                        onClick={() => setShowCertificateModal(true)}
                      >
                        Certificate
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Certificate Earned Preview Card */}
          {certIssued && (
            <div className="rounded-[20px] bg-gradient-to-br from-blue-50 to-indigo-50/40 border border-blue-200 p-5 shadow-card space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#1E60F2] text-white flex items-center justify-center shadow-card shrink-0">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <Badge variant="primary" size="sm" className="mb-0.5">
                      Accreditation Earned
                    </Badge>
                    <h4 className="text-sm font-bold text-[#0F172A]">
                      {activeCourse.badge_title}
                    </h4>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Demonstrated adherence to National Disaster Management Authority (NDMA) thermal resilience and community protection protocols.
              </p>

              <div className="pt-1 flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full text-xs"
                  icon={<Award className="w-3.5 h-3.5" />}
                  onClick={() => setShowCertificateModal(true)}
                >
                  View & Print Official Certificate
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* INTERACTIVE QUIZ MODAL (STEPPER EXPERIENCE)                               */}
      {/* ========================================================================= */}
      {isQuizModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] border border-[#E5EDF5] shadow-modal max-w-lg w-full p-6 space-y-5 animate-scale-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#E5EDF5] pb-3.5">
              <div>
                <span className="text-[11px] font-bold text-[#1E60F2] uppercase tracking-wider">
                  Knowledge Evaluation
                </span>
                <h3 className="text-base font-bold text-[#0F172A]">
                  {activeCourse.title}
                </h3>
              </div>
              <button
                onClick={() => setIsQuizModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Step Indicator & Progress */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-[#64748B]">
                <span>Question {currentQuestionIndex + 1} of {activeCourse.quiz.length}</span>
                <span>Passing: 80%+</span>
              </div>
              <div className="w-full bg-[#E5EDF5] h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-[#1E60F2] h-full transition-all duration-300"
                  style={{ width: `${((currentQuestionIndex + 1) / activeCourse.quiz.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Question Details */}
            {activeCourse.quiz[currentQuestionIndex] && (
              <div className="space-y-4 py-1">
                <h4 className="text-sm font-bold text-[#0F172A] leading-snug">
                  {activeCourse.quiz[currentQuestionIndex].question}
                </h4>

                <div className="space-y-2">
                  {activeCourse.quiz[currentQuestionIndex].options.map((opt, optIdx) => {
                    const isSelected = selectedAnswers[currentQuestionIndex] === optIdx;
                    return (
                      <button
                        key={optIdx}
                        onClick={() => handleSelectAnswer(currentQuestionIndex, optIdx)}
                        className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex items-center justify-between gap-2 ${
                          isSelected
                            ? 'bg-blue-50 border-[#1E60F2] text-[#0F172A] font-semibold ring-1 ring-[#1E60F2]'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span>{opt}</span>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-[#1E60F2] bg-[#1E60F2]' : 'border-slate-300 bg-white'
                        }`}>
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Stepper Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-[#E5EDF5]">
              <Button
                variant="outline"
                size="sm"
                disabled={currentQuestionIndex === 0}
                onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
              >
                Previous
              </Button>

              {currentQuestionIndex < activeCourse.quiz.length - 1 ? (
                <Button
                  variant="primary"
                  size="sm"
                  disabled={selectedAnswers[currentQuestionIndex] === undefined}
                  onClick={() => setCurrentQuestionIndex(prev => Math.min(activeCourse.quiz.length - 1, prev + 1))}
                >
                  Next Question
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  disabled={Object.keys(selectedAnswers).length < activeCourse.quiz.length}
                  onClick={() => {
                    handleSubmitQuiz();
                    setIsQuizModalOpen(false);
                  }}
                >
                  Submit & Finish
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CERTIFICATE VIEW MODAL                                                    */}
      {/* ========================================================================= */}
      {showCertificateModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] border border-[#E5EDF5] shadow-modal max-w-2xl w-full p-6 sm:p-8 space-y-6 animate-scale-in relative">
            <button
              onClick={() => setShowCertificateModal(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Official Certificate Border Container */}
            <div className="border-4 border-double border-[#1E60F2]/25 rounded-[20px] p-6 sm:p-8 bg-gradient-to-b from-white via-blue-50/20 to-white text-center space-y-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 transform translate-x-8 -translate-y-8 w-28 h-28 bg-blue-100/40 rounded-full blur-2xl pointer-events-none" />

              {/* Certificate Header */}
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1.5 text-xs font-mono font-bold tracking-widest text-[#1E60F2] uppercase">
                  <ShieldCheck className="w-4 h-4" />
                  <span>HEATSHIELD AI ACCREDITATION</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
                  Certificate of Competency
                </h2>
                <p className="text-xs text-[#64748B]">
                  National Heat Resilience & Community Protection Standard
                </p>
              </div>

              {/* Awarded To */}
              <div className="py-2 space-y-1">
                <span className="text-xs text-[#64748B] uppercase tracking-wider">This is proudly awarded to</span>
                <div className="text-xl sm:text-2xl font-extrabold text-[#1E60F2]">
                  Certified Heat Safety Guardian
                </div>
                <div className="h-0.5 w-40 bg-[#1E60F2]/30 mx-auto mt-1" />
              </div>

              {/* Track Title */}
              <div className="space-y-1.5 max-w-lg mx-auto">
                <p className="text-xs text-slate-600">
                  for successfully completing all accredited curriculum modules and achieving an evaluation score of <strong className="text-[#0F172A]">{score}%</strong> in:
                </p>
                <div className="p-2.5 rounded-xl bg-blue-50/60 border border-blue-100 text-sm font-bold text-[#0F172A]">
                  {activeCourse.badge_title}
                </div>
              </div>

              {/* Credential Details */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-[#E5EDF5] text-left text-xs">
                <div>
                  <span className="text-[10px] text-[#64748B] block uppercase font-mono">Date Issued</span>
                  <strong className="text-[#0F172A]">
                    {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-[#64748B] block uppercase font-mono">Credential ID</span>
                  <strong className="text-[#0F172A] font-mono">
                    HS-ACAD-{activeCourse.id.replace('course-', '').toUpperCase()}-882
                  </strong>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-[#64748B] block uppercase font-mono">Standard</span>
                  <strong className="text-emerald-700">NDMA & WHO Verified</strong>
                </div>
              </div>
            </div>

            {/* Certificate Modal Action Controls */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <Button
                variant="outline"
                size="md"
                icon={<Printer className="w-4 h-4" />}
                onClick={() => window.print()}
              >
                Print Certificate
              </Button>

              <Button
                variant="primary"
                size="md"
                icon={<Download className="w-4 h-4" />}
                onClick={handleDownloadCheatsheet}
              >
                Save Action Sheet
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HeatAcademyPage;
