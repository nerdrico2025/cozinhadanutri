declare module 'react-google-recaptcha' {
  import { Component, Ref } from 'react';

  interface ReCAPTCHAProps {
    sitekey: string;
    onChange?: (token: string | null) => void;
    onExpired?: () => void;
    onErrored?: () => void;
    ref?: Ref<ReCAPTCHAInstance>;
    key?: string | number;
    theme?: 'light' | 'dark';
    size?: 'compact' | 'normal' | 'invisible';
    tabindex?: number;
  }

  export interface ReCAPTCHAInstance {
    reset: () => void;
    execute: () => void;
    getValue: () => string | null;
  }

  export default class ReCAPTCHA extends Component<ReCAPTCHAProps> {
    reset(): void;
    execute(): void;
    getValue(): string | null;
  }
}

declare module 'virtual:pwa-register' {
  export function registerSW(options?: { immediate?: boolean; onNeedRefresh?: () => void; onOfflineReady?: () => void }): (reloadPage?: boolean) => void;
}
