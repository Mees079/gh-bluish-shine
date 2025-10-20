import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { code, roblox_username } = await req.json()

    if (!code || !roblox_username) {
      return new Response(
        JSON.stringify({ success: false, error: 'Code en Roblox username zijn verplicht' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    // Find the code
    const { data: redemptionCode, error: codeError } = await supabaseAdmin
      .from('redemption_codes')
      .select('id, code, active, claimed_at, claimed_by_username')
      .eq('code', code.toUpperCase())
      .single()

    if (codeError || !redemptionCode) {
      console.error('Code not found:', codeError)
      return new Response(
        JSON.stringify({ success: false, error: 'Ongeldige code' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if code is active
    if (!redemptionCode.active) {
      return new Response(
        JSON.stringify({ success: false, error: 'Code is gedeactiveerd' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get full code details including scheduled_start
    const { data: fullCode, error: fullCodeError } = await supabaseAdmin
      .from('redemption_codes')
      .select('scheduled_start')
      .eq('id', redemptionCode.id)
      .single()

    if (fullCodeError || !fullCode) {
      console.error('Error fetching full code:', fullCodeError)
      return new Response(
        JSON.stringify({ success: false, error: 'Fout bij ophalen code details' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if code is scheduled for future
    const now = new Date()
    const scheduledStart = new Date(fullCode.scheduled_start)
    if (scheduledStart > now) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Code is nog niet actief. Beschikbaar vanaf ${scheduledStart.toLocaleString('nl-NL')}` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if code is already claimed
    if (redemptionCode.claimed_at) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Code is al geclaimed door ${redemptionCode.claimed_by_username}` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get products associated with this code
    const { data: codeProducts, error: productsError } = await supabaseAdmin
      .from('code_products')
      .select(`
        product_id,
        products:product_id (
          id,
          name,
          description,
          details
        )
      `)
      .eq('code_id', redemptionCode.id)

    if (productsError) {
      console.error('Error fetching products:', productsError)
      return new Response(
        JSON.stringify({ success: false, error: 'Fout bij ophalen producten' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Mark code as claimed
    const { error: updateError } = await supabaseAdmin
      .from('redemption_codes')
      .update({
        claimed_at: new Date().toISOString(),
        claimed_by_username: roblox_username
      })
      .eq('id', redemptionCode.id)

    if (updateError) {
      console.error('Error updating code:', updateError)
      return new Response(
        JSON.stringify({ success: false, error: 'Fout bij claimen code' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Return products
    const products = codeProducts.map((cp: any) => ({
      id: cp.products.id,
      name: cp.products.name,
      description: cp.products.description,
      details: cp.products.details
    }))

    console.log(`Code ${code} successfully claimed by ${roblox_username}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        products,
        message: `Code succesvol geclaimed! Je ontvangt: ${products.map((p: any) => p.name).join(', ')}`
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in claim-code function:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})