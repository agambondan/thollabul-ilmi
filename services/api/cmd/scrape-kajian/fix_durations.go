package main

import (
	"fmt"
	"path/filepath"
	"sync"
	"sync/atomic"
	"time"
)

// fixDurationsOnly scans every channel file for a video whose recorded
// duration is shorter than its own transcript's last chunk end -- proof
// the duration is wrong, since a video can't have a transcript timestamp
// past its own end. This happens because the --flat-playlist channel
// listing getChannelVideos uses to discover videos sometimes hands back a
// bogus, much-smaller duration estimate than the real one (observed e.g.
// 6s instead of the real 385s for the same video) -- a yt-dlp quirk, not
// something wrong with the chunking. Confirmed by comparing a full
// single-video extraction (fetchVideoDuration below) against the
// channel-listing value for several affected videos: the full extraction
// always matched the video's real, playable length.
//
// Fetches only metadata (--skip-download --dump-json, no subtitle
// request), so it is much cheaper per video than a real transcript fetch
// -- transcripts are untouched, only the duration field is corrected.
func fixDurationsOnly(targets []Channel, outDir string, workers int) {
	if workers < 1 {
		workers = 1
	}

	type channelState struct {
		path  string
		items map[string]KajianItem
		mu    sync.Mutex
	}

	type job struct {
		ch      *channelState
		videoID string
	}

	var jobs []job
	var channels []*channelState
	for _, target := range targets {
		path := filepath.Join(outDir, channelSlug(target)+".json")
		_, existing := loadExisting(path)
		if len(existing) == 0 {
			continue
		}
		ch := &channelState{path: path, items: existing}
		channels = append(channels, ch)

		for videoID, item := range existing {
			maxEnd := 0
			for _, t := range item.Transcripts {
				if t.EndSeconds > maxEnd {
					maxEnd = t.EndSeconds
				}
			}
			if maxEnd > 0 && item.Duration < maxEnd {
				jobs = append(jobs, job{ch: ch, videoID: videoID})
			}
		}
	}

	fmt.Printf("[fix-durations] %d video dengan duration mencurigakan (lebih pendek dari transkripnya sendiri)\n", len(jobs))
	if len(jobs) == 0 {
		return
	}

	jobCh := make(chan job, 256)
	var checked, fixed, failed int64

	var wg sync.WaitGroup
	for w := 0; w < workers; w++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for j := range jobCh {
				duration, ok := fetchVideoDuration(j.videoID)
				atomic.AddInt64(&checked, 1)
				if !ok {
					atomic.AddInt64(&failed, 1)
					time.Sleep(500 * time.Millisecond)
					continue
				}

				j.ch.mu.Lock()
				it := j.ch.items[j.videoID]
				if it.Duration != duration {
					it.Duration = duration
					j.ch.items[j.videoID] = it
					atomic.AddInt64(&fixed, 1)
				}
				j.ch.mu.Unlock()

				time.Sleep(500 * time.Millisecond)
			}
		}()
	}
	for _, j := range jobs {
		jobCh <- j
	}
	close(jobCh)
	wg.Wait()

	for _, ch := range channels {
		if err := writeItems(ch.path, mapValues(ch.items)); err != nil {
			fmt.Printf("[fix-durations] gagal menulis %s: %v\n", ch.path, err)
		}
	}

	fmt.Printf("\n[DONE] fix-durations: %d dicek, %d diperbaiki, %d gagal\n", checked, fixed, failed)
}

func fetchVideoDuration(videoID string) (int, bool) {
	stdout, err := runCmdWithRetry(30*time.Second, 3, 10*time.Second, "yt-dlp", "--skip-download", "--dump-json", "--no-warnings", "https://www.youtube.com/watch?v="+videoID)
	if err != nil {
		return 0, false
	}
	_, duration := parseVideoMeta(stdout)
	if duration <= 0 {
		return 0, false
	}
	return duration, true
}
