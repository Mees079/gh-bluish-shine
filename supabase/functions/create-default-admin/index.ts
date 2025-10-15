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

    // Create default admin user
    const email = 'HDRP@hdrp.local'
    const password = 'Mees'

    const { data: existingUser } = await supabase.auth.admin.listUsers()
    const userExists = existingUser?.users.some(u => u.email === email)

    if (!userExists) {
      const { data: userData, error: signUpError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      })

      if (signUpError) throw signUpError

      if (userData.user) {
        // Add super_admin role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: userData.user.id,
            role: 'super_admin'
          })

        if (roleError) throw roleError

        return new Response(
          JSON.stringify({ message: 'Default admin created successfully' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    return new Response(
      JSON.stringify({ message: 'Default admin already exists' }),
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
