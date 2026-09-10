package main

import (
	"fmt"
	"path/filepath"
	"strings"
	"sync"
	"time"
)

type channelWork struct {
	channel Channel
	path    string
	mu      sync.Mutex
	items   map[string]KajianItem
}

// scrapeAllRoundRobin lists every channel first, then interleaves their
// videos one at a time -- channel 1's video 1, channel 2's video 1, ...,
// channel 1's video 2, channel 2's video 2, ... -- instead of draining one
// channel's entire backlog before starting the next. A prolific channel
// (Khalid Basalamah, ~4900 videos) would otherwise starve every other
// channel of progress for hours; round-robin means a run interrupted
// partway (network drop, laptop closed) still leaves every channel with
// some coverage instead of a few finished and the rest untouched.
func scrapeAllRoundRobin(targets []Channel, maxVideos int, cookies string, onlyWithTranscript bool, outDir string, skipCache SkipCache, retryInterval time.Duration, now *time.Time, skipCachePath *string, concurrency int) (totalNew, totalAll int) {
	workers := concurrency
	if workers < 1 {
		workers = 1
	}

	works := make([]*channelWork, len(targets))
	videoLists := make([][]Video, len(targets))

	listSem := make(chan struct{}, workers)
	var listWg sync.WaitGroup
	for i, target := range targets {
		i, target := i, target
		path := filepath.Join(outDir, channelSlug(target)+".json")
		_, existing := loadExisting(path)
		works[i] = &channelWork{channel: target, path: path, items: existing}

		listWg.Add(1)
		listSem <- struct{}{}
		go func() {
			defer listWg.Done()
			defer func() { <-listSem }()
			tag := "[" + channelSlug(target) + "]"
			fmt.Printf("\n%s [SCAN] %s (%s)...\n", tag, target.Name, target.ChannelURL)
			videos := getChannelVideos(target.ChannelURL, maxVideos, cookies)
			fmt.Printf("%s        Ditemukan %d video.\n", tag, len(videos))
			videoLists[i] = videos
		}()
	}
	listWg.Wait()

	type job struct {
		work  *channelWork
		video Video
		pos   int
		total int
	}
	var jobs []job
	maxLen := 0
	for _, vl := range videoLists {
		if len(vl) > maxLen {
			maxLen = len(vl)
		}
	}
	for round := 0; round < maxLen; round++ {
		for i, vl := range videoLists {
			if round < len(vl) {
				jobs = append(jobs, job{work: works[i], video: vl[round], pos: round + 1, total: len(vl)})
			}
		}
	}

	var cacheMu sync.Mutex
	var totalsMu sync.Mutex
	jobCh := make(chan job, 256)
	var wg sync.WaitGroup
	for w := 0; w < workers; w++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for j := range jobCh {
				if processVideo(j.work, j.video, j.pos, j.total, cookies, onlyWithTranscript, skipCache, &cacheMu, retryInterval, now, skipCachePath) {
					totalsMu.Lock()
					totalNew++
					totalsMu.Unlock()
				}
			}
		}()
	}
	for _, j := range jobs {
		jobCh <- j
	}
	close(jobCh)
	wg.Wait()

	for _, w := range works {
		totalAll += len(w.items)
	}
	return totalNew, totalAll
}

