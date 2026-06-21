// One-off: create a full-privilege (admin) developer account.
// Reads the Supabase URL + anon key straight from src/lib/supabase.ts so the
// credentials never have to be retyped. Run with: node scripts/seed-dev.mjs
import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

const EMAIL = 'izabayoeloi2@gmail.com'
const PASSWORD = '123456'
const FULL_NAME = 'Developer'
const ROLE = 'admin' // admin = all privileges on this platform

const src = readFileSync(new URL('../src/lib/supabase.ts', import.meta.url), 'utf8')
const url = src.match(/supabaseUrl\s*=\s*'([^']+)'/)[1]
const key = src.match(/eyJ[A-Za-z0-9._-]+/g).pop()

const supabase = createClient(url, key)

async function main() {
  let userId

  const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
    email: EMAIL,
    password: PASSWORD,
    options: { data: { full_name: FULL_NAME, role: ROLE } },
  })

  if (signUpErr) {
    console.log('signUp:', signUpErr.message, '— trying sign in instead')
    const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
      email: EMAIL,
      password: PASSWORD,
    })
    if (signInErr) {
      console.error('FAILED to sign in:', signInErr.message)
      process.exit(1)
    }
    userId = signInData.user.id
  } else {
    userId = signUpData.user?.id
    if (!signUpData.session) {
      // Email confirmation is likely ON; profile insert under RLS will fail.
      console.log('NOTE: no session after signUp (email confirmation may be enabled).')
    }
  }

  if (!userId) {
    console.error('No user id resolved; aborting.')
    process.exit(1)
  }

  const { error: profErr } = await supabase
    .from('profiles')
    .upsert({ id: userId, email: EMAIL, full_name: FULL_NAME, role: ROLE, phone: '' })

  if (profErr) {
    console.error('PROFILE WRITE FAILED:', profErr.message)
    console.error('You may need to run this SQL in the Supabase dashboard instead:')
    console.error(`  update public.profiles set role='admin' where email='${EMAIL}';`)
    process.exit(1)
  }

  console.log('SUCCESS: dev account ready')
  console.log('  user id :', userId)
  console.log('  email   :', EMAIL)
  console.log('  role    :', ROLE)
}

main().catch((e) => {
  console.error('Unexpected error:', e.message)
  process.exit(1)
})
