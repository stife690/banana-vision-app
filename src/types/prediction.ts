export type DiseaseClass =
  | "cordana"
  | "pestalotiopsis"
  | "sana"
  | "sigatoka";

export type PredictionResult = {
  prediction: DiseaseClass;
  confidence: number;
  probabilities: Record<DiseaseClass, number>;
  imageUri: string;       // URI local de la imagen seleccionada
  gradcamUrl?: string;    // data-URI base64 que devuelve la API
  gradcamBase64?: string; // alternativa legacy (no usada actualmente)
  modelName?: string;
  createdAt: string;
};