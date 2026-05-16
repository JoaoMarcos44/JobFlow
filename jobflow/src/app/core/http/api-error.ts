/** Extrai mensagem legível de erros HTTP do backend ou da rede. */
export function readApiErrorMessage(
  error: { error?: { error?: string; message?: string }; status?: number },
  fallback: string,
): string {
  return (
    error?.error?.error ||
    error?.error?.message ||
    (error?.status === 400 ? 'Dados inválidos. Verifique os campos.' : fallback)
  );
}
