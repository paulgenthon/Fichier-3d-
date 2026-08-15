############################################################
# FICHIER : package.json
# (cree un nouveau fichier sur GitHub avec exactement ce nom/chemin)
############################################################

{
  "name": "depot-stl",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.45.4",
    "lucide-react": "^0.383.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.13",
    "vite": "^5.4.8"
  }
}


############################################################
# FICHIER : vite.config.js
# (cree un nouveau fichier sur GitHub avec exactement ce nom/chemin)
############################################################

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
});


############################################################
# FICHIER : tailwind.config.js
# (cree un nouveau fichier sur GitHub avec exactement ce nom/chemin)
############################################################

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        sans: ["Inter", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      fontWeight: {
        600: "600",
        700: "700",
      },
    },
  },
  plugins: [],
};


############################################################
# FICHIER : postcss.config.js
# (cree un nouveau fichier sur GitHub avec exactement ce nom/chemin)
############################################################

export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};


############################################################
# FICHIER : index.html
# (cree un nouveau fichier sur GitHub avec exactement ce nom/chemin)
############################################################

<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Dépôt.stl — Bibliothèque de modèles 3D</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>


############################################################
# FICHIER : src/main.jsx
# (cree un nouveau fichier sur GitHub avec exactement ce nom/chemin)
############################################################

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);


############################################################
# FICHIER : src/index.css
# (cree un nouveau fichier sur GitHub avec exactement ce nom/chemin)
############################################################

@import url("https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap");

@tailwind base;
@tailwind components;
@tailwind utilities;

::-webkit-scrollbar {
  width: 8px;
}
::-webkit-scrollbar-thumb {
  background: #2a2f3a;
  border-radius: 4px;
}

@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.fade-up {
  animation: fadeUp 0.35s ease both;
}

.bp-grid {
  background-image: linear-gradient(rgba(90, 141, 239, 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(90, 141, 239, 0.06) 1px, transparent 1px);
  background-size: 28px 28px;
}


############################################################
# FICHIER : src/supabaseClient.js
# (cree un nouveau fichier sur GitHub avec exactement ce nom/chemin)
############################################################

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


############################################################
# FICHIER : src/App.jsx
# (cree un nouveau fichier sur GitHub avec exactement ce nom/chemin)
############################################################

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Search,
  Upload,
  Download,
  X,
  Plus,
  Box,
  Loader2,
  ImagePlus,
  FileBox,
  AlertCircle,
} from "lucide-react";
import { supabase, MODELS_BUCKET, IMAGES_BUCKET, MODELS_TABLE } from "./supabaseClient";

// ---------- helpers ----------

const formatBytes = (bytes) => {
  if (!bytes && bytes !== 0) return "—";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
};

const extOf = (name = "") => {
  const m = name.match(/\.([a-zA-Z0-9]+)$/);
  return m ? m[1].toUpperCase() : "3D";
};

const uid = () =>
  crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

// ---------- corner-bracket frame (signature element) ----------

