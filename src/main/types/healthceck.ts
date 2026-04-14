export interface ClientPingRequest {
  is_assistant_running: boolean;
}

export interface ClientPingResponse {
  credits: number;
  provided_llm_model: string;
}
