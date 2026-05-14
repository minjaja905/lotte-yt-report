export const config = { matcher: ['/', '/comments', '/comments.html'] };

export default function middleware(req) {
  const auth = req.headers.get('authorization');
  const pw = process.env.REPORT_PASSWORD || '0905';
  const expected = 'Basic ' + btoa('yt:' + pw);

  if (auth !== expected) {
    return new Response('Unauthorized', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Giants TV Report"' },
    });
  }
}
