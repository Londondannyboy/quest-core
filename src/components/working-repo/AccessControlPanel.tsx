'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface AccessPermission {
  id: string;
  grantedToEmail: string;
  grantedToName?: string;
  accessLevel: string;
  grantedAt: string;
  expiresAt?: string;
  accessToken: string;
}

interface Analytics {
  totalViews: number;
  uniqueViewers: number;
  activePermissions: number;
  periodDays: number;
}

interface TopViewer {
  email: string;
  name?: string;
  count: number;
  lastAccess: string;
}

export default function AccessControlPanel() {
  const [permissions, setPermissions] = useState<AccessPermission[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [topViewers, setTopViewers] = useState<TopViewer[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newPermission, setNewPermission] = useState({
    email: '',
    name: '',
    accessLevel: 'recruiter',
    expiresIn: ''
  });

  useEffect(() => {
    fetchAccessData();
  }, []);

  const fetchAccessData = async () => {
    try {
      const [permissionsRes, analyticsRes] = await Promise.all([
        fetch('/api/working-repo/access'),
        fetch('/api/working-repo/analytics')
      ]);

      if (permissionsRes.ok) {
        const permData = await permissionsRes.json();
        setPermissions(permData.permissions || []);
      }

      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        setAnalytics(analyticsData.analytics);
        setTopViewers(analyticsData.topViewers || []);
      }
    } catch (error) {
      console.error('Error fetching access data:', error);
    } finally {
      setLoading(false);
    }
  };

  const grantAccess = async () => {
    if (!newPermission.email || !newPermission.accessLevel) {
      alert('Email and access level are required');
      return;
    }

    try {
      let expiresAt = null;
      if (newPermission.expiresIn) {
        const days = parseInt(newPermission.expiresIn);
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + days);
      }

      const response = await fetch('/api/working-repo/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grantedToEmail: newPermission.email,
          grantedToName: newPermission.name || undefined,
          accessLevel: newPermission.accessLevel,
          expiresAt: expiresAt?.toISOString()
        })
      });

      if (response.ok) {
        setDialogOpen(false);
        setNewPermission({ email: '', name: '', accessLevel: 'recruiter', expiresIn: '' });
        fetchAccessData();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error granting access:', error);
      alert('Error granting access');
    }
  };

  const revokeAccess = async (permissionId: string) => {
    if (!confirm('Are you sure you want to revoke this access?')) return;

    try {
      const response = await fetch(`/api/working-repo/access?id=${permissionId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchAccessData();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error revoking access:', error);
      alert('Error revoking access');
    }
  };

  const copyShareLink = (accessToken: string) => {
    const shareUrl = `${window.location.origin}/api/working-repo/view?token=${accessToken}`;
    navigator.clipboard.writeText(shareUrl);
    alert('Share link copied to clipboard!');
  };

  const getAccessLevelBadge = (level: string) => {
    const colors = {
      recruiter: 'bg-blue-100 text-blue-800',
      collaborator: 'bg-green-100 text-green-800',
      mentor: 'bg-purple-100 text-purple-800',
      full: 'bg-orange-100 text-orange-800'
    };
    return colors[level as keyof typeof colors] || colors.recruiter;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Loading access control...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analytics Overview */}
      {analytics && (
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{analytics.totalViews}</div>
                <div className="text-sm text-muted-foreground">Total Views</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{analytics.uniqueViewers}</div>
                <div className="text-sm text-muted-foreground">Unique Viewers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{analytics.activePermissions}</div>
                <div className="text-sm text-muted-foreground">Active Shares</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{analytics.periodDays}</div>
                <div className="text-sm text-muted-foreground">Days Tracked</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Viewers */}
      {topViewers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Viewers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topViewers.slice(0, 5).map((viewer, index) => (
                <div key={viewer.email} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div>
                    <div className="font-medium">{viewer.name || viewer.email}</div>
                    <div className="text-sm text-muted-foreground">{viewer.email}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{viewer.count} views</div>
                    <div className="text-sm text-muted-foreground">
                      Last: {formatDate(viewer.lastAccess)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Access Permissions */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Access Permissions ({permissions.length})</CardTitle>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>Grant Access</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Grant Portfolio Access</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newPermission.email}
                      onChange={(e) => setNewPermission(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="viewer@company.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="name">Name (Optional)</Label>
                    <Input
                      id="name"
                      value={newPermission.name}
                      onChange={(e) => setNewPermission(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="accessLevel">Access Level</Label>
                    <Select value={newPermission.accessLevel} onValueChange={(value) => setNewPermission(prev => ({ ...prev, accessLevel: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="recruiter">Recruiter - Limited view</SelectItem>
                        <SelectItem value="collaborator">Collaborator - Extended access</SelectItem>
                        <SelectItem value="mentor">Mentor - Full access</SelectItem>
                        <SelectItem value="full">Full - Complete access</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="expiresIn">Expires After (Optional)</Label>
                    <Input
                      id="expiresIn"
                      type="number"
                      value={newPermission.expiresIn}
                      onChange={(e) => setNewPermission(prev => ({ ...prev, expiresIn: e.target.value }))}
                      placeholder="Days until expiry"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={grantAccess}>
                      Grant Access
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {permissions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No access permissions granted yet. Click &quot;Grant Access&quot; to share your portfolio.
            </p>
          ) : (
            <div className="space-y-4">
              {permissions.map((permission) => (
                <div key={permission.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">
                          {permission.grantedToName || permission.grantedToEmail}
                        </span>
                        <Badge className={getAccessLevelBadge(permission.accessLevel)}>
                          {permission.accessLevel}
                        </Badge>
                        {isExpired(permission.expiresAt) && (
                          <Badge variant="destructive">Expired</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {permission.grantedToEmail}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Granted: {formatDate(permission.grantedAt)}
                        {permission.expiresAt && (
                          <span> • Expires: {formatDate(permission.expiresAt)}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyShareLink(permission.accessToken)}
                      >
                        Copy Link
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => revokeAccess(permission.id)}
                      >
                        Revoke
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}