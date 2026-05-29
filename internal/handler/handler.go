package handler

import "github.com/nikitanaumenko/calendar/internal/db"

type Handler struct {
	queries *db.Queries
}

func New(queries *db.Queries) *Handler {
	return &Handler{queries: queries}
}
