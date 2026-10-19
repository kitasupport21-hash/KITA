export const careerSignals = [
  { key: 'skills', label: 'Skill fit', weight: 45 },
  { key: 'mode', label: 'Work mode', weight: 15 },
  { key: 'location', label: 'Location', weight: 12 },
  { key: 'seniority', label: 'Career level', weight: 18 },
  { key: 'salary', label: 'Salary fit', weight: 10 },
] as const;

export const skillClusters = {
  Technology: ['React', 'TypeScript', 'Python', 'SQL', 'Cloud', 'DevOps'],
  Design: ['Figma', 'Product', 'UX', 'UI', 'Research'],
  Business: ['Growth', 'B2C', 'Sales', 'Operations', 'Strategy'],
  Communication: ['Support', 'Communication', 'Writing', 'Customer Success'],
} as const;

export const careerPath = [
  { level: 'Level 0', title: 'Explore', description: 'Build foundational skills and discover suitable career families.' },
  { level: 'Beginner', title: 'Start', description: 'Land your first role and establish practical experience.' },
  { level: 'Junior', title: 'Build', description: 'Develop depth in a role and collect measurable outcomes.' },
  { level: 'Mid', title: 'Specialize', description: 'Own projects, mentor peers and deepen your domain expertise.' },
  { level: 'Senior', title: 'Lead work', description: 'Drive complex outcomes and become a trusted specialist.' },
  { level: 'Lead', title: 'Lead teams', description: 'Own a function, coach people and influence business direction.' },
  { level: 'Advanced', title: 'Scale', description: 'Shape strategy, organizations and high-impact systems.' },
] as const;
