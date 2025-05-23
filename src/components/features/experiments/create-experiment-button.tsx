import { ListDatasourcesResponse } from '@/api/methods.schemas';
import Link from 'next/link';
import { Button, DropdownMenu } from '@radix-ui/themes';
import { PlusIcon } from '@radix-ui/react-icons';
import { useRouter } from 'next/navigation';

export function CreateExperimentButton({
  loading,
  datasources,
}: {
  loading: boolean;
  datasources: ListDatasourcesResponse | undefined;
}) {
  const router = useRouter();
  if (!loading && datasources?.items.length === 1) {
    return (
      <Link href={`/datasources/${datasources.items[0].id}/experiments/create`}>
        <Button>
          <PlusIcon /> Create Experiment
        </Button>
      </Link>
    );
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <Button loading={loading}>
          <PlusIcon /> Create Experiment
          <DropdownMenu.TriggerIcon />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        {datasources?.items.map((ds) => (
          <DropdownMenu.Item
            key={ds.id}
            onSelect={() => {
              router.push(`/datasources/${ds.id}/experiments/create`);
            }}
          >
            {ds.name}
          </DropdownMenu.Item>
        ))}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}
