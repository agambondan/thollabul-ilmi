SHELL := /bin/bash
.SHELLFLAGS := -eu -o pipefail -c
.DEFAULT_GOAL := help

MOBILE_DIR := apps/mobile
ANDROID_DIR := $(MOBILE_DIR)/android
ANDROID_SDK ?= $(HOME)/.local/share/android-sdk
ADB ?= adb
GRADLE := ./gradlew
DETECTED_JAVA17_HOME := $(shell for java in $(HOME)/.gradle/jdks/*/bin/java /usr/lib/jvm/java-17*/bin/java /opt/android-studio/jbr/bin/java; do if [ -x "$$java" ] && "$$java" -version 2>&1 | grep -q 'version "17'; then dirname "$$(dirname "$$java")"; break; fi; done)
BUILD_JAVA_HOME ?= $(DETECTED_JAVA17_HOME)

EXPO_PORT ?= 19007
API_PORT ?= 9900
DOCKER_API_PORT ?= 29900
MOBILE_PORTS ?= 8081 19000 19001 19002 19006 19007
RN_ARCHS ?= arm64-v8a
INOTIFY_MIN_WATCHES ?= 524288
INOTIFY_MIN_INSTANCES ?= 1024
LAN_IP ?= $(shell ip route get 8.8.8.8 2>/dev/null | awk '{for (i=1; i<=NF; i++) if ($$i == "src") {print $$(i+1); exit}}')
API_URL ?= http://localhost:$(API_PORT)
EXPO_URL ?= exp://127.0.0.1:$(EXPO_PORT)

ANDROID_ENV := JAVA_HOME=$(BUILD_JAVA_HOME) ANDROID_HOME=$(ANDROID_SDK) PATH="$(BUILD_JAVA_HOME)/bin:$(ANDROID_SDK)/platform-tools:$(ANDROID_SDK)/emulator:$(PATH)"
DEBUG_APK := $(ANDROID_DIR)/app/build/outputs/apk/debug/app-debug.apk
RELEASE_APK := $(ANDROID_DIR)/app/build/outputs/apk/release/app-release.apk

# DB vars untuk docker-compose (override di command line jika perlu)
DB_DOCKER_HOST ?= localhost
DB_DOCKER_PORT ?= 54320
DB_DOCKER_USER ?= postgres
DB_DOCKER_PASS ?= postgres
DB_DOCKER_NAME ?= thullabul_ilmi
DB_DOCKER_ENV  := DB_HOST=$(DB_DOCKER_HOST) DB_PORT=$(DB_DOCKER_PORT) DB_USER=$(DB_DOCKER_USER) DB_PASS=$(DB_DOCKER_PASS) DB_NAME=$(DB_DOCKER_NAME)

MINIO_ENDPOINT ?= localhost:9020
MINIO_ACCESS   ?= minioadmin
MINIO_SECRET   ?= minioadmin
MINIO_BUCKET   ?= thollabul-ilmi-audio

.PHONY: help \
	run-local run-dev seed-quran seed-quran-dev seed-quran-docker seed-tafsir seed-tafsir-dev seed-tafsir-docker seed-tajweed seed-tajweed-dev seed-tajweed-docker \
	db-setup db-setup-local db-setup-docker db-dump-static \
	db-seed-audio db-seed-audio-docker db-seed-audio-minio db-seed-audio-minio-docker \
	build-api build-web build web-dev docker-up docker-down cp-server cp-cert buildcp \
	mobile-tools-check mobile-watchers-check mobile-watchers-fix mobile-build-check android-build-check mobile-check mobile-status mobile-clean-ports mobile-reverse mobile-reverse-clear mobile-dev mobile-dev-all mobile-open mobile-android mobile-start mobile-ios mobile-web mobile-export-android \
	apk-debug apk-release apk-install-debug apk-install-release apk-clean

