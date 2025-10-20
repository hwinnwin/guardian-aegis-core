import React from 'react';
import { AnalyticsPanel } from '../components/AnalyticsPanel';
import { RuleSimulator } from '../components/RuleSimulator';
import { TrainerPanel } from '../components/TrainerPanel';
import { TunerPanel } from '../components/TunerPanel';
import { CorpusRunner } from '../components/CorpusRunner';
import { RuleInspector } from '../components/RuleInspector';
import { DocsLinks } from '../components/DocsLinks';
import { AlertsList } from '../components/AlertsList';

export default function QA() {
  return (
    <div style={{ display: 'grid', gap: 16, padding: 16 }}>
      <AnalyticsPanel />
      <RuleSimulator />
      <TrainerPanel />
      <TunerPanel />
      <CorpusRunner />
      <RuleInspector />
      <DocsLinks />
      <AlertsList />
    </div>
  );
}
