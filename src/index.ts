import { MinutesApprovalPlugin, type MinutesResourceReader } from './plugin.js';
export function createPlugin(host: MinutesResourceReader) { return new MinutesApprovalPlugin(host); }

