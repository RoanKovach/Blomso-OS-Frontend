import { DataSource } from '@/api/entities';
import { checkDataSourceStatus } from '@/api/functions';

export const DataSourceHealthService = {
  /**
   * Checks the status of a single data source and updates its record.
   * @param {string} sourceId - The ID of the DataSource to check.
   * @returns {Promise<{oldStatus: string, newStatus: string, sourceName: string}>}
   */
  async checkSourceStatus(sourceId) {
    const source = await DataSource.get(sourceId);
    if (!source) {
      throw new Error(`Data source with ID ${sourceId} not found.`);
    }

    const { data: healthResult } = await checkDataSourceStatus({ dataSource: source });

    if (healthResult.status !== source.status) {
      await DataSource.update(sourceId, {
        status: healthResult.status,
        last_sync: new Date().toISOString(),
      });
    }

    return { 
      oldStatus: source.status, 
      newStatus: healthResult.status, 
      sourceName: source.source_name 
    };
  },

  /**
   * Checks all user-configured data sources.
   * @returns {Promise<Array<{oldStatus: string, newStatus: string, sourceName: string}>>}
   */
  async checkAllSources() {
    const sources = await DataSource.list();
    const statusChangePromises = sources.map(source => this.checkSourceStatus(source.id));
    return Promise.all(statusChangePromises);
  },
};