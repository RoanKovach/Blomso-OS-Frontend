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

export { User };

const soilTests = 'soil-tests';
const fields = 'fields';
const practices = 'practices';
const cropTargets = 'crop-targets';
const dataSources = 'data-sources';
const spatialData = 'spatial-data';
const aiContextDocuments = 'ai-context-documents';

export const SoilTest = {
  list(order, limit) {
    return entityList(soilTests, order, limit);
  },
  filter(filter, order, limit) {
    return entityFilter(soilTests, filter, order, limit);
  },
  get(id) {
    return entityGet(soilTests, id);
  },
  create(body) {
    return entityCreate(soilTests, body);
  },
  update(id, body) {
    return entityUpdate(soilTests, id, body);
  },
  delete(id) {
    return entityDelete(soilTests, id);
  },
  bulkCreate(records) {
    return entityBulkCreate(soilTests, records);
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
  list(order, limit) {
    return entityList(cropTargets, order, limit);
  },
  filter(filter, order, limit) {
    return entityFilter(cropTargets, filter, order, limit);
  },
  get(id) {
    return entityGet(cropTargets, id);
  },
  create(body) {
    return entityCreate(cropTargets, body);
  },
  update(id, body) {
    return entityUpdate(cropTargets, id, body);
  },
  delete(id) {
    return entityDelete(cropTargets, id);
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
