declare module 'geoip-lite' {
  export type LookupResult = {
    range?: [number, number];
    country?: string;
    region?: string;
    eu?: string;
    timezone?: string;
    city?: string;
    ll?: [number, number];
    metro?: number;
    area?: number;
  };

  export function lookup(ip: string): LookupResult | null;
  export function reloadDataSync(): void;
}
