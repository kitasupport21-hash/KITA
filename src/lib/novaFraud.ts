export type FraudSignal = {
  code: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
};

export function analyzeJobSafety(input: {
  title?: string;
  company?: string;
  description?: string;
  applyUrl?: string;
  verified?: boolean;
}): FraudSignal[] {
  const text = `${input.title || ''} ${input.company || ''} ${input.description || ''}`.toLowerCase();
  const signals: FraudSignal[] = [];
  const add = (code: string, severity: FraudSignal['severity'], message: string) => signals.push({ code, severity, message });

  if (/bayar|biaya admin|deposit|transfer.*rekening|uang muka|fee pendaftaran/.test(text)) {
    add('upfront_payment', 'high', 'The listing appears to request money or a payment before employment.');
  }
  if (/jaminan.*gaji|penghasilan.*pasti|guaranteed.*income|100%.*diterima/.test(text)) {
    add('guaranteed_income', 'medium', 'The listing makes an unusually strong guarantee about income or acceptance.');
  }
  if (/otp|pin|password|kode verifikasi|cvv/.test(text)) {
    add('credential_request', 'high', 'The listing text appears to request sensitive authentication information.');
  }
  if (!input.verified) {
    add('unverified_employer', 'medium', 'The employer has not been verified by NOVA.');
  }
  if (input.applyUrl && !/^https:\/\//i.test(input.applyUrl)) {
    add('insecure_apply_url', 'high', 'The application URL does not use HTTPS.');
  }
  return signals;
}

export function fraudRiskLevel(signals: FraudSignal[]): 'clear' | 'review' | 'high-risk' {
  if (signals.some((signal) => signal.severity === 'high')) return 'high-risk';
  if (signals.some((signal) => signal.severity === 'medium')) return 'review';
  return 'clear';
}
