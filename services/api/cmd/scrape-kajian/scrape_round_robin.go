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

// scrapeAllRoundRobin interleaves every channel's videos one at a time --
// channel 1's video 1, channel 2's video 1, ..., channel 1's video 2, ... --
// instead of draining one channel's entire backlog before starting the
// next. A prolific channel (Khalid Basalamah, ~4900 videos) would
// otherwise starve every other channel of progress for hours; round-robin
// means a run interrupted partway (network drop, laptop closed) still
// leaves every channel with some coverage instead of a few finished and
// the rest untouched.
//
// Listing and fetching run concurrently rather than as two sequential
// phases: a single prolific channel's listing (Yufid, 20k+ videos) can
// take 10+ minutes to paginate through, which would otherwise leave every
// other, already-listed channel sitting idle for that whole stretch
// before any fetching starts at all. The dispatcher below advances
// whichever channels have reported their video list so far by one video
// each pass, folding newly-listed channels into the rotation as they
// arrive instead of waiting for the slowest one.
func scrapeAllRoundRobin(targets []Channel, maxVideos int, cookies string, onlyWithTranscript bool, outDir string, skipCache SkipCache, retryInterval time.Duration, now *time.Time, skipCachePath *string, concurrency int, listingCache ListingCache, listingCachePath string, listingCacheTTL time.Duration) (totalNew, totalAll int) {
	workers := concurrency
	if workers < 1 {
		workers = 1
	}

	type channelData struct {
		work   *channelWork
		videos []Video
	}

	var readyMu sync.Mutex
	ready := make([]channelData, 0, len(targets))
	remaining := len(targets)
	var listingCacheMu sync.Mutex

	listSem := make(chan struct{}, workers)
	var listWg sync.WaitGroup
	for _, target := range targets {
		target := target
		path := filepath.Join(outDir, channelSlug(target)+".json")
		_, existing := loadExisting(path)
		work := &channelWork{channel: target, path: path, items: existing}

		listWg.Add(1)
		listSem <- struct{}{}
		go func() {
			defer listWg.Done()
			defer func() { <-listSem }()
			tag := "[" + channelSlug(target) + "]"

			slug := channelSlug(target)
			listingCacheMu.Lock()
			cached, hasCached := listingCache.Entries[slug]
			listingCacheMu.Unlock()

			var videos []Video
			if hasCached && listingCacheTTL > 0 && time.Since(cached.ListedAt) < listingCacheTTL {
				videos = cached.Videos
				fmt.Printf("\n%s [CACHE] %s -- %d video (listed %s ago, reused instead of re-listing)\n", tag, target.Name, len(videos), time.Since(cached.ListedAt).Round(time.Minute))
			} else {
				fmt.Printf("\n%s [SCAN] %s (%s)...\n", tag, target.Name, target.ChannelURL)
				videos = getChannelVideos(target.ChannelURL, maxVideos, cookies)
				fmt.Printf("%s        Ditemukan %d video.\n", tag, len(videos))

				listingCacheMu.Lock()
				listingCache.Entries[slug] = ListingCacheEntry{ListedAt: time.Now().UTC(), Videos: videos}
				_ = saveListingCache(listingCachePath, listingCache)
				listingCacheMu.Unlock()
			}

			readyMu.Lock()
			ready = append(ready, channelData{work: work, videos: videos})
			remaining--
			readyMu.Unlock()
		}()
	}

	type job struct {
		work  *channelWork
		video Video
		pos   int
		total int
	}
	var cacheMu sync.Mutex
	var totalsMu sync.Mutex
	jobCh := make(chan job, 256)
	var fetchWg sync.WaitGroup
	for w := 0; w < workers; w++ {
		fetchWg.Add(1)
		go func() {
			defer fetchWg.Done()
			for j := range jobCh {
				if processVideo(j.work, j.video, j.pos, j.total, cookies, onlyWithTranscript, skipCache, &cacheMu, retryInterval, now, skipCachePath) {
					totalsMu.Lock()
					totalNew++
					totalsMu.Unlock()
				}
			}
		}()
	}

	go func() {
		nextRound := map[int]int{}
		for {
			readyMu.Lock()
			snapshot := append([]channelData{}, ready...)
			doneListing := remaining == 0
			readyMu.Unlock()

			dispatchedAny := false
			for i, cd := range snapshot {
				round := nextRound[i]
				if round < len(cd.videos) {
					jobCh <- job{work: cd.work, video: cd.videos[round], pos: round + 1, total: len(cd.videos)}
					nextRound[i] = round + 1
					dispatchedAny = true
				}
			}
			if !dispatchedAny {
				if doneListing {
					break
				}
				time.Sleep(500 * time.Millisecond)
			}
		}
		close(jobCh)
	}()

	listWg.Wait()
	fetchWg.Wait()

	readyMu.Lock()
	for _, cd := range ready {
		totalAll += len(cd.work.items)
	}
	readyMu.Unlock()
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

	snippets, confirmedAbsent, publishedAt, duration := fetchTranscript(video.VideoID, cookies)
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

	if publishedAt == "" {
		publishedAt = "2024-01-01"
	}
	// duration comes from the full single-video extraction fetchTranscript
	// just did for captions, not the listing's video.Duration -- the
	// --flat-playlist channel listing sometimes hands back a bogus, much
	// smaller duration for the same video (observed e.g. 6s instead of the
	// real 385s), which this replaces whenever it managed to get a real one.
	if duration == 0 {
		duration = video.Duration
	}
	item := KajianItem{
		Title:        video.Title,
		Speaker:      work.channel.Name,
		Topic:        strings.Join(work.channel.Focus, ", "),
		Type:         "video",
		URL:          video.URL,
		VideoID:      video.VideoID,
		Description:  fmt.Sprintf("Kajian oleh %s: %s", work.channel.Name, video.Title),
		Duration:     duration,
		ThumbnailURL: video.ThumbnailURL,
		PublishedAt:  publishedAt,
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
