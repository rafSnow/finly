export async function GET() {
  return new Response(JSON.stringify({ message: 'Export API — Em breve' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
