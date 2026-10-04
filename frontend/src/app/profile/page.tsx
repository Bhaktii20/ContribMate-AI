'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveUserProfile } from '@/lib/api';
import { Compass, Check, ArrowRight, Code2, Clock, Sparkles } from 'lucide-react';

const SKILL_OPTIONS = ['Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'React', 'Node.js', 'Machine Learning', 'AI', 'Data Science', 'DevOps', 'Cybersecurity'];
const INTEREST_OPTIONS = ['AI/ML', 'Web Development', 'Cybersecurity', 'Cloud', 'Data Science', 'Developer Tools', 'Education', 'Open Source'];
const TIME_OPTIONS = ['1-2 hours', '2-4 hours', '4-8 hours', '8+ hours'];
const DIFFICULTY_OPTIONS = ['Beginner', 'Intermediate', 'Advanced'];
const TYPE_OPTIONS = ['Bug Fix', 'Documentation', 'Feature', 'Testing', 'Refactoring', 'UI/UX', 'Developer Tools'];

export default function ProfilePage() {
  const router = useRouter();
  const [experience, setExperience] = useState('Beginner');
  const [selectedSkills, setSelectedSkills] = useState<string[]>(['Python', 'AI']);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(['AI/ML', 'Web Development']);
  const [availableTime, setAvailableTime] = useState('2-4 hours');
  const [preferredDifficulty, setPreferredDifficulty] = useState('Beginner');
  const [contributionTypes, setContributionTypes] = useState<string[]>(['Bug Fix', 'Documentation']);
  const [loading, setLoading] = useState(false);

  const toggleItem = (list: string[], setList: (val: string[]) => void, item: string) => {
    if (list.includes(item)) {
      setList(list.filter((i) => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const sessionId = 'session-' + Date.now();
      await saveUserProfile({
        session_id: sessionId,
        experience: experience as any,
        skills: selectedSkills,
        interests: selectedInterests,
        available_time: availableTime as any,
        preferred_difficulty: preferredDifficulty as any,
        contribution_types: contributionTypes
      });

      // Save to localStorage for client access across views
      localStorage.setItem('contribmate_profile', JSON.stringify({
        session_id: sessionId,
        experience,
        skills: selectedSkills,
        interests: selectedInterests,
        available_time: availableTime,
        preferred_difficulty: preferredDifficulty
      }));

      router.push('/discover');
    } catch (err) {
      console.error(err);
      router.push('/discover');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 text-center space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-xs font-semibold text-emerald-400">
          <Compass className="h-3.5 w-3.5" /> Step 1: Create Your Profile
        </div>
        <h1 className="text-3xl font-extrabold text-white">Tell us about your background</h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
          ContribMate AI uses your experience and skills to calculate personalized repository match scores.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 backdrop-blur-sm shadow-xl">
        {/* Experience Level */}
        <div className="space-y-3">
          <label className="text-sm font-bold text-white block">1. What is your coding experience level?</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {DIFFICULTY_OPTIONS.map((exp) => (
              <button
                key={exp}
                type="button"
                onClick={() => setExperience(exp)}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border text-xs font-semibold transition-all ${
                  experience === exp
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-md'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700 hover:text-white'
                }`}
              >
                <span>{exp}</span>
                <span className="text-[10px] text-slate-500 mt-1">
                  {exp === 'Beginner' ? '0–1 years coding' : exp === 'Intermediate' ? '1–3 years coding' : '3+ years coding'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Technical Skills */}
        <div className="space-y-3">
          <label className="text-sm font-bold text-white block flex items-center justify-between">
            <span>2. Technical Skills (Select all that apply)</span>
            <span className="text-xs text-slate-500 font-normal">{selectedSkills.length} selected</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {SKILL_OPTIONS.map((skill) => {
              const isSelected = selectedSkills.includes(skill);
              return (
                <button
                  key={skill}
                  type="button"
                  onClick={() => toggleItem(selectedSkills, setSelectedSkills, skill)}
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  {isSelected && <Check className="h-3 w-3 text-indigo-400" />}
                  <span>{skill}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Domain Interests */}
        <div className="space-y-3">
          <label className="text-sm font-bold text-white block flex items-center justify-between">
            <span>3. Domain Interests</span>
            <span className="text-xs text-slate-500 font-normal">{selectedInterests.length} selected</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {INTEREST_OPTIONS.map((interest) => {
              const isSelected = selectedInterests.includes(interest);
              return (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleItem(selectedInterests, setSelectedInterests, interest)}
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                    isSelected
                      ? 'border-purple-500 bg-purple-500/20 text-purple-300'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  {isSelected && <Check className="h-3 w-3 text-purple-400" />}
                  <span>{interest}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Available Time & Preferred Difficulty */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className="text-sm font-bold text-white block flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-amber-400" /> 4. Available Time
            </label>
            <select
              value={availableTime}
              onChange={(e) => setAvailableTime(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
            >
              {TIME_OPTIONS.map((time) => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-bold text-white block">5. Target Issue Difficulty</label>
            <select
              value={preferredDifficulty}
              onChange={(e) => setPreferredDifficulty(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
            >
              {DIFFICULTY_OPTIONS.map((diff) => (
                <option key={diff} value={diff}>{diff}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Preferred Contribution Types */}
        <div className="space-y-3">
          <label className="text-sm font-bold text-white block">6. Preferred Contribution Types (Optional)</label>
          <div className="flex flex-wrap gap-2">
            {TYPE_OPTIONS.map((t) => {
              const isSelected = contributionTypes.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleItem(contributionTypes, setContributionTypes, t)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-600 px-8 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-600/20 hover:scale-[1.02] active:scale-95 transition-all"
          >
            <span>Discover Recommended Repositories</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
