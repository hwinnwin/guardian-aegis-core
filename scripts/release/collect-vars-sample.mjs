#!/usr/bin/env node
/**
 * Sample collector for Guardian Aegis Integrity variables.
 * Replace the stub values with real parsers that read your CI artifacts.
 */
import fs from "node:fs";

const fallback = (code, def) => Number(process.env[code] ?? def);

const vars = {
  WF_PIN:        fallback("WF_PIN", 100),
  CODE_TEST:     fallback("CODE_TEST", 92.5),
  WF_PERM:       fallback("WF_PERM", 96),
  WF_CONC:       fallback("WF_CONC", 93),
  PKG_PIN:       fallback("PKG_PIN", 100),
  PROV_COV:      fallback("PROV_COV", 100),
  DOC_AUDIT:     fallback("DOC_AUDIT", 100),
  CODE_LINT:     fallback("CODE_LINT", 100),
  CODE_TYPES:    fallback("CODE_TYPES", 99.2),
  DETECT_HEALTH: fallback("DETECT_HEALTH", 99.94),
  UI_QUALITY:    fallback("UI_QUALITY", 99.6),
  BENCH_BUFFER:  fallback("BENCH_BUFFER", 99.95),
  CACHE_HEALTH:  fallback("CACHE_HEALTH", 97),
  SRC_DOC:       fallback("SRC_DOC", 100)
};

fs.mkdirSync(".aegis_audit", { recursive: true });
const outPath = ".aegis_audit/vars.json";
fs.writeFileSync(outPath, JSON.stringify(vars, null, 2));
console.log(outPath);
