import { getCurrentDatetime } from '@sudobility/heavymath_types';

type EnvMap = Record<string, string | undefined>;

function getImportMetaEnv(): EnvMap | undefined {
  return (import.meta as ImportMeta & { env?: EnvMap }).env;
}

function getEnvValue(key: string): string | undefined {
  const importMetaValue = getImportMetaEnv()?.[key];
  if (importMetaValue !== undefined && importMetaValue !== '') {
    return importMetaValue;
  }

  if (typeof process !== 'undefined') {
    const processValue = process.env?.[key];
    if (processValue !== undefined && processValue !== '') {
      return processValue;
    }
  }

  return undefined;
}

export function getTestMode(): boolean {
  const value = getEnvValue('TEST_MODE') ?? getEnvValue('VITE_TEST_MODE');
  if (!value) return false;

  const normalizedValue = value.toLowerCase().trim();
  return ['true', 'yes', '1', 'on'].includes(normalizedValue);
}

export function getNow(testMode = getTestMode()): Date {
  return getCurrentDatetime(testMode);
}
