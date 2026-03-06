/**
 * Backend function invocations via REST.
 * POST /functions/<name> with body. When API is not configured, throws.
 */

import { apiPost, isApiConfigured } from './client.js';

export async function invoke(functionName, payload = {}) {
  if (!isApiConfigured()) {
    throw new Error(`API not configured. Cannot invoke ${functionName}. Set VITE_API_URL.`);
  }
  const result = await apiPost(`/functions/${functionName}`, payload);
  // Backend may return { data: { output: ... } }; preserve shape for callers
  return result;
}

function fn(name) {
  return (payload = {}) => invoke(name, payload);
}

export const tilly = fn('tilly');
export const exportSoilTests = fn('exportSoilTests');
export const geeFetchS2 = fn('geeFetchS2');
export const naipFetch = fn('naipFetch');
export const maskAndNdvi = fn('maskAndNdvi');
export const soilAndStats = fn('soilAndStats');
export const openEtFetch = fn('openEtFetch');
export const zoneAggregation = fn('zoneAggregation');
export const getFields = fn('getFields');
export const queryTilly = fn('queryTilly');
export const getNdviImagery = fn('getNdviImagery');
export const claimOhioFields = fn('claimOhioFields');
export const autoFieldDataUpdate = fn('autoFieldDataUpdate');
export const getUserFields = fn('getUserFields');
export const getOhioBoundaries = fn('getOhioBoundaries');
export const getFieldDetailsOnClick = fn('getFieldDetailsOnClick');
export const manageField = fn('manageField');
export const getOhioParcels = fn('getOhioParcels');
export const getParcelDetails = fn('getParcelDetails');
export const manageParcelField = fn('manageParcelField');
export const cleanupDemoData = fn('cleanupDemoData');
export const processAndSaveSoilTests = fn('processAndSaveSoilTests');
export const soilTestModels = fn('soilTestModels');
export const testSoilTestModels = fn('testSoilTestModels');
export const zipProcessor = fn('zipProcessor');
export async function trackEvent(payload = {}) {
  if (!isApiConfigured()) return;
  return invoke('trackEvent', payload);
}
export const checkDataSourceStatus = fn('checkDataSourceStatus');
export const processShapefile = fn('processShapefile');
export const suggestSoilTestLinks = fn('suggestSoilTestLinks');
export const linkSoilTestsToField = fn('linkSoilTestsToField');
export const getSsurgoData = fn('getSsurgoData');
export const pkPhase = fn('pkPhase');
export const pRate = fn('pRate');
export const kRate = fn('kRate');
export const mrtnCorn = fn('mrtnCorn');
export const wheatN = fn('wheatN');
export const limeRate = fn('limeRate');
export const triStateAdvisor = fn('triStateAdvisor');
export const invokeGPT = fn('invokeGPT');
export const extractSoilTests = fn('extractSoilTests');
