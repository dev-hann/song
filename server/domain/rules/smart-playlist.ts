import type { SmartPlaylistRules } from '@/types';

function evaluateRule(
  track: { title: string; channel: string; duration: number; addedAt: string },
  rule: { field: string; operator: string; value: string | number },
): boolean {
  let fieldValue: string | number;
  switch (rule.field) {
    case 'channel': fieldValue = track.channel; break;
    case 'title': fieldValue = track.title; break;
    case 'minDuration': fieldValue = track.duration; break;
    case 'maxDuration': fieldValue = track.duration; break;
    case 'addedAfter': fieldValue = track.addedAt; break;
    case 'addedBefore': fieldValue = track.addedAt; break;
    default: return false;
  }

  switch (rule.operator) {
    case 'contains': return typeof fieldValue === 'string' && typeof rule.value === 'string' && fieldValue.toLowerCase().includes(rule.value.toLowerCase());
    case 'equals': return fieldValue === rule.value;
    case 'startsWith': return typeof fieldValue === 'string' && typeof rule.value === 'string' && fieldValue.toLowerCase().startsWith(rule.value.toLowerCase());
    case 'gt': return fieldValue > rule.value;
    case 'lt': return fieldValue < rule.value;
    case 'gte': return fieldValue >= rule.value;
    case 'lte': return fieldValue <= rule.value;
    default: return false;
  }
}

export function evaluateSmartPlaylistRules(
  tracks: { title: string; channel: string; duration: number; addedAt: string }[],
  rules: SmartPlaylistRules,
): { title: string; channel: string; duration: number; addedAt: string }[] {
  if (rules.match === 'all') {
    return tracks.filter((t) => rules.conditions.every((r) => evaluateRule(t, r)));
  }
  return tracks.filter((t) => rules.conditions.some((r) => evaluateRule(t, r)));
}
