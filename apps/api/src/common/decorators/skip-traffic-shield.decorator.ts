import { SetMetadata } from '@nestjs/common';

export const SKIP_TRAFFIC_SHIELD_KEY = 'skip_traffic_shield';
export const SkipTrafficShield = () => SetMetadata(SKIP_TRAFFIC_SHIELD_KEY, true);

