import { CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react';
import { VerificationStatus } from '../lib/types';

interface TrustTagProps {
  status: VerificationStatus | string;
  label?: string;
}

export default function TrustTag({ status, label }: TrustTagProps) {
  const normalized = status.toUpperCase();

  if (normalized.includes('VERIFIED')) {
    return (
      <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400 border border-emerald-500/30">
        <CheckCircle2 className="h-3 w-3" />
        {label || '✓ VERIFIED'}
      </span>
    );
  }

  if (normalized.includes('LIKELY') || normalized.includes('INFERRED')) {
    return (
      <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400 border border-amber-500/30">
        <AlertTriangle className="h-3 w-3" />
        {label || '⚠ LIKELY'}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-400 border border-slate-700">
      <HelpCircle className="h-3 w-3" />
      {label || '? NEEDS VERIFICATION'}
    </span>
  );
}
