export async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
) {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(endpoint, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = `Erro ${response.status}`;
      
      // Tratamento especial para 401
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        throw new Error('Sessão expirada. Faça login novamente.');
      }
      
      // Ler o corpo da resposta apenas uma vez
      const contentType = response.headers.get('content-type');
      try {
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } else {
          const text = await response.text();
          if (text) {
            errorMessage = text;
          }
        }
      } catch (e) {
        // Se falhar ao ler, mantém a mensagem padrão
        console.error('Erro ao ler resposta:', e);
      }
      
      console.error(`API Error [${endpoint}]:`, errorMessage);
      throw new Error(errorMessage);
    }

    return response.json();
  } catch (error: any) {
    // Se for erro de rede ou outro erro não tratado
    if (error.message.includes('fetch')) {
      throw new Error('Erro de conexão. Verifique se o servidor está rodando.');
    }
    throw error;
  }
}
