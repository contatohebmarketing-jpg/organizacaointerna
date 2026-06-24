// Paleta de cores dos projetos. A usuária classifica cada projeto por cor
// e pode criar quantos quiser. Renderizamos via style inline (hex), porque
// as cores são dinâmicas (escolhidas em runtime).

export type ProjectColor = {
  key: string;
  label: string;
  hex: string;
  soft: string; // versão clara para fundos
};

export const PROJECT_COLORS: ProjectColor[] = [
  { key: "teal", label: "Verde", hex: "#1F6E5B", soft: "#E2EFEA" },
  { key: "sage", label: "Sálvia", hex: "#7C9A82", soft: "#EAF0EB" },
  { key: "forest", label: "Floresta", hex: "#2F5233", soft: "#E6ECE6" },
  { key: "mustard", label: "Mostarda", hex: "#C79A3B", soft: "#F6EED9" },
  { key: "terracotta", label: "Terracota", hex: "#C26B4E", soft: "#F6E5DD" },
  { key: "clay", label: "Argila", hex: "#A6603C", soft: "#F1E4DA" },
  { key: "rose", label: "Rosa", hex: "#C2748A", soft: "#F6E6EB" },
  { key: "plum", label: "Ameixa", hex: "#7A5478", soft: "#EEE6ED" },
  { key: "ocean", label: "Oceano", hex: "#3A6E8F", soft: "#E2EBF1" },
  { key: "slate", label: "Ardósia", hex: "#5C6B73", soft: "#E8EBEC" },
  { key: "sand", label: "Areia", hex: "#B49B72", soft: "#F2ECE1" },
  { key: "coral", label: "Coral", hex: "#D98C7A", soft: "#F8E8E3" },
];

const COLOR_MAP = Object.fromEntries(PROJECT_COLORS.map((c) => [c.key, c]));

export function colorFor(key: string | null | undefined): ProjectColor {
  if (key && COLOR_MAP[key]) return COLOR_MAP[key];
  return COLOR_MAP["slate"];
}
