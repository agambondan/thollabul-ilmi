# Quiz Islami Interaktif

Status: `DONE`
Priority: `P1`
Tanggal: `2026-05-13`

## Objective

Quiz interaktif 10 soal MCQ random dari berbagai topik keislaman dengan score tracking untuk menguji dan memperkuat pemahaman pengguna.

## Scope

- API: `/quiz`
- Web: `/quiz`, `/dashboard/quiz`
- Mobile: `ExploreScreen`

## Evidence

- Web: `apps/web/src/app/quiz/page.js`, `apps/web/src/app/dashboard/quiz/page.js`
- Mobile: `apps/mobile/src/screens/ExploreScreen.js`

- API: services/api/app/controllers/quiz_controller.go

## Source of Truth

- services/api/app/controllers/quiz_controller.go
- services/api/app/model/quiz.go
- services/api/app/services/quiz_service.go

## Details

### API Response Shape

**`GET /quiz/session?type=hafalan&count=10`**

```json
[
    {
        "id": 1,
        "type": "hafalan",
        "question_text": "Berapakah jumlah surah dalam Al-Quran?",
        "options": "[\"110\", \"114\", \"120\", \"100\"]",
        "difficulty": "medium",
        "ref_id": 1
    }
]
```

Note: `correct_answer` is excluded from session endpoint (revealed at submit time).

**`POST /quiz/submit`**

```json
{
    "results": [{ "quiz_id": 1, "answer": "114" }]
}
```

**`GET /quiz/stats`**

```json
{
    "total_answered": 50,
    "total_correct": 40,
    "accuracy_percent": 80.0
}
```

### Database Model

**`Quiz`** (`model/quiz.go`)
| Field | Type | Notes |
|-------|------|-------|
| `id` | int64 (BaseID) | Primary key |
| `type` | QuizType | hafalan, fiqh, sirah, hadith, asmaul_husna |
| `question_text` | string | Question content |
| `correct_answer` | string | Correct answer (hidden from session) |
| `options` | string | JSONB array of MCQ options |
| `explanation` | string | Answer explanation |
| `difficulty` | string | easy, medium, hard |
| `ref_id` | *int | Reference content ID |
| `translation_id` | *int | FK to Translation |

**`UserQuizResult`** (`model/quiz.go`)
| Field | Type | Notes |
|-------|------|-------|
| `id` | int64 (BaseID) | Primary key |
| `user_id` | uuid | FK to user |
| `quiz_id` | int | FK to Quiz |
| `is_correct` | bool | Result |
| `answered_at` | time.Time | Timestamp |

**`QuizStats`** is computed: `total_answered`, `total_correct`, `accuracy_percent`.

### Key Frontend Components

- **Web** (`/quiz`, `/dashboard/quiz`): Topic selector → MCQ screen with timer; instant feedback on answer; results summary with accuracy chart; history of past sessions
- **Mobile** (`ExploreScreen`): Quiz type picker → swipeable question cards with option buttons; progress bar; end-of-quiz score card with share option
