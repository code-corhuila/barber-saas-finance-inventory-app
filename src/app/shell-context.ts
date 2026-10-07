import { ActivatedRouteSnapshot } from '@angular/router';

/**
 * The contract between the Angular shell (`barber-saas-front`) and every Ionic Angular domain app
 * (ADR-013). Copied, never imported: the same types as the shell's `core/remotes/shell-context.ts`.
 *
 * An Ionic Angular domain app exposes its routes as './routes'. The shell loads them under its own
 * path with `data: { shell: ShellContext }`, so they run in the shell's injector:
 * - requests go through Angular's HttpClient to '/api/...': the shell's interceptor adds the
 *   gateway, the token, X-Correlation-Id, the timeout and the error shape. Never provide another
 *   HttpClient and never store a token;
 * - the session and cross-domain navigation come from the ShellContext below.
 */
export interface SessionUser {
  id: string;
  fullName: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN_BARBERSHOP' | 'BARBER' | 'CLIENT';
  barbershopId: string | null;
}

export interface ShellSession {
  user(): SessionUser | null;
  /** Called with the new user (or null) every time the session changes; returns an unsubscribe. */
  subscribe(listener: (user: SessionUser | null) => void): () => void;
  /** A CLIENT's token bound to the barbershop they picked (DEC-AUTH-06); staff resolve at once. */
  enterBarbershop(barbershopId: string): Promise<void>;
  /** Staff: their own barbershop. Client: the one entered, while its token is valid. */
  barbershopId(): string | null;
  signOut(): void;
}

export interface ShellContext {
  session: ShellSession;
  /** Navigate anywhere in the app, e.g. navigate('/appointments'). */
  navigate(path: string): void;
}

/** The error every failed '/api/...' request becomes in the shell's interceptor (annex H). */
export interface ApiError {
  status: number;
  code: string;
  message: string;
  details: { field: string; message: string }[];
  traceId: string;
  /** The message a person sees, already decided by the shell. */
  userMessage: string;
}

/** The ShellContext the shell put on this domain's route, found from any route below it. */
export function shellContext(route: ActivatedRouteSnapshot): ShellContext | null {
  for (const r of route.pathFromRoot) {
    const shell = r.data['shell'] as ShellContext | undefined;
    if (shell) return shell;
  }
  return null;
}

/** The message to show for anything a request rejected with. */
export function userMessage(err: unknown): string {
  const e = err as Partial<ApiError> | null;
  return e?.userMessage ?? 'No se pudo completar la operación. Intenta de nuevo.';
}
