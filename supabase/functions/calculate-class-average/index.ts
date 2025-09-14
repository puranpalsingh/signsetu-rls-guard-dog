// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs

// supabase/functions/calculate-class-average/index.ts
import { createClient } from "npm:@supabase/supabase-js@2";
import { MongoClient } from "npm:mongodb";

// Define the expected request body structure
interface RequestBody {
  classroom_id: string;
}

Deno.serve(async (req) => {
  // 1. --- SETUP & VALIDATION ---
  // This is needed to ensure the user is authenticated
  const authHeader = req.headers.get('Authorization')!;
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing auth header' }), { status: 401 });
  }

  // Create a Supabase client with the user's authentication
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );


  const { classroom_id }: RequestBody = await req.json();
  if (!classroom_id) {
    return new Response(JSON.stringify({ error: 'classroom_id is required' }), { status: 400 });
  }


  const { data: progressRecords, error: progressError } = await supabase
    .from('progress')
    .select('score')
    .eq('classroom_id', classroom_id);

  if (progressError) {
    return new Response(JSON.stringify({ error: progressError.message }), { status: 500 });
  }

  if (!progressRecords || progressRecords.length === 0) {
    return new Response(JSON.stringify({ message: 'No progress records found for this class.' }), { status: 200 });
  }

  
  const totalScore = progressRecords.reduce((sum : any, record : any) => sum + record.score, 0);
  const averageScore = totalScore / progressRecords.length;

  const roundedAverage = Math.round(averageScore * 100) / 100; 

  
  // Try to connect to MongoDB, but don't fail if it's not available
  let mongoSuccess = false;
  try {
    const MONGODB_URI = Deno.env.get('MONGODB_URI');
    const client = new MongoClient(MONGODB_URI);

    await client.connect();
    const db = client.db("schoolAnalytics");
    const collection = db.collection("classAverages"); 

    await collection.updateOne(
      { classroom_id: classroom_id },
      { 
        $set: { 
          average_score: roundedAverage,
          last_calculated: new Date()
        } 
      },
      { upsert: true }
    );

    await client.close();
    mongoSuccess = true;
    console.log('Successfully saved to MongoDB');

  } catch (err) {
    console.error('MongoDB error (non-fatal):', err);
    // Don't fail the entire request if MongoDB is unavailable
  }


  return new Response(JSON.stringify({ 
    message: mongoSuccess ? 'Average calculated and saved to MongoDB successfully' : 'Average calculated successfully (MongoDB unavailable)',
    average: roundedAverage,
    mongo_saved: mongoSuccess
  }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  });
})
/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/calculate-class-average' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
