import {
  DEFAULT_PUBLICATION_MODE,
  FORBIDDEN_PUBLIC_OWNERSHIP_FIELDS,
  type EditorialPrinciple,
  type IdentityModeExplanation,
  type PublicationIdentityMode,
} from '@/domain/models/identity';

export function resolvePublicationMode(
  requested?: string | null,
): PublicationIdentityMode {
  if (requested === 'alias') {
    return 'alias';
  }
  return DEFAULT_PUBLICATION_MODE;
}

export function getPublicAuthorLabel(
  mode: PublicationIdentityMode,
  aliasName?: string | null,
): string {
  if (mode === 'anonymous') {
    return 'Anonim';
  }

  const trimmed = aliasName?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : 'Anonim';
}

export function isAliasReuseWarningRequired(mode: PublicationIdentityMode): boolean {
  return mode === 'alias';
}

export function getIdentityModeExplanation(
  mode: PublicationIdentityMode,
): IdentityModeExplanation {
  if (mode === 'alias') {
    return {
      mode: 'alias',
      label: 'Alias Samaran (Opsional)',
      publicAttributionExample: 'Diterbitkan sebagai: Senja Kelabu',
      isolationGuarantee:
        'Identitas akun internal, email, dan tulisan berstatus Anonim tetap terputus total dari alias ini dan tidak pernah terekspos ke publik.',
      authorNotice:
        'Catatan penulis: Pemakaian ulang alias yang sama memungkinkan pembaca mengenali keterkaitan antar-tulisan di bawah alias tersebut.',
    };
  }

  return {
    mode: 'anonymous',
    label: 'Anonim (Default)',
    publicAttributionExample: 'Diterbitkan sebagai: Anonim',
    isolationGuarantee:
      'Setiap tulisan Anonim tidak memiliki token korelasi publik. Dua tulisan Anonim dari akun yang sama tidak dapat dihubungkan oleh pembaca maupun API publik.',
    authorNotice:
      'Mode bawaan UNSAID: tulisan terbit tanpa nama pena maupun tautan ke persona lain.',
  };
}

export function assertPublicPayloadSanitized(
  payload: Record<string, unknown>,
): void {
  for (const field of FORBIDDEN_PUBLIC_OWNERSHIP_FIELDS) {
    if (field in payload) {
      throw new Error(
        `Pelanggaran isolasi privasi: field "${field}" dilarang berada pada payload publik.`,
      );
    }
  }
}

export const CORE_EDITORIAL_PRINCIPLES: readonly EditorialPrinciple[] = [
  {
    index: '01',
    title: 'Kebebasan Berekspresi',
    description:
      'Ruang aman bagi puisi, esai, kritik konstruktif, dan pemikiran independen tanpa tekanan identitas asli.',
  },
  {
    index: '02',
    title: 'Anonimitas by Design',
    description:
      'Pemisahan struktural antara kepemilikan akun internal dengan identitas publik yang tampil di halaman baca.',
  },
  {
    index: '03',
    title: 'Tanpa Metrik Popularitas',
    description:
      'Tidak ada sistem pengikut, peringkat popularitas, atau halaman profil publik yang menghimpun jejak penulis.',
  },
];
