import { getCurrentDatetime } from '@sudobility/heavymath_types';

/**
 * The current time, or the fixed test-mode time when `testMode` is set.
 *
 * Test mode is the caller's to say — `IndexerClient` takes it as a
 * constructor argument, as `mail_box_indexer_client`'s does. A library reads
 * no environment: `import.meta.env` and `process.env` mean different things
 * under Vite, Node and Metro (Hermes cannot even compile `import.meta`), and
 * which variable decides is the app's choice, not this package's.
 */
export function getNow(testMode = false): Date {
  return getCurrentDatetime(testMode);
}
