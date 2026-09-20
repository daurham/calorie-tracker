import { createHash } from 'crypto';
import type { AiHashInput, AiRequestType } from '../../types/ai-infra';

export const sha256Hex = (value: string | Buffer) =>
  createHash('sha256').update(value).digest('hex');

export const hashImageBytes = (dataBase64: string) => {
  const normalized = String(dataBase64 || '').replace(/\s/g, '');
  try {
    return sha256Hex(Buffer.from(normalized, 'base64'));
  } catch {
    return sha256Hex(normalized);
  }
};

export const normalizeAiText = (value?: string | null) =>
  String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

export const buildAiRequestHash = (input: AiHashInput) => {
  const payload = {
    requestType: input.requestType,
    schemaVersion: input.schemaVersion,
    promptVersion: input.promptVersion || null,
    resolverVersion: input.resolverVersion || null,
    normalizedText: normalizeAiText(input.normalizedText),
    imageSha256: input.imageSha256 || null,
  };
  return sha256Hex(JSON.stringify(payload));
};

export const hashNutritionLabelRequest = (input: {
  dataBase64: string;
  accompanyingText?: string | null;
  schemaVersion: string;
  promptVersion: string;
  requestType?: AiRequestType;
}) => buildAiRequestHash({
  requestType: input.requestType || 'nutrition_label',
  schemaVersion: input.schemaVersion,
  promptVersion: input.promptVersion,
  normalizedText: input.accompanyingText,
  imageSha256: hashImageBytes(input.dataBase64),
});
