import { useLocalSearchParams } from 'expo-router';
import { WorkBlockScreen } from '../../components/work/WorkBlockScreen';

export default function WorkBlockRoute() {
  const params = useLocalSearchParams<{ blockId?: string }>();
  const blockId = Array.isArray(params.blockId) ? params.blockId[0] : params.blockId;
  return <WorkBlockScreen blockId={blockId} />;
}
