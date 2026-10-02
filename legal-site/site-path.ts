const publicBasePath = process.env.NEXT_PUBLIC_SITE_BASE_PATH ?? '';

export function sitePath(pathname: string): string {
  if (!pathname.startsWith('/')) return pathname;
  return `${publicBasePath}${pathname}` || '/';
}
