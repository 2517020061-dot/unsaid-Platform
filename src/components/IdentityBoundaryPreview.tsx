import { useState } from 'react';
import {
  getIdentityModeExplanation,
  getPublicAuthorLabel,
  isAliasReuseWarningRequired,
} from '@/domain/logic/identity-rules';
import {
  DEFAULT_PUBLICATION_MODE,
  type PublicationIdentityMode,
} from '@/domain/models/identity';

export default function IdentityBoundaryPreview() {
  const [mode, setMode] = useState<PublicationIdentityMode>(DEFAULT_PUBLICATION_MODE);
  const explanation = getIdentityModeExplanation(mode);
  const sampleLabel = getPublicAuthorLabel(
    mode,
    mode === 'alias' ? 'Senja Kelabu' : null,
  );
  const showAliasNotice = isAliasReuseWarningRequired(mode);

  return (
    <div className="border border-neutral-200 bg-white p-6 sm:p-10">
      <div className="flex flex-col gap-6 border-b border-neutral-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs tracking-widest uppercase text-neutral-500">
            Simulasi Batas Identitas Publik
          </p>
          <h3 className="font-serif text-2xl font-medium text-neutral-950">
            {explanation.label}
          </h3>
        </div>

        <div
          role="group"
          aria-label="Pilih mode publikasi"
          className="inline-flex border border-neutral-200 bg-neutral-50 p-1 self-start sm:self-auto"
        >
          <button
            type="button"
            aria-pressed={mode === 'anonymous'}
            onClick={() => setMode('anonymous')}
            className={`px-4 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 ${
              mode === 'anonymous'
                ? 'bg-neutral-950 text-white'
                : 'text-neutral-600 hover:text-neutral-950'
            }`}
          >
            Anonim (Default)
          </button>
          <button
            type="button"
            aria-pressed={mode === 'alias'}
            onClick={() => setMode('alias')}
            className={`px-4 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 ${
              mode === 'alias'
                ? 'bg-neutral-950 text-white'
                : 'text-neutral-600 hover:text-neutral-950'
            }`}
          >
            Alias Samaran
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-8 md:grid-cols-2">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-widest text-neutral-500">
            Atribusi pada Halaman Publik
          </p>
          <p
            data-testid="public-attribution-label"
            className="font-serif text-xl text-neutral-950"
          >
            Diterbitkan sebagai: {sampleLabel}
          </p>
          <p className="text-sm leading-relaxed text-neutral-600">
            {explanation.isolationGuarantee}
          </p>
        </div>

        <div className="space-y-3 border-t border-neutral-200 pt-6 md:border-t-0 md:border-l md:pt-0 md:pl-8">
          <p className="text-xs uppercase tracking-widest text-neutral-500">
            Transparansi Penulis
          </p>
          <p className="text-sm leading-relaxed text-neutral-800">
            {explanation.authorNotice}
          </p>
          <p className="text-xs leading-relaxed text-neutral-500">
            {showAliasNotice
              ? 'Peringatan alias aktif: penggunaan ulang nama alias dapat dikenali pembaca lintas tulisan, namun akun tetap privat.'
              : 'Tidak ada tautan persona publik. Setiap tulisan Anonim terisolasi secara struktural.'}
          </p>
        </div>
      </div>
    </div>
  );
}
