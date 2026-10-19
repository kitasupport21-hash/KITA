import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateMatch, detectRiskSignals } from '../src/lib/novaEngine.ts';
import { parseCvText, supportedCvTextType } from '../src/lib/novaCv.ts';
import { regencyMatchesCity, filterRegenciesForProvince } from '../src/lib/indonesiaRegions.ts';

test('career match scoring stays in range and explains gaps', () => {
  const result = calculateMatch({
    skills: ['React', 'TypeScript'], preferredModes: ['Remote'],
    preferredProvinces: ['DKI Jakarta'], targetLevels: ['Junior'], minimumSalaryJt: 8
  }, {
    title: 'Frontend Developer', tags: ['React'], mode: 'Remote',
    province: 'DKI Jakarta', level: 'Junior', salary: 'Rp 5–7 jt'
  });
  assert.ok(result.overall >= 0 && result.overall <= 100);
  assert.equal(result.skills, 50);
  assert.deepEqual(result.gaps, ['typescript']);
  assert.ok(result.reasons.length >= 3);
});

test('fraud detection flags suspicious upfront payment and OTP requests', () => {
  const signals = detectRiskSignals('Please transfer a registration fee before interview and send OTP to recruiter');
  assert.ok(signals.includes('upfront payment'));
  assert.ok(signals.includes('unusual identity request'));
});

test('CV text parser extracts contact details and recognized skills', () => {
  const parsed = parseCvText('Dewi Lestari\ndewi@example.id\n+62 812-3456-7890\nSkills\nReact, TypeScript, SQL\nExperience\nFrontend intern');
  assert.equal(parsed.fullName, 'Dewi Lestari');
  assert.equal(parsed.email, 'dewi@example.id');
  assert.ok(parsed.skills.includes('React'));
  assert.ok(parsed.skills.includes('TypeScript'));
  assert.equal(parsed.sourceTextLength > 20, true);
});

test('CV upload type gate does not pretend PDF/DOCX extraction exists', () => {
  assert.equal(supportedCvTextType('text/plain', 'cv.txt'), true);
  assert.equal(supportedCvTextType('', 'cv.md'), true);
  assert.equal(supportedCvTextType('application/pdf', 'cv.pdf'), false);
  assert.equal(supportedCvTextType('', 'cv.docx'), false);
});

test('Indonesia location reference contains all provinces and regencies with valid parent links', async () => {
  const { readFile } = await import('node:fs/promises');
  const provinces = JSON.parse(await readFile(new URL('../src/data/indonesia-provinces.json', import.meta.url), 'utf8'));
  const regencies = [];
  for (const part of [1, 2, 3]) regencies.push(...JSON.parse(await readFile(new URL(`../src/data/indonesia-regencies-${part}.json`, import.meta.url), 'utf8')));
  assert.equal(provinces.length, 38);
  assert.equal(regencies.length, 514);
  const provinceIds = new Set(provinces.map((item) => item.id));
  assert.ok(regencies.every((item) => provinceIds.has(item.provinceId)));
  assert.equal(new Set(regencies.map((item) => item.id)).size, 514);
});

test('district matching tolerates common Indonesian city-name prefixes', () => {
  assert.equal(regencyMatchesCity('Kota Administrasi Jakarta Selatan', 'KOTA ADM. JAKARTA SELATAN'), true);
  assert.equal(regencyMatchesCity('Kota Administrasi Jakarta Selatan', 'Jakarta Selatan'), true);
  assert.equal(regencyMatchesCity('Kabupaten Solok Selatan', 'KAB. SOLOK SELATAN'), true);
  assert.equal(regencyMatchesCity('Kota Bandung', 'KABUPATEN BANDUNG'), false);
  assert.equal(filterRegenciesForProvince('DKI Jakarta').length, 6);
  assert.equal(filterRegenciesForProvince('All Indonesia').length, 514);
});
