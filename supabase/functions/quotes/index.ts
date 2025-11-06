// Edge function for Quote operations
// Security model: Access control is based on Form ID (UUID) possession
// Users can only access quotes if they have the specific Form ID (unguessable GUID)

import { createClient } from 'npm:@supabase/supabase-js@2.78.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface Quote {
  id: string; // Form ID (UUID) - primary security identifier
  pricing_model_id: string;
  selected_plan: string;
  count: number;
  is_annual: boolean;
  subtotal: number | null;
  final_monthly_price: number | null;
  price_per_unit: number | null;
  annual_savings: number | null;
  price_breakdown: Record<string, any>;
  plan_details: Record<string, any>;
  selection_raw: Record<string, any>;
  status: 'draft' | 'locked' | 'accepted' | 'expired';
  version: number;
  created_at: string;
  updated_at: string;
  locked_at: string | null;
  expires_at: string | null;
  accepted_at: string | null;
}

interface InitQuoteRequest {
  id: string; // Form ID (UUID)
  selected_plan: string;
  count: number;
  is_annual: boolean;
}

interface UpdateQuoteRequest {
  id: string; // Form ID (UUID)
  summary: {
    subtotal: number;
    final_monthly_price: number;
    price_per_unit: number;
    annual_savings: number;
    price_breakdown: Record<string, any>;
    plan_details: Record<string, any>;
    selection_raw?: Record<string, any>;
  };
}

interface LockQuoteRequest {
  id: string; // Form ID (UUID)
  expires_in_days?: number;
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
    const path = url.pathname.split('/quotes')[1] || '';

