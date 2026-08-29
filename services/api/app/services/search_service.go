package service

import (
	"strconv"

	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
	"golang.org/x/sync/errgroup"
)

type SearchResult struct {
	Ayahs           []model.Ayah        `json:"ayahs"`
	AyahTotal       int64               `json:"ayah_total"`
	Hadiths         []model.Hadith      `json:"hadiths"`
	HadithTotal     int64               `json:"hadith_total"`
	Dictionaries    []model.IslamicTerm `json:"dictionaries"`
	DictionaryTotal int64               `json:"dictionary_total"`
	Doas            []model.Doa         `json:"doas"`
	DoaTotal        int64               `json:"doa_total"`
	Kajians         []model.Kajian      `json:"kajians"`
	KajianTotal     int64               `json:"kajian_total"`
	Perawis         []model.Perawi      `json:"perawis"`
	PerawiTotal     int64               `json:"perawi_total"`
	Total           int                 `json:"total"`
}

type SearchService interface {
	Search(query, searchType string, bookID *int, limit, page int) (*SearchResult, error)
}

type searchService struct {
	repo  repository.SearchRepository
	cache *lib.CacheService
}

func NewSearchService(repo repository.SearchRepository) SearchService {
	return &searchService{repo: repo}
}

func NewSearchServiceWithCache(repo repository.SearchRepository, cache *lib.CacheService) SearchService {
	return &searchService{repo: repo, cache: cache}
}

func searchCacheKey(query, searchType string, bookID *int, limit, page int) string {
	bookPart := ""
	if bookID != nil {
		bookPart = ":b" + strconv.Itoa(*bookID)
	}
	return "search:" + searchType + bookPart + ":q=" + query + ":l=" + strconv.Itoa(limit) + ":p=" + strconv.Itoa(page)
}

func (s *searchService) Search(query, searchType string, bookID *int, limit, page int) (*SearchResult, error) {
	if limit <= 0 || limit > 100 {
		limit = 20
	}

	if s.cache != nil {
		key := searchCacheKey(query, searchType, bookID, limit, page)
		var cached SearchResult
		if err := s.cache.Remember(key, &cached, func() (interface{}, error) {
			return s.searchFromRepo(query, searchType, bookID, limit, page)
		}); err == nil {
			return &cached, nil
		}
	}

	return s.searchFromRepo(query, searchType, bookID, limit, page)
}

func (s *searchService) searchFromRepo(query, searchType string, bookID *int, limit, page int) (*SearchResult, error) {
	if limit <= 0 || limit > 100 {
		limit = 20
	}
	offset := page * limit

	result := &SearchResult{
		Ayahs:        []model.Ayah{},
		Hadiths:      []model.Hadith{},
		Dictionaries: []model.IslamicTerm{},
		Doas:         []model.Doa{},
		Kajians:      []model.Kajian{},
		Perawis:      []model.Perawi{},
	}

	switch searchType {
	case "ayah":
		ayahs, total, err := s.repo.SearchAyah(query, limit, offset)
		if err != nil {
			return nil, err
		}
		result.Ayahs = ayahs
		result.AyahTotal = total
	case "hadith":
		hadiths, total, err := s.repo.SearchHadith(query, bookID, limit, offset)
		if err != nil {
			return nil, err
		}
		result.Hadiths = hadiths
		result.HadithTotal = total
	case "dictionary", "kamus":
		terms, total, err := s.repo.SearchDictionary(query, limit, offset)
		if err != nil {
			return nil, err
		}
		result.Dictionaries = terms
		result.DictionaryTotal = total
	case "doa", "dua", "prayer":
		doas, total, err := s.repo.SearchDoa(query, limit, offset)
		if err != nil {
			return nil, err
		}
		result.Doas = doas
		result.DoaTotal = total
	case "kajian", "study", "lesson":
		kajians, total, err := s.repo.SearchKajian(query, limit, offset)
		if err != nil {
			return nil, err
		}
		result.Kajians = kajians
		result.KajianTotal = total
	case "perawi", "rawi", "rijal":
		perawis, total, err := s.repo.SearchPerawi(query, limit, offset)
		if err != nil {
			return nil, err
		}
		result.Perawis = perawis
		result.PerawiTotal = total
	default:
		each := limit / 6
		if each < 2 {
			each = 2
		}
		g := new(errgroup.Group)
		var ayahs []model.Ayah
		var ayahTotal int64
		g.Go(func() (err error) {
			ayahs, ayahTotal, err = s.repo.SearchAyah(query, each, 0)
			return
		})
		var hadiths []model.Hadith
		var hadithTotal int64
		g.Go(func() (err error) {
			hadiths, hadithTotal, err = s.repo.SearchHadith(query, bookID, each, 0)
			return
		})
		var terms []model.IslamicTerm
		var dictTotal int64
		g.Go(func() (err error) {
			terms, dictTotal, err = s.repo.SearchDictionary(query, each, 0)
			return
		})
		var doas []model.Doa
		var doaTotal int64
		g.Go(func() (err error) {
			doas, doaTotal, err = s.repo.SearchDoa(query, each, 0)
			return
		})
		var kajians []model.Kajian
		var kajianTotal int64
		g.Go(func() (err error) {
			kajians, kajianTotal, err = s.repo.SearchKajian(query, each, 0)
			return
		})
		var perawis []model.Perawi
		var perawiTotal int64
		g.Go(func() (err error) {
			perawis, perawiTotal, err = s.repo.SearchPerawi(query, each, 0)
			return
		})
		if err := g.Wait(); err != nil {
			return nil, err
		}
		result.Ayahs = ayahs
		result.AyahTotal = ayahTotal
		result.Hadiths = hadiths
		result.HadithTotal = hadithTotal
		result.Dictionaries = terms
		result.DictionaryTotal = dictTotal
		result.Doas = doas
		result.DoaTotal = doaTotal
		result.Kajians = kajians
		result.KajianTotal = kajianTotal
		result.Perawis = perawis
		result.PerawiTotal = perawiTotal
	}

	result.Total = int(result.AyahTotal + result.HadithTotal + result.DictionaryTotal + result.DoaTotal + result.KajianTotal + result.PerawiTotal)
	return result, nil
}
