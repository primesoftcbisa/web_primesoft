// Supabase Edge Function: cbot-cron
// Schedule: 08:00 America/Asuncion

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

Deno.serve(async (req) => {
  try {
    const cultures = ['Soja', 'Maiz', 'Trigo'];
    const today = new Date().toISOString().split('T')[0];

    for (const culture of cultures) {
      // Mocking Yahoo Finance fetch (In a real scenario, use a library or API)
      // For this demo, we'll simulate the data structure
      const mockData = {
        cultura: culture,
        fecha: today,
        cierre: Math.random() * 500 + 300,
        alto: Math.random() * 600 + 400,
        bajo: Math.random() * 400 + 200,
        apertura: Math.random() * 500 + 300,
      };

      const { error } = await supabase
        .from('cbot')
        .upsert(mockData, { onConflict: 'cultura,fecha' });

      if (error) console.error(`Error upserting ${culture}:`, error);
    }

    return new Response(JSON.stringify({ message: 'CBOT updated' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
