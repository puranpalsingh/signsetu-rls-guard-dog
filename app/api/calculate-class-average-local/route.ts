export const runtime = "nodejs";

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { classroom_id } = await request.json();
    
    if (!classroom_id) {
      return NextResponse.json({ error: 'classroom_id is required' }, { status: 400 });
    }

    // Get the authorization header from the request
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 });
    }

    // Create Supabase client with anon key (works with RLS)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ 
        error: 'Supabase configuration missing. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.' 
      }, { status: 500 });
    }

    // Create Supabase client with the user's session
    const supabaseWithAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    console.log('Looking for progress records with classroom_id:', classroom_id);

    // Get progress records for the classroom using user's session
    const { data: progressRecords, error: progressError } = await supabaseWithAuth
      .from('progress')
      .select('score, classroom_id, student_id')
      .eq('classroom_id', classroom_id);

    console.log('Progress records found:', progressRecords?.length || 0);
    console.log('Progress records data:', progressRecords);

    if (progressError) {
      console.error('Progress query error:', progressError);
      return NextResponse.json({ error: progressError.message }, { status: 500 });
    }

    if (!progressRecords || progressRecords.length === 0) {
      // Try to get all progress records to debug
      const { data: allRecords } = await supabaseWithAuth
        .from('progress')
        .select('score, classroom_id, student_id');
      
      console.log('All progress records in database:', allRecords);
      
      return NextResponse.json({ 
        message: `No progress records found for classroom ${classroom_id}. Found ${allRecords?.length || 0} total records in database.`,
        average: 0,
        mongo_saved: false,
        debug_info: {
          requested_classroom: classroom_id,
          total_records: allRecords?.length || 0,
          available_classrooms: allRecords?.map(r => r.classroom_id) || []
        }
      }, { status: 200 });
    }

    // Calculate average
    const totalScore = progressRecords.reduce((sum, record) => sum + record.score, 0);
    const averageScore = totalScore / progressRecords.length;
    const roundedAverage = Math.round(averageScore * 100) / 100;

    // Try to save to MongoDB Atlas
    let mongoSuccess = false;
    try {
      const { MongoClient } = await import('mongodb');
      const MONGODB_URI = process.env.MONGODB_URI;

      if (!MONGODB_URI) {
        return NextResponse.json({ error: 'MONGODB_URI is not set' }, { status: 500 });
      }
      
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
      console.log(`Successfully saved to MongoDB Atlas: classroom_id=${classroom_id}, average=${roundedAverage}`);
    } catch (err) {
      console.error('MongoDB Atlas error (non-fatal):', err);
    }

    return NextResponse.json({ 
      message: mongoSuccess ? 'Average calculated and saved to MongoDB successfully' : 'Average calculated successfully (MongoDB simulation)',
      average: roundedAverage,
      mongo_saved: mongoSuccess,
      records_count: progressRecords.length
    });

  } catch (error) {
    console.error('Error in calculate-class-average-local API route:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
