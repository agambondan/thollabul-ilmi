package main

import (
	"bufio"
	"bytes"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"html"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"time"
)

type Channel struct {
	Name       string   `json:"nama"`
	Focus      []string `json:"fokus_kajian"`
	ChannelURL string   `json:"channel_url"`
}

type UstadzListEntry struct {
	Name        string            `json:"nama"`
	Focus       []string          `json:"fokus_kajian"`
	SocialMedia map[string]string `json:"media_sosial"`
}

type Video struct {
	VideoID      string `json:"video_id"`
	Title        string `json:"title"`
	Duration     int    `json:"duration"`
	URL          string `json:"url"`
	ThumbnailURL string `json:"thumbnail_url"`
}

type TranscriptChunk struct {
	StartSeconds int    `json:"start_seconds"`
	EndSeconds   int    `json:"end_seconds"`
	Text         string `json:"text"`
}

type KajianItem struct {
	Title        string            `json:"title"`
	Speaker      string            `json:"speaker"`
	Topic        string            `json:"topic"`
	Type         string            `json:"type"`
	URL          string            `json:"url"`
	VideoID      string            `json:"video_id"`
	Description  string            `json:"description"`
	Duration     int               `json:"duration"`
	ThumbnailURL string            `json:"thumbnail_url"`
	PublishedAt  string            `json:"published_at"`
	Transcripts  []TranscriptChunk `json:"transcripts"`
}

type FlatVideo struct {
	ID       string          `json:"id"`
	Title    string          `json:"title"`
	Duration json.RawMessage `json:"duration"`
}

type SkipCache struct {
	Entries map[string]SkipEntry `json:"entries"`
}

type SkipEntry struct {
	AttemptedAt time.Time `json:"attempted_at"`
	RetryAfter  time.Time `json:"retry_after"`
	Reason      string    `json:"reason"`
	Channel     string    `json:"channel"`
}

// ListingCache remembers each channel's flat-playlist result (video id,
// title, duration, thumbnail for every video, not just already-fetched
// ones) so a run started shortly after the last one doesn't pay for a
// full re-listing again. Paginating a prolific channel's history (Yufid,
// 20k+ videos) can take 10+ minutes; on a laptop that isn't left running
// 24/7, every restart used to redo that in full before any new fetching
// could even start.
type ListingCache struct {
	Entries map[string]ListingCacheEntry `json:"entries"`
}

type ListingCacheEntry struct {
	ListedAt time.Time `json:"listed_at"`
	Videos   []Video   `json:"videos"`
}

type Snippet struct {
	Text     string
	Start    float64
	Duration float64
}

var fallbackChannels = []Channel{
	{Name: "Ust. Dr. Khalid Basalamah, Lc., M.A.", Focus: []string{"Sirah Nabawiyah", "Tazkiyatun nufus", "Adab", "Fikih praktis"}, ChannelURL: "https://www.youtube.com/@khalidbasalamah"},
	{Name: "Ust. Dr. Syafiq Riza Basalamah, Lc., M.A.", Focus: []string{"Keharmonisan keluarga", "Pernikahan", "Adab bermasyarakat", "Akhlak keseharian"}, ChannelURL: "https://www.youtube.com/@SyafiqRizaBasalamahOfficial"},
	{Name: "Ust. Dr. Firanda Andirja, Lc., M.A.", Focus: []string{"Akidah", "Syarah kitab ulama", "Tafsir Al-Qur'an"}, ChannelURL: "https://www.youtube.com/@FirandaAndirjaOfficial"},
	{Name: "Ust. Muhammad Nuzul Dzikri, Lc.", Focus: []string{"Penyucian jiwa", "Adab penuntut ilmu", "Isu kehidupan pemuda"}, ChannelURL: "https://www.youtube.com/@MuhammadNuzulDzikri"},
	{Name: "Ust. Dr. Erwandi Tarmizi, Lc., M.A.", Focus: []string{"Fikih muamalah kontemporer", "Hukum perbankan", "Investasi dan bisnis syariah"}, ChannelURL: "https://www.youtube.com/@AshiilTV"},
	{Name: "Ust. Ammi Nur Baits, S.T., B.A.", Focus: []string{"Fikih muamalah dasar", "Fikih ibadah harian", "Konsultasi syariah praktis"}, ChannelURL: "https://www.youtube.com/@anbchannel"},
	{Name: "Ust. Abu Yahya Badrusalam, Lc.", Focus: []string{"Hadis tematik", "Akidah", "Dakwah media sunnah"}, ChannelURL: "https://www.youtube.com/@rodjatv"},
	{Name: "Ust. Dr. Abdullah Roy, M.A.", Focus: []string{"Akidah dan tauhid terstruktur (HSI)", "Pembelajaran silsilah ilmiyyah"}, ChannelURL: "https://www.youtube.com/@AbdullahRoy"},
	{Name: "Ust. Subhan Bawazier, Lc.", Focus: []string{"Kajian tematik sosial", "Nasihat praktis hijrah", "Binaan komunitas pemuda/otomotif"}, ChannelURL: "https://www.youtube.com/@AladzievieChannel"},
}

