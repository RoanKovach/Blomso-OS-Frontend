/**
 * Entity API - SoilTest, Field, Practice, etc. via REST.
 * Same method names as before so components need minimal change.
 */

import {
  entityList,
  entityFilter,
  entityGet,
  entityCreate,
  entityUpdate,
  entityDelete,
  entityBulkCreate,
} from './entityHelpers.js';
import { User } from './auth.js';
import { listRecords, getRecord as getRecordById, updateRecord, deleteRecord } from './records.js';

export { User };

const soilTests = 'soil-tests';
const fields = 'fields';
const practices = 'practices';
const cropTargets = 'crop-targets';
const dataSources = 'data-sources';
const spatialData = 'spatial-data';
const aiContextDocuments = 'ai-context-documents';

function mapNormalizedRecordToSoilTest(record) {
  if (!record || record.type !== 'normalized_soil_test') return null;
  const soilData = record.soil_data || {};
  return {
    id: record.id,
    field_name: record.field_name ?? record.zone_name ?? 'Unnamed',
    zone_name: record.zone_name ?? null,
    test_date: record.test_date ?? null,
    soil_data: soilData,
    crop_type: record.crop_type ?? null,
    soil_type: record.soil_type ?? null,
    field_id: record.field_id ?? null,
    soil_health_index: record.soil_health_index,
    updated_date: record.updatedAt ?? record.createdAt,
    createdAt: record.createdAt,
    sourceUploadId: record.sourceUploadId,
    userSub: record.userSub,
  };
}

async function listNormalizedSoilTests(order, limit) {
  const res = await listRecords();
  const records = (res && res.records) || [];
  let tests = records
    .filter((r) => r.type === 'normalized_soil_test')
    .map(mapNormalizedRecordToSoilTest)
    .filter(Boolean);

  if (order) {
    const desc = order.startsWith('-');
    const field = desc ? order.slice(1) : order;
    tests.sort((a, b) => {
      const av = a[field] || '';
      const bv = b[field] || '';
      const cmp = String(av).localeCompare(String(bv));
      return desc ? -cmp : cmp;
    });
  }

  if (typeof limit === 'number') {
    tests = tests.slice(0, limit);
  }
  return tests;
}

export const SoilTest = {
  async list(order, limit) {
    return listNormalizedSoilTests(order, limit);
  },
  async filter(filter, order, limit) {
    const all = await listNormalizedSoilTests(order, undefined);
    if (!filter || typeof filter !== 'object') {
      return typeof limit === 'number' ? all.slice(0, limit) : all;
    }
    const filtered = all.filter((t) => {
      return Object.entries(filter).every(([key, value]) => {
        if (key === 'created_by') {
          // Backend already enforces ownership via userSub; ignore created_by filter.
          return true;
        }
        if (key === 'id') {
          if (Array.isArray(value)) return value.includes(t.id);
          return t.id === value;
        }
        return t[key] === value;
      });
    });
    return typeof limit === 'number' ? filtered.slice(0, limit) : filtered;
  },
  async get(id) {
    if (!id) return null;
    const res = await getRecordById(id);
    if (!res || !res.ok || !res.record) return null;
    return mapNormalizedRecordToSoilTest(res.record);
  },
  async create(body) {
    // Normalized soil tests are created via the extraction/records pipeline.
    // Keep this stub to avoid accidental POSTs to legacy /soil-tests.
    throw new Error('SoilTest.create is not supported. Use upload/extraction flow.');
  },
  async update(id, body) {
    if (!id) throw new Error('id is required');
    const allowed = ['zone_name', 'test_date', 'field_name', 'field_id', 'crop_type', 'soil_type', 'soil_data'];
    const payload = {};
    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(body || {}, key)) {
        payload[key] = body[key];
      }
    }
    const res = await updateRecord(id, payload);
    if (!res || !res.ok) {
      throw new Error(res?.error || 'Failed to update soil test');
    }
    return mapNormalizedRecordToSoilTest(res.record);
  },
  async delete(id) {
    if (!id) throw new Error('id is required');
    const res = await deleteRecord(id);
    if (!res || !res.ok) {
      throw new Error(res?.error || 'Failed to delete soil test');
    }
    return true;
  },
  async bulkCreate() {
    // Bulk create for soil tests is handled by POST /records/normalized;
    // keep this as a guarded stub so we do not hit non-existent /soil-tests/bulk.
    throw new Error('SoilTest.bulkCreate is no longer supported. Use the batch upload flow.');
  },
};

export const Field = {
  list(order, limit) {
    return entityList(fields, order, limit);
  },
  filter(filter, order, limit) {
    return entityFilter(fields, filter, order, limit);
  },
  get(id) {
    return entityGet(fields, id);
  },
  create(body) {
    return entityCreate(fields, body);
  },
  update(id, body) {
    return entityUpdate(fields, id, body);
  },
  delete(id) {
    return entityDelete(fields, id);
  },
};

export const Practice = {
  list(order, limit) {
    return entityList(practices, order, limit);
  },
  filter(filter, order, limit) {
    return entityFilter(practices, filter, order, limit);
  },
  get(id) {
    return entityGet(practices, id);
  },
  create(body) {
    return entityCreate(practices, body);
  },
  update(id, body) {
    return entityUpdate(practices, id, body);
  },
  delete(id) {
    return entityDelete(practices, id);
  },
};

export const CropTarget = {
  async list() {
    // Crop targets are not backed by the current API; return empty to avoid hitting /crop-targets.
    return [];
  },
  async filter() {
    return [];
  },
  async get() {
    return null;
  },
  async create() {
    throw new Error('CropTarget.create is not supported in this environment.');
  },
  async update() {
    throw new Error('CropTarget.update is not supported in this environment.');
  },
  async delete() {
    throw new Error('CropTarget.delete is not supported in this environment.');
  },
};

export const DataSource = {
  list(order, limit) {
    return entityList(dataSources, order, limit);
  },
  filter(filter, order, limit) {
    return entityFilter(dataSources, filter, order, limit);
  },
  get(id) {
    return entityGet(dataSources, id);
  },
  create(body) {
    return entityCreate(dataSources, body);
  },
  update(id, body) {
    return entityUpdate(dataSources, id, body);
  },
  delete(id) {
    return entityDelete(dataSources, id);
  },
};

export const SpatialData = {
  list(order, limit) {
    return entityList(spatialData, order, limit);
  },
  filter(filter, order, limit) {
    return entityFilter(spatialData, filter, order, limit);
  },
  get(id) {
    return entityGet(spatialData, id);
  },
  create(body) {
    return entityCreate(spatialData, body);
  },
  update(id, body) {
    return entityUpdate(spatialData, id, body);
  },
  delete(id) {
    return entityDelete(spatialData, id);
  },
};

export const AIContextDocument = {
  list(order, limit) {
    return entityList(aiContextDocuments, order, limit);
  },
  filter(filter, order, limit) {
    return entityFilter(aiContextDocuments, filter, order, limit);
  },
  get(id) {
    return entityGet(aiContextDocuments, id);
  },
  create(body) {
    return entityCreate(aiContextDocuments, body);
  },
  update(id, body) {
    return entityUpdate(aiContextDocuments, id, body);
  },
  delete(id) {
    return entityDelete(aiContextDocuments, id);
  },
};