// processVideo handles a single video against its own channel's state.
// Multiple workers can end up processing different rounds of the *same*
// channel near the tail of a run (once most channels run out of videos,
// idle workers race ahead into later rounds of whichever channels still
// have some left) -- so every read/write of work.items and its file is
// behind work.mu, unlike the old one-goroutine-per-channel model where a
// channel's own map was only ever touched sequentially by itself.
func processVideo(work *channelWork, video Video, pos, total int, cookies string, onlyWithTranscript bool, skipCache SkipCache, cacheMu *sync.Mutex, retryInterval time.Duration, now *time.Time, skipCachePath *string) bool {
	tag := "[" + channelSlug(work.channel) + "]"

	work.mu.Lock()
	existingItem, hasExisting := work.items[video.VideoID]
	work.mu.Unlock()

	if hasExisting && len(existingItem.Transcripts) > 0 {
		// The transcript itself is expensive to re-fetch and doesn't change
		// once downloaded, but cheap listing metadata (title above all --
		// YouTube's flat-playlist listing used to hand back an
		// auto-translated English title instead of the uploader's real one)
		// can still be stale from an earlier run. Refresh it without
		// touching the transcript.
		if existingItem.Title != video.Title || existingItem.Duration != video.Duration || existingItem.ThumbnailURL != video.ThumbnailURL {
			existingItem.Title = video.Title
			existingItem.Description = fmt.Sprintf("Kajian oleh %s: %s", work.channel.Name, video.Title)
			existingItem.Duration = video.Duration
			existingItem.ThumbnailURL = video.ThumbnailURL
			work.mu.Lock()
			work.items[video.VideoID] = existingItem
			_ = writeItems(work.path, mapValues(work.items))
			work.mu.Unlock()
			fmt.Printf("%s        [%d/%d] ↻ %s... (metadata diperbarui)\n", tag, pos, total, trim(video.Title, 45))
		} else {
			fmt.Printf("%s        [%d/%d] ↷ %s... (Sudah ada - skip)\n", tag, pos, total, trim(video.Title, 45))
		}
		return false
	}

	cacheMu.Lock()
	shouldSkip := onlyWithTranscript && shouldDefer(skipCache, video.VideoID, *now)
	var deferEntry SkipEntry
	if shouldSkip {
		deferEntry = skipCache.Entries[video.VideoID]
	}
	cacheMu.Unlock()
	if shouldSkip {
		fmt.Printf("%s        [%d/%d] ↷ %s... (Tanpa transkrip, retry %s)\n", tag, pos, total, trim(video.Title, 45), deferEntry.RetryAfter.Format("2006-01-02"))
		return false
	}

	snippets, confirmedAbsent := fetchTranscript(video.VideoID, cookies)
	chunks := chunkTranscript(snippets, 60)
	if onlyWithTranscript && len(chunks) == 0 {
		if !confirmedAbsent {
			// yt-dlp itself failed (network drop, timeout, an intercepting
			// proxy, a rate limit) rather than cleanly reporting "no
			// captions" -- this is not evidence the video lacks a
			// transcript, so don't park it in the skip-cache. Leaving it
			// un-cached means the very next run retries it.
			fmt.Printf("%s        [%d/%d] ⚠ %s... (Gagal mengambil, bukan dipastikan tanpa transkrip - dicoba lagi run berikutnya)\n", tag, pos, total, trim(video.Title, 45))
			time.Sleep(time.Second)
			return false
		}
		retryAfter := now.Add(retryInterval)
		cacheMu.Lock()
		skipCache.Entries[video.VideoID] = SkipEntry{AttemptedAt: *now, RetryAfter: retryAfter, Reason: "no_transcript", Channel: work.channel.ChannelURL}
		_ = saveSkipCache(*skipCachePath, skipCache)
		cacheMu.Unlock()
		fmt.Printf("%s        [%d/%d] ✗ %s... (Tanpa transkrip - retry %s)\n", tag, pos, total, trim(video.Title, 45), retryAfter.Format("2006-01-02"))
		time.Sleep(time.Second)
		return false
	}
	cacheMu.Lock()
	delete(skipCache.Entries, video.VideoID)
	cacheMu.Unlock()

	item := KajianItem{
		Title:        video.Title,
		Speaker:      work.channel.Name,
		Topic:        strings.Join(work.channel.Focus, ", "),
		Type:         "video",
		URL:          video.URL,
		VideoID:      video.VideoID,
		Description:  fmt.Sprintf("Kajian oleh %s: %s", work.channel.Name, video.Title),
		Duration:     video.Duration,
		ThumbnailURL: video.ThumbnailURL,
		PublishedAt:  "2024-01-01",
		Transcripts:  chunks,
	}
	work.mu.Lock()
	work.items[video.VideoID] = item
	_ = writeItems(work.path, mapValues(work.items))
	work.mu.Unlock()
	fmt.Printf("%s        [%d/%d] ✓ %s... (%d chunks transkrip)\n", tag, pos, total, trim(video.Title, 45), len(chunks))
	time.Sleep(1500 * time.Millisecond)
	return true
}
