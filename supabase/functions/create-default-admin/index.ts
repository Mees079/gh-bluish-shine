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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Ensure default admin user and role
    const email = 'HDRP@hdrp.local'
    const password = 'Mees'

    const { data: usersList, error: listError } = await supabase.auth.admin.listUsers()
    if (listError) throw listError

    const existing = usersList?.users.find(u => u.email === email)

    if (!existing) {
      const { data: userData, error: signUpError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      })
      if (signUpError) throw signUpError

      if (userData.user) {
        const { error: roleError } = await supabase
          .from('user_roles')
          .upsert({ user_id: userData.user.id, role: 'super_admin' }, { onConflict: 'user_id,role' })
        if (roleError) throw roleError

        return new Response(
          JSON.stringify({ message: 'Default admin created and role ensured' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    } else {
      // Ensure role exists for existing user
      const { error: roleEnsureError } = await supabase
        .from('user_roles')
        .upsert({ user_id: existing.id, role: 'super_admin' }, { onConflict: 'user_id,role' })
      if (roleEnsureError) throw roleEnsureError

      return new Response(
        JSON.stringify({ message: 'Default admin already existed; role ensured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    return new Response(
      JSON.stringify({ message: 'No changes needed' }),
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
