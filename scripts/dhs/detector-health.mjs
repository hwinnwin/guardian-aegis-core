#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const sinceHours = Number(process.env.DHS_WINDOW_HOURS ?? 24);
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const slackWebhook = process.env.SLACK_WEBHOOK_URL;
const coveragePctEnv = process.env.DHS_COVERAGE_PCT;
const e2eStatusEnv = process.env.DHS_E2E_STATUS;

if (!supabaseUrl || !supabaseKey) {
  console.warn("Supabase credentials missing. Skipping detector health computation.");
  process.exit(0);
}

const interval = `${sinceHours} hours`;

async function fetchDetectorStats() {
  const endpoint = `${supabaseUrl.replace(/\/$/, "")}/rest/v1/rpc/detector_health_window`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    },
    body: JSON.stringify({ p_since: interval }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase RPC failed (${response.status}): ${text}`);
  }

  const payload = await response.json();
  if (!Array.isArray(payload) || payload.length === 0) {
    throw new Error("Unexpected RPC response; expected a single-row array.");
  }
  const [row] = payload;
  return {
    errorCount: Number(row.error_count ?? 0),
    totalEvents: Number(row.total_events ?? 0),
    rateLimitHits: Number(row.rate_limit_hits ?? 0),
  };
}

function resolveCoverageWeight(stats) {
  const coveragePct = Number.isFinite(Number(coveragePctEnv))
    ? Number(coveragePctEnv)
    : Number(stats.coverage_pct ?? 68);
  const normalized = Math.max(0, Math.min(coveragePct, 100));
  return { coveragePct: normalized, coverageWeight: normalized / 100 };
}

function resolveE2EWeight() {
  const normalized = String(e2eStatusEnv || "pass").toLowerCase();
  if (["fail", "failing", "false", "0"].includes(normalized)) {
    return { e2ePass: false, weight: 0.4 };
  }
  if (["flaky", "unstable"].includes(normalized)) {
    return { e2ePass: "flaky", weight: 0.7 };
  }
  return { e2ePass: true, weight: 1 };
}

function buildHealthScore({ errorCount, totalEvents, rateLimitHits }) {
  const events = Math.max(totalEvents, 1);
  const errorRate = Math.min(1, (errorCount + rateLimitHits) / events);
  const { coveragePct, coverageWeight } = resolveCoverageWeight({});
  const e2eMeta = resolveE2EWeight();
  const health = Math.max(0, Math.min(1, (1 - errorRate) * coverageWeight * e2eMeta.weight));
  const healthPct = Math.round(health * 100);
  return {
    health,
    healthPct,
    errorRate: Number((errorRate * 100).toFixed(2)),
    coveragePct,
    e2eMeta,
  };
}

function badgeColor(healthPct) {
  if (healthPct >= 90) return "brightgreen";
  if (healthPct >= 80) return "green";
  if (healthPct >= 70) return "yellowgreen";
  if (healthPct >= 50) return "orange";
  return "red";
}

async function writeBadge(healthPct) {
  const color = badgeColor(healthPct);
  const label = encodeURIComponent("Detector Health");
  const message = encodeURIComponent(`${healthPct}%`);
  const shieldUrl = `https://img.shields.io/badge/${label}-${message}-${color}.svg?logo=pulse`; // remote render
  const res = await fetch(shieldUrl);
  if (!res.ok) {
    throw new Error(`Unable to fetch badge SVG (${res.status})`);
  }
  const svg = await res.text();
  const artifactsDir = path.join(process.cwd(), "artifacts");
  await fs.mkdir(artifactsDir, { recursive: true });
  const outFile = path.join(artifactsDir, "detector-health-badge.svg");
  await fs.writeFile(outFile, svg, "utf8");
  console.log(`Badge written to ${outFile}`);
}

async function postToSlack(context) {
  if (!slackWebhook) {
    console.log("Slack webhook not configured; skipping notification.");
    return;
  }
  const { healthPct, errorRate, coveragePct, e2eMeta, stats } = context;
  const text = [
    `*Detector Health:* ${healthPct}%`,
    `• Error rate: ${errorRate}% (errors: ${stats.errorCount}, events: ${stats.totalEvents}, RL hits: ${stats.rateLimitHits})`,
    `• Coverage weight: ${coveragePct}%`,
    `• E2E status: ${e2eMeta.e2ePass === true ? "pass" : e2eMeta.e2ePass === "flaky" ? "flaky" : "attention"}`,
  ].join("\n");

  const payload = { text };
  const res = await fetch(slackWebhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const detail = await res.text();
    console.warn(`Slack notification failed (${res.status}): ${detail}`);
  } else {
    console.log("Slack notification sent.");
  }
}

async function main() {
  try {
    const stats = await fetchDetectorStats();
    const score = buildHealthScore(stats);
    console.log(JSON.stringify({
      windowHours: sinceHours,
      stats,
      score,
    }, null, 2));

    await writeBadge(score.healthPct);
    await postToSlack({ ...score, stats });
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

await main();
