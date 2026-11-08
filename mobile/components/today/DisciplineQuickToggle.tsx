import { HomeRow } from './HomeRow';
import { useRouter } from 'expo-router';
import type { DisciplineEntry } from '../../types';

interface DisciplineQuickToggleProps {
  discipline: DisciplineEntry;
}

export function DisciplineQuickToggle({ discipline }: DisciplineQuickToggleProps) {
  const router = useRouter();

  let totalToggles = 0;
  let completedToggles = 0;

  discipline.blocks.forEach((block) => {
    block.items.forEach((item) => {
      if (item.type === 'toggle') {
        totalToggles++;
        if (item.toggleValue === true) {
          completedToggles++;
        }
      }
    });
  });

  const sortedBlocks = [...discipline.blocks].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const names = sortedBlocks
    .slice(0, 2)
    .map((block) => block.blockName)
    .filter(Boolean)
    .join(' · ');

  return (
    <HomeRow
      icon="habits"
      label="Discipline"
      title={totalToggles > 0 ? `${completedToggles}/${totalToggles} today` : 'Open checklist'}
      meta={names || undefined}
      onPress={() => router.push('/(tabs)/discipline')}
    />
  );
}
