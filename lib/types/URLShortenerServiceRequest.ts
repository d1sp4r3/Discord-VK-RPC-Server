export default interface URLShortenerServiceRequest {
  url: string;
  serviceUrl: string;
  headers: Record<string, string>;
  overrideBody: string | undefined;
}
