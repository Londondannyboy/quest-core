'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MessageCircle, 
  Send, 
  Mic, 
  MicOff, 
  Brain, 
  CheckCircle,
  Clock,
  Building,
  GraduationCap,
  Target,
  TrendingUp,
  User,
  Zap,
  GitCommit,
  Play,
  Pause,
  Square,
  RefreshCw,
  TestTube
} from 'lucide-react';
import TestScenarios from './test-scenarios';

interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  extractedEntities?: any[];
}

interface LiveExtraction {
  id: string;
  type: 'skill' | 'experience' | 'education' | 'objective' | 'key_result';
  entity: string;
  confidence: number;
  details: any;
  status: 'pending' | 'approved' | 'rejected' | 'committed';
  timestamp: Date;
  commitId?: string;
}

interface ConversationSession {
  id: string;
  title: string;
  mode: 'chat' | 'voice' | 'hybrid';
  status: 'active' | 'paused' | 'completed';
  startTime: Date;
  endTime?: Date;
  extractionCount: number;
  batchId?: string;
}

export default function ConversationPage() {
  const { isLoaded, userId } = useAuth();
  const [session, setSession] = useState<ConversationSession | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [liveExtractions, setLiveExtractions] = useState<LiveExtraction[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [autoExtraction, setAutoExtraction] = useState(true);
  const [extractionMode, setExtractionMode] = useState<'realtime' | 'batch' | 'manual'>('realtime');
  const [commitmentInsights, setCommitmentInsights] = useState<any[]>([]);
  const [commitmentScore, setCommitmentScore] = useState(0);
  const [dominantCommitmentType, setDominantCommitmentType] = useState('none');
  const [showTestScenarios, setShowTestScenarios] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (isLoaded && userId) {
      initializeSession();
    }
  }, [isLoaded, userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeSession = async () => {
    const newSession: ConversationSession = {
      id: crypto.randomUUID(),
      title: `Session - ${new Date().toLocaleTimeString()}`,
      mode: 'chat',
      status: 'active',
      startTime: new Date(),
      extractionCount: 0
    };

    setSession(newSession);
    
    // Add welcome message
    const welcomeMessage: ConversationMessage = {
      id: crypto.randomUUID(),
      role: 'system',
      content: 'Hi! I\'m your conversation agent. Tell me about your experiences, skills, education, or goals and I\'ll help you build your professional repository in real-time.',
      timestamp: new Date()
    };
    
    setMessages([welcomeMessage]);
  };

  const sendMessage = async () => {
    if (!currentMessage.trim() || !session) return;

    const userMessage: ConversationMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: currentMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsProcessing(true);

    try {
      // Process message for extractions if auto-extraction is enabled
      if (autoExtraction && extractionMode === 'realtime') {
        await processMessageForExtractions(currentMessage);
      }

      // Analyze commitment insights
      const { ConversationParser } = await import('@/lib/conversation-parser');
      const analysis = ConversationParser.parseWithCommitmentInsights(currentMessage);
      
      // Update commitment insights state
      setCommitmentInsights(prev => [...prev, ...analysis.commitmentInsights]);
      setCommitmentScore(analysis.commitmentScore);
      setDominantCommitmentType(analysis.dominantCommitmentType);

      // Generate AI response
      const aiResponse = await generateAIResponse(currentMessage, messages);
      const assistantMessage: ConversationMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error processing message:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const processMessageForExtractions = async (messageContent: string) => {
    try {
      // Create or get current batch
      if (!session?.batchId) {
        const batchResponse = await fetch('/api/commits/batches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            batchTitle: session?.title || 'Conversation Session',
            batchType: 'live_conversation',
            sessionSummary: `Live conversation session started at ${session?.startTime.toLocaleTimeString()}`
          })
        });

        if (batchResponse.ok) {
          const batch = await batchResponse.json();
          setSession(prev => prev ? { ...prev, batchId: batch.id } : null);
        }
      }

      // Extract entities from message
      const extractResponse = await fetch('/api/commits/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationText: messageContent,
          batchId: session?.batchId,
          extractionMode: 'auto'
        })
      });

      if (extractResponse.ok) {
        const extractData = await extractResponse.json();
        
        // Convert commits to live extractions
        const newExtractions: LiveExtraction[] = extractData.commits.map((commit: any) => ({
          id: commit.id,
          type: commit.extractionType,
          entity: commit.extractedData.extractedEntity,
          confidence: commit.confidence,
          details: commit.extractedData,
          status: 'pending',
          timestamp: new Date(commit.createdAt),
          commitId: commit.id
        }));

        setLiveExtractions(prev => [...prev, ...newExtractions]);
        
        // Update session extraction count
        setSession(prev => prev ? { 
          ...prev, 
          extractionCount: prev.extractionCount + newExtractions.length 
        } : null);
      }
    } catch (error) {
      console.error('Error processing extractions:', error);
    }
  };

  const generateAIResponse = async (userMessage: string, conversationHistory: ConversationMessage[]) => {
    // Use enhanced parser with commitment insights
    const { ConversationParser } = await import('@/lib/conversation-parser');
    const analysis = ConversationParser.parseWithCommitmentInsights(userMessage);
    
    // Generate response based on commitment analysis
    const commitmentResponse = ConversationParser.generateCommitmentResponse(analysis);
    
    // Add philosophical reflection if high commitment score
    if (analysis.commitmentScore >= 70) {
      return `${commitmentResponse}\n\n💭 Reflection: ${analysis.philosophicalReflection}`;
    }
    
    return commitmentResponse;
  };

  const handleExtractionAction = async (extractionId: string, action: 'approve' | 'reject') => {
    const extraction = liveExtractions.find(e => e.id === extractionId);
    if (!extraction?.commitId) return;

    try {
      const response = await fetch('/api/commits', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: extraction.commitId,
          status: action === 'approve' ? 'approved' : 'rejected'
        })
      });

      if (response.ok) {
        setLiveExtractions(prev => 
          prev.map(e => 
            e.id === extractionId 
              ? { ...e, status: action === 'approve' ? 'approved' : 'rejected' }
              : e
          )
        );
      }
    } catch (error) {
      console.error('Error updating extraction:', error);
    }
  };

  const commitApprovedExtractions = async () => {
    const approvedExtractions = liveExtractions.filter(e => e.status === 'approved');
    if (approvedExtractions.length === 0) return;

    try {
      const response = await fetch('/api/commits/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commitIds: approvedExtractions.map(e => e.commitId)
        })
      });

      if (response.ok) {
        setLiveExtractions(prev => 
          prev.map(e => 
            e.status === 'approved' 
              ? { ...e, status: 'committed' }
              : e
          )
        );
      }
    } catch (error) {
      console.error('Error committing extractions:', error);
    }
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        // Here you would send the audio to your speech-to-text service
        // For now, we'll just show a placeholder
        setCurrentMessage('(Voice message transcribed)');
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting voice recording:', error);
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleRunScenario = (scenario: any) => {
    setCurrentMessage(scenario.sampleText);
    setShowTestScenarios(false);
  };

  const getExtractionIcon = (type: string) => {
    switch (type) {
      case 'skill': return <Brain className="h-4 w-4" />;
      case 'experience': return <Building className="h-4 w-4" />;
      case 'education': return <GraduationCap className="h-4 w-4" />;
      case 'objective': return <Target className="h-4 w-4" />;
      case 'key_result': return <TrendingUp className="h-4 w-4" />;
      default: return <MessageCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'approved': return 'bg-green-500';
      case 'rejected': return 'bg-red-500';
      case 'committed': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading conversation agent...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <MessageCircle className="h-8 w-8" />
          Conversation Agent
        </h1>
        <p className="text-gray-600 mt-2">
          Chat naturally about your experiences and I&apos;ll help build your professional repository
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chat Interface */}
        <div className="lg:col-span-2">
          {showTestScenarios && (
            <div className="mb-4">
              <TestScenarios onRunScenario={handleRunScenario} />
            </div>
          )}
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {session?.title || 'Conversation Session'}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTestScenarios(!showTestScenarios)}
                  >
                    <TestTube className="h-4 w-4 mr-1" />
                    Test
                  </Button>
                  <Badge variant={session?.status === 'active' ? 'default' : 'secondary'}>
                    {session?.status || 'inactive'}
                  </Badge>
                  <Badge variant="outline">
                    {session?.extractionCount || 0} extracted
                  </Badge>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col">
              {/* Messages */}
              <ScrollArea className="flex-1 mb-4 p-4 border rounded-lg">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${
                          message.role === 'user'
                            ? 'bg-blue-500 text-white'
                            : message.role === 'system'
                            ? 'bg-gray-100 text-gray-700'
                            : 'bg-gray-200 text-gray-800'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <span className="text-xs opacity-70 mt-1 block">
                          {message.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                  {isProcessing && (
                    <div className="flex justify-start">
                      <div className="bg-gray-200 p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Processing...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Textarea
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    placeholder="Tell me about your experience, skills, education, or goals..."
                    className="flex-1 min-h-[60px] resize-none"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                  />
                  <div className="flex flex-col gap-1">
                    <Button
                      onClick={sendMessage}
                      disabled={!currentMessage.trim() || isProcessing}
                      size="sm"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                      disabled={isProcessing}
                    >
                      {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                
                {/* Controls */}
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="autoExtraction"
                      checked={autoExtraction}
                      onChange={(e) => setAutoExtraction(e.target.checked)}
                    />
                    <Label htmlFor="autoExtraction">Auto-extract</Label>
                  </div>
                  
                  <Select value={extractionMode} onValueChange={(value: any) => setExtractionMode(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="realtime">Real-time</SelectItem>
                      <SelectItem value="batch">Batch</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Commitment Insights */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Commitment Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{commitmentScore}%</div>
                  <div className="text-sm text-gray-600">Commitment Score</div>
                </div>
                
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-800">{dominantCommitmentType}</div>
                  <div className="text-xs text-gray-600">Primary Focus</div>
                </div>

                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">{commitmentInsights.length}</div>
                  <div className="text-xs text-gray-600">Commitments Detected</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {commitmentInsights.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Recent Commitments</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-3">
                    {commitmentInsights.slice(-5).reverse().map((insight, index) => (
                      <div key={index} className="border rounded-lg p-3 text-sm">
                        <div className="flex items-center justify-between mb-1">
                          <Badge variant="outline" className="text-xs">
                            {insight.category}
                          </Badge>
                          <Badge 
                            className={`text-xs ${
                              insight.intensity === 'life_changing' ? 'bg-red-500' :
                              insight.intensity === 'high' ? 'bg-orange-500' :
                              insight.intensity === 'medium' ? 'bg-yellow-500' :
                              'bg-green-500'
                            } text-white`}
                          >
                            {insight.intensity}
                          </Badge>
                        </div>
                        <p className="font-medium text-gray-800">{insight.commitment_statement}</p>
                        <p className="text-xs text-gray-600 mt-1">{insight.philosophical_significance}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Live Extractions */}
        <div className="space-y-4">
          {/* Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Live Extractions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 text-center text-sm">
                <div>
                  <div className="text-lg font-bold text-yellow-600">
                    {liveExtractions.filter(e => e.status === 'pending').length}
                  </div>
                  <div className="text-gray-600">Pending</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-green-600">
                    {liveExtractions.filter(e => e.status === 'approved').length}
                  </div>
                  <div className="text-gray-600">Approved</div>
                </div>
              </div>
              
              <Button 
                onClick={commitApprovedExtractions}
                disabled={!liveExtractions.some(e => e.status === 'approved')}
                className="w-full mt-4"
                size="sm"
              >
                <GitCommit className="h-4 w-4 mr-2" />
                Commit All Approved
              </Button>
            </CardContent>
          </Card>

          {/* Extractions List */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Recent Extractions</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {liveExtractions.slice(-10).reverse().map((extraction) => (
                    <div key={extraction.id} className="border rounded-lg p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getExtractionIcon(extraction.type)}
                          <span className="font-medium text-sm capitalize">{extraction.type}</span>
                        </div>
                        <Badge className={`${getStatusColor(extraction.status)} text-white text-xs`}>
                          {extraction.status}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-gray-700 mb-2">{extraction.entity}</p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {Math.round(extraction.confidence * 100)}% confidence
                        </span>
                        
                        {extraction.status === 'pending' && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleExtractionAction(extraction.id, 'approve')}
                            >
                              <CheckCircle className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleExtractionAction(extraction.id, 'reject')}
                            >
                              <Clock className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {liveExtractions.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Brain className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No extractions yet</p>
                      <p className="text-xs">Start chatting to see live extractions</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}