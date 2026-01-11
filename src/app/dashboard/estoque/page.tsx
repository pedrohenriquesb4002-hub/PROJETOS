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
import { Plus, Search, Warehouse, Package, AlertTriangle, TrendingUp } from 'lucide-react';
import { apiRequest } from '@/lib/api';

interface Product {
  id: string;
  name: string;
  code: string;
  price: number;
}

interface Stock {
  id: string;
  productId: string;
  quantity: number;
  product?: Product;
  updatedAt: string;
}

export default function EstoquePage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    productId: '',
    quantity: '',
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
      const [stockData, productsData] = await Promise.all([
        apiRequest('/api/stock'),
        apiRequest('/api/products'),
      ]);
      setStocks(stockData.stock || []);
      setProducts(productsData.products || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/api/stock', {
        method: 'POST',
        body: JSON.stringify({
          productId: formData.productId,
          quantity: parseInt(formData.quantity),
        }),
      });
      setIsDialogOpen(false);
      setFormData({ productId: '', quantity: '' });
      fetchData();
    } catch (error: any) {
      alert(error.message || 'Erro ao adicionar ao estoque');
    }
  };

  const getProductById = (id: string) => {
    return products.find((p) => p.id === id);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const totalItems = stocks.reduce((sum, s) => sum + s.quantity, 0);
  const totalValue = stocks.reduce((sum, s) => {
    const product = getProductById(s.productId);
    return sum + (product ? product.price * s.quantity : 0);
  }, 0);
  const lowStockCount = stocks.filter((s) => s.quantity < 20).length;

  const filteredStocks = stocks.filter((stock) => {
    const product = getProductById(stock.productId);
    if (!product) return false;
    return (
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.code.toLowerCase().includes(searchTerm.toLowerCase())
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
            <h1 className="text-3xl font-bold text-gray-900">Gerenciamento de Estoque</h1>
            <p className="text-gray-500 mt-1">
              Gerencie itens e acompanhe o valor patrimonial da igreja
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Novo Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Item ao Estoque</DialogTitle>
                <DialogDescription>
                  Selecione o produto e informe a quantidade
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
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
                          {product.name} ({product.code})
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
                    placeholder="150"
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
                  <Button type="submit">Adicionar ao Estoque</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Valor Total do Patrimônio
              </CardTitle>
              <div className="p-2 rounded-lg bg-blue-50">
                <Warehouse className="w-5 h-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{formatPrice(totalValue)}</div>
              <p className="text-sm text-gray-600 mt-1">Inventário completo</p>
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
              <p className="text-sm text-gray-600 mt-1">unidades</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Categorias
              </CardTitle>
              <div className="p-2 rounded-lg bg-purple-50">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stocks.length}</div>
              <p className="text-sm text-gray-600 mt-1">tipos de produtos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Estoque Baixo
              </CardTitle>
              <div className="p-2 rounded-lg bg-orange-50">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{lowStockCount}</div>
              <p className="text-sm text-gray-600 mt-1">itens</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por nome, categoria ou código..."
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
            ) : filteredStocks.length === 0 ? (
              <p className="text-center py-8 text-gray-500">
                {searchTerm ? 'Nenhum item encontrado' : 'Nenhum item no estoque ainda'}
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item / Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Valor Unitário</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStocks.map((stock) => {
                    const product = getProductById(stock.productId);
                    if (!product) return null;
                    
                    const getStatus = (qty: number) => {
                      if (qty === 0) return { label: 'Sem Estoque', color: 'bg-red-100 text-red-700' };
                      if (qty < 10) return { label: 'Crítico', color: 'bg-red-100 text-red-700' };
                      if (qty < 20) return { label: 'Estoque Baixo', color: 'bg-yellow-100 text-yellow-700' };
                      return { label: 'Em Estoque', color: 'bg-green-100 text-green-700' };
                    };
                    
                    const status = getStatus(stock.quantity);
                    
                    return (
                      <TableRow key={stock.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-gray-900">{product.name}</p>
                            <p className="text-sm text-gray-500">Cód: {product.code}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">Geral</Badge>
                        </TableCell>
                        <TableCell>
                          <p className="font-semibold text-gray-900">{stock.quantity}</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-gray-900">{formatPrice(product.price)}</p>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${status.color} hover:${status.color}`}>
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <p className="font-semibold text-gray-900">
                            {formatPrice(product.price * stock.quantity)}
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
