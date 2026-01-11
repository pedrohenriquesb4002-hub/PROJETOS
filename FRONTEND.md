# Sistema de Gestão Eclesiástica

Sistema completo de gestão para igrejas, desenvolvido com Next.js, TypeScript, shadcn/ui e PostgreSQL.

## 🚀 Funcionalidades

### Autenticação
- ✅ Login seguro com JWT
- ✅ Proteção de rotas
- ✅ Contexto de autenticação global

### Módulos Principais

#### 📊 Dashboard
- Visão geral do sistema
- Estatísticas de igrejas, produtos e estoque
- Atividades recentes
- Alertas de estoque baixo

#### ⛪ Gestão de Igrejas
- Cadastro de igrejas/congregações
- Informações completas (CNPJ, endereço)
- Listagem com busca e filtros
- Visualização de detalhes

#### 📦 Gestão de Produtos
- Cadastro de produtos
- Código e preço
- Listagem com busca
- Valor total do inventário

#### 🏪 Gestão de Estoque
- Controle de quantidade
- Valor patrimonial
- Alertas de estoque baixo/crítico
- Vinculação com produtos

#### 🛒 Gestão de Pedidos
- Criação de pedidos
- Vínculo com igreja e produto
- Acompanhamento de solicitações
- Valor total de pedidos

#### 👥 Gestão de Usuários
- Cadastro de novos usuários (apenas por usuários logados)
- Informações completas (nome, email, CPF, telefone)
- Listagem de todos os usuários
- Controle de acesso

#### 📜 Histórico (Audit Log)
- Registro de todas as ações
- Identificação de usuário e timestamp
- Filtros por ação e tipo
- Rastreabilidade completa

## 🛠️ Tecnologias

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI**: shadcn/ui, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL com Drizzle ORM
- **Autenticação**: JWT com bcrypt
- **Ícones**: Lucide React

## 📋 Pré-requisitos

- Node.js 18+
- PostgreSQL
- npm ou yarn

## 🔧 Instalação

1. Clone o repositório
2. Instale as dependências:
```bash
npm install
```

3. Configure o arquivo `.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/database"
JWT_SECRET="seu-secret-jwt-aqui"
```

4. Execute as migrações do banco:
```bash
npm run db:push
```

5. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

6. Acesse http://localhost:3000

## 🔐 Primeiro Acesso

Para criar o primeiro usuário, você pode usar a API diretamente ou criar via SQL no banco de dados. Exemplo:

```sql
INSERT INTO users (name, email, password, cpf, phone)
VALUES (
  'Admin',
  'admin@exemplo.com',
  -- Use bcrypt para hash da senha
  '$2b$10$...',
  '000.000.000-00',
  '(11) 99999-9999'
);
```

Ou faça uma requisição POST para `/api/users` sem autenticação na primeira vez (você pode remover a proteção temporariamente).

## 📱 Estrutura de Páginas

- `/` - Redireciona para login
- `/login` - Página de login
- `/dashboard` - Dashboard principal
- `/dashboard/igrejas` - Gestão de igrejas
- `/dashboard/produtos` - Gestão de produtos
- `/dashboard/estoque` - Gestão de estoque
- `/dashboard/pedidos` - Gestão de pedidos
- `/dashboard/usuarios` - Gestão de usuários
- `/dashboard/historico` - Histórico de atividades

## 🎨 Design

O frontend foi desenvolvido com inspiração nas imagens fornecidas, utilizando:
- Layout com sidebar fixa
- Cards informativos
- Tabelas responsivas
- Modais para formulários
- Badges para status
- Cores consistentes e modernas

## 🔌 APIs Disponíveis

- `POST /api/users/login` - Login
- `GET /api/users/me` - Usuário atual
- `GET|POST /api/users` - CRUD de usuários
- `GET|POST /api/igrejas` - CRUD de igrejas
- `GET|POST /api/products` - CRUD de produtos
- `GET|POST /api/stock` - CRUD de estoque
- `GET|POST /api/orders` - CRUD de pedidos
- `GET /api/audit` - Logs de auditoria

## 📝 Notas de Desenvolvimento

- Todas as rotas do dashboard são protegidas por autenticação
- O token JWT é armazenado no localStorage
- Apenas usuários autenticados podem criar novos usuários
- Todas as ações são registradas no audit log
- O sistema é totalmente responsivo

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT.
