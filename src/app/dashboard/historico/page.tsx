'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, History, Activity, FileText } from 'lucide-react';
import { apiRequest } from '@/lib/api';

interface AuditLog {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  oldData: any;
  newData: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export default function HistoricoPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchLogs();
    }
  }, [user]);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const data = await apiRequest('/api/audit');
      setLogs(data.logs || []);
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR') + ' às ' + d.toLocaleTimeString('pt-BR');
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      CREATE: 'Criação',
      UPDATE: 'Atualização',
      DELETE: 'Exclusão',
      LOGIN: 'Login',
      LOGOUT: 'Logout',
    };
    return labels[action] || action;
  };

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      CREATE: 'bg-green-100 text-green-700',
      UPDATE: 'bg-blue-100 text-blue-700',
      DELETE: 'bg-red-100 text-red-700',
      LOGIN: 'bg-purple-100 text-purple-700',
      LOGOUT: 'bg-gray-100 text-gray-700',
    };
    return colors[action] || 'bg-gray-100 text-gray-700';
  };

  const getEntityLabel = (entityType: string) => {
    const labels: Record<string, string> = {
      users: 'Usuários',
      products: 'Produtos',
      igrejas: 'Igrejas',
      stock: 'Estoque',
      orders: 'Pedidos',
    };
    return labels[entityType] || entityType;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const filteredLogs = logs.filter((log) => {
    const userName = log.userName || '';
    const userEmail = log.userEmail || '';
    return (
      userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entityType.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Estatísticas
  const totalActions = logs.length;
  const createActions = logs.filter((l) => l.action === 'CREATE').length;
  const updateActions = logs.filter((l) => l.action === 'UPDATE').length;
  const deleteActions = logs.filter((l) => l.action === 'DELETE').length;

  if (authLoading || !user) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Histórico de Atividades</h1>
          <p className="text-gray-500 mt-1">
            Acompanhe todas as ações realizadas no sistema
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total de Ações
              </CardTitle>
              <div className="p-2 rounded-lg bg-blue-50">
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{totalActions}</div>
              <p className="text-sm text-gray-600 mt-1">registros</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Criações
              </CardTitle>
              <div className="p-2 rounded-lg bg-green-50">
                <FileText className="w-5 h-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{createActions}</div>
              <p className="text-sm text-gray-600 mt-1">novos registros</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Atualizações
              </CardTitle>
              <div className="p-2 rounded-lg bg-blue-50">
                <History className="w-5 h-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{updateActions}</div>
              <p className="text-sm text-gray-600 mt-1">modificações</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Exclusões
              </CardTitle>
              <div className="p-2 rounded-lg bg-red-50">
                <FileText className="w-5 h-5 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{deleteActions}</div>
              <p className="text-sm text-gray-600 mt-1">remoções</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por usuário, ação ou tipo de registro..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center py-8 text-gray-500">Carregando...</p>
            ) : filteredLogs.length === 0 ? (
              <p className="text-center py-8 text-gray-500">
                {searchTerm ? 'Nenhuma atividade encontrada' : 'Nenhuma atividade registrada ainda'}
              </p>
            ) : (
              <div className="space-y-4">
                {filteredLogs.map((log) => {
                  const getChangedFields = () => {
                    if (!log.oldData || !log.newData) return null;
                    
                    const changes: string[] = [];
                    const oldData = log.oldData;
                    const newData = log.newData;
                    
                    Object.keys(newData).forEach(key => {
                      if (key !== 'password' && key !== 'id' && key !== 'createdAt' && key !== 'updatedAt') {
                        if (oldData[key] !== newData[key]) {
                          changes.push(key);
                        }
                      }
                    });
                    
                    return changes;
                  };

                  const getAffectedUser = () => {
                    if (log.newData && log.newData.name) {
                      return log.newData.name;
                    }
                    if (log.oldData && log.oldData.name) {
                      return log.oldData.name;
                    }
                    return null;
                  };

                  const changedFields = getChangedFields();
                  const affectedUser = getAffectedUser();
                  
                  return (
                    <div
                      key={log.id}
                      className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-blue-600 text-white text-sm">
                          {log.userName ? getInitials(log.userName) : '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-gray-900">
                            {log.userName || 'Usuário desconhecido'}
                          </p>
                          <Badge className={`${getActionColor(log.action)} hover:${getActionColor(log.action)}`}>
                            {getActionLabel(log.action)}
                          </Badge>
                          <Badge variant="outline">{getEntityLabel(log.entityType)}</Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          {log.userEmail || 'email@desconhecido.com'}
                        </p>
                        
                        {/* Mostrar usuário afetado */}
                        {affectedUser && log.action !== 'LOGIN' && (
                          <div className="mt-2 text-sm">
                            <span className="text-gray-700">
                              {log.action === 'CREATE' && `Criou o usuário: `}
                              {log.action === 'UPDATE' && `Atualizou o usuário: `}
                              {log.action === 'DELETE' && `Deletou o usuário: `}
                              <span className="font-semibold">{affectedUser}</span>
                            </span>
                          </div>
                        )}

                        {/* Mostrar campos alterados */}
                        {changedFields && changedFields.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-500 mb-1">Campos alterados:</p>
                            <div className="flex flex-wrap gap-1">
                              {changedFields.map((field) => (
                                <Badge key={field} variant="outline" className="text-xs">
                                  {field === 'name' && 'Nome'}
                                  {field === 'email' && 'Email'}
                                  {field === 'cpf' && 'CPF'}
                                  {field === 'phone' && 'Telefone'}
                                  {!['name', 'email', 'cpf', 'phone'].includes(field) && field}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Mostrar detalhes das mudanças */}
                        {log.action === 'UPDATE' && log.oldData && log.newData && (
                          <details className="mt-3">
                            <summary className="text-xs text-blue-600 cursor-pointer hover:underline">
                              Ver detalhes das alterações
                            </summary>
                            <div className="mt-2 p-3 bg-gray-50 rounded text-xs space-y-2">
                              {changedFields?.map((field) => (
                                <div key={field} className="grid grid-cols-2 gap-2">
                                  <div>
                                    <span className="font-medium text-gray-700">Antes:</span>
                                    <p className="text-gray-600">{log.oldData[field] || '-'}</p>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-700">Depois:</span>
                                    <p className="text-gray-600">{log.newData[field] || '-'}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </details>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-900">{formatDate(log.createdAt)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