func main() {
	channel := flag.String("channel", "", "Single channel URL")
	speaker := flag.String("speaker", "", "Speaker name when using --channel")
	topic := flag.String("topic", "", "Topic/focus when using --channel")
	maxVideos := flag.Int("max", 0, "Max videos per channel, 0 for unlimited (whole channel history)")
	cookies := flag.String("cookies", "", "Browser name or cookies.txt path")
	allowEmptyTranscript := flag.Bool("allow-empty-transcript", false, "Include videos without transcript")
	skipRetryDays := flag.Int("skip-retry-days", 14, "Days to defer retrying videos with no transcript")
	outDir := flag.String("out-dir", defaultOutDir(), "Output directory: one <slug>.json per channel")
	channelsFile := flag.String("channels-file", defaultChannelsFile(), "Ustadz/channel JSON file")
	skipCachePath := flag.String("skip-cache", defaultSkipCacheFile(), "Path to no-transcript skip cache JSON")
	listChannels := flag.Bool("list-channels", false, "Print each channel's output slug and exit (no scraping)")
	concurrency := flag.Int("concurrency", 2, "Videos fetched in parallel, round-robin across channels (channel 1's video 1, channel 2's video 1, ..., then channel 1's video 2, ...) rather than draining one channel before starting the next -- so an interrupted run still leaves every channel with some progress. Keep it low (2-3); YouTube rate-limits/blocks by source IP, so this multiplies the request rate seen from this machine.")
	refreshTitles := flag.Bool("refresh-titles", false, "Fast path: look up each already-scraped video's title via YouTube oEmbed (plain HTTP, no yt-dlp) instead of re-listing whole channels. Only updates title/description on rows that already exist; does not discover new videos or fetch transcripts.")
	refreshConcurrency := flag.Int("refresh-concurrency", 6, "Concurrent oEmbed lookups during -refresh-titles")
	fixVideoID := flag.String("fix-video", "", "Re-fetch and upsert one specific video id into its channel's file (use with -channel/-speaker to identify the channel), bypassing listing and the round-robin queue entirely. For patching a single corrupted/fabricated/incomplete entry without a full re-scrape.")
	listingCachePath := flag.String("listing-cache", defaultListingCacheFile(), "Path to the per-channel listing cache JSON (video id/title/duration/thumbnail for every video, not just fetched ones)")
	listingCacheTTL := flag.Duration("listing-cache-ttl", 6*time.Hour, "Reuse a channel's cached listing instead of re-querying yt-dlp if it was listed more recently than this. Set 0 to always re-list.")
	flag.Parse()

	targets := []Channel{}
	if strings.TrimSpace(*channel) != "" {
		if strings.TrimSpace(*speaker) == "" {
			fatalf("--speaker required when using --channel")
		}
		focus := []string{"Kajian Umum"}
		if strings.TrimSpace(*topic) != "" {
			focus = []string{*topic}
		}
		targets = append(targets, Channel{Name: *speaker, Focus: focus, ChannelURL: *channel})
	} else {
		targets = loadChannels(*channelsFile)
	}

	if *listChannels {
		for _, target := range targets {
			fmt.Printf("%s\t%s\t%s\n", channelSlug(target), target.ChannelURL, target.Name)
		}
		return
	}

	if err := os.MkdirAll(*outDir, 0o755); err != nil {
		fatalf("create output dir: %v", err)
	}

	if *refreshTitles {
		refreshTitlesOnly(targets, *outDir, *refreshConcurrency)
		return
	}

	if _, err := exec.LookPath("yt-dlp"); err != nil {
		fatalf("yt-dlp not found in PATH")
	}

	if strings.TrimSpace(*fixVideoID) != "" {
		if len(targets) != 1 {
			fatalf("-fix-video requires -channel (and -speaker) to identify which channel file to update")
		}
		fixSingleVideo(targets[0], strings.TrimSpace(*fixVideoID), *cookies, *outDir)
		return
	}

	skipCache := loadSkipCache(*skipCachePath)
	skipCachePathPtr := *skipCachePath
	retryInterval := time.Duration(*skipRetryDays) * 24 * time.Hour
	now := time.Now().UTC()
	listingCache := loadListingCache(*listingCachePath)

	totalNew, totalAll := scrapeAllRoundRobin(targets, *maxVideos, *cookies, !*allowEmptyTranscript, *outDir, skipCache, retryInterval, &now, &skipCachePathPtr, *concurrency, listingCache, *listingCachePath, *listingCacheTTL)
	writeManifest(*outDir, targets)

	if err := saveSkipCache(*skipCachePath, skipCache); err != nil {
		fmt.Fprintf(os.Stderr, "warning: save skip cache: %v\n", err)
	}
	fmt.Printf("\n[DONE] Berhasil menyimpan %d video (%d baru) ke %s (%d channel)\n", totalAll, totalNew, *outDir, len(targets))
}

