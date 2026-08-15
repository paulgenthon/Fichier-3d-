import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Variables Supabase manquantes : vérifie ton fichier .env.local (voir README.md)"
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const MODELS_BUCKET = "models";
export const IMAGES_BUCKET = "images";
export const MODELS_TABLE = "models";
