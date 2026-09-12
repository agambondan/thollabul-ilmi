import { OG_IMAGE, serializeJsonLd, SITE_NAME, SITE_URL } from "@/lib/site";

const API_URL =
    process.env.API_INTERNAL_URL ||
    process.env.API_PROXY_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "https://api.thollabulilmi.site";

const getQuestion = async (slug) => {
    try {
        const response = await fetch(
            `${API_URL}/api/v1/forum/questions/${encodeURIComponent(slug)}`,
            { next: { revalidate: 300 } },
        );
        return response.ok ? response.json() : null;
    } catch {
        return null;
    }
};

export async function generateMetadata(props) {
    const { slug } = await props.params;
    const question = await getQuestion(slug);
    const title = question?.title ?? "Islamic Forum & Q&A";
    const description = question?.body
        ? question.body.slice(0, 160)
        : "Tanya jawab dan diskusi Islam bersama komunitas Thullaabul 'Ilmi.";
    const canonicalUrl = `${SITE_URL}/forum/${slug}`;

    return {
        title,
        description,
        alternates: { canonical: canonicalUrl },
        openGraph: {
            type: "website",
            siteName: SITE_NAME,
            title,
            description,
            url: canonicalUrl,
            images: [OG_IMAGE],
        },
    };
}

const answerJsonLd = (answer, slug) => ({
    "@type": "Answer",
    text: answer.body,
    upvoteCount: answer.vote_count ?? 0,
    url: `${SITE_URL}/forum/${slug}#answer-${answer.id}`,
    datePublished: answer.created_at,
    author: {
        "@type": "Person",
        name: answer.user?.name || answer.user?.email || "Anonim",
    },
});

export default async function ForumQuestionLayout(props) {
    const { slug } = await props.params;
    const { children } = props;
    const question = await getQuestion(slug);
    const answers = question?.answers ?? [];
    const acceptedAnswer = answers.find((answer) => answer.is_accepted);
    const suggestedAnswers = answers.filter((answer) => !answer.is_accepted);

    const qAPageJsonLd = question
        ? {
              "@context": "https://schema.org",
              "@type": "QAPage",
              mainEntity: {
                  "@type": "Question",
                  name: question.title,
                  text: question.body,
                  answerCount: answers.length,
                  upvoteCount: question.vote_count ?? 0,
                  datePublished: question.created_at,
                  author: {
                      "@type": "Person",
                      name:
                          question.user?.name ||
                          question.user?.email ||
                          "Anonim",
                  },
                  ...(acceptedAnswer && {
                      acceptedAnswer: answerJsonLd(acceptedAnswer, slug),
                  }),
                  ...(suggestedAnswers.length > 0 && {
                      suggestedAnswer: suggestedAnswers.map((answer) =>
                          answerJsonLd(answer, slug),
                      ),
                  }),
              },
          }
        : null;

    return (
        <>
            {qAPageJsonLd && (
                <script
                    type='application/ld+json'
                    dangerouslySetInnerHTML={{
                        __html: serializeJsonLd(qAPageJsonLd),
                    }}
                />
            )}
            {children}
        </>
    );
}
