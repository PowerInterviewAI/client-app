interface BetaTesterNoticeProps {
  expiresAt: number;
}

export default function BetaTesterNotice({ expiresAt }: BetaTesterNoticeProps) {
  return <div>Your betatester plan will expire on {new Date(expiresAt).toLocaleString()}.</div>;
}
