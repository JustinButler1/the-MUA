declare module 'expo-image-picker' {
  export const MediaTypeOptions: any;
  export function requestMediaLibraryPermissionsAsync(): Promise<{
    status: 'granted' | 'denied' | 'undetermined';
    granted?: boolean;
    canAskAgain?: boolean;
    expires?: string;
  }>;
  export function launchImageLibraryAsync(options?: any): Promise<{
    canceled: boolean;
    assets?: Array<{
      uri: string;
      width?: number;
      height?: number;
      fileName?: string;
      type?: string;
      mimeType?: string;
      fileSize?: number;
    }>;
  }>;
}


