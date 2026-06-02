export interface APIErrorDetail {
  error_code: string;
  message: string;
}

export interface APIError extends Error {
  detail: APIErrorDetail;
}
