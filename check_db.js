import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://etwrbylqppgjmevzlkil.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0d3JieWxxcHBnam1ldnpsa2lsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1Nzg2NDQsImV4cCI6MjA5MTE1NDY0NH0.ilGExw35EWQMlGJVT1VtaE7vaEk8Gn69g-tPWvdNbkQ')

async function checkColumns() {
  const { data, error } = await supabase.from('tasks').select('*').limit(1)
  if (error) {
    console.error(error)
  } else {
    console.log(Object.keys(data[0] || {}))
  }
}

checkColumns()
