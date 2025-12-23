function getContentType(filePath: string): string {
	const extension = filePath.split('.').pop()?.toLowerCase() || '';

	const contentTypes: Record<string, string> = {
		html: 'text/html; charset=utf-8',
		htm: 'text/html; charset=utf-8',
		css: 'text/css; charset=utf-8',
		js: 'application/javascript; charset=utf-8',
		mjs: 'application/javascript; charset=utf-8',
		json: 'application/json; charset=utf-8',
		png: 'image/png',
		jpg: 'image/jpeg',
		jpeg: 'image/jpeg',
		gif: 'image/gif',
		svg: 'image/svg+xml',
		webp: 'image/webp',
		ico: 'image/x-icon',
		woff: 'font/woff',
		woff2: 'font/woff2',
		ttf: 'font/ttf',
		otf: 'font/otf',
		eot: 'application/vnd.ms-fontobject',
		pdf: 'application/pdf',
		xml: 'application/xml',
		txt: 'text/plain; charset=utf-8',
		webmanifest: 'application/manifest+json',
	};

	return contentTypes[extension] || 'application/octet-stream';
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);
		const hostname = url.hostname;
		const pathname = url.pathname;

		const parts = hostname.split('.');

		if (parts.length === 2) {
			return new Response('Root domain - no site attached', {
				status: 200,
			});
		}

		const subdomain = parts[0];

		// Normalize path
		let filePath = pathname === '/' ? '/index.html' : pathname;

		let r2Key = `${subdomain}${filePath}`;
		console.log('r2Key', r2Key);
		let object = await env.BUCKET.get(r2Key);
		console.log('object', object);

		if (!object && !filePath.includes('.')) {
			filePath = '/index.html';
			r2Key = `${subdomain}${filePath}`;
			object = await env.BUCKET.get(r2Key);
		}
		console.log('object', JSON.stringify(object, null, 2));

		if (!object) {
			return new Response('Not Found', { status: 404 });
		}
		const headers = new Headers();

		const detectedType = getContentType(filePath);
		const contentType = detectedType !== 'application/octet-stream' ? detectedType : object.httpMetadata?.contentType || detectedType;
		headers.set('Content-Type', contentType);

		headers.set('etag', object.httpEtag);
		headers.delete('Content-Disposition');
		headers.set('Content-Disposition', 'inline');

		headers.set('Cache-Control', 'public, max-age=3600');

		return new Response(object.body, { headers });
	},
} satisfies ExportedHandler<Env>;
