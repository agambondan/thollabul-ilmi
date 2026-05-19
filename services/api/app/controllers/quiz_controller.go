package controllers

import (
	"encoding/json"
	"strconv"

	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/agambondan/islamic-explorer/app/model"
	service "github.com/agambondan/islamic-explorer/app/services"
	"github.com/gofiber/fiber/v2"
)

type QuizController interface {
	ListQuestions(ctx *fiber.Ctx) error
	GetSession(ctx *fiber.Ctx) error
	Submit(ctx *fiber.Ctx) error
	GetStats(ctx *fiber.Ctx) error
	Create(ctx *fiber.Ctx) error
	CreateQuestion(ctx *fiber.Ctx) error
	UpdateQuestion(ctx *fiber.Ctx) error
	Delete(ctx *fiber.Ctx) error
}

type quizController struct{ svc service.QuizService }

type quizQuestionRequest struct {
	Question      string   `json:"question" validate:"required"`
	Options       []string `json:"options" validate:"required,min=2"`
	Answer        int      `json:"answer" validate:"gte=0"`
	Explanation   string   `json:"explanation"`
	Category      string   `json:"category" validate:"required"`
	Difficulty    string   `json:"difficulty" validate:"required"`
	QuestionText  string   `json:"question_text"`
	CorrectAnswer string   `json:"correct_answer"`
	Type          string   `json:"type" validate:"required"`
}

type quizQuestionResponse struct {
	ID            *int     `json:"id,omitempty"`
	Question      string   `json:"question"`
	QuestionText  string   `json:"question_text"`
	Options       []string `json:"options"`
	Answer        int      `json:"answer"`
	CorrectAnswer string   `json:"correct_answer"`
	Explanation   string   `json:"explanation"`
	Category      string   `json:"category"`
	Type          string   `json:"type"`
	Difficulty    string   `json:"difficulty"`
}

func NewQuizController(services *service.Services) QuizController {
	return &quizController{services.Quiz}
}

func (c *quizController) ListQuestions(ctx *fiber.Ctx) error {
	page := ctx.QueryInt("page", 0)
	size := ctx.QueryInt("size", 100)
	if size > 500 {
		size = 500
	}
	items, err := c.svc.ListQuizzes(page, size)
	if err != nil {
		return lib.ErrorInternal(ctx)
	}

	result := make([]quizQuestionResponse, 0, len(items))
	for i := range items {
		result = append(result, quizToQuestionResponse(&items[i]))
	}
	return lib.OK(ctx, fiber.Map{"items": result, "page": page, "size": size})
}

// @Summary Get quiz session
// @Tags Belajar
// @Accept json
// @Produce json
// @Param type query string false "Quiz type"
// @Param count query int false "Number of questions (default 10)"
// @Success 200 {object} lib.Response
// @Failure 500 {object} lib.Response
// @Router /quiz/session [get]
func (c *quizController) GetSession(ctx *fiber.Ctx) error {
	quizType := model.QuizType(ctx.Query("type"))
	count, _ := strconv.Atoi(ctx.Query("count", "10"))
	items, err := c.svc.GetSession(quizType, count)
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	lang := lib.GetPreferredLang(ctx)
	for i := range items {
		if items[i].Translation != nil {
			items[i].Translation.FilterByLang(lang)
		}
	}
	return lib.OK(ctx, items)
}

func (c *quizController) Submit(ctx *fiber.Ctx) error {
	userID, err := extractUserID(ctx)
	if err != nil {
		return lib.ErrorUnauthorized(ctx)
	}
	req := new(model.SubmitQuizRequest)
	if err := lib.BodyParser(ctx, req); err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	if err := c.svc.SubmitAnswers(userID, req.Results); err != nil {
		return lib.ErrorInternal(ctx)
	}
	return lib.OK(ctx, fiber.Map{"message": "submitted"})
}

func (c *quizController) GetStats(ctx *fiber.Ctx) error {
	userID, err := extractUserID(ctx)
	if err != nil {
		return lib.ErrorUnauthorized(ctx)
	}
	stats, err := c.svc.GetStats(userID)
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	return lib.OK(ctx, stats)
}

func (c *quizController) Create(ctx *fiber.Ctx) error {
	req := new(model.Quiz)
	if err := lib.BodyParser(ctx, req); err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	item, err := c.svc.CreateQuiz(req)
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	return lib.OK(ctx, item)
}

func (c *quizController) CreateQuestion(ctx *fiber.Ctx) error {
	req := new(quizQuestionRequest)
	if err := lib.BodyParser(ctx, req); err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	quiz := quizFromQuestionRequest(req)
	item, err := c.svc.CreateQuiz(quiz)
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	return lib.OK(ctx, quizToQuestionResponse(item))
}

func (c *quizController) UpdateQuestion(ctx *fiber.Ctx) error {
	id, err := strconv.Atoi(ctx.Params("id"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, "id tidak valid")
	}
	req := new(quizQuestionRequest)
	if err := lib.BodyParser(ctx, req); err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	item, err := c.svc.UpdateQuiz(id, quizFromQuestionRequest(req))
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	return lib.OK(ctx, quizToQuestionResponse(item))
}

func (c *quizController) Delete(ctx *fiber.Ctx) error {
	id, err := strconv.Atoi(ctx.Params("id"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, "id tidak valid")
	}
	if err := c.svc.DeleteQuiz(id); err != nil {
		return lib.ErrorInternal(ctx)
	}
	return lib.OK(ctx, nil)
}

func quizFromQuestionRequest(req *quizQuestionRequest) *model.Quiz {
	options := req.Options
	optionsJSON, _ := json.Marshal(options)

	question := req.Question
	if question == "" {
		question = req.QuestionText
	}
	category := req.Category
	if category == "" {
		category = req.Type
	}
	if category == "" {
		category = "umum"
	}
	difficulty := req.Difficulty
	if difficulty == "" {
		difficulty = "medium"
	}

	correctAnswer := req.CorrectAnswer
	if correctAnswer == "" && req.Answer >= 0 && req.Answer < len(options) {
		correctAnswer = options[req.Answer]
	}

	return &model.Quiz{
		Type:          model.QuizType(category),
		QuestionText:  question,
		CorrectAnswer: correctAnswer,
		Options:       string(optionsJSON),
		Explanation:   req.Explanation,
		Difficulty:    difficulty,
	}
}

func quizToQuestionResponse(item *model.Quiz) quizQuestionResponse {
	options := parseQuizOptions(item.Options)
	answer := 0
	for i, option := range options {
		if option == item.CorrectAnswer {
			answer = i
			break
		}
	}

	return quizQuestionResponse{
		ID:            item.ID,
		Question:      item.QuestionText,
		QuestionText:  item.QuestionText,
		Options:       options,
		Answer:        answer,
		CorrectAnswer: item.CorrectAnswer,
		Explanation:   item.Explanation,
		Category:      string(item.Type),
		Type:          string(item.Type),
		Difficulty:    item.Difficulty,
	}
}

func parseQuizOptions(raw string) []string {
	if raw == "" {
		return []string{}
	}
	var options []string
	if err := json.Unmarshal([]byte(raw), &options); err == nil {
		return options
	}
	return []string{}
}
