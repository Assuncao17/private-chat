import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Só a chave publicável vive no frontend. A segurança vem do RLS no Supabase.
export const configured = Boolean(url && key);
export const supabase = configured ? createClient(url, key) : null;

export const MAX_MEMBERS = 5;
