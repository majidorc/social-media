export interface GoogleCredentialResponse {
  credential?: string;
  select_by?: string;
  clientId?: string;
}

export interface GoogleIdConfiguration {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
  context?: "signin" | "signup" | "use";
  itp_support?: boolean;
}

export interface PromptMomentNotification {
  isDisplayMoment: () => boolean;
  isDisplayed: () => boolean;
  isNotDisplayed: () => boolean;
  getNotDisplayedReason: () => string;
  isSkippedMoment: () => boolean;
  getSkippedReason: () => string;
  isDismissedMoment: () => boolean;
  getDismissedReason: () => string;
}

export interface CodeClientConfig {
  client_id: string;
  scope: string;
  ux_mode?: "popup" | "redirect";
  callback: (response: CodeResponse) => void;
  error_callback?: (error: GoogleIdentityError) => void;
}

export interface CodeResponse {
  code?: string;
  scope?: string;
  error?: string;
}

export interface GoogleIdentityError {
  type: string;
  message?: string;
}

export interface CodeClient {
  requestCode: () => void;
}

export interface GoogleAccountsId {
  initialize: (config: GoogleIdConfiguration) => void;
  prompt: (momentListener?: (notification: PromptMomentNotification) => void) => void;
  cancel: () => void;
  disableAutoSelect: () => void;
}

export interface GoogleAccountsOauth2 {
  initCodeClient: (config: CodeClientConfig) => CodeClient;
}

export interface GoogleAccounts {
  id: GoogleAccountsId;
  oauth2: GoogleAccountsOauth2;
}

export interface GoogleIdentityServices {
  accounts: GoogleAccounts;
}

declare global {
  interface Window {
    google?: GoogleIdentityServices;
  }
}
