import type { UserRole } from "./types";

// Admins and super users use the same admin screens.
export const isAdminRole = (role: UserRole | undefined | null) => role === "Admin" || role === "SuperUser";

/** Where each kind of user lands after signing in. */
export const homeFor = (role: UserRole) => (isAdminRole(role) ? "/admin/dashboard" : "/seller/dashboard");
