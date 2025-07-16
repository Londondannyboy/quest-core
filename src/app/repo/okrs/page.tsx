'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CalendarIcon, Plus, Target, TrendingUp, CheckCircle, Clock, Edit, Trash2, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';

interface KeyResult {
  id: string;
  title: string;
  description?: string;
  measurementType?: string;
  targetValue?: number;
  currentValue?: number;
  unit?: string;
  status: string;
  dueDate?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface Objective {
  id: string;
  title: string;
  description?: string;
  category?: string;
  priority?: string;
  timeframe?: string;
  targetDate?: Date;
  status: string;
  progressScore?: number;
  createdAt: Date;
  updatedAt: Date;
  keyResults: KeyResult[];
}

interface ObjectiveFormData {
  title: string;
  description: string;
  category: string;
  priority: string;
  timeframe: string;
  targetDate?: Date;
}

interface KeyResultFormData {
  title: string;
  description: string;
  measurementType: string;
  targetValue: number;
  unit: string;
  dueDate?: Date;
}

export default function OKRsPage() {
  const { isLoaded, userId } = useAuth();
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [loading, setLoading] = useState(true);
  const [isObjectiveDialogOpen, setIsObjectiveDialogOpen] = useState(false);
  const [isKeyResultDialogOpen, setIsKeyResultDialogOpen] = useState(false);
  const [selectedObjective, setSelectedObjective] = useState<Objective | null>(null);
  const [editingObjective, setEditingObjective] = useState<Objective | null>(null);
  const [editingKeyResult, setEditingKeyResult] = useState<KeyResult | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const [objectiveForm, setObjectiveForm] = useState<ObjectiveFormData>({
    title: '',
    description: '',
    category: '',
    priority: '',
    timeframe: '',
    targetDate: undefined
  });

  const [keyResultForm, setKeyResultForm] = useState<KeyResultFormData>({
    title: '',
    description: '',
    measurementType: '',
    targetValue: 0,
    unit: '',
    dueDate: undefined
  });

  useEffect(() => {
    if (isLoaded && userId) {
      fetchObjectives();
    }
  }, [isLoaded, userId, filterStatus, filterCategory]);

  const fetchObjectives = async () => {
    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterCategory !== 'all') params.append('category', filterCategory);
      
      const response = await fetch(`/api/objectives?${params}`);
      const data = await response.json();
      setObjectives(data);
    } catch (error) {
      console.error('Error fetching objectives:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateObjective = async () => {
    try {
      const response = await fetch('/api/objectives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(objectiveForm)
      });

      if (response.ok) {
        setObjectiveForm({
          title: '',
          description: '',
          category: '',
          priority: '',
          timeframe: '',
          targetDate: undefined
        });
        setIsObjectiveDialogOpen(false);
        fetchObjectives();
      }
    } catch (error) {
      console.error('Error creating objective:', error);
    }
  };