help:
	@printf '%s\n' \
		'Thollabul Ilmi make targets' \
		'' \
		'Database setup (migrate + seed):' \
		'  make db-setup             Migrate + seed semua data (baca .env.local)' \
		'  make db-setup-docker      Migrate + seed via docker-compose DB (port 54320)' \
		'  make db-dump-static       Dump static DB content ke data/static/*.json (backup seeder)' \
		'  make db-seed-audio        Inject CDN audio URL ke DB (lokal, baca .env.local)' \
		'  make db-seed-audio-docker Inject CDN audio URL ke DB (docker, port 54320)' \
		'  make db-seed-audio-minio  Download audio dari CDN + upload ke MinIO + insert DB' \
		'' \
		'Development:' \
		'  make run-dev              Run API service in development mode' \
		'  make mobile-dev-all       Run API if needed, run Expo, then open it on the connected device' \
		'  make mobile-dev-docker    Run mobile dev against docker API port' \
		'  make mobile-watchers-fix  Raise Linux file watcher limits for Metro/Expo' \
		'  make web-dev              Run web app' \
		'  make mobile-dev           Clean old Expo/Metro ports, setup adb reverse, run Expo on one fixed port' \
		'  make mobile-open          Open the current Expo URL on the connected Android device' \
		'  make mobile-status        Show API/Expo ports, adb devices, and adb reverse state' \
		'' \
		'Android builds:' \
		'  make apk-debug            Build native Android debug APK' \
		'  make apk-release          Build native Android release APK with current Gradle signing config' \
		'  make apk-install-debug    Build and install debug APK to connected device' \
		'  make apk-install-release  Build and install release APK to connected device' \
		'  make apk-clean            Clean Android Gradle outputs' \
		'' \
		'Config:' \
		'  DB_DOCKER_HOST=$(DB_DOCKER_HOST) DB_DOCKER_PORT=$(DB_DOCKER_PORT)' \
		'  MINIO_ENDPOINT=$(MINIO_ENDPOINT) MINIO_BUCKET=$(MINIO_BUCKET)' \
		'  EXPO_PORT=$(EXPO_PORT) API_PORT=$(API_PORT) DOCKER_API_PORT=$(DOCKER_API_PORT) LAN_IP=$(LAN_IP)' \
		'  INOTIFY_MIN_WATCHES=$(INOTIFY_MIN_WATCHES) INOTIFY_MIN_INSTANCES=$(INOTIFY_MIN_INSTANCES)' \
		'  RN_ARCHS=$(RN_ARCHS) (override with RN_ARCHS=armeabi-v7a,arm64-v8a,x86,x86_64 for universal APK)' \
		'  BUILD_JAVA_HOME=$(BUILD_JAVA_HOME)' \
		'  API_URL=$(API_URL)' \
		'  EXPO_URL=$(EXPO_URL)'

run-local:
	cd services/api && go run main.go

run-dev:
	cd services/api && go run main.go

# ── DB setup ─────────────────────────────────────────────────────────────────

## Jalankan AutoMigrate + semua Seeder lalu exit (baca .env.local)
db-setup:
	cd services/api && go run scripts/db_setup.go

## Sama tapi pakai environment "development" (.env.development)
db-setup-local:
	cd services/api && go run scripts/db_setup.go -environment development

## Jalankan AutoMigrate + semua Seeder via docker-compose DB (port 54320)
db-setup-docker:
	cd services/api && $(DB_DOCKER_ENV) go run scripts/db_setup.go -environment docker

## Dump isi DB ke data/static/*.json (perbarui file seed setelah edit data via admin)
db-dump-static:
	cd services/api && go run scripts/dump_static_data.go

## Inject CDN audio URL ke surah_audio dan ayah_audio (lokal, baca .env.local)
db-seed-audio:
	cd services/api && go run scripts/seed_audio.go -mode=all

## Sama via docker-compose DB
db-seed-audio-docker:
	cd services/api && $(DB_DOCKER_ENV) go run scripts/seed_audio.go -mode=all

## Download audio dari CDN, upload ke MinIO, lalu insert URL MinIO ke DB
db-seed-audio-minio:
	cd services/api && MINIO_ENDPOINT=$(MINIO_ENDPOINT) MINIO_ACCESS=$(MINIO_ACCESS) MINIO_SECRET=$(MINIO_SECRET) MINIO_BUCKET=$(MINIO_BUCKET) \
		go run scripts/seed_audio.go -mode=all -minio

## Sama via docker-compose DB + MinIO
db-seed-audio-minio-docker:
	cd services/api && $(DB_DOCKER_ENV) MINIO_ENDPOINT=$(MINIO_ENDPOINT) MINIO_ACCESS=$(MINIO_ACCESS) MINIO_SECRET=$(MINIO_SECRET) MINIO_BUCKET=$(MINIO_BUCKET) \
		go run scripts/seed_audio.go -mode=all -minio

seed-quran:
	cd services/api && go run ./scripts/seed_quran/main.go

seed-quran-dev:
	cd services/api && go run ./scripts/seed_quran/main.go -environment development

seed-quran-docker:
	cd services/api && DB_PORT=54320 go run ./scripts/seed_quran/main.go

seed-tafsir:
	cd services/api && go run ./cmd/seed_tafsir/main.go

seed-tafsir-dev:
	cd services/api && go run ./cmd/seed_tafsir/main.go -environment development

