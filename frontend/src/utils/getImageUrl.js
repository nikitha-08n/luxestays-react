export function getImageUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  
  const baseUrl = import.meta.env.VITE_API_URL || '/api/v1';
  // Strip '/api/v1' from the base URL to get the server root
  const serverRoot = baseUrl.replace(/\/api\/v1\/?$/, '');
  
  // If url doesn't start with a slash, add one
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  
  return `${serverRoot}${cleanUrl}`;
}