// channelSlug derives a stable filename stem from a channel URL, e.g.
// "https://www.youtube.com/@khalidbasalamah" -> "khalidbasalamah". Two
// different channels never collide because YouTube handles are unique; if a
// URL somehow has no usable segment, the ustadz's name is used instead so the
// scraper still produces a distinct, deterministic file per channel.
func channelSlug(c Channel) string {
	s := slugify(lastPathSegment(c.ChannelURL))
	if s == "" {
		s = slugify(c.Name)
	}
	if s == "" {
		s = "channel"
	}
	return s
}

func lastPathSegment(url string) string {
	url = strings.TrimRight(strings.TrimSpace(url), "/")
	if i := strings.LastIndex(url, "/"); i >= 0 {
		url = url[i+1:]
	}
	return strings.TrimPrefix(url, "@")
}

var nonSlugChars = regexp.MustCompile(`[^a-z0-9_-]+`)

func slugify(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	s = nonSlugChars.ReplaceAllString(s, "_")
	s = strings.Trim(s, "_-")
	return s
}

// writeManifest writes a small, git-diff-friendly summary of every channel's
// file next to the per-channel JSONs. It is not read by the API seeder
// (readStaticJSONDir skips "_"-prefixed files); it exists purely so an
// operator can see catalog size without opening 50+ files.
type manifestEntry struct {
	Slug       string `json:"slug"`
	Name       string `json:"nama"`
	ChannelURL string `json:"channel_url"`
	Videos     int    `json:"videos"`
	Chunks     int    `json:"chunks"`
}

func writeManifest(outDir string, targets []Channel) {
	entries := make([]manifestEntry, 0, len(targets))
	for _, target := range targets {
		slug := channelSlug(target)
		items, _ := loadExisting(filepath.Join(outDir, slug+".json"))
		chunks := 0
		for _, item := range items {
			chunks += len(item.Transcripts)
		}
		entries = append(entries, manifestEntry{Slug: slug, Name: target.Name, ChannelURL: target.ChannelURL, Videos: len(items), Chunks: chunks})
	}
	sort.Slice(entries, func(i, j int) bool { return entries[i].Slug < entries[j].Slug })
	data, err := json.MarshalIndent(entries, "", "    ")
	if err != nil {
		return
	}
	_ = os.WriteFile(filepath.Join(outDir, "_index.json"), append(data, '\n'), 0o644)
}

