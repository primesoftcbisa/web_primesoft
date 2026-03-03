// Supabase Edge Function: openai-proxy

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const openaiKey = Deno.env.get('OPENAI_API_KEY')!;

Deno.serve(async (req) => {
  const { messages, userId } = await req.json();

  // 1. Validate Auth (Optional but recommended)
  // 2. Call OpenAI
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: messages,
    }),
  });

  const data = await response.json();
  
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  });
});
