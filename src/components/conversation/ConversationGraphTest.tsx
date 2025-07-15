'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ConversationAction {
  type: 'add_skill' | 'add_company' | 'add_education' | 'update_profile' | 'none';
  entity: string;
  details: {
    proficiency?: string;
    experience?: number;
    role?: string;
    industry?: string;
    degree?: string;
    fieldOfStudy?: string;
    startDate?: string;
    endDate?: string;
  };
}

export function ConversationGraphTest() {
  const [input, setInput] = useState('');
  const [actions, setActions] = useState<ConversationAction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  const testInputs = [
    "I'm skilled in JavaScript and React, and I work at Meta as a Senior Developer",
    "I have 5 years of experience with Python and I'm an expert in machine learning",
    "I studied Computer Science at MIT and got my Masters from Stanford",
    "I worked at Google for 3 years as a Software Engineer in the AI team",
    "My skills include Java, Spring Boot, and I'm proficient in AWS cloud services",
    "I'm a beginner in TypeScript but I've been using Node.js for 2 years",
    "I graduated from Harvard with a degree in Business Administration"
  ];

  const handleParseInput = async () => {
    if (!input.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/conversation/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: input.trim() })
      });
      
      if (!response.ok) throw new Error('Failed to parse conversation');
      
      const result = await response.json();
      setActions(result.actions || []);
      setLastResult(result);
      
      // Trigger a page refresh to update the graph
      if (result.results && result.results.some((r: any) => r.success)) {
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (error) {
      console.error('Error parsing conversation:', error);
      setActions([]);
      setLastResult({ error: 'Failed to parse conversation' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestInput = (testInput: string) => {
    setInput(testInput);
  };

  const getActionTypeColor = (type: string) => {
    switch (type) {
      case 'add_skill': return 'bg-purple-100 text-purple-800';
      case 'add_company': return 'bg-green-100 text-green-800';
      case 'add_education': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🤖 Conversation Graph Parser Test
          <span className="text-sm text-muted-foreground font-normal">
            (Type natural language to see graph updates)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Test Input Buttons */}
        <div>
          <Label className="text-sm font-medium">Quick Test Examples:</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {testInputs.map((testInput, index) => (
              <Button
                key={index}
                onClick={() => handleTestInput(testInput)}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                Test {index + 1}
              </Button>
            ))}
          </div>
        </div>

        {/* Input Section */}
        <div className="space-y-2">
          <Label htmlFor="conversation-input">Enter your message:</Label>
          <div className="flex gap-2">
            <Input
              id="conversation-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g., I'm skilled in React and I work at Google as a Software Engineer"
              className="flex-1"
              onKeyDown={(e) => e.key === 'Enter' && handleParseInput()}
            />
            <Button 
              onClick={handleParseInput}
              disabled={isLoading || !input.trim()}
            >
              {isLoading ? 'Parsing...' : 'Parse & Update Graph'}
            </Button>
          </div>
        </div>

        {/* Results Section */}
        {lastResult && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Parsed Actions</h3>
              <span className="text-sm text-muted-foreground">
                {actions.length} actions found
              </span>
            </div>

            {actions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No actionable items found in your message.
                <br />
                Try mentioning skills, companies, or education!
              </div>
            ) : (
              <div className="grid gap-3">
                {actions.map((action, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-4 bg-gray-50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getActionTypeColor(action.type)}`}>
                            {action.type.replace('_', ' ').toUpperCase()}
                          </span>
                          <span className="font-medium">{action.entity}</span>
                        </div>
                        
                        {Object.keys(action.details).length > 0 && (
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            {Object.entries(action.details).map(([key, value]) => (
                              <div key={key} className="flex justify-between">
                                <span className="text-muted-foreground capitalize">
                                  {key.replace(/([A-Z])/g, ' $1').toLowerCase()}:
                                </span>
                                <span className="font-medium">{value}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Show creation result */}
                        {lastResult?.results && (
                          <div className="mt-2 text-xs">
                            {lastResult.results.map((result: any, idx: number) => (
                              result.type === action.type.replace('add_', '') && result.entity === action.entity && (
                                <div key={idx} className={`px-2 py-1 rounded ${
                                  result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {result.success ? '✓ Created successfully' : `✗ ${result.message || 'Failed to create'}`}
                                </div>
                              )
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="ml-4 text-xs text-muted-foreground">
                        #{index + 1}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Raw Response (for debugging) */}
            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                View Raw Response
              </summary>
              <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                {JSON.stringify(lastResult, null, 2)}
              </pre>
            </details>
          </div>
        )}

        {/* Instructions */}
        <div className="text-sm text-muted-foreground bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">💡 How it works:</h4>
          <ul className="space-y-1 text-blue-800">
            <li>• Type natural language about your professional background</li>
            <li>• The parser extracts skills, companies, and education</li>
            <li>• Actions are sent to the graph visualization in real-time</li>
            <li>• Watch the 3D graph update as you type!</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}