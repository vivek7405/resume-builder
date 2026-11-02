import type { RouteHandlerContext } from '@webjsdev/core';
import { getResume } from '#modules/resumes/queries/get-resume.server.ts';

/** The resume as a JSON file download. A route handler returns a Response and never throws notFound(). */
export async function GET(_req: Request, { params }: RouteHandlerContext<'/resumes/[id]/export'>) {
  const resume = await getResume(params.id);
  if (!resume) return new Response('Not found', { status: 404 });
  const { id: _id, createdAt: _c, updatedAt: _u, ...doc } = resume;
  const name = resume.title.replace(/[^\w.-]+/g, '-').replace(/^-+|-+$/g, '') || 'resume';
  return new Response(JSON.stringify(doc, null, 2), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'content-disposition': `attachment; filename="${name}.json"`,
      'cache-control': 'no-store',
    },
  });
}
