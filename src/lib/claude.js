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
          content: `Analiza el siguiente transcript de una reunión e identifica ABSOLUTAMENTE TODAS las tareas pendientes, compromisos o action items mencionados, por más mínimos o insignificantes que parezcan. Es VITAL que no se escape ningún detalle.

Para cada tarea, sigue ESTRICTAMENTE esta estructura de redacción para el título (No omitas ninguna parte):
"Hacer [acción específica] para [objetivo, proyecto o destinatario], por medio de [método, herramienta o recurso si se menciona]".

REGLAS CRÍTICAS:
1. El título DEBE empezar con un emoji relacionado con la tarea.
2. El título DEBE seguir la estructura: Hacer X para Y, por medio de Z.
3. Identifica tareas incluso si son informales (ej: "le enviaré un mensaje a Juan").
4. Extrae links, documentos o recursos mencionados en el array "resources".

Ejemplo: "🎨 Hacer el diseño del banner para la campaña de mayo, por medio de Figma".

Devuelve ÚNICAMENTE un JSON válido con este formato:
{
  "tasks": [
    {
      "title": "Emoji + Título con la estructura: Hacer X para Y, por medio de Z",
      "description": "Descripción detallada con contexto adicional",
      "due_date": "YYYY-MM-DD o null",
      "assigned_name": "Nombre de la persona responsable o null",
      "priority": "alta, media o baja",
      "category": "Marketing, Ventas, Diseño, Desarrollo, Legal, Operaciones o null",
      "resources": [
        {"name": "Nombre descriptivo del recurso", "url": "URL exacta mencionada"}
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
