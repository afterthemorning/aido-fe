import _ from 'lodash';

export default function getUUID() {
  // Use random UUID when available to avoid tab key collisions.
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return _.uniqueId(`log_tab_${Date.now()}_`);
}
