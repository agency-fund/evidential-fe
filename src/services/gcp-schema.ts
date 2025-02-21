import { z } from 'zod';

export const gcpServiceAccountSchema = z.object({
  type: z.literal('service_account'),
  project_id: z.string().min(1, 'Project ID cannot be empty'),
  private_key_id: z.string(),
  private_key: z.string().startsWith('-----BEGIN PRIVATE KEY-----').endsWith('-----END PRIVATE KEY-----'),
  client_email: z.string().email(),
  client_id: z.string(),
  auth_uri: z.string().url(),
  token_uri: z.string().url(),
  auth_provider_x509_cert_url: z.string().url(),
  client_x509_cert_url: z.string().url(),
});

export type GcpServiceAccount = z.infer<typeof gcpServiceAccountSchema>;