func defaultOutDir() string {
	return filepath.Join(repoRoot(), "services", "api", "data", "static", "kajian")
}

func defaultChannelsFile() string {
	return filepath.Join(repoRoot(), "list_ustad_sunnah.json")
}

func defaultSkipCacheFile() string {
	return filepath.Join(repoRoot(), "services", "api", "data", "static", "kajian_scrape_state.json")
}

func defaultListingCacheFile() string {
	return filepath.Join(repoRoot(), "services", "api", "data", "static", "kajian_listing_cache.json")
}

func repoRoot() string {
	wd, err := os.Getwd()
	if err != nil {
		return "."
	}
	for {
		if _, err := os.Stat(filepath.Join(wd, "go.mod")); err == nil && filepath.Base(wd) == "api" {
			return filepath.Clean(filepath.Join(wd, "..", ".."))
		}
		if _, err := os.Stat(filepath.Join(wd, "list_ustad_sunnah.json")); err == nil {
			return wd
		}
		parent := filepath.Dir(wd)
		if parent == wd {
			return "."
		}
		wd = parent
	}
}

func loadChannels(path string) []Channel {
	data, err := os.ReadFile(path)
	if err != nil {
		return fallbackChannels
	}
	var entries []UstadzListEntry
	if err := json.Unmarshal(data, &entries); err != nil {
		return fallbackChannels
	}
	channels := make([]Channel, 0, len(entries))
	seen := map[string]bool{}
	for _, entry := range entries {
		youtube := strings.TrimRight(strings.TrimSpace(entry.SocialMedia["youtube"]), "/")
		if youtube == "" || seen[youtube] {
			continue
		}
		seen[youtube] = true
		focus := entry.Focus
		if len(focus) == 0 {
			focus = []string{"Kajian Umum"}
		}
		name := entry.Name
		if name == "" {
			name = youtube
		}
		channels = append(channels, Channel{Name: name, Focus: focus, ChannelURL: youtube})
	}
	if len(channels) == 0 {
		return fallbackChannels
	}
	return channels
}

func loadExisting(path string) ([]KajianItem, map[string]KajianItem) {
	items := []KajianItem{}
	m := map[string]KajianItem{}
	data, err := os.ReadFile(path)
	if err != nil {
		return items, m
	}
	if err := json.Unmarshal(data, &items); err != nil {
		return []KajianItem{}, m
	}
	for _, item := range items {
		key := item.VideoID
		if key == "" {
			key = item.URL
		}
		if key != "" {
			m[key] = item
		}
	}
	return items, m
}

func loadSkipCache(path string) SkipCache {
	cache := SkipCache{Entries: map[string]SkipEntry{}}
	data, err := os.ReadFile(path)
	if err != nil {
		return cache
	}
	if err := json.Unmarshal(data, &cache); err != nil || cache.Entries == nil {
		return SkipCache{Entries: map[string]SkipEntry{}}
	}
	return cache
}

func saveSkipCache(path string, cache SkipCache) error {
	if cache.Entries == nil {
		cache.Entries = map[string]SkipEntry{}
	}
	data, err := json.MarshalIndent(cache, "", "  ")
	if err != nil {
		return err
	}
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return err
	}
	return os.WriteFile(path, append(data, '\n'), 0o644)
}

func loadListingCache(path string) ListingCache {
	cache := ListingCache{Entries: map[string]ListingCacheEntry{}}
	data, err := os.ReadFile(path)
	if err != nil {
		return cache
	}
	if err := json.Unmarshal(data, &cache); err != nil || cache.Entries == nil {
		return ListingCache{Entries: map[string]ListingCacheEntry{}}
	}
	return cache
}

func saveListingCache(path string, cache ListingCache) error {
	if cache.Entries == nil {
		cache.Entries = map[string]ListingCacheEntry{}
	}
	data, err := json.MarshalIndent(cache, "", "  ")
	if err != nil {
		return err
	}
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return err
	}
	return os.WriteFile(path, append(data, '\n'), 0o644)
}

