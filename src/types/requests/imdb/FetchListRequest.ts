export interface FetchListRequest {
  url: string;
}

export interface FetchListRequestQuery extends Record<string, string> {
  force?: string;
  max?: string;
}
