import {
  ActionIcon,
  Alert,
  AppShell,
  Badge,
  Button,
  Container,
  Divider,
  Group,
  Loader,
  Paper,
  ScrollArea,
  Stack,
  Table,
  Text,
  TextInput,
  Textarea,
  Title,
  Tooltip,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  IconCalendarEvent,
  IconCircleCheck,
  IconDatabaseOff,
  IconPlus,
  IconRefresh,
} from '@tabler/icons-react';
import { FormEvent, useMemo, useState } from 'react';
import { ApiError, CreateEventRequest, EventDto } from './api/client';
import { eventsApi } from './api/events';

type EventForm = {
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
};

const initialForm: EventForm = {
  title: '',
  description: '',
  startsAt: toDatetimeLocal(new Date()),
  endsAt: toDatetimeLocal(new Date(Date.now() + 60 * 60 * 1000)),
};

export function App() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<EventForm>(initialForm);

  const eventsQuery = useQuery({
    queryKey: ['events'],
    queryFn: eventsApi.list,
  });

  const createMutation = useMutation({
    mutationFn: eventsApi.create,
    onSuccess: async () => {
      setForm(initialForm);
      await queryClient.invalidateQueries({ queryKey: ['events'] });
      notifications.show({
        color: 'teal',
        icon: <IconCircleCheck size={18} />,
        title: 'Event created',
        message: 'The calendar entry is now available in the list.',
      });
    },
    onError: (error: Error) => {
      notifications.show({
        color: 'red',
        title: 'Could not create event',
        message: error.message,
      });
    },
  });

  const sortedEvents = useMemo(() => {
    return [...(eventsQuery.data?.items ?? [])].sort(
      (left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime(),
    );
  }, [eventsQuery.data?.items]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload: CreateEventRequest = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      startsAt: new Date(form.startsAt).toISOString(),
      endsAt: new Date(form.endsAt).toISOString(),
    };

    createMutation.mutate(payload);
  }

  return (
    <AppShell header={{ height: 64 }} padding="md">
      <AppShell.Header>
        <Container size="xl" className="shell-header">
          <Group gap="sm" wrap="nowrap">
            <IconCalendarEvent size={28} stroke={1.8} />
            <div>
              <Title order={1} className="app-title">
                Calendar
              </Title>
              <Text size="xs" c="dimmed">
                Events workspace
              </Text>
            </div>
          </Group>

          <Group gap="xs" wrap="nowrap">
            <StatusBadge isLoading={eventsQuery.isLoading} error={eventsQuery.error} />
            <Tooltip label="Refresh events">
              <ActionIcon
                aria-label="Refresh events"
                variant="light"
                color="gray"
                onClick={() => void eventsQuery.refetch()}
                loading={eventsQuery.isFetching}
              >
                <IconRefresh size={18} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Container>
      </AppShell.Header>

      <AppShell.Main>
        <Container size="xl" className="workspace">
          <section className="form-panel" aria-label="Create event">
            <Paper withBorder p="md" radius="sm">
              <form onSubmit={submit}>
                <Stack gap="md">
                  <Group justify="space-between" align="center">
                    <div>
                      <Title order={2} className="panel-title">
                        New event
                      </Title>
                      <Text size="sm" c="dimmed">
                        Create entries in the backend calendar.
                      </Text>
                    </div>
                    <Badge variant="light" color="teal">
                      POST /events
                    </Badge>
                  </Group>

                  <TextInput
                    label="Title"
                    placeholder="Planning meeting"
                    value={form.title}
                    maxLength={200}
                    required
                    onChange={(event) =>
                      setForm((current) => ({ ...current, title: event.currentTarget.value }))
                    }
                  />

                  <Textarea
                    label="Description"
                    placeholder="Optional notes"
                    minRows={4}
                    value={form.description}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        description: event.currentTarget.value,
                      }))
                    }
                  />

                  <div className="date-grid">
                    <TextInput
                      label="Starts"
                      type="datetime-local"
                      value={form.startsAt}
                      required
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          startsAt: event.currentTarget.value,
                        }))
                      }
                    />
                    <TextInput
                      label="Ends"
                      type="datetime-local"
                      value={form.endsAt}
                      required
                      onChange={(event) =>
                        setForm((current) => ({ ...current, endsAt: event.currentTarget.value }))
                      }
                    />
                  </div>

                  <Button
                    type="submit"
                    leftSection={<IconPlus size={18} />}
                    loading={createMutation.isPending}
                    disabled={!form.title.trim()}
                  >
                    Create event
                  </Button>
                </Stack>
              </form>
            </Paper>
          </section>

          <section className="events-panel" aria-label="Events">
            <Paper withBorder radius="sm" className="events-surface">
              <Group justify="space-between" p="md" align="center">
                <div>
                  <Title order={2} className="panel-title">
                    Events
                  </Title>
                  <Text size="sm" c="dimmed">
                    {sortedEvents.length} scheduled entries
                  </Text>
                </div>
                <Badge color="gray" variant="outline">
                  GET /events
                </Badge>
              </Group>

              <Divider />

              <EventsTable
                events={sortedEvents}
                isLoading={eventsQuery.isLoading}
                error={eventsQuery.error}
              />
            </Paper>
          </section>
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}

function StatusBadge({ isLoading, error }: { isLoading: boolean; error: Error | null }) {
  if (isLoading) {
    return (
      <Badge variant="light" color="gray">
        Connecting
      </Badge>
    );
  }

  if (error) {
    return (
      <Badge variant="light" color="red" leftSection={<IconDatabaseOff size={12} />}>
        Offline
      </Badge>
    );
  }

  return (
    <Badge variant="light" color="teal" leftSection={<IconCircleCheck size={12} />}>
      Online
    </Badge>
  );
}

function EventsTable({
  events,
  isLoading,
  error,
}: {
  events: EventDto[];
  isLoading: boolean;
  error: Error | null;
}) {
  if (isLoading) {
    return (
      <div className="empty-state">
        <Loader size="sm" />
      </div>
    );
  }

  if (error) {
    const message =
      error instanceof ApiError
        ? `${error.code}: ${error.message}`
        : 'The backend is not reachable.';

    return (
      <div className="empty-state">
        <Alert color="red" variant="light" icon={<IconDatabaseOff size={18} />}>
          {message}
        </Alert>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="empty-state">
        <Text c="dimmed" size="sm">
          No events yet.
        </Text>
      </div>
    );
  }

  return (
    <ScrollArea h="calc(100vh - 190px)" type="auto">
      <Table stickyHeader highlightOnHover verticalSpacing="sm" horizontalSpacing="md">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Title</Table.Th>
            <Table.Th>Starts</Table.Th>
            <Table.Th>Ends</Table.Th>
            <Table.Th>Description</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {events.map((event) => (
            <Table.Tr key={event.id}>
              <Table.Td>
                <Text fw={600} size="sm">
                  {event.title}
                </Text>
              </Table.Td>
              <Table.Td>
                <Text size="sm">{formatDateTime(event.startsAt)}</Text>
              </Table.Td>
              <Table.Td>
                <Text size="sm">{formatDateTime(event.endsAt)}</Text>
              </Table.Td>
              <Table.Td className="description-cell">
                <Text size="sm" c={event.description ? undefined : 'dimmed'} lineClamp={2}>
                  {event.description || 'No description'}
                </Text>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </ScrollArea>
  );
}

function toDatetimeLocal(date: Date): string {
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

