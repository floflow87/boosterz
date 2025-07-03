import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  Activity, 
  Database, 
  Shield, 
  Eye, 
  UserCheck, 
  Settings,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface Permission {
  id: number;
  userId: number;
  role: string;
  canManageUsers: boolean;
  canViewLogs: boolean;
  canManagePermissions: boolean;
  canAccessAdmin: boolean;
  canModerateContent: boolean;
  canManageDatabase: boolean;
  user?: {
    id: number;
    username: string;
    name: string;
    email: string;
  };
}

interface SystemLog {
  id: number;
  level: string;
  message: string;
  endpoint?: string;
  userId?: number;
  userAgent?: string;
  ipAddress?: string;
  responseStatus?: number;
  responseTime?: number;
  createdAt: string;
}

interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  isActive: boolean;
  isAdmin: boolean;
}

export default function AdminPage() {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [logsAutoRefresh, setLogsAutoRefresh] = useState(true);
  const queryClient = useQueryClient();

  // Vérifier les permissions d'accès admin
  const { data: currentUser } = useQuery({
    queryKey: ['/api/auth/me'],
  });

  const { data: userPermissions } = useQuery({
    queryKey: ['/api/admin/permissions/me'],
    enabled: !!currentUser,
  });

  // Charger les utilisateurs
  const { data: users = [] } = useQuery({
    queryKey: ['/api/admin/users'],
    enabled: userPermissions?.canManageUsers,
  });

  // Charger toutes les permissions
  const { data: permissions = [] } = useQuery({
    queryKey: ['/api/admin/permissions'],
    enabled: userPermissions?.canManagePermissions,
  });

  // Charger les logs système
  const { data: logs = [], refetch: refetchLogs } = useQuery({
    queryKey: ['/api/admin/logs'],
    enabled: userPermissions?.canViewLogs,
    refetchInterval: logsAutoRefresh ? 5000 : false, // Refresh toutes les 5 secondes
  });

  // Statistiques système
  const { data: stats } = useQuery({
    queryKey: ['/api/admin/stats'],
    enabled: userPermissions?.canAccessAdmin,
  });

  // Mutation pour mettre à jour les permissions
  const updatePermissionsMutation = useMutation({
    mutationFn: async ({ userId, permissions }: { userId: number; permissions: Partial<Permission> }) => {
      return apiRequest(`/api/admin/permissions/${userId}`, {
        method: 'PATCH',
        body: permissions,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/permissions'] });
    },
  });

  // Mutation pour activer/désactiver un utilisateur
  const toggleUserMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: number; isActive: boolean }) => {
      return apiRequest(`/api/admin/users/${userId}/toggle`, {
        method: 'PATCH',
        body: { isActive },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
  });

  // Vérifier si l'utilisateur a accès à l'admin
  if (!userPermissions?.canAccessAdmin) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Accès refusé. Vous n'avez pas les permissions d'administrateur.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'error': return 'bg-red-500';
      case 'warn': return 'bg-yellow-500';
      case 'info': return 'bg-blue-500';
      case 'debug': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status?: number) => {
    if (!status) return 'text-gray-500';
    if (status >= 200 && status < 300) return 'text-green-500';
    if (status >= 400 && status < 500) return 'text-yellow-500';
    if (status >= 500) return 'text-red-500';
    return 'text-gray-500';
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Administration</h1>
            <p className="text-gray-400 mt-2">
              Gestion des utilisateurs, permissions et monitoring système
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="text-green-400 border-green-400">
              <Shield className="w-4 h-4 mr-1" />
              Admin
            </Badge>
            <Badge variant="outline">
              {currentUser?.name || currentUser?.username}
            </Badge>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Utilisateurs</p>
                  <p className="text-2xl font-bold text-white">{stats?.totalUsers || users.length}</p>
                </div>
                <Users className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Logs (24h)</p>
                  <p className="text-2xl font-bold text-white">{stats?.logsToday || logs.length}</p>
                </div>
                <Activity className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Erreurs</p>
                  <p className="text-2xl font-bold text-white">
                    {logs.filter(log => log.level === 'error').length}
                  </p>
                </div>
                <XCircle className="w-8 h-8 text-red-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Statut</p>
                  <p className="text-sm font-medium text-green-400">Opérationnel</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="bg-gray-900 border-gray-800">
            <TabsTrigger value="users" disabled={!userPermissions?.canManageUsers}>
              <Users className="w-4 h-4 mr-2" />
              Utilisateurs
            </TabsTrigger>
            <TabsTrigger value="permissions" disabled={!userPermissions?.canManagePermissions}>
              <Shield className="w-4 h-4 mr-2" />
              Permissions
            </TabsTrigger>
            <TabsTrigger value="logs" disabled={!userPermissions?.canViewLogs}>
              <Eye className="w-4 h-4 mr-2" />
              Logs
            </TabsTrigger>
            <TabsTrigger value="database" disabled={!userPermissions?.canManageDatabase}>
              <Database className="w-4 h-4 mr-2" />
              Base de données
            </TabsTrigger>
          </TabsList>

          {/* Gestion des utilisateurs */}
          <TabsContent value="users">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Gestion des utilisateurs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user: User) => (
                    <div key={user.id} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                      <div>
                        <p className="font-medium text-white">{user.name}</p>
                        <p className="text-sm text-gray-400">@{user.username} • {user.email}</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Badge variant={user.isActive ? "default" : "destructive"}>
                          {user.isActive ? "Actif" : "Inactif"}
                        </Badge>
                        {user.isAdmin && (
                          <Badge variant="outline" className="text-yellow-400 border-yellow-400">
                            Admin
                          </Badge>
                        )}
                        <Switch
                          checked={user.isActive}
                          onCheckedChange={(checked) => 
                            toggleUserMutation.mutate({ userId: user.id, isActive: checked })
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Gestion des permissions */}
          <TabsContent value="permissions">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Gestion des permissions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {permissions.map((permission: Permission) => (
                    <div key={permission.id} className="p-6 bg-gray-800 rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-medium text-white">
                            {permission.user?.name || `User ${permission.userId}`}
                          </h3>
                          <p className="text-sm text-gray-400">
                            @{permission.user?.username} • Rôle: {permission.role}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {permission.role}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {[
                          { key: 'canManageUsers', label: 'Gérer utilisateurs' },
                          { key: 'canViewLogs', label: 'Voir logs' },
                          { key: 'canManagePermissions', label: 'Gérer permissions' },
                          { key: 'canAccessAdmin', label: 'Accès admin' },
                          { key: 'canModerateContent', label: 'Modérer contenu' },
                          { key: 'canManageDatabase', label: 'Gérer BDD' },
                        ].map(({ key, label }) => (
                          <div key={key} className="flex items-center justify-between">
                            <Label className="text-sm text-gray-300">{label}</Label>
                            <Switch
                              checked={permission[key as keyof Permission] as boolean}
                              onCheckedChange={(checked) => {
                                updatePermissionsMutation.mutate({
                                  userId: permission.userId,
                                  permissions: { [key]: checked }
                                });
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Logs système */}
          <TabsContent value="logs">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Eye className="w-5 h-5 mr-2" />
                    Logs système
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label className="text-sm">Auto-refresh</Label>
                    <Switch
                      checked={logsAutoRefresh}
                      onCheckedChange={setLogsAutoRefresh}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => refetchLogs()}
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-2">
                    {logs.slice(0, 100).map((log: SystemLog) => (
                      <div key={log.id} className="flex items-start space-x-3 p-3 bg-gray-800 rounded text-sm">
                        <div className={`w-2 h-2 rounded-full mt-2 ${getLevelColor(log.level)}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {log.level.toUpperCase()}
                            </Badge>
                            <span className="text-gray-400 text-xs">
                              {new Date(log.createdAt).toLocaleString()}
                            </span>
                            {log.responseStatus && (
                              <span className={`text-xs ${getStatusColor(log.responseStatus)}`}>
                                {log.responseStatus}
                              </span>
                            )}
                            {log.responseTime && (
                              <span className="text-gray-400 text-xs">
                                {log.responseTime}ms
                              </span>
                            )}
                          </div>
                          <p className="text-white break-words">{log.message}</p>
                          {log.endpoint && (
                            <p className="text-gray-400 text-xs mt-1">
                              {log.endpoint}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Gestion base de données */}
          <TabsContent value="database">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="w-5 h-5 mr-2" />
                  Gestion base de données
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Utilisez le script <code>scripts/migrate-dev-to-prod.js</code> pour synchroniser
                      la base de développement vers la production.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <h3 className="font-medium mb-2">Commande de migration</h3>
                    <code className="text-green-400 bg-gray-900 p-2 rounded block">
                      npm run migrate-prod
                    </code>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}