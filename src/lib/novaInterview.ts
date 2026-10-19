export type InterviewQuestion = {
  id: string;
  prompt: string;
  competency: 'technical' | 'behavioral' | 'role-fit' | 'problem-solving';
  guidance: string;
};

export type InterviewEvaluation = {
  score: number;
  strengths: string[];
  improvements: string[];
  detectedSignals: string[];
};

export function buildInterviewQuestions(role: string, skills: string[], level = 'Junior'): InterviewQuestion[] {
  const skill = skills[0] || 'the main skill required for this role';
  return [
    { id: 'motivation', prompt: `Why are you interested in the ${role} role, and what value would you bring?`, competency: 'role-fit', guidance: 'Connect your experience, motivation and the employer problem you can solve.' },
    { id: 'experience', prompt: `Tell us about a project where you used ${skill}. What did you personally deliver?`, competency: 'technical', guidance: 'Use a concrete project and separate your contribution from the team result.' },
    { id: 'problem', prompt: `Describe a difficult problem you faced at ${level} level and how you solved it.`, competency: 'problem-solving', guidance: 'Explain the situation, your reasoning, action and measurable result.' },
    { id: 'behavior', prompt: 'Tell us about a time you received difficult feedback. What did you change afterward?', competency: 'behavioral', guidance: 'Show ownership, reflection and a specific improvement.' },
    { id: 'tradeoff', prompt: 'When two important tasks compete for your time, how do you decide what to do first?', competency: 'problem-solving', guidance: 'Explain how you assess urgency, impact, dependencies and communicate trade-offs.' }
  ];
}

export function evaluateInterviewAnswer(answer: string, question: InterviewQuestion): InterviewEvaluation {
  const text = answer.trim();
  const lower = text.toLowerCase();
  const strengths: string[] = [];
  const improvements: string[] = [];
  const detectedSignals: string[] = [];
  if (text.length >= 120) strengths.push('The answer contains enough detail to evaluate your reasoning.');
  else improvements.push('Add a specific example and more context.');
  if (/i (built|led|designed|implemented|solved|created|improved|managed|delivered)/i.test(text)) strengths.push('You clearly describe personal ownership.');
  else improvements.push('Use more “I” statements to make your individual contribution clear.');
  if (/(result|impact|improved|increased|reduced|saved|achieved|%|metric)/i.test(lower)) strengths.push('You include an outcome or impact signal.');
  else improvements.push('Finish with a measurable or observable result where possible.');
  if (/(situation|when|project|example|previously|experience)/i.test(lower)) strengths.push('You anchor the response in an example.');
  else improvements.push('Ground the answer in one real situation rather than general statements.');
  if (/^(yes|no|maybe|idk|i don't know)\.?$/i.test(text)) detectedSignals.push('very_short_answer');
  const score = Math.max(0, Math.min(100, 40 + (text.length >= 120 ? 20 : 0) + (strengths.length * 10) - (improvements.length * 5)));
  return { score, strengths, improvements, detectedSignals };
}
