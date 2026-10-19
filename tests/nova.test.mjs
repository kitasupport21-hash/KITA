import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateMatch, detectRiskSignals } from '../src/lib/novaEngine.ts';
import { parseCvText, supportedCvTextType } from '../src/lib/novaCv.ts';

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
