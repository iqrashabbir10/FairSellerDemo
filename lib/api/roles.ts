import type { UserRole } from "./types";

// Admins and super users use the same admin screens.
export const isAdminRole = (role: UserRole | undefined | null) => role === "Admin" || role === "SuperUser";

/** Where each kind of user lands after signing in. */
export const homeFor = (role: UserRole) => (isAdminRole(role) ? "/admin/dashboard" : "/seller/dashboard");

/** Which login page each kind of user signs in on (and is sent back to on logout / a session problem). */
export const loginFor = (role: UserRole | undefined | null) => (isAdminRole(role) ? "/auth/admin" : "/");
