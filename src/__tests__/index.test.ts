/**
 * Basic smoke tests
 */

import { describe, it, expect, vi } from 'vitest';
import type { NetworkClient } from '@sudobility/types';
import { IndexerClient, IndexerService } from '../index';

// Mock NetworkClient for testing
const createMockNetworkClient = (): NetworkClient => ({
  request: vi.fn(),
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
});

describe('Library Exports', () => {
  it('should export IndexerClient', () => {
    expect(IndexerClient).toBeDefined();
  });

  it('should export IndexerService', () => {
    expect(IndexerService).toBeDefined();
  });

  it('should create IndexerClient instance with NetworkClient', () => {
    const mockNetworkClient = createMockNetworkClient();
    const client = new IndexerClient('http://localhost:42069', mockNetworkClient);
    expect(client).toBeInstanceOf(IndexerClient);
  });

  it('should create IndexerService instance with NetworkClient', () => {
    const mockNetworkClient = createMockNetworkClient();
    const service = new IndexerService({
      indexerUrl: 'http://localhost:42069',
      networkClient: mockNetworkClient,
    });
    expect(service).toBeInstanceOf(IndexerService);
  });

  it('should require networkClient for IndexerService', () => {
    expect(() => {
      new IndexerService({
        indexerUrl: 'http://localhost:42069',
        networkClient: undefined as unknown as NetworkClient,
      });
    }).toThrow('networkClient is required');
  });

  it('should require indexerUrl for IndexerService', () => {
    const mockNetworkClient = createMockNetworkClient();
    expect(() => {
      new IndexerService({
        indexerUrl: '',
        networkClient: mockNetworkClient,
      });
    }).toThrow('indexerUrl is required');
  });
});
