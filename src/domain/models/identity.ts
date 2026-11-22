export type PublicationIdentityMode = 'anonymous' | 'alias';

export const DEFAULT_PUBLICATION_MODE: PublicationIdentityMode = 'anonymous';

export const FORBIDDEN_PUBLIC_OWNERSHIP_FIELDS = [
  'owner_user_id',
  'author_user_id',
  'user_id',
  'email',
  'ip_address',
  'public_author_id',
] as const;

export interface IdentityModeExplanation {
  mode: PublicationIdentityMode;
  label: string;
  publicAttributionExample: string;
  isolationGuarantee: string;
  authorNotice: string;
}

export interface EditorialPrinciple {
  index: string;
  title: string;
  description: string;
}
