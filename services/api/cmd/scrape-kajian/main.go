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
	maxVideos := flag.Int("max", 50, "Max videos per channel, 0 for unlimited")
	cookies := flag.String("cookies", "", "Browser name or cookies.txt path")
	allowEmptyTranscript := flag.Bool("allow-empty-transcript", false, "Include videos without transcript")
	out := flag.String("out", defaultOutFile(), "Output JSON path")
	channelsFile := flag.String("channels-file", defaultChannelsFile(), "Ustadz/channel JSON file")
	flag.Parse()

	if _, err := exec.LookPath("yt-dlp"); err != nil {
		fatalf("yt-dlp not found in PATH")
	}

	existing, existingMap := loadExisting(*out)
	_ = existing

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

	totalNew := 0
	for _, target := range targets {
		items := scrapeChannel(target, *maxVideos, *cookies, !*allowEmptyTranscript, *out, existingMap)
		for _, item := range items {
			if _, ok := existingMap[item.VideoID]; !ok {
				totalNew++
			}
			existingMap[item.VideoID] = item
		}
	}

	if err := writeItems(*out, mapValues(existingMap)); err != nil {
		fatalf("write output: %v", err)
	}
	fmt.Printf("\n[DONE] Berhasil menyimpan %d video (%d baru) ke %s\n", len(existingMap), totalNew, *out)
}

func defaultOutFile() string {
	return filepath.Join(repoRoot(), "services", "api", "data", "static", "kajian.json")
}

func defaultChannelsFile() string {
	return filepath.Join(repoRoot(), "list_ustad_sunnah.json")
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

func scrapeChannel(channel Channel, maxVideos int, cookies string, onlyWithTranscript bool, outFile string, existing map[string]KajianItem) []KajianItem {
	fmt.Printf("\n[SCAN] %s (%s)...\n", channel.Name, channel.ChannelURL)
	videos := getChannelVideos(channel.ChannelURL, maxVideos, cookies)
	fmt.Printf("       Ditemukan %d video.\n", len(videos))

	items := []KajianItem{}
	for i, video := range videos {
		if existingItem, ok := existing[video.VideoID]; ok && len(existingItem.Transcripts) > 0 {
			fmt.Printf("       [%d/%d] ↷ %s... (Sudah ada - skip)\n", i+1, len(videos), trim(video.Title, 45))
			continue
		}

		snippets := fetchTranscript(video.VideoID, cookies)
		chunks := chunkTranscript(snippets, 60)
		if onlyWithTranscript && len(chunks) == 0 {
			fmt.Printf("       [%d/%d] ✗ %s... (Tanpa transkrip - skip)\n", i+1, len(videos), trim(video.Title, 45))
			time.Sleep(time.Second)
			continue
		}

		item := KajianItem{
			Title:        video.Title,
			Speaker:      channel.Name,
			Topic:        strings.Join(channel.Focus, ", "),
			Type:         "video",
			URL:          video.URL,
			VideoID:      video.VideoID,
			Description:  fmt.Sprintf("Kajian oleh %s: %s", channel.Name, video.Title),
			Duration:     video.Duration,
			ThumbnailURL: video.ThumbnailURL,
			PublishedAt:  "2024-01-01",
			Transcripts:  chunks,
		}
		items = append(items, item)
		existing[video.VideoID] = item
		_ = writeItems(outFile, mapValues(existing))
		fmt.Printf("       [%d/%d] ✓ %s... (%d chunks transkrip)\n", i+1, len(videos), trim(video.Title, 45), len(chunks))
		time.Sleep(1500 * time.Millisecond)
	}
	return items
}

func getChannelVideos(channelURL string, maxVideos int, cookies string) []Video {
	target := ""
	for _, suffix := range []string{"/videos", "/streams", ""} {
		candidate := strings.TrimRight(channelURL, "/") + suffix
		args := append([]string{}, cookieArgs(cookies)...)
		args = append(args, "--flat-playlist", "--no-warnings", "--dump-json", "--playlist-end", "1", candidate)
		stdout, err := runCmd(20*time.Second, "yt-dlp", args...)
		if err == nil && strings.TrimSpace(string(stdout)) != "" {
			target = candidate
			break
		}
	}
	if target == "" {
		return nil
	}

	args := append([]string{}, cookieArgs(cookies)...)
	args = append(args, "--flat-playlist", "--no-warnings", "--dump-json")
	if maxVideos > 0 {
		args = append(args, "--playlist-end", strconv.Itoa(maxVideos))
	}
	args = append(args, target)
	stdout, err := runCmd(120*time.Second, "yt-dlp", args...)
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

func fetchTranscript(videoID string, cookies string) []Snippet {
	dir, err := os.MkdirTemp("", "kajian-caption-*")
	if err != nil {
		return nil
	}
	defer os.RemoveAll(dir)

	stem := filepath.Join(dir, "caption_tmp")
	base := []string{
		"--skip-download",
		"--sub-langs", "id.*,en.*,id,en",
		"--sub-format", "vtt/best",
		"--extractor-args", "youtube:player_client=android,ios,web",
		"--no-warnings",
		"-o", stem,
		"https://www.youtube.com/watch?v=" + videoID,
	}
	for _, mode := range []string{"--write-subs", "--write-auto-subs"} {
		args := append([]string{}, cookieArgs(cookies)...)
		args = append(args, mode)
		args = append(args, base...)
		_, _ = runCmd(60*time.Second, "yt-dlp", args...)
		files, _ := filepath.Glob(filepath.Join(dir, "caption_tmp*.vtt"))
		if len(files) > 0 {
			return dedupeRollingCaptions(parseVTT(pickVTT(files)))
		}
	}
	return nil
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
