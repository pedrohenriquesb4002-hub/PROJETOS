'use client';
import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function ProdutosPage() {
  const [prods, setProds] = useState<any[]>([]);
  const [fOpen, setFOpen] = useState(false);
  const [editId, setEditId] = useState<string|null>(null);
  const [form, setForm] = useState({ n: '', c: '', p: '' });

  const load = async () => { 
    try { 
      const d = await apiRequest('/api/products'); 
      setProds(d.products || d || []); 
    } catch (e) { console.error("Erro ao carregar:", e); } 
  };

  useEffect(() => { load(); }, []);

  const save = async (e: any) => {
    e.preventDefault();
    
    // Procura o ID da igreja no armazenamento local do navegador
    const storage = typeof window !== 'undefined' ? localStorage.getItem('auth-storage') : null;
    const parsed = storage ? JSON.parse(storage) : null;
    const igrejaId = parsed?.state?.user?.igrejaId || parsed?.user?.igrejaId;

    if (!igrejaId) {
      alert("Erro crítico: ID da igreja não encontrado. Por favor, faça Logout e Login novamente para atualizar o seu acesso.");
      return;
    }

    try {
      // Converte o preço removendo R$ e trocando vírgula por ponto
      const pVal = parseFloat(form.p.replace('R$', '').replace(/\s/g, '').replace(',', '.'));
      
      await apiRequest(editId ? `/api/products/${editId}` : '/api/products', { 
        method: editId ? 'PUT' : 'POST', 
        body: JSON.stringify({ 
          name: form.n, 
          code: form.c, 
          price: isNaN(pVal) ? 0 : pVal,
          igrejaId: igrejaId // Campo obrigatório pela API
        }) 
      });
      
      setFOpen(false); 
      setEditId(null); 
      setForm({n:'', c:'', p:''}); 
      load();
    } catch (err) { 
      alert('Erro ao salvar no servidor. Verifique se todos os campos estão preenchidos.'); 
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 space-y-4 text-white">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold text-green-500">Gestão de Produtos</h1>
          <Dialog open={fOpen} onOpenChange={setFOpen}>
            <DialogTrigger asChild>
              <Button onClick={()=>{setEditId(null);setForm({n:'',c:'',p:''});}} className="bg-green-700 hover:bg-green-800">
                <Plus className="w-4 h-4 mr-1"/> Adicionar Produto
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-950 border-zinc-800 text-white">
              <DialogHeader><DialogTitle>{editId ? 'Editar Produto' : 'Cadastrar Novo'}</DialogTitle></DialogHeader>
              <form onSubmit={save} className="space-y-4 pt-2">
                <div>
                  <label className="text-xs text-zinc-400">Nome do Produto</label>
                  <Input placeholder="Ex: Cadeira, Alimento, Papel..." className="bg-zinc-900 border-zinc-700" value={form.n} onChange={e=>setForm({...form, n:e.target.value})} required />
                </div>
                <div>
                  <label className="text-xs text-zinc-400">Código/Referência</label>
                  <Input placeholder="Ex: PROD-001" className="bg-zinc-900 border-zinc-700" value={form.c} onChange={e=>setForm({...form, c:e.target.value})} required />
                </div>
                <div>
                  <label className="text-xs text-zinc-400">Preço Unitário</label>
                  <Input placeholder="0,00" className="bg-zinc-900 border-zinc-700" value={form.p} onChange={e=>setForm({...form, p:e.target.value})} required />
                </div>
                <Button type="submit" className="w-full bg-green-700 hover:bg-green-600">Finalizar e Salvar</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow className="border-zinc-800"><TableHead>Cód.</TableHead><TableHead>Produto</TableHead><TableHead>Preço</TableHead><TableHead></TableHead></TableRow></TableHeader>
              <TableBody>
                {prods.map((p) => (
                  <TableRow key={p.id} className="border-zinc-800">
                    <TableCell className="text-zinc-500 font-mono text-xs">{p.code}</TableCell>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{Number(p.price).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</TableCell>
                    <TableCell className="flex gap-2 justify-end">
                      <Button variant="ghost" size="sm" onClick={()=>{setEditId(p.id); setForm({n:p.name, c:p.code||'', p:String(p.price)}); setFOpen(true);}}><Edit className="w-4 h-4"/></Button>
                      <Button variant="ghost" size="sm" onClick={async()=>{if(confirm('Deseja excluir este produto?')){await apiRequest(`/api/products/${p.id}`,{method:'DELETE'}); load();}}}><Trash2 className="w-4 h-4 text-red-500"/></Button>
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