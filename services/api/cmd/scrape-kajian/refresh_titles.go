package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"path/filepath"
	"sync"
	"sync/atomic"
	"time"
)

// refreshTitlesOnly is the fast path for applying a title fix to videos
// that are already scraped: instead of re-listing whole channels via
// yt-dlp (which has to paginate through YouTube's continuation tokens for
// the entire channel history -- tens of minutes for a prolific channel),
// it looks up each already-known video id directly against YouTube's
// oEmbed endpoint, a plain HTTP GET with no yt-dlp subprocess involved.
// It only updates title/description on existing rows; it never discovers
// new videos or touches transcripts, so it is not a substitute for a real
// scrape -- just a cheap way to backfill a title correction.
func refreshTitlesOnly(targets []Channel, outDir string, workers int) {
	if workers < 1 {
		workers = 1
	}

	type channelState struct {
		path  string
		items map[string]KajianItem
		mu    sync.Mutex
	}

	var channels []*channelState
	for _, target := range targets {
		path := filepath.Join(outDir, channelSlug(target)+".json")
		_, existing := loadExisting(path)
		if len(existing) == 0 {
			continue
		}
		channels = append(channels, &channelState{path: path, items: existing})
	}

	type job struct {
		ch      *channelState
		videoID string
	}

	// Snapshot every (channel, videoID) pair up front, before any worker
	// starts writing back into ch.items -- iterating a map while another
	// goroutine mutates it is a data race even on unrelated keys.
	var allJobs []job
	for _, ch := range channels {
		for videoID := range ch.items {
			allJobs = append(allJobs, job{ch: ch, videoID: videoID})
		}
	}

	jobs := make(chan job, 256)
	var checked, updated, failed int64

	var wg sync.WaitGroup
	for w := 0; w < workers; w++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for j := range jobs {
				title, ok := fetchOEmbedTitle(j.videoID)
				atomic.AddInt64(&checked, 1)
				if !ok {
					atomic.AddInt64(&failed, 1)
					time.Sleep(150 * time.Millisecond)
					continue
				}

				j.ch.mu.Lock()
				it := j.ch.items[j.videoID]
				if it.Title != title {
					it.Title = title
					it.Description = fmt.Sprintf("Kajian oleh %s: %s", it.Speaker, title)
					j.ch.items[j.videoID] = it
					atomic.AddInt64(&updated, 1)
				}
				j.ch.mu.Unlock()

				time.Sleep(150 * time.Millisecond)
			}
		}()
	}

	for _, j := range allJobs {
		jobs <- j
	}
	close(jobs)
	wg.Wait()

	for _, ch := range channels {
		if err := writeItems(ch.path, mapValues(ch.items)); err != nil {
			fmt.Printf("[refresh-titles] gagal menulis %s: %v\n", ch.path, err)
		}
	}

	fmt.Printf("\n[DONE] refresh-titles: %d video dicek, %d title diperbarui, %d lookup gagal (%d channel)\n", checked, updated, failed, len(channels))
}

var oEmbedClient = &http.Client{Timeout: 10 * time.Second}

// fetchOEmbedTitle retries on failure -- this hits youtube.com same as the
// yt-dlp calls elsewhere in this tool, so it is just as exposed to this
// machine's network hopping onto one that blocks YouTube (BBG) for a few
// seconds to a few minutes at a time. A single blip during one lookup
// shouldn't cost that video's title fix for the whole run.
func fetchOEmbedTitle(videoID string) (string, bool) {
	url := "https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=" + videoID + "&format=json"
	backoff := 10 * time.Second
	var resp *http.Response
	var err error
	for attempt := 0; ; attempt++ {
		resp, err = oEmbedClient.Get(url)
		if err == nil || attempt >= 3 {
			break
		}
		time.Sleep(backoff)
		backoff *= 2
	}
	if err != nil {
		return "", false
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return "", false
	}
	var payload struct {
		Title string `json:"title"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil || payload.Title == "" {
		return "", false
	}
	return payload.Title, true
}