func shouldDefer(cache SkipCache, videoID string, now time.Time) bool {
	if videoID == "" || cache.Entries == nil {
		return false
	}
	entry, ok := cache.Entries[videoID]
	return ok && now.Before(entry.RetryAfter)
}

// fixSingleVideo re-fetches one specific video's transcript through the
// same fetchTranscript/chunkTranscript pipeline as a normal scrape, and
// upserts it into the channel's existing file. It keeps whatever
// title/duration/thumbnail is already on record for that video (the
// listing-derived fields aren't what's broken in the cases this exists
// for -- a corrupted or fabricated transcript is) rather than re-listing
// the whole channel just to get them again.
func fixSingleVideo(channel Channel, videoID string, cookies string, outDir string) {
	path := filepath.Join(outDir, channelSlug(channel)+".json")
	_, existing := loadExisting(path)

	snippets, confirmedAbsent, publishedAt := fetchTranscript(videoID, cookies)
	chunks := chunkTranscript(snippets, 60)
	if len(chunks) == 0 {
		fmt.Printf("[fix-video] %s: no transcript found (confirmedAbsent=%v) -- left unchanged\n", videoID, confirmedAbsent)
		return
	}

	existingItem := existing[videoID]
	if publishedAt == "" {
		publishedAt = existingItem.PublishedAt
	}
	if publishedAt == "" {
		publishedAt = "2024-01-01"
	}
	title := existingItem.Title
	item := KajianItem{
		Title:        title,
		Speaker:      channel.Name,
		Topic:        strings.Join(channel.Focus, ", "),
		Type:         "video",
		URL:          "https://www.youtube.com/watch?v=" + videoID,
		VideoID:      videoID,
		Description:  fmt.Sprintf("Kajian oleh %s: %s", channel.Name, title),
		Duration:     existingItem.Duration,
		ThumbnailURL: existingItem.ThumbnailURL,
		PublishedAt:  publishedAt,
		Transcripts:  chunks,
	}
	existing[videoID] = item
	if err := writeItems(path, mapValues(existing)); err != nil {
		fmt.Printf("[fix-video] %s: write failed: %v\n", videoID, err)
		return
	}
	fmt.Printf("[fix-video] %s: %d chunks written to %s\n", videoID, len(chunks), path)
}

func getChannelVideos(channelURL string, maxVideos int, cookies string) []Video {
	// Without this, YouTube's channel/tab listing (flat-playlist) sometimes
	// hands back its own auto-translated English title instead of the
	// uploader's real one (e.g. "Friday Sermon..." for a video actually
	// titled "Khutbah Jum'at..."), while a full per-video extraction or
	// oEmbed on the same id returns the real title. Forcing lang=id here
	// makes the cheap listing call agree with the real title.
	langArgs := []string{"--extractor-args", "youtube:lang=id"}

	target := ""
	for _, suffix := range []string{"/videos", "/streams", ""} {
		candidate := strings.TrimRight(channelURL, "/") + suffix
		args := append([]string{}, cookieArgs(cookies)...)
		args = append(args, langArgs...)
		args = append(args, "--flat-playlist", "--no-warnings", "--dump-json", "--playlist-end", "1", candidate)
		stdout, err := runCmdWithRetry(20*time.Second, 3, 10*time.Second, "yt-dlp", args...)
		if err == nil && strings.TrimSpace(string(stdout)) != "" {
			target = candidate
			break
		}
	}
	if target == "" {
		return nil
	}

	args := append([]string{}, cookieArgs(cookies)...)
	args = append(args, langArgs...)
	args = append(args, "--flat-playlist", "--no-warnings", "--dump-json")
	if maxVideos > 0 {
		args = append(args, "--playlist-end", strconv.Itoa(maxVideos))
	}
	args = append(args, target)
	// yt-dlp has to paginate through YouTube's continuation tokens to
	// enumerate a channel's videos; an unbounded request ("-max 0", the
	// default) or a large one walks the whole catalog instead of stopping
	// early. A prolific channel (Khalid Basalamah, Firanda Andirja, ...) can
	// hold 2,000+ videos and take well over two minutes to list in full —
	// the old fixed 120s timeout made every such channel silently report
	// "0 video" once -max stopped being passed.
	listTimeout := 120 * time.Second
	if maxVideos <= 0 || maxVideos > 200 {
		listTimeout = 30 * time.Minute
	}
	stdout, err := runCmdWithRetry(listTimeout, 4, 15*time.Second, "yt-dlp", args...)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error fetching channel videos from %s: %v\n", channelURL, err)
		return nil
	}

	videos := []Video{}
	scanner := bufio.NewScanner(bytes.NewReader(stdout))
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" {
			continue
		}
		var flat FlatVideo
		if err := json.Unmarshal([]byte(line), &flat); err != nil {
			continue
		}
		if len(flat.ID) != 11 || flat.Title == "" {
			continue
		}
		videos = append(videos, Video{
			VideoID:      flat.ID,
			Title:        flat.Title,
			Duration:     parseDuration(flat.Duration),
			URL:          "https://www.youtube.com/watch?v=" + flat.ID,
			ThumbnailURL: "https://i.ytimg.com/vi/" + flat.ID + "/hqdefault.jpg",
		})
	}
	return videos
}

