import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

const findAuthUserByEmail = async (email: string) => {
  const response = await fetch(`${supabaseUrl}/auth/v1/admin/users?page=1&per_page=1000`, {
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
    },
  })
  if (!response.ok) throw new Error('Kon bestaande accounts niet controleren')
  const payload = await response.json()
  const users = Array.isArray(payload?.users) ? payload.users : []
  return users.find((u: { email?: string | null }) => u.email?.toLowerCase() === email.toLowerCase()) ?? null
}

const assignDevRole = async (
  supabaseAdmin: ReturnType<typeof createClient>,
  userId: string,
  role: 'developer' | 'head_developer'
) => {
  const { error: clearError } = await supabaseAdmin
    .from('user_roles')
    .delete()
    .eq('user_id', userId)
    .in('role', ['developer', 'head_developer'])
  if (clearError) throw clearError

  const { error: roleError } = await supabaseAdmin
    .from('user_roles')
    .insert({ user_id: userId, role })
  if (roleError) throw roleError
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('No authorization header')

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)
    const supabaseUser = createClient(supabaseUrl, anonKey)

    const token = authHeader.replace('Bearer ', '')
    const { data: { user: caller }, error: authError } = await supabaseUser.auth.getUser(token)
    if (authError || !caller) throw new Error('Unauthorized')

    const { data: isAdmin } = await supabaseAdmin.rpc('is_admin', { _user_id: caller.id })
    if (!isAdmin) throw new Error('Only admins can create developer accounts')

    const { username, role } = await req.json()
    const cleanUsername = String(username || '').trim()
    if (!cleanUsername || !role) throw new Error('Username and role are required')
    if (!['developer', 'head_developer'].includes(role)) throw new Error('Invalid role')

    const tempPassword = crypto.randomUUID().slice(0, 12) + 'A1!'
    const email = `${cleanUsername.toLowerCase()}@hdrp.dev`

    const { data: existingProfile } = await supabaseAdmin
      .from('staff_profiles')
      .select('id, user_id')
      .eq('username', cleanUsername)
      .maybeSingle()

    if (existingProfile) throw new Error('Gebruikersnaam bestaat al')

    const existingAuthUser = await findAuthUserByEmail(email)

    if (existingAuthUser) {
      const userId = existingAuthUser.id
      const { error: updErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: tempPassword,
        email_confirm: true,
      })
      if (updErr) throw updErr

      const { data: existingUserProfile } = await supabaseAdmin
        .from('staff_profiles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle()

      if (existingUserProfile) {
        await supabaseAdmin
          .from('staff_profiles')
          .update({ username: cleanUsername, must_change_password: true })
          .eq('user_id', userId)
      } else {
        await supabaseAdmin
          .from('staff_profiles')
          .insert({ user_id: userId, username: cleanUsername, must_change_password: true })
      }

      await assignDevRole(supabaseAdmin, userId, role)

      return new Response(
        JSON.stringify({ message: 'Developer account reactivated', username: cleanUsername, tempPassword, role }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
    })
    if (createError) throw createError

    const userId = userData.user!.id

    const { error: profileError } = await supabaseAdmin
      .from('staff_profiles')
      .insert({ user_id: userId, username: cleanUsername, must_change_password: true })
    if (profileError) throw profileError

    await assignDevRole(supabaseAdmin, userId, role)

    return new Response(
      JSON.stringify({ message: 'Developer account created', username: cleanUsername, tempPassword, role }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
