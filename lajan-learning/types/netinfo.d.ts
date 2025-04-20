declare module '@react-native-community/netinfo' {
    // minimal hook declaration
    export function useNetInfo(): {
      isConnected: boolean | null;
      type: 'wifi' | 'cellular' | 'none' | 'unknown';
      // …add whatever props you actually use…
    };
  
    // default-exported NetInfo as well, if you ever need it
    const NetInfo: {
      fetch: () => Promise<any>;
      addEventListener: (cb: (state: any) => void) => () => void;
    };
    export default NetInfo;
  }
  