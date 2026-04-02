import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Verify the calling user is an admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('No authorization header')

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const token = authHeader.replace('Bearer ', '')
    const { data: { user: caller }, error: authError } = await supabaseUser.auth.getUser(token)
    if (authError || !caller) throw new Error('Unauthorized')

    // Check if caller is admin
    const { data: isAdmin } = await supabaseAdmin.rpc('is_admin', { _user_id: caller.id })
    if (!isAdmin) throw new Error('Only admins can create staff accounts')

    const { username, role } = await req.json()
    if (!username || !role) throw new Error('Username and role are required')
    if (!['coordinatie', 'bestuur'].includes(role)) throw new Error('Invalid role')

    // Generate temp password
    const tempPassword = crypto.randomUUID().slice(0, 12) + 'A1!'

    const email = `${username}@hdrp.staff`

    // Check if user already exists
    const { data: existingProfile } = await supabaseAdmin
      .from('staff_profiles')
      .select('id')
      .eq('username', username)
      .single()

    if (existingProfile) throw new Error('Username already exists')

    // Create auth user
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
    })
    if (createError) throw createError

    const userId = userData.user!.id

    // Create staff profile
    const { error: profileError } = await supabaseAdmin
      .from('staff_profiles')
      .insert({ user_id: userId, username, must_change_password: true })
    if (profileError) throw profileError

    // Assign role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({ user_id: userId, role })
    if (roleError) throw roleError

    return new Response(
      JSON.stringify({ 
        message: 'Staff account created',
        username,
        tempPassword,
        role,
      }),
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
