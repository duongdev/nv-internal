export function formatTaskId(id: number) {
  return `CV${String(id).padStart(3, '0')}`
}

export function extractTaskId(taskId: string) {
  const match = taskId.match(/^CV(\d*)$/)
  return match ? parseInt(match[1], 10) : null
}
