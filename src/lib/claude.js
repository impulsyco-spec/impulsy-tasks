export async function extractTasksFromTranscript(transcript) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `Analiza el siguiente transcript de una reunión e identifica absolutamente todas las tareas pendientes o action items mencionados, por más mínimos que sean. Es CRÍTICO que no se escape ningún detalle.

Para cada tarea, sigue estrictamente esta estructura de redacción para el título:
"Hacer [acción específica] para [objetivo o destinatario], por medio de [método o herramienta si se menciona]".

Ejemplo: "Hacer el diseño del banner para la campaña de mayo, por medio de Figma".

Devuelve ÚNICAMENTE un JSON válido con este formato, incluyendo emojis adecuados en el título:
{
  "tasks": [
    {
      "title": "📌 Título con la estructura solicitada",
      "description": "Descripción detallada",
      "due_date": "YYYY-MM-DD o null",
      "assigned_name": "Nombre o null",
      "priority": "alta, media o baja",
      "category": "Marketing, Ventas, Diseño, Desarrollo, Legal, Operaciones o null",
      "resources": [
        {"name": "Nombre del recurso/link", "url": "URL si se menciona"}
      ]
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
