package httpserver

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/nikitanaumenko/calendar/internal/api/gen"
	"go.uber.org/zap"
)

func NewRouter(log *zap.Logger, api gen.StrictServerInterface) http.Handler {
	router := chi.NewRouter()
	router.Use(middleware.RequestID)
	router.Use(middleware.RealIP)
	router.Use(Logger(log))
	router.Use(Recoverer(log))
	router.Use(middleware.NoCache)

	router.NotFound(func(w http.ResponseWriter, r *http.Request) {
		WriteError(w, http.StatusNotFound, "not_found", "resource not found")
	})
	router.MethodNotAllowed(func(w http.ResponseWriter, r *http.Request) {
		WriteError(w, http.StatusMethodNotAllowed, "method_not_allowed", "method not allowed")
	})

	strict := gen.NewStrictHandlerWithOptions(api, nil, gen.StrictHTTPServerOptions{
		RequestErrorHandlerFunc: func(w http.ResponseWriter, r *http.Request, err error) {
			WriteError(w, http.StatusBadRequest, "bad_request", err.Error())
		},
		ResponseErrorHandlerFunc: func(w http.ResponseWriter, r *http.Request, err error) {
			WriteError(w, http.StatusInternalServerError, "internal_error", "internal server error")
		},
	})
	return gen.HandlerFromMux(strict, router)
}
