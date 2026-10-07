const { withNativeFederation, shareAll } = require('@angular-architects/native-federation/config');

module.exports = withNativeFederation({
  name: 'finance-inventory',
  // An Ionic Angular domain app exposes its routes (ADR-013). The shell lazy-loads them under
  // /finance, so they run in the shell's injector: its HttpClient, its interceptor, its session.
  exposes: {
    './routes': './src/app/finance.routes.ts',
  },
  // The same versions as the shell, as singletons: Angular and Ionic exist once in the app.
  shared: {
    ...shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' }),
  },
  skip: [
    'rxjs/ajax', 'rxjs/fetch', 'rxjs/testing', 'rxjs/webSocket',
    '@angular/platform-browser/animations', '@angular/platform-browser/animations/async',
    'vitest',
  ],
});
