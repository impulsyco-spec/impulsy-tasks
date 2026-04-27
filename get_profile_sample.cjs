
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function getProfileSample() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .limit(1)
    .single()
  
  if (error) {
    console.error(error)
    return
  }
  console.log(JSON.stringify(data, null, 2))
}

getProfileSample()
