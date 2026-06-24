// Paleta de cores dos projetos — tons limpos/modernos (estilo agenda),
// usados como tags de projeto e indicadores de progresso. A usuária pode
// criar quantos projetos quiser e escolher a cor.

export type ProjectColor = {
  key: string;
  label: string;
  hex: string;
  soft: string; // fundo claro da tag
};

export const PROJECT_COLORS: ProjectColor[] = [
  { key: "blue", label: "Azul", hex: "#2F6FE0", soft: "#E8F0FD" },
  { key: "green", label: "Verde", hex: "#1F9D6B", soft: "#E4F6EE" },
  { key: "teal", label: "Turquesa", hex: "#0E9BAA", soft: "#E1F4F6" },
  { key: "purple", label: "Roxo", hex: "#7C5CE0", soft: "#EEEAFB" },
  { key: "pink", label: "Rosa", hex: "#D5468B", soft: "#FBE7F1" },
  { key: "red", label: "Vermelho", hex: "#E0533D", soft: "#FBE8E4" },
  { key: "amber", label: "Âmbar", hex: "#D69011", soft: "#FBF0DA" },
  { key: "lime", label: "Limão", hex: "#6F9E1A", soft: "#EFF5DD" },
  { key: "indigo", label: "Índigo", hex: "#4257C9", soft: "#E7EAFA" },
  { key: "graphite", label: "Grafite", hex: "#5B6470", soft: "#EBEDF0" },
  { key: "brown", label: "Marrom", hex: "#9A6B4F", soft: "#F2E9E3" },
  { key: "cyan", label: "Ciano", hex: "#1184C7", soft: "#E1EFF9" },
];

const COLOR_MAP = Object.fromEntries(PROJECT_COLORS.map((c) => [c.key, c]));

export function colorFor(key: string | null | undefined): ProjectColor {
  if (key && COLOR_MAP[key]) return COLOR_MAP[key];
  return COLOR_MAP["graphite"];
}
