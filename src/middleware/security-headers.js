const config = require('config');
const URL    = require('url').URL;

module.exports = function( req, res, next ) {

	let url = req.headers && req.headers.origin;

	let domain = ''
	try {
		domain = new URL(url).hostname;
	} catch(err) {}
	
	let allowedDomains = (req.site && req.site.config && req.site.config.allowedDomains) || config.allowedDomains;
	console.log ('>>> CORS', allowedDomains, domain, req.headers && req.headers.origin, url, req.headers);
	if ( !allowedDomains || allowedDomains.indexOf(domain) === -1) {
		const protocol = req.headers['x-forwarded-proto'] || req.protocol;
		url = config.url || protocol + '://' + req.hostname;
	}
	
	if (config.dev && config.dev['Header-Access-Control-Allow-Origin']) {
    res.header('Access-Control-Allow-Origin', config.dev['Header-Access-Control-Allow-Origin'] );
  } else {
    res.header('Access-Control-Allow-Origin', url );
  }
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With, x-http-method-override, X-GRIP-Tenant-Id, X-Authorization, X-Forwarded-For');
  res.header('Access-Control-Allow-Credentials', 'true');

	if (process.env.NODE_ENV != 'development') {
		res.header('Content-type', 'application/json; charset=utf-8');
		res.header('Strict-Transport-Security', 'max-age=31536000 ; includeSubDomains');
		res.header('X-Frame-Options', 'sameorigin');
		res.header('X-XSS-Protection', '1');
		res.header('X-Content-Type-Options', 'nosniff');
		res.header('Referrer-Policy', 'origin');
		res.header('Expect-CT', 'max-age=86400, enforce');
		res.header('Feature-Policy', 'vibrate \'none\'; geolocation \'none\'');
	}

	if (req.method == 'OPTIONS') {
		return res.end();
	}

	return next();

}
