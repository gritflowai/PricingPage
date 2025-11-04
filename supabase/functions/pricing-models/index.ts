import { createClient } from 'npm:@supabase/supabase-js@2.78.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface PricingModel {
  id: string;
  name: string;
  status: 'draft' | 'active' | 'deprecated';
  valid_from: string;
  valid_to: string | null;
  config_json: Record<string, any>;
  created_at: string;
}

interface CreatePricingModelRequest {
  name: string;
  status: 'draft' | 'active' | 'deprecated';
  valid_from: string;
  valid_to?: string;
  config_json: Record<string, any>;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const url = new URL(req.url);
    const path = url.pathname.split('/pricing-models')[1] || '';

    // GET /pricing-models/active - Get currently active pricing model
    if (req.method === 'GET' && path === '/active') {
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('pricing_models')
        .select('*')
        .eq('status', 'active')
        .lte('valid_from', now)
        .or(`valid_to.is.null,valid_to.gt.${now}`)
        .maybeSingle();

      if (error) {
        return new Response(
          JSON.stringify({ error: `Database error: ${error.message}` }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      if (!data) {
        return new Response(
          JSON.stringify({ error: 'No active pricing model found' }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Check if multiple active models exist (data integrity issue)
      const { count, error: countError } = await supabase
        .from('pricing_models')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .lte('valid_from', now)
        .or(`valid_to.is.null,valid_to.gt.${now}`);

      if (countError) {
        console.error('Error checking for multiple active models:', countError);
      } else if (count && count > 1) {
        return new Response(
          JSON.stringify({ error: 'Multiple active pricing models found. Data integrity issue.' }),
          {
            status: 409,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST /pricing-models - Create new pricing model
    if (req.method === 'POST' && path === '') {
      const body: CreatePricingModelRequest = await req.json();

      // Validate required fields
      if (!body.name || !body.status || !body.valid_from || !body.config_json) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields: name, status, valid_from, config_json' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Validate status
      if (!['draft', 'active', 'deprecated'].includes(body.status)) {
        return new Response(
          JSON.stringify({ error: 'Invalid status. Must be one of: draft, active, deprecated' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const { data, error } = await supabase
        .from('pricing_models')
        .insert({
          name: body.name,
          status: body.status,
          valid_from: body.valid_from,
          valid_to: body.valid_to || null,
          config_json: body.config_json,
        })
        .select()
        .single();

      if (error) {
        return new Response(
          JSON.stringify({ error: `Failed to create pricing model: ${error.message}` }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(JSON.stringify(data), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Invalid route
    return new Response(
      JSON.stringify({ error: 'Not found' }),
      {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});