export const SERVICE_PAUSED = true;

export function rejectIfServicePaused(res) {
  if (!SERVICE_PAUSED) return false;
  res.status(503).json({
    code: 'SERVICE_PAUSED',
    error: 'Track Start временно приостановлен. Новые генерации и платежи недоступны.',
  });
  return true;
}
