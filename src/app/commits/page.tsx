'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  GitCommit, 
  Check, 
  X, 
  Edit, 
  Eye, 
  MessageCircle, 
  Brain, 
  Clock,
  User,
  Building,
  GraduationCap,
  Target,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface ConversationCommit {
  id: string;
  extractionType: string;
  status: string;
  confidence: number;
  aiSummary: string;
  originalText: string;
  extractedData: any;
  suggestedEdits?: any;
  commitMessage?: string;
  reviewNotes?: string;
  targetLayer: string;
  createdAt: string;
  reviewedAt?: string;
  committedAt?: string;
  batch?: {
    id: string;
    batchTitle: string;
    batchType: string;
  };
}

interface CommitBatch {
  id: string;
  batchTitle: string;
  batchType: string;
  sessionSummary?: string;
  totalCommits: number;
  pendingCommits: number;
  approvedCommits: number;
  rejectedCommits: number;
  committedCommits: number;
  batchStatus: string;
  createdAt: string;
  commits: ConversationCommit[];
}

export default function CommitsPage() {
  const { isLoaded, userId } = useAuth();
  const [commits, setCommits] = useState<ConversationCommit[]>([]);
  const [batches, setBatches] = useState<CommitBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCommit, setSelectedCommit] = useState<ConversationCommit | null>(null);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [isExtractionDialogOpen, setIsExtractionDialogOpen] = useState(false);
  const [filter, setFilter] = useState({
    status: 'all',
    type: 'all',
    batch: 'all'
  });

  // Extraction form state
  const [extractionForm, setExtractionForm] = useState({
    conversationText: '',
    batchTitle: '',
    extractionMode: 'auto'
  });

  // Review form state
  const [reviewForm, setReviewForm] = useState({
    status: '',
    commitMessage: '',
    reviewNotes: '',
    suggestedEdits: {}
  });

  useEffect(() => {
    if (isLoaded && userId) {
      fetchCommits();
      fetchBatches();
    }
  }, [isLoaded, userId, filter]);

  const fetchCommits = async () => {
    try {
      const params = new URLSearchParams();
      if (filter.status !== 'all') params.append('status', filter.status);
      if (filter.type !== 'all') params.append('type', filter.type);
      if (filter.batch !== 'all') params.append('batchId', filter.batch);

      const response = await fetch(`/api/commits?${params}`);
      if (response.ok) {
        const data = await response.json();
        setCommits(data);
      }
    } catch (error) {
      console.error('Error fetching commits:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBatches = async () => {
    try {
      const response = await fetch('/api/commits/batches');
      if (response.ok) {
        const data = await response.json();
        setBatches(data);
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
    }
  };

  const handleExtractConversation = async () => {
    try {
      // First create a batch
      const batchResponse = await fetch('/api/commits/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchTitle: extractionForm.batchTitle || `Conversation - ${new Date().toLocaleDateString()}`,
          batchType: 'manual_extraction',
          sessionSummary: `Manual extraction from conversation text (${extractionForm.conversationText.length} characters)`
        })
      });

      if (!batchResponse.ok) {
        throw new Error('Failed to create batch');
      }

      const batch = await batchResponse.json();

      // Then extract the conversation
      const extractResponse = await fetch('/api/commits/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationText: extractionForm.conversationText,
          batchId: batch.id,
          extractionMode: extractionForm.extractionMode
        })
      });

      if (extractResponse.ok) {
        const result = await extractResponse.json();
        setExtractionForm({
          conversationText: '',
          batchTitle: '',
          extractionMode: 'auto'
        });
        setIsExtractionDialogOpen(false);
        fetchCommits();
        fetchBatches();
        
        alert(`Extracted ${result.summary.total} items from conversation`);
      }
    } catch (error) {
      console.error('Error extracting conversation:', error);
      alert('Failed to extract conversation');
    }
  };

  const handleReviewCommit = async (commitId: string, status: string, additionalData: any = {}) => {
    try {
      const response = await fetch('/api/commits', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: commitId,
          status,
          ...additionalData
        })
      });

      if (response.ok) {
        fetchCommits();
        fetchBatches();
        setIsReviewDialogOpen(false);
        setSelectedCommit(null);
      }
    } catch (error) {
      console.error('Error reviewing commit:', error);
    }
  };

  const handleProcessCommits = async (commitIds: string[]) => {
    try {
      const response = await fetch('/api/commits/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commitIds })
      });

      if (response.ok) {
        const result = await response.json();
        fetchCommits();
        fetchBatches();
        alert(`Processed ${result.results.successful.length} commits successfully`);
      }
    } catch (error) {
      console.error('Error processing commits:', error);
    }
  };

  const getTypeIcon = (type: string) => {
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      case 'committed': return <GitCommit className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your commits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <GitCommit className="h-8 w-8" />
          Conversation Commits
        </h1>
        <p className="text-gray-600 mt-2">
          Review and commit AI-extracted information from your conversations
        </p>
      </div>

      <Tabs defaultValue="commits" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="commits">Commits</TabsTrigger>
          <TabsTrigger value="batches">Batches</TabsTrigger>
          <TabsTrigger value="extract">Extract</TabsTrigger>
        </TabsList>

        <TabsContent value="commits">
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <Select value={filter.status} onValueChange={(value) => setFilter({...filter, status: value})}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="committed">Committed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filter.type} onValueChange={(value) => setFilter({...filter, type: value})}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="skill">Skills</SelectItem>
                <SelectItem value="experience">Experience</SelectItem>
                <SelectItem value="education">Education</SelectItem>
                <SelectItem value="objective">Objectives</SelectItem>
                <SelectItem value="key_result">Key Results</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              onClick={() => {
                const approvedCommits = commits.filter(c => c.status === 'approved');
                if (approvedCommits.length > 0) {
                  handleProcessCommits(approvedCommits.map(c => c.id));
                }
              }}
              disabled={!commits.some(c => c.status === 'approved')}
            >
              <GitCommit className="h-4 w-4 mr-2" />
              Commit All Approved
            </Button>
          </div>

          {/* Commits Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {commits.map((commit) => (
              <Card key={commit.id} className="h-fit">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(commit.extractionType)}
                      <CardTitle className="text-lg capitalize">{commit.extractionType}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`${getStatusColor(commit.status)} text-white`}>
                        {getStatusIcon(commit.status)}
                        <span className="ml-1">{commit.status}</span>
                      </Badge>
                      <Badge variant="outline">
                        {Math.round(commit.confidence * 100)}%
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{commit.aiSummary}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm">
                      <span className="font-medium">Original text:</span>
                      <p className="text-gray-600 italic">"{commit.originalText}"</p>
                    </div>
                    
                    {commit.batch && (
                      <div className="text-sm">
                        <span className="font-medium">Batch:</span>
                        <p className="text-gray-600">{commit.batch.batchTitle}</p>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedCommit(commit);
                          setReviewForm({
                            status: commit.status,
                            commitMessage: commit.commitMessage || '',
                            reviewNotes: commit.reviewNotes || '',
                            suggestedEdits: commit.suggestedEdits || {}
                          });
                          setIsReviewDialogOpen(true);
                        }}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Review
                      </Button>
                      
                      {commit.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleReviewCommit(commit.id, 'approved')}
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReviewCommit(commit.id, 'rejected')}
                          >
                            <X className="h-3 w-3 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                      
                      {commit.status === 'approved' && (
                        <Button
                          size="sm"
                          onClick={() => handleProcessCommits([commit.id])}
                        >
                          <GitCommit className="h-3 w-3 mr-1" />
                          Commit
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {commits.length === 0 && (
            <div className="text-center py-12">
              <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No commits yet</h3>
              <p className="text-gray-600 mb-4">Start by extracting data from your conversations.</p>
              <Button onClick={() => setIsExtractionDialogOpen(true)}>
                <Brain className="h-4 w-4 mr-2" />
                Extract Conversation
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="batches">
          <div className="space-y-4">
            {batches.map((batch) => (
              <Card key={batch.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{batch.batchTitle}</CardTitle>
                    <Badge variant="outline">{batch.batchType}</Badge>
                  </div>
                  {batch.sessionSummary && (
                    <p className="text-sm text-gray-600">{batch.sessionSummary}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold">{batch.totalCommits}</div>
                      <div className="text-sm text-gray-600">Total</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-yellow-600">{batch.pendingCommits}</div>
                      <div className="text-sm text-gray-600">Pending</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">{batch.approvedCommits}</div>
                      <div className="text-sm text-gray-600">Approved</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-600">{batch.rejectedCommits}</div>
                      <div className="text-sm text-gray-600">Rejected</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{batch.committedCommits}</div>
                      <div className="text-sm text-gray-600">Committed</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="extract">
          <Card>
            <CardHeader>
              <CardTitle>Extract Conversation Data</CardTitle>
              <p className="text-sm text-gray-600">
                Paste conversation text to extract skills, experience, education, and goals
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="batchTitle">Batch Title</Label>
                  <Input
                    id="batchTitle"
                    value={extractionForm.batchTitle}
                    onChange={(e) => setExtractionForm({...extractionForm, batchTitle: e.target.value})}
                    placeholder="e.g., Voice Session - Today"
                  />
                </div>
                
                <div>
                  <Label htmlFor="conversationText">Conversation Text</Label>
                  <Textarea
                    id="conversationText"
                    value={extractionForm.conversationText}
                    onChange={(e) => setExtractionForm({...extractionForm, conversationText: e.target.value})}
                    placeholder="Paste your conversation text here..."
                    rows={8}
                  />
                </div>

                <div>
                  <Label htmlFor="extractionMode">Extraction Mode</Label>
                  <Select value={extractionForm.extractionMode} onValueChange={(value) => setExtractionForm({...extractionForm, extractionMode: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select extraction mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto - Extract everything</SelectItem>
                      <SelectItem value="manual">Manual - Review each item</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={handleExtractConversation}
                  disabled={!extractionForm.conversationText.trim()}
                >
                  <Brain className="h-4 w-4 mr-2" />
                  Extract Conversation
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Review Commit</DialogTitle>
          </DialogHeader>
          {selectedCommit && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">AI Summary</h4>
                <p className="text-sm">{selectedCommit.aiSummary}</p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Original Text</h4>
                <p className="text-sm italic bg-gray-50 p-2 rounded">"{selectedCommit.originalText}"</p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Extracted Data</h4>
                <pre className="text-sm bg-gray-50 p-2 rounded overflow-auto">
                  {JSON.stringify(selectedCommit.extractedData, null, 2)}
                </pre>
              </div>

              <div>
                <Label htmlFor="reviewNotes">Review Notes</Label>
                <Textarea
                  id="reviewNotes"
                  value={reviewForm.reviewNotes}
                  onChange={(e) => setReviewForm({...reviewForm, reviewNotes: e.target.value})}
                  placeholder="Add your review notes..."
                />
              </div>

              <div>
                <Label htmlFor="commitMessage">Commit Message</Label>
                <Input
                  id="commitMessage"
                  value={reviewForm.commitMessage}
                  onChange={(e) => setReviewForm({...reviewForm, commitMessage: e.target.value})}
                  placeholder="Add descriptive commit message..."
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsReviewDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => handleReviewCommit(selectedCommit.id, 'rejected', {
                    reviewNotes: reviewForm.reviewNotes,
                    commitMessage: reviewForm.commitMessage
                  })}
                >
                  <X className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button 
                  onClick={() => handleReviewCommit(selectedCommit.id, 'approved', {
                    reviewNotes: reviewForm.reviewNotes,
                    commitMessage: reviewForm.commitMessage
                  })}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}