function BracketFrame() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      {[
        "M2 14 L2 2 L14 2",
        "M86 2 L98 2 L98 14",
        "M98 86 L98 98 L86 98",
        "M14 98 L2 98 L2 86",
      ].map((d, i) => (
        <path key={i} d={d} fill="none" stroke="#3A4150" strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  );
}

// ---------- main app ----------

export default function App() {
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setError("");
    const { data, error } = await supabase
      .from(MODELS_TABLE)
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      setError("Impossible de charger la bibliothèque pour le moment.");
    } else {
      setCatalog(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const filtered = catalog.filter((it) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      it.title?.toLowerCase().includes(q) ||
      it.description?.toLowerCase().includes(q) ||
      it.format?.toLowerCase().includes(q)
    );
  });

  const handleDownload = async (item) => {
    try {
      const { data, error } = await supabase.storage.from(MODELS_BUCKET).download(item.file_path);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = item.file_name || `${item.title}.${(item.format || "stl").toLowerCase()}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setToast(`Téléchargement de « ${item.title} » lancé`);
    } catch (e) {
      setToast("Le fichier n'a pas pu être récupéré.");
    }
  };

  return (
    <div className="min-h-screen bg-[#12151B] text-[#EDEFF3] font-sans">
      {/* header */}
      <header className="border-b border-[#232833] bp-grid">
        <div className="max-w-6xl mx-auto px-5 pt-10 pb-8">
          <div className="flex items-center gap-2 text-[#5B8DEF] font-mono text-xs tracking-widest uppercase mb-3">
            <Box size={14} strokeWidth={2} />
            <span>Bibliothèque de modèles 3D</span>
          </div>
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <h1 className="font-display text-3xl sm:text-4xl font-700 tracking-tight text-[#F4F6F9]">
              Dépôt<span className="text-[#FF7A33]">.</span>stl
            </h1>
            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-2 bg-[#FF7A33] hover:bg-[#FF8F52] text-[#14171C] font-semibold text-sm px-4 py-2.5 rounded-sm transition-colors"
            >
              <Plus size={16} strokeWidth={2.5} />
              Publier un fichier
            </button>
          </div>

          <div className="relative mt-7 max-w-2xl">
            <div className="absolute left-0 top-0 bottom-0 w-9 flex items-center justify-center text-[#5B8DEF]">
              <Search size={16} strokeWidth={2} />
            </div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un modèle, un format, un mot-clé…"
              className="w-full bg-[#1A1E26] border border-[#2A2F3A] focus:border-[#5B8DEF] outline-none rounded-sm pl-9 pr-4 py-3 text-sm placeholder:text-[#5C6472] transition-colors"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] text-[#4A5262] hidden sm:block">
              {filtered.length} résultat{filtered.length > 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </header>

      {/* content */}
      <main className="max-w-6xl mx-auto px-5 py-9">
        {error && (
          <div className="flex items-center gap-2 text-sm text-[#FF9B6B] bg-[#241812] border border-[#3A2A1E] rounded-sm px-4 py-3 mb-6">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-[#5C6472] gap-3">
            <Loader2 className="animate-spin" size={22} />
            <span className="font-mono text-xs tracking-wide">Chargement de la bibliothèque…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-3 border border-dashed border-[#2A2F3A] rounded-sm">
            <FileBox size={28} className="text-[#3A4150]" />
            <p className="text-[#8B93A1] text-sm">
              {catalog.length === 0 ? "Aucun fichier publié pour l'instant." : "Aucun résultat pour cette recherche."}
            </p>
            {catalog.length === 0 && (
              <button onClick={() => setShowUpload(true)} className="text-[#5B8DEF] text-sm font-medium hover:underline mt-1">
                Publier le premier fichier
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelected(item)}
                className="group relative text-left bg-[#171A21] border border-[#232833] rounded-sm overflow-hidden hover:-translate-y-0.5 transition-transform duration-200 fade-up"
              >
                <div className="relative aspect-square bg-[#1D2129] overflow-hidden">
                  {item.images?.[0] ? (
                    <img
                      src={item.images[0]}
                      alt={item.title}
                      className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#3A4150]">
                      <Box size={36} strokeWidth={1.2} />
                    </div>
                  )}
                  <div className="absolute inset-2">
                    <BracketFrame />
                  </div>
                  <span className="absolute top-3 right-3 font-mono text-[10px] bg-[#12151B]/80 backdrop-blur px-2 py-1 rounded-sm text-[#8B93A1] border border-[#2A2F3A]">
                    {item.format}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-display font-600 text-[#F4F6F9] text-sm truncate">{item.title}</h3>
                  <p className="font-mono text-[10px] text-[#5C6472] mt-1.5 tracking-wide">
                    {formatBytes(item.size_bytes)} · {item.images?.length || 0} img
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>

      {selected && (
        <DetailModal item={selected} onClose={() => setSelected(null)} onDownload={() => handleDownload(selected)} />
      )}

      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onDone={(msg) => {
            setShowUpload(false);
            setToast(msg);
            loadCatalog();
          }}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#1D2129] border border-[#2A2F3A] text-sm text-[#EDEFF3] px-4 py-2.5 rounded-sm shadow-xl fade-up z-50">
          {toast}
        </div>
      )}
    </div>
  );
}

// ---------- detail modal ----------

function DetailModal({ item, onClose, onDownload }) {
  const [imgIdx, setImgIdx] = useState(0);
  const images = item.images?.length ? item.images : [null];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-[#171A21] border border-[#2A2F3A] rounded-sm max-w-3xl w-full max-h-[88vh] overflow-y-auto fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative aspect-[16/10] bg-[#1D2129]">
          {images[imgIdx] ? (
            <img src={images[imgIdx]} alt={item.title} className="w-full h-full object-contain" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#3A4150]">
              <Box size={48} strokeWidth={1.2} />
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 bg-[#12151B]/80 hover:bg-[#12151B] text-[#EDEFF3] p-1.5 rounded-sm border border-[#2A2F3A]"
          >
            <X size={16} />
          </button>
          {images.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setImgIdx(i)}
                  className={`w-1.5 h-1.5 rounded-full ${i === imgIdx ? "bg-[#FF7A33]" : "bg-[#3A4150]"}`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <h2 className="font-display text-xl font-700 text-[#F4F6F9]">{item.title}</h2>
            <span className="font-mono text-[11px] shrink-0 bg-[#1D2129] border border-[#2A2F3A] text-[#8B93A1] px-2 py-1 rounded-sm">
              {item.format}
            </span>
          </div>
          <p className="font-mono text-[11px] text-[#5C6472] mt-2 tracking-wide">{formatBytes(item.size_bytes)}</p>
          <p className="text-[#B3B9C4] text-sm leading-relaxed mt-4 whitespace-pre-wrap">
            {item.description || "Aucune description fournie."}
          </p>

          <button
            onClick={onDownload}
            className="mt-6 w-full flex items-center justify-center gap-2 bg-[#FF7A33] hover:bg-[#FF8F52] text-[#14171C] font-semibold text-sm py-3 rounded-sm transition-colors"
          >
            <Download size={16} strokeWidth={2.5} />
            Télécharger le fichier
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- upload modal ----------

function UploadModal({ onClose, onDone }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageFiles, setImageFiles] = useState([]); // File objects
  const [imagePreviews, setImagePreviews] = useState([]); // object URLs for preview
  const [modelFile, setModelFile] = useState(null); // File object
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const imgInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleImages = (fileList) => {
    const files = Array.from(fileList).slice(0, 5 - imageFiles.length);
    setImageFiles((prev) => [...prev, ...files].slice(0, 5));
    setImagePreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))].slice(0, 5));
  };

  const removeImage = (i) => {
    setImageFiles((prev) => prev.filter((_, j) => j !== i));
    setImagePreviews((prev) => prev.filter((_, j) => j !== i));
  };

  const handleModelFile = (file) => {
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      setErr("Le fichier 3D dépasse 50 Mo, la limite par défaut de Supabase (modifiable dans les réglages du bucket).");
      return;
    }
    setErr("");
    setModelFile(file);
  };

  const submit = async () => {
    if (!title.trim()) return setErr("Donne un titre au modèle.");
    if (!modelFile) return setErr("Ajoute le fichier 3D à publier.");
    setSaving(true);
    setErr("");
    try {
      const id = uid();

      // 1) upload the 3D file
      const modelPath = `${id}/${modelFile.name}`;
      const { error: modelErr } = await supabase.storage.from(MODELS_BUCKET).upload(modelPath, modelFile);
      if (modelErr) throw modelErr;

      // 2) upload images and collect their public URLs
      const imageUrls = [];
      for (let i = 0; i < imageFiles.length; i++) {
        const f = imageFiles[i];
        const ext = f.name.split(".").pop();
        const path = `${id}/${i}.${ext}`;
        const { error: imgErr } = await supabase.storage.from(IMAGES_BUCKET).upload(path, f);
        if (imgErr) throw imgErr;
        const { data } = supabase.storage.from(IMAGES_BUCKET).getPublicUrl(path);
        imageUrls.push(data.publicUrl);
      }

      // 3) insert the catalog row
      const { error: insertErr } = await supabase.from(MODELS_TABLE).insert({
        id,
        title: title.trim(),
        description: description.trim(),
        format: extOf(modelFile.name),
        file_path: modelPath,
        file_name: modelFile.name,
        size_bytes: modelFile.size,
        images: imageUrls,
      });
      if (insertErr) throw insertErr;

      onDone(`« ${title.trim()} » a été publié`);
    } catch (e) {
      setErr(e.message || "La publication a échoué, réessaie dans un instant.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 flex items-center justify-center p-4">
      <div className="bg-[#171A21] border border-[#2A2F3A] rounded-sm max-w-lg w-full max-h-[88vh] overflow-y-auto fade-up">
        <div className="flex items-center justify-between px-6 pt-6">
          <h2 className="font-display text-lg font-700 text-[#F4F6F9]">Publier un fichier 3D</h2>
          <button onClick={onClose} className="text-[#5C6472] hover:text-[#EDEFF
