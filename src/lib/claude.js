export async function extractTasksFromTranscript(transcript) {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('Por favor configura VITE_OPENAI_API_KEY en tu archivo .env para poder extraer tareas con IA.')
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `Analiza el siguiente transcript de una reunión e identifica todas las tareas pendientes o action items mencionados.

PARA CADA TAREA:
- Agrega un emoji relevante al inicio del título (ej: 🚀, 🎨, 📊, 📞).
- Usa un tono profesional pero dinámico.
- Asegúrate de capturar fechas y responsables si se mencionan.

Devuelve ÚNICAMENTE un JSON válido con este formato, sin texto adicional:
{
  "tasks": [
    {
      "title": "🚀 Título corto de la tarea",
      "description": "Descripción detallada de la tarea",
      "due_date": "YYYY-MM-DD o null si no se menciona fecha",
      "assigned_name": "Nombre de la persona responsable mencionada en el transcript, o null si no se menciona"
    }
  ]
}

Transcript:
${transcript}`,
        },
      ],
    }),
  })

  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.error?.message || 'Error al llamar a OpenAI')
  }

  const data = await response.json()
  const text = data.choices[0].message.content.trim()
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('OpenAI no devolvió JSON válido')
  return JSON.parse(jsonMatch[0])
}
