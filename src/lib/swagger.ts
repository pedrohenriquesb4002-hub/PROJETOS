import { createSwaggerSpec } from 'next-swagger-doc';

export const getApiDocs = () => {
  const spec = createSwaggerSpec({
    apiFolder: 'src/app/api',
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Pedro Igreja API Documentation',
        version: '1.0.0',
        description: 'API documentation for Pedro Igreja management system',
      },
      servers: [
        {
          url: 'http://localhost:3000',
          description: 'Development server',
        },
      ],
      components: {
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
        schemas: {
          User: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                format: 'uuid',
                description: 'ID do usuário',
              },
              name: {
                type: 'string',
                description: 'Nome do usuário',
              },
              email: {
                type: 'string',
                format: 'email',
                description: 'Email do usuário',
              },
              cpf: {
                type: 'string',
                description: 'CPF do usuário',
              },
              phone: {
                type: 'string',
                description: 'Telefone do usuário',
              },
              createdAt: {
                type: 'string',
                format: 'date-time',
                description: 'Data de criação',
              },
              updatedAt: {
                type: 'string',
                format: 'date-time',
                description: 'Data de atualização',
              },
            },
          },
          Product: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                format: 'uuid',
                description: 'ID do produto',
              },
              name: {
                type: 'string',
                description: 'Nome do produto',
              },
              code: {
                type: 'string',
                description: 'Código do produto',
              },
              price: {
                type: 'integer',
                description: 'Preço do produto em centavos',
              },
              createdAt: {
                type: 'string',
                format: 'date-time',
                description: 'Data de criação',
              },
              updatedAt: {
                type: 'string',
                format: 'date-time',
                description: 'Data de atualização',
              },
            },
          },
          Igreja: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                format: 'uuid',
                description: 'ID da igreja',
              },
              name: {
                type: 'string',
                description: 'Nome da igreja',
              },
              cnpj: {
                type: 'string',
                description: 'CNPJ da igreja',
              },
              number: {
                type: 'integer',
                description: 'Número do endereço',
              },
              street: {
                type: 'string',
                description: 'Rua',
              },
              city: {
                type: 'string',
                description: 'Cidade',
              },
              state: {
                type: 'string',
                description: 'Estado',
              },
              zipCode: {
                type: 'string',
                description: 'CEP',
              },
              neighborhood: {
                type: 'string',
                description: 'Bairro',
              },
              createdAt: {
                type: 'string',
                format: 'date-time',
                description: 'Data de criação',
              },
              updatedAt: {
                type: 'string',
                format: 'date-time',
                description: 'Data de atualização',
              },
            },
          },
          Order: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                format: 'uuid',
                description: 'ID do pedido',
              },
              productId: {
                type: 'string',
                format: 'uuid',
                description: 'ID do produto',
              },
              quantity: {
                type: 'integer',
                description: 'Quantidade',
              },
              igrejaId: {
                type: 'string',
                format: 'uuid',
                description: 'ID da igreja',
              },
              createdAt: {
                type: 'string',
                format: 'date-time',
                description: 'Data de criação',
              },
              updatedAt: {
                type: 'string',
                format: 'date-time',
                description: 'Data de atualização',
              },
            },
          },
          Stock: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                format: 'uuid',
                description: 'ID do estoque',
              },
              productId: {
                type: 'string',
                format: 'uuid',
                description: 'ID do produto',
              },
              quantity: {
                type: 'integer',
                description: 'Quantidade em estoque',
              },
              createdAt: {
                type: 'string',
                format: 'date-time',
                description: 'Data de criação',
              },
              updatedAt: {
                type: 'string',
                format: 'date-time',
                description: 'Data de atualização',
              },
            },
          },
          AuditLog: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                format: 'uuid',
                description: 'ID do log',
              },
              userId: {
                type: 'string',
                format: 'uuid',
                description: 'ID do usuário',
              },
              action: {
                type: 'string',
                description: 'Ação realizada',
              },
              entityType: {
                type: 'string',
                description: 'Tipo de entidade',
              },
              entityId: {
                type: 'string',
                format: 'uuid',
                description: 'ID da entidade afetada',
              },
              oldData: {
                type: 'string',
                description: 'Dados anteriores (JSON)',
              },
              newData: {
                type: 'string',
                description: 'Dados novos (JSON)',
              },
              ipAddress: {
                type: 'string',
                description: 'Endereço IP',
              },
              userAgent: {
                type: 'string',
                description: 'User agent',
              },
              createdAt: {
                type: 'string',
                format: 'date-time',
                description: 'Data de criação',
              },
            },
          },
        },
      },
    },
  });
  return spec;
};
