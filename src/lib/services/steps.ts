import { supabase } from '$lib/supabaseClient';

export interface UserSteps {
    total_steps: number;
    last_updated: string;
}

export async function getUserSteps(): Promise<UserSteps | null> {
    const { data, error } = await supabase
        .rpc('get_user_steps')
        .single();

    if (error) {
        console.error('Error fetching user steps:', error);
        return null;
    }

    return data;
}

export async function initializeUserSteps(): Promise<UserSteps | null> {
    const { data, error } = await supabase
        .from('steps')
        .insert([{ total_steps: 0 }])
        .select()
        .single();

    if (error) {
        console.error('Error initializing user steps:', error);
        return null;
    }

    return data;
}

export async function updateUserSteps(newSteps: number): Promise<boolean> {
    const { error } = await supabase
        .from('steps')
        .update({ 
            total_steps: newSteps,
            last_updated: new Date().toISOString()
        })
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

    if (error) {
        console.error('Error updating user steps:', error);
        return false;
    }

    return true;
} 