import { initFederation } from '@angular-architects/native-federation';

// Only when this remote is opened on its own (http://localhost:4307): inside the app the shell
// loads './routes' and never runs this file.
initFederation()
  .catch((err) => console.error(err))
  .then(() => import('./bootstrap'))
  .catch((err) => console.error(err));
