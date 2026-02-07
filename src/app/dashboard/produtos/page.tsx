'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Package, Edit, Trash2, AlertTriangle, DollarSign, BarChart3 } from 'lucide-react';
import { apiRequest } from '@/lib/api';

interface Product {
  id: string;
  name: string;
  code: string;
  price: number;
}

export default function ProdutosPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', code: '', price: '' });

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
    if (user) fetchProducts();
  }, [user, authLoading, router]);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const data = await apiRequest('/api/products');
      setProducts(data.products || []);
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const rawPrice = parseFloat(formData.price.replace(',', '.'));
      if (isNaN(rawPrice)) return alert('Preço inválido');
      
      const priceInCents = Math.round(rawPrice * 100);
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `/api/products/${editingId}` : '/api/products';

      await apiRequest(url, {
        method,
        body: JSON.stringify({ ...formData, price: priceInCents }),
      });

      setIsDialogOpen(false);
      setEditingId(null);
      setFormData({ name: '', code: '', price: '' });
      fetchProducts();
    } catch (error: any) {
      alert(error.message || 'Erro ao salvar');
    }
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalValue = products.reduce((acc, p) => acc + (p.price || 0), 0);

  if (authLoading || !user) return null;

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Produtos</h1>
          <Button onClick={() => { setEditingId(null); setFormData({ name: '', code: '', price: '' }); setIsDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Novo Produto
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total de Itens</CardTitle>
              <Package className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{products.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatPrice(totalValue)}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <Input placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell><Badge variant="outline">{p.code}</Badge></TableCell>
                    <TableCell>{p.name}</TableCell>
                    <TableCell>{formatPrice(p.price)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => {
                        setEditingId(p.id);
                        setFormData({ name: p.name, code: p.code, price: (p.price/100).toString().replace('.', ',') });
                        setIsDialogOpen(true);
                      }}><Edit className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingId ? 'Editar' : 'Novo'} Produto</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><Label>Nome</Label><Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required /></div>
              <div><Label>Código</Label><Input value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} required /></div>
              <div><Label>Preço</Label><Input placeholder="0,00" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required /></div>
              <DialogFooter><Button type="submit">Salvar</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}