seed-tafsir-docker:
	cd services/api && DB_HOST=localhost DB_PORT=54320 DB_USER=postgres DB_PASS=postgres DB_NAME=thullabul_ilmi go run ./cmd/seed_tafsir/main.go -environment container

seed-tajweed:
	cd services/api && go run ./cmd/seed_tajweed/main.go --env .env

seed-tajweed-dev:
	cd services/api && go run ./cmd/seed_tajweed/main.go --env .env.local

seed-tajweed-docker:
	cd services/api && DB_HOST=localhost DB_PORT=54320 DB_USER=postgres DB_PASS=postgres DB_NAME=thullabul_ilmi go run ./cmd/seed_tajweed/main.go --env .env.local

build-api:
	cd services/api && go build main.go -o weddinggo

swagger:
	cd services/api && swag init -g app/http/routes.go --parseDependency --parseInternal -o docs/

build-web:
	cd apps/web && npm run build

build: build-api build-web

web-dev:
	cd apps/web && npm run dev

docker-up:
	docker compose up -d --build

docker-down:
	docker compose down

cp-server:
	scp -o IdentitiesOnly=yes services/api/weddinggo agam@103.193.176.34:~/project/wedding-api

cp-cert:
	scp -o IdentitiesOnly=yes services/api/cert/* agam@103.193.176.34:~/project/cert

buildcp:
	cd services/api && go build -o weddinggo main.go
	scp -o IdentitiesOnly=yes services/api/weddinggo agam@103.193.176.34:~/project/wedding-api

mobile-tools-check:
	@command -v node >/dev/null || { echo 'node tidak ditemukan.'; exit 1; }
	@command -v npm >/dev/null || { echo 'npm tidak ditemukan.'; exit 1; }
	@command -v npx >/dev/null || { echo 'npx tidak ditemukan.'; exit 1; }
	@test -n "$(EXPO_URL)" || { echo 'EXPO_URL kosong. Set manual: make mobile-dev EXPO_URL=exp://127.0.0.1:$(EXPO_PORT)'; exit 1; }
	@echo 'OK: Node, npm, Expo CLI, dan Expo URL siap.'

mobile-watchers-check:
	@watches=$$(cat /proc/sys/fs/inotify/max_user_watches 2>/dev/null || echo 0); \
	instances=$$(cat /proc/sys/fs/inotify/max_user_instances 2>/dev/null || echo 0); \
	if [ "$$watches" -lt "$(INOTIFY_MIN_WATCHES)" ] || [ "$$instances" -lt "$(INOTIFY_MIN_INSTANCES)" ]; then \
		echo "Limit file watcher Linux terlalu rendah untuk Metro/Expo."; \
		echo "Current: max_user_watches=$$watches max_user_instances=$$instances"; \
		echo "Needed : max_user_watches>=$(INOTIFY_MIN_WATCHES) max_user_instances>=$(INOTIFY_MIN_INSTANCES)"; \
		echo "Jalankan sekali: make mobile-watchers-fix"; \
		exit 1; \
	fi; \
	echo "OK: inotify watcher limit siap ($$watches watches, $$instances instances)."

mobile-watchers-fix:
	@echo 'Menaikkan inotify limit untuk Metro/Expo. Sudo mungkin meminta password.'
	@sudo sysctl -w fs.inotify.max_user_watches=$(INOTIFY_MIN_WATCHES)
	@sudo sysctl -w fs.inotify.max_user_instances=$(INOTIFY_MIN_INSTANCES)
	@printf '%s\n' \
		'fs.inotify.max_user_watches=$(INOTIFY_MIN_WATCHES)' \
		'fs.inotify.max_user_instances=$(INOTIFY_MIN_INSTANCES)' | sudo tee /etc/sysctl.d/99-thollabul-mobile.conf >/dev/null
	@echo 'OK: inotify limit disimpan permanen di /etc/sysctl.d/99-thollabul-mobile.conf'

mobile-build-check: android-build-check

android-build-check: mobile-tools-check
	@test -x "$(ANDROID_DIR)/gradlew" || { echo 'Gradle wrapper tidak ditemukan di $(ANDROID_DIR)/gradlew.'; exit 1; }
	@test -n "$(BUILD_JAVA_HOME)" || { echo 'JDK 17 tidak ditemukan. Install openjdk-17-jdk atau set BUILD_JAVA_HOME=/path/to/jdk17.'; exit 1; }
	@test -x "$(BUILD_JAVA_HOME)/bin/java" || { echo 'BUILD_JAVA_HOME tidak valid: $(BUILD_JAVA_HOME)'; exit 1; }
	@"$(BUILD_JAVA_HOME)/bin/java" -version 2>&1 | grep -q 'version "17' || { echo 'Build APK butuh Java 17. Current BUILD_JAVA_HOME=$(BUILD_JAVA_HOME)'; "$(BUILD_JAVA_HOME)/bin/java" -version; exit 1; }
	@echo 'OK: Gradle wrapper dan JDK 17 siap.'

mobile-check: mobile-tools-check
	@command -v $(ADB) >/dev/null || { echo 'adb tidak ditemukan. Install Android platform-tools dulu.'; exit 1; }
	@$(ADB) get-state >/dev/null 2>&1 || { echo 'Tidak ada Android device aktif. Cek USB debugging lalu jalankan adb devices.'; $(ADB) devices; exit 1; }
	@curl -fsS --max-time 3 "$(API_URL)/api/v1/surah?size=1" >/dev/null || { echo 'API tidak reachable: $(API_URL)'; echo 'Jalankan make run-dev atau docker compose dulu, atau set API_URL manual.'; exit 1; }
	@echo 'OK: device, Expo config, dan API siap.'

mobile-status:
	@echo 'Expo URL : $(EXPO_URL)'
	@echo 'API URL  : $(API_URL)'
	@echo ''
	@echo 'ADB devices:'
	@$(ADB) devices
	@echo ''
	@echo 'ADB reverse:'
	@$(ADB) reverse --list || true
	@echo ''
	@echo 'Listening ports:'
	@for port in $(API_PORT) $(MOBILE_PORTS); do \
		ss -ltnp 2>/dev/null | grep -E ":$$port\\b" || true; \
	done

mobile-clean-ports:
	@for port in $(MOBILE_PORTS); do \
		pids=$$(lsof -tiTCP:$$port -sTCP:LISTEN 2>/dev/null || true); \
		for pid in $$pids; do \
			cmd=$$(ps -p $$pid -o command= 2>/dev/null || true); \
			if [[ "$$cmd" == *"$(MOBILE_DIR)"* || "$$cmd" == *"expo start"* || "$$cmd" == *"@expo/cli"* || "$$cmd" == *"metro"* ]]; then \
				echo "Stopping mobile dev server on port $$port: PID $$pid"; \
				kill $$pid 2>/dev/null || true; \
			else \
				echo "Port $$port dipakai proses lain, tidak di-kill: $$cmd"; \
				exit 1; \
			fi; \
		done; \
	done

mobile-reverse: mobile-check
	@$(ADB) reverse --remove tcp:8081 >/dev/null 2>&1 || true
	@$(ADB) reverse --remove tcp:19000 >/dev/null 2>&1 || true
	@$(ADB) reverse --remove tcp:19001 >/dev/null 2>&1 || true
	@$(ADB) reverse --remove tcp:19002 >/dev/null 2>&1 || true
	@$(ADB) reverse --remove tcp:19006 >/dev/null 2>&1 || true
	@$(ADB) reverse --remove tcp:19007 >/dev/null 2>&1 || true
	@$(ADB) reverse --remove tcp:$(API_PORT) >/dev/null 2>&1 || true
	@$(ADB) reverse tcp:$(EXPO_PORT) tcp:$(EXPO_PORT) >/dev/null
	@$(ADB) reverse tcp:$(API_PORT) tcp:$(API_PORT) >/dev/null
	@echo 'ADB reverse aktif: tcp:$(EXPO_PORT) dan tcp:$(API_PORT)'

mobile-reverse-clear:
	@$(ADB) reverse --remove tcp:$(EXPO_PORT) >/dev/null 2>&1 || true
	@$(ADB) reverse --remove tcp:$(API_PORT) >/dev/null 2>&1 || true
	@echo 'ADB reverse dibersihkan untuk tcp:$(EXPO_PORT) dan tcp:$(API_PORT)'

mobile-dev: mobile-watchers-check mobile-clean-ports mobile-reverse
	cd $(MOBILE_DIR) && ANDROID_HOME=$(ANDROID_SDK) EXPO_PUBLIC_API_URL=$(API_URL) npx expo start --port $(EXPO_PORT) --host localhost --clear

mobile-dev-all: mobile-tools-check mobile-watchers-check
	@command -v $(ADB) >/dev/null || { echo 'adb tidak ditemukan. Install Android platform-tools dulu.'; exit 1; }
	@$(ADB) get-state >/dev/null 2>&1 || { echo 'Tidak ada Android device aktif. Cek USB debugging lalu jalankan adb devices.'; $(ADB) devices; exit 1; }
	@api_pid=""; api_started=0; expo_pid=""; \
	cleanup() { \
		if [ -n "$$expo_pid" ] && kill -0 "$$expo_pid" >/dev/null 2>&1; then kill "$$expo_pid" >/dev/null 2>&1 || true; fi; \
		if [ "$$api_started" = "1" ] && [ -n "$$api_pid" ] && kill -0 "$$api_pid" >/dev/null 2>&1; then kill "$$api_pid" >/dev/null 2>&1 || true; fi; \
	}; \
	trap cleanup INT TERM EXIT; \
	if curl -fsS --max-time 2 "$(API_URL)/api/v1/surah?size=1" >/dev/null; then \
		echo 'API sudah berjalan: $(API_URL)'; \
	else \
		echo 'Menjalankan API local: $(API_URL)'; \
		(cd services/api && go run main.go) & api_pid=$$!; api_started=1; \
		for _ in $$(seq 1 45); do \
			curl -fsS --max-time 2 "$(API_URL)/api/v1/surah?size=1" >/dev/null && break; \
			sleep 1; \
		done; \
		curl -fsS --max-time 2 "$(API_URL)/api/v1/surah?size=1" >/dev/null || { echo 'API gagal siap di $(API_URL).'; exit 1; }; \
	fi; \
	$(MAKE) --no-print-directory mobile-clean-ports; \
	$(MAKE) --no-print-directory mobile-reverse; \
	(cd $(MOBILE_DIR) && ANDROID_HOME=$(ANDROID_SDK) EXPO_PUBLIC_API_URL=$(API_URL) npx expo start --port $(EXPO_PORT) --host localhost --clear) & expo_pid=$$!; \
	for _ in $$(seq 1 30); do \
		ss -ltn 2>/dev/null | grep -q ":$(EXPO_PORT)\\b" && break; \
		sleep 1; \
	done; \
	if $(ADB) shell pm path host.exp.exponent >/dev/null 2>&1; then \
		$(ADB) shell am force-stop host.exp.exponent >/dev/null 2>&1 || true; \
		$(ADB) shell am start -a android.intent.action.VIEW -d "$(EXPO_URL)"; \
	else \
		echo 'Expo Go belum terinstall di device. Install Expo Go/dev client lalu buka $(EXPO_URL) atau scan QR Metro.'; \
	fi; \
	echo 'Mobile dev berjalan. Tekan Ctrl+C untuk stop Expo dan API yang dijalankan target ini.'; \
	wait "$$expo_pid"

mobile-dev-docker: API_PORT := $(DOCKER_API_PORT)
mobile-dev-docker: API_URL := http://localhost:$(DOCKER_API_PORT)
mobile-dev-docker: mobile-dev

mobile-open: mobile-reverse
	@if $(ADB) shell pm path host.exp.exponent >/dev/null 2>&1; then \
		$(ADB) shell am force-stop host.exp.exponent >/dev/null 2>&1 || true; \
		$(ADB) shell am start -a android.intent.action.VIEW -d "$(EXPO_URL)"; \
	else \
		echo 'Expo Go belum terinstall di device. Install Expo Go/dev client lalu buka $(EXPO_URL) atau scan QR Metro.'; \
	fi

mobile-start: mobile-dev

mobile-android: mobile-dev

mobile-ios:
	cd $(MOBILE_DIR) && npm run ios

mobile-web:
	cd $(MOBILE_DIR) && EXPO_PUBLIC_API_URL=$(API_URL) npm run web

mobile-export-android:
	cd $(MOBILE_DIR) && EXPO_PUBLIC_API_URL=$(API_URL) npx expo export --platform android --output-dir dist/android

apk-debug: android-build-check
	cd $(ANDROID_DIR) && $(ANDROID_ENV) NODE_ENV=development $(GRADLE) assembleDebug -PreactNativeArchitectures=$(RN_ARCHS)
	@echo 'Debug APK: $(DEBUG_APK)'

apk-release: android-build-check
	cd $(ANDROID_DIR) && $(ANDROID_ENV) NODE_ENV=production EXPO_PUBLIC_API_URL=$(API_URL) $(GRADLE) assembleRelease -PreactNativeArchitectures=$(RN_ARCHS)
	@echo 'Release APK: $(RELEASE_APK)'
	@echo 'Catatan: release mengikuti signingConfig Gradle saat ini.'

apk-install-debug: apk-debug
	$(ANDROID_ENV) $(ADB) install -r "$(DEBUG_APK)"

apk-install-release: apk-release
	$(ANDROID_ENV) $(ADB) install -r "$(RELEASE_APK)"

apk-clean:
	cd $(ANDROID_DIR) && $(ANDROID_ENV) $(GRADLE) clean
