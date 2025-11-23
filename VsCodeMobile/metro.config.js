const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const fs = require('fs');

const config = getDefaultConfig(__dirname);

// Add all VS Code Web asset extensions
config.resolver.assetExts.push(
	'css',
	'wasm',
	'woff',
	'woff2',
	'ttf',
	'otf',
	'eot',
	'svg',
	'png',
	'jpg',
	'jpeg',
	'gif',
	'ico',
	'webp',
	'snap',
	'json'
);

config.server = {
	...config.server,
	enhanceMiddleware: (middleware) => {
		return (req, res, next) => {
			// Handle requests for vscode-web assets
			if (req.url.includes('/vscode-web/')) {
				// Extract the relative path after /vscode-web/
				const match = req.url.match(/\/vscode-web\/(.+)/);
				if (match) {
					const relativePath = match[1].split('?')[0]; // Remove query params
					const filePath = path.join(__dirname, 'assets/vscode-web', relativePath);

					// Check if file exists
					if (fs.existsSync(filePath)) {
						const stats = fs.statSync(filePath);

						// If it's a directory, try index.html
						if (stats.isDirectory()) {
							const indexPath = path.join(filePath, 'index.html');
							if (fs.existsSync(indexPath)) {
								res.writeHead(200, { 'Content-Type': 'text/html' });
								fs.createReadStream(indexPath).pipe(res);
								return;
							}
						}

						const ext = path.extname(filePath).toLowerCase();

						if (ext === '.css') {
							const referer = req.headers.referer || req.headers.referrer || '';
							const accept = req.headers.accept || '';

							const isHtmlReferer = referer.includes('index.html') || referer.endsWith('/vscode-web/');
							const explicitlyWantsCss = accept.includes('text/css') && !accept.includes('*/*') && !accept.includes('application/javascript');
							const isLinkTagRequest = isHtmlReferer && explicitlyWantsCss;

							if (!isLinkTagRequest) {
								try {
									let cssContent = fs.readFileSync(filePath, 'utf-8');

									const cssDir = path.dirname(relativePath);
									const baseUrl = '/vscode-web/' + cssDir + '/';

									cssContent = cssContent.replace(
										/url\((['"]?)\.\/([^'")]+)\1\)/g,
										(match, quote, file) => `url(${quote}${baseUrl}${file}${quote})`
									);

									cssContent = cssContent.replace(
										/url\((['"])([^'":\)]+)\1\)/g,
										(match, quote, file) => {
											if (file.startsWith('http://') || file.startsWith('https://') || file.startsWith('data:') || file.startsWith('/')) {
												return match;
											}
											return `url(${quote}${baseUrl}${file}${quote})`;
										}
									);

									const escapedCss = cssContent.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
									const jsContent = `const css = \`${escapedCss}\`;
const style = document.createElement('style');
style.textContent = css;
document.head.appendChild(style);
export default {};
`;
									res.writeHead(200, {
										'Content-Type': 'application/javascript; charset=utf-8',
										'Access-Control-Allow-Origin': '*',
										'Access-Control-Allow-Methods': 'GET, OPTIONS',
										'Access-Control-Allow-Headers': 'Content-Type',
										'Cache-Control': 'no-cache'
									});
									res.end(jsContent);
									return;
								} catch (err) {
									console.error(`[Metro] Error reading CSS file: ${filePath}`, err);
									res.writeHead(200, {
										'Content-Type': 'application/javascript; charset=utf-8',
										'Access-Control-Allow-Origin': '*'
									});
									res.end('export default {};');
									return;
								}
							}
						}

						const mimeTypes = {
							'.html': 'text/html; charset=utf-8',
							'.js': 'application/javascript; charset=utf-8',
							'.mjs': 'application/javascript; charset=utf-8',
							'.css': 'text/css; charset=utf-8',
							'.json': 'application/json; charset=utf-8',
							'.png': 'image/png',
							'.jpg': 'image/jpeg',
							'.jpeg': 'image/jpeg',
							'.gif': 'image/gif',
							'.svg': 'image/svg+xml',
							'.ico': 'image/x-icon',
							'.webp': 'image/webp',
							'.woff': 'font/woff',
							'.woff2': 'font/woff2',
							'.ttf': 'font/ttf',
							'.otf': 'font/otf',
							'.eot': 'application/vnd.ms-fontobject',
							'.wasm': 'application/wasm',
							'.snap': 'application/octet-stream'
						};

						const contentType = mimeTypes[ext] || 'application/octet-stream';

						// Set CORS headers for Expo Go
						res.writeHead(200, {
							'Content-Type': contentType,
							'Access-Control-Allow-Origin': '*',
							'Access-Control-Allow-Methods': 'GET, OPTIONS',
							'Access-Control-Allow-Headers': 'Content-Type'
						});

						// Stream the file
						fs.createReadStream(filePath).pipe(res);
						return;
					} else {
						// File not found
						console.warn(`[Metro] File not found: ${filePath} (requested: ${req.url})`);
						res.writeHead(404, { 'Content-Type': 'text/plain' });
						res.end('Not Found');
						return;
					}
				}
			}

			// Handle OPTIONS requests for CORS
			if (req.method === 'OPTIONS') {
				res.writeHead(200, {
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Methods': 'GET, OPTIONS',
					'Access-Control-Allow-Headers': 'Content-Type'
				});
				res.end();
				return;
			}

			return middleware(req, res, next);
		};
	},
};

module.exports = config;
