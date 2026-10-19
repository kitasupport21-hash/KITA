export type SalaryPoint = { role: string; min: number; max: number; count: number };

export function buildSalaryIntelligence(rows: Array<{ title: string; salary_min_jt?: number | null; salary_max_jt?: number | null }>): SalaryPoint[] {
  const grouped = new Map<string, { min: number; max: number; count: number }>();
  for (const row of rows) {
    const min = Number(row.salary_min_jt);
    const max = Number(row.salary_max_jt);
    if (!Number.isFinite(min) || !Number.isFinite(max) || max <= 0) continue;
    const role = row.title.trim();
    if (!role) continue;
    const current = grouped.get(role) || { min: Number.POSITIVE_INFINITY, max: 0, count: 0 };
    current.min = Math.min(current.min, min);
    current.max = Math.max(current.max, max);
    current.count += 1;
    grouped.set(role, current);
  }
  return [...grouped.entries()].map(([role, value]) => ({ role, ...value })).sort((a, b) => b.count - a.count).slice(0, 20);
}

export function salaryPosition(minimumSalary: number, point: SalaryPoint) {
  if (!minimumSalary || minimumSalary <= 0) return 'No salary preference set';
  if (minimumSalary <= point.min) return 'Within the lower market range';
  if (minimumSalary <= point.max) return 'Within the observed market range';
  return 'Above the observed market range';
}
