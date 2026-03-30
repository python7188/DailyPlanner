import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
);

async function test() {
  const newTask = {
    id: crypto.randomUUID(),
    user_id: '8ac4b0a7-8051-4043-9dd6-9f44f54e19b8', // Let's use any random uuid
    title: 'Test',
    is_completed: false,
    target_date: '2026-03-30',
    time_target_minutes: null,
  };
  
  console.log('Inserting...', newTask);
  const { data, error } = await supabase.from('tasks').insert(newTask);
  console.log('Error:', error);
  console.log('Data:', data);
}

test();
