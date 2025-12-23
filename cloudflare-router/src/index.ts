const CACHE_MAX_AGE = 3600; // 1 hour

function getContentType(filePath: string): string {
	// Extract extension more reliably - get the last part after the last dot
	const lastDotIndex = filePath.lastIndexOf('.');
	if (lastDotIndex === -1 || lastDotIndex === filePath.length - 1) {
		return 'application/octet-stream';
	}

	const extension = filePath.slice(lastDotIndex + 1).toLowerCase();

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

function isValidSubdomain(subdomain: string): boolean {
	// Subdomain should be non-empty, alphanumeric with hyphens, and not start/end with hyphen
	return subdomain.length > 0 && subdomain.length <= 63 && /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/i.test(subdomain);
}

function hasFileExtension(path: string): boolean {
	// Check if path has a file extension (e.g., .html, .js, .png)
	// Exclude paths like /api.v1/users (which have dots but aren't file extensions)
	const lastDotIndex = path.lastIndexOf('.');
	if (lastDotIndex === -1 || lastDotIndex === path.length - 1) {
		return false;
	}

	// Check if there's a slash after the last dot (which would indicate it's not a file extension)
	const afterDot = path.slice(lastDotIndex + 1);
	return afterDot.length > 0 && !afterDot.includes('/');
}

function addSecurityHeaders(headers: Headers): void {
	headers.set('X-Content-Type-Options', 'nosniff');
	headers.set('X-Frame-Options', 'DENY');
	headers.set('X-XSS-Protection', '1; mode=block');
	headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
}

function handleConditionalRequest(request: Request, object: R2Object): Response | null {
	// Check If-None-Match header for ETag matching
	const ifNoneMatch = request.headers.get('If-None-Match');
	if (ifNoneMatch && object.httpEtag && ifNoneMatch === object.httpEtag) {
		return new Response(null, { status: 304 });
	}

	// Check If-Modified-Since header
	const ifModifiedSince = request.headers.get('If-Modified-Since');
	if (ifModifiedSince && object.uploaded) {
		const modifiedSince = new Date(ifModifiedSince);
		const uploaded = new Date(object.uploaded);
		if (uploaded <= modifiedSince) {
			return new Response(null, { status: 304 });
		}
	}

	return null;
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		try {
			// Only handle GET and HEAD requests
			if (request.method !== 'GET' && request.method !== 'HEAD') {
				return new Response('Method Not Allowed', { status: 405 });
			}

			const url = new URL(request.url);
			const hostname = url.hostname;
			const pathname = url.pathname;

			const parts = hostname.split('.');

			// Handle root domain (assuming standard TLD structure)
			// This is a simplified check - for production, consider using a proper TLD list
			if (parts.length < 3) {
				return new Response('Root domain - no site attached', {
					status: 200,
				});
			}

			const subdomain = parts[0];

			// Validate subdomain format
			if (!isValidSubdomain(subdomain)) {
				return new Response('Invalid subdomain', { status: 400 });
			}

			// Normalize path
			let filePath = pathname === '/' ? '/index.html' : pathname;

			// Try to get the file
			let r2Key = `${subdomain}${filePath}`;
			let object = await env.BUCKET.get(r2Key);

			// If not found and path doesn't have a file extension, try index.html
			if (!object && !hasFileExtension(filePath)) {
				filePath = '/index.html';
				r2Key = `${subdomain}${filePath}`;
				object = await env.BUCKET.get(r2Key);
			}

			if (!object) {
				return new Response('Not Found', { status: 404 });
			}

			// Handle conditional requests (304 Not Modified)
			const conditionalResponse = handleConditionalRequest(request, object);
			if (conditionalResponse) {
				return conditionalResponse;
			}

			const headers = new Headers();

			// Set Content-Type
			const detectedType = getContentType(filePath);
			const contentType = detectedType !== 'application/octet-stream' ? detectedType : object.httpMetadata?.contentType || detectedType;
			headers.set('Content-Type', contentType);

			// Set ETag (proper case)
			if (object.httpEtag) {
				headers.set('ETag', object.httpEtag);
			}

			// Set Last-Modified if available
			if (object.uploaded) {
				headers.set('Last-Modified', new Date(object.uploaded).toUTCString());
			}

			// Set Content-Disposition
			headers.set('Content-Disposition', 'inline');

			// Set Cache-Control
			headers.set('Cache-Control', `public, max-age=${CACHE_MAX_AGE}`);

			// Add security headers
			addSecurityHeaders(headers);

			// Return response body only for GET requests
			const body = request.method === 'HEAD' ? null : object.body;

			return new Response(body, { headers });
		} catch (error) {
			// Log error for debugging (in production, consider using proper logging)
			console.error('Error processing request:', error);
			return new Response('Internal Server Error', { status: 500 });
		}
	},
} satisfies ExportedHandler<Env>;
