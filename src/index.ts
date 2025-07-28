import { DbInit } from '@/database/dbInit.ts';

(async () => {
  await DbInit.initialize();
})();
