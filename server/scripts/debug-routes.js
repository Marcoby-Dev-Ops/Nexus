const app = require('../server');

function printRoutes(stack, prefix = '') {
    stack.forEach((layer) => {
        if (layer.route) {
            const methods = Object.keys(layer.route.methods).join(',').toUpperCase();
            console.log(`${methods.padEnd(7)} ${prefix}${layer.route.path}`);
        } else if (layer.name === 'router') {
            const newPrefix = prefix + (layer.regexp.source.replace('\\/?(?=\\/|$)', '').replace('^', '').replace(/\\\//g, '/') || '');
            printRoutes(layer.handle.stack, newPrefix);
        }
    });
}

console.log('--- REGISTERED ROUTES ---');
if (app._router && app._router.stack) {
    printRoutes(app._router.stack);
} else {
    console.log('Could not access router stack. Is the app exported correctly?');
}
console.log('-------------------------');
process.exit(0);
