import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, CheckCircle, Shield } from 'lucide-react';
import rulesYaml from '../../packages/extension/src/detection/rules.fast.yaml?raw';
import { loadRules, detectFastPath } from '../../packages/extension/src/detection/engine';
import type { DetectionResult } from '../../packages/extension/src/detection/engine';

let loaded = false;

const EXAMPLE_MESSAGES = [
  { label: 'Safe message', text: 'Hey! How was your day at school?' },
  { label: 'Off-platform invite', text: "Let's switch to telegram, my handle is @safe_chat" },
  { label: 'Secrecy attempt', text: "Don't tell your parents about this, ok?" },
  { label: 'Meet-up coordination', text: 'Meet me outside Westfield mall at 3pm tomorrow' },
  { label: 'Age gap pattern', text: 'Age is just a number, nobody needs to know' },
];

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'CRITICAL': return 'bg-red-500/10 text-red-500 border-red-500/20';
    case 'HIGH': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
    case 'MEDIUM': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    default: return 'bg-muted text-muted-foreground';
  }
};

const getSeverityIcon = (severity: string) => {
  switch (severity) {
    case 'CRITICAL':
    case 'HIGH':
      return <AlertTriangle className="w-4 h-4" />;
    default:
      return <Shield className="w-4 h-4" />;
  }
};

export function ThreatDetectionDemo() {
  const [text, setText] = useState('');
  const [results, setResults] = useState<DetectionResult[]>([]);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  useEffect(() => {
    if (!loaded) {
      loadRules(rulesYaml);
      loaded = true;
    }
  }, []);

  const analyze = () => {
    if (!text.trim()) return;
    const detections = detectFastPath(text);
    setResults(detections);
    setHasAnalyzed(true);
  };

  const loadExample = (exampleText: string) => {
    setText(exampleText);
    setHasAnalyzed(false);
    setResults([]);
  };

  const isSafe = hasAnalyzed && results.length === 0;

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground self-center">Try an example:</span>
          {EXAMPLE_MESSAGES.map((example, idx) => (
            <Button
              key={idx}
              variant="outline"
              size="sm"
              onClick={() => loadExample(example.text)}
              className="text-xs"
            >
              {example.label}
            </Button>
          ))}
        </div>

        <Textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setHasAnalyzed(false);
            setResults([]);
          }}
          placeholder="Type a message to analyze for threats..."
          className="min-h-[120px] font-mono text-sm"
        />

        <Button 
          onClick={analyze} 
          disabled={!text.trim()}
          className="w-full sm:w-auto"
        >
          <Shield className="w-4 h-4 mr-2" />
          Analyze Message
        </Button>
      </div>

      {hasAnalyzed && (
        <Card className={`border-2 ${isSafe ? 'border-green-500/20 bg-green-500/5' : 'border-orange-500/20 bg-orange-500/5'}`}>
          <CardContent className="pt-6">
            {isSafe ? (
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-green-500 mb-1">Safe Message</h3>
                  <p className="text-sm text-muted-foreground">
                    No threats detected. This message appears safe.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-orange-500 mb-1">
                      {results.length} Threat{results.length > 1 ? 's' : ''} Detected
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Guardian would alert parents about this message
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {results.map((result, idx) => (
                    <div key={idx} className="rounded-lg border bg-card p-4 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={getSeverityColor(result.severity)}>
                          {getSeverityIcon(result.severity)}
                          <span className="ml-1.5">{result.severity}</span>
                        </Badge>
                        <span className="font-medium text-sm">{result.label.replace(/_/g, ' ')}</span>
                      </div>
                      
                      {result.reasons.length > 0 && (
                        <div className="text-xs text-muted-foreground space-y-1">
                          <p className="font-medium">Matched patterns:</p>
                          <ul className="list-disc list-inside space-y-0.5 pl-2">
                            {result.reasons.slice(0, 3).map((reason, ridx) => (
                              <li key={ridx}>{reason}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
