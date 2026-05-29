export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
  };
};

export type EventDto = {
  id: string;
  title: string;
  description?: string | null;
  startsAt: string;
  endsAt: string;
  createdAt: string;
  updatedAt: string;
};

export type ListEventsResponse = {
  items: EventDto[];
};

export type CreateEventRequest = {
  title: string;
  description?: string | null;
  startsAt: string;
  endsAt: string;
};

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

export async function listEvents(): Promise<ListEventsResponse> {
  const params = new URLSearchParams({ limit: '100', offset: '0' });
  return request<ListEventsResponse>(`/events?${params.toString()}`);
}

export async function createEvent(payload: CreateEventRequest): Promise<EventDto> {
  return request<EventDto>('/events', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = await readError(response);
    throw new ApiError(response.status, body.error.code, body.error.message);
  }

  return response.json() as Promise<T>;
}

async function readError(response: Response): Promise<ApiErrorBody> {
  try {
    return (await response.json()) as ApiErrorBody;
  } catch {
    return {
      error: {
        code: 'request_failed',
        message: `Request failed with status ${response.status}`,
      },
    };
  }
}

