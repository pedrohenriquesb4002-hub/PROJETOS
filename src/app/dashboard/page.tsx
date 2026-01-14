'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Church,
  Package,
  Warehouse,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Trash2 // Adicionado para resolver o erro 'Cannot find name Trash2'
} from 'lucide-react';

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [statsData, setStatsData] = useState({
    totalIgrejas: 0,
    totalProdutos: 0,
    valorEstoque: 0,
    atividades: [],
    estoqueBaixo: []
  });

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    async function loadStats() {
      try {
        const response = await fetch('/api/stats');
        const data = await response.json();
        setStatsData(prev => ({ ...prev, ...data }));
      } catch (error) {
        console.error("Erro ao carregar estatísticas:", error);
      }
    }
    if (user) loadStats();
  }, [user]);

  // Função para excluir o item apenas da lista visual (State)
  const handleExcluir = (indexParaRemover: number) => {
    setStatsData(prev => ({
      ...prev,
      estoqueBaixo: prev.estoqueBaixo.filter((_, idx) => idx !== indexParaRemover)
    }));
  };

  if (isLoading) return <div className="flex items-center justify-center h-screen">Carregando...</div>;
  if (!user) return null;

  const stats = [
    {
      title: 'Total de Igrejas',
      value: statsData.totalIgrejas.toString(),
      icon: Church,
      trend: 'up',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Produtos Cadastrados',
      value: statsData.totalProdutos.toString(),
      icon: Package,
      trend: 'up',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Valor em Estoque',
      value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(statsData.valorEstoque),
      icon: Warehouse,
      trend: 'up',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    }
  ];

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Bem-vindo de volta, {user.name}</p>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {stats.map((stat) => {
            const TrendIcon = stat.trend === 'up' ? TrendingUp : TrendingDown;
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">{stat.title}</CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendIcon className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-gray-600">Atualizado agora</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Atividades Recentes */}
          <Card>
            <CardHeader>
              <CardTitle>Atividades Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {statsData.atividades.length > 0 ? (
                  statsData.atividades.map((activity: any, idx) => (
                    <div key={idx} className="flex items-start gap-3 pb-4 border-b last:border-0">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                        <p className="text-sm text-gray-600">{activity.item} por {activity.user}</p>
                        <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">Nenhuma atividade recente encontrada.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Alerta de Estoque Baixo */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Atenção ao Estoque</CardTitle>
              <AlertTriangle className="w-5 h-5 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {statsData.estoqueBaixo.length > 0 ? (
                  statsData.estoqueBaixo.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-orange-50 rounded-lg">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                        <p className="text-xs text-orange-700">Reposição necessária</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-bold text-orange-700">{item.quantity}</p>
                          <p className="text-xs text-gray-500">unidades</p>
                        </div>
                        {/* Botão de Excluir corrigido */}
                        <button 
                          onClick={() => handleExcluir(idx)}
                          className="text-gray-400 hover:text-red-600 transition-colors p-1"
                          title="Remover alerta"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">Todo o estoque está em níveis normais.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}