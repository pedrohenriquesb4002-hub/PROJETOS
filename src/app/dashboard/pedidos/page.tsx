'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, ShoppingCart, Package, TrendingUp } from 'lucide-react';
import { apiRequest } from '@/lib/api';

interface Product {
  id: string;
  name: string;
  code: string;
  price: number;
}

interface Igreja {
  id: string;
  name: string;
  city: string;
}

interface Order {
  id: string;
  productId: string;
  quantity: number;
  igrejaId: string;
  product?: Product;
  igreja?: Igreja;
  createdAt: string;
}

export default function PedidosPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [igrejas, setIgrejas] = useState<Igreja[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    productId: '',
    quantity: '',
    igrejaId: '',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [ordersData, productsData, igrejasData] = await Promise.all([
        apiRequest('/api/orders'),
        apiRequest('/api/products'),
        apiRequest('/api/igrejas'),
      ]);
      setOrders(ordersData.orders || []);
      setProducts(productsData.products || []);
      setIgrejas(igrejasData.igrejas || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          productId: formData.productId,
          quantity: parseInt(formData.quantity),
          igrejaId: formData.igrejaId,
        }),
      });
      setIsDialogOpen(false);
      setFormData({ productId: '', quantity: '', igrejaId: '' });
      fetchData();
    } catch (error: any) {
      alert(error.message || 'Erro ao criar pedido');
    }
  };

  const getProductById = (id: string) => products.find((p) => p.id === id);
  const getIgrejaById = (id: string) => igrejas.find((i) => i.id === id);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const totalOrders = orders.length;
  const totalItems = orders.reduce((sum, o) => sum + o.quantity, 0);
  const totalValue = orders.reduce((sum, o) => {
    const product = getProductById(o.productId);
    return sum + (product ? product.price * o.quantity : 0);
  }, 0);

  const filteredOrders = orders.filter((order) => {
    const product = getProductById(order.productId);
    const igreja = getIgrejaById(order.igrejaId);
    if (!product || !igreja) return false;
    return (
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      igreja.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  if (authLoading || !user) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gerenciar Pedidos</h1>
            <p className="text-gray-500 mt-1">
              Cadastre novos pedidos e acompanhe as solicitações das igrejas
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Novo Pedido
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Pedido</DialogTitle>
                <DialogDescription>
                  Preencha as informações do pedido
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="igrejaId">Igreja</Label>
                  <Select
                    value={formData.igrejaId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, igrejaId: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma igreja" />
                    </SelectTrigger>
                    <SelectContent>
                      {igrejas.map((igreja) => (
                        <SelectItem key={igreja.id} value={igreja.id}>
                          {igreja.name} - {igreja.city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="productId">Produto</Label>
                  <Select
                    value={formData.productId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, productId: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} - {formatPrice(product.price)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="quantity">Quantidade</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    placeholder="10"
                    required
                  />
                </div>
                <div className="flex gap-2 justify-end pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">Criar Pedido</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total de Pedidos
              </CardTitle>
              <div className="p-2 rounded-lg bg-blue-50">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{totalOrders}</div>
              <p className="text-sm text-gray-600 mt-1">pedidos registrados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total de Itens
              </CardTitle>
              <div className="p-2 rounded-lg bg-green-50">
                <Package className="w-5 h-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{totalItems}</div>
              <p className="text-sm text-gray-600 mt-1">unidades solicitadas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Valor Total
              </CardTitle>
              <div className="p-2 rounded-lg bg-purple-50">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{formatPrice(totalValue)}</div>
              <p className="text-sm text-gray-600 mt-1">em pedidos</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por produto ou igreja..."
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
            ) : filteredOrders.length === 0 ? (
              <p className="text-center py-8 text-gray-500">
                {searchTerm ? 'Nenhum pedido encontrado' : 'Nenhum pedido cadastrado ainda'}
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Igreja</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => {
                    const product = getProductById(order.productId);
                    const igreja = getIgrejaById(order.igrejaId);
                    if (!product || !igreja) return null;
                    
                    return (
                      <TableRow key={order.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-gray-900">{product.name}</p>
                            <p className="text-sm text-gray-500">Cód: {product.code}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-gray-900">{igreja.name}</p>
                            <p className="text-sm text-gray-500">{igreja.city}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{order.quantity} un.</Badge>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-gray-900">{formatDate(order.createdAt)}</p>
                        </TableCell>
                        <TableCell className="text-right">
                          <p className="font-semibold text-gray-900">
                            {formatPrice(product.price * order.quantity)}
                          </p>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
// force update pedidos page