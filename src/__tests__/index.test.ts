/**
 * Basic smoke tests
 */

import { describe, it, expect } from 'vitest';
import { IndexerClient, FetchNetworkClient, IndexerService } from '../index';

describe('Library Exports', () => {
  it('should export IndexerClient', () => {
    expect(IndexerClient).toBeDefined();
  });

  it('should export FetchNetworkClient', () => {
    expect(FetchNetworkClient).toBeDefined();
  });

  it('should export IndexerService', () => {
    expect(IndexerService).toBeDefined();
  });

  it('should create IndexerClient instance', () => {
    const client = new IndexerClient('http://localhost:42069');
    expect(client).toBeInstanceOf(IndexerClient);
  });

  it('should create FetchNetworkClient instance', () => {
    const client = new FetchNetworkClient();
    expect(client).toBeInstanceOf(FetchNetworkClient);
  });

  it('should create IndexerService instance', () => {
    const service = new IndexerService({
      indexerUrl: 'http://localhost:42069',
    });
    expect(service).toBeInstanceOf(IndexerService);
  });
});
