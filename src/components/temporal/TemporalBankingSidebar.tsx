'use client';

import { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, Archive, CheckCircle, X, Clock, Target, BookOpen, Award, Briefcase } from 'lucide-react';
import { format } from 'date-fns';

interface BankedItem {
  id: string;
  type: 'job' | 'skill' | 'education' | 'certification' | 'project' | 'okr' | 'todo';
  name: string;
  description?: string;
  metadata: Record<string, any>;
  bankedAt: Date;
  // Temporal fields for when committed
  t_valid?: Date;
  t_invalid?: Date;
  committed: boolean;
}

interface NewItemForm {
  type: 'job' | 'skill' | 'education' | 'certification' | 'project' | 'okr' | 'todo';
  name: string;
  description: string;
  startDate: Date;
  endDate?: Date;
  metadata: Record<string, any>;
}

export function TemporalBankingSidebar() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const [bankedItems, setBankedItems] = useState<BankedItem[]>([]);
  const [showNewItemForm, setShowNewItemForm] = useState(false);
  const [newItem, setNewItem] = useState<NewItemForm>({
    type: 'skill',
    name: '',
    description: '',
    startDate: new Date(),
    metadata: {}
  });
  const [isCommitting, setIsCommitting] = useState<string | null>(null);

  // Load banked items from localStorage
  useEffect(() => {
    if (user) {
      const stored = localStorage.getItem(`banked-items-${user.id}`);
      if (stored) {
        const items = JSON.parse(stored);
        setBankedItems(items.map((item: any) => ({
          ...item,
          bankedAt: new Date(item.bankedAt),
          t_valid: item.t_valid ? new Date(item.t_valid) : undefined,
          t_invalid: item.t_invalid ? new Date(item.t_invalid) : undefined
        })));
      }
    }
  }, [user]);

  // Save banked items to localStorage
  const saveBankedItems = (items: BankedItem[]) => {
    if (user) {
      localStorage.setItem(`banked-items-${user.id}`, JSON.stringify(items));
    }
  };

  // Add item to bank
  const bankItem = () => {
    if (!newItem.name.trim()) return;

    const bankedItem: BankedItem = {
      id: `${newItem.type}-${Date.now()}`,
      type: newItem.type,
      name: newItem.name,
      description: newItem.description,
      metadata: {
        ...newItem.metadata,
        startDate: newItem.startDate.toISOString(),
        endDate: newItem.endDate?.toISOString()
      },
      bankedAt: new Date(),
      committed: false
    };

    const updatedItems = [...bankedItems, bankedItem];
    setBankedItems(updatedItems);
    saveBankedItems(updatedItems);

    // Reset form
    setNewItem({
      type: 'skill',
      name: '',
      description: '',
      startDate: new Date(),
      metadata: {}
    });
    setShowNewItemForm(false);
  };

  // Commit item to temporal timeline
  const commitItem = async (item: BankedItem) => {
    setIsCommitting(item.id);

    try {
      // Prepare temporal event data
      const temporalEvent = {
        type: item.type,
        entityId: item.id,
        entityName: item.name,
        metadata: item.metadata,
        t_valid: item.metadata.startDate || new Date().toISOString(),
        t_invalid: item.metadata.endDate || null
      };

      // Send to temporal API
      const response = await fetch('/api/temporal/timeline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(temporalEvent)
      });

      if (response.ok) {
        // Mark item as committed
        const updatedItems = bankedItems.map(bankedItem =>
          bankedItem.id === item.id
            ? { ...bankedItem, committed: true }
            : bankedItem
        );
        setBankedItems(updatedItems);
        saveBankedItems(updatedItems);
        
        // Emit event for graph update
        if (typeof window !== 'undefined' && (window as any).socket) {
          (window as any).socket.emit('temporal-update', {
            action: 'commit',
            item: temporalEvent
          });
        }
      } else {
        throw new Error('Failed to commit item');
      }
    } catch (error) {
      console.error('Error committing item:', error);
      alert('Failed to commit item to timeline');
    } finally {
      setIsCommitting(null);
    }
  };

  // Remove item from bank
  const removeItem = (itemId: string) => {
    const updatedItems = bankedItems.filter(item => item.id !== itemId);
    setBankedItems(updatedItems);
    saveBankedItems(updatedItems);
  };

  // Get icon for item type
  const getItemIcon = (type: string) => {
    switch (type) {
      case 'job': return <Briefcase className="h-4 w-4" />;
      case 'skill': return <Award className="h-4 w-4" />;
      case 'education': return <BookOpen className="h-4 w-4" />;
      case 'certification': return <Award className="h-4 w-4" />;
      case 'project': return <Target className="h-4 w-4" />;
      case 'okr': return <Target className="h-4 w-4" />;
      case 'todo': return <CheckCircle className="h-4 w-4" />;
      default: return <Archive className="h-4 w-4" />;
    }
  };

  // Get color for item type
  const getItemColor = (type: string) => {
    switch (type) {
      case 'job': return 'bg-blue-100 text-blue-800';
      case 'skill': return 'bg-purple-100 text-purple-800';
      case 'education': return 'bg-yellow-100 text-yellow-800';
      case 'certification': return 'bg-green-100 text-green-800';
      case 'project': return 'bg-red-100 text-red-800';
      case 'okr': return 'bg-orange-100 text-orange-800';
      case 'todo': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isSignedIn) {
    return (
      <Card className="w-80">
        <CardContent className="p-4">
          <div className="text-center text-muted-foreground">
            Sign in to bank timeline items
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-80 max-h-screen overflow-y-auto">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Archive className="h-5 w-5" />
          Timeline Banking
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          Collect and commit events to your timeline
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Add New Item Button */}
        <Button 
          onClick={() => setShowNewItemForm(true)}
          className="w-full"
          variant="outline"
        >
          <Plus className="h-4 w-4 mr-2" />
          Bank New Item
        </Button>

        {/* New Item Form */}
        {showNewItemForm && (
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Bank New Item</h4>
                <Button 
                  onClick={() => setShowNewItemForm(false)}
                  variant="ghost"
                  size="sm"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select value={newItem.type} onValueChange={(value: any) => setNewItem({...newItem, type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="job">Job</SelectItem>
                      <SelectItem value="skill">Skill</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="certification">Certification</SelectItem>
                      <SelectItem value="project">Project</SelectItem>
                      <SelectItem value="okr">OKR</SelectItem>
                      <SelectItem value="todo">Todo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={newItem.name}
                    onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                    placeholder="Enter item name"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newItem.description}
                    onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                    placeholder="Enter description"
                    rows={2}
                  />
                </div>

                <div>
                  <Label>Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(newItem.startDate, 'PPP')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={newItem.startDate}
                        onSelect={(date) => date && setNewItem({...newItem, startDate: date})}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="flex gap-2">
                  <Button onClick={bankItem} className="flex-1">
                    <Archive className="h-4 w-4 mr-2" />
                    Bank Item
                  </Button>
                  <Button 
                    onClick={() => setShowNewItemForm(false)}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Banked Items List */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Banked Items ({bankedItems.length})</h4>
          
          {bankedItems.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-8">
              <Archive className="h-8 w-8 mx-auto mb-2 opacity-50" />
              No items banked yet
            </div>
          ) : (
            bankedItems.map((item) => (
              <Card key={item.id} className="p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getItemIcon(item.type)}
                      <span className="font-medium text-sm">{item.name}</span>
                      <Badge className={`text-xs ${getItemColor(item.type)}`}>
                        {item.type}
                      </Badge>
                    </div>
                    
                    {item.description && (
                      <p className="text-xs text-muted-foreground mb-2">
                        {item.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      Banked {format(item.bankedAt, 'MMM d, yyyy')}
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    {item.committed ? (
                      <Badge variant="secondary" className="text-xs">
                        Committed
                      </Badge>
                    ) : (
                      <Button
                        onClick={() => commitItem(item)}
                        disabled={isCommitting === item.id}
                        size="sm"
                        variant="outline"
                      >
                        {isCommitting === item.id ? (
                          <Clock className="h-3 w-3" />
                        ) : (
                          <CheckCircle className="h-3 w-3" />
                        )}
                      </Button>
                    )}
                    
                    <Button
                      onClick={() => removeItem(item.id)}
                      size="sm"
                      variant="ghost"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Banking Stats */}
        <Card>
          <CardContent className="p-3">
            <div className="text-sm">
              <div className="flex justify-between">
                <span>Total Banked:</span>
                <span className="font-medium">{bankedItems.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Committed:</span>
                <span className="font-medium">{bankedItems.filter(item => item.committed).length}</span>
              </div>
              <div className="flex justify-between">
                <span>Pending:</span>
                <span className="font-medium">{bankedItems.filter(item => !item.committed).length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}