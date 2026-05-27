import { MessageCircle, Plus, Search, ThumbsDown, ThumbsUp } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { acceptForumAnswer, createForumAnswer, createForumQuestion, getForumQuestion, getForumQuestions, voteForum } from '../../api/forum';
import { radius, spacing } from '../../theme';

const formatCount = (value) => Number(value ?? 0).toLocaleString('id-ID');

function ForumStat({ label, value }) {
  return (
    <View style={styles.statPill}>
      <Text style={styles.statValue}>{formatCount(value)}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function QuestionCard({ item, onOpen }) {
  return (
    <Pressable onPress={() => onOpen(item)} style={styles.questionCard} testID="web-app-forum-question-card">
      <View style={styles.questionTop}>
        <Text numberOfLines={2} style={styles.questionTitle}>
          {item.title || 'Pertanyaan forum'}
        </Text>
        {item.isAnswered ? <Text style={styles.answeredBadge}>Terjawab</Text> : null}
      </View>
      {item.body ? (
        <Text numberOfLines={2} style={styles.questionBody}>
          {item.body}
        </Text>
      ) : null}
      {item.tags?.length ? (
        <View style={styles.tagRow}>
          {item.tags.slice(0, 3).map((tag) => (
            <Text key={tag} style={styles.tag}>
              {tag}
            </Text>
          ))}
        </View>
      ) : null}
      <View style={styles.metaRow}>
        <Text numberOfLines={1} style={styles.metaText}>{item.user?.name || 'Pengguna'}</Text>
        <Text style={styles.metaText}>{formatCount(item.answerCount)} jawaban</Text>
        <Text style={styles.metaText}>{formatCount(item.voteCount)} suara</Text>
      </View>
    </Pressable>
  );
}

export function WebAppForumRoute({
  forumAnswerDraft,
  forumAnswers,
  forumAskBody,
  forumAskTags,
  forumAskTitle,
  forumDetail,
  forumError,
  forumHasMore,
  forumLoading,
  forumPage,
  forumQuestions,
  forumSearch,
  forumSaving,
  forumSlug,
  forumTotal,
  forumView,
  forumVotingId,
  session,
  setForumAnswerDraft,
  setForumAnswers,
  setForumAskBody,
  setForumAskTags,
  setForumAskTitle,
  setForumDetail,
  setForumError,
  setForumHasMore,
  setForumLoading,
  setForumPage,
  setForumQuestions,
  setForumSaving,
  setForumSearch,
  setForumSlug,
  setForumTotal,
  setForumView,
  setForumVotingId,
  showError,
  showInfo,
}) {
  const runSearch = async () => {
    setForumLoading(true);
    setForumError('');
    try {
      const result = await getForumQuestions({ page: 0, size: 10, q: forumSearch.trim() });
      setForumQuestions(result.items);
      setForumTotal(result.total);
      setForumPage(0);
      setForumHasMore(result.hasMore);
    } catch (err) {
      setForumError(err?.message ?? 'Pencarian forum gagal.');
    } finally {
      setForumLoading(false);
    }
  };

  const openQuestion = async (question) => {
    setForumLoading(true);
    setForumError('');
    try {
      const detail = await getForumQuestion(question.slug);
      setForumDetail(detail.question);
      setForumAnswers(detail.answers);
      setForumSlug(question.slug);
      setForumView('detail');
    } catch (err) {
      setForumError(err?.message ?? 'Detail forum belum bisa dimuat.');
    } finally {
      setForumLoading(false);
    }
  };

  const loadMore = async () => {
    const nextPage = forumPage + 1;
    setForumLoading(true);
    try {
      const result = await getForumQuestions({ page: nextPage, size: 10, q: forumSearch.trim() });
      setForumQuestions((prev) => [...prev, ...result.items]);
      setForumTotal(result.total);
      setForumPage(nextPage);
      setForumHasMore(result.hasMore);
    } catch {
      showError('Pertanyaan berikutnya belum bisa dimuat.');
    } finally {
      setForumLoading(false);
    }
  };

  const submitQuestion = async () => {
    if (!session?.token) {
      showInfo('Buka Profil untuk masuk dan bertanya.');
      return;
    }
    setForumSaving(true);
    setForumError('');
    try {
      const result = await createForumQuestion({
        title: forumAskTitle.trim(),
        body: forumAskBody.trim(),
        tags: forumAskTags.trim(),
      });
      const slug = result?.slug ?? '';
      setForumAskTitle('');
      setForumAskBody('');
      setForumAskTags('');
      if (!slug) {
        setForumView('list');
        return;
      }
      setForumLoading(true);
      const detail = await getForumQuestion(slug);
      setForumDetail(detail.question);
      setForumAnswers(detail.answers);
      setForumSlug(slug);
      setForumView('detail');
    } catch (err) {
      setForumError(err?.message ?? 'Gagal mengirim pertanyaan.');
    } finally {
      setForumSaving(false);
      setForumLoading(false);
    }
  };

  const voteQuestion = async (value) => {
    if (!session?.token) {
      showInfo('Buka Profil untuk memberi suara.');
      return;
    }
    setForumVotingId(`${forumDetail.id}-${value}`);
    try {
      await voteForum({ targetType: 'question', targetId: forumDetail.id, value });
      setForumDetail((current) => current ? { ...current, voteCount: current.voteCount + value } : current);
    } catch {
      showError('Gagal memberi suara.');
    } finally {
      setForumVotingId('');
    }
  };

  const voteAnswer = async (answer, value) => {
    if (!session?.token) {
      showInfo('Buka Profil untuk memberi suara.');
      return;
    }
    setForumVotingId(`${answer.id}-${value}`);
    try {
      await voteForum({ targetType: 'answer', targetId: answer.id, value });
      setForumAnswers((prev) => prev.map((item) => (
        item.id === answer.id ? { ...item, voteCount: item.voteCount + value } : item
      )));
    } catch {
      showError('Gagal memberi suara.');
    } finally {
      setForumVotingId('');
    }
  };

  const acceptAnswer = async (answer) => {
    setForumVotingId(`accept-${answer.id}`);
    try {
      await acceptForumAnswer(forumDetail.id, answer.id);
      const updated = await getForumQuestion(forumSlug);
      setForumDetail(updated.question);
      setForumAnswers(updated.answers);
    } catch {
      showError('Jawaban belum bisa diterima.');
    } finally {
      setForumVotingId('');
    }
  };

  const submitAnswer = async () => {
    setForumSaving(true);
    try {
      await createForumAnswer(forumDetail.id, { body: forumAnswerDraft.trim() });
      setForumAnswerDraft('');
      const updated = await getForumQuestion(forumSlug);
      setForumDetail(updated.question);
      setForumAnswers(updated.answers);
    } catch {
      showError('Gagal mengirim jawaban.');
    } finally {
      setForumSaving(false);
    }
  };

  const renderList = () => (
    <>
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Search color="#94a3b8" size={16} strokeWidth={2} />
          <TextInput
            onChangeText={setForumSearch}
            onSubmitEditing={runSearch}
            placeholder="Cari pertanyaan..."
            placeholderTextColor="#94a3b8"
            returnKeyType="search"
            style={styles.input}
            testID="web-app-forum-search"
            value={forumSearch}
          />
        </View>
        <Pressable
          onPress={() => {
            setForumView('ask');
            setForumAskTitle('');
            setForumAskBody('');
            setForumAskTags('');
            setForumError('');
          }}
          style={styles.askButton}
          testID="web-app-forum-ask"
        >
          <Plus color="#ffffff" size={15} strokeWidth={2.4} />
          <Text style={styles.askButtonText}>Tanya</Text>
        </Pressable>
      </View>
      {forumQuestions.length ? (
        <View style={styles.list}>
          {forumQuestions.map((item) => (
            <QuestionCard item={item} key={item.id || item.slug} onOpen={openQuestion} />
          ))}
        </View>
      ) : null}
      {!forumLoading && !forumQuestions.length ? (
        <View style={styles.empty}>
          <MessageCircle color="#94a3b8" size={34} strokeWidth={1.8} />
          <Text style={styles.emptyTitle}>Belum ada pertanyaan.</Text>
          <Text style={styles.emptyText}>Ajukan pertanyaan pertama untuk memulai diskusi.</Text>
        </View>
      ) : null}
      {forumHasMore ? (
        <Pressable disabled={forumLoading} onPress={loadMore} style={styles.loadMore}>
          <Text style={styles.loadMoreText}>{forumLoading ? 'Memuat...' : 'Muat lebih banyak'}</Text>
        </Pressable>
      ) : null}
    </>
  );

  const renderAsk = () => (
    <View style={styles.panel}>
      <Pressable onPress={() => { setForumView('list'); setForumError(''); }} style={styles.routeLink}>
        <Text style={styles.routeLinkText}>Forum Tanya Jawab</Text>
      </Pressable>
      <Text style={styles.panelTitle}>Ajukan Pertanyaan</Text>
      <TextInput
        onChangeText={setForumAskTitle}
        placeholder="Judul pertanyaan (min 10 karakter)"
        placeholderTextColor="#94a3b8"
        style={styles.formInput}
        value={forumAskTitle}
      />
      <TextInput
        multiline
        onChangeText={setForumAskBody}
        placeholder="Isi pertanyaan (min 20 karakter)"
        placeholderTextColor="#94a3b8"
        style={[styles.formInput, styles.textArea]}
        textAlignVertical="top"
        value={forumAskBody}
      />
      <TextInput
        autoCapitalize="none"
        onChangeText={setForumAskTags}
        placeholder="Tag (pisahkan dengan koma, opsional)"
        placeholderTextColor="#94a3b8"
        style={styles.formInput}
        value={forumAskTags}
      />
      <Pressable
        disabled={forumSaving || forumAskTitle.length < 10 || forumAskBody.length < 20}
        onPress={submitQuestion}
        style={[
          styles.submitButton,
          (forumSaving || forumAskTitle.length < 10 || forumAskBody.length < 20) && styles.disabledButton,
        ]}
      >
        <Text style={styles.submitButtonText}>{forumSaving ? 'Mengirim...' : 'Kirim Pertanyaan'}</Text>
      </Pressable>
    </View>
  );

  const renderDetail = () => (
    <View style={styles.panel}>
      <Pressable onPress={() => { setForumView('list'); setForumDetail(null); setForumAnswers([]); }} style={styles.routeLink}>
        <Text style={styles.routeLinkText}>Forum Tanya Jawab</Text>
      </Pressable>
      {!forumDetail ? (
        <Text style={styles.emptyText}>Pertanyaan tidak ditemukan.</Text>
      ) : (
        <>
          <Text style={styles.panelTitle}>{forumDetail.title || 'Detail pertanyaan'}</Text>
          {forumDetail.body ? <Text style={styles.detailBody}>{forumDetail.body}</Text> : null}
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>{forumDetail.user?.name || 'Pengguna'}</Text>
            <Text style={styles.metaText}>{formatCount(forumDetail.answerCount)} jawaban</Text>
            <Text style={styles.metaText}>{formatCount(forumDetail.voteCount)} suara</Text>
          </View>
          <View style={styles.voteRow}>
            <Pressable disabled={forumVotingId === `${forumDetail.id}-1`} onPress={() => voteQuestion(1)} style={styles.voteButton}>
              <ThumbsUp color="#2563eb" size={15} strokeWidth={2.2} />
              <Text style={styles.voteButtonText}>Pertanyaan</Text>
            </Pressable>
            <Pressable disabled={forumVotingId === `${forumDetail.id}--1`} onPress={() => voteQuestion(-1)} style={styles.voteButton}>
              <ThumbsDown color="#64748b" size={15} strokeWidth={2.2} />
              <Text style={styles.voteButtonText}>Pertanyaan</Text>
            </Pressable>
          </View>
          <Text style={styles.sectionTitle}>Jawaban</Text>
          {forumAnswers.length ? forumAnswers.map((answer) => (
            <View key={answer.id} style={styles.answerCard}>
              <Text style={styles.detailBody}>{answer.body}</Text>
              <View style={styles.answerMeta}>
                <Text style={styles.metaText}>{answer.user?.name || 'Pengguna'}</Text>
                <Text style={styles.metaText}>{formatCount(answer.voteCount)} suara</Text>
                {answer.isAccepted ? <Text style={styles.acceptedText}>Diterima</Text> : null}
              </View>
              <View style={styles.voteRow}>
                {[1, -1].map((value) => (
                  <Pressable
                    disabled={forumVotingId === `${answer.id}-${value}`}
                    key={value}
                    onPress={() => voteAnswer(answer, value)}
                    style={styles.smallVoteButton}
                  >
                    <Text style={styles.voteButtonText}>{value > 0 ? 'Naik' : 'Turun'}</Text>
                  </Pressable>
                ))}
                {session?.token && !answer.isAccepted ? (
                  <Pressable disabled={forumVotingId === `accept-${answer.id}`} onPress={() => acceptAnswer(answer)} style={styles.smallVoteButton}>
                    <Text style={styles.voteButtonText}>Terima</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          )) : (
            <Text style={styles.emptyText}>Belum ada jawaban.</Text>
          )}
          {session?.token ? (
            <>
              <TextInput
                multiline
                onChangeText={setForumAnswerDraft}
                placeholder="Tulis jawaban..."
                placeholderTextColor="#94a3b8"
                style={[styles.formInput, styles.answerInput]}
                textAlignVertical="top"
                value={forumAnswerDraft}
              />
              <Pressable
                disabled={forumSaving || forumAnswerDraft.trim().length < 10}
                onPress={submitAnswer}
                style={[styles.submitButton, (forumSaving || forumAnswerDraft.trim().length < 10) && styles.disabledButton]}
              >
                <Text style={styles.submitButtonText}>{forumSaving ? 'Mengirim...' : 'Kirim Jawaban'}</Text>
              </Pressable>
            </>
          ) : (
            <Text style={styles.emptyText}>Buka Profil untuk masuk dan menjawab pertanyaan.</Text>
          )}
        </>
      )}
    </View>
  );

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      style={styles.root}
    >
      <View testID="explore-web-app-forum-surface" />
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <MessageCircle color="#2563eb" size={30} strokeWidth={2} />
        </View>
        <Text style={styles.title}>Forum Tanya Jawab</Text>
        <Text style={styles.subtitle}>Diskusi seputar Islam</Text>
      </View>
      <View style={styles.summaryRow}>
        <ForumStat label="pertanyaan" value={forumTotal} />
        <ForumStat label="halaman" value={forumPage + 1} />
      </View>
      {forumError ? <Text style={styles.error}>{forumError}</Text> : null}
      {forumLoading ? <Text style={styles.loadingText}>Memuat forum...</Text> : null}
      {forumView === 'ask' ? renderAsk() : forumView === 'detail' ? renderDetail() : renderList()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: '#f8fafc',
    flex: 1,
  },
  content: {
    backgroundColor: '#f8fafc',
    flexGrow: 1,
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: '#dbeafe',
    borderRadius: 16,
    height: 64,
    justifyContent: 'center',
    marginBottom: spacing.sm,
    width: 64,
  },
  title: {
    color: '#111827',
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 30,
    textAlign: 'center',
  },
  subtitle: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 3,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statPill: {
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderRadius: radius.lg,
    borderWidth: 1,
    flex: 1,
    padding: spacing.sm,
  },
  statValue: {
    color: '#111827',
    fontSize: 17,
    fontWeight: '900',
  },
  statLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  searchRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  searchBox: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 42,
    paddingHorizontal: spacing.sm,
  },
  input: {
    color: '#111827',
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 8,
  },
  askButton: {
    alignItems: 'center',
    backgroundColor: '#2563eb',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 5,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: spacing.md,
  },
  askButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  list: {
    gap: spacing.sm,
  },
  questionCard: {
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  questionTop: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  questionTitle: {
    color: '#111827',
    flex: 1,
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 20,
  },
  answeredBadge: {
    backgroundColor: '#dcfce7',
    borderRadius: 999,
    color: '#15803d',
    fontSize: 11,
    fontWeight: '900',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  questionBody: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
    marginTop: spacing.xs,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: spacing.sm,
  },
  tag: {
    backgroundColor: '#eff6ff',
    borderRadius: 6,
    color: '#2563eb',
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  metaText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
  },
  empty: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.xl,
  },
  emptyTitle: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '900',
    marginTop: spacing.sm,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
    marginTop: spacing.xs,
  },
  loadMore: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
    borderRadius: 12,
    borderWidth: 1,
    marginTop: spacing.md,
    paddingVertical: 11,
  },
  loadMoreText: {
    color: '#2563eb',
    fontSize: 13,
    fontWeight: '900',
  },
  panel: {
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  routeLink: {
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
  },
  routeLinkText: {
    color: '#2563eb',
    fontSize: 12,
    fontWeight: '900',
  },
  panelTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 24,
    marginBottom: spacing.sm,
  },
  formInput: {
    backgroundColor: '#f8fafc',
    borderColor: '#e5e7eb',
    borderRadius: 12,
    borderWidth: 1,
    color: '#111827',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  textArea: {
    minHeight: 118,
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 12,
  },
  disabledButton: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  detailBody: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 21,
  },
  voteRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  voteButton: {
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderRadius: 10,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
  },
  voteButtonText: {
    color: '#1e40af',
    fontSize: 12,
    fontWeight: '900',
  },
  sectionTitle: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '900',
    marginTop: spacing.md,
  },
  answerCard: {
    backgroundColor: '#f8fafc',
    borderColor: '#e5e7eb',
    borderRadius: 12,
    borderWidth: 1,
    marginTop: spacing.sm,
    padding: spacing.sm,
  },
  answerMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  acceptedText: {
    color: '#15803d',
    fontSize: 12,
    fontWeight: '900',
  },
  smallVoteButton: {
    backgroundColor: '#ffffff',
    borderColor: '#dbeafe',
    borderRadius: 9,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
  },
  answerInput: {
    marginTop: spacing.md,
    minHeight: 86,
  },
  error: {
    backgroundColor: '#fef2f2',
    borderRadius: 10,
    color: '#b91c1c',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: spacing.sm,
    padding: spacing.sm,
  },
  loadingText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
});
