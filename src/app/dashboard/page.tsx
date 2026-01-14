const [statsData, setStatsData] = useState({ totalIgrejas: 0, totalProdutos: 0, valorEstoque: 0 });
useEffect(() => {
  async function loadStats() {
    try {
      const response = await fetch('/api/stats');
      const data = await response.json();
      setStatsData(data);
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
    }
  }
  loadStats();
}, []);


'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Church, Package, Warehouse, ShoppingCart, TrendingUp, TrendingDown } from 'lucide-react';

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Carregando...</div>;
  }

  if (!user) {
    return null;
  }

  const stats = [
    {
      title: 'Total de Igrejas',
     value: statsData.totalIgrejas.toString(), // Antes era '12'
      change: '',
      icon: Church,
      trend: 'up',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Produtos Cadastrados',
      value: statsData.totalProdutos.toString(), // Antes era '145'
      change: '',
      icon: Package,
      trend: 'up',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Valor em Estoque',
      value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(statsData.valorEstoque),
      change: '',
      icon: Warehouse,
      trend: 'up',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Pedidos Ativos',
      value: '23',
      change: '-5 vs. anterior',
      icon: ShoppingCart,
      trend: 'down',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Bem-vindo de volta, {user.name}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            const TrendIcon = stat.trend === 'up' ? TrendingUp : TrendingDown;
            
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendIcon
                      className={`w-4 h-4 ${
                        stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      }`}
                    />
                    <span className="text-sm text-gray-600">{stat.change}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Atividades Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { action: 'Novo item adicionado', item: 'Projetor Epson', time: 'Há 2 horas', user: 'Pr. Carlos' },
                  { action: 'Estoque atualizado', item: 'Cadeiras para 150', time: 'Há 5 horas', user: 'Admin' },
                  { action: 'Item removido', item: 'Cabo HDMI Quebrado', time: 'Ontem', user: 'Pr. João' },
                ].map((activity, idx) => (
                  <div key={idx} className="flex items-start gap-3 pb-4 border-b last:border-0">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                      <p className="text-sm text-gray-600">"{activity.item}" por {activity.user}</p>
                      <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estoque Baixo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: 'Biblias de Estudo NVI', quantity: 12, status: 'Estoque Baixo' },
                  { name: 'Mesa de Som 16 Canais', quantity: 1, status: 'Última Unidade' },
                  { name: 'Kit Limpeza Mensal', quantity: 10, status: 'Estoque Baixo' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between pb-4 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.name}</p>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                        item.quantity === 1 
                          ? 'bg-red-100 text-red-700' 
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">{item.quantity}</p>
                      <p className="text-xs text-gray-500">unidades</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
