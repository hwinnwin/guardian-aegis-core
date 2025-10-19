import yaml from 'js-yaml';
import { foldBasic, emojiHints } from './normalize';
import type { Severity } from '../types/incidents';
import { inc, recordRuleCompileError } from './metrics';

interface RulePatternConfig {
  src: string;
  name?: string;
  notes?: string;
}

interface RuleConfig {
  severity: Severity;
  patterns: RulePatternConfig[];
  negatives?: string[];
}

export interface RuleSet {
  version: string;
  labels: Record<string, RuleConfig>;
}

export interface DetectionResult {
  label: string;
  severity: Severity;
  reasons: string[];
  sources: string[];
}

interface CompiledPattern {
  regex: RegExp;
  name?: string;
}

interface CompiledRule {
  label: string;
  severity: Severity;
  patterns: CompiledPattern[];
  negatives: RegExp[];
}

let compiled: CompiledRule[] = [];

const INLINE_CASE_FLAG = /\(\?i\)/gi;

function sanitize(pattern: string): string {
  return pattern.replace(INLINE_CASE_FLAG, '');
}

function compileRegex(source: string): RegExp | null {
  try {
    return new RegExp(sanitize(source), 'i');
  } catch {
    recordRuleCompileError();
    return null;
  }
}

export function loadRules(yamlText: string) {
  if (!yamlText) {
    compiled = [];
    return;
  }
  const data = yaml.load(yamlText) as RuleSet;
  if (!data || typeof data !== 'object') {
    compiled = [];
    return;
  }

  compiled = Object.entries(data.labels ?? {}).map(([label, value]) => {
    const patterns: CompiledPattern[] = (value.patterns ?? [])
      .map((pattern) => {
        const regex = compileRegex(pattern.src);
        if (!regex) return null;
        return { regex, name: pattern.name };
      })
      .filter((entry): entry is CompiledPattern => Boolean(entry));

    const negatives: RegExp[] = (value.negatives ?? [])
      .map((neg) => compileRegex(neg))
      .filter((entry): entry is RegExp => Boolean(entry));

    return {
      label,
      severity: value.severity,
      patterns,
      negatives,
    };
  });
}

export function detectFastPath(rawText: string): DetectionResult[] {
  if (!rawText) return [];
  const normalized = foldBasic(emojiHints(rawText));
  const hits: DetectionResult[] = [];

  for (const rule of compiled) {
    if (rule.negatives.some((neg) => neg.test(normalized))) {
      continue;
    }

    const reasons: string[] = [];
    const sources: string[] = [];
    for (const pattern of rule.patterns) {
      if (pattern.regex.test(normalized)) {
        reasons.push(pattern.name ?? pattern.regex.source);
        sources.push(pattern.regex.source);
      }
    }

    if (reasons.length > 0) {
      const existing = hits.find((h) => h.label === rule.label);
      if (existing) {
        existing.reasons = Array.from(new Set([...existing.reasons, ...reasons]));
        existing.sources = Array.from(new Set([...existing.sources, ...sources]));
      } else {
        hits.push({ label: rule.label, severity: rule.severity, reasons, sources });
      }
    }
  }

  if (hits.length > 0) {
    inc('detections');
  }

  return hits;
}
