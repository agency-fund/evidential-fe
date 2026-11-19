const ORGANIZATION_NAME_SUFFIX = "'s Organization";
const MAX_LENGTH_OF_NAME_VALUE = 100;

/**
 * The name we suggest for a user's first organization: "<username>'s Organization", where the username is the part of
 * their email address before the @. Mirrors default_organization_name() in the API server.
 */
export const defaultOrganizationName = (email: string): string => {
  const at = email.lastIndexOf('@');
  const username = at === -1 ? email : email.slice(0, at);
  return username.slice(0, MAX_LENGTH_OF_NAME_VALUE - ORGANIZATION_NAME_SUFFIX.length) + ORGANIZATION_NAME_SUFFIX;
};
