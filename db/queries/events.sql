-- name: CreateEvent :one
INSERT INTO events (
    title,
    description,
    starts_at,
    ends_at
) VALUES (
    $1,
    $2,
    $3,
    $4
)
RETURNING id, title, description, starts_at, ends_at, created_at, updated_at;

-- name: ListEvents :many
SELECT id, title, description, starts_at, ends_at, created_at, updated_at
FROM events
ORDER BY starts_at ASC, id ASC
LIMIT $1 OFFSET $2;