// fetchTranscript downloads a video's captions and reports whether the
// absence of any transcript is a *confirmed* fact rather than a fetch
// failure. yt-dlp exits 0 with "There are no subtitles for the requested
// languages" when a video genuinely has none — that is safe to cache. A
// non-zero exit or a timeout (a dropped connection, a network that
// intercepts YouTube's TLS — BBG-style — a transient block, a rate limit)
// means we simply don't know yet, and treating it as "confirmed absent"
// would park a perfectly normal video in the skip-cache for
// -skip-retry-days over what was really a connectivity blip.
func fetchTranscript(videoID string, cookies string) (snippets []Snippet, confirmedAbsent bool, publishedAt string) {
	dir, err := os.MkdirTemp("", "kajian-caption-*")
	if err != nil {
		return nil, false, ""
	}
	defer os.RemoveAll(dir)

	stem := filepath.Join(dir, "caption_tmp")
	base := []string{
		"--skip-download",
		"--sub-langs", "id.*,en.*,id,en",
		"--sub-format", "vtt/best",
		"--extractor-args", "youtube:player_client=android,ios,web",
		"--no-warnings",
		// This call already fetches the video once for its captions --
		// --dump-json rides along on that same request to also pull the
		// real upload date, instead of leaving every row on the
		// "2024-01-01" placeholder or paying for a second yt-dlp call
		// per video just for metadata. --dump-json alone puts yt-dlp in
		// simulate mode (per its own --help), which silently skips
		// --write-subs/--write-auto-subs entirely -- every video looked
		// like it had no captions until --no-simulate forced the actual
		// write to still happen alongside the JSON dump.
		"--dump-json",
		"--no-simulate",
		"-o", stem,
		"https://www.youtube.com/watch?v=" + videoID,
	}
	sawFetchError := false
	for _, mode := range []string{"--write-subs", "--write-auto-subs"} {
		args := append([]string{}, cookieArgs(cookies)...)
		args = append(args, mode)
		args = append(args, base...)
		stdout, err := runCmdWithRetry(60*time.Second, 4, 15*time.Second, "yt-dlp", args...)
		if publishedAt == "" {
			publishedAt = parseUploadDate(stdout)
		}
		files, _ := filepath.Glob(filepath.Join(dir, "caption_tmp*.vtt"))
		if len(files) > 0 {
			// yt-dlp can exit non-zero after partially succeeding (e.g. one
			// requested language 429s after another already downloaded) —
			// a real transcript in hand always counts as success regardless
			// of the exit code.
			return dedupeRollingCaptions(parseVTT(pickVTT(files))), false, publishedAt
		}
		if err != nil {
			sawFetchError = true
		}
	}
	return nil, !sawFetchError, publishedAt
}

