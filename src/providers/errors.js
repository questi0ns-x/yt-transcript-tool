export class ProviderError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "ProviderError";
    this.code = code;
  }
}

export const ProviderErrorCodes = {
  INVALID_URL: "INVALID_URL",
  PLATFORM_NOT_SUPPORTED: "PLATFORM_NOT_SUPPORTED",
};
