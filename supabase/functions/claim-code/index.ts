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
      .select('id, code, active, claimed_at, claimed_by_username, is_test_code')
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

    // Get products associated with this code with full details including prices
    const { data: codeProducts, error: productsError } = await supabaseAdmin
      .from('code_products')
      .select(`
        product_id,
        products:product_id (
          id,
          name,
          description,
          details,
          price,
          discounted_price
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

    // Calculate total amounts
    let totalAmount = 0
    let finalAmount = 0
    const productsWithPrices = codeProducts.map((cp: any) => {
      const price = parseFloat(cp.products.price)
      const discountedPrice = cp.products.discounted_price ? parseFloat(cp.products.discounted_price) : null
      const actualPrice = discountedPrice ?? price
      
      totalAmount += price
      finalAmount += actualPrice
      
      return {
        id: cp.products.id,
        name: cp.products.name,
        description: cp.products.description,
        details: cp.products.details,
        original_price: price,
        final_price: actualPrice
      }
    })

    const totalDiscount = totalAmount - finalAmount

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

    // Track claim in statistics (only if not a test code)
    const { error: claimError } = await supabaseAdmin
      .from('code_claims')
      .insert({
        code_id: redemptionCode.id,
        code: redemptionCode.code,
        claimed_by_username: roblox_username,
        total_amount: totalAmount,
        total_discount: totalDiscount,
        final_amount: finalAmount,
        products_data: productsWithPrices,
        is_test_claim: redemptionCode.is_test_code
      })

    if (claimError) {
      console.error('Error tracking claim:', claimError)
      // Don't fail the claim if tracking fails, just log it
    }

    // Return products
    const products = productsWithPrices.map((p: any) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      details: p.details
    }))

    console.log(`Code ${code} successfully claimed by ${roblox_username}. Total: €${finalAmount.toFixed(2)} (Discount: €${totalDiscount.toFixed(2)})`)

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