// parseUploadDate pulls "upload_date" (yt-dlp's YYYYMMDD) out of a
// --dump-json response and reformats it as YYYY-MM-DD to match the
// Kajian.PublishedAt column. Best-effort: returns "" on anything
// unexpected rather than erroring, since the caption fetch itself already
// succeeded or failed independently of this.
func parseUploadDate(stdout []byte) string {
	var payload struct {
		UploadDate string `json:"upload_date"`
	}
	scanner := bufio.NewScanner(bytes.NewReader(stdout))
	// A video's full --dump-json line (every format/thumbnail/subtitle
	// variant included) routinely runs past bufio.Scanner's 64KB default,
	// which makes Scan() silently give up on the line entirely -- seen
	// hitting ~550KB for a single video during testing.
	scanner.Buffer(make([]byte, 0, 64*1024), 4*1024*1024)
	for scanner.Scan() {
		line := bytes.TrimSpace(scanner.Bytes())
		if len(line) == 0 || line[0] != '{' {
			continue
		}
		if err := json.Unmarshal(line, &payload); err == nil && len(payload.UploadDate) == 8 {
			return payload.UploadDate[0:4] + "-" + payload.UploadDate[4:6] + "-" + payload.UploadDate[6:8]
		}
	}
	return ""
}

func parseVTT(path string) []Snippet {
	f, err := os.Open(path)
	if err != nil {
		return nil
	}
	defer f.Close()

	pattern := regexp.MustCompile(`(\d{2}):(\d{2}):(\d{2})\.(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})\.(\d{3})`)
	snippets := []Snippet{}
	currentStart := -1.0
	scanner := bufio.NewScanner(f)
	buf := make([]byte, 1024)
	scanner.Buffer(buf, 1024*1024)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "WEBVTT") || strings.HasPrefix(line, "NOTE") || strings.HasPrefix(line, "Kind:") || strings.HasPrefix(line, "Language:") {
			continue
		}
		if m := pattern.FindStringSubmatch(line); m != nil {
			currentStart = seconds(m[1], m[2], m[3], m[4])
			continue
		}
		if currentStart >= 0 {
			text := cleanCaption(line)
			if text != "" {
				snippets = append(snippets, Snippet{Text: text, Start: currentStart, Duration: 2})
				currentStart = -1
			}
		}
	}
	return snippets
}

func dedupeRollingCaptions(segments []Snippet) []Snippet {
	result := []Snippet{}
	prevWords := []string{}
	for _, segment := range segments {
		words := strings.Fields(segment.Text)
		if len(words) == 0 {
			continue
		}
		overlap := 0
		maxK := min(len(prevWords), len(words))
		for k := maxK; k > 0; k-- {
			if equalWords(prevWords[len(prevWords)-k:], words[:k]) {
				overlap = k
				break
			}
		}
		if overlap < len(words) {
			result = append(result, Snippet{Text: strings.Join(words[overlap:], " "), Start: segment.Start, Duration: segment.Duration})
			prevWords = words
		}
	}
	return result
}

func chunkTranscript(snippets []Snippet, chunkDuration int) []TranscriptChunk {
	chunks := []TranscriptChunk{}
	current := TranscriptChunk{StartSeconds: 0, EndSeconds: 0}
	texts := []string{}
	for _, snippet := range snippets {
		start := int(snippet.Start)
		end := start + int(snippet.Duration)
		if len(texts) == 0 {
			current.StartSeconds = start
			current.EndSeconds = end
			texts = append(texts, strings.TrimSpace(snippet.Text))
			continue
		}
		if start-current.StartSeconds < chunkDuration {
			if end > current.EndSeconds {
				current.EndSeconds = end
			}
			texts = append(texts, strings.TrimSpace(snippet.Text))
			continue
		}
		current.Text = strings.Join(texts, " ")
		chunks = append(chunks, current)
		current = TranscriptChunk{StartSeconds: start, EndSeconds: end}
		texts = []string{strings.TrimSpace(snippet.Text)}
	}
	if len(texts) > 0 {
		current.Text = strings.Join(texts, " ")
		chunks = append(chunks, current)
	}
	return chunks
}