    // POST /quotes/init - Initialize a new quote
    if (req.method === 'POST' && path === '/init') {
      const body: InitQuoteRequest = await req.json();

      // Validate required fields
      if (!body.id || !body.selected_plan || !body.count) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields: id, selected_plan, count' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Validate count is positive
      if (body.count <= 0) {
        return new Response(
          JSON.stringify({ error: 'Count must be a positive number' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Get active pricing model
      const now = new Date().toISOString();
      const { data: pricingModel, error: pricingError } = await supabase
        .from('pricing_models')
        .select('id')
        .eq('status', 'active')
        .lte('valid_from', now)
        .or(`valid_to.is.null,valid_to.gt.${now}`)
        .maybeSingle();

      if (pricingError) {
        return new Response(
          JSON.stringify({ error: `Failed to get active pricing model: ${pricingError.message}` }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      if (!pricingModel) {
        return new Response(
          JSON.stringify({ error: 'No active pricing model found' }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Upsert quote
      const { data, error } = await supabase
        .from('quotes')
        .upsert(
          {
            id: body.id,
            pricing_model_id: pricingModel.id,
            selected_plan: body.selected_plan,
            count: body.count,
            is_annual: body.is_annual ?? false,
            status: 'draft',
            version: 1,
            updated_at: now,
          },
          { onConflict: 'id' }
        )
        .select()
        .single();

      if (error) {
        return new Response(
          JSON.stringify({ error: `Failed to initialize quote: ${error.message}` }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST /quotes/update - Update draft quote calculations
    if (req.method === 'POST' && path === '/update') {
      const body: UpdateQuoteRequest = await req.json();

      // Validate required fields
      if (!body.id || !body.summary) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields: id, summary' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const now = new Date().toISOString();

      // Update quote only if status is draft
      const { data, error } = await supabase
        .from('quotes')
        .update({
          subtotal: body.summary.subtotal,
          final_monthly_price: body.summary.final_monthly_price,
          price_per_unit: body.summary.price_per_unit,
          annual_savings: body.summary.annual_savings,
          price_breakdown: body.summary.price_breakdown,
          plan_details: body.summary.plan_details,
          selection_raw: body.summary.selection_raw || {},
          updated_at: now,
        })
        .eq('id', body.id)
        .eq('status', 'draft')
        .select()
        .maybeSingle();

      if (error) {
        return new Response(
          JSON.stringify({ error: `Failed to update quote: ${error.message}` }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      if (!data) {
        return new Response(
          JSON.stringify({ error: 'Quote not found or not in draft status' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST /quotes/lock - Lock a quote
    if (req.method === 'POST' && path === '/lock') {
      const body: LockQuoteRequest = await req.json();

      // Validate required fields
      if (!body.id) {
        return new Response(
          JSON.stringify({ error: 'Missing required field: id' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const expiresInDays = body.expires_in_days ?? 30;
      const now = new Date();
      const lockedAt = now.toISOString();
      const expiresAt = new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000).toISOString();

      // First, get current version
      const { data: currentQuote, error: fetchError } = await supabase
        .from('quotes')
        .select('version')
        .eq('id', body.id)
        .eq('status', 'draft')
        .maybeSingle();

      if (fetchError) {
        return new Response(
          JSON.stringify({ error: `Failed to fetch quote: ${fetchError.message}` }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      if (!currentQuote) {
        return new Response(
          JSON.stringify({ error: 'Quote not found or not in draft status' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Update quote to locked status
      const { data, error } = await supabase
        .from('quotes')
        .update({
          status: 'locked',
          locked_at: lockedAt,
          expires_at: expiresAt,
          version: currentQuote.version + 1,
          updated_at: lockedAt,
        })
        .eq('id', body.id)
        .eq('status', 'draft')
        .select()
        .single();

      if (error) {
        return new Response(
          JSON.stringify({ error: `Failed to lock quote: ${error.message}` }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST /quotes/unlock - Unlock a quote (return to draft)
    if (req.method === 'POST' && path === '/unlock') {
      const body: { id: string } = await req.json();

      // Validate required fields
      if (!body.id) {
        return new Response(
          JSON.stringify({ error: 'Missing required field: id' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const now = new Date().toISOString();

      // Update quote to draft status (from locked or accepted)
      // Clear locked_at, expires_at, and accepted_at
      // Reset version to 1
      const { data, error } = await supabase
        .from('quotes')
        .update({
          status: 'draft',
          locked_at: null,
          expires_at: null,
          accepted_at: null,
          version: 1,
          updated_at: now,
        })
        .eq('id', body.id)
        .in('status', ['locked', 'accepted'])
        .select()
        .maybeSingle();

      if (error) {
        return new Response(
          JSON.stringify({ error: `Failed to unlock quote: ${error.message}` }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      if (!data) {
        return new Response(
          JSON.stringify({ error: 'Quote not found or not in locked/accepted status' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST /quotes/accept - Accept a locked quote
    if (req.method === 'POST' && path === '/accept') {
      const body: { id: string; accepted_at?: string; email?: string } = await req.json();

      // Validate required fields
      if (!body.id) {
        return new Response(
          JSON.stringify({ error: 'Missing required field: id' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const acceptedAt = body.accepted_at || new Date().toISOString();

      // Update quote to accepted status (only if currently locked)
      const { data, error } = await supabase
        .from('quotes')
        .update({
          status: 'accepted',
          accepted_at: acceptedAt,
          updated_at: acceptedAt,
        })
        .eq('id', body.id)
        .eq('status', 'locked')
        .select()
        .maybeSingle();

      if (error) {
        return new Response(
          JSON.stringify({ error: `Failed to accept quote: ${error.message}` }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      if (!data) {
        return new Response(
          JSON.stringify({ error: 'Quote not found or not in locked status' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // TODO: Send confirmation email to body.email if provided
      // TODO: Trigger onboarding workflow

      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET /quotes/:id - Load an existing quote
    if (req.method === 'GET' && path.startsWith('/')) {
      const id = path.substring(1);

      if (!id) {
        return new Response(
          JSON.stringify({ error: 'Missing quote ID' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Fetch quote
      const { data: quote, error: fetchError } = await supabase
        .from('quotes')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (fetchError) {
        return new Response(
          JSON.stringify({ error: `Failed to fetch quote: ${fetchError.message}` }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      if (!quote) {
        return new Response(
          JSON.stringify({ error: 'Quote not found' }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Check if quote is expired
      const now = new Date();
      if (quote.status === 'locked' && quote.expires_at) {
        const expiresAt = new Date(quote.expires_at);
        if (expiresAt < now) {
          // Update status to expired
          const { data: updatedQuote, error: updateError } = await supabase
            .from('quotes')
            .update({ status: 'expired', updated_at: now.toISOString() })
            .eq('id', id)
            .select()
            .single();

          if (updateError) {
            console.error('Failed to update expired quote:', updateError);
            // Still return the quote with current status
          } else {
            // Return updated quote
            return new Response(JSON.stringify(updatedQuote), {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }
      }

      return new Response(JSON.stringify(quote), {
        status: 200,
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