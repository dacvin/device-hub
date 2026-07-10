// Curated device-related Lucide icon names (kebab-case, as used by
// `lucide-react/dynamic`'s `DynamicIcon`). Keep this list small and
// meaningful — it powers the group icon `Selector`, not a full icon browser.
export const GROUP_ICONS = [
  'laptop',
  'monitor',
  'smartphone',
  'tablet',
  'server',
  'hard-drive',
  'cpu',
  'keyboard',
  'mouse',
  'printer',
  'projector',
  'router',
  'wifi',
  'headphones',
  'camera',
  'webcam',
  'speaker',
  'battery',
  'plug',
  'memory-stick',
] as const;

export type GroupIconName = (typeof GROUP_ICONS)[number];
