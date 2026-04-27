export type DiseaseClass =
  | "cordana"
  | "pestalotiopsis"
  | "sana"
  | "sigatoka";

export type AnalysisRecord = {
  id: string;
  user_id: string;
  clase_predicha: DiseaseClass;
  confianza: number;
  probabilidades: Record<DiseaseClass, number>;
  image_url: string;          // URL pública del Storage (NOT NULL en DB)
  gradcam_url: string;        // data-URI base64 o URL (NOT NULL en DB)
  rating: number | null;      // 1-5, nullable hasta que el usuario califique
  created_at: string;
};

// Lo que se envía en el INSERT (sin id ni created_at que genera Postgres)
export type AnalysisInsert = {
  user_id: string;
  clase_predicha: DiseaseClass;
  confianza: number;
  probabilidades: Record<DiseaseClass, number>;
  image_url: string;
  gradcam_url: string;
};

// Tipo extendido con la URL firmada para mostrar en la app
// (la image_url del Storage es privada, necesita signed URL para renderizar)
export type AnalysisWithSignedUrl = AnalysisRecord & {
  signed_image_url: string | null;
};

export type ProfileRecord = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
};

export type ProfileSummary = ProfileRecord & {
  email: string;
  analyses_count: number;
};