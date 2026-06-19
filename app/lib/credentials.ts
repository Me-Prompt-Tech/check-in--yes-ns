/**
 * In-memory credentials store.
 * Passwords persist for the lifetime of the Node.js server process.
 * For production, replace with a real database.
 */

export interface CredentialsStore {
  admin: { username: string; password: string; displayName: string };
  employee: { username: string; password: string; displayName: string };
}

// Module-level singleton — survives across requests in the same process.
const credentials: CredentialsStore = {
  admin: { username: 'admin', password: 'password', displayName: 'Administrator' },
  employee: { username: 'employee', password: 'password', displayName: 'Employee User' },
};

export function getCredentials(): CredentialsStore {
  return credentials;
}

export function updatePassword(
  role: 'admin' | 'employee',
  newPassword: string,
): void {
  credentials[role].password = newPassword;
}
