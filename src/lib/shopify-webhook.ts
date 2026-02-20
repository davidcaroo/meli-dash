const WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;

export async function actualizarPedido(
  accion: 'update_estado' | 'update_guia',
  rowIndex: number,
  valor: string
): Promise<{ success: boolean; error?: string; n8nResponse?: string }> {
  try {
    if (!WEBHOOK_URL) {
      throw new Error('NEXT_PUBLIC_N8N_WEBHOOK_URL is not defined');
    }

    const payload = { accion, rowIndex, valor };
    console.log('Enviando a proxy:', payload);

    const response = await fetch('/api/shopify/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    return { 
      success: result.success, 
      error: result.error, 
      n8nResponse: result.n8nResponse 
    };
  } catch (error) {
    console.error('Error actualizando pedido:', error);
    return { success: false, error: String(error) };
  }
}
