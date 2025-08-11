'use client';

import { Badge } from '@radix-ui/themes';
import Link from 'next/link';
import { PersonIcon } from '@radix-ui/react-icons';

interface ParticipantTypeBadgeProps {
  datasourceId: string;
  participantType: string;
}

export const ParticipantTypeBadge = ({ datasourceId, participantType }: ParticipantTypeBadgeProps) => {
  return (
    <Badge variant="soft" color="blue" size="1" asChild>
      <Link href={`/datasources/${datasourceId}/participants/${participantType}`}>
        <PersonIcon width="12" height="12" />
        {participantType}
      </Link>
    </Badge>
  );
};
