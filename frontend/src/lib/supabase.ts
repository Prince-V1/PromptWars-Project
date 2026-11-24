import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://imfwiyknxgrtsivcnbwv.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_owGIP4XinREgQPq-D43T3Q__DoIxJ7Q";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
