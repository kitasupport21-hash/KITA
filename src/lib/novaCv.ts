export type ParsedCv = {
  fullName: string | null;
  email: string | null;
  phone: string | null;
  skills: string[];
  experience: string[];
  education: string[];
  sourceTextLength: number;
};

const SKILL_ALIASES: Record<string, string> = {
  javascript: 'JavaScript', typescript: 'TypeScript', react: 'React', 'react.js': 'React', node: 'Node.js', 'node.js': 'Node.js',
  python: 'Python', java: 'Java', sql: 'SQL', excel: 'Excel', 'power bi': 'Power BI', tableau: 'Tableau',
  figma: 'Figma', 'machine learning': 'Machine Learning', 'data analysis': 'Data Analysis', 'project management': 'Project Management',
  marketing: 'Marketing', sales: 'Sales', communication: 'Communication', leadership: 'Leadership', aws: 'AWS', docker: 'Docker', git: 'Git'
};

const normalize = (text: string) => text.replace(/\r/g, '').replace(/[\t ]+/g, ' ').trim();
const section = (text: string, names: string[]) => {
  const lines = text.split('\n');
  const start = lines.findIndex(line => names.some(name => line.trim().toLowerCase() === name));
  if (start < 0) return [];
  const result: string[] = [];
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    if (/^(skills?|technical skills|experience|work experience|employment|education|projects?|certifications?|summary|profile)$/i.test(line)) break;
    result.push(line);
    if (result.length >= 20) break;
  }
  return result;
};

export function parseCvText(input: string): ParsedCv {
  const text = normalize(input);
  const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || null;
  const phone = text.match(/(?:\+?62|0)\s?\d(?:[\s-]?\d){8,13}/)?.[0] || null;
  const firstLines = text.split('\n').map(x => x.trim()).filter(Boolean).slice(0, 8);
  const fullName = firstLines.find(line => !line.includes('@') && !/^\+?\d/.test(line) && line.length >= 3 && line.length <= 80) || null;
  const lower = text.toLowerCase();
  const skills = Object.entries(SKILL_ALIASES).filter(([key]) => new RegExp(`(^|[^a-z0-9])${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=[^a-z0-9]|$)`, 'i').test(lower)).map(([, value]) => value);
  const experience = section(text, ['experience', 'work experience', 'employment']);
  const education = section(text, ['education', 'academic background']);
  return { fullName, email, phone, skills: [...new Set(skills)], experience, education, sourceTextLength: text.length };
}

export function supportedCvTextType(type: string, name: string) {
  const extension = name.toLowerCase().split('.').pop();
  return type === 'text/plain' || extension === 'txt' || extension === 'md';
}
