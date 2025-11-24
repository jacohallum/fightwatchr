export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startSyncScheduler } = await import('./lib/services/sync-scheduler')
    startSyncScheduler()
  }
}