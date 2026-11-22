import { describe, expect, it } from 'vitest';
import {
  assertPublicPayloadSanitized,
  getIdentityModeExplanation,
  getPublicAuthorLabel,
  isAliasReuseWarningRequired,
  resolvePublicationMode,
} from '@/domain/logic/identity-rules';

describe('Aturan Domain Identitas UNSAID', () => {
  it('menjadikan mode anonymous sebagai bawaan saat mode tidak ditentukan', () => {
    expect(resolvePublicationMode()).toBe('anonymous');
    expect(resolvePublicationMode(null)).toBe('anonymous');
    expect(resolvePublicationMode('unknown')).toBe('anonymous');
    expect(resolvePublicationMode('alias')).toBe('alias');
  });

  it('menampilkan label publik Anonim untuk mode bawaan dan nama alias saat alias dipilih', () => {
    expect(getPublicAuthorLabel('anonymous', 'Nama Rahasia')).toBe('Anonim');
    expect(getPublicAuthorLabel('alias', '  Senja Kelabu  ')).toBe('Senja Kelabu');
    expect(getPublicAuthorLabel('alias', '   ')).toBe('Anonim');
  });

  it('mewajibkan peringatan pemakaian ulang hanya pada mode alias', () => {
    expect(isAliasReuseWarningRequired('anonymous')).toBe(false);
    expect(isAliasReuseWarningRequired('alias')).toBe(true);
    expect(getIdentityModeExplanation('anonymous').publicAttributionExample).toContain(
      'Anonim',
    );
    expect(getIdentityModeExplanation('alias').authorNotice).toContain('Pemakaian ulang');
  });

  it('menolak field kepemilikan privat di dalam payload publik', () => {
    expect(() =>
      assertPublicPayloadSanitized({
        id: 'post-1',
        title: 'Catatan Malam',
        author_label: 'Anonim',
      }),
    ).not.toThrow();

    expect(() =>
      assertPublicPayloadSanitized({
        id: 'post-1',
        owner_user_id: 'user-123',
      }),
    ).toThrow(/Pelanggaran isolasi privasi/);
  });
});
