import { useEffect } from 'react';
import { Linking } from 'react-native';
import { openOsUrl } from '../utils/osDeepLinks';

export function useOsDeepLinks() {
  useEffect(() => {
    void Linking.getInitialURL().then(openOsUrl);
    const sub = Linking.addEventListener('url', ({ url }) => openOsUrl(url));
    return () => sub.remove();
  }, []);
}