  const handleUpdateObjective = async () => {
    if (!editingObjective) return;

    try {
      const response = await fetch('/api/objectives', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...objectiveForm, id: editingObjective.id })
      });

      if (response.ok) {
        setEditingObjective(null);
        setIsObjectiveDialogOpen(false);
        fetchObjectives();
      }
    } catch (error) {
      console.error('Error updating objective:', error);
    }
  };

  const handleCreateKeyResult = async () => {
    if (!selectedObjective) return;

    try {
      const response = await fetch('/api/key-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...keyResultForm,
          objectiveId: selectedObjective.id
        })
      });

      if (response.ok) {
        setKeyResultForm({
          title: '',
          description: '',
          measurementType: '',
          targetValue: 0,
          unit: '',
          dueDate: undefined
        });
        setIsKeyResultDialogOpen(false);
        fetchObjectives();
      }
    } catch (error) {
      console.error('Error creating key result:', error);
    }
  };

  const handleUpdateKeyResult = async (keyResult: KeyResult, updates: Partial<KeyResult>) => {
    try {
      const response = await fetch('/api/key-results', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...updates, id: keyResult.id })
      });

      if (response.ok) {
        fetchObjectives();
      }
    } catch (error) {
      console.error('Error updating key result:', error);
    }
  };

  const calculateObjectiveProgress = (objective: Objective): number => {
    if (objective.keyResults.length === 0) return 0;
    
    const totalProgress = objective.keyResults.reduce((sum, kr) => {
      if (kr.status === 'completed') return sum + 100;
      if (kr.targetValue && kr.currentValue) {
        return sum + Math.min((kr.currentValue / kr.targetValue) * 100, 100);
      }
      return sum;
    }, 0);

    return Math.round(totalProgress / objective.keyResults.length);
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'active': return 'bg-blue-500';
      case 'on_hold': return 'bg-yellow-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your OKRs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Target className="h-8 w-8" />
          Objectives & Key Results
        </h1>
        <p className="text-gray-600 mt-2">
          Track your goals and measure progress with the OKR methodology
        </p>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-wrap gap-4 mb-6">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="on_hold">On Hold</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="professional">Professional</SelectItem>
            <SelectItem value="personal">Personal</SelectItem>
            <SelectItem value="learning">Learning</SelectItem>
            <SelectItem value="health">Health</SelectItem>
          </SelectContent>
        </Select>

        <Dialog open={isObjectiveDialogOpen} onOpenChange={setIsObjectiveDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingObjective(null);
              setObjectiveForm({
                title: '',
                description: '',
                category: '',
                priority: '',
                timeframe: '',
                targetDate: undefined
              });
            }}>
              <Plus className="h-4 w-4 mr-2" />
              New Objective
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingObjective ? 'Edit Objective' : 'Create New Objective'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={objectiveForm.title}
                  onChange={(e) => setObjectiveForm({...objectiveForm, title: e.target.value})}
                  placeholder="Enter objective title"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={objectiveForm.description}
                  onChange={(e) => setObjectiveForm({...objectiveForm, description: e.target.value})}
                  placeholder="Describe your objective"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={objectiveForm.category} onValueChange={(value) => setObjectiveForm({...objectiveForm, category: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="personal">Personal</SelectItem>
                      <SelectItem value="learning">Learning</SelectItem>
                      <SelectItem value="health">Health</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={objectiveForm.priority} onValueChange={(value) => setObjectiveForm({...objectiveForm, priority: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="timeframe">Timeframe</Label>
                  <Select value={objectiveForm.timeframe} onValueChange={(value) => setObjectiveForm({...objectiveForm, timeframe: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select timeframe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quarter">Quarter</SelectItem>
                      <SelectItem value="half-year">Half Year</SelectItem>
                      <SelectItem value="year">Year</SelectItem>
                      <SelectItem value="ongoing">Ongoing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="targetDate">Target Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {objectiveForm.targetDate ? format(objectiveForm.targetDate, 'PPP') : 'Select date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={objectiveForm.targetDate}
                        onSelect={(date) => setObjectiveForm({...objectiveForm, targetDate: date})}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsObjectiveDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={editingObjective ? handleUpdateObjective : handleCreateObjective}>
                  {editingObjective ? 'Update' : 'Create'} Objective
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Objectives Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {objectives.map((objective) => {
          const progress = calculateObjectiveProgress(objective);
          
          return (
            <Card key={objective.id} className="h-fit">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{objective.title}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">{objective.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`${getPriorityColor(objective.priority)} text-white`}>
                      {objective.priority}
                    </Badge>
                    <Badge className={`${getStatusColor(objective.status)} text-white`}>
                      {objective.status}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-3">
                  <Badge variant="outline">{objective.category}</Badge>
                  <Badge variant="outline">{objective.timeframe}</Badge>
                  {objective.targetDate && (
                    <Badge variant="outline" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      {format(new Date(objective.targetDate), 'MMM d, yyyy')}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Progress</span>
                      <span className="text-sm text-gray-600">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Key Results ({objective.keyResults.length})</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedObjective(objective);
                          setKeyResultForm({
                            title: '',
                            description: '',
                            measurementType: '',
                            targetValue: 0,
                            unit: '',
                            dueDate: undefined
                          });
                          setIsKeyResultDialogOpen(true);
                        }}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    {objective.keyResults.map((kr) => (
                      <div key={kr.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{kr.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={`${getStatusColor(kr.status)} text-white text-xs`}>
                              {kr.status}
                            </Badge>
                            {kr.targetValue && (
                              <span className="text-xs text-gray-600">
                                {kr.currentValue || 0} / {kr.targetValue} {kr.unit}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {kr.status === 'completed' ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleUpdateKeyResult(kr, { status: 'completed' })}
                            >
                              <CheckCircle className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Key Result Dialog */}
      <Dialog open={isKeyResultDialogOpen} onOpenChange={setIsKeyResultDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Key Result</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="kr-title">Title</Label>
              <Input
                id="kr-title"
                value={keyResultForm.title}
                onChange={(e) => setKeyResultForm({...keyResultForm, title: e.target.value})}
                placeholder="Enter key result title"
              />
            </div>
            <div>
              <Label htmlFor="kr-description">Description</Label>
              <Textarea
                id="kr-description"
                value={keyResultForm.description}
                onChange={(e) => setKeyResultForm({...keyResultForm, description: e.target.value})}
                placeholder="Describe your key result"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="measurementType">Measurement Type</Label>
                <Select value={keyResultForm.measurementType} onValueChange={(value) => setKeyResultForm({...keyResultForm, measurementType: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="boolean">Yes/No</SelectItem>
                    <SelectItem value="currency">Currency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="unit">Unit</Label>
                <Input
                  id="unit"
                  value={keyResultForm.unit}
                  onChange={(e) => setKeyResultForm({...keyResultForm, unit: e.target.value})}
                  placeholder="e.g., %, users, $"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="targetValue">Target Value</Label>
              <Input
                id="targetValue"
                type="number"
                value={keyResultForm.targetValue}
                onChange={(e) => setKeyResultForm({...keyResultForm, targetValue: parseFloat(e.target.value)})}
                placeholder="Enter target value"
              />
            </div>
            <div>
              <Label htmlFor="dueDate">Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {keyResultForm.dueDate ? format(keyResultForm.dueDate, 'PPP') : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={keyResultForm.dueDate}
                    onSelect={(date) => setKeyResultForm({...keyResultForm, dueDate: date})}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsKeyResultDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateKeyResult}>
                Create Key Result
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Empty State */}
      {objectives.length === 0 && (
        <div className="text-center py-12">
          <Target className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No objectives yet</h3>
          <p className="text-gray-600 mb-4">Start by creating your first objective to track your goals.</p>
          <Button onClick={() => setIsObjectiveDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Objective
          </Button>
        </div>
      )}
    </div>
  );
}