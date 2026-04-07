// Linkea el usuario de Supabase con OneSignal
export async function loginOneSignal(userId) {
  if (!window.OneSignal) return
  try {
    await window.OneSignal.login(userId)
  } catch (e) {
    console.warn('OneSignal login error:', e)
  }
}

export async function logoutOneSignal() {
  if (!window.OneSignal) return
  try {
    await window.OneSignal.logout()
  } catch (e) {
    console.warn('OneSignal logout error:', e)
  }
}

// Envía push a un usuario por su Supabase user ID
export async function sendPush({ userId, title, message }) {
  try {
    await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${import.meta.env.VITE_ONESIGNAL_REST_KEY}`,
      },
      body: JSON.stringify({
        app_id: import.meta.env.VITE_ONESIGNAL_APP_ID,
        include_aliases: { external_id: [userId] },
        target_channel: 'push',
        headings: { en: title, es: title },
        contents: { en: message, es: message },
      }),
    })
  } catch (e) {
    console.warn('OneSignal push error:', e)
  }
}
