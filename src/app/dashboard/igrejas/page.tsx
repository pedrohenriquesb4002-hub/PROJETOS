'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Plus, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { apiRequest } from '@/lib/api';

export default function IgrejasPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [igrejas, setIgrejas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Controles dos Modais
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedIgreja, setSelectedIgreja] = useState<any>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '', cnpj: '', number: '', street: '',
    city: '', state: '', zipCode: '', neighborhood: '',
  });

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
    if (user) fetchIgrejas();
  }, [user, authLoading, router]);

  const fetchIgrejas = async () => {
    try {
      setIsLoading(true);
      const data = await apiRequest('/api/igrejas');
      setIgrejas(data.igrejas || data || []);
    } catch (error) {
      console.error('Erro ao carregar:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (igreja: any) => {
    setEditingId(igreja.id);
    setFormData({
      name: igreja.nome || igreja.name || '',
      cnpj: igreja.cnpj || '',
      number: String(igreja.number || ''),
      street: igreja.street || '',
      city: igreja.city || '',
      state: igreja.state || '',
      zipCode: igreja.zipCode || '',
      neighborhood: igreja.neighborhood || '',
    });
    setIsDialogOpen(true);
  };

  const openDeleteModal = (igreja: any) => {
    setSelectedIgreja(igreja);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedIgreja) return;
    try {
      await apiRequest(`/api/igrejas/${selectedIgreja.id}`, { method: 'DELETE' });
      setIsDeleteDialogOpen(false);
      fetchIgrejas();
    } catch (error: any) {
      alert(error.message || 'Erro ao excluir');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `/api/igrejas/${editingId}` : '/api/igrejas';
      await apiRequest(url, {
        method,
        body: JSON.stringify({ ...formData, number: parseInt(formData.number) }),
      });
      setIsDialogOpen(false);
      setEditingId(null);
      fetchIgrejas();
    } catch (error: any) {
      alert(error.message || 'Erro ao salvar');
    }
  };

  const filteredIgrejas = igrejas.filter((i) => {
    const nome = (i.nome || i.name || "").toLowerCase();
    return nome.includes(searchTerm.toLowerCase());
  });

  if (authLoading || !user) return null;

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Gerenciar Igrejas</h1>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingId(null);
                setFormData({ name: '', cnpj: '', number: '', street: '', city: '', state: '', zipCode: '', neighborhood: '' });
              }} className="gap-2">
                <Plus className="w-4 h-4" /> Nova Igreja
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingId ? 'Editar Igreja' : 'Cadastrar Nova Igreja'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label>Nome da Igreja</Label>
                    <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                  </div>
                  <div><Label>CNPJ</Label><Input value={formData.cnpj} onChange={e => setFormData({...formData, cnpj: e.target.value})} /></div>
                  <div><Label>CEP</Label><Input value={formData.zipCode} onChange={e => setFormData({...formData, zipCode: e.target.value})} /></div>
                </div>
                <Button type="submit" className="w-full">Salvar Dados</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* MODAL DE EXCLUSÃO BONITO */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader className="flex flex-col items-center">
              <div className="bg-red-100 p-3 rounded-full mb-2">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <DialogTitle>Confirmar Exclusão</DialogTitle>
              <DialogDescription className="text-center">
                Tem certeza que deseja excluir <strong>{selectedIgreja?.nome || selectedIgreja?.name}</strong>?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex gap-2 sm:justify-center mt-4">
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancelar</Button>
              <Button variant="destructive" onClick={handleDelete}>Confirmar Exclusão</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Card>
          <CardHeader>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input placeholder="Buscar por nome..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Igreja</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIgrejas.map((igreja) => (
                  <TableRow key={igreja.id}>
                    <TableCell className="font-medium">{igreja.nome || igreja.name}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(igreja)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600" onClick={() => openDeleteModal(igreja)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}