func cookieArgs(cookies string) []string {
	cookies = strings.TrimSpace(cookies)
	if cookies == "" {
		return nil
	}
	switch cookies {
	case "chrome", "firefox", "brave", "chromium", "edge":
		return []string{"--cookies-from-browser", cookies}
	default:
		return []string{"--cookies", cookies}
	}
}

func runCmd(timeout time.Duration, name string, args ...string) ([]byte, error) {
	cmd := exec.Command(name, args...)
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr
	if err := cmd.Start(); err != nil {
		return nil, err
	}
	done := make(chan error, 1)
	go func() { done <- cmd.Wait() }()
	select {
	case err := <-done:
		if err != nil {
			return stdout.Bytes(), errors.New(strings.TrimSpace(stderr.String()))
		}
		return stdout.Bytes(), nil
	case <-time.After(timeout):
		_ = cmd.Process.Kill()
		<-done
		return stdout.Bytes(), fmt.Errorf("timeout after %s", timeout)
	}
}

// runCmdWithRetry retries a failed yt-dlp call with backoff instead of
// giving up on the first attempt. This laptop's network can hop onto one
// that blocks YouTube entirely (BBG) for anywhere from a few seconds to
// several minutes and back again without warning, so a single transient
// failure is not evidence the video/channel is actually unreachable --
// only that this one attempt landed during a blip. Retrying here means a
// short outage gets ridden out within the same run instead of silently
// costing that item until someone notices and reruns the whole scrape.
func runCmdWithRetry(timeout time.Duration, retries int, backoff time.Duration, name string, args ...string) ([]byte, error) {
	var stdout []byte
	var err error
	for attempt := 0; ; attempt++ {
		stdout, err = runCmd(timeout, name, args...)
		if err == nil || attempt >= retries {
			return stdout, err
		}
		time.Sleep(backoff)
		backoff *= 2
	}
}

func parseDuration(raw json.RawMessage) int {
	if len(raw) == 0 || string(raw) == "null" {
		return 0
	}
	var n float64
	if err := json.Unmarshal(raw, &n); err == nil {
		return int(n)
	}
	var s string
	if err := json.Unmarshal(raw, &s); err == nil {
		f, _ := strconv.ParseFloat(s, 64)
		return int(f)
	}
	return 0
}

func pickVTT(files []string) string {
	sort.Strings(files)
	for _, file := range files {
		if strings.Contains(filepath.Base(file), "id") {
			return file
		}
	}
	return files[0]
}

func cleanCaption(line string) string {
	line = html.UnescapeString(line)
	line = regexp.MustCompile(`<[^>]+>`).ReplaceAllString(line, "")
	line = regexp.MustCompile(`\s+`).ReplaceAllString(line, " ")
	return strings.TrimSpace(line)
}

func seconds(h, m, s, ms string) float64 {
	hh, _ := strconv.Atoi(h)
	mm, _ := strconv.Atoi(m)
	ss, _ := strconv.Atoi(s)
	mmm, _ := strconv.Atoi(ms)
	return float64(hh*3600+mm*60+ss) + float64(mmm)/1000
}

func equalWords(a, b []string) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i] != b[i] {
			return false
		}
	}
	return true
}

func writeItems(path string, items []KajianItem) error {
	if err := os.MkdirAll(filepath.Dir(path), 0755); err != nil {
		return err
	}
	data, err := json.MarshalIndent(items, "", "    ")
	if err != nil {
		return err
	}
	data = append(data, '\n')
	return os.WriteFile(path, data, 0644)
}

func mapValues(m map[string]KajianItem) []KajianItem {
	items := make([]KajianItem, 0, len(m))
	for _, item := range m {
		items = append(items, item)
	}
	sort.SliceStable(items, func(i, j int) bool {
		return items[i].Title < items[j].Title
	})
	return items
}

func trim(s string, limit int) string {
	if len([]rune(s)) <= limit {
		return s
	}
	r := []rune(s)
	return string(r[:limit])
}

func fatalf(format string, args ...any) {
	fmt.Fprintf(os.Stderr, format+"\n", args...)
	os.Exit(1)
}
