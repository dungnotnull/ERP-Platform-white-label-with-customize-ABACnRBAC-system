export function normalizeAndValidatePath(inputPath: string): string {
  let path = inputPath.trim();

  if (!path.startsWith('/')) {
    path = '/' + path;
  }

  path = path
    .replace(/^\/api\/v1\//, '/')
    .replace(/^\/api\//, '/')
    .replace(/^\/v1\//, '/')
    .replace(/\/v1\/v1\//g, '/v1/')
    .replace(/\/api\/v1\//g, '/')
    .replace(/\/api\/api\//g, '/api/');

  if (!path.startsWith('/')) {
    path = '/' + path;
  }

  const invalidChars = /[\s]/;
  if (invalidChars.test(path)) {
    throw new Error(`Invalid path: "${inputPath}" contains whitespace characters`);
  }

  return path;
}

export function pathPatternToRegex(pattern: string): string {
  const escaped = pattern
    .replace(/\//g, '\\/')
    .replace(/:[^/]+/g, '[^/]+');
  return `^${escaped}$`;
}
