const app = require('../server');

function listRoutes(app) {
    const routes = [];

    function processStack(stack, prefix = '') {
        stack.forEach(layer => {
            if (layer.route) {
                const path = prefix + layer.route.path;
                const methods = Object.keys(layer.route.methods).map(m => m.toUpperCase());
                routes.push({ methods, path });
            } else if (layer.name === 'router') {
                // Determine the prefix for this router
                let routerPrefix = '';
                if (layer.regexp) {
                    // Try to extract literal prefix from regexp
                    const source = layer.regexp.source;
                    if (source.startsWith('^\\/api\\/ai\\/')) {
                        routerPrefix = '/api/ai';
                    } else if (source.startsWith('^\\/api\\/chat\\/')) {
                        routerPrefix = '/api/chat';
                    } else if (source.startsWith('^\\/api\\/auth\\/')) {
                        routerPrefix = '/api/auth';
                    } else {
                        // Generic fallback approach
                        routerPrefix = source
                            .replace(/^\^/, '')
                            .replace(/\\\//g, '/')
                            .replace(/\?\:\(\?=.*$/, '')
                            .replace(/\/\?\(\?=\/\|\$\)/, '')
                            .replace(/\/\?\$/, '');
                    }
                }
                processStack(layer.handle.stack, prefix + routerPrefix);
            }
        });
    }

    if (app._router && app._router.stack) {
        processStack(app._router.stack);
    }
    return routes;
}

const routes = listRoutes(app);
console.log('--- ALL REGISTERED ROUTES ---');
routes.forEach(r => {
    console.log(`${r.methods.join(',').padEnd(15)} ${r.path}`);
});
if (routes.length === 0) {
    console.log('No routes found. Is the app correctly initialized?');
}
console.log('--- END OF ROUTES ---');
process.exit(0);
