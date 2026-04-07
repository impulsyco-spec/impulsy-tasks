import "@supabase/functions-js/edge-runtime.d.ts"

const ONESIGNAL_APP_ID = Deno.env.get('ONESIGNAL_APP_ID')!
const ONESIGNAL_REST_KEY = Deno.env.get('ONESIGNAL_REST_KEY')!

Deno.serve(async (req) => {
  try {
    const payload = await req.json()
    const notification = payload.record

    if (!notification?.user_id || !notification?.message) {
      return new Response('ok', { status: 200 })
    }

    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ONESIGNAL_REST_KEY}`,
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        include_aliases: { external_id: [notification.user_id] },
        target_channel: 'push',
        headings: { en: 'Impulsy Tasks', es: 'Impulsy Tasks' },
        contents: { en: notification.message, es: notification.message },
      }),
    })

    const result = await response.json()
    return new Response(JSON.stringify(result), { status: 200 })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})
